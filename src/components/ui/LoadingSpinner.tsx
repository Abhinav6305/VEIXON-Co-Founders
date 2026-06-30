export default function LoadingSpinner({ label = 'VZN is thinking...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-2 text-center">
      <div className="relative h-12 w-12">
        <span
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: 'color-mix(in srgb, var(--purple) 20%, transparent)' }}
        />
        <span
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
          style={{ borderTopColor: 'var(--purple)', borderRightColor: 'var(--purple)' }}
        />
        <span
          className="veixon-pulse absolute inset-[5px] rounded-full"
          style={{ background: 'radial-gradient(circle at 32% 30%, #7b73e0, var(--purple) 70%)' }}
        />
      </div>
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}
