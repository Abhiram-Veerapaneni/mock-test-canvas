import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }]
  },
  { _id: false }
);

const proctoringConfigSchema = new mongoose.Schema(
  {
    enabledByDefault: { type: Boolean, default: true },
    maxStrikes: { type: Number, default: 3 },
    faceCheckIntervalSec: { type: Number, default: 3 },
    allowFullscreenExit: { type: Boolean, default: false }
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    examType: {
      type: String,
      enum: ['JEE_ADVANCED', 'GATE_CS', 'NEET'],
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 60
    },
    totalMarks: {
      type: Number,
      required: true
    },
    proctoringConfig: {
      type: proctoringConfigSchema,
      default: () => ({})
    },
    sections: [sectionSchema]
  },
  {
    timestamps: true
  }
);

export const Exam = mongoose.model('Exam', examSchema);
