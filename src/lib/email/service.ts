import prisma from '@/lib/prisma'

const FROM = process.env.EMAIL_FROM || 'VZN <vzn@visionixfounders.com>'

export const IDEA_SUBMISSION_RECIPIENTS = (
  process.env.IDEA_SUBMISSION_RECIPIENTS ||
  'abhinavrishisaka@gmail.com,saisiddardh10@gmail.com,dayzeroworks@gmail.com'
)
  .split(',')
  .map((email) => email.trim())
  .filter(Boolean)

const isEmail = (value?: string | null): value is string => !!value && /.+@.+\..+/.test(value)

function normalizeEmails(value?: string | string[] | null) {
  const list = Array.isArray(value) ? value : String(value || '').split(',')
  return Array.from(new Set(list.map((email) => email.trim()).filter(isEmail)))
}

function escapeHtml(value?: string | null) {
  return String(value || '').replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] as string
  ))
}

let _transporter: any | null | undefined

async function getTransporter(): Promise<any | null> {
  if (_transporter !== undefined) return _transporter

  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) {
    _transporter = null
    return null
  }

  let nodemailer: any = null
  try {
    const mod: any = await import(/* webpackIgnore: true */ 'nodemailer')
    nodemailer = mod?.default ?? mod
  } catch {
    console.warn('[email] nodemailer not installed - run `npm install nodemailer`')
    _transporter = null
    return null
  }

  const port = Number(process.env.SMTP_PORT || 587)
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465
  _transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } })
  return _transporter
}

export async function alreadySent(type: string, opts: { email?: string; userId?: string; refId?: string }): Promise<boolean> {
  try {
    const where: any = { type }
    if (opts.refId) where.refId = opts.refId
    if (opts.userId) where.userId = opts.userId
    else if (opts.email) where.email = opts.email
    const found = await (prisma as any).emailLog.findFirst({ where })
    return !!found
  } catch {
    return false
  }
}

export async function dispatchEmail(args: {
  type: string
  to?: string | string[] | null
  userId?: string | null
  refId?: string | null
  subject: string
  html: string
  once?: boolean
}): Promise<{ sent: boolean; reason?: string }> {
  const { type, to, userId, refId, subject, html, once } = args
  const recipients = normalizeEmails(to)

  if (!recipients.length) return { sent: false, reason: 'no recipient' }

  if (once && recipients.length === 1 && (await alreadySent(type, { email: recipients[0], userId: userId || undefined, refId: refId || undefined }))) {
    return { sent: false, reason: 'already sent' }
  }

  const transporter = await getTransporter()
  if (!transporter) {
    console.warn(`[email] SMTP not ready - would send "${type}" to ${recipients.join(', ')}`)
    return { sent: false, reason: 'no transport' }
  }

  try {
    await transporter.sendMail({ from: FROM, to: recipients.join(', '), subject, html })
    try {
      await Promise.all(
        recipients.map((email) =>
          (prisma as any).emailLog.create({ data: { type, email, userId: userId || undefined, refId: refId || undefined } })
        )
      )
    } catch {
      /* best-effort logging */
    }
    return { sent: true }
  } catch (error: any) {
    const message = error?.message || String(error)
    console.error('[email] send failed:', message)
    return { sent: false, reason: process.env.NODE_ENV === 'production' ? 'send error' : `send error: ${message}` }
  }
}

export async function dispatchIdeaSubmissionNotice(args: {
  startupId?: string | null
  founderEmail?: string | null
  founderName?: string | null
  idea?: string | null
  targetCustomer?: string | null
  problem?: string | null
  failureProbability?: number | null
  composite?: number | null
}): Promise<{ sent: boolean; reason?: string }> {
  const idea = args.idea || 'Untitled idea'
  const subject = `New idea submitted: ${idea.slice(0, 80)}`
  const html = `<!DOCTYPE html><html><body style="margin:0;background:#0b0b14;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#f4f5fa;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b14;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#15151f;border:1px solid #2a2a3a;border-radius:18px;padding:32px;">
          <tr><td style="font-size:12px;letter-spacing:3px;color:#6D5DF6;text-transform:uppercase;font-weight:800;">New DayZero idea submission</td></tr>
          <tr><td style="font-size:24px;font-weight:800;line-height:1.3;padding:14px 0;color:#f4f5fa;">${escapeHtml(idea)}</td></tr>
          <tr><td style="font-size:14px;line-height:1.7;color:#9a9ab2;">
            <strong style="color:#f4f5fa;">Founder:</strong> ${escapeHtml(args.founderName || args.founderEmail || 'Unknown')}<br/>
            <strong style="color:#f4f5fa;">Email:</strong> ${escapeHtml(args.founderEmail || 'Not provided')}<br/>
            <strong style="color:#f4f5fa;">Target customer:</strong> ${escapeHtml(args.targetCustomer || 'Not provided')}<br/>
            <strong style="color:#f4f5fa;">Problem:</strong> ${escapeHtml(args.problem || 'Not provided')}<br/>
            <strong style="color:#f4f5fa;">Failure probability:</strong> ${typeof args.failureProbability === 'number' ? `${args.failureProbability}%` : 'Not calculated'}<br/>
            <strong style="color:#f4f5fa;">Composite score:</strong> ${typeof args.composite === 'number' ? `${args.composite}/10` : 'Not calculated'}<br/>
            <strong style="color:#f4f5fa;">Startup ID:</strong> ${escapeHtml(args.startupId || 'Not persisted')}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`

  return dispatchEmail({
    type: 'idea_submission_notice',
    to: IDEA_SUBMISSION_RECIPIENTS,
    refId: args.startupId || undefined,
    subject,
    html,
  })
}
