// Coach alert email templates — plain HTML, no external rendering library needed.
// All copy uses educational framing per CLAUDE.md §2.1.

import { sendEmail } from '@/lib/server/email';

interface SevereAlertParams {
  coachEmail: string;
  clientEmail: string;
  clientUserId: string;
  subject: string;    // care plan item subject, e.g. "linalool"
  appUrl: string;
}

export async function sendCoachSevereAlert({
  coachEmail,
  clientEmail,
  clientUserId,
  subject,
  appUrl,
}: SevereAlertParams): Promise<void> {
  const clientUrl = `${appUrl}/coach/clients/${clientUserId}`;

  await sendEmail({
    to: coachEmail,
    subject: `Client alert — severe reaction reported (${clientEmail})`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#dc2626;padding:16px 24px;">
      <p style="color:#fff;font-size:13px;font-weight:600;margin:0;text-transform:uppercase;letter-spacing:.05em;">Client Alert</p>
    </div>
    <div style="padding:24px;space-y:16px;">
      <h1 style="font-size:18px;font-weight:600;color:#111827;margin:0 0 8px;">Severe reaction reported</h1>
      <p style="font-size:14px;color:#374151;margin:0 0 16px;line-height:1.6;">
        Your client <strong>${clientEmail}</strong> has logged a <strong>severe</strong> side effect
        while tracking <em>${subject}</em>. This requires your attention.
      </p>
      <p style="font-size:13px;color:#6b7280;margin:0 0 20px;line-height:1.6;">
        The client has been shown guidance to pause use and contact their healthcare provider.
        Please review their recent logs and reach out if appropriate.
      </p>
      <a href="${clientUrl}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:10px 20px;border-radius:20px;font-size:13px;font-weight:600;">
        View client profile →
      </a>
      <p style="font-size:11px;color:#9ca3af;margin:24px 0 0;border-top:1px solid #f3f4f6;padding-top:16px;">
        PlantBridge · Educational wellness platform · This alert is for your coaching records only.
        It does not constitute a medical emergency notification. If the client reports a medical emergency, advise them to call 911.
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}

interface LowOutcomeAlertParams {
  coachEmail: string;
  clientEmail: string;
  clientUserId: string;
  avgRating: number;
  logCount: number;
  appUrl: string;
}

export async function sendCoachLowOutcomeAlert({
  coachEmail,
  clientEmail,
  clientUserId,
  avgRating,
  logCount,
  appUrl,
}: LowOutcomeAlertParams): Promise<void> {
  const clientUrl = `${appUrl}/coach/clients/${clientUserId}`;

  await sendEmail({
    to: coachEmail,
    subject: `Low outcomes — ${clientEmail} averaging ${avgRating.toFixed(1)}/5`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#d97706;padding:16px 24px;">
      <p style="color:#fff;font-size:13px;font-weight:600;margin:0;text-transform:uppercase;letter-spacing:.05em;">Outcome Alert</p>
    </div>
    <div style="padding:24px;">
      <h1 style="font-size:18px;font-weight:600;color:#111827;margin:0 0 8px;">Low effectiveness reported</h1>
      <p style="font-size:14px;color:#374151;margin:0 0 16px;line-height:1.6;">
        <strong>${clientEmail}</strong> has logged <strong>${logCount} check-ins</strong> with an average
        effectiveness of <strong>${avgRating.toFixed(1)}/5</strong>.
        Their current plan may need adjustment.
      </p>
      <p style="font-size:13px;color:#6b7280;margin:0 0 20px;line-height:1.6;">
        Consider reaching out to review their care plan, discuss any barriers, or explore alternative approaches.
      </p>
      <a href="${clientUrl}" style="display:inline-block;background:#d97706;color:#fff;text-decoration:none;padding:10px 20px;border-radius:20px;font-size:13px;font-weight:600;">
        View client profile →
      </a>
      <p style="font-size:11px;color:#9ca3af;margin:24px 0 0;border-top:1px solid #f3f4f6;padding-top:16px;">
        PlantBridge · Educational wellness platform · This is an automated coaching alert based on self-reported data.
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}
