import express from 'express';
import aiController from '../controllers/ai.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware.protect); // AI features require authentication

router.post('/suggest', aiController.suggestReply);
router.post('/summarize', aiController.summarizeChat);

export default router;
