const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class GroqChatSession {
  private messages: Message[] = [];

  constructor() {
    this.messages.push({
      role: 'system',
      content: `You are 'Lumi', the intelligent virtual assistant for Lumina Medical, a premium medical clinic specializing in Dental Implants, IV Therapy, and Weight Loss.

Your goal is to assist website visitors by:
1. Answering questions about our services pleasantly and professionally.
2. Encouraging them to book an appointment.
3. Collecting their name and interest if they seem interested (lead generation).

Tone: Professional, empathetic, trustworthy, and concise.
Do not provide specific medical advice (diagnoses). Always suggest a consultation with Dr. Chen or Dr. Ross for medical concerns.
If asked about prices, give the ranges provided in your knowledge base or suggest booking a free consultation for a quote.`
    });
  }

  async sendMessage(userMessage: string): Promise<string> {
    if (!GROQ_API_KEY) {
      throw new Error('Missing VITE_GROQ_API_KEY in environment variables.');
    }

    this.messages.push({
      role: 'user',
      content: userMessage
    });

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: this.messages,
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || 'Sorry, I could not process that.';
      
      // Clean markdown formatting
      const cleanedMessage = assistantMessage
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/#{1,6}\s/g, '')
        .replace(/`(.+?)`/g, '$1');
      
      this.messages.push({
        role: 'assistant',
        content: cleanedMessage
      });

      return cleanedMessage;
    } catch (error) {
      console.error('Groq API Error:', error);
      throw error;
    }
  }
}

export const createChatSession = (): GroqChatSession => {
  return new GroqChatSession();
};

// Helper function to clean markdown formatting
export const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // Remove bold **text**
    .replace(/\*(.+?)\*/g, '$1')      // Remove italic *text*
    .replace(/#{1,6}\s/g, '')         // Remove headers
    .replace(/`(.+?)`/g, '$1');       // Remove inline code
};
