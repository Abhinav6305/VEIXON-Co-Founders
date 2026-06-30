'use client'

import { useMemo, useRef, useState } from 'react'
import { Check, Copy, Download, ExternalLink } from 'lucide-react'
import { buildFounderLinkedInPost, buildLinkedInShareUrl, VEIXON_COMPANY, VEIXON_PRODUCT } from '@/lib/share'

// Branded, downloadable LinkedIn card. Uses plain hex colors because html2canvas
// cannot reliably export CSS variables or color-mix() values.
export default function ShareCard({
  shareAngle,
  missionCode,
  week,
  day,
  startupName,
  completionRate,
  completedCount,
  totalTasks,
}: {
  shareAngle: string
  missionCode: string
  week: number
  day: number
  startupName?: string
  completionRate?: number
  completedCount?: number
  totalTasks?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  const caption = useMemo(
    () =>
      buildFounderLinkedInPost({
        day,
        week,
        shareAngle,
        missionCode,
        startupName,
        completionRate,
        completedCount,
        totalTasks,
      }),
    [completedCount, completionRate, day, missionCode, shareAngle, startupName, totalTasks, week],
  )

  async function download() {
    if (!ref.current) return
    setBusy(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(ref.current, {
        scale: 3,
        backgroundColor: '#05030f',
        logging: false,
        useCORS: true,
      })
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `veixon-day-${day}.png`
      a.click()
    } catch (error) {
      console.error('card export failed', error)
    } finally {
      setBusy(false)
    }
  }

  function copy() {
    navigator.clipboard?.writeText(caption)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function openLinkedIn() {
    window.open(buildLinkedInShareUrl(caption), '_blank', 'noopener,noreferrer')
  }

  return (
    <div>
      <div className="mx-auto" style={{ maxWidth: 420 }}>
        <div
          ref={ref}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1 / 1',
            borderRadius: 22,
            overflow: 'hidden',
            background: 'linear-gradient(150deg,#0d0d1c 0%,#070612 55%,#05030f 100%)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: '#ffffff',
            padding: 30,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Inter,sans-serif',
          }}
        >
          <div style={{ position: 'absolute', top: -90, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,92,255,0.35), transparent 70%)' }} />
          <div style={{ position: 'absolute', right: 18, bottom: -28, fontSize: 200, fontWeight: 800, lineHeight: 1, color: 'rgba(255,255,255,0.04)', letterSpacing: '-0.05em' }}>{day}</div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontWeight: 800, letterSpacing: '0.22em', fontSize: 15 }}>
              VE<span style={{ color: '#7fd3ff' }}>I</span>XON
            </div>
            <div style={{ border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, padding: '4px 12px', fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)' }}>
              {missionCode}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>Progress logged</div>
            <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.18 }}>{shareAngle}</div>
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>
                Day {day}<span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}> / 90</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Week {week} | 90-Day War Plan</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              {VEIXON_PRODUCT}<br /><span style={{ color: 'rgba(255,255,255,0.35)' }}>by {VEIXON_COMPANY}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          onClick={download}
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-lg bg-[var(--purple)] px-4 py-3 font-semibold text-white transition-opacity disabled:opacity-60"
        >
          <Download size={16} /> {busy ? 'Generating...' : 'Download'}
        </button>
        <button
          onClick={copy}
          className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 py-3 font-semibold"
        >
          {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Caption</>}
        </button>
        <button
          onClick={openLinkedIn}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#0A66C2] px-4 py-3 font-semibold text-white hover:bg-[#004182]"
        >
          <ExternalLink size={16} /> LinkedIn
        </button>
      </div>
    </div>
  )
}
