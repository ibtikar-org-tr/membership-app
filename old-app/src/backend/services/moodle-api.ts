import { MemberInfo } from '../models/types';

export interface MoodleUser {
  id?: number;
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  email: string;
  city?: string;
  country?: string;
  phone1?: string;
  phone2?: string;
  // Additional fields from Moodle API
  auth?: string;
  createpassword?: number;
  maildisplay?: number;
  timezone?: string;
  description?: string;
  institution?: string;
  department?: string;
  address?: string;
  lang?: string;
  calendartype?: string;
  idnumber?: string;
}

export class MoodleAPIService {
  constructor(
    private apiUrl: string,
    private token: string
  ) {}
  
  // Helper method to convert country names to ISO codes
  private getCountryCode(countryName?: string): string {
    const countryMap: Record<string, string> = {
      'turkey': 'TR',
      'türkiye': 'TR',
      'syria': 'SY',
      'saudi arabia': 'SA',
      'united arab emirates': 'AE',
      'qatar': 'QA',
      'kuwait': 'KW',
      'bahrain': 'BH',
      'oman': 'OM',
      'yemen': 'YE',
      'palestine': 'PS',
      'jordan': 'JO',
      'lebanon': 'LB',
      'iraq': 'IQ',
      'united states': 'US',
      'usa': 'US',
      'united kingdom': 'GB',
      'uk': 'GB',
      'germany': 'DE',
      'france': 'FR',
      'spain': 'ES',
      'italy': 'IT',
      'canada': 'CA',
      'australia': 'AU',
      'japan': 'JP',
      'china': 'CN',
      'india': 'IN',
      'brazil': 'BR',
      'russia': 'RU',
      'netherlands': 'NL',
      'sweden': 'SE',
      'norway': 'NO',
      'denmark': 'DK',
      'finland': 'FI',
      'poland': 'PL',
      'greece': 'GR',
      'portugal': 'PT',
      'belgium': 'BE',
      'austria': 'AT',
      'switzerland': 'CH',
      'ireland': 'IE',
      'czech republic': 'CZ',
      'hungary': 'HU',
      'slovakia': 'SK',
      'slovenia': 'SI',
      'croatia': 'HR',
      'serbia': 'RS',
      'romania': 'RO',
      'bulgaria': 'BG',
      'ukraine': 'UA',
      'belarus': 'BY',
      'lithuania': 'LT',
      'latvia': 'LV',
      'estonia': 'EE'
    };

    if (countryName === 'israel') return 'PS';
    if (!countryName) return 'TR'; // Default fallback
    
    const normalizedName = countryName.toLowerCase().trim();
    return countryMap[normalizedName] || 'TR'; // Default to TR if not found
  }

