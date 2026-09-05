import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, 'Question text is required']
    },
    questionType: {
      type: String,
      enum: ['MCQ', 'MSQ', 'NAT'],
      required: [true, 'Question type is required'],
      default: 'MCQ'
    },
    imageAttachment: {
      type: String,
      default: ''
    },
    options: [
      {
        type: String
      }
    ],
    correctAnswers: [
      {
        type: Number,
        required: true
      }
    ],
    explanation: {
      type: String,
      default: ''
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    topic: {
      type: String,
      default: 'General',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const Question = mongoose.model('Question', questionSchema);
export default Question;
