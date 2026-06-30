import { ReactNode } from 'react'
import TiltCard from '@/components/ui/motion/TiltCard'

export default function StatCard({
  label,
  children,
  index = 0,
}: {
  label: string
  children: ReactNode
  index?: number
}) {
  return (
    <TiltCard
      index={index}
      className="rounded-lg border p-5"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
    >
      <div className="text-xs font-medium uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div className="mt-4">{children}</div>
    </TiltCard>
  )
}
