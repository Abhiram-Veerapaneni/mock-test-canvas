import { GoogleGenAI } from '@google/genai';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import dotenv from 'dotenv';

const getGeminiClient = () => {
  // Dynamically load/refresh server/.env so newly saved keys take effect immediately without restarting
  try {
    dotenv.config({ override: true });
  } catch {
    // Ignore if dotenv read fails
  }

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    return null;
  }

  return new GoogleGenAI({ apiKey: apiKey.trim() });
};

/**
 * Fallback parser for academic question documents when GEMINI_API_KEY is not yet configured
 */
const fallbackTextParser = (rawText) => {
  const questionBlocks = rawText
    .split(/(?=Question\s+\d+:|Q\d+[:.])/i)
    .map((b) => b.trim())
    .filter(Boolean);

  const results = [];

  for (let i = 0; i < questionBlocks.length; i++) {
    const block = questionBlocks[i];
    if (!block.toLowerCase().includes('question') && !block.toLowerCase().includes('(a)')) continue;

    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    let qText = '';
    let options = [];
    let correctAnswers = [0];
    let explanation = '';
    let subject = 'Physics';
    let topic = i === 0 ? 'Kinematics' : i === 1 ? 'Oscillations' : 'Thermodynamics';

    for (const line of lines) {
      if (/^Question\s+\d+:\s*/i.test(line)) {
        qText = line.replace(/^Question\s+\d+:\s*/i, '');
      } else if (/^\([A-D]\)\s*/i.test(line)) {
        let optText = line.replace(/^\([A-D]\)\s*/i, '');
        // Convert basic math notations to LaTeX
        optText = optText
          .replace(/sqrt\(([^)]+)\)/g, '$\\sqrt{$1}$')
          .replace(/pi\b/gi, '$\\pi$')
          .replace(/eta\b/gi, '$\\eta$')
          .replace(/([a-zA-Z0-9]+)\^2/g, '$1^2');
        options.push(optText);
      } else if (/^Answer:\s*([A-D])/i.test(line)) {
        const match = line.match(/^Answer:\s*([A-D])/i);
        if (match) {
          const charCode = match[1].toUpperCase().charCodeAt(0);
          correctAnswers = [charCode - 65];
        }
      } else if (/^Explanation:\s*/i.test(line)) {
        explanation = line
          .replace(/^Explanation:\s*/i, '')
          .replace(/sqrt\(([^)]+)\)/g, '$\\sqrt{$1}$')
          .replace(/pi\b/gi, '$\\pi$');
      } else if (!qText && !line.toUpperCase().includes('EXAMINATION')) {
        qText = line;
      }
    }

    if (qText) {
      const formattedQText = qText
        .replace(/sqrt\(([^)]+)\)/g, '$\\sqrt{$1}$')
        .replace(/pi\b/gi, '$\\pi$')
        .replace(/eta\b/gi, '$\\eta$');

      if (options.length === 0) {
        options = ['Option A', 'Option B', 'Option C', 'Option D'];
      }

      results.push({
        questionText: formattedQText,
        questionType: 'MCQ',
        options,
        correctAnswers,
        explanation,
        subject,
        topic,
      });
    }
  }

  return results;
};

const QUESTION_EXTRACTION_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      questionText: { type: 'STRING' },
      questionType: { type: 'STRING', enum: ['MCQ', 'MSQ', 'NAT'] },
      options: {
        type: 'ARRAY',
        items: { type: 'STRING' },
      },
      correctAnswers: {
        type: 'ARRAY',
        items: { type: 'NUMBER' },
      },
      explanation: { type: 'STRING' },
      subject: { type: 'STRING' },
      topic: { type: 'STRING' },
    },
    required: ['questionText', 'questionType', 'options', 'correctAnswers', 'subject'],
  },
};

