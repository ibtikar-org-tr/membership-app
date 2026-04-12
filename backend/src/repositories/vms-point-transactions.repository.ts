import type { CreatePointTransactionInput, UpdatePointTransactionInput } from '../schemas/vms-point-transaction.schema'
import type { D1DatabaseLike } from '../types/bindings'

interface PointTransactionRow {
  id: string
  created_at: string
  updated_at: string
  membership_number: string
  task_id: string | null
  amount: number
  type: string
}

function mapPointTransactionRow(row: PointTransactionRow) {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    membershipNumber: row.membership_number,
    taskId: row.task_id,
    amount: row.amount,
    type: row.type,
  }
}

export async function listPointTransactions(db: D1DatabaseLike, membershipNumber?: string) {
  const query = membershipNumber
    ? 'SELECT id, created_at, updated_at, membership_number, task_id, amount, type FROM points_transactions WHERE membership_number = ? ORDER BY created_at DESC'
    : 'SELECT id, created_at, updated_at, membership_number, task_id, amount, type FROM points_transactions ORDER BY created_at DESC'

  const statement = db.prepare(query)
  const result = membershipNumber
    ? await statement.bind(membershipNumber).all<PointTransactionRow>()
    : await statement.bind().all<PointTransactionRow>()

  return result.results.map(mapPointTransactionRow)
}

export async function getPointTransactionById(db: D1DatabaseLike, id: string) {
  const row = await db
    .prepare('SELECT id, created_at, updated_at, membership_number, task_id, amount, type FROM points_transactions WHERE id = ?')
    .bind(id)
    .first<PointTransactionRow>()

  return row ? mapPointTransactionRow(row) : null
}

export async function createPointTransaction(db: D1DatabaseLike, id: string, input: CreatePointTransactionInput) {
  await db
    .prepare('INSERT INTO points_transactions (id, membership_number, task_id, amount, type) VALUES (?, ?, ?, ?, ?)')
    .bind(id, input.membershipNumber, input.taskId ?? null, input.amount, input.type)
    .run()

  return getPointTransactionById(db, id)
}

export async function updatePointTransactionById(db: D1DatabaseLike, id: string, input: UpdatePointTransactionInput) {
  const updates: string[] = []
  const values: unknown[] = []

  if (input.membershipNumber !== undefined) {
    updates.push('membership_number = ?')
    values.push(input.membershipNumber)
  }

  if (input.taskId !== undefined) {
    updates.push('task_id = ?')
    values.push(input.taskId)
  }

  if (input.amount !== undefined) {
    updates.push('amount = ?')
    values.push(input.amount)
  }

  if (input.type !== undefined) {
    updates.push('type = ?')
    values.push(input.type)
  }

  if (updates.length === 0) {
    return getPointTransactionById(db, id)
  }

  updates.push("updated_at = datetime('now')")

  await db
    .prepare(`UPDATE points_transactions SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run()

  return getPointTransactionById(db, id)
}

export async function deletePointTransactionById(db: D1DatabaseLike, id: string) {
  const existing = await getPointTransactionById(db, id)

  if (!existing) {
    return false
  }

  await db.prepare('DELETE FROM points_transactions WHERE id = ?').bind(id).run()
  return true
}
