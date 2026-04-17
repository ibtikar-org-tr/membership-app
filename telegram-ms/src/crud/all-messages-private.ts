import { BaseCrud, DatabaseConnection } from './base';
import { AllMessagesPrivate, AllMessagesPrivateModel } from '../models/all-messages-private';

export class AllMessagesPrivateCrud extends BaseCrud<AllMessagesPrivate> {
  constructor(db: DatabaseConnection) {
    super(db, 'all_messages_private');
  }

  /**
   * Store a new message
   * @param messageData The message object to store (will be JSON stringified)
   * @param notes Optional notes
   */
  async storeMessage(
    messageData: any,
    notes?: string
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const message_json = JSON.stringify(messageData);
      // Extract chat_id from the message data (for private chats, this is the user's ID)
      const chat_id = messageData?.chat?.id?.toString() || messageData?.from?.id?.toString() || null;
      
      const data: AllMessagesPrivateModel = {
        message_json,
        chat_id,
        notes: notes || null
      };
      
      return await this.create(data as Omit<AllMessagesPrivate, 'id'>);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get a message by ID and parse the JSON
   * @param id Message ID
   */
  async getMessageById(id: string): Promise<{ 
    id: string;
    message: any;
    notes: string | null;
    created_at: string;
  } | null> {
    try {
      const result = await this.getById(id);
      if (!result) return null;

      return {
        id: result.id,
        message: JSON.parse(result.message_json),
        notes: result.notes,
        created_at: result.created_at
      };
    } catch (error) {
      console.error('Error getting message by ID:', error);
      return null;
    }
  }

  /**
   * Get messages with pagination and parse JSON
   * @param limit Number of messages to retrieve
   * @param offset Offset for pagination
   */
  async getMessages(limit?: number, offset?: number): Promise<Array<{
    id: string;
    message: any;
    notes: string | null;
    created_at: string;
  }>> {
    try {
      const results = await this.getAll(limit, offset);
      
      return results.map(result => ({
        id: result.id,
        message: JSON.parse(result.message_json),
        notes: result.notes,
        created_at: result.created_at
      }));
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  /**
   * Get messages ordered by creation date (newest first)
   * @param limit Number of messages to retrieve
   * @param offset Offset for pagination
   */
  async getRecentMessages(limit: number = 50, offset: number = 0): Promise<Array<{
    id: string;
    message: any;
    notes: string | null;
    created_at: string;
  }>> {
    try {
      const query = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      const result = await this.db.prepare(query).bind(limit, offset).all<AllMessagesPrivate>();
      
      if (!result.success) return [];

      return result.results.map(result => ({
        id: result.id,
        message: JSON.parse(result.message_json),
        notes: result.notes,
        created_at: result.created_at
      }));
    } catch (error) {
      console.error('Error getting recent messages:', error);
      return [];
    }
  }

  /**
   * Update notes for a message
   * @param id Message ID
   * @param notes New notes
   */
  async updateNotes(id: string, notes: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await this.update(id, { notes } as Partial<Omit<AllMessagesPrivate, 'id'>>);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search messages by content (basic text search in JSON)
   * Note: This is a simple LIKE search, may not be efficient for large datasets
   * @param searchTerm Search term
   * @param limit Number of results to return
   */
  async searchMessages(searchTerm: string, limit: number = 50): Promise<Array<{
    id: string;
    message: any;
    notes: string | null;
    created_at: string;
  }>> {
    try {
      const query = `
        SELECT * FROM ${this.tableName} 
        WHERE message_json LIKE ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `;
      const result = await this.db.prepare(query).bind(`%${searchTerm}%`, limit).all<AllMessagesPrivate>();
      
      if (!result.success) return [];

      return result.results.map(result => ({
        id: result.id,
        message: JSON.parse(result.message_json),
        notes: result.notes,
        created_at: result.created_at
      }));
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  /**
   * Get messages within a date range
   * @param startDate Start date (ISO string or datetime)
   * @param endDate End date (ISO string or datetime)
   */
  async getMessagesByDateRange(
    startDate: string,
    endDate: string,
    limit: number = 100
  ): Promise<Array<{
    id: string;
    message: any;
    notes: string | null;
    created_at: string;
  }>> {
    try {
      const query = `
        SELECT * FROM ${this.tableName} 
        WHERE created_at BETWEEN ? AND ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `;
      const result = await this.db.prepare(query).bind(startDate, endDate, limit).all<AllMessagesPrivate>();
      
      if (!result.success) return [];

      return result.results.map(result => ({
        id: result.id,
        message: JSON.parse(result.message_json),
        notes: result.notes,
        created_at: result.created_at
      }));
    } catch (error) {
      console.error('Error getting messages by date range:', error);
      return [];
    }
  }

  /**
   * Delete old messages (older than specified days)
   * @param days Number of days to keep
   */
  async deleteOldMessages(days: number): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const query = `
        DELETE FROM ${this.tableName} 
        WHERE created_at < datetime('now', '-${days} days')
      `;
      const result = await this.db.prepare(query).bind().run();
      
      return {
        success: result.success,
        deletedCount: result.meta?.changes,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get today's messages for a specific user (by telegram_id)
   * @param telegramId The user's telegram ID (same as chat_id for private chats)
   * @param limit Maximum number of messages to retrieve
   */
  async getTodaysMessagesForUser(
    telegramId: number,
    limit: number = 50
  ): Promise<Array<{
    id: string;
    message: any;
    notes: string | null;
    created_at: string;
  }>> {
    try {
      // Get messages from today where the chat_id matches the telegramId
      // Using indexed chat_id column for better performance
      const query = `
        SELECT * FROM ${this.tableName} 
        WHERE DATE(created_at) = DATE('now')
        AND chat_id = ?
        ORDER BY created_at ASC 
        LIMIT ?
      `;
      const result = await this.db.prepare(query).bind(telegramId.toString(), limit).all<AllMessagesPrivate>();
      
      if (!result.success) return [];

      return result.results.map(result => ({
        id: result.id,
        message: JSON.parse(result.message_json),
        notes: result.notes,
        created_at: result.created_at
      }));
    } catch (error) {
      console.error('Error getting today\'s messages for user:', error);
      return [];
    }
  }

  /**
   * Store a bot response (AI reply) for conversation history
   * @param telegramId The user's telegram ID (chat_id for private chats)
   * @param userMessageText The user's original message
   * @param botResponse The bot's AI-generated response
   */
  async storeBotResponse(
    telegramId: number,
    userMessageText: string,
    botResponse: string
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Store bot response as a special message format
      const botMessageData = {
        from: {
          id: 0, // Bot ID
          is_bot: true,
          first_name: 'Bot'
        },
        chat: {
          id: telegramId,
          type: 'private'
        },
        text: botResponse,
        reply_to_message: {
          text: userMessageText
        }
      };
      
      // Pass the bot message - chat_id will be automatically extracted from chat.id
      return await this.storeMessage(botMessageData, 'bot_response');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get today's conversation for a user (both user messages and bot responses)
   * Returns in chronological order with role identified
   * @param telegramId The user's telegram ID (same as chat_id for private chats)
   * @param limit Maximum number of messages to retrieve
   */
  async getTodaysConversation(
    telegramId: number,
    limit: number = 100
  ): Promise<Array<{
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }>> {
    try {
      // Get all messages from today related to this chat
      // Using indexed chat_id column for better performance
      // Both user messages and bot responses share the same chat_id
      const query = `
        SELECT * FROM ${this.tableName} 
        WHERE DATE(created_at) = DATE('now')
        AND chat_id = ?
        ORDER BY created_at ASC 
        LIMIT ?
      `;
      const result = await this.db.prepare(query).bind(telegramId.toString(), limit).all<AllMessagesPrivate>();
      
      if (!result.success) return [];

      return result.results
        .map(result => {
          const message = JSON.parse(result.message_json);
          const isBotResponse = result.notes === 'bot_response';
          const text = message.text;
          
          if (!text) return null;
          
          return {
            role: isBotResponse ? 'assistant' as const : 'user' as const,
            content: text,
            created_at: result.created_at
          };
        })
        .filter((msg): msg is NonNullable<typeof msg> => msg !== null);
    } catch (error) {
      console.error('Error getting today\'s conversation:', error);
      return [];
    }
  }
}
