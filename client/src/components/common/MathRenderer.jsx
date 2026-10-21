import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Safely parses string containing inline ($...$) and block ($$...$$) LaTeX formulas
 * and converts them into rendered HTML spans alongside standard text.
 */
export default function MathRenderer({ text, className = '', inline = false }) {
  const renderedContent = useMemo(() => {
    if (!text || typeof text !== 'string') return null;

    // Regular expression matching $$...$$ (block) and $...$ (inline)
    // Matches block formulas first to avoid incorrect inline splitting
    const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;

    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.slice(2, -2).trim();

        // Determine if this formula is actually a standalone block on its own line
        // or embedded inline within a sentence.
        const prevPart = index > 0 ? parts[index - 1] : '';
        const nextPart = index < parts.length - 1 ? parts[index + 1] : '';
        const isPrevNewline = !prevPart || prevPart.trim() === '' || /[\r\n]\s*$/.test(prevPart);
        const isNextNewline = !nextPart || nextPart.trim() === '' || /^\s*[\r\n]/.test(nextPart);
        const isStandaloneBlock = !inline && isPrevNewline && isNextNewline;

        try {
          const html = katex.renderToString(formula, {
            displayMode: isStandaloneBlock,
            throwOnError: false,
            output: 'htmlAndMathml'
          });

          if (isStandaloneBlock) {
            return (
              <span
                key={index}
                className="my-2 block overflow-x-auto py-1 text-center"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }

          return (
            <span
              key={index}
              className="inline-block px-0.5 align-baseline"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (err) {
          return (
            <span key={index} className="text-rose-400 font-mono text-xs">
              [Math Render Error: {formula}]
            </span>
          );
        }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const formula = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(formula, {
            displayMode: false,
            throwOnError: false,
            output: 'htmlAndMathml'
          });
          return (
            <span
              key={index}
              className="inline-block px-0.5 align-baseline"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (err) {
          return (
            <span key={index} className="text-rose-400 font-mono text-xs">
              [Math Render Error: {formula}]
            </span>
          );
        }
      }

      // Standard prose text
      return <span key={index}>{part}</span>;
    });
  }, [text, inline]);

  if (inline) {
    return <span className={`leading-relaxed ${className}`}>{renderedContent}</span>;
  }

  return <div className={`leading-relaxed ${className}`}>{renderedContent}</div>;
}
