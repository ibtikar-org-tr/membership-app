// Database connection helper for Cloudflare D1
import { DatabaseConnection } from './base';

// Type for Cloudflare Workers Environment with D1 binding
export interface Env {
  TELEGRAM_DB: D1Database;
}

// Wrapper class to adapt D1Database to our DatabaseConnection interface
export class D1DatabaseConnection implements DatabaseConnection {
  private d1: D1Database;

  constructor(d1: D1Database) {
    this.d1 = d1;
  }

  prepare(query: string) {
    const statement = this.d1.prepare(query);
    
    return {
      bind: (...params: any[]) => {
        const boundStatement = statement.bind(...params);
        
        return {
          run: async () => {
            try {
              const result = await boundStatement.run();
              return {
                success: result.success,
                error: result.success ? undefined : 'Query execution failed',
                meta: result.meta
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
              };
            }
          },
          
          first: async <T = any>(): Promise<T | null> => {
            try {
              return await boundStatement.first<T>();
            } catch (error) {
              console.error('Database query error:', error);
              return null;
            }
          },
          
          all: async <T = any>() => {
            try {
              const result = await boundStatement.all<T>();
              return {
                results: result.results,
                success: result.success,
                error: result.success ? undefined : 'Query execution failed'
              };
            } catch (error) {
              return {
                results: [] as T[],
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
              };
            }
          }
        };
      }
    };
  }
}

// TODO will be deleted later - sql file migrations will be used instead
// Factory function to create database connection from Cloudflare Workers environment
export function createDatabaseConnection(env: Env): DatabaseConnection {
  return new D1DatabaseConnection(env.TELEGRAM_DB);
}
