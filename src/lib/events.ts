import prisma from '@/lib/prisma'

// Phase 4 — append-only founder execution stream. The compounding, defensible asset:
// completion curves, drop-off weeks, dodged-task patterns, day-3 return, etc.
export type FounderEventType =
  | 'idea_submitted'
  | 'task_completed'
  | 'task_dodged'
  | 'checkin'
  | 'pivot_flag'
  | 'day_return'
  | 'decision'
  | 'vault_unlock'

export async function recordFounderEvent(e: {
  type: FounderEventType
  startupId?: string | null
  userId?: string | null
  orgId?: string | null
  cohortId?: string | null
  payload?: unknown
}): Promise<void> {
  try {
    // `as any`: the FounderEvent delegate appears after `prisma generate`; the
    // try/catch keeps event logging best-effort and never blocks the user action.
    await (prisma as any).founderEvent.create({
      data: {
        type: e.type,
        startupId: e.startupId ?? undefined,
        userId: e.userId ?? undefined,
        orgId: e.orgId ?? undefined,
        cohortId: e.cohortId ?? undefined,
        payload: e.payload === undefined ? undefined : JSON.stringify(e.payload),
      },
    })
  } catch {
    /* best-effort analytics — swallow */
  }
}
