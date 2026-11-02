import { GoogleGenAI } from '@google/genai';
import Question from '../models/Question.model.js';
import Attempt from '../models/Attempt.model.js';
import Exam from '../models/Exam.model.js';

const ALLOWED_MODELS = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro'
];

/**
 * BYOK Gemini AI Explanation Controller
 * Generates an on-demand pedagogical explanation for a question using a candidate-supplied Gemini API key.
 *
 * SECURITY:
 * - The API key is read from the X-Gemini-Key header.
 * - It is never stored in the database, cookies, or files.
 * - It is never written to server logs.
 * - The GoogleGenAI instance is instantiated per-request and discarded upon scope exit.
 */
export const aiExplain = async (req, res) => {
  let geminiKey = req.headers['x-gemini-key'];
  if (!geminiKey || typeof geminiKey !== 'string' || !geminiKey.trim()) {
    return res.status(400).json({
      success: false,
      message: 'A Gemini API key is required. Please provide your key in the X-Gemini-Key header.'
    });
  }

  geminiKey = geminiKey.trim();

  const { questionId, userAnswer, correctAnswer, model } = req.body;
  const requestedModel =
    model || req.headers['x-gemini-model'] || 'gemini-2.5-flash';

  const selectedModel = ALLOWED_MODELS.includes(requestedModel)
    ? requestedModel
    : 'gemini-2.5-flash';

  if (!questionId) {
    return res.status(400).json({
      success: false,
      message: 'Question ID is required.'
    });
  }

  try {
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found.'
      });
    }

    // Format options for prompt
    const formattedOptions = (question.options || [])
      .map((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        const text =
          typeof opt === 'object' && opt !== null
            ? opt.text || ''
            : String(opt || '');
        return `(${letter}) ${text}`;
      })
      .join('\n');

    // Format student's answer
    let studentAnswerText = 'Not answered / Skipped';
    if (userAnswer !== undefined && userAnswer !== null) {
      if (Array.isArray(userAnswer)) {
        studentAnswerText =
          userAnswer.length > 0
            ? userAnswer
                .map((idx) =>
                  typeof idx === 'number'
                    ? `Option (${String.fromCharCode(65 + idx)})`
                    : String(idx)
                )
                .join(', ')
            : 'Not answered / Skipped';
      } else if (typeof userAnswer === 'number') {
        studentAnswerText = `Option (${String.fromCharCode(65 + userAnswer)})`;
      } else {
        studentAnswerText = String(userAnswer);
      }
    }

    // Format correct answers
    const correctAnswers = question.correctAnswers || [];
    const correctAnswerText =
      correctAnswers.length > 0
        ? correctAnswers
            .map((idx) => `Option (${String.fromCharCode(65 + idx)})`)
            .join(', ')
        : correctAnswer
        ? String(correctAnswer)
        : 'Consult question key';

    const prompt = `You are a world-class academic tutor helping a student understand their result on an assessment.

Subject/Stream: ${question.stream || question.subject || 'General'}
Topic: ${question.topic || 'General'}${question.tags?.length ? ` (Tags: ${question.tags.join(', ')})` : ''}

Question:
${question.questionText || '[Image-based question]'}

Options:
${formattedOptions || 'No options provided'}

Student's Submitted Answer: ${studentAnswerText}
Verified Correct Answer: ${correctAnswerText}
Existing Solution Hint: ${question.explanation || 'None provided'}

Provide a comprehensive, pedagogical explanation in standard Markdown.
IMPORTANT: Use standard LaTeX formatting for ALL mathematical variables, symbols, formulas, and derivations:
- Use single dollar signs ($...$) for inline math expressions, e.g., $E = mc^2$.
- Use double dollar signs ($$...$$) on their own lines for standalone equations or multi-step derivations.

Structure your response clearly with these 4 sections:
### 1. Conceptual Breakdown
Explain clearly and concisely why the correct answer is right.

### 2. Step-by-Step Solution
Walk through the mathematical derivation, logic, or calculation step-by-step.

### 3. Key Concept & Formula
Summarize the foundational rule, theorem, or equation the student should revise.

### 4. Common Pitfall & Mistake Analysis
Analyze what mistake, miscalculation, or distractor option likely led to the wrong answer, and how to avoid it in future tests.`;

    // Instantiate ephemeral client
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: prompt
    });

    const explanation = response?.text || 'No explanation could be generated.';

    return res.status(200).json({
      success: true,
      explanation,
      model: selectedModel
    });
  } catch (error) {
    const errorMsg = error?.message || '';

    // Handle common Gemini API errors gracefully without leaking keys
    if (
      errorMsg.includes('API_KEY_INVALID') ||
      errorMsg.includes('API key not valid') ||
      error?.status === 400
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Gemini API key. Please check your key in settings.'
      });
    }

    if (
      errorMsg.includes('RESOURCE_EXHAUSTED') ||
      errorMsg.includes('quota') ||
      error?.status === 429
    ) {
      return res.status(429).json({
        success: false,
        message:
          'Gemini API rate limit or quota exceeded for this key. Please check your Google AI Studio quota.'
      });
    }

    if (errorMsg.includes('not found') || errorMsg.includes('NOT_FOUND')) {
      return res.status(400).json({
        success: false,
        message: `Model "${selectedModel}" is not available with your Gemini key. Try selecting "gemini-2.5-flash" or "gemini-1.5-flash".`
      });
    }

    console.error('[AI Explain] Gemini Generation Error:', errorMsg);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate AI solution explanation. Please try again.'
    });
  } finally {
    // Force garbage collection reference release
    geminiKey = null;
  }
};
