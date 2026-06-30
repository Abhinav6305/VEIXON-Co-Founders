import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStartupById, updateStartup } from '@/lib/server-store'

export const runtime = 'nodejs'

// A startup is accessible if the session user owns it. Records with no owner
// (legacy / pre-login "anonymous" rows) stay reachable so the teaser→login
// hand-off doesn't break; tighten this for production by removing that clause.
function canAccess(startup: any, userId?: string | null) {
  if (!startup) return false
  const owner = startup.userId
  return owner === userId || !owner || owner === 'anonymous'
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const startup = await getStartupById(params.id)
    if (!startup) return Response.json({ error: 'Startup not found', fallback: true }, { status: 404 })
    if (!canAccess(startup, userId)) return Response.json({ error: 'Forbidden' }, { status: 403 })

    return Response.json(startup)
  } catch {
    return Response.json({ error: 'Startup unavailable', fallback: true }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const startup = await getStartupById(params.id)
    if (!startup) return Response.json({ error: 'Startup not found', fallback: true }, { status: 404 })
    if (!canAccess(startup, userId)) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    await updateStartup(params.id, body)
    return Response.json({ updated: true })
  } catch {
    return Response.json({ error: 'Startup unavailable', fallback: true }, { status: 500 })
  }
}
