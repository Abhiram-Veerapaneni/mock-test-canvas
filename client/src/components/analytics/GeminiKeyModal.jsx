import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  ExternalLink,
  Check,
  AlertCircle,
  Sparkles,
  Trash2,
  Cpu
} from 'lucide-react';
import {
  getGeminiApiKey,
  setGeminiApiKey,
  removeGeminiApiKey,
  getGeminiModel,
  setGeminiModel,
  SUPPORTED_GEMINI_MODELS,
  maskApiKey
} from '../../utils/geminiKey';

export default function GeminiKeyModal({ isOpen, onClose, onKeySaved }) {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [showPassword, setShowPassword] = useState(false);
  const [existingKey, setExistingKey] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const storedKey = getGeminiApiKey();
      const storedModel = getGeminiModel();
      setExistingKey(storedKey);
      setApiKey(storedKey);
      setSelectedModel(storedModel);
      setStatusMessage(null);
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();

    if (!cleanKey) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid Gemini API key.' });
      return;
    }

    setGeminiApiKey(cleanKey);
    setGeminiModel(selectedModel);
    setExistingKey(cleanKey);
    setStatusMessage({ type: 'success', text: 'API key and model configuration saved!' });

    if (onKeySaved) {
      onKeySaved(cleanKey, selectedModel);
    }

    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleClearKey = () => {
    removeGeminiApiKey();
    setApiKey('');
    setExistingKey('');
    setStatusMessage({ type: 'info', text: 'Gemini API key removed from this browser.' });
    if (onKeySaved) {
      onKeySaved('', selectedModel);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0f141f]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Gemini AI Configuration (BYOK)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Bring Your Own Key for step-by-step pedagogical solutions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Security & Privacy Banner */}
          <div className="p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-950 dark:text-indigo-200 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-medium text-indigo-900 dark:text-indigo-300">
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span>Zero-Server Storage Privacy Guarantee</span>
            </div>
            <p className="text-[11px] text-indigo-900/80 dark:text-indigo-300/80 pl-5">
              Your key stays strictly in your browser and is forwarded securely on-demand to generate solutions. It is <strong>never stored in the database</strong> and is automatically destroyed when you log out.
            </p>
          </div>

          {/* Existing Key Status */}
          {existingKey && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">Active Key:</span>
                <code className="font-mono text-slate-900 dark:text-slate-100 font-medium">
                  {maskApiKey(existingKey)}
                </code>
              </div>
              <button
                type="button"
                onClick={handleClearKey}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:underline"
              >
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
          )}

          {/* API Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>Get free key at Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste AIzaSy... key here"
                className="w-full px-3.5 py-2 pr-10 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0c0f17] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span>Preferred Gemini Model</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUPPORTED_GEMINI_MODELS.map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedModel(m.id)}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 shadow-xs ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span>{m.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {m.tag}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {m.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-2.5 rounded-md text-xs flex items-center gap-2 ${
                statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
                  : statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {statusMessage.type === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Check className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

