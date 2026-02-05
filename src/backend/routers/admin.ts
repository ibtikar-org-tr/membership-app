import { Hono } from 'hono';
import { GoogleAPIService } from '../services/google-api';
import { MoodleAPIService } from '../services/moodle-api';
import { EmailService } from '../services/email';
import { Database } from '../models/database';
import { CloudflareBindings, GoogleSheet, UpdateMemberRequest } from '../models/types';

const adminRouter = new Hono<{ Bindings: CloudflareBindings }>();

// Middleware to check admin authentication (simplified - in real app would use proper JWT)
adminRouter.use('*', async (c, next) => {
  // In a real implementation, you would verify admin JWT token here
  // For now, we'll assume the request is authenticated
  await next();
});

// Configuration Management
adminRouter.get('/config', async (c) => {
  try {
    const db = new Database(c.env.DB);
    
    const googleFormSheet = await db.getGoogleFormSheet();
    const googleSheet = await db.getGoogleSheet();
    
    return c.json({
      success: true,
      config: {
        googleForm: googleFormSheet,
        googleSheet
      }
    });
  } catch (error) {
    console.error('Get config error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

adminRouter.post('/config/google-form-sheet', async (c) => {
  try {
    const formData = await c.req.json<{ google_form_sheet_id: string; corresponding_values: Record<string, string> }>();
    
    const db = new Database(c.env.DB);
    
    const googleFormSheet = await db.createOrUpdateGoogleFormSheet(formData);
    
    await db.createLog({
      user: 'admin',
      action: 'update_google_form_sheet_config',
      status: 'success'
    });
    
    return c.json({ success: true, googleFormSheet });
  } catch (error) {
    console.error('Update Google Form config error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

adminRouter.post('/config/google-sheet', async (c) => {
  try {
    const sheetData = await c.req.json<{ google_sheet_id: string; corresponding_values: Record<string, string> }>();
    
    const db = new Database(c.env.DB);
    
    const googleSheet = await db.createOrUpdateGoogleSheet(sheetData);
    
    await db.createLog({
      user: 'admin',
      action: 'update_google_sheet_config',
      status: 'success'
    });
    
    return c.json({ success: true, googleSheet });
  } catch (error) {
    console.error('Update Google Sheet config error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Member Management
adminRouter.get('/members', async (c) => {
  try {
    const db = new Database(c.env.DB);
    
    // Get Google Sheet configuration
    const sheetConfig = await db.getGoogleSheet();
    if (!sheetConfig) {
      return c.json({ success: false, error: 'Google Sheet configuration not found' }, 400);
    }

    // Create Google API service
    const googleCredentials = typeof c.env.GOOGLE_API_KEY === 'string' 
      ? JSON.parse(c.env.GOOGLE_API_KEY) 
      : c.env.GOOGLE_API_KEY;
    const googleService = new GoogleAPIService(googleCredentials);
    
    // Get all members from Google Sheets
    const range = 'A:Z'; // Get all data
    const data = await googleService.getSheetData(sheetConfig.google_sheet_id, range);
    
    if (data.length === 0) {
      return c.json({ success: true, members: [] });
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    const members = rows.map(row => {
      const member: any = {};
      headers.forEach((header, index) => {
        const memberField = sheetConfig.corresponding_values[header];
        if (memberField && row[index]) {
          member[memberField] = row[index];
        }
      });
      return member;
    });
    
    return c.json({ success: true, members });
  } catch (error) {
    console.error('Get members error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

adminRouter.put('/members/:membershipNumber', async (c) => {
  try {
    const membershipNumber = c.req.param('membershipNumber');
    const updates = await c.req.json<UpdateMemberRequest['updates']>();
    
    const db = new Database(c.env.DB);
    
    // Get Google Sheet configuration
    const sheetConfig = await db.getGoogleSheet();
    if (!sheetConfig) {
      return c.json({ success: false, error: 'Google Sheet configuration not found' }, 400);
    }

    // Create Google API service
    const googleCredentials = typeof c.env.GOOGLE_API_KEY === 'string' 
      ? JSON.parse(c.env.GOOGLE_API_KEY) 
      : c.env.GOOGLE_API_KEY;
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
    
    // Also update in Moodle if password changed
    if (updates.password) {
      const moodleService = new MoodleAPIService(c.env.MOODLE_API_URL, c.env.MOODLE_API_TOKEN);
      const moodleUser = await moodleService.getUserByUsername(membershipNumber);
      if (moodleUser) {
        await moodleService.updateUserPassword(moodleUser.id!, updates.password);
      }
    }
    
    await db.createLog({
      user: 'admin',
      action: `update_member_${membershipNumber}`,
      status: 'success'
    });
    
    return c.json({ success: true, message: 'Member updated successfully' });
  } catch (error) {
    console.error('Update member error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

adminRouter.delete('/members/:membershipNumber', async (c) => {
  try {
    const membershipNumber = c.req.param('membershipNumber');
    
    const db = new Database(c.env.DB);
    
    // Get Google Sheet configuration
    const sheetConfig = await db.getGoogleSheet();
    if (!sheetConfig) {
      return c.json({ success: false, error: 'Google Sheet configuration not found' }, 400);
    }

    // Create Google API service
    const googleCredentials = typeof c.env.GOOGLE_API_KEY === 'string' 
      ? JSON.parse(c.env.GOOGLE_API_KEY) 
      : c.env.GOOGLE_API_KEY;
    const googleService = new GoogleAPIService(googleCredentials);
    
    // Remove member from Google Sheets
    const range = 'A:Z';
    const data = await googleService.getSheetData(sheetConfig.google_sheet_id, range);
    
    if (data.length === 0) {
      return c.json({ success: false, error: 'No data found' }, 404);
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    // Find and remove member row
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
    
    const filteredRows = rows.filter(row => row[membershipColumnIndex] !== membershipNumber);
    
    if (filteredRows.length === rows.length) {
      return c.json({ success: false, error: 'Member not found' }, 404);
    }
    
    // Update the sheet with filtered data
    const updatedData = [headers, ...filteredRows];
    await googleService.updateSheetData(sheetConfig.google_sheet_id, 'A:Z', updatedData);
    
    // Also delete from Moodle
    const moodleService = new MoodleAPIService(c.env.MOODLE_API_URL, c.env.MOODLE_API_TOKEN);
    const moodleUser = await moodleService.getUserByUsername(membershipNumber);
    if (moodleUser) {
      await moodleService.deleteUser(moodleUser.id!);
    }
    
    await db.createLog({
      user: 'admin',
      action: `delete_member_${membershipNumber}`,
      status: 'success'
    });
    
    return c.json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Delete member error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Logs Management
adminRouter.get('/logs', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    
    const db = new Database(c.env.DB);
    
    const logs = await db.getLogs(limit, offset);
    
      return c.json({ success: true, logs });
} catch (error) {
  console.error('Get logs error:', error);
  return c.json({ success: false, error: 'Internal server error' }, 500);
}
});

// Lookup Sheet Columns
adminRouter.post('/lookup-sheet-columns', async (c) => {
try {
  const { google_sheet_id } = await c.req.json<{ google_sheet_id: string }>();
  
  if (!google_sheet_id) {
    return c.json({ success: false, error: 'Google Sheet ID is required' }, 400);
  }

  const db = new Database(c.env.DB);

  // Create Google API service
  const googleCredentials = typeof c.env.GOOGLE_API_KEY === 'string' 
    ? JSON.parse(c.env.GOOGLE_API_KEY) 
    : c.env.GOOGLE_API_KEY;
  const googleService = new GoogleAPIService(googleCredentials);

  // Get the first row (headers) from the sheet
  const range = '1:1'; // First row only
  const data = await googleService.getSheetData(google_sheet_id, range);
  
  if (data.length === 0 || !data[0]) {
    return c.json({ success: false, error: 'No data found in sheet or sheet is empty' }, 404);
  }
  
  const columns = data[0].filter(col => col && col.trim() !== ''); // Filter out empty columns
  
  // Add column letters (A, B, C, etc.) to the response
  const columnsWithLetters = columns.map((columnName, index) => {
    const columnLetter = String.fromCharCode(65 + index); // A=65, B=66, etc.
    return {
      letter: columnLetter,
      name: columnName,
      index: index
    };
  });
  
  await db.createLog({
    user: 'admin',
    action: 'lookup_sheet_columns',
    status: 'success'
  });
  
  return c.json({ 
    success: true, 
    columns: columnsWithLetters,
    message: `Found ${columns.length} columns in the sheet`
  });
} catch (error) {
  console.error('Lookup sheet columns error:', error);
  
  const db = new Database(c.env.DB);
  await db.createLog({
    user: 'admin',
    action: 'lookup_sheet_columns',
    status: 'failed'
  });
  
  return c.json({ success: false, error: 'Failed to lookup sheet columns. Please check the Sheet ID and permissions.' }, 500);
}
});

// Debug Members - Test current mappings
adminRouter.get('/debug-members', async (c) => {
  try {
    const db = new Database(c.env.DB);
    
    // Get Google Sheet configuration
    const sheetConfig = await db.getGoogleSheet();
    if (!sheetConfig) {
      return c.json({ success: false, error: 'Google Sheet configuration not found' }, 400);
    }

    // Create Google API service
    const googleCredentials = typeof c.env.GOOGLE_API_KEY === 'string' 
      ? JSON.parse(c.env.GOOGLE_API_KEY) 
      : c.env.GOOGLE_API_KEY;
    const googleService = new GoogleAPIService(googleCredentials);
    
    // Get raw data from Google Sheets
    const range = 'A:Z'; // Get all data
    const rawData = await googleService.getSheetData(sheetConfig.google_sheet_id, range);
    
    if (rawData.length === 0) {
      return c.json({ success: true, debug: { rawData: [], headers: [], mappings: sheetConfig.corresponding_values, members: [] } });
    }
    
    const headers = rawData[0];
    const rows = rawData.slice(1);
    
    // Process members with current mapping
    const members = rows.map((row, index) => {
      const member: any = { _rowIndex: index + 2 }; // +2 because headers are row 1, data starts at row 2
      headers.forEach((header, headerIndex) => {
        const memberField = sheetConfig.corresponding_values[header];
        if (memberField && row[headerIndex]) {
          member[memberField] = row[headerIndex];
        }
        // Also include raw data for debugging
        member[`_raw_${header}`] = row[headerIndex];
      });
      return member;
    });
    
    await db.createLog({
      user: 'admin',
      action: 'debug_members',
      status: 'success'
    });
    
    return c.json({ 
      success: true, 
      debug: {
        sheetId: sheetConfig.google_sheet_id,
        headers,
        mappings: sheetConfig.corresponding_values,
        totalRows: rows.length,
        sampleRawData: rawData.slice(0, 3), // First 3 rows for debugging
        processedMembers: members.slice(0, 5) // First 5 processed members
      }
    });
  } catch (error) {
    console.error('Debug members error:', error);
    return c.json({ success: false, error: 'Internal server error', details: error.message }, 500);
  }
});

// OAuth Client Management
adminRouter.get('/oauth-clients', async (c) => {
  try {
    const db = new Database(c.env.DB);
    const clients = await db.getAllOAuthClients();

    // Remove sensitive data (client_secret_hash) from response
    const clientsWithoutSecrets = clients.map(client => ({
      id: client.id,
      client_id: client.client_id,
      name: client.name,
      allowed_ips: client.allowed_ips,
      created_at: client.created_at,
      updated_at: client.updated_at,
    }));

    return c.json({
      success: true,
      clients: clientsWithoutSecrets,
    });
  } catch (error) {
    console.error('Get OAuth clients error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

adminRouter.post('/oauth-clients', async (c) => {
  try {
    const { name, allowed_ips } = await c.req.json<{ name: string; allowed_ips?: string }>();

    if (!name) {
      return c.json({ success: false, error: 'Client name is required' }, 400);
    }

    const db = new Database(c.env.DB);

    // Generate client_id and client_secret
    const client_id = `client_${crypto.randomUUID().replace(/-/g, '')}`;
    const client_secret = `secret_${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`;
    
    // Hash the client secret
    const bcrypt = await import('bcryptjs');
    const client_secret_hash = await bcrypt.hash(client_secret, 12);

    const client = await db.createOAuthClient({
      client_id,
      client_secret_hash,
      name,
      allowed_ips: allowed_ips || null,
    });

    await db.createLog({
      user: 'admin',
      action: 'create_oauth_client',
      status: 'success',
    });

    // Return the plain client_secret only once (user must save it)
    return c.json({
      success: true,
      client: {
        id: client.id,
        client_id: client.client_id,
        client_secret: client_secret, // Only returned once!
        name: client.name,
        allowed_ips: client.allowed_ips,
        created_at: client.created_at,
      },
      warning: 'Save the client_secret securely. It will not be shown again!',
    });
  } catch (error) {
    console.error('Create OAuth client error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

adminRouter.put('/oauth-clients/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json<{ name?: string; allowed_ips?: string }>();

    const db = new Database(c.env.DB);
    await db.updateOAuthClient(id, updates);

    await db.createLog({
      user: 'admin',
      action: 'update_oauth_client',
      status: 'success',
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Update OAuth client error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

adminRouter.delete('/oauth-clients/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const db = new Database(c.env.DB);
    await db.deleteOAuthClient(id);

    await db.createLog({
      user: 'admin',
      action: 'delete_oauth_client',
      status: 'success',
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete OAuth client error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Signup Approval Management
adminRouter.get('/pending-signups', async (c) => {
  try {
    const db = new Database(c.env.DB);
    const pendingSignups = await db.getPendingSignups();

    // Remove password hashes from response
    const signupsWithoutPasswords = pendingSignups.map(signup => ({
      ...signup,
      data: {
        ...signup.data,
        password: undefined,
      },
    }));

    return c.json({
      success: true,
      signups: signupsWithoutPasswords,
    });
  } catch (error) {
    console.error('Get pending signups error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

adminRouter.post('/pending-signups/:id/approve', async (c) => {
  try {
    const signupId = c.req.param('id');
    const { membership_number } = await c.req.json<{ membership_number?: string }>();

    const db = new Database(c.env.DB);
    
    // Get the pending signup
    const pendingSignups = await db.getPendingSignups();
    const signup = pendingSignups.find(s => s.id === signupId);

    if (!signup) {
      return c.json({ success: false, error: 'Signup request not found' }, 404);
    }

    // Generate membership number if not provided
    const finalMembershipNumber = membership_number || 
                                  signup.requested_membership_number || 
                                  `${c.env.MEMBERSHIP_NUMBER_PREFIX || 'MEM'}${Date.now().toString().slice(-6)}`;

    // Create user in database
    const user = await db.createUser({
      membership_number: finalMembershipNumber,
      email: signup.email,
      password_hash: signup.data.password, // Already hashed during signup
      role: 'member',
      status: 'active',
      latin_name: signup.data.latin_name,
      phone: signup.data.phone,
      whatsapp: signup.data.whatsapp,
    });

    // Update signup status
    await db.updatePendingSignupStatus(signupId, 'approved');

    // Add to Google Sheet (if configured)
    try {
      const sheetConfig = await db.getGoogleSheet();
      if (sheetConfig) {
        const googleCredentials = typeof c.env.GOOGLE_API_KEY === 'string'
          ? JSON.parse(c.env.GOOGLE_API_KEY)
          : c.env.GOOGLE_API_KEY;
        const googleService = new GoogleAPIService(googleCredentials);

        // Prepare member data for sheet
        const memberData = {
          membership_number: finalMembershipNumber,
          ...signup.data,
          password: crypto.randomUUID().slice(0, 8), // Generate new password for Moodle
        };

        // Add to sheet
        await googleService.addMemberToSheet(
          sheetConfig.google_sheet_id,
          memberData,
          sheetConfig.corresponding_values
        );
      }
    } catch (sheetError) {
      console.error('Failed to add to Google Sheet:', sheetError);
      // Continue even if sheet update fails
    }

    // Send welcome email
    try {
      const emailService = new EmailService({
        host: c.env.SMTP_HOST,
        port: parseInt(c.env.SMTP_PORT),
        user: c.env.SMTP_USER,
        pass: c.env.SMTP_PASS,
      });

      await emailService.sendEmail(
        signup.email,
        'Membership Approved',
        `
Welcome to our membership!

Your account has been approved.

Membership Number: ${finalMembershipNumber}
Email: ${signup.email}

You can now log in using your email or membership number with the password you provided during registration.

Best regards,
Membership Team
        `.trim()
      );
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    await db.createLog({
      user: 'admin',
      action: 'approve_signup',
      status: 'success',
    });

    return c.json({
      success: true,
      user: {
        id: user.id,
        membership_number: user.membership_number,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Approve signup error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

adminRouter.post('/pending-signups/:id/reject', async (c) => {
  try {
    const signupId = c.req.param('id');
    const { reason } = await c.req.json<{ reason?: string }>();

    const db = new Database(c.env.DB);
    
    // Get the pending signup
    const pendingSignups = await db.getPendingSignups();
    const signup = pendingSignups.find(s => s.id === signupId);

    if (!signup) {
      return c.json({ success: false, error: 'Signup request not found' }, 404);
    }

    // Update signup status
    await db.updatePendingSignupStatus(signupId, 'rejected');

    // Send rejection email
    try {
      const emailService = new EmailService({
        host: c.env.SMTP_HOST,
        port: parseInt(c.env.SMTP_PORT),
        user: c.env.SMTP_USER,
        pass: c.env.SMTP_PASS,
      });

      await emailService.sendEmail(
        signup.email,
        'Membership Application Status',
        `
We regret to inform you that your membership application has not been approved at this time.

${reason ? `Reason: ${reason}` : ''}

If you have any questions, please contact us.

Best regards,
Membership Team
        `.trim()
      );
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    await db.createLog({
      user: 'admin',
      action: 'reject_signup',
      status: 'success',
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Reject signup error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

export { adminRouter };
