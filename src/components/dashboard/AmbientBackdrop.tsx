'use client'

const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")"

// "Mission control" backdrop — deep base, a faint blueprint grid that fades toward the
// edges, two slow aurora glows, grain, and a readability scrim. Shared by every inner page.
export default function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'var(--bg-primary)' }} />

      {/* blueprint grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(color-mix(in srgb, var(--purple) 9%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--purple) 9%, transparent) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
          maskImage: 'radial-gradient(120% 90% at 50% 18%, #000 30%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(120% 90% at 50% 18%, #000 30%, transparent 78%)',
        }}
      />

      {/* aurora glows */}
      <div
        className="absolute h-[62vh] w-[62vh] rounded-full"
        style={{ left: '-14%', top: '-16%', background: 'radial-gradient(circle, color-mix(in srgb, var(--purple) 55%, transparent), transparent 70%)', filter: 'blur(70px)', animation: 'veixon-float1 20s ease-in-out infinite' }}
      />
      <div
        className="absolute h-[55vh] w-[55vh] rounded-full"
        style={{ right: '-12%', bottom: '-18%', background: 'radial-gradient(circle, color-mix(in srgb, var(--teal) 40%, transparent), transparent 70%)', filter: 'blur(80px)', animation: 'veixon-float2 24s ease-in-out infinite' }}
      />
      <div
        className="absolute left-1/2 top-[-30%] h-[50vh] w-[80vw] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--purple) 22%, transparent), transparent 70%)', filter: 'blur(90px)' }}
      />

      <div className="absolute inset-[-50%]" style={{ opacity: 0.05, mixBlendMode: 'overlay', backgroundImage: NOISE, animation: 'veixon-grain .6s steps(4) infinite' }} />
      {/* readability scrim + edge vignette */}
      <div className="absolute inset-0" style={{ background: 'color-mix(in srgb, var(--bg-primary) 40%, transparent)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(130% 100% at 50% 0%, transparent 45%, color-mix(in srgb, var(--bg-primary) 80%, transparent) 100%)' }} />
    </div>
  )
}
