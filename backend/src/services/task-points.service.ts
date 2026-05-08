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

const TASK_REWARD_TYPES = ['task_reward', 'task_reward_reversal'] as const

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

  const amount = Math.trunc(delta)
  const transactionId = crypto.randomUUID()
  const type = amount > 0 ? 'task_reward' : 'task_reward_reversal'

  // Audit row first; if balance update fails we still have a record to reconcile from.
  await createPointTransaction(vmsDb, transactionId, {
    membershipNumber,
    taskId,
    amount,
    type,
  })

  await addToUserPointBalance(membersDb, membershipNumber, amount)
}

async function getNetRewardSumsByMember(vmsDb: D1DatabaseLike, taskId: string): Promise<Map<string, number>> {
  const existing = await listPointTransactionsByTask(vmsDb, taskId, [...TASK_REWARD_TYPES])
  const sums = new Map<string, number>()
  for (const tx of existing) {
    sums.set(tx.membershipNumber, (sums.get(tx.membershipNumber) ?? 0) + tx.amount)
  }
  return sums
}

/**
 * For each member with a non-zero net of award + reversal rows for this task,
 * inserts a new `task_reward_reversal` row with amount = -sum and decrements `point_balance`.
 */
async function reverseNetTaskRewardsForTask(
  membersDb: D1DatabaseLike,
  vmsDb: D1DatabaseLike,
  taskId: string,
) {
  const sumsByMember = await getNetRewardSumsByMember(vmsDb, taskId)

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
 * Reconciles `task_reward` / `task_reward_reversal` rows and the recipient's
 * `users.point_balance` with the task's current state.
 *
 * Triggers on `status === 'completed'`. Recipient: `completed_by` then `assigned_to`.
 *
 * - completed → not completed: one new `task_reward_reversal` row per member
 *   (amount = -net), and `point_balance` decremented by the same amount.
 * - not completed → completed: a `task_reward` credit to match `points`.
 * - still completed: a delta row if `points` or recipient changed (positives go
 *   in as `task_reward`, negatives as `task_reward_reversal`).
 *
 * All sums are computed across both `task_reward` and `task_reward_reversal`,
 * so toggling the task on and off repeatedly stays balanced.
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

  const sumsByMember = await getNetRewardSumsByMember(vmsDb, after.id)

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
