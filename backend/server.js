require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
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
const xssClean = require('./middleware/xss');
const rateLimit = require('express-rate-limit');
const {
  blockDeleteOperations,
  restrictUpdates,
  checkDevicePostLimit
} = require('./middleware/demoMode');

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

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000', 'http://localhost:8080'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(cors(corsOptions));
app.use(helmet());
app.use((req, res, next) => {
  Object.defineProperty(req, 'query', {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true
  });
  next();
});
app.use(mongoSanitize());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use(xssClean);

app.use((req, res, next) => {
  if (req.path === '/api/payments/webhook') {
    return next();
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return writeLimiter(req, res, next);
  }
  return readLimiter(req, res, next);
});

app.use(blockDeleteOperations);
app.use(restrictUpdates);
app.use(checkDevicePostLimit);

app.get('/health', (_, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

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
