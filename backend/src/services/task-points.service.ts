import {
  createPointTransaction,
  listPointTransactionsByTask,
} from '../repositories/vms-point-transactions.repository'
import { addToUserPointBalance } from '../repositories/users.repository'
import type { D1DatabaseLike } from '../types/bindings'

export interface TaskPointsState {
  id: string
  points: number
  assignedTo: string | null
  completedBy: string | null
  approvedBy: string | null
}

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

function pickRecipient(state: TaskPointsState): string | null {
  const completedBy = state.completedBy?.trim()
  if (completedBy) {
    return completedBy
  }

  const assignedTo = state.assignedTo?.trim()
  return assignedTo || null
}

function effectiveAward(state: TaskPointsState | null): number {
  if (!state || !state.approvedBy?.trim()) {
    return 0
  }

  if (!Number.isFinite(state.points) || state.points <= 0) {
    return 0
  }

  return Math.trunc(state.points)
}

/**
 * Reconciles task_reward point transactions and the recipient's `users.point_balance`
 * with the current approval state of a task.
 *
 * Cases handled:
 *  - approval flips null -> set: credit `task.points` to `completed_by ?? assigned_to`
 *  - approval flips set -> null (rejection): reverse all prior task_reward credits for the task
 *  - `points` changes while approved: insert a delta transaction so total awarded == new points
 *  - recipient changes while approved (rare): reverse prior recipients, then credit the new one
 */
export async function syncTaskCompletionPoints(
  membersDb: D1DatabaseLike,
  vmsDb: D1DatabaseLike,
  before: TaskPointsState | null,
  after: TaskPointsState,
): Promise<void> {
  const wasApproved = Boolean(before?.approvedBy?.trim())
  const isApproved = Boolean(after.approvedBy?.trim())

  if (!wasApproved && !isApproved) {
    return
  }

  const existingRewards = await listPointTransactionsByTask(vmsDb, after.id, 'task_reward')
  const sumsByMember = new Map<string, number>()
  for (const tx of existingRewards) {
    sumsByMember.set(tx.membershipNumber, (sumsByMember.get(tx.membershipNumber) ?? 0) + tx.amount)
  }

  if (!isApproved) {
    for (const [member, sum] of sumsByMember) {
      if (sum === 0) {
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
    return
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
