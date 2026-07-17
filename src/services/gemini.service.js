import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    } else {
      console.warn('GEMINI_API_KEY is not defined. Using mock AI responses.');
      this.genAI = null;
    }
  }

  suggestReply = async (messages) => {
    if (!this.genAI) {
      return "Sure, I can help with that! (Mock AI Reply - please add GEMINI_API_KEY in .env)";
    }

    try {
      const formattedHistory = messages
        .map(msg => `${msg.sender?.name || 'User'}: ${msg.text}`)
        .join('\n');

      const prompt = `You are a helpful assistant in a chat application. Given the following recent chat history, suggest a single, short (under 15 words), natural next reply that a user could send to continue the conversation:
\n${formattedHistory}\n
Return only the suggested reply text, with no quotes, formatting, or additional commentary.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini Suggest Reply Error:', error);
      return "Hi there! How's your day going? ";
    }
  };

  summarizeChat = async (messages) => {
    if (!this.genAI) {
      return "Here is a mock summary of your conversation. Chat history looks active and engaging! (Mock AI Summary - please add GEMINI_API_KEY in .env)";
    }

    try {
      const formattedHistory = messages
        .map(msg => `${msg.sender?.name || 'User'}: ${msg.text}`)
        .join('\n');

      const prompt = `You are a helpful assistant. Please summarize the following chat history in a concise paragraph of 2-3 sentences. Capture the key topics discussed:
\n${formattedHistory}\n
Return only the summary text without any surrounding quotes or extra headers.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini Summarize Chat Error:', error);
      return "Here is a fallback summary of the chat. The conversation is active and developers are discussing setup integration parameters. (Mock AI Fallback Summary)";
    }
  };
}

export default new GeminiService();
