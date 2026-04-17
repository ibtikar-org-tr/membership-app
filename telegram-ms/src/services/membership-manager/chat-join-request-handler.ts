import { Context } from 'hono';
import { Environment } from '../../types';
import { TelegramService } from '../telegram';
import { MemberSheetServices } from './member-sheet-services';
import { AllMessagesGroupsCrud } from '../../crud/all-messages-groups';
import { D1DatabaseConnection } from '../../crud/database';
import { escapeMarkdownV2 } from '../../utils/helpers';

/**
 * Handler for Telegram chat join requests
 * This handles the logic when users request to join a group/channel
 */
export async function handleChatJoinRequest(
  update: any,
  c: Context<{ Bindings: Environment }>
): Promise<Response> {
  const joinRequest = update.chat_join_request;
  const telegramId = joinRequest.from.id;
  const chatId = joinRequest.chat.id;
  const username = joinRequest.from.username;
  const firstName = joinRequest.from.first_name;
  const lastName = joinRequest.from.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  console.log('Received chat join request:', {
    chatId,
    chatTitle: joinRequest.chat.title,
    userId: telegramId,
    username,
    firstName,
    lastName,
    date: new Date(joinRequest.date * 1000).toISOString()
  });
  
  // Store the join request in all_messages_groups table
  await storeJoinRequest(joinRequest, fullName, username, c.env);
  
  const telegramService = new TelegramService(c.env);
  const memberSheetServices = new MemberSheetServices(c.env);
  
  // Check if the user has the bot activated (can receive messages)
  const hasBotActivated = await telegramService.canSendMessageToUser(telegramId);
  
  if (hasBotActivated) {
    // User has bot activated - check if they are verified
    await handleUserWithBot(
      telegramId,
      chatId,
      fullName,
      username,
      memberSheetServices,
      telegramService
    );
  } else {
    // User doesn't have bot activated - send silent message to group
    await handleUserWithoutBot(
      telegramId,
      chatId,
      fullName,
      username,
      telegramService,
      c
    );
  }
  
  return c.json({ ok: true });
}

/**
 * Store join request in database
 */
async function storeJoinRequest(
  joinRequest: any,
  fullName: string,
  username: string | undefined,
  env: Environment
): Promise<void> {
  try {
    const db = new D1DatabaseConnection(env.TELEGRAM_DB);
    const groupMessagesCrud = new AllMessagesGroupsCrud(db);
    
    // Create a message-like structure for the join request
    const joinRequestMessage = {
      chat: joinRequest.chat,
      from: joinRequest.from,
      date: joinRequest.date,
      user_chat_id: joinRequest.user_chat_id,
      bio: joinRequest.bio,
      invite_link: joinRequest.invite_link,
      // Mark this as a join request
      message_type: 'chat_join_request'
    };
    
    await groupMessagesCrud.storeMessage(
      joinRequestMessage,
      `Join request from ${fullName} (@${username || 'no_username'})`
    );
    
    console.log('Stored chat join request in database');
  } catch (storageError) {
    console.error('Failed to store chat join request:', storageError);
  }
}

/**
 * Handle user who has the bot activated
 * Checks verification status and sends appropriate response
 */
async function handleUserWithBot(
  telegramId: number,
  chatId: number,
  fullName: string,
  username: string | undefined,
  memberSheetServices: MemberSheetServices,
  telegramService: TelegramService
): Promise<void> {
  // Check if user is verified
  const member = await memberSheetServices.getMemberByTelegramId(telegramId.toString());
  
  if (member && member.telegram_id) {
    // User is verified - create and send private invite link
    await sendPrivateInviteLink(
      telegramId,
      chatId,
      fullName,
      telegramService
    );
  } else {
    // User has bot but not verified - ask them to verify
    await sendVerificationPrompt(telegramId, fullName, telegramService);
  }
}

/**
 * Send private invite link to verified user
 */
