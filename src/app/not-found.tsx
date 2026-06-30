import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      className="relative grid min-h-screen place-items-center overflow-hidden px-6 text-center text-[var(--text-primary)]"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ background: 'color-mix(in srgb, var(--purple) 30%, transparent)' }}
      />
      <div className="relative z-10 max-w-[520px]">
        <div className="font-mono text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">VEIXON</div>

        <div className="mt-6 text-[88px] font-extrabold leading-none md:text-[120px]" style={{ color: 'var(--purple)' }}>
          404
        </div>

        <h1 className="mt-4 text-2xl font-bold md:text-3xl">This page never shipped.</h1>
        <p className="mt-3 text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
          VZN looked everywhere — there&apos;s nothing here. Let&apos;s get you back to work.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl bg-[var(--purple)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Back to dashboard
          </Link>
          <Link
            href="/"
            className="rounded-xl border px-6 py-3 text-sm font-semibold transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  )
}
