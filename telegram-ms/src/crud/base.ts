// Base CRUD operations for D1 database
export interface DatabaseConnection {
  prepare(query: string): {
    bind(...params: any[]): {
      run(): Promise<{ success: boolean; error?: string; meta?: any }>;
      first<T = any>(): Promise<T | null>;
      all<T = any>(): Promise<{ results: T[]; success: boolean; error?: string }>;
    };
  };
}

export abstract class BaseCrud<T> {
  protected db: DatabaseConnection;
  protected tableName: string;

  constructor(db: DatabaseConnection, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  // Create a new record
  async create(data: Omit<T, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = crypto.randomUUID();
      const fields = Object.keys(data as any);
      // Convert Date objects to ISO strings for D1 compatibility
      const values = Object.values(data as any).map(value => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });
      const placeholders = fields.map(() => '?').join(', ');
      
      const query = `INSERT INTO ${this.tableName} (id, ${fields.join(', ')}) VALUES (?, ${placeholders})`;
      const result = await this.db.prepare(query).bind(id, ...values).run();
      
      return { success: result.success, id: result.success ? id : undefined, error: result.error };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get a record by ID
  async getById(id: string): Promise<T | null> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const result = await this.db.prepare(query).bind(id).first<T>();
      return result;
    } catch (error) {
      console.error(`Error getting ${this.tableName} by ID:`, error);
      return null;
    }
  }

  // Get all records with optional limit and offset
  async getAll(limit?: number, offset?: number): Promise<T[]> {
    try {
      let query = `SELECT * FROM ${this.tableName}`;
      const params: any[] = [];
      
      if (limit) {
        query += ` LIMIT ?`;
        params.push(limit);
        
        if (offset) {
          query += ` OFFSET ?`;
          params.push(offset);
        }
      }
      
      const result = await this.db.prepare(query).bind(...params).all<T>();
      return result.success ? result.results : [];
    } catch (error) {
      console.error(`Error getting all ${this.tableName}:`, error);
      return [];
    }
  }

  // Update a record by ID
  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<{ success: boolean; error?: string }> {
    try {
      const fields = Object.keys(data as any);
      // Convert Date objects to ISO strings for D1 compatibility
      const values = Object.values(data as any).map(value => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
      const result = await this.db.prepare(query).bind(...values, id).run();
      
      return { success: result.success, error: result.error };
    } catch (error) {
      console.error(`[BaseCrud.update] Error updating ${this.tableName}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Delete a record by ID
  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
      const result = await this.db.prepare(query).bind(id).run();
      
      return { success: result.success, error: result.error };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Count total records
  async count(): Promise<number> {
    try {
      const query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const result = await this.db.prepare(query).bind().first<{ count: number }>();
      return result?.count || 0;
    } catch (error) {
      console.error(`Error counting ${this.tableName}:`, error);
      return 0;
    }
  }

  // Check if record exists by ID
  async exists(id: string): Promise<boolean> {
    try {
      const query = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
      const result = await this.db.prepare(query).bind(id).first();
      return result !== null;
    } catch (error) {
      console.error(`Error checking if ${this.tableName} exists:`, error);
      return false;
    }
  }
}