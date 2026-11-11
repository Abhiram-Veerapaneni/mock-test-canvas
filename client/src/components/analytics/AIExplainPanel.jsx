import React, { useState, useRef } from 'react';
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
import { getGeminiApiKey, getGeminiModel } from '../../utils/geminiKey';

/**
 * Lean line formatter: Highlights **bold** text and delegates math formulas to MathRenderer.
 */
function FormattedLine({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+?\*\*)/g);
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
          return (
            <strong key={idx} className="font-semibold text-slate-900 dark:text-slate-100">
              <MathRenderer text={part.slice(2, -2)} inline />
            </strong>
          );
        }
        return <MathRenderer key={idx} text={part} inline />;
      })}
    </>
  );
}

/**
 * Lean structured view for AI explanations:
 * Formats Markdown headings (###), bullet points (*), numbered steps (1.), and bold text
 * without heavy AST parsing libraries or impacting global question rendering.
 */
function AIExplanationView({ text }) {
  if (!text) return null;
  const lines = text.split(/\r?\n/);

  return (
    <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line -> vertical paragraph spacing
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Section Headings (### Title)
        if (trimmed.startsWith('### ')) {
          return (
            <div
              key={idx}
              className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mt-4 pt-1.5 mb-1.5 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <FormattedLine text={trimmed.slice(4)} />
            </div>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <div
              key={idx}
              className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3.5 mb-1"
            >
              <FormattedLine text={trimmed.slice(3)} />
            </div>
          );
        }

        // Bullet point lines (* item or - item)
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 my-0.5">
              <span className="text-indigo-500 font-bold select-none shrink-0">•</span>
              <span className="flex-1 leading-relaxed">
                <FormattedLine text={trimmed.slice(2)} />
              </span>
            </div>
          );
        }

        // Numbered list items (1. item, 2. item)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 my-0.5">
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold select-none shrink-0 text-[11px] min-w-[14px]">
                {numMatch[1]}.
              </span>
              <span className="flex-1 leading-relaxed">
                <FormattedLine text={numMatch[2]} />
              </span>
            </div>
          );
        }

        // Block LaTeX standalone ($$...$$)
        if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
          return <MathRenderer key={idx} text={trimmed} />;
        }

        // Regular prose line
        return (
          <p key={idx} className="leading-relaxed">
            <FormattedLine text={line} />
          </p>
        );
      })}
    </div>
  );
}

export default function AIExplainPanel({ question: q }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [modelUsed, setModelUsed] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const abortControllerRef = useRef(null);

  const fetchExplanation = async (overrideKey, overrideModel) => {
    const key = overrideKey !== undefined ? overrideKey : getGeminiApiKey();
    const model = overrideModel || getGeminiModel();

    if (!key || !key.trim()) {
      setIsModalOpen(true);
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setIsStreaming(false);
    setError(null);
    setExplanation('');
    setIsCollapsed(false);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');
      const token = localStorage.getItem('token');

      const response = await fetch(`${cleanBaseUrl}/analytics/ai-explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'X-Gemini-Key': key.trim(),
          'X-Gemini-Model': model,
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        signal: abortController.signal,
        body: JSON.stringify({
          questionId: q.questionId,
          userAnswer: q.selectedAnswers,
          correctAnswer: q.correctAnswers,
          model
        })
      });

      if (!response.ok) {
        let errMessage = 'Failed to generate solution.';
        try {
          const errData = await response.json();
          errMessage = errData.message || errMessage;
        } catch (_) {}
        throw new Error(errMessage);
      }

      if (!response.body) {
        throw new Error('Streaming not supported in this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';
      let receivedAnyChunk = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep partial line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const data = JSON.parse(jsonStr);

              if (data.error) {
                throw new Error(data.error);
              }

              if (data.model) {
                setModelUsed(data.model);
              }

              if (data.chunk) {
                if (!receivedAnyChunk) {
                  receivedAnyChunk = true;
                  setIsLoading(false);
                  setIsStreaming(true);
                }
                accumulatedText += data.chunk;
                setExplanation(accumulatedText);
              }

              if (data.done) {
                setIsStreaming(false);
              }
            } catch (parseErr) {
              if (parseErr.message && !parseErr.message.includes('JSON')) {
                throw parseErr;
              }
            }
          }
        }
      }

      if (!accumulatedText) {
        throw new Error(
          'No explanation returned. Please verify your Gemini API key in settings or try another model.'
        );
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[AIExplainPanel] Request error:', err);
      setError(err.message || 'Could not stream AI solution.');
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
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
            Real-Time Streaming · Zero server key retention
          </span>
        </div>
      )}

      {/* Initial Connecting / Skeleton State before first token arrives */}
      {isLoading && !explanation && (
        <div className="p-4 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/40 space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
              <span>Connecting to Gemini stream...</span>
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

      {/* Live Streaming or Completed Solution Display */}
      {explanation && (
        <div className="rounded-lg border border-indigo-200/80 dark:border-indigo-800/60 bg-white dark:bg-[#111724] shadow-xs overflow-hidden">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-50/60 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                AI Pedagogical Solution
              </span>
              {isStreaming && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  Streaming...
                </span>
              )}
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
                disabled={isStreaming}
                title="Regenerate solution"
                className="p-1 rounded text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isStreaming ? 'animate-spin' : ''}`} />
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
            <div className="p-4 sm:p-5 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              <AIExplanationView text={explanation} />
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
