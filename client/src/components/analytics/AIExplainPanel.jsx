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
  Cpu,
  MessageSquare,
  Send,
  StopCircle,
  Trash2
} from 'lucide-react';
import { getGeminiApiKey, getGeminiModel } from '../../utils/geminiKey';

const SUGGESTIONS = [
  'Explain Step 2 in simpler terms',
  'Why are the other options incorrect?',
  'Is there a shortcut/trick for this question?',
  'Give an intuitive real-world analogy'
];

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

  // Follow-up conversation state
  const [followUpMessages, setFollowUpMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [isFollowUpStreaming, setIsFollowUpStreaming] = useState(false);
  const [followUpError, setFollowUpError] = useState(null);
  const [streamingFollowUpText, setStreamingFollowUpText] = useState('');
  const [streamingModel, setStreamingModel] = useState(null);
  const followUpAbortRef = useRef(null);
  const chatBottomRef = useRef(null);
  const inputRef = useRef(null);

  const fetchExplanation = async (overrideKey, overrideModel) => {
    const key = overrideKey !== undefined ? overrideKey : getGeminiApiKey();
    const model = overrideModel || getGeminiModel();

    if (!key || !key.trim()) {
      setIsModalOpen(true);
      return;
    }

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (followUpAbortRef.current) {
      followUpAbortRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setIsStreaming(false);
    setError(null);
    setExplanation('');
    setIsCollapsed(false);

    // Reset follow-up doubts when regenerating base solution
    setFollowUpMessages([]);
    setStreamingFollowUpText('');
    setFollowUpError(null);
    setCurrentInput('');

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

  const sendFollowUp = async (overridePrompt) => {
    const promptToSend = (overridePrompt || currentInput || '').trim();
    if (!promptToSend) return;

    const key = getGeminiApiKey();
    const model = getGeminiModel();

    if (!key || !key.trim()) {
      setIsModalOpen(true);
      return;
    }

    if (followUpAbortRef.current) {
      followUpAbortRef.current.abort();
    }
    const abortController = new AbortController();
    followUpAbortRef.current = abortController;

    const userMessage = { role: 'user', text: promptToSend };
    const nextHistory = [...followUpMessages, userMessage];
    setFollowUpMessages(nextHistory);
    setCurrentInput('');
    setIsFollowUpLoading(true);
    setIsFollowUpStreaming(false);
    setFollowUpError(null);
    setStreamingFollowUpText('');
    setStreamingModel(null);

    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');
      const token = localStorage.getItem('token');

      const historyPayload = followUpMessages.map((m) => ({
        role: m.role,
        content: m.text
      }));

      const response = await fetch(`${cleanBaseUrl}/analytics/ai-followup`, {
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
          baseExplanation: explanation,
          history: historyPayload,
          message: promptToSend,
          model
        })
      });

      if (!response.ok) {
        let errMessage = 'Failed to answer follow-up question.';
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
      let activeModel = model;
      let receivedAnyChunk = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

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
                activeModel = data.model;
                setStreamingModel(data.model);
              }

              if (data.chunk) {
                if (!receivedAnyChunk) {
                  receivedAnyChunk = true;
                  setIsFollowUpLoading(false);
                  setIsFollowUpStreaming(true);
                }
                accumulatedText += data.chunk;
                setStreamingFollowUpText(accumulatedText);
              }

              if (data.done) {
                setIsFollowUpStreaming(false);
              }
            } catch (parseErr) {
              if (parseErr.message && !parseErr.message.includes('JSON')) {
                throw parseErr;
              }
            }
          }
        }
      }

      if (accumulatedText) {
        setFollowUpMessages((prev) => [
          ...prev,
          { role: 'assistant', text: accumulatedText, model: activeModel }
        ]);
        setStreamingFollowUpText('');
      } else {
        throw new Error('No response returned for follow-up.');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[AIExplainPanel] Follow-up error:', err);
      setFollowUpError(err.message || 'Could not stream follow-up answer.');
    } finally {
      setIsFollowUpLoading(false);
      setIsFollowUpStreaming(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const handleAbortFollowUp = () => {
    if (followUpAbortRef.current) {
      followUpAbortRef.current.abort();
      followUpAbortRef.current = null;
    }
    if (streamingFollowUpText) {
      setFollowUpMessages((prev) => [
        ...prev,
        { role: 'assistant', text: streamingFollowUpText, model: streamingModel }
      ]);
      setStreamingFollowUpText('');
    }
    setIsFollowUpLoading(false);
    setIsFollowUpStreaming(false);
  };

  const handleClearFollowUps = () => {
    handleAbortFollowUp();
    setFollowUpMessages([]);
    setFollowUpError(null);
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

              {/* Follow-up Doubts & Clarifications Section */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Have a doubt or follow-up question?</span>
                  </div>
                  {followUpMessages.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearFollowUps}
                      className="text-[11px] text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Clear doubt history"
                    >
                      <Trash2 className="w-3 h-3" /> Clear Doubts
                    </button>
                  )}
                </div>

                {/* Suggested prompt chips (visible if no follow-ups yet and not loading) */}
                {followUpMessages.length === 0 && !isFollowUpLoading && !isFollowUpStreaming && (
                  <div className="space-y-1.5 mb-3">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">Quick questions you can ask:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => sendFollowUp(suggestion)}
                          disabled={isStreaming}
                          className="text-[11px] px-2.5 py-1 rounded-full border border-indigo-200/70 dark:border-indigo-800/60 bg-indigo-50/50 hover:bg-indigo-100/70 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer text-left disabled:opacity-50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up Message Thread */}
                {followUpMessages.length > 0 && (
                  <div className="space-y-3 mb-3 max-h-[420px] overflow-y-auto pr-1">
                    {followUpMessages.map((msg, idx) => (
                      <div key={idx} className="space-y-1.5">
                        {msg.role === 'user' ? (
                          <div className="flex justify-end gap-2 items-start">
                            <div className="max-w-[85%] rounded-2xl rounded-tr-xs px-3.5 py-2.5 bg-indigo-600 text-white text-xs leading-relaxed shadow-2xs">
                              <MathRenderer text={msg.text} />
                            </div>
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 text-[10px] font-bold">
                              You
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2.5 items-start">
                            <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 rounded-2xl rounded-tl-xs px-4 py-3 bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/80 text-xs text-slate-800 dark:text-slate-200 shadow-2xs space-y-2">
                              <AIExplanationView text={msg.text} />
                              {msg.model && (
                                <div className="pt-1.5 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-end text-[10px] text-slate-400">
                                  <span className="font-mono flex items-center gap-1">
                                    <Cpu className="w-2.5 h-2.5" /> {msg.model}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Live streaming bubble */}
                    {isFollowUpStreaming && streamingFollowUpText && (
                      <div className="flex gap-2.5 items-start">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        </div>
                        <div className="flex-1 rounded-2xl rounded-tl-xs px-4 py-3 bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/80 text-xs text-slate-800 dark:text-slate-200 shadow-2xs space-y-2">
                          <AIExplanationView text={streamingFollowUpText} />
                          <div className="pt-1.5 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                            <span className="flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                              Streaming answer...
                            </span>
                            {streamingModel && (
                              <span className="font-mono text-slate-400 flex items-center gap-1">
                                <Cpu className="w-2.5 h-2.5" /> {streamingModel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Initial Loading Skeleton / Thinking */}
                    {isFollowUpLoading && !streamingFollowUpText && (
                      <div className="flex gap-2.5 items-start">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        </div>
                        <div className="rounded-2xl rounded-tl-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span>Gemini is formulating an answer...</span>
                        </div>
                      </div>
                    )}

                    <div ref={chatBottomRef} />
                  </div>
                )}

                {/* Follow-up Error Alert */}
                {followUpError && (
                  <div className="mb-2.5 p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{followUpError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFollowUpError(null)}
                      className="text-[11px] underline hover:no-underline cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Follow-up Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendFollowUp();
                  }}
                  className="relative flex items-center"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="Ask a doubt about this solution (e.g. 'Why did we use this formula?')..."
                    disabled={isFollowUpLoading || isFollowUpStreaming || isStreaming}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 rounded-lg pl-3.5 pr-20 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-60 shadow-2xs"
                  />
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {(isFollowUpLoading || isFollowUpStreaming) ? (
                      <button
                        type="button"
                        onClick={handleAbortFollowUp}
                        title="Stop generating"
                        className="px-2 py-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <StopCircle className="w-3 h-3" /> Stop
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!currentInput.trim() || isStreaming}
                        className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <span>Ask</span>
                        <Send className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </form>
                <div className="flex items-center justify-between mt-1.5 px-0.5 text-[10px] text-slate-400">
                  <span>Press Enter ↵ to ask · Supports LaTeX math ($...$)</span>
                  {followUpMessages.length > 0 && (
                    <span>
                      {followUpMessages.filter((m) => m.role === 'user').length} question
                      {followUpMessages.filter((m) => m.role === 'user').length !== 1 ? 's' : ''} asked
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