async function sendPrivateInviteLink(
  telegramId: number,
  chatId: number,
  fullName: string,
  telegramService: TelegramService
): Promise<void> {
  try {
    const inviteLink = await telegramService.createChatInviteLink(
      chatId,
      telegramId,
      fullName
    );
    
    if (inviteLink) {
      // Send the private invite link to the user
      await telegramService.sendMessage(
        telegramId,
        `مرحباً ${escapeMarkdownV2(fullName)}\\! 🎉\n\n` +
        `تم التحقق من عضويتك بنجاح\\.\n\n` +
        `إليك رابط الانضمام الخاص بك:\n` +
        `${escapeMarkdownV2(inviteLink)}\n\n` +
        `⚠️ *ملاحظة مهمة:*\n` +
        `• هذا الرابط خاص بك فقط\n` +
        `• يمكن استخدامه مرة واحدة فقط\n` +
        `• لا تشاركه مع أي شخص آخر`
      );
      
      console.log(`Sent private invite link to verified user ${telegramId}`);
      
      // Optionally approve the join request automatically
      // await telegramService.approveChatJoinRequest(chatId, telegramId);
    } else {
      // Failed to create invite link - fall back to manual approval
      await telegramService.sendMessage(
        telegramId,
        `مرحباً ${escapeMarkdownV2(fullName)}\\!\n\n` +
        `تم التحقق من عضويتك\\. سيتم الموافقة على طلبك قريباً\\.`
      );
      console.log(`Failed to create invite link, sent confirmation to user ${telegramId}`);
    }
  } catch (error) {
    console.error('Error creating/sending invite link:', error);
  }
}

/**
 * Send verification prompt to unverified user
 */
async function sendVerificationPrompt(
  telegramId: number,
  fullName: string,
  telegramService: TelegramService
): Promise<void> {
  try {
    await telegramService.sendMessage(
      telegramId,
      `مرحباً ${escapeMarkdownV2(fullName)}\\!\n\n` +
      `لقد تلقينا طلب انضمامك إلى المجموعة\\.\n\n` +
      `يرجى استخدام الأمر /verify للتحقق من عضويتك حتى تتمكن من الوصول إلى المجموعة\\.`
    );
    console.log(`Sent verification message to unverified user ${telegramId}`);
  } catch (error) {
    console.error('Error sending message to user with bot activated:', error);
  }
}

/**
 * Handle user who doesn't have the bot activated
 * Sends a silent message to the group that auto-deletes
 */
async function handleUserWithoutBot(
  telegramId: number,
  chatId: number,
  fullName: string,
  username: string | undefined,
  telegramService: TelegramService,
  c: Context<{ Bindings: Environment }>
): Promise<void> {
  try {
    const usernameText = username ? `@${escapeMarkdownV2(username)}` : '';
    const messageText = `عزيزي/عزيزتي ${escapeMarkdownV2(fullName)} ${usernameText}\n\n` +
      `يرجى التواصل مع هذا البوت على الخاص حتى تتمكن من الانضمام إلى المجموعة\\.`;
    
    const sentMessageId = await telegramService.sendMessage(
      chatId,
      messageText,
      'MarkdownV2',
      undefined,
      undefined,
      undefined,
      true // disable_notification for silent message
    );
    
    console.log(`Sent silent message to group for user ${telegramId} who doesn't have bot activated`);
    
    // Schedule message deletion after 10 seconds
    // Note: Using waitUntil to ensure the deletion happens even after response is sent
    if (sentMessageId) {
      c.executionCtx.waitUntil(
        (async () => {
          await new Promise(resolve => setTimeout(resolve, 10000));
          await telegramService.deleteMessage(chatId, sentMessageId);
          console.log(`Deleted notification message ${sentMessageId} from group ${chatId}`);
        })()
      );
    }
  } catch (error) {
    console.error('Error sending/deleting message to group:', error);
  }
}
