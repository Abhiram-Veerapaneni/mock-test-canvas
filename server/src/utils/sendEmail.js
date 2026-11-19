import { sendOTPEmail } from '../services/emailService.js';

/**
 * Backward-compatible wrapper for sendOtpEmail delegating to emailService.
 * Supports Brevo HTTP API (Port 443), Nodemailer IPv4 SMTP, and console backup logging.
 */
export const sendOtpEmail = async ({ to, otp, candidateName = 'Candidate' }) => {
  return sendOTPEmail(to, otp, candidateName);
};

export default sendOtpEmail;
