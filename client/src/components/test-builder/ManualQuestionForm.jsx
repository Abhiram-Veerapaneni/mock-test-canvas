import React, { useState } from 'react';
import MathRenderer from '../common/MathRenderer';
import { Plus, Trash2, Eye, Edit3, AlertCircle } from 'lucide-react';

export default function ManualQuestionForm({ onAddQuestion }) {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('MCQ');
  const [subject, setSubject] = useState('Mathematics');
  const [topic, setTopic] = useState('');
  const [options, setOptions] = useState([
    'Option A with $\\frac{a}{b}$ formula',
    'Option B with $\\sqrt{x}$',
    'Option C',
    'Option D'
  ]);
  const [correctAnswers, setCorrectAnswers] = useState([0]);
  const [natMin, setNatMin] = useState('');
  const [natMax, setNatMax] = useState('');
  const [explanation, setExplanation] = useState('');
  const [previewMode, setPreviewMode] = useState('split');
  const [validationError, setValidationError] = useState('');

  const handleOptionChange = (idx, val) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, `Option ${String.fromCharCode(65 + options.length)}`]);
  };

  const handleRemoveOption = (idx) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== idx);
    setOptions(updated);
    setCorrectAnswers(correctAnswers.filter((ans) => ans !== idx).map((ans) => (ans > idx ? ans - 1 : ans)));
  };

  const handleCorrectMcqChange = (idx) => {
    setCorrectAnswers([idx]);
  };

  const handleCorrectMsqToggle = (idx) => {
    if (correctAnswers.includes(idx)) {
      setCorrectAnswers(correctAnswers.filter((i) => i !== idx));
    } else {
      setCorrectAnswers([...correctAnswers, idx].sort((a, b) => a - b));
    }
  };

  const handleQuestionTypeChange = (newType) => {
    setQuestionType(newType);
    if (newType === 'MCQ' || newType === 'MSQ') {
      setCorrectAnswers([0]);
    } else if (newType === 'NAT') {
      setCorrectAnswers([]);
    }
  };

  const handleSubmitQuestion = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!questionText.trim()) {
      setValidationError('Question statement is required.');
      return;
    }

    if (!subject.trim()) {
      setValidationError('Subject field is required.');
      return;
    }

    let finalCorrectAnswers = [];

    if (questionType === 'MCQ' || questionType === 'MSQ') {
      if (options.some((opt) => !opt.trim())) {
        setValidationError('All options must be non-empty.');
        return;
      }
      if (correctAnswers.length === 0) {
        setValidationError('Please mark at least one correct answer.');
        return;
      }
      finalCorrectAnswers = correctAnswers;
    } else if (questionType === 'NAT') {
      const minVal = parseFloat(natMin);
      const maxVal = parseFloat(natMax || natMin);
      if (isNaN(minVal) || isNaN(maxVal)) {
        setValidationError('Please enter a valid numeric value or boundary for NAT.');
        return;
      }
      finalCorrectAnswers = [minVal, maxVal];
    }

    const newQuestion = {
      questionText: questionText.trim(),
      questionType,
      subject: subject.trim(),
      topic: topic.trim() || 'General',
      options: questionType === 'NAT' ? [] : options.map((o) => o.trim()),
      correctAnswers: finalCorrectAnswers,
      explanation: explanation.trim()
    };

    onAddQuestion(newQuestion);

    // Reset form fields
    setQuestionText('');
    setTopic('');
    setExplanation('');
    if (questionType === 'NAT') {
      setNatMin('');
      setNatMax('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs text-slate-900 dark:text-slate-100">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
            Question Authoring Form
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            LaTeX equations parsed via KaTeX ($inline$ and $$block$$).
          </p>
        </div>

        {/* Segmented View Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setPreviewMode('edit')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              previewMode === 'edit'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1">
              <Edit3 className="w-3 h-3" /> Edit
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('split')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              previewMode === 'split'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Split
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('preview')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              previewMode === 'preview'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> Preview
            </span>
          </button>
        </div>
      </div>

      {validationError && (
        <div className="mb-4 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmitQuestion} className="space-y-4">
        {/* Type, Subject, Topic */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Question Type
            </label>
            <select
              value={questionType}
              onChange={(e) => handleQuestionTypeChange(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="MCQ">MCQ (Single Choice)</option>
              <option value="MSQ">MSQ (Multiple Choice)</option>
              <option value="NAT">NAT (Numerical Answer)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Aptitude">General Aptitude</option>
              <option value="Computer Science">Computer Science</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Topic / Tag
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Definite Integrals"
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Statement with Preview */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Question Statement
          </label>
          <div
            className={`grid gap-3 ${
              previewMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {(previewMode === 'edit' || previewMode === 'split') && (
              <textarea
                rows={4}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter question statement (e.g. Find $\int_0^1 x dx$)"
                className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            )}

            {(previewMode === 'preview' || previewMode === 'split') && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg overflow-y-auto max-h-40">
                <span className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 block mb-1">
                  Rendered Preview
                </span>
                {questionText ? (
                  <MathRenderer text={questionText} className="text-xs text-slate-900 dark:text-slate-100" />
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Formula output appears here...</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MCQ/MSQ Options */}
        {(questionType === 'MCQ' || questionType === 'MSQ') && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Options & Correct Answer ({questionType === 'MCQ' ? 'Single' : 'Multiple'})
              </label>
              <button
                type="button"
                onClick={handleAddOption}
                disabled={options.length >= 6}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-40"
              >
                <Plus className="w-3 h-3" /> Add Option
              </button>
            </div>

            <div className="space-y-2">
              {options.map((optText, optIdx) => {
                const isSelected = correctAnswers.includes(optIdx);
                return (
                  <div key={optIdx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        questionType === 'MCQ'
                          ? handleCorrectMcqChange(optIdx)
                          : handleCorrectMsqToggle(optIdx)
                      }
                      title={isSelected ? 'Marked correct' : 'Click to mark correct'}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isSelected ? '✓' : String.fromCharCode(65 + optIdx)}
                    </button>

                    <input
                      type="text"
                      value={optText}
                      onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                      className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(optIdx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NAT Range */}
        {questionType === 'NAT' && (
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Numeric Value Range [Min, Max]
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Minimum Value</span>
                <input
                  type="number"
                  step="any"
                  value={natMin}
                  onChange={(e) => setNatMin(e.target.value)}
                  placeholder="e.g. 10.0"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Maximum Value (Optional)</span>
                <input
                  type="number"
                  step="any"
                  value={natMax}
                  onChange={(e) => setNatMax(e.target.value)}
                  placeholder="e.g. 10.5"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Explanation */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Explanation / Pedagogical Solution
          </label>
          <textarea
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Solution details visible in post-exam analysis..."
            className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Add Question Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Question Paper</span>
          </button>
        </div>
      </form>
    </div>
  );
}
