import { sendError } from "../utils/response.js";
import multer from "multer";

export const errorHandler = (err, req, res, next) => {
  
    if (err instanceof multer.MulterError) {
    return sendError(res, 400, err.message);
  }

  if (err.code === 'P2002') {
    return sendError(res, 409, `Duplicate value for field: ${err.meta?.target}`);
  }

  if (err.code === 'P2025') {
    return sendError(res, 404, 'Record not found');
  }

  if (err.isOperational) {
    return sendError(res, err.statusCode, err.message, err.details);
  }

  sendError(res, 500, 'Something went wrong. Please try again later.');
}