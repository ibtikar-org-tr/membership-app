import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Environment } from './types';
import telegramRoutes from './routes/telegram';
import apiRoutes from './routes/api';
import testingRoutes from './routes/testing';
import uiRoutes from './routes/ui';
import groupsRouter from './routes/groups';

const app = new Hono<{ Bindings: Environment }>();

// Enable CORS
app.use('*', cors());

// Health check endpoint
app.get('/ms/telegram/health', (c) => {
  return c.json({ 
    status: 'ok', 
    message: 'Telegram Membership Bot API',
    version: '2.0.0',
  });
});

// Mount routes ----------------
// V1 API routes - including Member Google Sheets routes
app.route('/ms/telegram/telegram', telegramRoutes);
app.route('/ms/telegram/api', apiRoutes);
app.route('/ms/telegram/testing', testingRoutes);

// Groups routes
app.route('/ms/telegram/groups', groupsRouter);

// UI routes
app.route('/ms/telegram/ui', uiRoutes);

// 404 handler ----------------------
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});


// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
