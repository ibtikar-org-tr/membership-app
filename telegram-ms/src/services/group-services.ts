import { Environment } from '../types';
import { TelegramService } from './telegram';
import { AllMessagesGroupsCrud } from '../crud/all-messages-groups';
import { D1DatabaseConnection } from '../crud/database';
import { escapeMarkdownV2 } from '../utils/helpers';
import LLMService from './ai-services/deepseek';

export class GroupServices {
  private env: Environment;
  private telegramService: TelegramService;
  private llmService: LLMService;

  constructor(env: Environment) {
    this.env = env;
    this.telegramService = new TelegramService(env);
    this.llmService = new LLMService(env);
  }

  /**
   * Handle the /summarize command in group chats
   * @param chatId The group chat ID
   * @param commandText The full command text (e.g., "/summarize 24")
   * @param messageThreadId Optional message thread ID for topic-specific summarization
   * @param commandMessageId Optional message ID of the command message to reply to
   * @returns Promise<void>
   */
  async handleSummarizeCommand(
    chatId: number, 
    commandText: string,
    messageThreadId?: number,
    commandMessageId?: number
  ): Promise<void> {
    try {
      const db = new D1DatabaseConnection(this.env.TELEGRAM_DB);
      const groupMessagesCrud = new AllMessagesGroupsCrud(db);
      
      // Parse hours from command (default to 2 hours)
      const hours = this.parseHoursFromCommand(commandText);
      
      // Determine if this is a topic-specific request
      const isTopicSpecific = messageThreadId !== undefined;
      
      // Send "Generating summary..." message
      const contextText = isTopicSpecific 
        ? `_Generating summary of this topic from the last ${hours} hour${hours !== 1 ? 's' : ''}\\.\\.\\._`
        : `_Generating summary of the last ${hours} hour${hours !== 1 ? 's' : ''} conversation\\.\\.\\._`;
      
      const statusMessageId = await this.telegramService.sendMessage(
        chatId,
        contextText,
        undefined, // parseMode
        undefined, // inlineKeyboard
        messageThreadId, // Send in the same thread/topic
        commandMessageId // Reply to the command message
      );
      
      // Get conversation based on context (topic or all messages)
      let conversation: Array<{
        user_id: number;
        user_name: string;
        content: string;
        created_at: string;
      }>;
      
      if (isTopicSpecific) {
        // Get messages from specific topic
        conversation = await groupMessagesCrud.getTopicConversationByHours(
          chatId,
          messageThreadId!.toString(),
          hours,
          500
        );
      } else {
        // Check if we're in General topic (no thread_id in message but forum is enabled)
        // In this case, get all topics combined
        conversation = await groupMessagesCrud.getGroupConversationByHours(
          chatId,
          hours,
          500
        );
      }
      
      // Handle case where no messages found
      if (conversation.length === 0) {
        await this.handleNoMessagesFound(chatId, hours, statusMessageId, isTopicSpecific, messageThreadId, commandMessageId);
        return;
      }
      
      // Build conversation text for AI
      const conversationText = this.buildConversationText(conversation, hours, isTopicSpecific);
      
      // Get AI summary
      const summary = await this.generateSummary(conversationText);
      
      // Send or edit the response with the summary
      await this.sendSummaryResponse(chatId, hours, summary, statusMessageId, isTopicSpecific, messageThreadId, commandMessageId);
      
    } catch (error) {
      console.error('Error generating summary:', error);
      await this.telegramService.sendMessage(
        chatId,
        'Sorry\\, I encountered an error while generating the summary\\. Please try again later\\.',
        undefined, // parseMode
        undefined, // inlineKeyboard
        messageThreadId, // Send error in the same thread/topic
        commandMessageId // Reply to the command message
      );
    }
  }

  /**
   * Parse hours parameter from the /summarize command
   * @param commandText The full command text
   * @returns Number of hours (default: 2, max: 168)
   */
  private parseHoursFromCommand(commandText: string): number {
    const parts = commandText.trim().split(/\s+/);
    let hours = 2; // default
    
    if (parts.length > 1) {
      const parsedHours = parseInt(parts[1]);
      if (!isNaN(parsedHours) && parsedHours > 0 && parsedHours <= 168) { // Max 1 week
        hours = parsedHours;
      }
    }
    
    return hours;
  }

