import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import MathRenderer from '../common/MathRenderer';
import useThemeStore from '../../store/useThemeStore';
import {
  X,
  Download,
  Loader2,
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
  const [isPrinting, setIsPrinting] = useState(false);

  // Manage body class for print isolation & clean up any rogue blocking overlays
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('paper-modal-open');
      // Force remove any leftover html2pdf overlay elements that could block interaction
      document.querySelectorAll('.html2pdf__overlay').forEach((el) => el.remove());
      return () => {
        document.body.classList.remove('paper-modal-open');
        document.querySelectorAll('.html2pdf__overlay').forEach((el) => el.remove());
      };
    }
  }, [isOpen]);

  if (!isOpen || !exam) return null;

  const questions = exam.questions || [];
  const correctMark = exam.markingScheme?.correct ?? 4;
  const incorrectMark = exam.markingScheme?.incorrect ?? -1;
  const totalMarks = exam.totalMarks || questions.length * correctMark;
  const isDark = paperTheme === 'dark';

  const getOptionLabel = (idx) => String.fromCharCode(65 + idx);

  const formatOption = (opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return { text: opt.text || '', image: opt.image || '' };
    }
    return { text: String(opt || ''), image: '' };
  };

  /**
   * High-Fidelity Vector PDF Export / Print
   * Uses an isolated hidden iframe containing exclusively the question paper element.
   * This guarantees that zero elements from the main application/editor flow into the print preview,
   * rendering exactly 1 sheet (or clean pages for the exam) with 100% crisp vector KaTeX equations.
   */
  const handlePrintPDF = () => {
    const element = document.getElementById('printable-question-paper');
    if (!element) {
      window.print();
      return;
    }

    setIsPrinting(true);

    const originalTitle = document.title;
    const cleanTitle = (exam.title || 'Question_Paper')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const pdfFilename = `${cleanTitle || 'Examination'}_Question_Paper`;
    document.title = pdfFilename;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.title = 'Question Paper Print Frame';
    document.body.appendChild(iframe);

    try {
      const iframeDoc = iframe.contentWindow.document;

      // Extract all stylesheets and style tags from current document
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((el) => el.outerHTML)
        .join('\n');

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>${pdfFilename}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              background: ${isDark ? '#0f172a' : '#ffffff'} !important;
              color: ${isDark ? '#f8fafc' : '#000000'} !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            #printable-question-paper {
              box-shadow: none !important;
              border: none !important;
              max-width: 100% !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              background: transparent !important;
            }
            .break-inside-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .break-before-page {
              page-break-before: always !important;
              break-before: page !important;
            }
          </style>
        </head>
        <body>
          ${element.outerHTML}
        </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          console.warn('Iframe print error, falling back to window.print:', e);
          window.print();
        } finally {
          setIsPrinting(false);
          document.title = originalTitle;
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1500);
        }
      }, 300);
    } catch (err) {
      console.error('Failed to setup print iframe, falling back to window.print:', err);
      setIsPrinting(false);
      document.title = originalTitle;
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      window.print();
    }
  };


  return createPortal(
    <div
      id="question-paper-modal-root"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 overflow-y-auto paper-modal-overlay"
      onClick={onClose}
    >
      <div
        className="max-w-5xl w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg shadow-sm overflow-hidden flex flex-col max-h-[94vh] paper-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Toolbar (hidden in print) */}
        <div className="paper-modal-toolbar px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC] dark:bg-[#0C0F17] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>Examination Paper Preview & PDF Export</span>
                <span className="text-xs text-slate-400 tabular-nums">
                  ({questions.length} Questions)
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Ready for standard A4 printing or saving as a vector PDF document.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* Paper Dark / Light Mode Switcher */}
            <button
              type="button"
              onClick={() => setPaperTheme(isDark ? 'light' : 'dark')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#162030]/50"
              title={`Switch preview to ${isDark ? 'Light' : 'Dark'} mode`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-slate-400" /> : <Moon className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isDark ? 'Light Paper' : 'Dark Paper'}</span>
            </button>

            {/* Toggle Solutions */}
            <button
              type="button"
              onClick={() => setIncludeSolutions(!includeSolutions)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                includeSolutions
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 border-indigo-600 dark:border-indigo-400'
                  : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#162030]/50'
              }`}
            >
              {includeSolutions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{includeSolutions ? 'Hide Solutions' : 'Include Solutions'}</span>
            </button>

            {/* Download / Print PDF button (Primary Action) */}
            <button
              type="button"
              onClick={handlePrintPDF}
              disabled={isPrinting}
              className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Save as PDF or Print question paper"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download / Print PDF</span>
                </>
              )}
            </button>


            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-[#162030] transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet Container */}
        <div className="paper-content-container flex-1 overflow-y-auto p-4 sm:p-10 bg-slate-100 dark:bg-[#0C0F17]">
          {/* A4 Sheet Replica */}
          <div
            id="printable-question-paper"
            className={`max-w-[850px] mx-auto shadow-sm p-8 sm:p-12 rounded-lg space-y-8 font-serif leading-relaxed transition-colors duration-200 ${
              isDark
                ? 'bg-slate-900 text-slate-100 border border-slate-800'
                : 'bg-white text-slate-900 border border-slate-200'
            }`}
          >
            {/* Header / Title Banner */}
            <div
              className={`text-center border-b-2 pb-6 space-y-2 ${
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
              className={`rounded-lg p-4 font-sans text-xs space-y-1.5 border ${
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
                    className={`question-card-item space-y-3 pb-6 border-b last:border-b-0 break-inside-avoid ${
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
    </div>,
    document.body
  );
}
