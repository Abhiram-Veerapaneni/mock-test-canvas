import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.model.js';
import { Otp } from '../models/Otp.model.js';
import { sendOtpEmail } from '../utils/sendEmail.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Generate signed JWT
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d'
  });
};

/**
 * @desc    Send 6-digit OTP verification code to user email
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address (e.g. name@domain.com).'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // Generate random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTP for this email
    await Otp.deleteMany({ email: normalizedEmail });

    // Save new OTP
    await Otp.create({ email: normalizedEmail, otp: generatedOtp });

    // Send real verification email via Nodemailer
    try {
      await sendOtpEmail({ to: normalizedEmail, otp: generatedOtp });
    } catch (emailErr) {
      console.error('[EMAIL OTP FAIL] Could not dispatch email to:', normalizedEmail, emailErr.message);
      return res.status(400).json({
        success: false,
        message: 'Failed to deliver verification code. Please check that your email address is valid.'
      });
    }

    console.log(`[EMAIL OTP VERIFICATION] Verification email dispatched to: ${normalizedEmail}`);

    return res.status(200).json({
      success: true,
      message: 'Verification code sent to your email inbox'
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process verification code request' });
  }
};

/**
 * @desc    Verify 6-digit OTP code
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: normalizedEmail, otp: otp.trim() });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    return res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify code' });
  }
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Verify OTP if provided
    if (otp) {
      const otpRecord = await Otp.findOne({ email: normalizedEmail, otp: otp.trim() });
      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification code'
        });
      }
      // Delete used OTP
      await Otp.deleteMany({ email: normalizedEmail });
    }

    // Create user (password is hashed by pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdTests: user.createdTests,
        attemptedTests: user.attemptedTests,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

/**
 * @desc    Login user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdTests: user.createdTests,
        attemptedTests: user.attemptedTests,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('createdTests', 'title category durationMinutes totalMarks');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching user profile'
    });
  }
};

/**
 * @desc    Authenticate with Google OAuth ID Token
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential token is required'
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token payload'
      });
    }

    const { sub: googleId, email, name, picture: avatar } = payload;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email: normalizedEmail }]
    });

    if (user) {
      let needsSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = user.authProvider === 'local' ? 'google' : user.authProvider;
        needsSave = true;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    } else {
      user = await User.create({
        name: name || 'Google Candidate',
        email: normalizedEmail,
        googleId,
        avatar: avatar || '',
        authProvider: 'google'
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Google sign-in successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdTests: user.createdTests,
        attemptedTests: user.attemptedTests,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(401).json({
      success: false,
      message: error.message || 'Google token verification failed'
    });
  }
};
