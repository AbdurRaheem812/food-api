import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1]; 

  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({ message: 'Access denied. Invalid token format.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      ...decoded,
      id: decoded.id || decoded._id,
    };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(400).json({ message: 'Invalid token.' });
  }
};