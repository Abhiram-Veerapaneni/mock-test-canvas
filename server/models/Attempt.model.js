import mongoose from 'mongoose';

const responseItemSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedAnswers: [
      {
        type: Number
      }
    ],
    status: {
      type: String,
      enum: [
        'NOT_VISITED',
        'NOT_ANSWERED',
        'ANSWERED',
        'MARKED_FOR_REVIEW',
        'ANSWERED_AND_MARKED_FOR_REVIEW'
      ],
      default: 'NOT_VISITED'
    },
    timeSpentSeconds: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const violationItemSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    responses: [responseItemSchema],
    score: {
      type: Number,
      default: 0
    },
    accuracy: {
      type: Number,
      default: 0
    },
    trustScore: {
      type: Number,
      default: 100
    },
    violations: [violationItemSchema],
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'SUBMITTED', 'DISQUALIFIED'],
      default: 'IN_PROGRESS'
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    submittedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export const Attempt = mongoose.model('Attempt', attemptSchema);
export default Attempt;
