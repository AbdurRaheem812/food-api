export const sendSuccess = (res, statusCode, data, meta) =>
  res.status(statusCode).json({ success: true, data, ...(meta && { meta }) });

export const sendError = (res, statusCode, message, details) =>
  res.status(statusCode).json({ success: false, error: { message, ...(details && { details }) } });