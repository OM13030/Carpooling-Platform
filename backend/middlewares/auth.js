const { verifyAccessToken } = require('../utils/tokens');
const ApiError = require('../utils/ApiError');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Access token is required'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { _id, role, organizationId }
    next();
  } catch (error) {
    next(new ApiError(401, 'Invalid or expired access token'));
  }
};

const requireEmployee = (req, res, next) => {
  if (!req.user || req.user.role !== 'employee') {
    return next(new ApiError(403, 'Access denied: Employee role required'));
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ApiError(403, 'Access denied: Admin role required'));
  }
  next();
};

module.exports = {
  auth,
  requireEmployee,
  requireAdmin,
};
