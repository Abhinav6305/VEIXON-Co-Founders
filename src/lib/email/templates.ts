// Branded, email-client-safe HTML (inline styles, table layout, dark theme).
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://visionixfounders.com'

const PURPLE = '#6D5DF6'
const BG = '#0b0b14'
const CARD = '#15151f'
const TEXT = '#f4f5fa'
const MUTED = '#9a9ab2'

function shell(opts: { heading: string; body: string; ctaText?: string; ctaUrl?: string; footnote?: string }) {
  const cta = opts.ctaText && opts.ctaUrl
    ? `<tr><td style="padding:28px 0 4px;">
         <a href="${opts.ctaUrl}" style="display:inline-block;background:${PURPLE};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:12px;">${opts.ctaText}</a>
       </td></tr>`
    : ''
  return `<!DOCTYPE html><html><body style="margin:0;background:${BG};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
   <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${CARD};border:1px solid #2a2a3a;border-radius:18px;padding:34px;">
      <tr><td style="font-weight:800;letter-spacing:3px;font-size:13px;color:${TEXT};padding-bottom:6px;">VE<span style="color:${PURPLE};">I</span>XON</td></tr>
      <tr><td style="font-family:monospace;font-size:10px;letter-spacing:2px;color:${MUTED};text-transform:uppercase;padding-bottom:22px;">VZN · your co-founder</td></tr>
      <tr><td style="font-size:22px;font-weight:800;color:${TEXT};line-height:1.25;padding-bottom:12px;">${opts.heading}</td></tr>
      <tr><td style="font-size:15px;color:${MUTED};line-height:1.65;">${opts.body}</td></tr>
      ${cta}
      <tr><td style="border-top:1px solid #2a2a3a;margin-top:24px;padding-top:18px;color:#5c5c70;font-size:12px;line-height:1.6;">${opts.footnote || 'VEIXON Co-Founders — decide smarter, move faster.'}</td></tr>
    </table>
   </td></tr>
  </table></body></html>`
}

export function welcomeEmail(name: string) {
  return {
    subject: "You're in. Now let's get uncomfortable.",
    html: shell({
      heading: `Welcome, ${escape(name)}.`,
      body: `I'm VZN — your AI co-founder. I don't do cheerleading. I'll grade your idea against a real venture framework, build your 90-day war plan, and hold you to it.<br/><br/>Drop your idea and let's see what it's actually made of.`,
      ctaText: 'Analyse my idea',
      ctaUrl: `${APP_URL}/intake`,
    }),
  }
}

export function analysisReportEmail(name: string, args: { idea: string; failureProbability?: number; composite?: number; vzn?: string; startupId?: string }) {
  const fp = typeof args.failureProbability === 'number' ? `~${args.failureProbability}%` : '—'
  const comp = typeof args.composite === 'number' ? `${args.composite}/10` : '—'
  return {
    subject: 'Your brutal idea report is ready.',
    html: shell({
      heading: 'I ran the numbers on your idea.',
      body: `<strong style="color:${TEXT};">"${escape(args.idea).slice(0, 140)}"</strong><br/><br/>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 14px;">
          <tr>
            <td style="padding-right:28px;"><div style="font-size:28px;font-weight:800;color:#f2585b;">${fp}</div><div style="font-size:11px;color:${MUTED};">estimated failure risk</div></td>
            <td><div style="font-size:28px;font-weight:800;color:${TEXT};">${comp}</div><div style="font-size:11px;color:${MUTED};">composite score</div></td>
          </tr>
        </table>
        ${args.vzn ? `<em style="color:${MUTED};">"${escape(args.vzn)}"</em><br/><br/>` : ''}
        These are directional estimates from the framework + your inputs — open the full scorecard, devil's advocate, and 90-day war plan.`,
      ctaText: 'See the full report',
      ctaUrl: `${APP_URL}/results/${args.startupId || 'latest'}`,
    }),
  }
}

export function decisionEmail(name: string, args: { description?: string; recommendation?: string; reasoning?: string }) {
  return {
    subject: 'VZN ran your decision.',
    html: shell({
      heading: 'I simulated your decision.',
      body: `${args.description ? `<strong style="color:${TEXT};">"${escape(args.description).slice(0, 160)}"</strong><br/><br/>` : ''}
        <div style="font-family:monospace;font-size:10px;letter-spacing:2px;color:${PURPLE};text-transform:uppercase;">My call</div>
        <div style="font-size:17px;font-weight:700;color:${TEXT};margin:4px 0 10px;">${escape(args.recommendation || 'See the simulation in-app.')}</div>
        ${args.reasoning ? `<span style="color:${MUTED};">${escape(args.reasoning).slice(0, 280)}</span>` : ''}`,
      ctaText: 'Open the decision',
      ctaUrl: `${APP_URL}/decisions`,
    }),
  }
}

export function inactivityWarningEmail(name: string, args: { dayNumber?: number; lastActiveDays?: number }) {
  const gap = args.lastActiveDays && args.lastActiveDays > 1 ? `${args.lastActiveDays} days` : 'a day'
  return {
    subject: '⚠ You went dark. That\'s a signal.',
    html: shell({
      heading: `${escape(name)} — you skipped ${gap}.`,
      body: `Momentum is the whole game, and you just broke it. No task, no check-in, nothing logged.<br/><br/>
        I'm not here to guilt you — I'm here to tell you the truth: founders who go quiet are usually avoiding the hard task, not too busy. Open it, do one thing, prove me wrong.`,
      ctaText: 'Get back in',
      ctaUrl: `${APP_URL}/dashboard`,
      footnote: 'You set the oath. I just hold the mirror.',
    }),
  }
}

export function dayOneCompleteEmail(name: string, args: { task?: string }) {
  return {
    subject: 'Day 1 is done. That matters.',
    html: shell({
      heading: `Day 1 complete, ${escape(name)}.`,
      body: `Most people keep their startup in their head. You moved one task into evidence.<br/><br/>
        ${args.task ? `<strong style="color:${TEXT};">Completed:</strong> ${escape(args.task).slice(0, 180)}<br/><br/>` : ''}
        Quote for today: <em style="color:${TEXT};">"The secret of getting ahead is getting started."</em><br/><br/>
        Small proof compounds. Come back tomorrow and make Day 2 visible too.`,
      ctaText: 'Open my dashboard',
      ctaUrl: `${APP_URL}/dashboard`,
      footnote: 'VEIXON Co-founders, a product by VEIXON Tech.',
    }),
  }
}

// minimal HTML escape for interpolated user content
function escape(s: string): string {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}
