import {
  createPointTransaction,
  listPointTransactionsByTask,
} from '../repositories/vms-point-transactions.repository'
import { addToUserPointBalance } from '../repositories/users.repository'
import type { D1DatabaseLike } from '../types/bindings'

export interface TaskPointsState {
  id: string
  status: string
  points: number
  assignedTo: string | null
  completedBy: string | null
  approvedBy: string | null
}

const COMPLETED_STATUS = 'completed'

interface ApplyDeltaParams {
  membersDb: D1DatabaseLike
  vmsDb: D1DatabaseLike
  taskId: string
  membershipNumber: string
  delta: number
}

async function applyPointsDelta({ membersDb, vmsDb, taskId, membershipNumber, delta }: ApplyDeltaParams) {
  if (!Number.isFinite(delta) || delta === 0) {
    return
  }

  const transactionId = crypto.randomUUID()

  // Audit row first; if balance update fails we still have a record to reconcile from.
  await createPointTransaction(vmsDb, transactionId, {
    membershipNumber,
    taskId,
    amount: Math.trunc(delta),
    type: 'task_reward',
  })

  await addToUserPointBalance(membersDb, membershipNumber, delta)
}

/**
 * For each member with a non-zero net sum of `task_reward` rows for this task,
 * inserts one new row with amount = -sum and applies the same delta to `point_balance`.
 */
async function reverseNetTaskRewardsForTask(
  membersDb: D1DatabaseLike,
  vmsDb: D1DatabaseLike,
  taskId: string,
) {
  const existingRewards = await listPointTransactionsByTask(vmsDb, taskId, 'task_reward')
  const sumsByMember = new Map<string, number>()
  for (const tx of existingRewards) {
    sumsByMember.set(tx.membershipNumber, (sumsByMember.get(tx.membershipNumber) ?? 0) + tx.amount)
  }

  for (const [member, sum] of sumsByMember) {
    if (sum === 0) {
      continue
    }
    await applyPointsDelta({
      membersDb,
      vmsDb,
      taskId,
      membershipNumber: member,
      delta: -sum,
    })
  }
}

function pickRecipient(state: TaskPointsState): string | null {
  const completedBy = state.completedBy?.trim()
  if (completedBy) {
    return completedBy
  }

  const assignedTo = state.assignedTo?.trim()
  return assignedTo || null
}

function isCompleted(state: TaskPointsState | null): boolean {
  return state?.status === COMPLETED_STATUS
}

function effectiveAward(state: TaskPointsState | null): number {
  if (!isCompleted(state) || !state) {
    return 0
  }

  if (!Number.isFinite(state.points) || state.points <= 0) {
    return 0
  }

  return Math.trunc(state.points)
}

/**
 * Reconciles `task_reward` rows and the recipient's `users.point_balance` with task state.
 *
 * Triggers on `status === 'completed'`. Recipient: `completed_by` then `assigned_to`.
 *
 * - completed → not completed: one new negative `task_reward` per member (net), balance reduced
 * - not completed → completed: credit to match `points`
 * - still completed: delta if `points` or recipient changed
 */
export async function syncTaskCompletionPoints(
  membersDb: D1DatabaseLike,
  vmsDb: D1DatabaseLike,
  before: TaskPointsState | null,
  after: TaskPointsState,
): Promise<void> {
  const wasCompleted = isCompleted(before)
  const completedNow = isCompleted(after)

  if (wasCompleted && !completedNow) {
    await reverseNetTaskRewardsForTask(membersDb, vmsDb, after.id)
    return
  }

  if (!completedNow) {
    return
  }

  const existingRewards = await listPointTransactionsByTask(vmsDb, after.id, 'task_reward')
  const sumsByMember = new Map<string, number>()
  for (const tx of existingRewards) {
    sumsByMember.set(tx.membershipNumber, (sumsByMember.get(tx.membershipNumber) ?? 0) + tx.amount)
  }

  const recipient = pickRecipient(after)
  const targetAmount = effectiveAward(after)

  for (const [member, sum] of sumsByMember) {
    if (member === recipient || sum === 0) {
      continue
    }
    await applyPointsDelta({
      membersDb,
      vmsDb,
      taskId: after.id,
      membershipNumber: member,
      delta: -sum,
    })
  }

  if (!recipient) {
    return
  }

  const existingForRecipient = sumsByMember.get(recipient) ?? 0
  const diff = targetAmount - existingForRecipient

  if (diff === 0) {
    return
  }

  await applyPointsDelta({
    membersDb,
    vmsDb,
    taskId: after.id,
    membershipNumber: recipient,
    delta: diff,
  })
}
