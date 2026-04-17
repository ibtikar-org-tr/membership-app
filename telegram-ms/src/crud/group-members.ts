import { BaseCrud, DatabaseConnection } from './base';
import { GroupMember, GroupMemberModel, MemberStatus } from '../models/group-members';

export class GroupMembersCrud extends BaseCrud<GroupMember> {
  constructor(db: DatabaseConnection) {
    super(db, 'group_members');
  }

  /**
   * Add or update a group member
   * @param memberData The member data
   */
  async upsertMember(memberData: GroupMemberModel): Promise<{ success: boolean; id?: string; error?: string; isNew?: boolean }> {
    try {
      // Check if member exists
      const existing = await this.getMemberByChatAndUser(memberData.chat_id, memberData.user_id);
      
      if (existing) {
        // Update existing member
        const updateResult = await this.update(existing.id, memberData);
        return { ...updateResult, id: existing.id, isNew: false };
      } else {
        // Create new member
        const createResult = await this.create(memberData as Omit<GroupMember, 'id'>);
        return { ...createResult, isNew: true };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get a member by chat_id and user_id
   * @param chatId Telegram chat ID
   * @param userId Telegram user ID
   */
  async getMemberByChatAndUser(chatId: string, userId: string): Promise<GroupMember | null> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE chat_id = ? AND user_id = ?`;
      const result = await this.db.prepare(query).bind(chatId, userId).first<GroupMember>();
      return result;
    } catch (error) {
      console.error('Error getting member:', error);
      return null;
    }
  }

  /**
   * Get all members of a group
   * @param chatId Telegram chat ID
   * @param status Optional status filter
   */
  async getMembersByChat(chatId: string, status?: MemberStatus): Promise<GroupMember[]> {
    try {
      let query = `SELECT * FROM ${this.tableName} WHERE chat_id = ?`;
      const params: any[] = [chatId];
      
      if (status) {
        query += ` AND status = ?`;
        params.push(status);
      }
      
      query += ` ORDER BY joined_at DESC`;
      
      const result = await this.db.prepare(query).bind(...params).all<GroupMember>();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch members');
      }
      
      return result.results;
    } catch (error) {
      console.error('Error getting members by chat:', error);
      return [];
    }
  }

  /**
   * Get all groups a user is member of
   * @param userId Telegram user ID
   * @param status Optional status filter
   */
  async getGroupsByUser(userId: string, status?: MemberStatus): Promise<GroupMember[]> {
    try {
      let query = `SELECT * FROM ${this.tableName} WHERE user_id = ?`;
      const params: any[] = [userId];
      
      if (status) {
        query += ` AND status = ?`;
        params.push(status);
      }
      
      query += ` ORDER BY joined_at DESC`;
      
      const result = await this.db.prepare(query).bind(...params).all<GroupMember>();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch groups');
      }
      
      return result.results;
    } catch (error) {
      console.error('Error getting groups by user:', error);
      return [];
    }
  }

  /**
   * Update member status
   * @param chatId Telegram chat ID
   * @param userId Telegram user ID
   * @param status New status
   */
  async updateMemberStatus(
    chatId: string,
    userId: string,
    status: MemberStatus
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const member = await this.getMemberByChatAndUser(chatId, userId);
      
      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      const updateData: Partial<GroupMemberModel> = { status };
      
      // Set left_at timestamp for left/kicked/banned statuses
      if (['left', 'kicked', 'banned'].includes(status)) {
        updateData.left_at = new Date().toISOString();
      }

      return await this.update(member.id, updateData);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Mark member as joined
   * @param chatId Telegram chat ID
   * @param userId Telegram user ID
   * @param userData Optional user data
   * @param invitedBy Optional inviter user ID
   */
  async memberJoined(
    chatId: string,
    userId: string,
    userData?: { username?: string; first_name?: string; last_name?: string },
    invitedBy?: string
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const memberData: GroupMemberModel = {
      chat_id: chatId,
      user_id: userId,
      username: userData?.username || null,
      first_name: userData?.first_name || null,
      last_name: userData?.last_name || null,
      status: 'member',
      joined_at: new Date().toISOString(),
      invited_by: invitedBy || null,
      left_at: null
    };

    return await this.upsertMember(memberData);
  }

  /**
   * Mark member as left
   * @param chatId Telegram chat ID
   * @param userId Telegram user ID
   */
  async memberLeft(chatId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    return await this.updateMemberStatus(chatId, userId, 'left');
  }

  /**
   * Mark member as kicked
   * @param chatId Telegram chat ID
   * @param userId Telegram user ID
   */
  async memberKicked(chatId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    return await this.updateMemberStatus(chatId, userId, 'kicked');
  }

  /**
   * Mark member as banned
   * @param chatId Telegram chat ID
   * @param userId Telegram user ID
   */
  async memberBanned(chatId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    return await this.updateMemberStatus(chatId, userId, 'banned');
  }

  /**
   * Update member's last seen timestamp
   * @param chatId Telegram chat ID
   * @param userId Telegram user ID
   */
  async updateLastSeen(chatId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const member = await this.getMemberByChatAndUser(chatId, userId);
      
      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      return await this.update(member.id, { last_seen: new Date().toISOString() });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get active members count for a group
   * @param chatId Telegram chat ID
   */
  async getActiveMemberCount(chatId: string): Promise<number> {
    try {
      const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE chat_id = ? AND status IN ('member', 'creator', 'administrator')`;
      const result = await this.db.prepare(query).bind(chatId).first<{ count: number }>();
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting active member count:', error);
      return 0;
    }
  }

  /**
   * Get members who joined in a date range
   * @param chatId Telegram chat ID
   * @param startDate Start date (ISO string)
   * @param endDate End date (ISO string)
   */
  async getMembersJoinedBetween(chatId: string, startDate: string, endDate: string): Promise<GroupMember[]> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE chat_id = ? AND joined_at BETWEEN ? AND ? ORDER BY joined_at DESC`;
      const result = await this.db.prepare(query).bind(chatId, startDate, endDate).all<GroupMember>();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch members');
      }
      
      return result.results;
    } catch (error) {
      console.error('Error getting members by date range:', error);
      return [];
    }
  }

  /**
   * Get members who left/were kicked/banned
   * @param chatId Telegram chat ID
   * @param limit Limit results
   */
  async getLeftMembers(chatId: string, limit: number = 100): Promise<GroupMember[]> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE chat_id = ? AND status IN ('left', 'kicked', 'banned') ORDER BY left_at DESC LIMIT ?`;
      const result = await this.db.prepare(query).bind(chatId, limit).all<GroupMember>();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch left members');
      }
      
      return result.results;
    } catch (error) {
      console.error('Error getting left members:', error);
      return [];
    }
  }

  /**
   * Delete member record (hard delete)
   * @param chatId Telegram chat ID
   * @param userId Telegram user ID
   */
  async deleteMember(chatId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const member = await this.getMemberByChatAndUser(chatId, userId);
      
      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      return await this.delete(member.id);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
