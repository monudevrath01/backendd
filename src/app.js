import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import messageRoutes from './routes/message.routes.js';
import aiRoutes from './routes/ai.routes.js';
import paymentRoutes from './routes/payment.routes.js';

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files if needed (fallback)
app.use('/uploads', express.static('uploads'));

// REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payment', paymentRoutes);

// Base route to check API status
app.get('/', (req, res) => {
  res.status(200).json({ message: 'AI Real-Time Chat API is running...' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;