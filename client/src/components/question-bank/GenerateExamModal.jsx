import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  X,
  Zap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Loader2,
  BookOpen,
  Tag,
  Clock,
  Award,
  Layers,
  Info
} from 'lucide-react';

export default function GenerateExamModal({
  isOpen,
  initialStream = 'ALL',
  initialTags = [],
  onClose
}) {
  if (!isOpen) return null;

  const navigate = useNavigate();

  // Multi-step modal state
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Filter & Count state
  const [stream, setStream] = useState(initialStream || 'ALL');
  const [streamsList, setStreamsList] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  const [selectedTags, setSelectedTags] = useState(initialTags || []);
  const [count, setCount] = useState(15);
  const [availableCount, setAvailableCount] = useState(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  // Step 2: Exam Settings state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('CUSTOM');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [correctMark, setCorrectMark] = useState(4);
  const [incorrectMark, setIncorrectMark] = useState(-1);

  // Submission state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [warningMsg, setWarningMsg] = useState('');

  // Fetch streams & tags
  useEffect(() => {
    api.get('/questions/meta/streams')
      .then((res) => {
        if (res.data?.success) setStreamsList(res.data.streams || []);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const params = stream && stream !== 'ALL' ? { stream } : {};
    api.get('/questions/meta/tags', { params })
      .then((res) => {
        if (res.data?.success) setTagsList(res.data.tags || []);
      })
      .catch((err) => console.error(err));
  }, [stream]);

  // Debounced live counter of matching questions
  const debounceRef = useRef(null);
  useEffect(() => {
    setIsLoadingCount(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const params = { countOnly: true };
      if (stream && stream !== 'ALL') params.stream = stream;
      if (selectedTags.length > 0) params.tags = selectedTags.join(',');

      api.get('/questions', { params })
        .then((res) => {
          if (res.data?.success) {
            setAvailableCount(res.data.count);
          }
        })
        .catch((err) => {
          console.error('Error fetching matching count:', err);
        })
        .finally(() => {
          setIsLoadingCount(false);
        });
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [stream, selectedTags]);

  const handleToggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Move to Step 2 with smart defaults
  const handleProceedToStep2 = () => {
    setError('');
    if (availableCount === 0) {
      setError('No matching questions are available in the question bank for these filters.');
      return;
    }

    const effectiveNum = Math.min(count, availableCount || count);
    const streamName = stream && stream !== 'ALL' ? stream : 'General';
    const tagSummary = selectedTags.length > 0 ? selectedTags.join(', ') : 'All Topics';
    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    if (!title) {
      setTitle(`Practice — ${streamName} · ${tagSummary} · ${dateStr}`);
    }
    setDurationMinutes(effectiveNum * 2);
    setCurrentStep(2);
  };

  const handleGenerateExam = async (e) => {
    e.preventDefault();
    setError('');
    setIsGenerating(true);

    try {
      const payload = {
        stream: stream && stream !== 'ALL' ? stream : undefined,
        tags: selectedTags,
        count: Number(count),
        title: title.trim(),
        durationMinutes: Number(durationMinutes),
        category,
        markingScheme: {
          correct: Number(correctMark),
          incorrect: Number(incorrectMark)
        }
      };

      const res = await api.post('/questions/generate-exam', payload);

      if (res.data?.success && res.data.exam) {
        const generatedExam = res.data.exam;
        const warning = res.data.warning;

        if (warning) {
          setWarningMsg(warning);
          // Wait 1.5 seconds so candidate sees warning message, then redirect
          setTimeout(() => {
            navigate(`/test/${generatedExam._id}`);
          }, 1500);
        } else {
          navigate(`/test/${generatedExam._id}`);
        }
      } else {
        throw new Error(res.data?.message || 'Failed to generate practice test');
      }
    } catch (err) {
      console.error('Failed to generate exam:', err);
      setError(err.response?.data?.message || err.message || 'Error generating exam.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-[#162030]/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Random Exam Generator
              </h3>
              <p className="text-[11px] text-slate-500">
                Step {currentStep} of 2 — {currentStep === 1 ? 'Filter & Pool Selection' : 'Exam Configurations'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162030]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-white dark:bg-[#131926] border-l-4 border-l-rose-600 border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2.5 shadow-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span className="font-medium text-slate-900 dark:text-slate-100">{error}</span>
            </div>
          )}

          {warningMsg && (
            <div className="p-3 rounded-lg bg-white dark:bg-[#131926] border-l-4 border-l-amber-500 border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2.5 shadow-xs">
              <Info className="w-4 h-4 shrink-0 text-amber-500" />
              <span className="font-medium text-slate-900 dark:text-slate-100">{warningMsg} Redirecting to exam...</span>
            </div>
          )}

          {/* STEP 1: Filter & Count */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Stream Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subject Stream
                </label>
                <select
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
                >
                  <option value="ALL">All Streams (General Pool)</option>
                  {streamsList.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags Multi-select */}
              {tagsList.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Topic Tags ({selectedTags.length > 0 ? `${selectedTags.length} selected` : 'All Topics'})
                    </label>
                    {selectedTags.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedTags([])}
                        className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                      >
                        Clear tags
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-800/80 rounded-lg">
                    {tagsList.map((t) => {
                      const isSelected = selectedTags.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleToggleTag(t)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${isSelected
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40'
                              : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
                            }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Desired Question Count & Live Counter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Desired Questions (N)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={count}
                    onChange={(e) => setCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 font-mono"
                  />
                </div>

                {/* Available Pool Live Status */}
                <div className="p-3 bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-800/80 rounded-lg flex flex-col justify-center">
                  <div className="text-[11px] text-slate-500 font-medium">Available in Pool:</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                    {isLoadingCount ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    ) : (
                      <span>{availableCount ?? 0} matching questions</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Pool warning if requested > available */}
              {!isLoadingCount && availableCount !== null && count > availableCount && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    Requested {count} questions, but only {availableCount} are available. Exam will be generated with all {availableCount} available questions.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Exam Settings */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Title Override */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Examination Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Speed Practice — Thermodynamics"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Exam Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
                  >
                    <option value="CUSTOM">Custom Practice</option>
                    <option value="JEE">JEE</option>
                    <option value="NEET">NEET</option>
                    <option value="GATE">GATE</option>
                    <option value="APTITUDE">Aptitude</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 font-mono"
                  />
                </div>
              </div>

              {/* Marking Scheme */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Correct Mark (+)
                  </label>
                  <input
                    type="number"
                    value={correctMark}
                    onChange={(e) => setCorrectMark(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Negative Penalty (-)
                  </label>
                  <input
                    type="number"
                    value={incorrectMark}
                    onChange={(e) => setIncorrectMark(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#162030]/50 flex items-center justify-between">
          {currentStep === 2 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-3.5 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#162030] cursor-pointer"
            >
              Cancel
            </button>

            {currentStep === 1 ? (
              <button
                type="button"
                onClick={handleProceedToStep2}
                disabled={isLoadingCount || availableCount === 0}
                className="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 text-xs font-medium hover:bg-slate-800 dark:hover:bg-white flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerateExam}
                disabled={isGenerating}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>Generate & Start Test</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
