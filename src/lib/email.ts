import { MailtrapClient } from "mailtrap";
import { env } from "@/lib/env";

const mailtrapClient = env.MAILTRAP_TOKEN
  ? new MailtrapClient({ token: env.MAILTRAP_TOKEN })
  : null;

const sender = {
  email: env.MAILTRAP_SENDER_EMAIL,
  name: env.MAILTRAP_SENDER_NAME,
};

export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string;
  name?: string | null;
}) {
  if (!mailtrapClient) {
    console.warn("Mailtrap token not configured; skipping welcome email to", email);
    return false;
  }

  const displayName = name?.trim() || "Player";
  const appUrl = env.APP_URL;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Cafe Games!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; margin: 0; padding: 40px 20px; }
    .card { max-width: 520px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 40px; margin-bottom: 8px; }
    h1 { font-size: 24px; font-weight: 800; color: #ffffff; margin: 0 0 8px; }
    p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px; }
    .highlight { color: #818cf8; font-weight: 600; }
    .btn { display: inline-block; background-color: #6366f1; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 10px; margin: 20px 0; text-align: center; }
    .games { background: #0f172a; border-radius: 10px; padding: 14px 18px; margin: 18px 0; font-size: 13px; color: #cbd5e1; }
    .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">☕🎲</div>
      <h1>Welcome to Cafe Games!</h1>
      <p>Hey <span class="highlight">${displayName}</span>, we're thrilled to have you at the table.</p>
    </div>
    <p>Your account is ready. Jump right into our legendary multiplayer cafe games:</p>
    <div class="games">
      ✨ <strong>Available Games:</strong><br/>
      • 🎲 <strong>بنك الحظ</strong> (Bank El Hazz)<br/>
      • 🀄 <strong>دومينو</strong> (Domino Cafe)<br/>
      • 🎴 <strong>أونو</strong> (UNO Multiplayer)<br/>
      • 🔩 <strong>سكرو</strong> (Screw Card Game)<br/>
      • 🐒 <strong>ربع قرد</strong> (Quarter Monkey)<br/>
      • 🎭 <strong>بكاسة</strong> (Bekasa)<br/>
      • 😉 <strong>غمازة</strong> (Blink)<br/>
      • ⚽ <strong>صباحو تحدي</strong> (Sabaho)
    </div>
    <div style="text-align: center;">
      <a href="${appUrl}/dashboard" class="btn">Start Playing Now</a>
    </div>
    <div class="footer">
      <p>Cafe Games • Classic Egyptian & Arab Cafe Atmosphere</p>
    </div>
  </div>
</body>
</html>
`;

  try {
    const result = await mailtrapClient.send({
      from: sender,
      to: [{ email }],
      subject: "Welcome to Cafe Games! ☕🎲",
      text: `Welcome to Cafe Games, ${displayName}! Start playing now at ${appUrl}/dashboard`,
      html,
      category: "Account Onboarding",
    });
    console.log("Welcome email sent successfully to", email, result);
    return true;
  } catch (err) {
    console.error("Failed to send welcome email via Mailtrap to", email, err);
    return false;
  }
}

export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: {
  email: string;
  name?: string | null;
  resetUrl: string;
}) {
  if (!mailtrapClient) {
    console.warn("Mailtrap token not configured; cannot send password reset to", email);
    return false;
  }

  const displayName = name?.trim() || "Player";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password - Cafe Games</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; margin: 0; padding: 40px 20px; }
    .card { max-width: 520px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 40px; margin-bottom: 8px; }
    h1 { font-size: 24px; font-weight: 800; color: #ffffff; margin: 0 0 8px; }
    p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px; }
    .btn { display: inline-block; background-color: #6366f1; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 10px; margin: 20px 0; text-align: center; }
    .note { background: #0f172a; border-left: 3px solid #6366f1; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #94a3b8; }
    .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 24px; }
    .url { word-break: break-all; font-size: 12px; color: #818cf8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">☕🔐</div>
      <h1>Password Reset Request</h1>
    </div>
    <p>Hi ${displayName},</p>
    <p>We received a request to reset your password for your <strong>Cafe Games</strong> account. Click the button below to choose a new password:</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="btn">Reset My Password</a>
    </div>
    <div class="note">
      This password reset link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.
    </div>
    <p style="font-size: 13px; color: #64748b;">If the button doesn't work, copy and paste this link into your browser:<br/>
      <span class="url">${resetUrl}</span>
    </p>
    <div class="footer">
      <p>Cafe Games • Keeping your gaming account secure</p>
    </div>
  </div>
</body>
</html>
`;

  try {
    const result = await mailtrapClient.send({
      from: sender,
      to: [{ email }],
      subject: "Reset your Cafe Games password 🔐",
      text: `Hi ${displayName}, reset your Cafe Games password using this link: ${resetUrl} (valid for 1 hour). If you did not request this, please ignore this email.`,
      html,
      category: "Password Reset",
    });
    console.log("Password reset email sent successfully to", email, result);
    return true;
  } catch (err) {
    console.error("Failed to send password reset email via Mailtrap to", email, err);
    return false;
  }
}
