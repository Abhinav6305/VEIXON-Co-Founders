import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Phase 2 — tenant context derived ONLY from the session (never client-supplied).
// Use this to scope every institutional read by org id and to gate mentor/admin views.
export interface Tenant {
  userId: string | null
  orgId: string | null
  role: string | null // founder | mentor | admin | superadmin
}

export async function getTenant(): Promise<Tenant> {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id || null
  if (!userId) return { userId: null, orgId: null, role: null }
  try {
    // `as any`: Membership delegate appears after `prisma generate`.
    const m = await (prisma as any).membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })
    return { userId, orgId: m?.orgId ?? null, role: m?.role ?? 'founder' }
  } catch {
    return { userId, orgId: null, role: 'founder' }
  }
}

export function isInstitutionRole(role: string | null): boolean {
  return role === 'mentor' || role === 'admin' || role === 'superadmin'
}

export function isSuperAdmin(role: string | null): boolean {
  return role === 'superadmin'
}
