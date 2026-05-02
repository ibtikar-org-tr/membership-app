export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      title?: string;
      username?: string;
      type: string;
      is_forum?: boolean;
    };
    date: number;
    text?: string;
    message_thread_id?: number;
    is_topic_message?: boolean;
    // Service messages for group member changes
    new_chat_members?: Array<{
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    }>;
    left_chat_member?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    reply_to_message?: {
      message_id: number;
      from: {
        id: number;
        is_bot: boolean;
        first_name: string;
        last_name?: string;
        username?: string;
        language_code?: string;
      };
      chat: {
        id: number;
        title?: string;
        is_forum?: boolean;
        type: string;
      };
      date: number;
      message_thread_id?: number;
      forum_topic_created?: {
        name: string;
        icon_color: number;
        icon_custom_emoji_id?: string;
      };
      is_topic_message?: boolean;
    };
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
        type: string;
      };
    };
    data?: string;
  };
  chat_join_request?: {
    chat: {
      id: number;
      title?: string;
      username?: string;
      type: string;
    };
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    user_chat_id: number;
    date: number;
    bio?: string;
    invite_link?: {
      invite_link: string;
      creator: {
        id: number;
        is_bot: boolean;
        first_name: string;
        username?: string;
      };
      creates_join_request: boolean;
      is_primary?: boolean;
      is_revoked?: boolean;
    };
  };
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface SendMessageRequest {
  chat_id: number | string;
  text: string;
  parse_mode?: string;
  reply_markup?: InlineKeyboardMarkup;
  message_thread_id?: number;
  reply_to_message_id?: number;
  disable_notification?: boolean;
}

export interface SendPhotoRequest {
  chat_id: number | string;
  photo: string | Blob;
  caption?: string;
  parse_mode?: string;
  reply_markup?: InlineKeyboardMarkup;
}

export interface TelegramUserState {
  telegram_id: string;
  state: string;
  notes?: string;
  created_at: string;
  modified_at: string;
}