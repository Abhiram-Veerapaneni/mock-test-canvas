import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    category: {
      type: String,
      enum: ['JEE', 'NEET', 'GATE', 'APTITUDE', 'CUSTOM'],
      default: 'JEE'
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      default: 180
    },
    totalMarks: {
      type: Number,
      default: 100
    },
    maxAttempts: {
      type: Number,
      default: null, // null = unlimited
      min: 1,
      // null = unlimited attempts
    },
    markingScheme: {
      correct: {
        type: Number,
        default: 4
      },
      incorrect: {
        type: Number,
        default: -1
      }
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      }
    ],
    proctorSettings: {
      faceCheck: {
        type: Boolean,
        default: true
      },
      audioCheck: {
        type: Boolean,
        default: true
      },
      fullScreenLock: {
        type: Boolean,
        default: true
      },
      maxWarningsAllowed: {
        type: Number,
        default: 3
      }
    }
  },
  {
    timestamps: true
  }
);

export const Exam = mongoose.model('Exam', examSchema);
export default Exam;
