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

  constructor(env: CloudflareBindings) {
    this.db = new Database(env.DB);
    
    const googleCredentials = JSON.parse(env.GOOGLE_API_KEY);
    this.googleService = new GoogleAPIService(googleCredentials);
    
    this.moodleService = new MoodleAPIService(env.MOODLE_API_URL, env.MOODLE_API_TOKEN);
    
    this.emailService = new EmailService({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT),
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    });
    
    this.authService = new AuthService(this.db, this.googleService, env.JWT_SECRET);
  }

  async processNewRegistrations(): Promise<void> {
    try {
      console.log('Starting cron job: Processing new registrations');
      
      // Get Google Form Sheet and Member Sheet configurations
      const formSheetConfig = await this.db.getGoogleForm(); // Now represents form sheet config
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
      const formSheetData = await this.googleService.getSheetData(formSheetConfig.google_form_id, 'A:Z');
      
      if (formSheetData.length <= 1) {
        console.log('No form responses found in sheet');
        return;
      }

      // Get existing members from member sheet to avoid duplicates
      const memberSheetData = await this.googleService.getSheetData(memberSheetConfig.google_sheet_id, 'A:Z');
      const processedEmails = new Set<string>();
      
      if (memberSheetData.length > 1) {
        const memberHeaders = memberSheetData[0];
        const memberRows = memberSheetData.slice(1);
        
        const emailColumnHeader = Object.keys(memberSheetConfig.corresponding_values).find(
          key => memberSheetConfig.corresponding_values[key] === 'email'
        );
        
        if (emailColumnHeader) {
          const emailColumnIndex = memberHeaders.indexOf(emailColumnHeader);
          if (emailColumnIndex !== -1) {
            memberRows.forEach(row => {
              if (row[emailColumnIndex]) {
                processedEmails.add(row[emailColumnIndex]);
              }
            });
          }
        }
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

          // Check if member already exists
          if (processedEmails.has(memberInfo.email)) {
            console.log(`Member with email ${memberInfo.email} already processed, skipping`);
            continue;
          }

          // Generate temporary password
          const temporaryPassword = this.authService.generateRandomPassword();
          memberInfo.password = temporaryPassword;

          // Generate membership number if not provided
          if (!memberInfo.membership_number) {
            memberInfo.membership_number = this.generateMembershipNumber();
          }

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

          // Mark as processed to avoid future duplicates
          processedEmails.add(memberInfo.email);

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

  private generateMembershipNumber(): string {
    // Generate a membership number based on current timestamp and random digits
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `M${timestamp}${random}`;
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
  const cronService = new CronJobService(env);
  await Promise.all([
    cronService.processNewRegistrations(),
    cronService.cleanupExpiredPasswordResets()
  ]);
}
