import { GroupMembersCrud } from '../crud/group-members';
import { DatabaseConnection } from '../crud/base';

/**
 * Service to handle group member tracking from Telegram messages
 */
export class GroupMemberTrackingService {
  private groupMembersCrud: GroupMembersCrud;

  constructor(db: DatabaseConnection) {
    this.groupMembersCrud = new GroupMembersCrud(db);
  }

  /**
   * Process a Telegram message and update member tracking if it contains member changes
   * @param message Telegram message object
   */
  async processMessage(message: any): Promise<void> {
    try {
      const chatId = message.chat.id.toString();

      // Check for new chat members (someone joined or was added)
      if (message.new_chat_members && message.new_chat_members.length > 0) {
        await this.handleNewMembers(chatId, message.new_chat_members, message.from?.id.toString());
      }

      // Check for member who left
      if (message.left_chat_member) {
        await this.handleLeftMember(chatId, message.left_chat_member);
      }

      // Check for chat member status updates (promoted, restricted, etc.)
      if (message.new_chat_participant) {
        await this.handleMemberUpdate(chatId, message.new_chat_participant);
      }

      // Update last_seen for the message sender (if they're a regular message)
      // COMMENTED OUT: This triggers a DB query on EVERY message - too expensive!
      // if (message.from && message.text && !message.new_chat_members && !message.left_chat_member) {
      //   await this.updateLastSeen(chatId, message.from.id.toString());
      // }
    } catch (error) {
      console.error('Error processing member tracking:', error);
    }
  }

  /**
   * Handle new members joining or being added to the group
   */
  private async handleNewMembers(chatId: string, newMembers: any[], invitedBy?: string): Promise<void> {
    for (const member of newMembers) {
      const userId = member.id.toString();
      const userData = {
        username: member.username,
        first_name: member.first_name,
        last_name: member.last_name
      };

      console.log(`New member joined: ${userData.first_name} (${userId}) in chat ${chatId}`);
      
      await this.groupMembersCrud.memberJoined(chatId, userId, userData, invitedBy);
    }
  }

  /**
   * Handle a member leaving the group
   */
  private async handleLeftMember(chatId: string, leftMember: any): Promise<void> {
    const userId = leftMember.id.toString();
    
    console.log(`Member left: ${leftMember.first_name} (${userId}) from chat ${chatId}`);
    
    // Check if member was kicked (by comparing with message sender)
    // If the left member is different from the sender, they were likely kicked
    await this.groupMembersCrud.memberLeft(chatId, userId);
  }

  /**
   * Handle member status updates
   */
  private async handleMemberUpdate(chatId: string, member: any): Promise<void> {
    const userId = member.id.toString();
    const userData = {
      username: member.username,
      first_name: member.first_name,
      last_name: member.last_name
    };

    // Update member data
    await this.groupMembersCrud.upsertMember({
      chat_id: chatId,
      user_id: userId,
      username: userData.username,
      first_name: userData.first_name,
      last_name: userData.last_name
    });
  }

  /**
   * Update member's last seen timestamp
   */
  private async updateLastSeen(chatId: string, userId: string): Promise<void> {
    // Only update if member exists in the database
    const member = await this.groupMembersCrud.getMemberByChatAndUser(chatId, userId);
    
    if (member) {
      await this.groupMembersCrud.updateLastSeen(chatId, userId);
    } else {
      // If member doesn't exist, create a record
      // This handles the case where the bot joined after the member
      await this.groupMembersCrud.memberJoined(chatId, userId, {});
    }
  }

  /**
   * Process chat member updated event (from Telegram API)
   * This is called when getChatMember or when listening to chat_member updates
   */
  async processChatMemberUpdate(update: any): Promise<void> {
    try {
      const chatId = update.chat.id.toString();
      const newMember = update.new_chat_member;
      const oldMember = update.old_chat_member;
      const userId = newMember.user.id.toString();

      const userData = {
        username: newMember.user.username,
        first_name: newMember.user.first_name,
        last_name: newMember.user.last_name
      };

      // Determine what changed
      const oldStatus = oldMember.status;
      const newStatus = newMember.status;

      console.log(`Member status changed: ${userData.first_name} (${userId}) from ${oldStatus} to ${newStatus}`);

      // Handle different status transitions
      if (newStatus === 'member' && (oldStatus === 'left' || oldStatus === 'kicked')) {
        // Member rejoined
        await this.groupMembersCrud.memberJoined(chatId, userId, userData);
      } else if (newStatus === 'left') {
        // Member left
        await this.groupMembersCrud.memberLeft(chatId, userId);
      } else if (newStatus === 'kicked') {
        // Member was kicked
        await this.groupMembersCrud.memberKicked(chatId, userId);
      } else if (newStatus === 'banned') {
        // Member was banned
        await this.groupMembersCrud.memberBanned(chatId, userId);
      } else if (newStatus === 'creator' || newStatus === 'administrator') {
        // Member was promoted
        await this.groupMembersCrud.upsertMember({
          chat_id: chatId,
          user_id: userId,
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          status: newStatus
        });
      } else if (newStatus === 'member' && (oldStatus === 'creator' || oldStatus === 'administrator')) {
        // Member was demoted
        await this.groupMembersCrud.upsertMember({
          chat_id: chatId,
          user_id: userId,
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          status: 'member'
        });
      } else {
        // Just update member data
        await this.groupMembersCrud.upsertMember({
          chat_id: chatId,
          user_id: userId,
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          status: newStatus as any
        });
      }
    } catch (error) {
      console.error('Error processing chat member update:', error);
    }
  }
}
