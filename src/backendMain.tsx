import { Hono } from 'hono'
import { renderer } from './frontendMain'
import { authRouter } from './backend/routers/auth'
import { adminRouter } from './backend/routers/admin'
import { memberRouter } from './backend/routers/member'
import { handleCronJob } from './backend/services/cron'
import { CloudflareBindings } from './backend/models/types'

type Bindings = CloudflareBindings & {
  ASSETS: any // Cloudflare Assets binding
}

const app = new Hono<{ Bindings: Bindings }>()

// API Routes
app.route('/api/auth', authRouter)
app.route('/api/admin', adminRouter)
app.route('/api/member', memberRouter)

// Frontend Routes - serve React app for all frontend routes
const frontendRoutes = ['/', '/login', '/forgot-password', '/reset-password', '/user-info', '/admin'];

frontendRoutes.forEach(route => {
  app.get(route, renderer);
});

// Handle static assets
app.get('/client/*', async (c) => {
  const assetPath = c.req.path.replace('/client', '')
  return c.env.ASSETS.fetch(new Request(`${new URL(c.req.url).origin}${assetPath}`))
})

// Catch-all route for client-side routing
app.get('*', (c) => {
  const path = c.req.path
  // Only serve React app for non-API, non-asset routes
  if (!path.startsWith('/api/') && 
      !path.startsWith('/client/') && // Cloudflare static assets
      !path.startsWith('/src/') && 
      !path.startsWith('/node_modules/') &&
      !path.startsWith('/@') && // Vite internal routes
      (!path.includes('.') || path.endsWith('.html'))) {
    return renderer(c)
  }
  return c.notFound()
})

export default {
  fetch: app.fetch,
  scheduled: async (event: any, env: CloudflareBindings, ctx: any) => {
    return await handleCronJob(env);
  }
};
