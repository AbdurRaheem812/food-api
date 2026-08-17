import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';

dotenv.config();

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return sendError(res, 401, 'Access denied. No token provided.');
  }

  const token = authHeader.split(' ')[1]; 

  if (!token || token === 'undefined' || token === 'null') {
    return sendError(res, 401, 'Access denied. Invalid token format.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      ...decoded,
      id: decoded.id || decoded._id,
    };
    next();
  } catch (error) {
    return sendError(res, 400, 'Invalid token.');
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return sendError(res, 401, 'Access denied. Not authenticated.');
    }

    const isAllowed = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!isAllowed) {
      return sendError(res, 403, 'Access denied. You do not have permission to perform this action.');
    }

    next();
  };
};