  private async makeRequest(wsfunction: string, params: Record<string, any>): Promise<any> {
    const url = new URL(`${this.apiUrl}/webservice/rest/server.php`);
    url.searchParams.set('wstoken', this.token);
    url.searchParams.set('wsfunction', wsfunction);
    url.searchParams.set('moodlewsrestformat', 'json');

    // Add parameters
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            Object.entries(item).forEach(([subKey, subValue]) => {
              url.searchParams.set(`${key}[${index}][${subKey}]`, String(subValue));
            });
          } else {
            url.searchParams.set(`${key}[${index}]`, String(item));
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          url.searchParams.set(`${key}[${subKey}]`, String(subValue));
        });
      } else {
        url.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(url.toString(), {
      method: 'POST',
    });

    const data = await response.json();
    
    if (data.exception) {
      throw new Error(`Moodle API Error: ${data.message}`);
    }
    
    return data;
  }

  async createUser(memberInfo: MemberInfo): Promise<number> {
    // Validate required fields
    if (!memberInfo.membership_number) {
      throw new Error('Membership number is required');
    }
    if (!memberInfo.email) {
      throw new Error('Email is required');
    }
    if (!memberInfo.ar_name) {
      throw new Error('Arabic name is required');
    }
    if (!memberInfo.latin_name) {
      throw new Error('Latin name is required');
    }
    if (!memberInfo.password) {
      throw new Error('Password is required');
    }

    const moodleUser: MoodleUser = {
      username: memberInfo.membership_number,
      password: memberInfo.password,
      firstname: memberInfo.ar_name,
      lastname: memberInfo.latin_name,
      email: memberInfo.email,
      city: memberInfo.city || '',
      country: this.getCountryCode(memberInfo.country), // Use ISO country code
      phone1: memberInfo.phone || '',
      phone2: memberInfo.whatsapp || '',
      // Enhanced fields
      auth: 'manual',
      createpassword: 0, // Don't auto-generate password since we're providing one
      maildisplay: 1, // Show email to everyone
      timezone: '99', // Use server default
      description: `Member since ${new Date().getFullYear()}. University: ${memberInfo.university || 'N/A'}, Major: ${memberInfo.major || 'N/A'}`,
      institution: memberInfo.university || '',
      department: memberInfo.major || '',
      address: memberInfo.district ? `${memberInfo.district}, ${memberInfo.city}, ${memberInfo.country}` : `${memberInfo.city}, ${memberInfo.country}`,
      lang: 'en',
      calendartype: 'gregorian',
      idnumber: memberInfo.membership_number, // Use membership number as ID number for easier lookup
    };

    try {
      const result = await this.makeRequest('core_user_create_users', {
        users: [moodleUser]
      });

      if (result && result.length > 0) {
        return result[0].id;
      }
      
      throw new Error('Failed to create user in Moodle - no user ID returned');
    } catch (error: any) {
      // Enhanced error handling
      if (error.message.includes('Username already exists')) {
        throw new Error(`Username '${memberInfo.membership_number}' already exists in Moodle`);
      } else if (error.message.includes('Email already exists')) {
        throw new Error(`Email '${memberInfo.email}' already exists in Moodle`);
      } else if (error.message.includes('Invalid email')) {
        throw new Error(`Invalid email format: '${memberInfo.email}'`);
      } else if (error.message.includes('country')) {
        throw new Error(`Invalid country: '${memberInfo.country}'. Please use a valid country name or 2-letter ISO code.`);
      }
      throw error;
    }
  }

  async getUserById(userId: number): Promise<MoodleUser | null> {
    try {
      const result = await this.makeRequest('core_user_get_users_by_field', {
        field: 'id',
        values: [userId]
      });

      return result && result.length > 0 ? result[0] : null;
    } catch (error) {
      return null;
    }
  }

  async getUserByUsername(username: string): Promise<MoodleUser | null> {
    try {
      const result = await this.makeRequest('core_user_get_users_by_field', {
        field: 'username',
        values: [username]
      });

      return result && result.length > 0 ? result[0] : null;
    } catch (error) {
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<MoodleUser | null> {
    try {
      const result = await this.makeRequest('core_user_get_users_by_field', {
        field: 'email',
        values: [email]
      });

      return result && result.length > 0 ? result[0] : null;
    } catch (error) {
      return null;
    }
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<void> {
    await this.makeRequest('core_user_update_users', {
      users: [{
        id: userId,
        password: newPassword
      }]
    });
  }

  async updateUser(userId: number, updates: Partial<MoodleUser>): Promise<void> {
    await this.makeRequest('core_user_update_users', {
      users: [{
        id: userId,
        ...updates
      }]
    });
  }

  async deleteUser(userId: number): Promise<void> {
    await this.makeRequest('core_user_delete_users', {
      userids: [userId]
    });
  }

  async authenticateUser(username: string, password: string): Promise<boolean> {
    try {
      // Note: Moodle doesn't have a direct authentication endpoint through web services
      // This is a simplified check - in a real implementation, you might need to use
      // a different approach or custom web service
      const user = await this.getUserByUsername(username);
      
      if (!user) {
        return false;
      }

      // In a real implementation, you would need to verify the password
      // This might require a custom Moodle web service or different authentication method
      return true;
    } catch (error) {
      return false;
    }
  }

  async isUserExists(username: string): Promise<boolean> {
    const user = await this.getUserByUsername(username);
    return user !== null;
  }

  async getAllUsers(limit: number = 100, offset: number = 0): Promise<MoodleUser[]> {
    try {
      // Get users with pagination
      const result = await this.makeRequest('core_user_get_users', {
        criteria: [{
          key: 'deleted',
          value: '0'
        }],
        limitfrom: offset,
        limitnum: limit
      });

      return result.users || [];
    } catch (error) {
      return [];
    }
  }
}
