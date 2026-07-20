export const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({ success: false, error: { message: err.message || "Something went wrong" } });
};