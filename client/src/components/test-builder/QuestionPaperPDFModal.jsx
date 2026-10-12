import React, { useState } from 'react';
import MathRenderer from '../common/MathRenderer';
import useThemeStore from '../../store/useThemeStore';
import {
  X,
  Printer,
  FileText,
  Eye,
  EyeOff,
  Sun,
  Moon
} from 'lucide-react';

export default function QuestionPaperPDFModal({
  isOpen,
  exam,
  onClose
}) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const [includeSolutions, setIncludeSolutions] = useState(false);
  const [paperTheme, setPaperTheme] = useState(() => (resolvedTheme === 'dark' ? 'dark' : 'light'));

  if (!isOpen || !exam) return null;

  const questions = exam.questions || [];
  const correctMark = exam.markingScheme?.correct ?? 4;
  const incorrectMark = exam.markingScheme?.incorrect ?? -1;
  const totalMarks = exam.totalMarks || questions.length * correctMark;

  const handlePrint = () => {
    window.print();
  };

  const getOptionLabel = (idx) => String.fromCharCode(65 + idx);

  const formatOption = (opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return { text: opt.text || '', image: opt.image || '' };
    }
    return { text: String(opt || ''), image: '' };
  };

  const isDark = paperTheme === 'dark';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      <div
        className="max-w-5xl w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:border-none print:shadow-none print:w-full print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Toolbar (hidden in print) */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-[#0b0f17] shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Examination Paper Preview & PDF Export</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {questions.length} Questions
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ready for standard A4 printing or saving as a vector PDF document.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Paper Dark / Light Mode Switcher */}
            <button
              type="button"
              onClick={() => setPaperTheme(isDark ? 'light' : 'dark')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              title={`Switch preview to ${isDark ? 'Light' : 'Dark'} mode`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
              <span>{isDark ? 'Light Paper' : 'Dark Paper'}</span>
            </button>

            {/* Toggle Solutions */}
            <button
              type="button"
              onClick={() => setIncludeSolutions(!includeSolutions)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                includeSolutions
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {includeSolutions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{includeSolutions ? 'Hide Solutions' : 'Include Solutions'}</span>
            </button>

            {/* Print / Save PDF button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-10 bg-slate-100 dark:bg-[#070b13] print:bg-white print:p-0">
          {/* A4 Sheet Replica */}
          <div
            className={`max-w-[850px] mx-auto shadow-md print:shadow-none p-8 sm:p-12 rounded-xl print:rounded-none print:p-6 space-y-8 font-serif leading-relaxed transition-colors duration-200 print:bg-white print:text-black ${
              isDark
                ? 'bg-[#111827] text-slate-100 border border-slate-800'
                : 'bg-white text-slate-900'
            }`}
          >
            {/* Header / Title Banner */}
            <div
              className={`text-center border-b-2 pb-6 space-y-2 print:border-black ${
                isDark ? 'border-slate-700' : 'border-slate-900'
              }`}
            >
              <div className={`text-[11px] font-sans font-bold tracking-widest uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Mock Test Canvas Assessment System
              </div>
              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight uppercase font-sans ${isDark ? 'text-white' : 'text-slate-950'}`}>
                {exam.title || 'Examination Question Paper'}
              </h1>
              <div className={`flex items-center justify-center gap-3 text-xs font-sans font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span>Category: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{exam.category || 'Standard'}</strong></span>
                <span>•</span>
                <span>Time Allowed: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{exam.durationMinutes || 180} Minutes</strong></span>
                <span>•</span>
                <span>Maximum Marks: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{totalMarks}</strong></span>
              </div>
              <div className={`text-[11px] font-sans ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Marking Scheme: Correct: <strong>+{correctMark}</strong> | Incorrect: <strong>{incorrectMark}</strong>
              </div>
            </div>

            {/* General Instructions */}
            <div
              className={`rounded-lg p-4 font-sans text-xs space-y-1.5 border print:bg-slate-50 print:text-slate-700 ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className={`font-bold uppercase tracking-wider text-[11px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Instructions for Candidates:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                <li>This question paper contains <strong>{questions.length}</strong> questions divided into relevant conceptual sections.</li>
                <li>For Multiple Choice Questions (MCQ/MSQ), select the most appropriate option(s).</li>
                <li>For Numerical Answer Type (NAT) questions, enter numerical values in the designated response zone.</li>
                <li>Rough work must be completed on scratch sheets. No electronic gadgets or unauthorized aids are permitted.</li>
              </ol>
            </div>

            {/* Questions List */}
            <div className="space-y-8 pt-2">
              {questions.map((q, idx) => {
                const isNat = q.questionType === 'NAT';
                const opts = Array.isArray(q.options) ? q.options.map(formatOption) : [];

                return (
                  <div
                    key={q._id || idx}
                    className={`space-y-3 pb-6 border-b last:border-b-0 break-inside-avoid ${
                      isDark ? 'border-slate-800' : 'border-slate-200'
                    }`}
                  >
                    {/* Question Header & Meta */}
                    <div className="flex items-center justify-between text-xs font-sans">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-950'}`}>
                          Question {idx + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-semibold text-[10px] border ${
                            isDark
                              ? 'bg-slate-800 text-slate-300 border-slate-700'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {q.questionType || 'MCQ'}
                        </span>
                        {q.subject && (
                          <span className={isDark ? 'text-slate-400 text-[11px]' : 'text-slate-500 text-[11px]'}>
                            {q.subject} {q.topic && `• ${q.topic}`}
                          </span>
                        )}
                        {q.isEdited && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[9px] border border-amber-300">
                            Edited
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">
                        [{correctMark} Marks]
                      </span>
                    </div>

                    {/* Question Statement */}
                    {q.questionText && (
                      <div className={`text-sm sm:text-base leading-relaxed pl-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        <MathRenderer text={q.questionText} />
                      </div>
                    )}

                    {/* Question Image Attachment */}
                    {q.imageAttachment && (
                      <div className="pl-2 my-2">
                        <img
                          src={q.imageAttachment}
                          alt={`Diagram for Question ${idx + 1}`}
                          className={`max-h-64 max-w-md rounded-lg border object-contain ${
                            isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200'
                          }`}
                        />
                      </div>
                    )}

                    {/* Options (MCQ / MSQ) */}
                    {!isNat && opts.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2 pt-1 font-sans text-xs">
                        {opts.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                              isDark
                                ? 'border-slate-800 bg-slate-900/60 text-slate-200'
                                : 'border-slate-200 bg-slate-50/50 text-slate-800'
                            }`}
                          >
                            <span className={`font-bold shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                              ({getOptionLabel(optIdx)})
                            </span>
                            <div className="flex-1 min-w-0 space-y-1">
                              {opt.text && (
                                <MathRenderer
                                  text={opt.text}
                                  className={isDark ? 'text-slate-100' : 'text-slate-900'}
                                />
                              )}
                              {opt.image && (
                                <img
                                  src={opt.image}
                                  alt={`Option ${getOptionLabel(optIdx)} diagram`}
                                  className="max-h-24 max-w-full rounded border border-slate-200 dark:border-slate-700 object-contain bg-white"
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* NAT Answer Line */}
                    {isNat && (
                      <div className={`pl-2 pt-2 font-sans text-xs flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className="font-semibold">Candidate Answer:</span>
                        <div className={`w-48 border-b-2 border-dashed h-5 ${isDark ? 'border-slate-600' : 'border-slate-400'}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Answer Key & Solutions Appendix (if enabled) */}
            {includeSolutions && (
              <div
                className={`pt-8 border-t-2 space-y-4 font-sans break-before-page ${
                  isDark ? 'border-slate-700' : 'border-slate-900'
                }`}
              >
                <div className="text-center pb-2">
                  <h2 className={`text-lg font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    Official Answer Key & Explanations
                  </h2>
                  <p className="text-xs text-slate-500">Instructor Evaluation Appendix</p>
                </div>

                <div className="space-y-4">
                  {questions.map((q, idx) => {
                    const isNat = q.questionType === 'NAT';
                    const correctAnswers = q.correctAnswers || [];

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                          isDark
                            ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Q{idx + 1}. Correct Answer:
                          </span>
                          <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {isNat
                              ? correctAnswers[0] === correctAnswers[1] || correctAnswers[1] === undefined
                                ? `${correctAnswers[0]}`
                                : `[${correctAnswers[0]}, ${correctAnswers[1]}]`
                              : correctAnswers.map((a) => getOptionLabel(a)).join(', ')}
                          </span>
                        </div>

                        {q.explanation && (
                          <div className={`pt-1 border-t leading-relaxed ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200/60 text-slate-600'}`}>
                            <span className="font-semibold">Solution: </span>
                            <MathRenderer text={q.explanation} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Document Footer */}
            <div className={`text-center pt-8 border-t font-sans text-[10px] ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
              Generated by Mock Test Canvas • Page End • All Rights Reserved
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
