const mongoose = require('mongoose');
const { createClient } = require('redis');
require('dotenv').config();

const clean = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    const Shipment = mongoose.models.Shipment || mongoose.model('Shipment', new mongoose.Schema({ riderLocation: Object }));
    
    const res = await Shipment.updateMany(
      { 'riderLocation.lat': { $lt: 23 } }, 
      { $unset: { riderLocation: "" } }
    );
    console.log(`Cleaned ${res.modifiedCount} shipments from MongoDB`);

    const client = createClient({
      username: process.env.REDIS_USER,
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT)
      }
    });
    await client.connect();
    await client.flushAll();
    console.log('Redis Flushed');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

clean();
