import mongoose from 'mongoose';
import { Question } from '../models/Question.model.js';
import { Exam } from '../models/Exam.model.js';
import { User } from '../models/User.model.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

/**
 * Utility to escape regular expression special characters to avoid injection crashes.
 */
const escapeRegex = (str) => (str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '');

/**
 * @desc    Get all question bank questions (paginated, with stream/tags/search filters)
 * @route   GET /api/questions
 * @access  Public / OptionalAuth
 */
export const getBankQuestions = async (req, res) => {
  try {
    const {
      stream,
      tags,
      search,
      page = 1,
      limit = 10,
      countOnly = false
    } = req.query;

    const query = { isInBank: true };

    if (stream && stream !== 'ALL') {
      query.stream = new RegExp(`^${escapeRegex(stream.trim())}$`, 'i');
    }

    if (tags) {
      const tagList = Array.isArray(tags)
        ? tags
        : tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        query.tags = { $in: tagList };
      }
    }

    if (search && search.trim()) {
      query.questionText = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    // Support debounced live count for modal
    if (countOnly === 'true' || countOnly === true) {
      const count = await Question.countDocuments(query);
      return res.status(200).json({ success: true, count });
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNumber - 1) * limitNumber;

    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .populate('bankAddedBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    const currentUserId = req.user?._id?.toString();

    // Redact correct answers and explanation for non-contributors
    const formattedQuestions = questions.map((q) => {
      const isContributor = Boolean(
        currentUserId &&
        q.bankAddedBy &&
        (q.bankAddedBy._id?.toString() === currentUserId || q.bankAddedBy.toString() === currentUserId)
      );

      return {
        _id: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        imageAttachment: q.imageAttachment,
        options: q.options,
        stream: q.stream || 'General',
        tags: q.tags || [],
        subject: q.subject || 'General',
        topic: q.topic || 'General',
        isInBank: q.isInBank,
        bankAddedBy: q.bankAddedBy,
        isContributor,
        isEdited: q.isEdited,
        editedAt: q.editedAt,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        correctAnswers: q.correctAnswers,
        explanation: q.explanation || ''
      };
    });

    return res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber) || 1,
      questions: formattedQuestions
    });
  } catch (error) {
    console.error('[getBankQuestions] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching bank questions'
    });
  }
};

/**
 * @desc    Create a new question directly into the Question Bank
 * @route   POST /api/questions
 * @access  Private
 */
