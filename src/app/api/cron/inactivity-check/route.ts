import prisma from '@/lib/prisma'
import { dispatchEmail } from '@/lib/email/service'
import { inactivityWarningEmail } from '@/lib/email/templates'

export const runtime = 'nodejs'
export const maxDuration = 60

const DAY = 24 * 60 * 60 * 1000

// Schedule this once a day (Vercel cron / external scheduler). Protect with CRON_SECRET:
//   GET /api/cron/inactivity-check     Authorization: Bearer <CRON_SECRET>   (or ?key=<CRON_SECRET>)
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // no secret configured (dev) → allow
  const auth = req.headers.get('authorization') || ''
  const key = new URL(req.url).searchParams.get('key') || ''
  return auth === `Bearer ${secret}` || key === secret
}

async function run(): Promise<{ scanned: number; warned: number }> {
  const now = Date.now()
  const today = new Date().toISOString().slice(0, 10) // yyyy-mm-dd (one warning per founder per day)
  let scanned = 0
  let warned = 0

  let startups: any[] = []
  try {
    startups = await (prisma as any).startup.findMany({
      where: { founderEmail: { not: null } },
      select: { id: true, userId: true, founderEmail: true, createdAt: true, updatedAt: true, vaultUnlocked: true },
    })
  } catch {
    return { scanned: 0, warned: 0 } // founderEmail column appears after `prisma db push`
  }

  for (const s of startups) {
    scanned++
    const created = new Date(s.createdAt).getTime()
    if (now - created > 90 * DAY) continue // program window is over
    if (now - created < DAY) continue // grace period — don't warn on day 1
    if (s.vaultUnlocked) continue

    // Last activity = most recent of the startup's updatedAt and its newest FounderEvent.
    let last = new Date(s.updatedAt).getTime()
    try {
      const ev = await (prisma as any).founderEvent.findFirst({
        where: { startupId: s.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      })
      if (ev) last = Math.max(last, new Date(ev.createdAt).getTime())
    } catch {
      /* FounderEvent table appears after migration */
    }

    if (now - last <= DAY) continue // active within the last 24h — no warning

    const dayNumber = Math.floor((now - created) / DAY) + 1
    const lastActiveDays = Math.floor((now - last) / DAY)
    const { subject, html } = inactivityWarningEmail(String(s.founderEmail).split('@')[0], { dayNumber, lastActiveDays })
    const r = await dispatchEmail({
      type: 'inactivity_warning',
      to: s.founderEmail,
      userId: s.userId,
      refId: today,
      subject,
      html,
      once: true,
    })
    if (r.sent) warned++
  }

  return { scanned, warned }
}

export async function GET(req: Request) {
  if (!authorized(req)) return Response.json({ error: 'unauthorized' }, { status: 401 })
  return Response.json({ ok: true, ...(await run()) })
}

export async function POST(req: Request) {
  if (!authorized(req)) return Response.json({ error: 'unauthorized' }, { status: 401 })
  return Response.json({ ok: true, ...(await run()) })
}
