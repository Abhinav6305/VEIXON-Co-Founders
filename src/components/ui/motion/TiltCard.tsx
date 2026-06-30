'use client'

import { CSSProperties, ReactNode, useRef } from 'react'

// Pointer-reactive 3D tilt + spotlight surface. Wrap any card to make it feel alive.
// Pass the visual classes (border / bg / rounded / padding) via `className`.
export default function TiltCard({
  children,
  className = '',
  style,
  max = 7,
  index = 0,
  as: Tag = 'div',
  href,
  onClick,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  max?: number
  index?: number
  as?: any
  href?: string
  onClick?: () => void
}) {
  const ref = useRef<HTMLElement>(null)

  function onMove(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', `${(0.5 - py) * max}deg`)
    el.style.setProperty('--ry', `${(px - 0.5) * max}deg`)
    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
  }

  function reset() {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <Tag
      ref={ref as any}
      href={href}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={`veixon-tilt veixon-rise group relative overflow-hidden ${className}`}
      style={{ ['--d' as any]: `${index * 0.07}s`, ...style }}
    >
      <span className="veixon-tilt-glow" aria-hidden />
      <span className="relative block">{children}</span>
    </Tag>
  )
}
