import { Environment } from '../../types';

export interface CloudflareAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CloudflareAIResponse {
  response: string;
}

export class CloudflareAIService {
  private ai: any;

  constructor(env: Environment) {
    this.ai = env.AI;
  }

  /**
   * Send a message to Cloudflare AI and get a response
   * @param userMessage - The user's message
   * @param systemPrompt - Optional system prompt to set the AI's behavior (defaults to 'You are a helpful AI assistant.')
   * @param model - The AI model to use (defaults to '@cf/meta/llama-3.2-1b-instruct')
   * @returns The AI's response text
   */
  async chat(
    userMessage: string,
    systemPrompt?: string,
    model: string = '@cf/meta/llama-3.2-1b-instruct'
  ): Promise<string> {
    try {
      if (!userMessage) {
        throw new Error('Prompt is required');
      }

      const defaultSystemPrompt = 'You are a helpful AI assistant.';
      const finalSystemPrompt = systemPrompt || defaultSystemPrompt;

      const response = await this.ai.run(model, {
        messages: [
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: userMessage }
        ]
      });

      return response.response;
    } catch (error) {
      console.error('Error calling Cloudflare AI:', error);
      throw error;
    }
  }

  /**
   * Send a message to Cloudflare AI with conversation history
   * @param messages - Array of conversation messages
   * @param model - The AI model to use (defaults to '@cf/meta/llama-3.2-1b-instruct')
   * @returns The AI's response text
   */
  async chatWithHistory(
    messages: CloudflareAIMessage[],
    model: string = '@cf/meta/llama-3.2-1b-instruct'
  ): Promise<string> {
    try {
      if (!messages || messages.length === 0) {
        throw new Error('Messages array is required');
      }

      const response = await this.ai.run(model, {
        messages: messages
      });

      return response.response;
    } catch (error) {
      console.error('Error calling Cloudflare AI:', error);
      throw error;
    }
  }
}

export default CloudflareAIService;