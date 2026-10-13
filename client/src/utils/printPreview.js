/**
 * Pop out clean printable preview of question paper in new window with Dark Mode support
 */
export function popoutPrintablePreview({
  title = 'Question Paper Preview',
  category = 'Exam',
  description = '',
  durationMinutes = 60,
  correctMark = 4,
  incorrectMark = -1,
  questions = []
}) {
  if (questions.length === 0) {
    return false;
  }

  const previewWin = window.open('', '_blank', 'width=1000,height=850,scrollbars=yes,resizable=yes');
  if (!previewWin) {
    alert('Pop-up window blocked! Please allow popups for this site to view the printable question paper.');
    return false;
  }

  let questionsHtml = '';
  questions.forEach((q, idx) => {
    let optionsHtml = '';
    if (Array.isArray(q.options)) {
      q.options.forEach((opt, oIdx) => {
        const letter = String.fromCharCode(65 + oIdx);
        const optText = typeof opt === 'object' ? (opt.text || '') : opt;
        const optImg = typeof opt === 'object' ? (opt.image || '') : '';
        optionsHtml += `
          <div class="option-row" style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
            <strong style="min-width:24px;color:#2563eb;">(${letter})</strong>
            <div>
              <span>${optText}</span>
              ${optImg ? `<br/><img src="${optImg}" style="max-height:120px;margin-top:6px;border-radius:4px;"/>` : ''}
            </div>
          </div>
        `;
      });
    }

    questionsHtml += `
      <div class="question-card" style="margin-bottom:24px;padding:18px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;page-break-inside:avoid;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:12px;color:#64748b;">
          <strong style="font-size:13px;color:#0f172a;" class="q-title">Question ${idx + 1} (${q.questionType || 'MCQ'})</strong>
          <span style="font-family:monospace;font-weight:600;">+${correctMark} / ${incorrectMark} Marks</span>
        </div>
        <div class="q-text" style="font-size:14px;color:#0f172a;line-height:1.6;margin-bottom:12px;font-weight:500;">
          ${q.questionText}
        </div>
        ${q.imageAttachment ? `<div style="margin-bottom:12px;"><img src="${q.imageAttachment}" style="max-height:220px;border-radius:8px;border:1px solid #e2e8f0;"/></div>` : ''}
        <div style="margin-top:10px;">${optionsHtml}</div>
      </div>
    `;
  });

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${title} - Question Paper Preview</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
      <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 24px; transition: background 0.2s, color 0.2s; }
        .paper-container { max-width: 860px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
        .toolbar { display: flex; gap: 8px; align-items: center; }
        .print-btn { background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; }
        .print-btn:hover { background: #1d4ed8; }
        .theme-btn { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; }
        .theme-btn:hover { background: #e2e8f0; }
        
        /* Dark mode support */
        body.dark-mode { background: #0C0F17; color: #f8fafc; }
        body.dark-mode .paper-container { background: #111827; border-color: #1e293b; box-shadow: 0 8px 30px rgba(0,0,0,0.5); }
        body.dark-mode .header { border-bottom-color: #1e293b; }
        body.dark-mode .header h1 { color: #f8fafc !important; }
        body.dark-mode .header p { color: #94a3b8 !important; }
        body.dark-mode .theme-btn { background: #1f2937; color: #f8fafc; border-color: #374151; }
        body.dark-mode .theme-btn:hover { background: #374151; }
        body.dark-mode .question-card { background: #141d2e !important; border-color: #1e293b !important; }
        body.dark-mode .q-title, body.dark-mode .q-text { color: #f8fafc !important; }
        body.dark-mode .option-row { background: #111827 !important; border-color: #1e293b !important; color: #f8fafc !important; }
        body.dark-mode .guidelines { background: #141d2e !important; border-color: #2563eb !important; color: #cbd5e1 !important; }

        @media print { 
          body, body.dark-mode { background: #fff !important; color: #000 !important; padding: 0; } 
          .paper-container { box-shadow: none !important; padding: 0 !important; max-width: 100% !important; border: none !important; background: #fff !important; } 
          .toolbar { display: none !important; } 
          .question-card { background: #fff !important; border-color: #e2e8f0 !important; }
          .option-row { background: #f8fafc !important; border-color: #e2e8f0 !important; color: #000 !important; }
          .q-title, .q-text { color: #000 !important; }
        }
      </style>
    </head>
    <body>
      <div class="paper-container">
        <div class="header">
          <div>
            <h1 style="margin:0 0 6px 0;font-size:22px;color:#0f172a;">${title}</h1>
            <p style="margin:0;font-size:13px;color:#64748b;">${category} • ${durationMinutes} Minutes • Total Marks: ${questions.length * correctMark} • ${questions.length} Questions</p>
          </div>
          <div class="toolbar">
            <button class="theme-btn" id="themeBtn" onclick="togglePaperTheme()">🌓 Dark Mode</button>
            <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
          </div>
        </div>
        ${description ? `<div class="guidelines" style="background:#f8fafc;padding:12px 16px;border-radius:8px;border-left:4px solid #2563eb;font-size:13px;color:#475569;margin-bottom:24px;">${description}</div>` : ''}
        <div>${questionsHtml}</div>
      </div>
      <script>
        function togglePaperTheme() {
          document.body.classList.toggle('dark-mode');
          const isDark = document.body.classList.contains('dark-mode');
          document.getElementById('themeBtn').innerText = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        }

        document.addEventListener("DOMContentLoaded", function() {
          renderMathInElement(document.body, {
            delimiters: [
              {left: '$$', right: '$$', display: true},
              {left: '$', right: '$', display: false}
            ],
            throwOnError: false
          });
        });
      </script>
    </body>
    </html>
  `;

  previewWin.document.open();
  previewWin.document.write(fullHtml);
  previewWin.document.close();
  return true;
}
