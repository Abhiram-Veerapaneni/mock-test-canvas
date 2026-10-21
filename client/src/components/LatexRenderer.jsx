import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * LatexRenderer Component
 * Dynamic KaTeX math parser supporting inline ($...$) and block ($$...$$) LaTeX expressions
 */
export default function LatexRenderer({ content = '', className = '', inline = false }) {
  const renderedElements = useMemo(() => {
    if (!content) return null;

    const regex = /(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g;
    const parts = content.split(regex);

    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const math = part.slice(2, -2).trim();

        const prevPart = index > 0 ? parts[index - 1] : '';
        const nextPart = index < parts.length - 1 ? parts[index + 1] : '';
        const isPrevNewline = !prevPart || prevPart.trim() === '' || /[\r\n]\s*$/.test(prevPart);
        const isNextNewline = !nextPart || nextPart.trim() === '' || /^\s*[\r\n]/.test(nextPart);
        const isStandaloneBlock = !inline && isPrevNewline && isNextNewline;

        try {
          const html = katex.renderToString(math, {
            displayMode: isStandaloneBlock,
            throwOnError: false
          });

          if (isStandaloneBlock) {
            return (
              <span
                key={index}
                className="my-3 block text-center overflow-x-auto text-blue-600 dark:text-blue-300 font-semibold"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }

          return (
            <span
              key={index}
              className="inline-block px-1 text-blue-700 dark:text-blue-300 font-semibold"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (err) {
          return <span key={index} className="text-red-500 font-mono text-xs">{part}</span>;
        }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(math, {
            displayMode: false,
            throwOnError: false
          });
          return (
            <span
              key={index}
              className="inline-block px-1 text-blue-700 dark:text-blue-300 font-semibold"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (err) {
          return <span key={index} className="text-red-500 font-mono text-xs">{part}</span>;
        }
      }

      return (
        <span key={index} className="whitespace-pre-line text-slate-800 dark:text-slate-100 font-medium">
          {part}
        </span>
      );
    });
  }, [content]);

  return <div className={`latex-container leading-relaxed text-base md:text-lg ${className}`}>{renderedElements}</div>;
}
