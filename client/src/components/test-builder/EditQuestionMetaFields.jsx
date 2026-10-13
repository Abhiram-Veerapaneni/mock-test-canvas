import React from 'react';

export default function EditQuestionMetaFields({
  questionType,
  onQuestionTypeChange,
  subject,
  onSubjectChange,
  topic,
  onTopicChange,
  stream,
  onStreamChange,
  streamSuggestions,
  tags,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag
}) {
  return (
    <div className="space-y-3">
      {/* Meta Row: Type, Subject, Topic */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Question Type
          </label>
          <select
            value={questionType}
            onChange={(e) => onQuestionTypeChange(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
            onChange={(e) => onSubjectChange(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="General Aptitude">General Aptitude</option>
            <option value="Computer Science">Computer Science</option>
            <option value="General">General</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Topic / Subtopic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="e.g. Thermodynamics"
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Stream and Tags for Question Bank */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Stream (Bank Category)
          </label>
          <input
            list="edit-modal-streams"
            type="text"
            value={stream}
            onChange={(e) => onStreamChange(e.target.value)}
            placeholder="e.g. Physics, Chemistry"
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none"
          />
          <datalist id="edit-modal-streams">
            {streamSuggestions.map((st) => (
              <option key={st} value={st} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Tags (Press Enter or comma)
          </label>
          <div className="flex flex-wrap items-center gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg min-h-[32px]">
            {tags.map((tg) => (
              <span
                key={tg}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px]"
              >
                <span>{tg}</span>
                <button
                  type="button"
                  onClick={() => onRemoveTag(tg)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-100"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => onTagInputChange(e.target.value)}
              onKeyDown={onAddTag}
              placeholder={tags.length === 0 ? 'Add tags...' : ''}
              className="flex-1 min-w-[70px] bg-transparent text-xs text-slate-900 dark:text-slate-100 focus:outline-none px-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
