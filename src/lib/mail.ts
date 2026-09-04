import { MailtrapClient } from "mailtrap";
import { env } from "@/lib/env";

const mailtrapClient = new MailtrapClient({
  token: env.MAILTRAP_TOKEN || "ed06c46b145e7e146c05aa83b73d4476",
});

function getSender() {
  const email =
    env.MAILTRAP_SENDER_EMAIL && env.MAILTRAP_SENDER_EMAIL.includes("@")
      ? env.MAILTRAP_SENDER_EMAIL
      : "hello@demomailtrap.co";
  const name = env.MAILTRAP_SENDER_NAME || "Cafe Games";
  return { email, name };
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send welcome email to newly registered user
 */
export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name?: string | null;
}): Promise<SendMailResult> {
  const displayName = name?.trim() || to.split("@")[0] || "Friend";
  const sender = getSender();
  const appUrl = env.APP_URL.replace(/\/$/, "");

  const subject = "☕ Welcome to Cafe Games! مرحباً بك في ألعاب القهوة";

  const text = `Welcome to Cafe Games, ${displayName}!

Your account has been created successfully. You can now challenge your friends in classic cafe multiplayer games:
- 🐒 Quarter Monkey (ربع قرد)
- 🎲 Bank El Hazz (بنك الحظ)
- 🔩 Screw (سكرو)
- 🀄 Domino (دومينو)
- 🎴 UNO (أونو)
- 🎭 Bekasa (بكاسة)
- 😉 Blink (غمازة)
- 🚌 Autobus Complete (أتوبيس كومبليت)
- ♠️ Estimation (استميشن)
- ⚽ Sabaho Tahadi (صباحو تحدي)

Jump into the lobby now: ${appUrl}/dashboard

Have fun and happy gaming!
Cafe Games Team`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; color: #e0e7ff; font-size: 14px; }
    .content { padding: 32px 28px; line-height: 1.6; color: #d4d4d8; font-size: 15px; }
    .greeting { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
    .games-badge { background-color: #27272a; border-radius: 12px; padding: 16px; margin: 20px 0; }
    .game-item { display: inline-block; background-color: #3f3f46; color: #fafafa; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin: 4px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; margin: 24px 0 12px; text-align: center; }
    .footer { border-top: 1px solid #27272a; padding: 20px 24px; text-align: center; font-size: 12px; color: #71717a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>☕ Cafe Games</h1>
      <p>ألعاب القهوة والمصايف مع أصحابك أونلاين</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${displayName}! 👋</div>
      <p>Welcome to <strong>Cafe Games</strong>. Your account has been registered successfully. You're now ready to create rooms, invite friends, and play your favorite real-time Egyptian cafe games right in the browser.</p>
      
      <div class="games-badge">
        <span class="game-item">🐒 ربع قرد</span>
        <span class="game-item">🎲 بنك الحظ</span>
        <span class="game-item">🔩 سكرو</span>
        <span class="game-item">🀄 دومينو</span>
        <span class="game-item">🎴 أونو</span>
        <span class="game-item">🎭 بكاسة</span>
        <span class="game-item">😉 غمازة</span>
        <span class="game-item">⚽ صباحو تحدي</span>
      </div>

      <div style="text-align: center;">
        <a href="${appUrl}/dashboard" class="btn">Go to Dashboard →</a>
      </div>
      
      <p style="font-size: 13px; color: #a1a1aa; margin-top: 20px;">
        Tip: You can customize your nickname and avatar anytime from your profile settings.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Cafe Games. All rights reserved.
    </div>
  </div>
</body>
</html>`;

  try {
    const result = await mailtrapClient.send({
      from: sender,
      to: [{ email: to }],
      subject,
      text,
      html,
      category: "Welcome Email",
    });

    console.log(`[Mailtrap] Welcome email dispatched to ${to}:`, result);
    return { success: true, messageId: result?.message_ids?.[0] };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[Mailtrap] Failed sending welcome email to ${to}:`, errMessage);
    return { success: false, error: errMessage };
  }
}

/**
 * Send password reset email with token link
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}): Promise<SendMailResult> {
  const sender = getSender();

  const subject = "🔒 Reset Your Cafe Games Password | إعادة تعيين كلمة المرور";

  const text = `Hello,

We received a request to reset the password for your Cafe Games account associated with ${to}.

Click the following link to reset your password (valid for 1 hour):
${resetUrl}

If you did not request a password reset, please ignore this email. Your password will remain unchanged.

Cafe Games Team`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; }
    .header p { margin: 8px 0 0; color: #ffe4e6; font-size: 13px; }
    .content { padding: 32px 28px; line-height: 1.6; color: #d4d4d8; font-size: 15px; }
    .greeting { font-size: 17px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #e11d48 0%, #f43f5e 100%); color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; margin: 24px 0 16px; text-align: center; }
    .alert-box { background-color: #27272a; border-left: 4px solid #f43f5e; padding: 14px 16px; border-radius: 8px; font-size: 13px; color: #a1a1aa; margin-top: 20px; }
    .link-fallback { word-break: break-all; font-size: 12px; color: #818cf8; margin-top: 10px; }
    .footer { border-top: 1px solid #27272a; padding: 20px 24px; text-align: center; font-size: 12px; color: #71717a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Password Reset Request</h1>
      <p>طلب إعادة تعيين كلمة المرور - Cafe Games</p>
    </div>
    <div class="content">
      <div class="greeting">Reset Password</div>
      <p>We received a request to reset the password for your account (<strong>${to}</strong>).</p>
      <p>Click the button below to set a new password. For security reasons, this link will expire in <strong>1 hour</strong>.</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset My Password →</a>
      </div>

      <div class="alert-box">
        If you did not make this request, you can safely ignore this email. Your password will remain unchanged.
      </div>

      <p style="font-size: 12px; color: #71717a; margin-top: 20px;">
        Button not working? Copy and paste this link into your browser:
        <br>
        <span class="link-fallback">${resetUrl}</span>
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Cafe Games. All rights reserved.
    </div>
  </div>
</body>
</html>`;

  try {
    const result = await mailtrapClient.send({
      from: sender,
      to: [{ email: to }],
      subject,
      text,
      html,
      category: "Password Reset",
    });

    console.log(`[Mailtrap] Password reset email sent to ${to}:`, result);
    return { success: true, messageId: result?.message_ids?.[0] };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[Mailtrap] Failed sending reset email to ${to}:`, errMessage);
    return { success: false, error: errMessage };
  }
}