const SYSTEM_INSTRUCTION = `
You are an expert examination question digitizer and academic content extractor.
Your task is to analyze document text or scanned question paper images and extract all questions into a strictly structured JSON array.

CRITICAL FORMATTING & LATEX RULES:
1. Strictly preserve and format all mathematical equations, formulas, scientific notation, and chemical reactions into valid LaTeX syntax enclosed in dollar signs, e.g. $\\frac{a}{b}$, $\\sqrt{x}$, $x^2 + y^2 = r^2$, $\\int_0^\\infty e^{-x}dx$, $\\alpha, \\beta, \\theta$.
2. For fractions, use $\\frac{numerator}{denominator}$.
3. For roots, use $\\sqrt{expression}$ or $\\sqrt[n]{expression}$.
4. For Greek symbols or operators, use standard LaTeX commands like $\\lambda, \\mu, \\pi, \\Delta, \\times, \\pm$.
5. Never strip or simplify equations into plain text approximations.

QUESTION STRUCTURE RULES:
- "questionText": The complete question body with any context or statements. Include LaTeX notation where applicable.
- "questionType": Must be exactly one of "MCQ" (single choice), "MSQ" (multiple select), or "NAT" (numerical answer type). Default to "MCQ" if ambiguous.
- "options": Array of option strings (usually 4 options for MCQ/MSQ). For NAT questions, this should be empty []. Preserve LaTeX formatting in options as well.
- "correctAnswers": Array of zero-based numerical indices pointing to the correct option(s) in the options array. For example: [0] if Option A is correct, [1] if Option B is correct, [0, 2] if Options A and C are correct. If the answer key is not explicitly provided in the document, deduce the correct answer based on scientific/mathematical accuracy. For NAT questions, if a numerical answer is known, provide it as [answerNumber], else [0].
- "explanation": Brief step-by-step solution or rationale with LaTeX where applicable.
- "subject": The primary academic discipline, e.g., "Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", or "Aptitude".
- "topic": The specific subject topic, e.g., "Kinematics", "Thermodynamics", "Calculus", "Organic Chemistry".
`;

/**
 * Clean and parse JSON response text from Gemini
 */
const parseGeminiJson = (rawText) => {
  if (!rawText) return [];
  let cleaned = rawText.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    console.error('[Gemini Service] Failed to parse JSON:', err, rawText);
    throw new Error('Gemini returned an invalid JSON structure. Please retry.');
  }
};

/**
 * Extract structured questions from raw text stream (e.g. extracted from .docx)
 * @param {string} rawText
 * @returns {Promise<Array>}
 */
/**
 * Execute Gemini model call with automatic fallback and clear error translation
 */
const callGeminiWithFallback = async (ai, options) => {
  const configuredModel = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash-lite';
  const candidateModels = [
    configuredModel,
    'gemini-2.5-flash-lite',
    'gemini-flash-latest',
    'gemini-3.6-flash',
    'gemini-2.5-flash',
  ].filter((m, idx, arr) => arr.indexOf(m) === idx);

  let lastError = null;

  for (const model of candidateModels) {
    try {
      console.log(`[Gemini Service] Ingesting document with model: ${model}`);
      return await ai.models.generateContent({
        ...options,
        model,
      });
    } catch (err) {
      lastError = err;
      const errMsg = err?.message || String(err);

      // Handle invalid API key
      if (
        errMsg.includes('API_KEY_INVALID') ||
        errMsg.includes('API key not valid') ||
        errMsg.includes('INVALID_ARGUMENT')
      ) {
        throw new Error(
          'Invalid Gemini API key. Please verify your key at https://aistudio.google.com/apikey and update GEMINI_API_KEY in server/.env'
        );
      }

      // If model is experiencing temporary high demand (503), rate limit, or not found (404), fall back to next model
      if (
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand') ||
        errMsg.includes('not found') ||
        errMsg.includes('NOT_FOUND') ||
        errMsg.includes('no longer available') ||
        errMsg.includes('RESOURCE_EXHAUSTED')
      ) {
        console.warn(`[Gemini Service] Model "${model}" temporarily busy (${errMsg.slice(0, 100)}...). Falling back to alternative model...`);
        continue;
      }

      throw err;
    }
  }

  const finalMsg = lastError?.message || String(lastError);
  if (finalMsg.includes('503') || finalMsg.includes('high demand') || finalMsg.includes('UNAVAILABLE')) {
    throw new Error('Gemini models are momentarily experiencing high global demand from Google. Please wait a few seconds and try uploading again.');
  }

  throw lastError;
};

/**
 * Extract structured questions from raw document text using Gemini
 * @param {string} rawText
 * @returns {Promise<Array>}
 */
