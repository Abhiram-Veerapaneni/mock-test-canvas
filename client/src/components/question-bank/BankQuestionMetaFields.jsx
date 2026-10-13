import React from 'react';
import { X } from 'lucide-react';

export default function BankQuestionMetaFields({
  stream,
  onStreamChange,
  streamSuggestions = [],
  questionType,
  onQuestionTypeChange,
  tags = [],
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Stream */}
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Subject Stream
        </label>
        <input
          list="stream-suggestions"
          type="text"
          value={stream}
          onChange={(e) => onStreamChange(e.target.value)}
          placeholder="e.g. Physics, Mathematics"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
        />
        <datalist id="stream-suggestions">
          {streamSuggestions.map((st) => (
            <option key={st} value={st} />
          ))}
        </datalist>
      </div>

      {/* Question Type */}
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Question Type
        </label>
        <select
          value={questionType}
          onChange={(e) => onQuestionTypeChange(e.target.value)}
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
        >
          <option value="MCQ">MCQ (Single Choice)</option>
          <option value="MSQ">MSQ (Multiple Choice)</option>
          <option value="NAT">NAT (Numerical Answer)</option>
        </select>
      </div>

      {/* Tags Chip Input */}
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Concept Tags (Press Enter)
        </label>
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg min-h-[34px]">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-[11px]"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyDown={onAddTag}
            placeholder={tags.length === 0 ? "Type tag & Enter" : ""}
            className="flex-1 min-w-[80px] bg-transparent text-xs text-slate-900 dark:text-slate-100 focus:outline-none px-1"
          />
        </div>
      </div>
    </div>
  );
}
