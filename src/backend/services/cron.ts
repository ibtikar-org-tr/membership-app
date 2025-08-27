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
      
      // Get Google Form and Sheet configurations
      const formConfig = await this.db.getGoogleForm();
      const sheetConfig = await this.db.getGoogleSheet();
      
      if (!formConfig || !sheetConfig) {
        console.log('Missing Google Form or Sheet configuration');
        await this.db.createLog({
          user: 'system',
          action: 'cron_process_registrations',
          status: 'failed_missing_config'
        });
        return;
      }

      // Get form responses
      const responses = await this.googleService.getFormResponses(formConfig.google_form_id);
      
      if (responses.length === 0) {
        console.log('No new form responses found');
        return;
      }

      // Get existing members from sheet to avoid duplicates
      const existingMembersData = await this.googleService.getSheetData(sheetConfig.google_sheet_id, 'A:Z');
      const existingEmails = new Set<string>();
      
      if (existingMembersData.length > 1) {
        const headers = existingMembersData[0];
        const rows = existingMembersData.slice(1);
        
        const emailColumnHeader = Object.keys(sheetConfig.corresponding_values).find(
          key => sheetConfig.corresponding_values[key] === 'email'
        );
        
        if (emailColumnHeader) {
          const emailColumnIndex = headers.indexOf(emailColumnHeader);
          if (emailColumnIndex !== -1) {
            rows.forEach(row => {
              if (row[emailColumnIndex]) {
                existingEmails.add(row[emailColumnIndex]);
              }
            });
          }
        }
      }

      let processedCount = 0;
      
      for (const response of responses) {
        try {
          // Extract member information from form response
          const memberInfo = this.extractMemberInfoFromResponse(response, formConfig.corresponding_values);
          
          if (!memberInfo || !memberInfo.email) {
            console.log('Invalid member info extracted from response');
            continue;
          }

          // Check if member already exists
          if (existingEmails.has(memberInfo.email)) {
            console.log(`Member with email ${memberInfo.email} already exists, skipping`);
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
            console.log(`Moodle user with email ${memberInfo.email} already exists, skipping`);
            continue;
          }

          // Create user in Moodle
          const moodleUserId = await this.moodleService.createUser(memberInfo);
          console.log(`Created Moodle user with ID: ${moodleUserId}`);

          // Add member to Google Sheet
          await this.addMemberToSheet(memberInfo, sheetConfig);

          // Send welcome email
          await this.emailService.sendWelcomeEmail(memberInfo, temporaryPassword);

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

  private extractMemberInfoFromResponse(response: any, mapping: Record<string, string>): MemberInfo | null {
    try {
      const memberInfo: Partial<MemberInfo> = {};
      
      // Extract data based on form field mapping
      if (response.answers) {
        Object.entries(response.answers).forEach(([questionId, answer]: [string, any]) => {
          const memberField = mapping[questionId];
          if (memberField && answer && answer.textAnswers && answer.textAnswers.answers) {
            const value = answer.textAnswers.answers[0]?.value;
            if (value) {
              (memberInfo as any)[memberField] = value;
            }
          }
        });
      }

      // Validate required fields
      if (!memberInfo.email || !memberInfo.latin_name) {
        return null;
      }

      return memberInfo as MemberInfo;
    } catch (error) {
      console.error('Error extracting member info:', error);
      return null;
    }
  }

  private async addMemberToSheet(memberInfo: MemberInfo, sheetConfig: any): Promise<void> {
    // Get current sheet data
    const data = await this.googleService.getSheetData(sheetConfig.google_sheet_id, 'A:Z');
    
    if (data.length === 0) {
      // If sheet is empty, create headers
      const headers = Object.keys(sheetConfig.corresponding_values);
      const memberRow = headers.map(header => {
        const memberField = sheetConfig.corresponding_values[header];
        return (memberInfo as any)[memberField] || '';
      });
      
      const newData = [headers, memberRow];
      await this.googleService.updateSheetData(sheetConfig.google_sheet_id, 'A:Z', newData);
    } else {
      // Add new row to existing data
      const headers = data[0];
      const memberRow = headers.map(header => {
        const memberField = sheetConfig.corresponding_values[header];
        return (memberInfo as any)[memberField] || '';
      });
      
      const newData = [...data, memberRow];
      await this.googleService.updateSheetData(sheetConfig.google_sheet_id, 'A:Z', newData);
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
