import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Safely parses string containing inline ($...$) and block ($$...$$) LaTeX formulas
 * and converts them into rendered HTML spans alongside standard text.
 */
export default function MathRenderer({ text, className = '' }) {
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
        try {
          const html = katex.renderToString(formula, {
            displayMode: true,
            throwOnError: false,
            output: 'htmlAndMathml'
          });
          return (
            <span
              key={index}
              className="my-2 block overflow-x-auto py-1 text-center"
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
  }, [text]);

  return <div className={`leading-relaxed ${className}`}>{renderedContent}</div>;
}
