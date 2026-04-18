import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { sendBackendTelegramNotification } from '../services/telegram-notification.service'
import type { AppBindings } from '../types/bindings'

export const telegramNotificationRoute = new Hono<{ Bindings: AppBindings }>()

const notifyTelegramSchema = z.object({
  target: z.string().trim().min(1).optional(),
  targets: z.array(z.string().trim().min(1)).optional(),
  message: z.string().trim().min(1),
  boxes: z.array(z.object({
    text: z.string().trim().min(1),
    link: z.string().url()
  })).optional(),
}).refine((data) => data.target || (data.targets && data.targets.length > 0), {
  message: "Either 'target' or 'targets' must be provided",
})

telegramNotificationRoute.post(
  '/telegram/notify',
  zValidator('json', notifyTelegramSchema),
  async (c) => {
    try {
      const { target, targets, message, boxes } = c.req.valid('json')

      const result = await sendBackendTelegramNotification(c.env, {
        target,
        targets,
        message,
        boxes,
      })

      if (!result.success) {
        return c.json({ error: result.error ?? 'Telegram notification failed', details: result.responseData }, 500)
      }

      return c.json({ success: true, detail: result.detail, data: result.responseData })
    } catch (error) {
      console.error('Backend telegram notification route error:', error)
      return c.json({ error: 'Failed to send telegram notification' }, 500)
    }
  },
)
