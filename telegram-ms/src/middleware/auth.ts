import { Context, Next } from 'hono';
import { Environment } from '../types';

export const authMiddleware = async (c: Context<{ Bindings: Environment }>, next: Next) => {
  const apiKey = c.req.header('X-API-Key');
  
  if (!apiKey || apiKey !== c.env.SECRET_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  await next();
};