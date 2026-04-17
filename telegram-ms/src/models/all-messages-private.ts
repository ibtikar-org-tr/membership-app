// Model for storing all private messages from users

export interface AllMessagesPrivate {
  id: string;
  message_json: string; // Stored as JSON string
  chat_id: string | null; // Telegram chat ID for faster queries (same as user ID for private chats)
  notes: string | null;
  created_at: string;
}

export interface AllMessagesPrivateModel {
  message_json: string;
  chat_id?: string | null;
  notes?: string | null;
}

// Helper type for the parsed message JSON
export type MessageData = any; // Can be customized to match Telegram message structure
