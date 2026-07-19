const redis = require('../utils/redis');
const ApiError = require('../utils/ApiError');

const searchRateLimiter = async (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const key = `rate:search:${ip}`;
  
  try {
    const requests = await redis.incr(key);
    
    if (requests === 1) {
      // Limit to 60 searches per minute
      await redis.expire(key, 60);
    }
    
    if (requests > 60) {
      return next(new ApiError(429, 'Too many search requests. Please try again after a minute.'));
    }
    
    next();
  } catch (err) {
    // Graceful fallback: let the query pass if rate-limiting fails
    next();
  }
};

module.exports = {
  searchRateLimiter
};
