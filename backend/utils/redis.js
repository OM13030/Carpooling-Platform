const logger = require('./logger');

let redisClient = null;
let isRedisAvailable = false;

// Fallback in-memory cache if Redis is not configured or fails
const memoryCache = new Map();
const memoryExpiry = new Map();

const memoryStore = {
  async get(key) {
    const expiry = memoryExpiry.get(key);
    if (expiry && expiry < Date.now()) {
      memoryCache.delete(key);
      memoryExpiry.delete(key);
      return null;
    }
    return memoryCache.get(key) || null;
  },

  async setex(key, seconds, value) {
    memoryCache.set(key, value);
    memoryExpiry.set(key, Date.now() + seconds * 1000);
    return 'OK';
  },

  async incr(key) {
    const val = parseInt(memoryCache.get(key) || '0', 10) + 1;
    memoryCache.set(key, val.toString());
    return val;
  },

  async expire(key, seconds) {
    memoryExpiry.set(key, Date.now() + seconds * 1000);
    return 1;
  }
};

if (process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL) {
  try {
    const { createClient } = require('redis');
    redisClient = createClient({
      url: process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error: ' + err.message);
      isRedisAvailable = false;
    });

    redisClient.connect().then(() => {
      logger.info('Connected to Redis server successfully!');
      isRedisAvailable = true;
    }).catch(err => {
      logger.warn('Could not connect to Redis server, using in-memory fallback. ' + err.message);
      isRedisAvailable = false;
    });
  } catch (e) {
    logger.warn('Redis package not installed or configuration failed. Using in-memory fallback.');
    isRedisAvailable = false;
  }
} else {
  logger.info('No REDIS_URL or Upstash configuration found. Using in-memory cache/rate-limiter fallback.');
}

const get = async (key) => {
  if (isRedisAvailable && redisClient) {
    try {
      return await redisClient.get(key);
    } catch (e) {
      return await memoryStore.get(key);
    }
  }
  return await memoryStore.get(key);
};

const setex = async (key, seconds, value) => {
  if (isRedisAvailable && redisClient) {
    try {
      return await redisClient.setEx(key, seconds, value);
    } catch (e) {
      return await memoryStore.setex(key, seconds, value);
    }
  }
  return await memoryStore.setex(key, seconds, value);
};

const incr = async (key) => {
  if (isRedisAvailable && redisClient) {
    try {
      return await redisClient.incr(key);
    } catch (e) {
      return await memoryStore.incr(key);
    }
  }
  return await memoryStore.incr(key);
};

const expire = async (key, seconds) => {
  if (isRedisAvailable && redisClient) {
    try {
      return await redisClient.expire(key, seconds);
    } catch (e) {
      return await memoryStore.expire(key, seconds);
    }
  }
  return await memoryStore.expire(key, seconds);
};

module.exports = {
  get,
  setex,
  incr,
  expire,
  isRedisAvailable: () => isRedisAvailable
};
