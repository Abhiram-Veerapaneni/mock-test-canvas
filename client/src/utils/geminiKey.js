/**
 * Utility helper for managing Bring Your Own Key (BYOK) Google Gemini API credentials.
 * Credentials are kept in the candidate's browser localStorage during their authenticated session
 * and securely wiped whenever they log out.
 */

const STORAGE_KEY = 'gemini_api_key';
const MODEL_KEY = 'gemini_api_model';
const DEFAULT_MODEL = 'gemini-2.5-flash';

export const SUPPORTED_GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'Recommended', description: 'Fast, high quality reasoning & math derivations' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', tag: 'Fast', description: 'High speed and low latency' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tag: 'Balanced', description: 'High throughput reasoning' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', tag: 'Deep Thinking', description: 'Complex multi-step academic proofs' },
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
    return localStorage.getItem(MODEL_KEY) || DEFAULT_MODEL;
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

