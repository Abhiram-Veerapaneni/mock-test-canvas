import React, { useState } from 'react';
import MathRenderer from '../common/MathRenderer';
import GeminiKeyModal from './GeminiKeyModal';
import {
  Sparkles,
  Loader2,
  RefreshCw,
  Settings2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import api from '../../services/api';
import { getGeminiApiKey, getGeminiModel } from '../../utils/geminiKey';

export default function AIExplainPanel({ question: q }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [modelUsed, setModelUsed] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchExplanation = async (overrideKey, overrideModel) => {
    const key = overrideKey !== undefined ? overrideKey : getGeminiApiKey();
    const model = overrideModel || getGeminiModel();

    if (!key || !key.trim()) {
      setIsModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsCollapsed(false);

    try {
      const res = await api.post(
        '/analytics/ai-explain',
        {
          questionId: q.questionId,
          userAnswer: q.selectedAnswers,
          correctAnswer: q.correctAnswers,
          model
        },
        {
          headers: {
            'X-Gemini-Key': key.trim(),
            'X-Gemini-Model': model
          }
        }
      );

      if (res.data?.success) {
        setExplanation(res.data.explanation);
        setModelUsed(res.data.model || model);
      } else {
        throw new Error(res.data?.message || 'Failed to generate solution.');
      }
    } catch (err) {
      console.error('[AIExplainPanel] Request error:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Could not generate AI solution. Please check your network or key.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeySaved = (newKey, newModel) => {
    if (newKey) {
      fetchExplanation(newKey, newModel);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
      <GeminiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onKeySaved={handleKeySaved}
      />

      {/* Trigger Button when no explanation generated yet and not loading */}
      {!explanation && !isLoading && !error && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => fetchExplanation()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 group-hover:rotate-12 transition-transform" />
            <span>Explain with Gemini AI</span>
          </button>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            BYOK · Zero server key retention
          </span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="p-4 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/40 space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
              <span>Generating pedagogical explanation with Gemini...</span>
            </div>
            <span className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400">
              {getGeminiModel()}
            </span>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-indigo-200/50 dark:bg-indigo-900/40 rounded w-5/6" />
            <div className="h-3 bg-indigo-200/40 dark:bg-indigo-900/30 rounded w-4/6" />
            <div className="h-3 bg-indigo-200/30 dark:bg-indigo-900/20 rounded w-3/6" />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-3.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs space-y-2.5">
          <div className="flex items-start gap-2 text-rose-800 dark:text-rose-300 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{error}</span>
          </div>
          <div className="flex items-center gap-2 pl-6 pt-1">
            <button
              type="button"
              onClick={() => fetchExplanation()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 text-[11px] font-medium transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-medium transition-colors"
            >
              <Settings2 className="w-3 h-3" /> Configure Key & Model
            </button>
          </div>
        </div>
      )}

      {/* Generated Solution Display */}
      {explanation && !isLoading && (
        <div className="rounded-lg border border-indigo-200/80 dark:border-indigo-800/60 bg-white dark:bg-[#111724] shadow-xs overflow-hidden">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-50/60 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                AI Pedagogical Solution
              </span>
              {modelUsed && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  <Cpu className="w-2.5 h-2.5" /> {modelUsed}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fetchExplanation()}
                title="Regenerate solution"
                className="p-1 rounded text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                title="Configure Gemini API Key & Model"
                className="p-1 rounded text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 rounded text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 hover:bg-white dark:hover:bg-slate-800 transition-colors ml-1"
              >
                {isCollapsed ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Explanation Body */}
          {!isCollapsed && (
            <div className="p-4 sm:p-5 text-xs text-slate-800 dark:text-slate-200 leading-relaxed space-y-3 font-normal prose-sm">
              <MathRenderer text={explanation} />
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> Formatted with KaTeX LaTeX
                </span>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="hover:text-indigo-600 dark:hover:text-indigo-300 underline"
                >
                  Manage API Key
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

