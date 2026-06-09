require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { connectRedis, redisClient } = require('./config/redis');
const Shipment = require('./models/Shipment');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const manufacturerRoutes = require('./routes/manufacturerRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const stockHistoryRoutes = require('./routes/stockHistoryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const linkRoutes = require('./routes/linkRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

connectDB();
connectRedis();

const lastMongoUpdate = new Map();

const isInPakistan = (lat, lng) => {
  return lat >= 23.0 && lat <= 38.0 && lng >= 60.0 && lng <= 80.0;
};

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/manufacturers', manufacturerRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stock-history', stockHistoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/notifications', notificationRoutes);

const { setIo } = require('./utils/notification');

setIo(io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-entity', (entityId) => {
    socket.join(`entity:${entityId}`);
  });

  socket.on('join-role', (role) => {
    socket.join(`role:${role}`);
  });

  socket.on('join-shipment', (shipmentId) => {
    socket.join(`shipment:${shipmentId}`);
  });

  socket.on('leave-shipment', (shipmentId) => {
    socket.leave(`shipment:${shipmentId}`);
  });

  socket.on('rider-location', async (data) => {
    const { shipmentId, lat, lng } = data;
    if (!shipmentId || lat == null || lng == null) return;
    if (!isInPakistan(lat, lng)) {
      console.warn('Rejected location update outside Pakistan:', lat, lng);
      return;
    }

    try {
      await redisClient.set(`shipment:${shipmentId}:location`, JSON.stringify({ lat, lng, updatedAt: new Date() }));
      
      const now = Date.now();
      const lastUpdate = lastMongoUpdate.get(shipmentId) || 0;
      
      if (now - lastUpdate > 20000) {
        await Shipment.findOneAndUpdate(
          { id: shipmentId },
          { 
            riderLocation: { lat, lng, updatedAt: new Date() },
            $push: { path: { lat, lng, timestamp: new Date() } }
          }
        );
        lastMongoUpdate.set(shipmentId, now);
      }
    } catch (err) {
      console.error('Location caching/persistence error:', err);
    }

    io.to(`shipment:${shipmentId}`).emit('location-update', {
      shipmentId,
      lat,
      lng,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
