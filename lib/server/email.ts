// Server-only — never import from app/, components/, or lib/client/
// Resend is used for transactional emails only. No bulk marketing.

import { log } from '@/lib/observability/log';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from   = process.env.RESEND_FROM_EMAIL ?? 'PlantBridge <noreply@plantbridge.app>';

  if (!apiKey) {
    log.warn('resend_not_configured', { to, subject });
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, reply_to: replyTo, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      log.error('resend_send_failed', { to, subject, status: res.status, body });
      return false;
    }

    log.info('email_sent', { to, subject });
    return true;
  } catch (err) {
    log.error('resend_send_exception', { to, subject, error: String(err) });
    return false;
  }
}
