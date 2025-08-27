import { Hono } from 'hono'
import { renderer } from './frontendMain'

const app = new Hono()

app.use(renderer)

app.get('/', (c) => {
  return c.render(<h1>Hello!</h1>)
})

export default {
  fetch: app.fetch,
  // scheduled: handleCronJob
};
