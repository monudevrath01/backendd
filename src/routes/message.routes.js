import express from 'express';
import messageController from '../controllers/message.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware.protect); // All message routes require authentication

router.get('/', messageController.getMessages);
router.post('/', messageController.createMessage);

export default router;
