import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      default: ''
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
        type: mongoose.Schema.Types.Mixed
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
      default: function () {
        return this.stream || 'General';
      },
      trim: true
    },
    topic: {
      type: String,
      default: 'General',
      trim: true
    },
    stream: {
      type: String,
      trim: true,
      default: 'General'
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    isInBank: {
      type: Boolean,
      default: false
    },
    bankAddedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Ensure at least questionText or imageAttachment is provided
questionSchema.pre('validate', function (next) {
  const hasText = this.questionText && this.questionText.trim().length > 0;
  const hasImage = this.imageAttachment && this.imageAttachment.trim().length > 0;
  if (!hasText && !hasImage) {
    this.invalidate('questionText', 'Either question text or an image attachment must be provided.');
  }
  next();
});

export const Question = mongoose.model('Question', questionSchema);
export default Question;
