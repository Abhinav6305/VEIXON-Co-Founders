'use client'

import { CSSProperties } from 'react'

export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`veixon-skeleton ${className}`} style={style} aria-hidden />
}

// Drop-in shimmer placeholder for the dashboard while data loads.
export function DashboardSkeleton() {
  return (
    <div className="w-full" aria-busy>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border p-5"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-5 h-16 w-16 rounded-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border p-6 lg:col-span-8" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <Skeleton className="h-5 w-40" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border p-6 lg:col-span-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-6 h-16 w-16 rounded-full" />
          <Skeleton className="mt-6 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <Skeleton className="mt-6 h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default Skeleton