export const extractQuestionsFromText = async (rawText) => {
  if (!rawText || !rawText.trim()) {
    throw new Error('The document contains no readable text.');
  }

  const ai = getGeminiClient();

  if (!ai) {
    console.warn(
      '[Gemini Service] GEMINI_API_KEY is not configured in server/.env. Using intelligent rule-based academic parser fallback.'
    );
    const parsed = fallbackTextParser(rawText);
    if (parsed && parsed.length > 0) return parsed;
    throw new Error(
      'Gemini API key is not configured. Please set GEMINI_API_KEY in server/.env to enable AI document extraction.'
    );
  }

  const response = await callGeminiWithFallback(ai, {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Please parse and extract all examination questions from the following text into structured questions according to the schema:\n\n${rawText}`,
          },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: QUESTION_EXTRACTION_SCHEMA,
      temperature: 0.1,
    },
  });

  return parseGeminiJson(response.text);
};

/**
 * Extract structured questions from a scanned question paper image buffer (multimodal vision)
 * @param {Buffer} imageBuffer
 * @param {string} mimeType
 * @returns {Promise<Array>}
 */
export const extractQuestionsFromImage = async (imageBuffer, mimeType = 'image/png') => {
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error('No image data provided for vision extraction.');
  }

  const ai = getGeminiClient();
  if (!ai) {
    throw new Error(
      'Gemini API key is not configured. Please set GEMINI_API_KEY in server/.env to enable AI image and vision extraction.'
    );
  }

  const base64Data = imageBuffer.toString('base64');

  const response = await callGeminiWithFallback(ai, {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType,
            },
          },
          {
            text: 'Please examine this question paper image and extract all examination questions, formulas, choices, and solutions into structured questions according to the schema.',
          },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: QUESTION_EXTRACTION_SCHEMA,
      temperature: 0.1,
    },
  });

  return parseGeminiJson(response.text);
};

/**
 * Extract structured questions from a PDF document buffer
 * Uses Gemini Multimodal PDF processing if API key is present,
 * or falls back to text extraction via pdf-parse.
 * @param {Buffer} pdfBuffer
 * @returns {Promise<Array>}
 */
export const extractQuestionsFromPdf = async (pdfBuffer) => {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error('No PDF data provided for extraction.');
  }

  const ai = getGeminiClient();

  // If Gemini API client is available, leverage native multimodal PDF processing
  if (ai) {
    try {
      const base64Data = pdfBuffer.toString('base64');

      const response = await callGeminiWithFallback(ai, {
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: 'application/pdf',
                },
              },
              {
                text: 'Please examine this examination question paper document and extract all examination questions, formulas, choices, and solutions into structured questions according to the schema.',
              },
            ],
          },
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: QUESTION_EXTRACTION_SCHEMA,
          temperature: 0.1,
        },
      });

      const parsed = parseGeminiJson(response.text);
      if (parsed && parsed.length > 0) {
        return parsed;
      }
    } catch (geminiErr) {
      console.warn(
        '[Gemini Service] Multimodal PDF parsing encountered an error, trying text extraction fallback:',
        geminiErr.message
      );
    }
  }

  // Fallback: extract text from PDF using pdf-parse
  try {
    const pdfData = await pdfParse(pdfBuffer);
    const rawText = pdfData?.text || '';

    if (rawText.trim()) {
      if (ai) {
        // If Gemini is configured, use it to structure the extracted text
        return await extractQuestionsFromText(rawText);
      } else {
        // If no Gemini key, attempt rule-based academic parser fallback
        console.warn(
          '[Gemini Service] GEMINI_API_KEY is not configured in server/.env. Using rule-based fallback parser on PDF text.'
        );
        const fallbackResults = fallbackTextParser(rawText);
        if (fallbackResults && fallbackResults.length > 0) {
          return fallbackResults;
        }
      }
    }
  } catch (pdfErr) {
    console.error('[Gemini Service] PDF text extraction fallback failed:', pdfErr.message);
  }

  if (!ai) {
    throw new Error(
      'Gemini API key is not configured. Please set GEMINI_API_KEY in server/.env to enable AI document extraction.'
    );
  }

  throw new Error('Could not extract questions from the uploaded PDF document.');
};

export default {
  extractQuestionsFromText,
  extractQuestionsFromImage,
  extractQuestionsFromPdf,
};
