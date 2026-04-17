import { Hono } from 'hono';
import { Environment } from '../types';
import { D1DatabaseConnection } from '../crud/database';
import { GroupsCrud } from '../crud/groups';
import { authMiddleware } from '../middleware/auth';
import { GroupAdmin, GroupModel } from '../models/groups';

const groupsRouter = new Hono<{ Bindings: Environment }>();

// Apply auth middleware to all group routes
groupsRouter.use('*', authMiddleware);

/**
 * POST /groups/store
 * Store or update a group by fetching all info from Telegram API
 * Body: {
 *   chat_id: string (required) - The Telegram chat ID,
 *   needs_admin_approval?: boolean (optional) - Whether admin approval is required,
 *   notes?: string (optional) - Additional notes
 * }
 * 
 * The bot will automatically fetch:
 * - Group title, type, username, description
 * - Current member count
 * - List of all administrators
 */
groupsRouter.post('/store', async (c) => {
  try {
    const body = await c.req.json();
    
    const { 
      chat_id, 
      needs_admin_approval,
      notes 
    } = body;

    // Validate required fields
    if (!chat_id) {
      return c.json({ 
        error: 'Missing required field: chat_id' 
      }, 400);
    }

    const groupsCrud = new GroupsCrud(new D1DatabaseConnection(c.env.TELEGRAM_DB));
    const telegramService = new (await import('../services/telegram')).TelegramService(c.env);

    // Fetch group info from Telegram
    let chatInfo;
    try {
      chatInfo = await telegramService.getChat(chat_id);
    } catch (error) {
      return c.json({ 
        error: 'Failed to fetch group info from Telegram. Make sure the bot is an admin in this group.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }

    // Fetch administrators
    let adminsList: GroupAdmin[] = [];
    try {
      const chatAdmins = await telegramService.getChatAdministrators(chat_id);
      adminsList = chatAdmins.map((admin: any) => ({
        user_id: admin.user.id.toString(),
        username: admin.user.username,
        first_name: admin.user.first_name,
        last_name: admin.user.last_name,
        status: admin.status === 'creator' ? 'creator' : 'administrator'
      }));
    } catch (error) {
      console.warn('Failed to fetch administrators, continuing with empty list:', error);
    }

    // Fetch member count
    let memberCount = 0;
    try {
      memberCount = await telegramService.getChatMemberCount(chat_id);
    } catch (error) {
      console.warn('Failed to fetch member count:', error);
    }

    // Build group data from Telegram info
    const groupData: GroupModel = {
      chat_id: chat_id.toString(),
      title: chatInfo.title || 'Unknown',
      type: chatInfo.type || 'group',
      username: chatInfo.username || null,
      description: chatInfo.description || null,
      invite_link: chatInfo.invite_link || null,
      is_active: 1,
      member_count: memberCount || null,
      needs_admin_approval: needs_admin_approval ? 1 : 0,
      notes: notes || null
    };

    // Upsert the group (create if new, update if exists)
    const result = await groupsCrud.upsertGroup(groupData, adminsList);

    if (!result.success) {
      return c.json({ 
        error: result.error || 'Failed to store group' 
      }, 500);
    }

    // Fetch the stored group to return complete info
    const storedGroup = await groupsCrud.getGroupById(result.id!);

    return c.json({ 
      success: true,
      id: result.id,
      isNew: result.isNew,
      message: result.isNew ? 'Group created successfully' : 'Group updated successfully',
      group: storedGroup,
      admins_count: adminsList.length,
      member_count: memberCount
    });
  } catch (error) {
    console.error('Store group error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /groups/sync/:chatId
 * Sync/refresh group data from Telegram API
 * Updates group info and admins list
 */
groupsRouter.post('/sync/:chatId', async (c) => {
  try {
    const chatId = c.req.param('chatId');

    const groupsCrud = new GroupsCrud(new D1DatabaseConnection(c.env.TELEGRAM_DB));
    const telegramService = new (await import('../services/telegram')).TelegramService(c.env);

    // Check if group exists
    const existingGroup = await groupsCrud.getGroupByChatId(chatId);
    if (!existingGroup) {
      return c.json({ 
        error: 'Group not found. Use /store endpoint to add it first.' 
      }, 404);
    }

    // Fetch updated group info from Telegram
    let chatInfo;
    try {
      chatInfo = await telegramService.getChat(chatId);
    } catch (error) {
      return c.json({ 
        error: 'Failed to fetch group info from Telegram.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }

    // Fetch administrators
    let adminsList: GroupAdmin[] = [];
    try {
      const chatAdmins = await telegramService.getChatAdministrators(chatId);
      adminsList = chatAdmins.map((admin: any) => ({
        user_id: admin.user.id.toString(),
        username: admin.user.username,
        first_name: admin.user.first_name,
        last_name: admin.user.last_name,
        status: admin.status === 'creator' ? 'creator' : 'administrator'
      }));
    } catch (error) {
      console.warn('Failed to fetch administrators:', error);
    }

    // Fetch member count
    let memberCount = 0;
    try {
      memberCount = await telegramService.getChatMemberCount(chatId);
    } catch (error) {
      console.warn('Failed to fetch member count:', error);
    }

    // Update group data
    const updateData: Partial<GroupModel> = {
      title: chatInfo.title || existingGroup.title,
      type: chatInfo.type || existingGroup.type,
      username: chatInfo.username || null,
      description: chatInfo.description || null,
      invite_link: chatInfo.invite_link || null,
      member_count: memberCount || existingGroup.member_count
    };

    const result = await groupsCrud.updateGroup(existingGroup.id, updateData, adminsList);

    if (!result.success) {
      return c.json({ 
        error: result.error || 'Failed to sync group' 
      }, 500);
    }

    // Fetch updated group
    const updatedGroup = await groupsCrud.getGroupById(existingGroup.id);

    return c.json({ 
      success: true,
      message: 'Group synced successfully',
      group: updatedGroup,
      admins_count: adminsList.length,
      member_count: memberCount
    });
  } catch (error) {
    console.error('Sync group error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /groups/sync-all
 * Sync/refresh all active groups from Telegram API
 * This will iterate through all stored groups and update their data
 * Query params: 
 *   - active_only (boolean, default: true) - Only sync active groups
 *   - batch_size (number, default: 10) - Number of groups to process in parallel
 */
groupsRouter.post('/sync-all', async (c) => {
  try {
    const activeOnly = c.req.query('active_only') !== 'false'; // Default true
    const batchSize = parseInt(c.req.query('batch_size') || '10');

    const groupsCrud = new GroupsCrud(new D1DatabaseConnection(c.env.TELEGRAM_DB));
    const telegramService = new (await import('../services/telegram')).TelegramService(c.env);

    // Get all groups to sync
    const groups = activeOnly 
      ? await groupsCrud.getActiveGroups()
      : await groupsCrud.getGroups(1000, 0); // Get up to 1000 groups

    if (groups.length === 0) {
      return c.json({ 
        success: true,
        message: 'No groups to sync',
        total: 0,
        synced: 0,
        failed: 0
      });
    }

    console.log(`Starting sync for ${groups.length} groups...`);

    const results = {
      total: groups.length,
      synced: 0,
      failed: 0,
      errors: [] as Array<{ chat_id: string; title: string; error: string }>
    };

    // Process groups in batches
    for (let i = 0; i < groups.length; i += batchSize) {
      const batch = groups.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (group) => {
          try {
            // Fetch updated group info from Telegram
            const chatInfo = await telegramService.getChat(group.chat_id);

            // Fetch administrators
            let adminsList: GroupAdmin[] = [];
            try {
              const chatAdmins = await telegramService.getChatAdministrators(group.chat_id);
              adminsList = chatAdmins.map((admin: any) => ({
                user_id: admin.user.id.toString(),
                username: admin.user.username,
                first_name: admin.user.first_name,
                last_name: admin.user.last_name,
                status: admin.status === 'creator' ? 'creator' : 'administrator'
              }));
            } catch (error) {
              console.warn(`Failed to fetch administrators for ${group.chat_id}:`, error);
            }

            // Fetch member count
            let memberCount = 0;
            try {
              memberCount = await telegramService.getChatMemberCount(group.chat_id);
            } catch (error) {
              console.warn(`Failed to fetch member count for ${group.chat_id}:`, error);
            }

            // Update group data
            const updateData: Partial<GroupModel> = {
              title: chatInfo.title || group.title,
              type: chatInfo.type || group.type,
              username: chatInfo.username || null,
              description: chatInfo.description || null,
              invite_link: chatInfo.invite_link || null,
              member_count: memberCount || group.member_count
            };

            const result = await groupsCrud.updateGroup(group.id, updateData, adminsList);

            if (result.success) {
              results.synced++;
              console.log(`✓ Synced: ${group.title} (${group.chat_id})`);
            } else {
              results.failed++;
              results.errors.push({
                chat_id: group.chat_id,
                title: group.title,
                error: result.error || 'Unknown error'
              });
              console.error(`✗ Failed to sync: ${group.title} (${group.chat_id}) - ${result.error}`);
            }
          } catch (error) {
            results.failed++;
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            results.errors.push({
              chat_id: group.chat_id,
              title: group.title,
              error: errorMsg
            });
            console.error(`✗ Error syncing: ${group.title} (${group.chat_id}) - ${errorMsg}`);
          }
        })
      );

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < groups.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Sync completed: ${results.synced} synced, ${results.failed} failed`);

    return c.json({ 
      success: true,
      message: `Synced ${results.synced} out of ${results.total} groups`,
      ...results
    });
  } catch (error) {
    console.error('Sync all groups error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /groups
 * Get all groups with pagination
 * Query params: limit, offset
 */
groupsRouter.get('/', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const groupsCrud = new GroupsCrud(new D1DatabaseConnection(c.env.TELEGRAM_DB));
    const groups = await groupsCrud.getGroups(limit, offset);

    return c.json({ 
      success: true,
      groups,
      count: groups.length
    });
  } catch (error) {
    console.error('Get groups error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /groups/active
 * Get all active groups
 */
groupsRouter.get('/active', async (c) => {
  try {
    const groupsCrud = new GroupsCrud(new D1DatabaseConnection(c.env.TELEGRAM_DB));
    const groups = await groupsCrud.getActiveGroups();

    return c.json({ 
      success: true,
      groups,
      count: groups.length
    });
  } catch (error) {
    console.error('Get active groups error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /groups/:id
 * Get a group by ID
 */
groupsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const groupsCrud = new GroupsCrud(new D1DatabaseConnection(c.env.TELEGRAM_DB));
    const group = await groupsCrud.getGroupById(id);

    if (!group) {
      return c.json({ 
        error: 'Group not found' 
      }, 404);
    }

    return c.json({ 
      success: true,
      group
    });
  } catch (error) {
    console.error('Get group by ID error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /groups/chat/:chatId
 * Get a group by chat ID
 */
groupsRouter.get('/chat/:chatId', async (c) => {
  try {
    const chatId = c.req.param('chatId');

    const groupsCrud = new GroupsCrud(new D1DatabaseConnection(c.env.TELEGRAM_DB));
    const group = await groupsCrud.getGroupByChatId(chatId);

    if (!group) {
      return c.json({ 
        error: 'Group not found' 
      }, 404);
    }

    return c.json({ 
      success: true,
      group
    });
  } catch (error) {
    console.error('Get group by chat ID error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * PUT /groups/:id/admins
 * Update group admins
 * Body: {
 *   admins: Array<{ user_id: string, username?: string, first_name?: string, last_name?: string, status: 'creator' | 'administrator' }>
 * }
 */
groupsRouter.put('/:id/admins', async (c) => {
  try {
    const id = c.req.param('id');
    const { admins } = await c.req.json();

    if (!admins || !Array.isArray(admins)) {
      return c.json({ 
        error: 'admins must be an array' 
      }, 400);
    }

    // Validate each admin object
    for (const admin of admins) {
      if (!admin.user_id) {
        return c.json({ 
          error: 'Each admin must have a user_id' 
        }, 400);
      }
      if (admin.status && !['creator', 'administrator'].includes(admin.status)) {
        return c.json({ 
          error: 'Admin status must be either "creator" or "administrator"' 
        }, 400);
      }
    }

    const groupsCrud = new GroupsCrud(new D1DatabaseConnection(c.env.TELEGRAM_DB));
    const result = await groupsCrud.updateGroupAdmins(id, admins);

    if (!result.success) {
      return c.json({ 
        error: result.error || 'Failed to update admins' 
      }, 500);
    }

    return c.json({ 
      success: true,
      message: 'Admins updated successfully'
    });
  } catch (error) {
    console.error('Update admins error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * PUT /groups/:id/status
 * Update group active status
 * Body: { is_active: boolean }
 */
groupsRouter.put('/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const { is_active } = await c.req.json();

    if (typeof is_active !== 'boolean') {
      return c.json({ 
        error: 'is_active must be a boolean' 
      }, 400);
    }

    const groupsCrud = new GroupsCrud(new D1DatabaseConnection(c.env.TELEGRAM_DB));
    const result = await groupsCrud.setGroupActiveStatus(id, is_active);

    if (!result.success) {
      return c.json({ 
        error: result.error || 'Failed to update status' 
      }, 500);
    }

    return c.json({ 
      success: true,
      message: 'Group status updated successfully'
    });
  } catch (error) {
    console.error('Update status error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /groups/search/:term
 * Search groups by title
 */
groupsRouter.get('/search/:term', async (c) => {
  try {
    const term = c.req.param('term');
    const limit = parseInt(c.req.query('limit') || '20');

    const groupsCrud = new GroupsCrud(new D1DatabaseConnection(c.env.TELEGRAM_DB));
    const groups = await groupsCrud.searchGroupsByTitle(term, limit);

    return c.json({ 
      success: true,
      groups,
      count: groups.length
    });
  } catch (error) {
    console.error('Search groups error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /groups/admin/:userId
 * Get groups where user is admin
 */
groupsRouter.get('/admin/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');

    const groupsCrud = new GroupsCrud(new D1DatabaseConnection(c.env.TELEGRAM_DB));
    const groups = await groupsCrud.getGroupsByAdmin(userId);

    return c.json({ 
      success: true,
      groups,
      count: groups.length
    });
  } catch (error) {
    console.error('Get groups by admin error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * DELETE /groups/:id
 * Delete a group (soft delete by setting is_active to 0)
 */
groupsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const groupsCrud = new GroupsCrud(new D1DatabaseConnection(c.env.TELEGRAM_DB));
    const result = await groupsCrud.setGroupActiveStatus(id, false);

    if (!result.success) {
      return c.json({ 
        error: result.error || 'Failed to delete group' 
      }, 500);
    }

    return c.json({ 
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    return c.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default groupsRouter;
