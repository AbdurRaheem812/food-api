import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const generateAccessToken = (user, roles) => {
  return jwt.sign({ id: user.id, roles }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};