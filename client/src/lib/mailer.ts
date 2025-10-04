import nodemailer from 'nodemailer';

interface MailerConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
}

function resolveMailerConfig(): MailerConfig | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  if (!host || !port || !from) {
    return null;
  }
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  return {
    host,
    port,
    secure,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from,
  };
}

export async function sendPasswordEmail(recipient: string, password: string): Promise<void> {
  const config = resolveMailerConfig();
  if (!config) {
    console.info('[mailer] SMTP config missing; skipping email to %s. Generated password: %s', recipient, password);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user && config.pass ? { user: config.user, pass: config.pass } : undefined,
  });

  await transporter.sendMail({
    from: config.from,
    to: recipient,
    subject: 'Your new ExpensEasy password',
    text: `Hello,

Your password has been reset by an administrator. You can sign in with the temporary password below:

${password}

Please change this password after logging in.

— ExpensEasy`,
    html: `<p>Hello,</p><p>Your password has been reset by an administrator. You can sign in with the temporary password below:</p><p style="font-size:18px;font-weight:bold;letter-spacing:1px;">${password}</p><p>Please change this password after logging in.</p><p>— ExpensEasy</p>`,
  });
}

export async function sendPasswordResetEmail(recipient: string, name: string, resetUrl: string): Promise<void> {
  const config = resolveMailerConfig();
  if (!config) {
    console.info('[mailer] SMTP config missing; skipping password reset email to %s. Reset URL: %s', recipient, resetUrl);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user && config.pass ? { user: config.user, pass: config.pass } : undefined,
  });

  await transporter.sendMail({
    from: config.from,
    to: recipient,
    subject: 'Reset your ExpensEasy password',
    text: `Hello ${name},

We received a request to reset your password for your ExpensEasy account.

Click the link below to reset your password (valid for 1 hour):

${resetUrl}

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

— ExpensEasy`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Reset Your Password</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your password for your ExpensEasy account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
      <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="color: #0070f3; font-size: 12px; word-break: break-all;">${resetUrl}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      <p style="color: #999; font-size: 12px;">— ExpensEasy</p>
    </div>`,
  });
}
