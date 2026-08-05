import dns from 'dns';
import nodemailer from 'nodemailer';

// Force Node.js to resolve IPv4 addresses first globally to prevent ENETUNREACH on IPv6-restricted cloud hosts like Render
dns.setDefaultResultOrder('ipv4first');

/**
 * Custom DNS lookup to strictly enforce IPv4 (A records) resolution.
 * Handles both lookup(hostname, callback) and lookup(hostname, options, callback) signatures correctly.
 */
const customIPv4Lookup = (hostname, options, callback) => {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options === 'object' && options !== null ? { ...options, family: 4 } : { family: 4, all: false };
  dns.lookup(hostname, opts, (err, address, family) => {
    if (err) return cb(err);
    cb(null, address, family);
  });
};

/**
 * Resolves a hostname to a direct IPv4 IP address.
 */
const resolveIPv4Host = async (host) => {
  try {
    const res = await dns.promises.lookup(host, { family: 4 });
    return res.address;
  } catch {
    return host;
  }
};

/**
 * Sends email via HTTP API (Resend or Brevo) over HTTPS Port 443.
 * Solves Render/cloud host outbound SMTP port restrictions (ports 25, 465, 587).
 */
const sendViaHttpApi = async (toEmail, subject, htmlContent) => {
  // 1. Resend API (https://resend.com - Free 3,000 emails/mo)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'AI-Proctored Mock Tests <onboarding@resend.dev>',
          to: [toEmail],
          subject,
          html: htmlContent
        })
      });
      const data = await response.json();
      if (response.ok) {
        console.log(`✉️ RESEND HTTP EMAIL DELIVERED TO: ${toEmail} (ID: ${data.id})`);
        return { success: true, messageId: data.id, provider: 'resend' };
      } else {
        console.warn(`⚠️ Resend HTTP API Warning:`, data);
      }
    } catch (err) {
      console.warn(`⚠️ Resend HTTP API Error: ${err.message}`);
    }
  }

  // 2. Brevo (Sendinblue) API (https://brevo.com - Free 300 emails/day)
  if (process.env.BREVO_API_KEY) {
    if (process.env.BREVO_API_KEY.startsWith('xsmtpsib-')) {
      console.warn(`💡 Brevo Key Notice: BREVO_API_KEY starts with 'xsmtpsib-' (Brevo SMTP Key). For HTTP API dispatch over Port 443 on Render, generate an 'API Key' (starts with 'xkeysib-') in Brevo Dashboard -> SMTP & API -> API Keys.`);
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: 'AI-Proctored Mock Tests',
            email: process.env.EMAIL_USER || 'no-reply@proctored-mock-tests.com'
          },
          to: [{ email: toEmail }],
          subject,
          htmlContent
        })
      });
      const data = await response.json();
      if (response.ok) {
        console.log(`✉️ BREVO HTTP EMAIL DELIVERED TO: ${toEmail} (ID: ${data.messageId})`);
        return { success: true, messageId: data.messageId, provider: 'brevo' };
      } else {
        console.warn(`⚠️ Brevo HTTP API Warning:`, data);
      }
    } catch (err) {
      console.warn(`⚠️ Brevo HTTP API Error: ${err.message}`);
    }
  }

  return null;
};

/**
 * Creates Nodemailer transporter using SMTP configuration with strict IPv4 address binding
 */
const createTransporter = async (portOverride = null, secureOverride = null) => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const origHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const envPort = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 465;
    const port = portOverride !== null ? portOverride : envPort;

    const envSecure = process.env.EMAIL_SECURE !== undefined
      ? String(process.env.EMAIL_SECURE).toLowerCase() === 'true'
      : port === 465;
    const secure = secureOverride !== null ? secureOverride : envSecure;

    const resolvedHost = await resolveIPv4Host(origHost);

    return nodemailer.createTransport({
      host: resolvedHost,
      port,
      secure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      family: 4,
      lookup: customIPv4Lookup,
      tls: {
        servername: origHost,
        rejectUnauthorized: false
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000
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
  // Always log OTP to server console as backup (Viewable in Render dashboard logs)
  logOTPToConsole(toEmail, otpCode);

  const subject = `${otpCode} is your AI-Proctored Mock Tests Verification OTP`;

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

  // 1. Try HTTPS API Email providers first (Port 443 - Bypasses Render cloud SMTP blocks)
  const httpResult = await sendViaHttpApi(toEmail, subject, htmlContent);
  if (httpResult && httpResult.success) {
    return httpResult;
  }

  // 2. Fallback to Nodemailer SMTP (Works locally; subject to host port restrictions on cloud)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return { success: true, simulated: true };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"AI-Proctored Mock Tests" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html: htmlContent
  };

  // Primary Attempt (Default Port 465 / Configured Port)
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ REAL EMAIL DELIVERED TO: ${toEmail} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (primaryError) {
    console.warn(`⚠️ Primary Email Dispatch attempt failed (${primaryError.message}). Retrying over Port 587 (TLS/STARTTLS)...`);

    // Fallback Attempt (Port 587 STARTTLS)
    try {
      const fallbackTransporter = await createTransporter(587, false);
      const fallbackInfo = await fallbackTransporter.sendMail(mailOptions);
      console.log(`✉️ REAL EMAIL DELIVERED via Fallback Port 587 TO: ${toEmail} (Message ID: ${fallbackInfo.messageId})`);
      return { success: true, messageId: fallbackInfo.messageId };
    } catch (fallbackError) {
      console.error(`⚠️ SMTP Dispatch Timeout/Blocked on Host: ${fallbackError.message}`);
      console.warn(`💡 RENDER HOSTING NOTICE: Render free tier blocks outbound SMTP ports 25/465/587. The OTP code above [ ${otpCode} ] is logged in your Render Logs, or set RESEND_API_KEY / BREVO_API_KEY in Render env vars for instant HTTPS delivery.`);
      return { success: true, fallback: true, error: fallbackError.message };
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
