/**
 * Utility helper for managing Bring Your Own Key (BYOK) Google Gemini API credentials.
 * Credentials are kept in the candidate's browser localStorage during their authenticated session
 * and securely wiped whenever they log out.
 */

const STORAGE_KEY = 'gemini_api_key';
const MODEL_KEY = 'gemini_api_model';
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

export const SUPPORTED_GEMINI_MODELS = [
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    tag: 'Fastest (Instant)',
    description: 'Sub-second real-time streaming with lowest latency'
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tag: 'Balanced',
    description: 'Latest model with fast reasoning & step-by-step derivations'
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash (Latest)',
    tag: 'Auto-Update',
    description: 'Always routes to Google’s latest active flash release'
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    tag: 'Deep Thinking',
    description: 'Complex multi-step academic proofs & derivations'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    tag: 'Legacy',
    description: 'Legacy 2.5 model (requires prior account access from Google)'
  }
];

export const getGeminiApiKey = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

export const setGeminiApiKey = (key) => {
  try {
    if (key && key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to save Gemini key to storage:', err);
  }
};

export const removeGeminiApiKey = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear Gemini key:', err);
  }
};

export const getGeminiModel = () => {
  try {
    const saved = localStorage.getItem(MODEL_KEY);
    // Automatically migrate legacy or deprecated model keys
    if (
      !saved ||
      saved === 'gemini-2.5-flash' ||
      saved === 'gemini-1.5-flash' ||
      saved === 'gemini-2.0-flash' ||
      saved === 'gemini-1.5-pro'
    ) {
      return DEFAULT_MODEL;
    }
    return saved;
  } catch {
    return DEFAULT_MODEL;
  }
};

export const setGeminiModel = (modelId) => {
  try {
    localStorage.setItem(MODEL_KEY, modelId || DEFAULT_MODEL);
  } catch (err) {
    console.error('Failed to save Gemini model:', err);
  }
};

export const clearGeminiBYOKSession = () => {
  removeGeminiApiKey();
  try {
    localStorage.removeItem(MODEL_KEY);
  } catch {}
};

export const maskApiKey = (key) => {
  if (!key || key.length < 8) return '••••••••';
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
};
