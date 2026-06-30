import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VEIXON — Your AI Co-Founder from Day One',
  description: 'Brutal scorecard. 90-day war plan. Devil’s advocate. Decision simulator. Weekly accountability.',
}

// The landing page is the self-contained preview document served from /public.
// It is rendered full-bleed; its internal "Log in" link uses target="_top" to
// break out of this frame and route into the app at /auth.
export default function Home() {
  return (
    <iframe
      src="/veixon-home-preview.html"
      title="VEIXON"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        margin: 0,
        padding: 0,
        display: 'block',
      }}
    />
  )
}
