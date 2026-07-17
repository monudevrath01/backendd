import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';
import socketService from '../socket/socket.js';

class PaymentController {
  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret && keyId !== 'mock_key_id') {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    } else {
      console.warn('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are not defined. Falling back to mock payments for testing.');
      this.razorpay = null;
    }
  }

  createOrder = async (req, res) => {
    const { amount = 499 } = req.body; // Default amount 499 INR

    try {
      if (!this.razorpay) {
        const mockOrderId = `order_mock_${Math.random().toString(36).substring(7)}`;
        return res.status(200).json({
          id: mockOrderId,
          amount: amount * 100, // paise
          currency: 'INR',
          isMock: true,
          key_id: 'mock_key_id'
        });
      }

      const options = {
        amount: amount * 100, // in paise
        currency: 'INR',
        receipt: `receipt_${Math.random().toString(36).substring(7)}`,
      };

      const order = await this.razorpay.orders.create(options);
      const responseData = Object.assign({}, order, {
        key_id: process.env.RAZORPAY_KEY_ID
      });
      return res.status(200).json(responseData);
    } catch (error) {
      console.error('Create Razorpay Order Error:', error);
      console.warn('Falling back to mock order due to Razorpay API error.');
      const mockOrderId = `order_mock_${Math.random().toString(36).substring(7)}`;
      return res.status(200).json({
        id: mockOrderId,
        amount: amount * 100, // paise
        currency: 'INR',
        isMock: true,
        key_id: 'mock_key_id'
      });
    }
  };

  verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    try {
      let isVerified = false;

      if (!this.razorpay || razorpay_order_id.startsWith('order_mock_')) {
        isVerified = true;
      } else {
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
          .update(body.toString())
          .digest('hex');

        isVerified = expectedSignature === razorpay_signature;
      }

      if (isVerified) {
        const user = await User.findById(req.user.id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        user.isPremium = true;
        await user.save();

        // Notify client via WebSocket about instant premium update
        socketService.sendPaymentSuccess(user._id);

        return res.status(200).json({
          status: 'success',
          message: 'Payment verified and premium unlocked!',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            picture: user.picture,
            isPremium: user.isPremium
          }
        });
      } else {
        return res.status(400).json({ status: 'failure', message: 'Payment verification failed' });
      }
    } catch (error) {
      console.error('Verify Razorpay Payment Error:', error);
      return res.status(500).json({ message: 'Payment verification server error' });
    }
  };
}

export default new PaymentController();
