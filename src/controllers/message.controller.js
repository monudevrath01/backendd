import Message from '../models/Message.js';

class MessageController {
  getMessages = async (req, res) => {
    try {
      // Get the last 100 messages and populate the sender details
      const messages = await Message.find()
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('sender', 'name email picture isPremium');

      // Return messages in chronological order (oldest first) for UI
      return res.status(200).json(messages.reverse());
    } catch (error) {
      console.error('Fetch Messages Error:', error);
      return res.status(500).json({ message: 'Server error while fetching messages' });
    }
  };

  createMessage = async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    try {
      const newMessage = await Message.create({
        sender: req.user.id,
        text
      });

      const populatedMessage = await Message.findById(newMessage._id).populate(
        'sender',
        'name email picture isPremium'
      );

      return res.status(201).json(populatedMessage);
    } catch (error) {
      console.error('Create Message Error:', error);
      return res.status(500).json({ message: 'Server error while saving message' });
    }
  };
}

export default new MessageController();
