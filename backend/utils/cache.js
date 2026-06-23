const { redisClient } = require('../config/redis');

const getCache = async (key) => {
  try {
    const promise = redisClient.get(key);
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 1000));
    const result = await Promise.race([promise, timeout]);
    return result ? JSON.parse(result) : null;
  } catch (err) {
    return null;
  }
};

const setCache = async (key, val, ttl = 300) => {
  try {
    await redisClient.set(key, JSON.stringify(val), { EX: ttl });
  } catch (err) {}
};

const delCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (err) {}
};

const clearCachePattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {}
};

module.exports = { getCache, setCache, delCache, clearCachePattern };
