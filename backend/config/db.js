const mongoose = require('mongoose');
const User = require('../models/User');
const seed = require('../seed');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    const count = await User.countDocuments();
    if (count === 0) {
      await seed();
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
