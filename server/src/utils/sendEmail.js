import nodemailer from 'nodemailer';

export const sendOtpEmail = async ({ to, otp }) => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT) || 465;
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = `"Mock Test Canvas" <${user}>`;

  if (!user || !pass) {
    throw new Error('Email delivery service is not configured.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    connectionTimeout: 6000, // 6s connection timeout
    greetingTimeout: 6000,
    socketTimeout: 8000,     // 8s socket timeout
    auth: {
      user,
      pass
    }
  });

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 18px; border-radius: 12px; font-weight: bold; font-size: 16px; letter-spacing: -0.02em;">
          Mock Test Canvas
        </div>
      </div>
      
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-bottom: 12px; text-align: center;">
        Verify Your Email Address
      </h2>
      
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
        Use the 6-digit verification code below to complete your account registration:
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e40af;">
          ${otp}
        </span>
      </div>

      <p style="color: #64748b; font-size: 12px; line-height: 1.5; text-align: center; margin-bottom: 24px;">
        This code expires in <strong>5 minutes</strong>. If you did not request this email, you can safely ignore it.
      </p>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
        &copy; ${new Date().getFullYear()} Mock Test Canvas. All rights reserved.
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `${otp} is your Mock Test Canvas verification code`,
    html: htmlContent
  });

  return true;
};
