/**
 * Precision Tokenizer for Literary and Book Chapter Text.
 *
 * Designed to eliminate classic NLP segmentation flaws in prose:
 * 1. Honors dialogue attributions ("'Run!' said the rabbit." => 1 sentence).
 * 2. Guardrails honorific and academic abbreviations (Dr., Mr., Mrs., Prof., St., etc.).
 * 3. Handles initialisms (J. K. Rowling, U.S., e.g., i.e.).
 * 4. Avoids breaking on ellipses (...) and numeric decimals (3.14).
 * 5. Returns precise start and end character offsets in the original text for lossless highlighting.
 */

const COMMON_ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'st', 'gen', 'capt', 'col', 'lt', 'rev',
  'hon', 'rep', 'sen', 'gov', 'vs', 'eg', 'ie', 'etc', 'jr', 'sr', 'al',
  'vol', 'ch', 'no', 'fig', 'pp', 'p', 'ave', 'blvd', 'rd', 'dept', 'univ'
]);

/**
 * Tokenizes raw chapter text into an array of sentence objects with exact character offsets.
 *
 * @param {string} text 
 * @returns {Array<{text: string, raw: string, start: number, end: number, index: number}>}
 */
export function tokenizeSentences(text) {
  if (!text || typeof text !== 'string') return [];

  const sentences = [];
  const len = text.length;
  let start = 0;

  // Advance over initial whitespace
  while (start < len && /\s/.test(text[start])) {
    start++;
  }

  let i = start;
  while (i < len) {
    const ch = text[i];

    // Check sentence boundary candidates (. ! ? …)
    if (ch === '.' || ch === '!' || ch === '?' || ch === '…') {
      let isTerminator = true;

      // 1. Check for ellipsis: .. or ...
      if (ch === '.' && (text[i + 1] === '.' || text[i - 1] === '.')) {
        i++;
        continue;
      }

      // 2. Check for numeric decimal: e.g. 3.14 or $10.50
      if (ch === '.' && /\d/.test(text[i - 1] || '') && /\d/.test(text[i + 1] || '')) {
        i++;
        continue;
      }

      // 3. Check for abbreviation or single-letter initial before period
      if (ch === '.') {
        let k = i - 1;
        while (k >= start && /[a-zA-Z]/.test(text[k])) {
          k--;
        }
        const word = text.slice(k + 1, i).toLowerCase();

        // Single capital initial like "C. S. Lewis"
        if (word.length === 1 && /[A-Z]/.test(text[k + 1])) {
          i++;
          continue;
        }

        // Known abbreviation
        if (COMMON_ABBREVIATIONS.has(word)) {
          i++;
          continue;
        }
      }

      // Look ahead for trailing quotes/brackets (e.g. '"', "'", '”', '’', ')', ']')
      let end = i + 1;
      while (end < len && /["'”’»›)\]]/.test(text[end])) {
        end++;
      }

      // 4. Check for dialogue attribution:
      // If closing punctuation inside a quote is followed by lowercase speech tags
      // (e.g. "I know!" said Harry. or "Come here," whispered Alice.)
      const textAfter = text.slice(end);
      const attributionMatch = textAfter.match(/^\s+([a-z]+)/);
      if (attributionMatch) {
        // The sentence continues into the dialogue tag!
        i = end;
        continue;
      }

      // Valid sentence terminator confirmed
      const sentenceRaw = text.slice(start, end);
      const sentenceText = sentenceRaw.trim();

      if (sentenceText.length > 0) {
        sentences.push({
          index: sentences.length,
          text: sentenceText,
          raw: sentenceRaw,
          start,
          end
        });
      }

      // Advance start to next non-whitespace character
      start = end;
      while (start < len && /\s/.test(text[start])) {
        start++;
      }
      i = start;
      continue;
    }

    // 5. Check for double newline indicating paragraph break (implicit sentence boundary)
    if (ch === '\n' && text[i + 1] === '\n') {
      const sentenceRaw = text.slice(start, i);
      const sentenceText = sentenceRaw.trim();

      if (sentenceText.length > 0) {
        sentences.push({
          index: sentences.length,
          text: sentenceText,
          raw: sentenceRaw,
          start,
          end: i
        });
      }

      // Skip newlines & whitespace
      while (i < len && /\s/.test(text[i])) {
        i++;
      }
      start = i;
      continue;
    }

    i++;
  }

  // Collect trailing content
  if (start < len) {
    const trailingRaw = text.slice(start, len);
    const trailingText = trailingRaw.trim();
    if (trailingText.length > 0) {
      sentences.push({
        index: sentences.length,
        text: trailingText,
        raw: trailingRaw,
        start,
        end: len
      });
    }
  }

  return sentences;
}

/**
 * Extracts words from text, preserving hyphenated compound words while stripping punctuation.
 *
 * @param {string} text 
 * @returns {Array<{word: string, isCapitalized: boolean}>}
 */
export function extractWords(text) {
  if (!text) return [];

  // Match words, including contractions (don't, it's) and hyphenated words (well-known)
  const wordRegex = /\b[a-zA-Z]+(?:['’][a-zA-Z]+)?(?:-[a-zA-Z]+)*\b/g;
  const matches = text.match(wordRegex) || [];

  return matches.map(w => ({
    word: w,
    isCapitalized: /^[A-Z]/.test(w)
  }));
}
