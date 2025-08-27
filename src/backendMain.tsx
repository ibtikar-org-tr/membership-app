import { Hono } from 'hono'
import { renderer } from './frontendMain'
import { authRouter } from './backend/routers/auth'
import { adminRouter } from './backend/routers/admin'
import { memberRouter } from './backend/routers/member'
import { handleCronJob } from './backend/services/cron'
import { CloudflareBindings } from './backend/models/types'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// API Routes
app.route('/api/auth', authRouter)
app.route('/api/admin', adminRouter)
app.route('/api/member', memberRouter)

// Frontend Routes
app.get('/', renderer)

// Catch-all route for client-side routing
app.get('*', (c) => {
  const path = c.req.path
  // Only handle non-API routes
  if (!path.startsWith('/api/')) {
    return renderer(c, () => {})
  }
  return c.notFound()
})

export default {
  fetch: app.fetch,
  scheduled: handleCronJob
};
