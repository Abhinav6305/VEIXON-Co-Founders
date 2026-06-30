import { adminMessaging } from './firebase-admin'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'https://visionixfounders.com'

export interface NotificationPayload {
  title: string
  body: string
  url: string
  tag: string
  icon?: string
}

// ─── PUSH NOTIFICATION via FCM ────────────────────────────────────────────────
export async function sendPushNotification(
  fcmToken: string,
  payload: NotificationPayload
) {
  if (!fcmToken) return
  if (!adminMessaging) {
    console.warn('Firebase Admin not initialised — skipping push notification')
    return
  }

  try {
    await adminMessaging.send({
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        url: payload.url,
        tag: payload.tag,
      },
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/vzn-icon-192.png',
          badge: '/vzn-badge-72.png',
          requireInteraction: true,
          tag: payload.tag,
          actions: [
            { action: 'open', title: 'Open VISIONIX' },
            { action: 'dismiss', title: 'Dismiss' },
          ],
        },
        fcmOptions: { link: payload.url },
      },
    })
  } catch (error: any) {
    console.error('Push notification failed:', error?.message || error)
  }
}

// ─── EMAIL HTML BUILDER ───────────────────────────────────────────────────────
export function buildEmailHtml({
  subject,
  headline,
  body,
  ctaText,
  ctaUrl,
  moodColor = '#534AB7',
  highlightLine,
}: {
  subject: string
  headline: string
  body: string
  ctaText: string
  ctaUrl: string
  moodColor?: string
  highlightLine?: string
  preheader?: string // accepted but rendered as subject meta — kept for API compat
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0D0D0F;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
      <div style="width:36px;height:36px;background:${moodColor};border-radius:6px;display:flex;align-items:center;justify-content:center;">
        <span style="color:#fff;font-weight:800;font-size:16px;">V</span>
      </div>
      <div>
        <div style="color:#F5F5F5;font-size:13px;font-weight:600;letter-spacing:0.05em;">VEIXON Co-founders</div>
        <div style="color:#888;font-size:11px;">Message from VZN</div>
      </div>
    </div>

    <!-- Main card -->
    <div style="background:#141418;border:1px solid #2A2A35;border-radius:16px;padding:32px;margin-bottom:20px;">
      <h1 style="color:#F5F5F5;font-size:22px;font-weight:700;margin:0 0 12px;line-height:1.3;">${headline}</h1>
      <p style="color:#888888;font-size:14px;line-height:1.7;margin:0 0 20px;">${body}</p>

      ${
        highlightLine
          ? `<div style="background:${moodColor}22;border:1px solid ${moodColor};border-radius:10px;padding:14px 16px;margin-bottom:20px;">
        <p style="color:${moodColor};font-size:14px;font-weight:600;margin:0;">${highlightLine}</p>
      </div>`
          : ''
      }

      <a href="${ctaUrl}" style="display:inline-block;background:${moodColor};color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;">
        ${ctaText} →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;">
      <p style="color:#444455;font-size:11px;margin:0 0 4px;">VISIONIX Founders · Your AI co-founder from day one</p>
      <p style="color:#444455;font-size:11px;margin:0;">
        <a href="${APP_URL}/settings/notifications" style="color:#534AB7;text-decoration:none;">Manage notifications</a>
        &nbsp;·&nbsp;
        <a href="${APP_URL}/settings/notifications?unsubscribe=true" style="color:#444455;text-decoration:none;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

// ─── SEND EMAIL via Resend ────────────────────────────────────────────────────
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping email')
    return
  }

  try {
    await resend.emails.send({
      from: 'VZN <vzn@visionixfounders.com>',
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error('Email send failed:', error)
  }
}
