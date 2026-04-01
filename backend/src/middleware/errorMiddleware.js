const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  
  // Determine status code
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'CastError') {
    statusCode = 400; // Invalid MongoDB ObjectId
  } else if (err.code === 11000) {
    statusCode = 409; // Duplicate key error
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401; // Invalid token
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401; // Token expired
  }

  // Build standardized error response
  const errorResponse = {
    success: false,
    error: err.name || 'Error',
    message: err.message || 'Internal Server Error',
    statusCode,
    ...(NODE_ENV === 'development' && {
      stack: err.stack,
      path: req.path,
      method: req.method
    })
  };

  // Add validation errors details if present
  if (err.details) {
    errorResponse.details = err.details;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = { notFound, errorHandler };
