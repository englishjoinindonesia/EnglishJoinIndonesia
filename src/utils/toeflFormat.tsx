import React from 'react';

/**
 * Parses and formats TOEFL ITP Question Text, especially for Section 2 Part B: Written Expression.
 * Supports standard formats:
 * - <u>word</u> (A) or <u>word</u>(A) or <u>word</u>
 * - [u]word[/u] (A) or [u]word[/u]
 * - [A]word[/A]
 * - word (A)
 * Renders words with underline and letter label (A, B, C, D) centered directly beneath them,
 * matching official ETS TOEFL test booklet guidelines.
 */
export function renderFormattedToeflText(text: string, isDark: boolean = true): React.ReactNode {
  if (!text) return null;

  // Check if text has any underline or bracket markers
  const hasMarkup = /<u[\s>]/i.test(text) || /\[u\]/i.test(text) || /\[[A-D]\]/i.test(text);

  if (!hasMarkup) {
    return <span className="whitespace-pre-line leading-relaxed">{text}</span>;
  }

  let letterIndex = 0;
  const letters = ['A', 'B', 'C', 'D'];

  // 1. Replace [A]word[/A] -> [[UNDERLINE:word:A]]
  let normalized = text.replace(/\[([A-D])\]([\s\S]*?)\[\/\1\]/gi, (_, letter, word) => {
    return `[[UNDERLINE:${word.trim()}:${letter.toUpperCase()}]]`;
  });

  // 2. Replace <u>word</u> (A) or <u>word</u>
  normalized = normalized.replace(/<u[^>]*>([\s\S]*?)<\/u>\s*(?:\(([A-D])\)|\[([A-D])\])?/gi, (_, word, l1, l2) => {
    const letter = (l1 || l2 || letters[letterIndex++] || 'A').toUpperCase();
    return `[[UNDERLINE:${word.trim()}:${letter}]]`;
  });

  // 3. Replace [u]word[/u] (A) or [u]word[/u]
  normalized = normalized.replace(/\[u\]([\s\S]*?)\[\/u\]\s*(?:\(([A-D])\)|\[([A-D])\])?/gi, (_, word, l1, l2) => {
    const letter = (l1 || l2 || letters[letterIndex++] || 'A').toUpperCase();
    return `[[UNDERLINE:${word.trim()}:${letter}]]`;
  });

  const segments = normalized.split(/(\[\[UNDERLINE:[\s\S]*?:[A-D]\]\])/g);

  return (
    <span className="leading-loose inline font-sans text-xs sm:text-sm">
      {segments.map((seg, idx) => {
        const match = seg.match(/^\[\[UNDERLINE:([\s\S]*?):([A-D])\]\]$/);
        if (match) {
          const word = match[1];
          const letter = match[2];
          return (
            <span
              key={idx}
              className="inline-flex flex-col items-center mx-1.5 align-middle select-text group"
              style={{ display: 'inline-flex', verticalAlign: 'middle' }}
            >
              <span
                className={`border-b-2 font-medium px-1 pb-0.5 tracking-normal transition-colors ${
                  isDark
                    ? 'border-amber-400 text-white'
                    : 'border-stone-900 text-stone-900'
                }`}
              >
                {word}
              </span>
              <span className="text-[10px] sm:text-[11px] font-black text-amber-500 uppercase tracking-wider leading-none mt-0.5">
                ({letter})
              </span>
            </span>
          );
        }
        return <span key={idx}>{seg}</span>;
      })}
    </span>
  );
}

/**
 * Automatically extracts the four underlined words from a Written Expression sentence
 * into an object: { A: string, B: string, C: string, D: string }
 */
export function extractWrittenExpressionOptions(text: string): { A: string; B: string; C: string; D: string } {
  const result: { A: string; B: string; C: string; D: string } = { A: '', B: '', C: '', D: '' };
  if (!text) return result;

  const letters = ['A', 'B', 'C', 'D'] as const;
  let autoIdx = 0;

  // Regex to find <u>word</u> (A) or <u>word</u> or [u]word[/u]
  const regex = /(?:<u[^>]*>|\[u\])([\s\S]*?)(?:<\/u>|\[\/u\])\s*(?:\(([A-D])\)|\[([A-D])\])?/gi;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    const word = m[1]?.trim() || '';
    const specifiedLetter = (m[2] || m[3])?.toUpperCase() as 'A' | 'B' | 'C' | 'D' | undefined;
    const targetKey = specifiedLetter || letters[autoIdx++];
    if (targetKey && letters.includes(targetKey)) {
      result[targetKey] = word;
    }
  }

  // Also check [A]word[/A] syntax
  const bracketRegex = /\[([A-D])\]([\s\S]*?)\[\/\1\]/gi;
  while ((m = bracketRegex.exec(text)) !== null) {
    const letter = m[1]?.toUpperCase() as 'A' | 'B' | 'C' | 'D';
    const word = m[2]?.trim() || '';
    if (letter && letters.includes(letter)) {
      result[letter] = word;
    }
  }

  return result;
}
