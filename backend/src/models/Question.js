import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // e.g. "A", "B", "C", "D"
    textLaTeX: { type: String, required: true }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    examType: {
      type: String,
      enum: ['JEE_ADVANCED', 'GATE_CS', 'NEET'],
      required: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    topic: {
      type: String,
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM'
    },
    questionType: {
      type: String,
      enum: ['MCQ', 'MSQ', 'NUMERICAL'],
      required: true
    },
    contentLaTeX: {
      type: String,
      required: true
    },
    options: [optionSchema],
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed, // String, Array, or Number
      required: true
    },
    positiveMarks: {
      type: Number,
      default: 4
    },
    negativeMarks: {
      type: Number,
      default: 1
    },
    numericalTolerance: {
      type: Number,
      default: 0.01
    },
    solutionLaTeX: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export const Question = mongoose.model('Question', questionSchema);
