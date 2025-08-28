import { GoogleAPIService } from './google-api';
import { MoodleAPIService } from './moodle-api';
import { EmailService } from './email';
import { AuthService } from './auth';
import { Database } from '../models/database';
import { CloudflareBindings, MemberInfo } from '../models/types';

export class CronJobService {
  private db: Database;
  private googleService: GoogleAPIService;
  private moodleService: MoodleAPIService;
  private emailService: EmailService;
  private authService: AuthService;
  private env: CloudflareBindings;

  constructor(env: CloudflareBindings) {
    this.env = env;
    this.db = new Database(env.DB);
    
    // Validate required environment variables
    if (!env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY environment variable is required');
    }
    
    let googleCredentials;
    try {
      googleCredentials = JSON.parse(env.GOOGLE_API_KEY);
    } catch (error) {
      throw new Error('GOOGLE_API_KEY must be valid JSON: ' + error.message);
    }
    
    this.googleService = new GoogleAPIService(googleCredentials);
    
    if (!env.MOODLE_API_URL || !env.MOODLE_API_TOKEN) {
      throw new Error('MOODLE_API_URL and MOODLE_API_TOKEN environment variables are required');
    }
    this.moodleService = new MoodleAPIService(env.MOODLE_API_URL, env.MOODLE_API_TOKEN);
    
    if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS) {
      throw new Error('SMTP configuration environment variables are required');
    }
    this.emailService = new EmailService({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT),
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    });
    
    if (!env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    this.authService = new AuthService(this.db, this.googleService, env.JWT_SECRET);
  }

  async processNewRegistrations(): Promise<void> {
    try {
      console.log('Starting cron job: Processing new registrations');
      
      // Get Google Form Sheet and Member Sheet configurations
      const formSheetConfig = await this.db.getGoogleFormSheet(); // Now represents form sheet config
      const memberSheetConfig = await this.db.getGoogleSheet(); // Member sheet config
      
      if (!formSheetConfig || !memberSheetConfig) {
        console.log('Missing Google Form Sheet or Member Sheet configuration');
        await this.db.createLog({
          user: 'system',
          action: 'cron_process_registrations',
          status: 'failed_missing_config'
        });
        return;
      }

      // Get form sheet data (responses from Google Form)
      const formSheetData = await this.googleService.getSheetData(formSheetConfig.google_form_sheet_id, 'A:Z');
      
      if (formSheetData.length <= 1) {
        console.log('No form responses found in sheet');
        return;
      }

      // Get existing members from member sheet to check for duplicates
      const memberSheetData = await this.googleService.getSheetData(memberSheetConfig.google_sheet_id, 'A:Z');
      const existingMembers = new Map<string, MemberInfo>(); // key: email or phone, value: member info
      
      if (memberSheetData.length > 1) {
        const memberHeaders = memberSheetData[0];
        const memberRows = memberSheetData.slice(1);
        
        // Extract existing member information for duplicate checking
        memberRows.forEach(row => {
          const memberData: any = {};
          
          // Map sheet columns to member fields
          memberHeaders.forEach((header, index) => {
            const memberField = memberSheetConfig.corresponding_values[header];
            if (memberField && row[index]) {
              memberData[memberField] = row[index];
            }
          });
          
          // Store by email and phone for duplicate detection
          if (memberData.email) {
            existingMembers.set(memberData.email.toLowerCase(), memberData as MemberInfo);
          }
          if (memberData.phone) {
            existingMembers.set(memberData.phone, memberData as MemberInfo);
          }
        });
      }

      let processedCount = 0;
      const formHeaders = formSheetData[0];
      const formRows = formSheetData.slice(1);
      
      for (const formRow of formRows) {
        try {
          // Extract member information from form sheet row
          const memberInfo = this.extractMemberInfoFromSheetRow(formRow, formHeaders, formSheetConfig.corresponding_values);
          
          if (!memberInfo || !memberInfo.email) {
            console.log('Invalid member info extracted from sheet row');
            continue;
          }

          // Check for duplicates by email and phone
          const emailKey = memberInfo.email?.toLowerCase();
          const phoneKey = memberInfo.phone;
          
          let duplicateInfo: MemberInfo | null = null;
          if (emailKey && existingMembers.has(emailKey)) {
            duplicateInfo = existingMembers.get(emailKey)!;
          } else if (phoneKey && existingMembers.has(phoneKey)) {
            duplicateInfo = existingMembers.get(phoneKey)!;
          }

          if (duplicateInfo) {
            console.log(`Duplicate member found - Email: ${memberInfo.email}, Phone: ${memberInfo.phone}`);
            
            // Send duplicate notification email
            try {
              await this.emailService.sendDuplicateNotificationEmail(memberInfo, duplicateInfo);
              
              // Log duplicate status
              await this.db.createLog({
                user: duplicateInfo.membership_number || 'unknown',
                action: 'cron_duplicate_registration_detected',
                status: 'duplicate'
              });
              
              console.log(`Sent duplicate notification to: ${memberInfo.email}`);
            } catch (error) {
              console.error(`Error sending duplicate notification:`, error);
            }
            
            continue;
          }

          // Generate new membership number and password for new member
          memberInfo.membership_number = await this.generateMembershipNumber();
          const temporaryPassword = this.authService.generateRandomPassword(7);
          memberInfo.password = temporaryPassword;

          // Check if user already exists in Moodle
          const existingMoodleUser = await this.moodleService.getUserByEmail(memberInfo.email);
          if (existingMoodleUser) {
            console.log(`Moodle user with email ${memberInfo.email} already exists, updating password`);
            // Update password in Moodle instead of creating new user
            await this.moodleService.updateUserPassword(existingMoodleUser.id, temporaryPassword);
          } else {
            // Create user in Moodle
            const moodleUserId = await this.moodleService.createUser(memberInfo);
            console.log(`Created Moodle user with ID: ${moodleUserId}`);
          }

          // Add member to Member Sheet
          await this.addMemberToMemberSheet(memberInfo, memberSheetConfig);

          // Send welcome email
          await this.emailService.sendWelcomeEmail(memberInfo, temporaryPassword);

          // Add to existing members map to avoid duplicates in this same run
          if (memberInfo.email) {
            existingMembers.set(memberInfo.email.toLowerCase(), memberInfo);
          }
          if (memberInfo.phone) {
            existingMembers.set(memberInfo.phone, memberInfo);
          }

          // Log successful processing
          await this.db.createLog({
            user: memberInfo.membership_number,
            action: 'cron_new_registration_processed',
            status: 'success'
          });

          processedCount++;
          console.log(`Processed new registration for: ${memberInfo.email}`);
          
        } catch (error) {
          console.error(`Error processing registration:`, error);
          await this.db.createLog({
            user: 'system',
            action: 'cron_process_registration_error',
            status: 'failed'
          });
        }
      }

      console.log(`Cron job completed. Processed ${processedCount} new registrations`);
      
      await this.db.createLog({
        user: 'system',
        action: 'cron_process_registrations',
        status: 'success'
      });

    } catch (error) {
      console.error('Cron job error:', error);
      await this.db.createLog({
        user: 'system',
        action: 'cron_process_registrations',
        status: 'failed'
      });
    }
  }

  private extractMemberInfoFromSheetRow(row: any[], headers: string[], mapping: Record<string, string>): MemberInfo | null {
    try {
      const memberInfo: Partial<MemberInfo> = {};
      
      // Extract data based on sheet column mapping
      headers.forEach((header, index) => {
        const memberField = mapping[header];
        if (memberField && row[index]) {
          (memberInfo as any)[memberField] = row[index];
        }
      });

      // Validate required fields
      if (!memberInfo.email || !memberInfo.latin_name) {
        return null;
      }

      return memberInfo as MemberInfo;
    } catch (error) {
      console.error('Error extracting member info from sheet row:', error);
      return null;
    }
  }

  private async addMemberToMemberSheet(memberInfo: MemberInfo, memberSheetConfig: any): Promise<void> {
    // Get current member sheet data
    const data = await this.googleService.getSheetData(memberSheetConfig.google_sheet_id, 'A:Z');
    
    if (data.length === 0) {
      // If member sheet is empty, create headers
      const headers = Object.keys(memberSheetConfig.corresponding_values);
      const memberRow = headers.map(header => {
        const memberField = memberSheetConfig.corresponding_values[header];
        return (memberInfo as any)[memberField] || '';
      });
      
      const newData = [headers, memberRow];
      await this.googleService.updateSheetData(memberSheetConfig.google_sheet_id, 'A:Z', newData);
    } else {
      // Add new row to existing member sheet data
      const headers = data[0];
      const memberRow = headers.map(header => {
        const memberField = memberSheetConfig.corresponding_values[header];
        return (memberInfo as any)[memberField] || '';
      });
      
      const newData = [...data, memberRow];
      await this.googleService.updateSheetData(memberSheetConfig.google_sheet_id, 'A:Z', newData);
    }
  }

  private async generateMembershipNumber(): Promise<string> {
    // Get membership number prefix from environment
    const prefix = this.env.MEMBERSHIP_NUMBER_PREFIX || '2501';
    
    // Get existing membership numbers to find the next sequential number
    const memberSheetConfig = await this.db.getGoogleSheet();
    if (!memberSheetConfig) {
      // If no member sheet config, start with 001
      return `${prefix}001`;
    }

    try {
      const memberSheetData = await this.googleService.getSheetData(memberSheetConfig.google_sheet_id, 'A:Z');
      
      if (memberSheetData.length <= 1) {
        // No existing members, start with 001
        return `${prefix}001`;
      }

      const headers = memberSheetData[0];
      const rows = memberSheetData.slice(1);
      
      // Find membership number column
      const membershipColumnHeader = Object.keys(memberSheetConfig.corresponding_values).find(
        key => memberSheetConfig.corresponding_values[key] === 'membership_number'
      );
      
      if (!membershipColumnHeader) {
        // If no membership column mapped, start with 001
        return `${prefix}001`;
      }

      const membershipColumnIndex = headers.indexOf(membershipColumnHeader);
      if (membershipColumnIndex === -1) {
        return `${prefix}001`;
      }

      // Find the highest existing number with this prefix
      let maxNumber = 0;
      rows.forEach(row => {
        const membershipNumber = row[membershipColumnIndex];
        if (membershipNumber && membershipNumber.startsWith(prefix)) {
          const numberPart = membershipNumber.substring(prefix.length);
          const num = parseInt(numberPart, 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      });

      // Generate next number
      const nextNumber = maxNumber + 1;
      return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
      
    } catch (error) {
      console.error('Error generating membership number:', error);
      // Fallback to timestamp-based generation
      const timestamp = Date.now().toString().slice(-6);
      return `${prefix}${timestamp.slice(-3)}`;
    }
  }

  async cleanupExpiredPasswordResets(): Promise<void> {
    try {
      console.log('Cleaning up expired password reset requests');
      
      // This would require additional database methods to find and clean expired tokens
      // For now, we'll just log the action
      await this.db.createLog({
        user: 'system',
        action: 'cron_cleanup_expired_resets',
        status: 'success'
      });
      
    } catch (error) {
      console.error('Cleanup error:', error);
      await this.db.createLog({
        user: 'system',
        action: 'cron_cleanup_expired_resets',
        status: 'failed'
      });
    }
  }
}

export async function handleCronJob(env: CloudflareBindings): Promise<void> {
  try {
    console.log('Cron job triggered at:', new Date().toISOString());
    
    // Validate environment and create service
    const cronService = new CronJobService(env);
    
    // Run cron tasks
    await Promise.all([
      cronService.processNewRegistrations(),
      cronService.cleanupExpiredPasswordResets()
    ]);
    
    console.log('Cron job completed successfully at:', new Date().toISOString());
  } catch (error) {
    console.error('Cron job failed:', error);
    
    // Try to log the error if database is available
    try {
      if (env.DB) {
        const db = new Database(env.DB);
        await db.createLog({
          user: 'system',
          action: 'cron_job_initialization_error',
          status: 'failed'
        });
      }
    } catch (logError) {
      console.error('Failed to log cron error to database:', logError);
    }
    
    // Re-throw the error to ensure Worker shows failed status
    throw error;
  }
}
