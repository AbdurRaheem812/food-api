import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(errorHandler);

// Routes
app.use('/api/auth', authRoutes);

// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});