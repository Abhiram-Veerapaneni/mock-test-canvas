import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true
    },
    otp: {
      type: String,
      required: [true, 'OTP is required']
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300 // Automatically deletes document from MongoDB after 5 minutes (300 seconds)
    }
  },
  {
    timestamps: true
  }
);

export const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