  /**
   * Handle the case where no messages are found in the specified time range
   * @param chatId The group chat ID
   * @param hours Number of hours searched
   * @param statusMessageId Optional message ID to edit
   * @param isTopicSpecific Whether this is a topic-specific request
   * @param messageThreadId Optional message thread ID for topic-specific responses
   * @param commandMessageId Optional message ID of the command message to reply to
   */
  private async handleNoMessagesFound(
    chatId: number,
    hours: number,
    statusMessageId?: number,
    isTopicSpecific: boolean = false,
    messageThreadId?: number,
    commandMessageId?: number
  ): Promise<void> {
    const context = isTopicSpecific ? 'in this topic ' : '';
    const noMessagesText = hours === 1 
      ? `No messages found ${context}in the last hour\\.`
      : `No messages found ${context}in the last ${hours} hours\\.`;
    
    if (statusMessageId) {
      await this.telegramService.editMessage(
        chatId,
        statusMessageId,
        noMessagesText,
        undefined, // parseMode
        undefined, // inlineKeyboard
        messageThreadId // Edit in the same thread/topic
      );
    } else {
      await this.telegramService.sendMessage(
        chatId, 
        noMessagesText,
        undefined, // parseMode
        undefined, // inlineKeyboard
        messageThreadId, // Send in the same thread/topic
        commandMessageId // Reply to the command message
      );
    }
  }

  /**
   * Build formatted conversation text for AI processing
   * @param conversation Array of conversation messages
   * @param hours Number of hours covered
   * @param isTopicSpecific Whether this is a topic-specific request
   * @returns Formatted conversation text
   */
  private buildConversationText(
    conversation: Array<{
      user_id: number;
      user_name: string;
      content: string;
      created_at: string;
    }>,
    hours: number,
    isTopicSpecific: boolean = false
  ): string {
    const context = isTopicSpecific ? 'Topic conversation' : 'Conversation';
    let conversationText = `${context} from the last ${hours} hour${hours !== 1 ? 's' : ''} (${conversation.length} messages):\n\n`;
    
    conversation.forEach(msg => {
      conversationText += `${msg.user_name}: ${msg.content}\n`;
    });
    
    return conversationText;
  }

  /**
   * Generate AI summary of the conversation
   * @param conversationText The formatted conversation text
   * @returns AI-generated summary
   */
  private async generateSummary(conversationText: string): Promise<string> {
    const systemPrompt = `You are a helpful assistant that summarizes group conversations. 
Provide a concise but comprehensive summary of the conversation in the same language as the conversation.
Highlight key topics discussed, important decisions made, action items, and notable exchanges.
Format the summary in a clear, readable way with bullet points or sections if appropriate.`;
    
    const userPrompt = `Please summarize the following group conversation:\n\n${conversationText}`;
    
    return await this.llmService.chat(userPrompt, systemPrompt);
  }

  /**
   * Send or edit the final summary response
   * @param chatId The group chat ID
   * @param hours Number of hours summarized
   * @param summary The AI-generated summary
   * @param statusMessageId Optional message ID to edit
   * @param isTopicSpecific Whether this is a topic-specific request
   * @param messageThreadId Optional message thread ID for topic-specific responses
   * @param commandMessageId Optional message ID of the command message to reply to
   */
  private async sendSummaryResponse(
    chatId: number,
    hours: number,
    summary: string,
    statusMessageId?: number,
    isTopicSpecific: boolean = false,
    messageThreadId?: number,
    commandMessageId?: number
  ): Promise<void> {
    const context = isTopicSpecific ? 'this topic' : 'conversation';
    const summaryText = escapeMarkdownV2(
      `📝 Summary of ${context} from last ${hours} hour${hours !== 1 ? 's' : ''}:\n\n${summary}`
    );
    
    if (statusMessageId) {
      await this.telegramService.editMessage(
        chatId,
        statusMessageId,
        summaryText,
        undefined, // parseMode
        undefined, // inlineKeyboard
        messageThreadId // Edit in the same thread/topic
      );
    } else {
      await this.telegramService.sendMessage(
        chatId, 
        summaryText,
        undefined, // parseMode
        undefined, // inlineKeyboard
        messageThreadId, // Send in the same thread/topic
        commandMessageId // Reply to the command message
      );
    }
  }
}
