import express from 'express';
import authController from '../controllers/auth.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/google', authController.googleLogin);
router.get('/profile', authMiddleware.protect, authController.getProfile);
router.get('/config', authController.getConfig);

export default router;