export const createBankQuestion = async (req, res) => {
  try {
    const {
      questionText = '',
      questionType = 'MCQ',
      imageAttachment = '',
      options = [],
      correctAnswers = [],
      explanation = '',
      stream = 'General',
      tags = []
    } = req.body;

    const cleanText = (questionText || '').trim();
    const cleanImage = (imageAttachment || '').trim();

    if (!cleanText && !cleanImage) {
      return res.status(400).json({
        success: false,
        message: 'Either question statement or an image diagram must be provided.'
      });
    }

    const cleanStream = (stream || 'General').trim();
    const cleanTags = Array.isArray(tags)
      ? tags.map((t) => String(t).trim()).filter(Boolean)
      : typeof tags === 'string'
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const formattedOptions = Array.isArray(options)
      ? options.map((opt) => {
          if (typeof opt === 'object' && opt !== null) {
            return { text: opt.text || '', image: opt.image || '' };
          }
          return { text: String(opt || ''), image: '' };
        })
      : [];

    let cleanCorrectAnswers = [];
    if (questionType === 'NAT') {
      const min = Number(correctAnswers[0]);
      const max = correctAnswers.length > 1 ? Number(correctAnswers[1]) : min;
      if (isNaN(min) || isNaN(max)) {
        return res.status(400).json({
          success: false,
          message: 'Numerical Answer Type (NAT) requires valid numerical answer(s).'
        });
      }
      cleanCorrectAnswers = [Math.min(min, max), Math.max(min, max)];
    } else if (questionType === 'MCQ') {
      if (formattedOptions.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'MCQ questions require at least 2 options.'
        });
      }
      const ansIdx = Number(correctAnswers[0]);
      if (isNaN(ansIdx) || ansIdx < 0 || ansIdx >= formattedOptions.length) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid correct option for the MCQ.'
        });
      }
      cleanCorrectAnswers = [ansIdx];
    } else if (questionType === 'MSQ') {
      if (formattedOptions.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'MSQ questions require at least 2 options.'
        });
      }
      const validIndices = (Array.isArray(correctAnswers) ? correctAnswers : [])
        .map(Number)
        .filter((idx) => !isNaN(idx) && idx >= 0 && idx < formattedOptions.length);
      if (validIndices.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please select at least one correct option for MSQ.'
        });
      }
      cleanCorrectAnswers = Array.from(new Set(validIndices)).sort((a, b) => a - b);
    }

    const question = await Question.create({
      questionText: cleanText,
      questionType,
      imageAttachment: cleanImage,
      options: questionType === 'NAT' ? [] : formattedOptions,
      correctAnswers: cleanCorrectAnswers,
      explanation: (explanation || '').trim(),
      stream: cleanStream,
      tags: cleanTags,
      subject: cleanStream,
      topic: cleanTags.length > 0 ? cleanTags[0] : 'General',
      isInBank: true,
      bankAddedBy: req.user._id,
      isEdited: false
    });

    const populated = await Question.findById(question._id)
      .populate('bankAddedBy', 'name email avatar')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Question added to Question Bank successfully.',
      question: {
        ...populated,
        isContributor: true
      }
    });
  } catch (error) {
    console.error('[createBankQuestion] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating bank question'
    });
  }
};

/**
 * @desc    Fetch a single question by ID
 * @route   GET /api/questions/:id
 * @access  Public / OptionalAuth
 */
export const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Question ID' });
    }

    const question = await Question.findById(id)
      .populate('bankAddedBy', 'name email avatar')
      .lean();

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const currentUserId = req.user?._id?.toString();
    const isContributor = Boolean(
      currentUserId &&
      question.bankAddedBy &&
      (question.bankAddedBy._id?.toString() === currentUserId || question.bankAddedBy.toString() === currentUserId)
    );

    return res.status(200).json({
      success: true,
      question: {
        ...question,
        isContributor,
        correctAnswers: question.correctAnswers,
        explanation: question.explanation || ''
      }
    });
  } catch (error) {
    console.error('[getQuestionById] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching question'
    });
  }
};

/**
 * @desc    Update a question in the Question Bank (Contributor only)
 * @route   PUT /api/questions/:id
 * @access  Private
 */
export const updateBankQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Question ID' });
    }

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const currentUserId = req.user._id.toString();
    const contributorId = question.bankAddedBy?._id
      ? question.bankAddedBy._id.toString()
      : (question.bankAddedBy ? question.bankAddedBy.toString() : null);

    if (!contributorId || contributorId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only the original contributor can edit this question.'
      });
    }

    const {
      questionText,
      questionType,
      imageAttachment,
      options,
      correctAnswers,
      explanation,
      stream,
      tags
    } = req.body;

    if (questionText !== undefined) question.questionText = questionText.trim();
    if (imageAttachment !== undefined) question.imageAttachment = imageAttachment.trim();
    if (questionType) question.questionType = questionType;

    if (options !== undefined) {
      question.options = question.questionType === 'NAT'
        ? []
        : options.map((opt) => {
            if (typeof opt === 'object' && opt !== null) {
              return { text: opt.text || '', image: opt.image || '' };
            }
            return { text: String(opt || ''), image: '' };
          });
    }

    if (correctAnswers !== undefined && Array.isArray(correctAnswers)) {
      if (question.questionType === 'NAT') {
        const min = Number(correctAnswers[0]);
        const max = correctAnswers.length > 1 ? Number(correctAnswers[1]) : min;
        if (!isNaN(min) && !isNaN(max)) {
          question.correctAnswers = [Math.min(min, max), Math.max(min, max)];
        }
      } else {
        question.correctAnswers = correctAnswers;
      }
    }

    if (explanation !== undefined) question.explanation = explanation.trim();

    if (stream !== undefined) {
      question.stream = stream.trim();
      question.subject = stream.trim();
    }

    if (tags !== undefined) {
      const cleanTags = Array.isArray(tags)
        ? tags.map((t) => String(t).trim()).filter(Boolean)
        : typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      question.tags = cleanTags;
      if (cleanTags.length > 0) question.topic = cleanTags[0];
    }

    question.isEdited = true;
    question.editedAt = new Date();

    await question.save();

    const populated = await Question.findById(question._id)
      .populate('bankAddedBy', 'name email avatar')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Question updated successfully.',
      question: {
        ...populated,
        isContributor: true
      }
    });
  } catch (error) {
    console.error('[updateBankQuestion] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating question'
    });
  }
};

