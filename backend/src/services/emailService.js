import dns from 'dns';
import nodemailer from 'nodemailer';

// Force Node.js to resolve IPv4 addresses first globally to prevent ENETUNREACH on IPv6-restricted cloud hosts like Render
dns.setDefaultResultOrder('ipv4first');

/**
 * Custom DNS lookup to strictly enforce IPv4 (A records) resolution.
 * Prevents Nodemailer from falling back to IPv6 (AAAA records like 2607:f8b0:...)
 * which cause ENETUNREACH errors on networks/hosts without IPv6 routing.
 */
const customIPv4Lookup = (hostname, options, callback) => {
  dns.lookup(hostname, { family: 4, all: false }, (err, address, family) => {
    if (err) return callback(err);
    callback(null, address, family);
  });
};

/**
 * Creates Nodemailer transporter using SMTP configuration with strict IPv4 lookup
 */
const createTransporter = (portOverride = null, secureOverride = null) => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const envPort = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 465;
    const port = portOverride !== null ? portOverride : envPort;

    const envSecure = process.env.EMAIL_SECURE !== undefined
      ? String(process.env.EMAIL_SECURE).toLowerCase() === 'true'
      : port === 465;
    const secure = secureOverride !== null ? secureOverride : envSecure;

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      family: 4,
      lookup: customIPv4Lookup,
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
  }
  return null;
};

/**
 * Sends OTP Email to candidate's inbox
 * @param {string} toEmail - Recipient candidate email ID
 * @param {string} otpCode - 6-digit numeric OTP code
 * @param {string} candidateName - Candidate full name
 */
export const sendOTPEmail = async (toEmail, otpCode, candidateName = 'Candidate') => {
  // Log OTP to server console as backup
  logOTPToConsole(toEmail, otpCode);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return { success: true, simulated: true };
  }

  // HTML Email Template
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2563eb; margin: 0;">AI-Proctored Mock Tests</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Candidate Verification Code</p>
      </div>

      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <p style="color: #334155; font-size: 15px; margin-bottom: 12px;">Hello <strong>${candidateName}</strong>,</p>
        <p style="color: #475569; font-size: 14px; margin-bottom: 16px;">Your 6-digit confirmation OTP for account registration is:</p>
        
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2563eb; background-color: #eff6ff; padding: 12px 24px; border-radius: 8px; display: inline-block; border: 1px border-dashed #93c5fd;">
          ${otpCode}
        </div>

        <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
      </div>

      <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 12px;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">AI-Proctored Mock Tests Platform • MongoDB pmt_db</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"AI-Proctored Mock Tests" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `${otpCode} is your AI-Proctored Mock Tests Verification OTP`,
    html: htmlContent
  };

  // Primary Attempt (Default Port 465 / Configured Port)
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ REAL EMAIL DELIVERED TO: ${toEmail} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (primaryError) {
    console.warn(`⚠️ Primary Email Dispatch attempt failed (${primaryError.message}). Retrying over Port 587 (TLS/STARTTLS)...`);

    // Fallback Attempt (Port 587 STARTTLS)
    try {
      const fallbackTransporter = createTransporter(587, false);
      const fallbackInfo = await fallbackTransporter.sendMail(mailOptions);
      console.log(`✉️ REAL EMAIL DELIVERED via Fallback Port 587 TO: ${toEmail} (Message ID: ${fallbackInfo.messageId})`);
      return { success: true, messageId: fallbackInfo.messageId };
    } catch (fallbackError) {
      console.error(`⚠️ Email Dispatch Error (${fallbackError.message}). Backup OTP logged above.`);
      return { success: false, fallback: true, error: fallbackError.message };
    }
  }
};

/**
 * Console log helper for dev backup
 */
const logOTPToConsole = (toEmail, otpCode) => {
  console.log(`\n=================================================`);
  console.log(`📩 Verification Email dispatched to: ${toEmail}`);
  console.log(`🔑 OTP CODE: [ ${otpCode} ]`);
  console.log(`⏱️ VALID FOR: 10 MINUTES`);
  console.log(`=================================================\n`);
};
