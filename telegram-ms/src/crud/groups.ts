import { BaseCrud, DatabaseConnection } from './base';
import { Group, GroupModel, GroupAdmin, GroupWithAdmins } from '../models/groups';

export class GroupsCrud extends BaseCrud<Group> {
  constructor(db: DatabaseConnection) {
    super(db, 'groups');
  }

  /**
   * Store a new group with admins
   * @param groupData The group data
   * @param admins List of group admins
   */
  async storeGroup(
    groupData: GroupModel,
    admins?: GroupAdmin[]
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const adminsJson = JSON.stringify(admins || []);
      
      const data: GroupModel = {
        ...groupData,
        admins: adminsJson
      };
      
      return await this.create(data as Omit<Group, 'id'>);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update a group and its admins
   * @param id Group ID
   * @param groupData Updated group data
   * @param admins Updated list of admins (optional)
   */
  async updateGroup(
    id: string,
    groupData: Partial<GroupModel>,
    admins?: GroupAdmin[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = { ...groupData };
      
      if (admins !== undefined) {
        updateData.admins = JSON.stringify(admins);
      }
      
      return await this.update(id, updateData);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get a group by ID with parsed admins
   * @param id Group ID
   */
  async getGroupById(id: string): Promise<GroupWithAdmins | null> {
    try {
      const result = await this.getById(id);
      if (!result) return null;

      return {
        ...result,
        admins: JSON.parse(result.admins || '[]')
      };
    } catch (error) {
      console.error('Error getting group by ID:', error);
      return null;
    }
  }

  /**
   * Get a group by chat_id with parsed admins
   * @param chatId Telegram chat ID
   */
  async getGroupByChatId(chatId: string): Promise<GroupWithAdmins | null> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE chat_id = ?`;
      const result = await this.db.prepare(query).bind(chatId).first<Group>();
      
      if (!result) return null;

      return {
        ...result,
        admins: JSON.parse(result.admins || '[]')
      };
    } catch (error) {
      console.error('Error getting group by chat_id:', error);
      return null;
    }
  }

  /**
   * Get all groups with pagination and parsed admins
   * @param limit Number of groups to retrieve
   * @param offset Offset for pagination
   */
  async getGroups(limit?: number, offset?: number): Promise<GroupWithAdmins[]> {
    try {
      const results = await this.getAll(limit, offset);
      
      return results.map(result => ({
        ...result,
        admins: JSON.parse(result.admins || '[]')
      }));
    } catch (error) {
      console.error('Error getting groups:', error);
      return [];
    }
  }

  /**
   * Get all active groups with parsed admins
   */
  async getActiveGroups(): Promise<GroupWithAdmins[]> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE is_active = 1 ORDER BY created_at DESC`;
      const result = await this.db.prepare(query).bind().all<Group>();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch active groups');
      }
      
      return result.results.map(group => ({
        ...group,
        admins: JSON.parse(group.admins || '[]')
      }));
    } catch (error) {
      console.error('Error getting active groups:', error);
      return [];
    }
  }

  /**
   * Get all active groups that don't need admin approval
   */
  async getPublicGroups(): Promise<GroupWithAdmins[]> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE is_active = 1 AND needs_admin_approval = 0 ORDER BY title ASC`;
      const result = await this.db.prepare(query).bind().all<Group>();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch public groups');
      }
      
      return result.results.map(group => ({
        ...group,
        admins: JSON.parse(group.admins || '[]')
      }));
    } catch (error) {
      console.error('Error getting public groups:', error);
      return [];
    }
  }

  /**
   * Get groups by type with parsed admins
   * @param type Group type (e.g., 'group', 'supergroup', 'channel')
   */
  async getGroupsByType(type: string): Promise<GroupWithAdmins[]> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE type = ? ORDER BY created_at DESC`;
      const result = await this.db.prepare(query).bind(type).all<Group>();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch groups by type');
      }
      
      return result.results.map(group => ({
        ...group,
        admins: JSON.parse(group.admins || '[]')
      }));
    } catch (error) {
      console.error('Error getting groups by type:', error);
      return [];
    }
  }

  /**
   * Update group's active status
   * @param id Group ID
   * @param isActive Whether the group is active
   */
  async setGroupActiveStatus(
    id: string,
    isActive: boolean
  ): Promise<{ success: boolean; error?: string }> {
    return await this.update(id, { is_active: isActive ? 1 : 0 });
  }

  /**
   * Add or update admins for a group
   * @param id Group ID
   * @param admins List of admins
   */
  async updateGroupAdmins(
    id: string,
    admins: GroupAdmin[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const adminsJson = JSON.stringify(admins);
      return await this.update(id, { admins: adminsJson });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if a user is admin of a specific group
   * @param chatId Telegram chat ID
   * @param userId Telegram user ID
   */
  async isUserAdmin(chatId: string, userId: string): Promise<boolean> {
    try {
      const group = await this.getGroupByChatId(chatId);
      if (!group) return false;

      return group.admins.some(admin => admin.user_id === userId);
    } catch (error) {
      console.error('Error checking if user is admin:', error);
      return false;
    }
  }

  /**
   * Get groups where user is admin
   * @param userId Telegram user ID
   */
  async getGroupsByAdmin(userId: string): Promise<GroupWithAdmins[]> {
    try {
      const allGroups = await this.getActiveGroups();
      
      return allGroups.filter(group => 
        group.admins.some(admin => admin.user_id === userId)
      );
    } catch (error) {
      console.error('Error getting groups by admin:', error);
      return [];
    }
  }

  /**
   * Search groups by title
   * @param searchTerm Search term
   * @param limit Limit results
   */
  async searchGroupsByTitle(searchTerm: string, limit: number = 20): Promise<GroupWithAdmins[]> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE title LIKE ? ORDER BY created_at DESC LIMIT ?`;
      const result = await this.db.prepare(query).bind(`%${searchTerm}%`, limit).all<Group>();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to search groups');
      }
      
      return result.results.map(group => ({
        ...group,
        admins: JSON.parse(group.admins || '[]')
      }));
    } catch (error) {
      console.error('Error searching groups:', error);
      return [];
    }
  }

  /**
   * Upsert a group (insert or update based on chat_id)
   * @param groupData The group data
   * @param admins List of group admins
   */
  async upsertGroup(
    groupData: GroupModel,
    admins?: GroupAdmin[]
  ): Promise<{ success: boolean; id?: string; error?: string; isNew?: boolean }> {
    try {
      // Check if group exists
      const existing = await this.getGroupByChatId(groupData.chat_id);
      
      if (existing) {
        // Update existing group
        const updateResult = await this.updateGroup(existing.id, groupData, admins);
        return { ...updateResult, id: existing.id, isNew: false };
      } else {
        // Create new group
        const createResult = await this.storeGroup(groupData, admins);
        return { ...createResult, isNew: true };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
