import Message from '../models/Message.js';
import geminiService from '../services/gemini.service.js';

class AiController {
  suggestReply = async (req, res) => {
    // 1. Check premium status
    if (!req.user.isPremium) {
      return res.status(403).json({
        message: 'Premium feature only. Please complete payment to unlock AI features.'
      });
    }

    try {
      // 2. Fetch the last 15 messages to get context
      const messages = await Message.find()
        .sort({ createdAt: -1 })
        .limit(15)
        .populate('sender', 'name');

      // Check if there are any messages to suggest a reply to
      if (messages.length === 0) {
        return res.status(200).json({
          suggestion: 'Start the conversation by saying Hello!'
        });
      }

      // Reverse messages to chronological order
      const chatHistory = messages.reverse();

      // 3. Call service
      const suggestion = await geminiService.suggestReply(chatHistory);
      return res.status(200).json({ suggestion });

    } catch (error) {
      console.error('AI Suggest Reply Controller Error:', error);
      return res.status(500).json({ message: error.message || 'AI reply suggestion failed' });
    }
  };

  summarizeChat = async (req, res) => {
    // 1. Check premium status
    if (!req.user.isPremium) {
      return res.status(403).json({
        message: 'Premium feature only. Please complete payment to unlock AI features.'
      });
    }

    try {
      // 2. Fetch the last 50 messages to summarize
      const messages = await Message.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('sender', 'name');

      if (messages.length === 0) {
        return res.status(200).json({
          summary: 'No messages have been sent in this chat room yet.'
        });
      }

      // Reverse to chronological order
      const chatHistory = messages.reverse();

      // 3. Call service
      const summary = await geminiService.summarizeChat(chatHistory);
      return res.status(200).json({ summary });

    } catch (error) {
      console.error('AI Summarize Chat Controller Error:', error);
      return res.status(500).json({ message: error.message || 'AI chat summarization failed' });
    }
  };
}

export default new AiController();
