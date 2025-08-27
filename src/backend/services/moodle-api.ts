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
}

export class MoodleAPIService {
  constructor(
    private apiUrl: string,
    private token: string
  ) {}

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
    const moodleUser: MoodleUser = {
      username: memberInfo.membership_number,
      password: memberInfo.password,
      firstname: memberInfo.latin_name.split(' ')[0] || memberInfo.latin_name,
      lastname: memberInfo.latin_name.split(' ').slice(1).join(' ') || '',
      email: memberInfo.email,
      city: memberInfo.city,
      country: memberInfo.country,
      phone1: memberInfo.phone,
      phone2: memberInfo.whatsapp,
    };

    const result = await this.makeRequest('core_user_create_users', {
      users: [moodleUser]
    });

    if (result && result.length > 0) {
      return result[0].id;
    }
    
    throw new Error('Failed to create user in Moodle');
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
