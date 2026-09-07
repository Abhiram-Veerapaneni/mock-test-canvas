import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: ['VIOLATION', 'EXAM_SUBMISSION', 'EXAM_CREATED', 'SYSTEM'],
      default: 'SYSTEM',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    data: {
      examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
      },
      examTitle: {
        type: String,
        default: '',
      },
      attemptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attempt',
      },
      candidateName: {
        type: String,
        default: 'Candidate',
      },
      candidateEmail: {
        type: String,
        default: '',
      },
      violationType: {
        type: String,
        default: '',
      },
      imageUrl: {
        type: String,
        default: null,
      },
      trustScore: {
        type: Number,
        default: null,
      },
      totalViolations: {
        type: Number,
        default: 0,
      },
      score: {
        type: Number,
        default: null,
      },
      totalMarks: {
        type: Number,
        default: null,
      },
      accuracy: {
        type: Number,
        default: null,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
    link: {
      type: String,
      default: '',
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user notifications sorted by time
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
