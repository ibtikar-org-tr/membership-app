import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRoute } from './routes/auth.route'
import { registrationRoute } from './routes/registration.route'
import { statsRoute } from './routes/stats.route'
import { vmsEventRegistrationsRoute } from './routes/vms-event-registrations.route'
import { vmsEventTicketsRoute } from './routes/vms-event-tickets.route'
import { vmsEventsRoute } from './routes/vms-events.route'
import { vmsPointTransactionsRoute } from './routes/vms-point-transactions.route'
import { vmsProjectMembersRoute } from './routes/vms-project-members.route'
import { vmsProjectsRoute } from './routes/vms-projects.route'
import { vmsSkillsRoute } from './routes/vms-skills.route'
import { vmsTasksRoute } from './routes/vms-tasks.route'
import type { AppBindings } from './types/bindings'

const app = new Hono<{ Bindings: AppBindings }>()

app.use(
  '/ms/membership-app/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
app.route('/ms/membership-app/api', authRoute)
app.route('/ms/membership-app/api', vmsProjectsRoute)
app.route('/ms/membership-app/api', vmsTasksRoute)
app.route('/ms/membership-app/api', vmsProjectMembersRoute)
app.route('/ms/membership-app/api', vmsEventsRoute)
app.route('/ms/membership-app/api', vmsEventTicketsRoute)
app.route('/ms/membership-app/api', vmsEventRegistrationsRoute)
app.route('/ms/membership-app/api', vmsSkillsRoute)
app.route('/ms/membership-app/api', vmsPointTransactionsRoute)

export default app
