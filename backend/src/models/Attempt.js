import mongoose from 'mongoose';

const proctoringLogSchema = new mongoose.Schema(
  {
    timestamp: { type: String, required: true },
    eventType: {
      type: String,
      enum: ['TAB_SWITCH', 'FULLSCREEN_EXIT', 'NO_FACE_DETECTED', 'MULTIPLE_FACES_DETECTED', 'STRIKE_WARNING', 'WEBCAM_STARTED'],
      required: true
    },
    details: { type: String, required: true }
  },
  { _id: false }
);

const responseSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedOptions: [{ type: String }],
    numericalAnswer: { type: String, default: null },
    status: {
      type: String,
      enum: ['NOT_VISITED', 'NOT_ANSWERED', 'ANSWERED', 'MARKED_FOR_REVIEW', 'ANSWERED_AND_MARKED', 'CORRECT', 'INCORRECT', 'UNANSWERED'],
      default: 'UNANSWERED'
    },
    isCorrect: { type: Boolean, default: false },
    scoreAwarded: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 }
  },
  { _id: false }
);

const topicBreakdownSchema = new mongoose.Schema(
  {
    subject: String,
    topic: String,
    totalQuestions: Number,
    attempted: Number,
    correct: Number,
    incorrect: Number,
    scoreEarned: Number,
    maxScore: Number,
    accuracyPercent: Number,
    timeSpentSec: Number
  },
  { _id: false }
);

const summaryStatsSchema = new mongoose.Schema(
  {
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    attemptedCount: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    unansweredCount: { type: Number, default: 0 },
    accuracyPercentage: { type: Number, default: 0 },
    totalTimeSpentSec: { type: Number, default: 0 },
    topicBreakdown: [topicBreakdownSchema]
  },
  { _id: false }
);

const aiDiagnosticReportSchema = new mongoose.Schema(
  {
    executiveSummary: String,
    strengths: [String],
    weaknesses: [String],
    timeManagement: String,
    actionPlan: [String]
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    examTitle: { type: String, required: true },
    examType: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isProctored: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'SUBMITTED', 'TERMINATED'],
      default: 'IN_PROGRESS'
    },
    strikesCount: { type: Number, default: 0 },
    proctoringLogs: [proctoringLogSchema],
    summaryStats: summaryStatsSchema,
    responses: [responseSchema],
    aiDiagnosticReport: aiDiagnosticReportSchema,
    submittedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

export const Attempt = mongoose.model('Attempt', attemptSchema);
