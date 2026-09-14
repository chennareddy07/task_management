export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: Object.values(error.errors).map(({ path, message }) => ({
        path,
        message
      }))
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: 'A resource with that value already exists' });
  }

  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
};
