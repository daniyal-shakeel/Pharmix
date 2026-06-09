const { createClient } = require('redis');

const redisClient = createClient({
  username: process.env.REDIS_USER || 'default',
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT) || 13796
  }
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis Connected');
  } catch (err) {
    console.error('Redis Connection Failed', err);
  }
};

module.exports = { redisClient, connectRedis };
