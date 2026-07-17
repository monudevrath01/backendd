import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

class AuthController {
  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId) {
      this.client = new OAuth2Client(clientId);
    } else {
      console.warn('GOOGLE_CLIENT_ID is not defined. Google OAuth verification will fall back to mock verification for testing.');
      this.client = null;
    }
  }

  googleLogin = async (req, res) => {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Google idToken is required' });
    }

    try {
      let googleId, email, name, picture;

      // Check if we use real Google verification or mock verification
      if (this.client && !token.startsWith('mock_token_')) {
        const ticket = await this.client.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        
        googleId = payload['sub'];
        email = payload['email'];
        name = payload['name'];
        picture = payload['picture'];
      } else {
        // Fallback for development/testing: parse mock token or create mock user properties
        console.log('Using mock Google token verification');
        const tokenParts = token.split('_');
        const identifier = tokenParts[2] || 'testuser';
        
        googleId = `mock_google_${identifier}`;
        email = `${identifier}@example.com`;
        name = identifier.charAt(0).toUpperCase() + identifier.slice(1);
        picture = `https://api.dicebear.com/7.x/adventurer/svg?seed=${identifier}`;
      }

      // Find or create User
      let user = await User.findOne({ googleId });
      if (!user) {
        // Also check if email exists to avoid duplicates
        user = await User.findOne({ email });
        if (user) {
          user.googleId = googleId;
          if (picture && !user.picture) user.picture = picture;
          await user.save();
        } else {
          user = await User.create({
            googleId,
            email,
            name,
            picture,
            isPremium: false
          });
        }
      }

      // Generate JWT
      const jwtToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'your_jwt_secret_here',
        { expiresIn: '30d' }
      );

      return res.status(200).json({
        token: jwtToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          isPremium: user.isPremium
        }
      });

    } catch (error) {
      console.error('Google Auth Error:', error);
      return res.status(401).json({ message: 'Invalid Google token' });
    }
  };

  getProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json({
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        isPremium: user.isPremium
      });
    } catch (error) {
      console.error('Get Profile Error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };

  getConfig = async (req, res) => {
    return res.status(200).json({
      googleClientId: process.env.GOOGLE_CLIENT_ID || ''
    });
  };
}

export default new AuthController();