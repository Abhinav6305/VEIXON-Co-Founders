export default function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--bg-primary)]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-14 w-14">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--purple)]" />
          <span className="absolute inset-2 animate-spin rounded-full border-2 border-[var(--border)] border-b-[var(--purple)] [animation-direction:reverse] [animation-duration:1.4s]" />
        </div>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</span>
      </div>
    </div>
  )
}
