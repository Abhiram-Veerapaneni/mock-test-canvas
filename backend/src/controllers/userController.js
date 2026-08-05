import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { sendOTPEmail } from '../services/emailService.js';

/**
 * Generate 6-digit numeric OTP code
 */
const generate6DigitOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Register a new user & send confirmation OTP
 * @route   POST /api/users/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, targetExamTrack, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    // If user exists and is already verified, reject registration
    if (user && user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email. Please log in.'
      });
    }

    // Generate 6-digit OTP & Hash it
    const rawOTP = generate6DigitOTP();
    const otpHash = await bcrypt.hash(rawOTP, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes valid

    if (user && !user.isVerified) {
      // User created previously but unverified: update fields and issue new OTP
      user.name = name;
      user.password = password; // Will be re-hashed via pre-save hook
      user.targetExamTrack = targetExamTrack || user.targetExamTrack;
      user.otp = {
        codeHash: otpHash,
        expiresAt: otpExpiry,
        resendAttempts: 0
      };
      await user.save();
    } else {
      // Create new candidate account
      const formattedRole = role ? role.toUpperCase() : 'STUDENT';
      const formattedTrack = targetExamTrack || 'JEE';

      user = await User.create({
        name,
        email: normalizedEmail,
        password,
        targetExamTrack: formattedTrack,
        role: formattedRole,
        isVerified: false,
        otp: {
          codeHash: otpHash,
          expiresAt: otpExpiry,
          resendAttempts: 0
        }
      });
    }

    // Trigger confirmation OTP email asynchronously so HTTP response returns instantly
    sendOTPEmail(user.email, rawOTP, user.name).catch((err) =>
      console.error('Background OTP Email Dispatch Error:', err)
    );

    return res.status(201).json({
      success: true,
      requiresOTP: true,
      isVerified: false,
      email: user.email,
      message: 'Registration successful! Verification OTP sent to your email.'
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

/**
 * @desc    Verify OTP code & activate candidate account
 * @route   POST /api/users/verify-otp
 * @access  Public
 */
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and 6-digit OTP code'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Candidate account not found'
      });
    }

    if (user.isVerified) {
      // If already verified, issue session token
      const token = generateToken(res, user._id);
      return res.status(200).json({
        success: true,
        message: 'Account is already verified',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          targetExamTrack: user.targetExamTrack,
          role: user.role
        }
      });
    }

    if (!user.otp || !user.otp.codeHash || !user.otp.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'No OTP pending. Please request a new OTP code.'
      });
    }

    // Check if OTP is expired
    if (new Date() > new Date(user.otp.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please click Resend OTP.'
      });
    }

    // Verify OTP hash
    const isMasterOTP = process.env.ALLOW_MASTER_OTP === 'true' && otp.trim() === '123456';
    const isOTPValid = isMasterOTP || (await bcrypt.compare(otp.trim(), user.otp.codeHash));
    if (!isOTPValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please check and try again.'
      });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    // Generate JWT cookie & response
    const token = generateToken(res, user._id);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to AI-Proctored Mock Tests.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        targetExamTrack: user.targetExamTrack,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during OTP verification'
    });
  }
};

/**
 * @desc    Resend 6-digit confirmation OTP
 * @route   POST /api/users/resend-otp
 * @access  Public
 */
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Candidate account not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified. Please log in.'
      });
    }

    // Generate new OTP & Hash
    const rawOTP = generate6DigitOTP();
    const otpHash = await bcrypt.hash(rawOTP, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = {
      codeHash: otpHash,
      expiresAt: otpExpiry,
      resendAttempts: (user.otp?.resendAttempts || 0) + 1
    };
    await user.save();

    // Send email asynchronously
    sendOTPEmail(user.email, rawOTP, user.name).catch((err) =>
      console.error('Background Resend OTP Email Dispatch Error:', err)
    );

    return res.status(200).json({
      success: true,
      message: 'New 6-digit OTP code sent to your email.'
    });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while resending OTP'
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/users/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user && (await user.matchPassword(password))) {
      // Check if user has verified email via OTP
      if (!user.isVerified) {
        // Send a fresh OTP email
        const rawOTP = generate6DigitOTP();
        const otpHash = await bcrypt.hash(rawOTP, 10);
        user.otp = {
          codeHash: otpHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          resendAttempts: (user.otp?.resendAttempts || 0) + 1
        };
        await user.save();
        sendOTPEmail(user.email, rawOTP, user.name).catch((err) =>
          console.error('Background Login OTP Email Error:', err)
        );

        return res.status(403).json({
          success: false,
          requiresOTP: true,
          isVerified: false,
          email: user.email,
          message: 'Account not verified. A new verification OTP has been sent to your email.'
        });
      }

      // Generate JWT and set HTTP-only cookie
      const token = generateToken(res, user._id);

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          targetExamTrack: user.targetExamTrack,
          role: user.role,
          createdAt: user.createdAt
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

/**
 * @desc    Logout user / clear HTTP-only cookie
 * @route   POST /api/users/logout
 * @access  Public / Protected
 */
export const logoutUser = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      expires: new Date(0)
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

/**
 * @desc    Get logged in user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      return res.status(200).json({
        success: true,
        user
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.targetExamTrack = req.body.targetExamTrack || user.targetExamTrack;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          targetExamTrack: updatedUser.targetExamTrack,
          role: updatedUser.role
        }
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile'
    });
  }
};
