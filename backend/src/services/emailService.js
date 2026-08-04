import nodemailer from 'nodemailer';

/**
 * Creates Nodemailer transporter using SMTP configuration with IPv4 family enforced
 * to prevent ENETUNREACH errors on IPv6-restricted platforms like Render.
 */
const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 465,
      secure: process.env.EMAIL_SECURE !== undefined ? String(process.env.EMAIL_SECURE).toLowerCase() === 'true' : true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      family: 4 // Force IPv4 connection to prevent ENETUNREACH on cloud hosts like Render
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

  const transporter = createTransporter();

  if (!transporter) {
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

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"AI-Proctored Mock Tests" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `${otpCode} is your AI-Proctored Mock Tests Verification OTP`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ REAL EMAIL DELIVERED TO: ${toEmail} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`⚠️ Email Dispatch Error (${error.message}). Backup OTP logged above.`);
    return { success: false, fallback: true, error: error.message };
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
