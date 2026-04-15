import { Hono } from 'hono'

const app = new Hono()

app.get('/ms/telegram', (c) => {
  return c.text('Hello Hono!')
})

app.get('/ms/telegram/health', (c) => {
  return c.json({
    service: 'telegram-ms',
    status: 'healthy',
  })
})

export default app
