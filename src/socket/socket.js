import { Server } from 'socket.io';
import Message from '../models/Message.js';

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // Store userId -> socketId
  }

  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: '*', // Adjust to match your frontend origin in production
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Register user with their userId on connect
      socket.on('register', (userId) => {
        if (userId) {
          this.userSockets.set(userId.toString(), socket.id);
          console.log(`User ${userId} registered to socket ${socket.id}`);
        }
      });

      // Handle receiving message from client
      socket.on('send_message', async (data) => {
        try {
          const { senderId, text } = data;
          if (!senderId || !text) return;

          // Create message in database
          const message = await Message.create({
            sender: senderId,
            text
          });

          // Populate sender info
          const populatedMessage = await Message.findById(message._id).populate(
            'sender',
            'name email picture isPremium'
          );

          // Broadcast to all clients
          this.io.emit('new_message', populatedMessage);
        } catch (error) {
          console.error('Socket message save/broadcast error:', error);
          socket.emit('error', { message: 'Message could not be sent' });
        }
      });

      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        // Remove socket mapping
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            console.log(`User ${userId} unregistered from sockets`);
            break;
          }
        }
      });
    });

    return this.io;
  }

  sendPaymentSuccess(userId) {
    if (!this.io) {
      console.error('Socket.io server not initialized');
      return;
    }

    const socketId = this.userSockets.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit('payment_success', {
        isPremium: true,
        message: 'Your payment was successful. Premium features are now unlocked!'
      });
      console.log(`Real-time payment update sent to user: ${userId} via socket: ${socketId}`);
    } else {
      console.log(`User: ${userId} is offline. Socket notification not sent.`);
    }
  }
}

export default new SocketService();
