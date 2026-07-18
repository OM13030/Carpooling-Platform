const ApiError = require('../utils/ApiError');

const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errorDetails = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return next(new ApiError(400, 'Validation failed', errorDetails));
    }
    req.body = result.data;
    next();
  };
};

module.exports = validate;
