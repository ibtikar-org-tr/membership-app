import { Hono } from 'hono'
import { registrationRoute } from './routes/registration.route'
import type { AppBindings } from './types/bindings'

const app = new Hono<{ Bindings: AppBindings }>()

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

export default app