/**
 * @desc    Delete a question from the Question Bank (Contributor only)
 * @route   DELETE /api/questions/:id
 * @access  Private
 */
export const deleteBankQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Question ID' });
    }

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const currentUserId = req.user._id.toString();
    const contributorId = question.bankAddedBy?._id
      ? question.bankAddedBy._id.toString()
      : (question.bankAddedBy ? question.bankAddedBy.toString() : null);

    if (!contributorId || contributorId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only the original contributor can delete this question.'
      });
    }

    // Check if any active exams reference this question
    const referencingExams = await Exam.countDocuments({ questions: id });

    if (referencingExams > 0) {
      // Soft-remove from question bank so active exams are not corrupted
      question.isInBank = false;
      await question.save();

      return res.status(200).json({
        success: true,
        message: `Question removed from Question Bank. It is retained for the ${referencingExams} active examination(s) referencing it.`,
        referencingExams
      });
    }

    await Question.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Question deleted successfully from Question Bank.',
      referencingExams: 0
    });
  } catch (error) {
    console.error('[deleteBankQuestion] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting question'
    });
  }
};

/**
 * @desc    Get distinct streams in the question bank
 * @route   GET /api/questions/meta/streams
 * @access  Public
 */
export const getDistinctStreams = async (req, res) => {
  try {
    const streams = await Question.distinct('stream', {
      isInBank: true,
      stream: { $nin: [null, ''] }
    });

    const sortedStreams = streams.filter(Boolean).sort();
    return res.status(200).json({
      success: true,
      streams: sortedStreams
    });
  } catch (error) {
    console.error('[getDistinctStreams] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching streams'
    });
  }
};

/**
 * @desc    Get distinct tags in the question bank (optionally narrowed by stream)
 * @route   GET /api/questions/meta/tags
 * @access  Public
 */
export const getDistinctTags = async (req, res) => {
  try {
    const { stream } = req.query;
    const filter = { isInBank: true };

    if (stream && stream !== 'ALL') {
      filter.stream = new RegExp(`^${escapeRegex(stream.trim())}$`, 'i');
    }

    const tags = await Question.distinct('tags', filter);
    const sortedTags = tags.filter(Boolean).sort();

    return res.status(200).json({
      success: true,
      tags: sortedTags
    });
  } catch (error) {
    console.error('[getDistinctTags] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching tags'
    });
  }
};

/**
 * @desc    Generate a random exam from bank questions matching stream and tags
 * @route   POST /api/questions/generate-exam
 * @access  Private
 */
