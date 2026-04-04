import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { registrationRoute } from './routes/registration.route'
import { statsRoute } from './routes/stats.route'
import type { AppBindings } from './types/bindings'

const app = new Hono<{ Bindings: AppBindings }>()

app.use(
  '/ms/membership-app/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

app.get('/ms/membership-app', (c) => {
  return c.json({
    service: 'membership-app-backend',
    status: 'ok',
  })
})

app.get('/ms/membership-app/health', (c) => {
  return c.json({
    service: 'membership-app-backend',
    status: 'healthy',
  })
})

app.route('/ms/membership-app/api', registrationRoute)
app.route('/ms/membership-app/api', statsRoute)

export default app
