import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware.protect); // Payment features require authentication

router.post('/order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);

export default router;
