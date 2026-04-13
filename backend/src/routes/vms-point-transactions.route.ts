import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import {
  createPointTransaction,
  deletePointTransactionById,
  getPointTransactionById,
  listPointTransactions,
  updatePointTransactionById,
} from '../repositories/vms-point-transactions.repository'
import {
  createPointTransactionSchema,
  pointTransactionParamsSchema,
  updatePointTransactionSchema,
} from '../schemas/vms-point-transaction.schema'
import type { AppBindings } from '../types/bindings'

export const vmsPointTransactionsRoute = new Hono<{ Bindings: AppBindings }>()

vmsPointTransactionsRoute.get('/point-transactions', async (c) => {
  try {
    const membershipNumber = c.req.query('membershipNumber')
    const pointTransactions = await listPointTransactions(c.env.VMS_DB, membershipNumber)
    return c.json({ pointTransactions })
  } catch (error) {
    console.error('Failed to list point transactions', error)
    return c.json({ error: 'Could not fetch point transactions.' }, 500)
  }
})

vmsPointTransactionsRoute.get(
  '/point-transactions/:id',
  zValidator('param', pointTransactionParamsSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const pointTransaction = await getPointTransactionById(c.env.VMS_DB, id)

      if (!pointTransaction) {
        return c.json({ error: 'Point transaction not found.' }, 404)
      }

      return c.json({ pointTransaction })
    } catch (error) {
      console.error('Failed to fetch point transaction', error)
      return c.json({ error: 'Could not fetch point transaction.' }, 500)
    }
  },
)

vmsPointTransactionsRoute.post('/point-transactions', zValidator('json', createPointTransactionSchema), async (c) => {
  try {
    const payload = c.req.valid('json')
    const pointTransactionId = crypto.randomUUID()
    const pointTransaction = await createPointTransaction(c.env.VMS_DB, pointTransactionId, payload)

    return c.json({ pointTransaction }, 201)
  } catch (error) {
    console.error('Failed to create point transaction', error)
    return c.json({ error: 'Could not create point transaction.' }, 500)
  }
})

vmsPointTransactionsRoute.put(
  '/point-transactions/:id',
  zValidator('param', pointTransactionParamsSchema),
  zValidator('json', updatePointTransactionSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const payload = c.req.valid('json')

      const existing = await getPointTransactionById(c.env.VMS_DB, id)
      if (!existing) {
        return c.json({ error: 'Point transaction not found.' }, 404)
      }

      const pointTransaction = await updatePointTransactionById(c.env.VMS_DB, id, payload)
      return c.json({ pointTransaction })
    } catch (error) {
      console.error('Failed to update point transaction', error)
      return c.json({ error: 'Could not update point transaction.' }, 500)
    }
  },
)

vmsPointTransactionsRoute.delete('/point-transactions/:id', zValidator('param', pointTransactionParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param')
    const deleted = await deletePointTransactionById(c.env.VMS_DB, id)

    if (!deleted) {
      return c.json({ error: 'Point transaction not found.' }, 404)
    }

    return c.json({ message: 'Point transaction deleted successfully.' })
  } catch (error) {
    console.error('Failed to delete point transaction', error)
    return c.json({ error: 'Could not delete point transaction.' }, 500)
  }
})