export const generateExam = async (req, res) => {
  try {
    const {
      stream,
      tags = [],
      count = 10,
      title,
      durationMinutes,
      markingScheme,
      category = 'CUSTOM'
    } = req.body;

    const requestedCount = Math.max(1, Math.min(100, parseInt(count, 10) || 10));

    const filter = { isInBank: true };

    if (stream && stream.trim() && stream !== 'ALL') {
      filter.stream = new RegExp(`^${escapeRegex(stream.trim())}$`, 'i');
    }

    const tagList = Array.isArray(tags)
      ? tags.map((t) => String(t).trim()).filter(Boolean)
      : typeof tags === 'string' && tags.trim()
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    if (tagList.length > 0) {
      filter.tags = { $in: tagList };
    }

    const availableCount = await Question.countDocuments(filter);

    if (availableCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No matching questions found in the Question Bank for the specified stream and tags.'
      });
    }

    const effectiveCount = Math.min(requestedCount, availableCount);

    // Use $sample aggregation to select effectiveCount random, deduplicated documents
    const sampledDocs = await Question.aggregate([
      { $match: filter },
      { $sample: { size: effectiveCount } },
      { $project: { _id: 1 } }
    ]);

    const questionIds = sampledDocs.map((doc) => doc._id);

    if (questionIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Unable to sample questions matching the criteria.'
      });
    }

    const correctMark = Number.isFinite(Number(markingScheme?.correct)) ? Number(markingScheme.correct) : 4;
    const incorrectMark = Number.isFinite(Number(markingScheme?.incorrect)) ? Number(markingScheme.incorrect) : -1;
    const totalMarks = questionIds.length * correctMark;

    // Smart default title
    const streamLabel = stream && stream !== 'ALL' ? stream.trim() : 'General';
    const tagsLabel = tagList.length > 0 ? tagList.join(', ') : 'All Topics';
    const dateLabel = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const defaultTitle = `Practice — ${streamLabel} · ${tagsLabel} · ${dateLabel}`;

    const examTitle = (title && title.trim()) ? title.trim() : defaultTitle;
    const duration = durationMinutes ? Math.max(1, Number(durationMinutes)) : questionIds.length * 2;

    const exam = await Exam.create({
      title: examTitle,
      description: `Auto-generated practice exam with ${effectiveCount} questions sampled from the Question Bank.`,
      category: category || 'CUSTOM',
      status: 'published',
      creatorId: req.user._id,
      durationMinutes: duration,
      totalMarks,
      maxAttempts: null, // unlimited practice attempts
      markingScheme: {
        correct: correctMark,
        incorrect: incorrectMark
      },
      allowPracticeMode: true,
      allowReviewResponses: true,
      isGenerated: true,
      isPublic: false,
      examType: 'practice',
      questions: questionIds,
      proctorSettings: {
        faceCheck: false,
        audioCheck: false,
        fullScreenLock: false,
        liveNotifications: false,
        objectCheck: false,
        maxWarningsAllowed: 5
      }
    });

    // Register exam under user's createdTests
    await User.findByIdAndUpdate(req.user._id, {
      $push: { createdTests: exam._id }
    });

    const warning = effectiveCount < requestedCount
      ? `Only ${effectiveCount} matching questions were available. Exam generated with ${effectiveCount} questions.`
      : null;

    return res.status(201).json({
      success: true,
      exam: {
        _id: exam._id,
        title: exam.title,
        examType: exam.examType,
        isGenerated: exam.isGenerated,
        category: exam.category,
        durationMinutes: exam.durationMinutes,
        totalMarks: exam.totalMarks,
        questionCount: questionIds.length,
        createdAt: exam.createdAt
      },
      requested: requestedCount,
      generated: effectiveCount,
      warning
    });
  } catch (error) {
    console.error('[generateExam] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error generating exam'
    });
  }
};

/**
 * @desc   Upload a question bank diagram or option image to Cloudinary
 *         Stores under folder: mock-test-canvas/question-bank-images/<userId>
 * @route  POST /api/questions/upload-image
 * @access Private
 */
export const uploadQuestionBankImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary credentials are not configured on the server.'
      });
    }

    const userId = req.user?._id ? req.user._id.toString() : 'anonymous';
    const folder = `mock-test-canvas/question-bank-images/${userId}`;
    const publicId = `qb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) {
          console.error('[uploadQuestionBankImage] Cloudinary error:', error);
          return res.status(500).json({ success: false, message: error.message });
        }
        return res.status(200).json({
          success: true,
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('[uploadQuestionBankImage] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Image upload failed'
    });
  }
};

