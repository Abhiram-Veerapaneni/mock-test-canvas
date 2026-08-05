import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    textLaTeX: { type: String, required: true }
  },
  { _id: false }
);

const embeddedQuestionSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'MEDIUM' },
    questionType: { type: String, enum: ['MCQ', 'MSQ', 'NUMERICAL'], required: true },
    contentLaTeX: { type: String, required: true },
    options: [optionSchema],
    correctAnswer: { type: mongoose.Schema.Types.Mixed, required: true },
    positiveMarks: { type: Number, default: 4 },
    negativeMarks: { type: Number, default: 1 },
    numericalTolerance: { type: Number, default: 0.01 },
    solutionLaTeX: { type: String }
  },
  { _id: true }
);

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    questionCount: { type: Number, required: true },
    questions: [embeddedQuestionSchema]
  },
  { _id: false }
);

const jeeAdvancedPaperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
    year: { type: Number, required: true },
    paperNumber: { type: String, required: true }, // e.g. "Paper 1" or "Slot 1"
    examType: { type: String, default: 'JEE_ADVANCED' },
    description: { type: String },
    durationMinutes: { type: Number, default: 180 },
    totalMarks: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    sections: [sectionSchema],
    proctoringConfig: {
      enabledByDefault: { type: Boolean, default: true },
      maxStrikes: { type: Number, default: 3 },
      faceCheckIntervalSec: { type: Number, default: 3 },
      allowFullscreenExit: { type: Boolean, default: false }
    }
  },
  {
    timestamps: true,
    collection: 'jee_advanced_previous_year_papers'
  }
);

export const JeeAdvancedPaper = mongoose.model('JeeAdvancedPaper', jeeAdvancedPaperSchema);
