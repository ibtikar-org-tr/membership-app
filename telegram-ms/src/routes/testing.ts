import { Hono } from 'hono';
import { Environment } from '../types';
import { MemberSheetServices } from '../services/membership-manager/member-sheet-services';
import { TelegramService } from '../services/telegram';
import { authMiddleware } from '../middleware/auth';

const api = new Hono<{ Bindings: Environment }>();

// Apply auth middleware to all API routes
api.use('*', authMiddleware);


api.get('/members', async (c) => {
  try {
    const memberSheetServices = new MemberSheetServices(c.env);
    const members = await memberSheetServices.getMembers();
    
    // Filter out sensitive information
    const publicMembers = members.map(member => ({
      membership_number: member.membership_number,
      latin_name: member.latin_name,
      ar_name: member.ar_name,
      email: member.email,
      telegram_id: member.telegram_id,
      telegram_username: member.telegram_username,
    }));
    
    return c.json({ members: publicMembers });
  } catch (error) {
    console.error('Get members error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

api.get('/members/telegram', async (c) => {
  try {
    const memberSheetServices = new MemberSheetServices(c.env);
    const members = await memberSheetServices.getMembers();
    
    // Only return members with Telegram IDs
    const telegramMembers = members
      .filter(member => member.telegram_id)
      .map(member => ({
        membership_number: member.membership_number,
        latin_name: member.latin_name,
        ar_name: member.ar_name,
        email: member.email,
        telegram_id: member.telegram_id,
        telegram_username: member.telegram_username,
      }));
    
    return c.json({ 
      members: telegramMembers,
      count: telegramMembers.length 
    });
  } catch (error) {
    console.error('Get telegram members error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default api;