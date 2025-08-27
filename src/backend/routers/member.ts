import { Hono } from 'hono';
import { GoogleAPIService } from '../services/google-api';
import { MoodleAPIService } from '../services/moodle-api';
import { Database } from '../models/database';
import { CloudflareBindings, MemberInfo } from '../models/types';

const memberRouter = new Hono<{ Bindings: CloudflareBindings }>();

// Get member information
memberRouter.get('/:membershipNumber', async (c) => {
  try {
    const membershipNumber = c.req.param('membershipNumber');
    
    const db = new Database(c.env.DB);
    
    // Get Google Sheet configuration
    const sheetConfig = await db.getGoogleSheet();
    if (!sheetConfig) {
      return c.json({ success: false, error: 'Google Sheet configuration not found' }, 400);
    }

    // Create Google API service
    const googleCredentials = JSON.parse(c.env.GOOGLE_API_KEY);
    const googleService = new GoogleAPIService(googleCredentials);
    
    // Find member in Google Sheets
    const member = await googleService.findMemberByIdentifier(
      sheetConfig.google_sheet_id,
      membershipNumber,
      sheetConfig.corresponding_values
    );

    if (!member) {
      return c.json({ success: false, error: 'Member not found' }, 404);
    }

    // Remove password from response
    const { password, ...memberInfo } = member;
    
    await db.createLog({
      user: membershipNumber,
      action: 'view_profile',
      status: 'success'
    });
    
    return c.json({ success: true, member: memberInfo });
  } catch (error) {
    console.error('Get member error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Update member information
memberRouter.put('/:membershipNumber', async (c) => {
  try {
    const membershipNumber = c.req.param('membershipNumber');
    const updates = await c.req.json<Partial<MemberInfo>>();
    
    const db = new Database(c.env.DB);
    
    // Get Google Sheet configuration
    const sheetConfig = await db.getGoogleSheet();
    if (!sheetConfig) {
      return c.json({ success: false, error: 'Google Sheet configuration not found' }, 400);
    }

    // Create Google API service
    const googleCredentials = JSON.parse(c.env.GOOGLE_API_KEY);
    const googleService = new GoogleAPIService(googleCredentials);
    
    // Update member in Google Sheets
    const range = 'A:Z';
    const data = await googleService.getSheetData(sheetConfig.google_sheet_id, range);
    
    if (data.length === 0) {
      return c.json({ success: false, error: 'No data found' }, 404);
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    // Find member row
    const membershipColumnHeader = Object.keys(sheetConfig.corresponding_values).find(
      key => sheetConfig.corresponding_values[key] === 'membership_number'
    );
    
    if (!membershipColumnHeader) {
      return c.json({ success: false, error: 'Membership number column not configured' }, 400);
    }
    
    const membershipColumnIndex = headers.indexOf(membershipColumnHeader);
    if (membershipColumnIndex === -1) {
      return c.json({ success: false, error: 'Membership number column not found' }, 400);
    }
    
    let memberRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][membershipColumnIndex] === membershipNumber) {
        memberRowIndex = i;
        break;
      }
    }
    
    if (memberRowIndex === -1) {
      return c.json({ success: false, error: 'Member not found' }, 404);
    }
    
    // Update the row with new values
    Object.entries(updates).forEach(([field, value]) => {
      const columnHeader = Object.keys(sheetConfig.corresponding_values).find(
        key => sheetConfig.corresponding_values[key] === field
      );
      
      if (columnHeader) {
        const columnIndex = headers.indexOf(columnHeader);
        if (columnIndex !== -1) {
          rows[memberRowIndex][columnIndex] = value;
        }
      }
    });
    
    // Update the entire sheet
    const updatedData = [headers, ...rows];
    await googleService.updateSheetData(sheetConfig.google_sheet_id, 'A:Z', updatedData);
    
    // Also update in Moodle if relevant fields changed
    if (updates.password || updates.email || updates.latin_name || updates.phone || updates.whatsapp) {
      const moodleService = new MoodleAPIService(c.env.MOODLE_API_URL, c.env.MOODLE_API_TOKEN);
      const moodleUser = await moodleService.getUserByUsername(membershipNumber);
      
      if (moodleUser) {
        const moodleUpdates: any = {};
        
        if (updates.password) moodleUpdates.password = updates.password;
        if (updates.email) moodleUpdates.email = updates.email;
        if (updates.latin_name) {
          const nameParts = updates.latin_name.split(' ');
          moodleUpdates.firstname = nameParts[0] || updates.latin_name;
          moodleUpdates.lastname = nameParts.slice(1).join(' ') || '';
        }
        if (updates.phone) moodleUpdates.phone1 = updates.phone;
        if (updates.whatsapp) moodleUpdates.phone2 = updates.whatsapp;
        
        await moodleService.updateUser(moodleUser.id!, moodleUpdates);
      }
    }
    
    await db.createLog({
      user: membershipNumber,
      action: 'update_profile',
      status: 'success'
    });
    
    return c.json({ success: true, message: 'Member updated successfully' });
  } catch (error) {
    console.error('Update member error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Change password
memberRouter.post('/:membershipNumber/change-password', async (c) => {
  try {
    const membershipNumber = c.req.param('membershipNumber');
    const { current_password, new_password } = await c.req.json<{ current_password: string; new_password: string }>();
    
    const db = new Database(c.env.DB);
    
    // Get Google Sheet configuration
    const sheetConfig = await db.getGoogleSheet();
    if (!sheetConfig) {
      return c.json({ success: false, error: 'Google Sheet configuration not found' }, 400);
    }

    // Create Google API service
    const googleCredentials = JSON.parse(c.env.GOOGLE_API_KEY);
    const googleService = new GoogleAPIService(googleCredentials);
    
    // Find and verify current member
    const member = await googleService.findMemberByIdentifier(
      sheetConfig.google_sheet_id,
      membershipNumber,
      sheetConfig.corresponding_values
    );

    if (!member) {
      return c.json({ success: false, error: 'Member not found' }, 404);
    }

    // Verify current password
    if (member.password !== current_password) {
      await db.createLog({
        user: membershipNumber,
        action: 'change_password',
        status: 'failed_invalid_current_password'
      });
      
      return c.json({ success: false, error: 'Current password is incorrect' }, 400);
    }

    // Update password in Google Sheets
    await googleService.updateMemberPassword(
      sheetConfig.google_sheet_id,
      membershipNumber,
      new_password,
      sheetConfig.corresponding_values
    );
    
    // Update password in Moodle
    const moodleService = new MoodleAPIService(c.env.MOODLE_API_URL, c.env.MOODLE_API_TOKEN);
    const moodleUser = await moodleService.getUserByUsername(membershipNumber);
    if (moodleUser) {
      await moodleService.updateUserPassword(moodleUser.id!, new_password);
    }
    
    await db.createLog({
      user: membershipNumber,
      action: 'change_password',
      status: 'success'
    });
    
    return c.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

export { memberRouter };
