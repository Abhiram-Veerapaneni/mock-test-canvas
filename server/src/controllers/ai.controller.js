import mammoth from 'mammoth';
import {
  extractQuestionsFromText,
  extractQuestionsFromImage,
  extractQuestionsFromPdf,
} from '../services/gemini.service.js';

const PDF_MIME_TYPES = [
  'application/pdf',
];

const DOCX_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/octet-stream', // Some browsers send octet-stream for docx
];

const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
];

/**
 * Normalizes question object ensuring consistent fields for the client
 */
const normalizeQuestion = (q, index) => {
  const type = ['MCQ', 'MSQ', 'NAT'].includes(q.questionType?.toUpperCase())
    ? q.questionType.toUpperCase()
    : 'MCQ';

  const rawOptions = Array.isArray(q.options) ? q.options : [];
  const options = rawOptions.map((opt) => String(opt || '').trim());

  let correctAnswers = Array.isArray(q.correctAnswers)
    ? q.correctAnswers.map((n) => Number(n)).filter((n) => !isNaN(n))
    : [];

  if (type === 'MCQ' && correctAnswers.length === 0 && options.length > 0) {
    correctAnswers = [0];
  } else if (type === 'MSQ' && correctAnswers.length === 0 && options.length > 0) {
    correctAnswers = [0];
  } else if (type === 'NAT' && correctAnswers.length === 0) {
    correctAnswers = [0];
  }

  return {
    id: `ingested_${Date.now()}_${index}`,
    questionText: String(q.questionText || '').trim(),
    questionType: type,
    options,
    correctAnswers,
    explanation: String(q.explanation || '').trim(),
    subject: String(q.subject || 'General').trim(),
    topic: String(q.topic || 'General').trim(),
  };
};

/**
 * @desc   Ingest PDF, .docx document or image question paper via Gemini AI
 * @route  POST /api/ai/ingest
 * @access Private (Exam Creator)
 */
export const ingestDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a PDF (.pdf), Word document (.docx), or question paper image.',
      });
    }

    const { mimetype, originalname, buffer } = req.file;

    const isPdf =
      PDF_MIME_TYPES.includes(mimetype) ||
      originalname.toLowerCase().endsWith('.pdf');

    const isDocx =
      DOCX_MIME_TYPES.includes(mimetype) ||
      originalname.toLowerCase().endsWith('.docx') ||
      originalname.toLowerCase().endsWith('.doc');

    const isImage =
      IMAGE_MIME_TYPES.includes(mimetype) ||
      /\.(jpg|jpeg|png|webp)$/i.test(originalname);

    if (!isPdf && !isDocx && !isImage) {
      return res.status(400).json({
        success: false,
        message: `Unsupported file type (${mimetype}). Please upload a PDF (.pdf), Word document (.docx), or an image (.png, .jpg, .webp).`,
      });
    }

    let rawQuestions = [];

    if (isPdf) {
      console.log(`[AI Ingestion] Processing PDF document: ${originalname} (${buffer.length} bytes)`);
      rawQuestions = await extractQuestionsFromPdf(buffer);
    } else if (isDocx) {
      console.log(`[AI Ingestion] Extracting raw text from DOCX: ${originalname}`);
      const extractionResult = await mammoth.extractRawText({ buffer });
      const rawText = extractionResult.value;

      if (!rawText || !rawText.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Could not extract readable text from the uploaded Word document.',
        });
      }

      console.log(`[AI Ingestion] Sending ${rawText.length} characters to Gemini for structuring...`);
      rawQuestions = await extractQuestionsFromText(rawText);
    } else if (isImage) {
      console.log(`[AI Ingestion] Processing image via Gemini Vision: ${originalname} (${mimetype})`);
      const targetMime = mimetype.startsWith('image/') ? mimetype : 'image/png';
      rawQuestions = await extractQuestionsFromImage(buffer, targetMime);
    }

    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'Gemini could not identify any examination questions in the uploaded file.',
      });
    }

    const normalizedQuestions = rawQuestions.map(normalizeQuestion);

    console.log(
      `[AI Ingestion] Successfully extracted ${normalizedQuestions.length} questions from ${originalname}`
    );

    return res.status(200).json({
      success: true,
      fileName: originalname,
      count: normalizedQuestions.length,
      questions: normalizedQuestions,
    });
  } catch (error) {
    console.error('[AI Ingestion] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process document with Gemini AI.',
    });
  }
};

export default {
  ingestDocument,
};
