/**
 * Sentence Difficulty Ranker and Diagnosis Engine.
 *
 * Evaluates every sentence within a chapter to isolate the Top 5 Hardest Sentences,
 * diagnosing syntactic density, syllable load, and actionable author revisions.
 */

import { countSyllables, isComplexWord } from './syllables.js';
import { extractWords } from './tokenizer.js';

/**
 * Analyzes and ranks all sentences in the chapter, returning the top 5 most difficult.
 *
 * @param {Array<{index: number, text: string, raw: string, start: number, end: number}>} sentences 
 * @returns {Array<SentenceDifficultyReport>}
 */
export function rankHardestSentences(sentences, limit = 5) {
  if (!sentences || sentences.length === 0) return [];

  const evaluated = sentences.map((sentence) => {
    const wordTokens = extractWords(sentence.text);
    const wordCount = wordTokens.length;

    if (wordCount === 0) {
      return {
        sentence,
        wordCount: 0,
        syllableCount: 0,
        complexWords: [],
        sentenceGrade: 0,
        difficultyScore: 0,
        diagnosis: 'Empty sentence.',
        suggestions: []
      };
    }

    let syllableCount = 0;
    const complexWords = [];

    wordTokens.forEach(({ word, isCapitalized }) => {
      const syl = countSyllables(word);
      syllableCount += syl;
      if (isComplexWord(word, isCapitalized)) {
        complexWords.push(word);
      }
    });

    const syllablesPerWord = syllableCount / wordCount;

    // Sentence-level Flesch-Kincaid Grade Level
    const sentenceGrade = Math.max(0, (0.39 * wordCount) + (11.8 * syllablesPerWord) - 15.59);

    // Composite Difficulty Score:
    // Combines raw sentence length, grade level, and complex word density
    const lengthPenalty = wordCount > 25 ? (wordCount - 25) * 1.5 : 0;
    const complexPenalty = complexWords.length * 3.0;
    const difficultyScore = sentenceGrade + lengthPenalty + complexPenalty;

    // Diagnostic recommendations for authors
    const suggestions = [];
    if (wordCount >= 35) {
      suggestions.push(`High length fatigue: ${wordCount} words. Consider breaking at a natural conjunction or semicolon.`);
    } else if (wordCount >= 25) {
      suggestions.push(`Moderately long (${wordCount} words). Review whether clause nesting can be tightened.`);
    }

    if (complexWords.length >= 3) {
      suggestions.push(`High syllable density: ${complexWords.length} complex words (${complexWords.slice(0, 3).join(', ')}...). Substitute with punchier alternatives.`);
    }

    if (sentence.text.includes(';') || (sentence.text.match(/,/g) || []).length >= 4) {
      suggestions.push('Multiple nested clauses detected. Bring the subject and primary verb closer together.');
    }

    if (suggestions.length === 0) {
      suggestions.push('Moderately elevated vocabulary or length compared to surrounding sentences.');
    }

    return {
      sentence,
      wordCount,
      syllableCount,
      complexWords: [...new Set(complexWords)],
      sentenceGrade: Math.round(sentenceGrade * 10) / 10,
      difficultyScore: Math.round(difficultyScore * 10) / 10,
      suggestions
    };
  });

  // Sort descending by difficulty score
  evaluated.sort((a, b) => b.difficultyScore - a.difficultyScore);

  // Return the top N hardest sentences, decorated with their 1-based rank (1 = hardest)
  return evaluated.slice(0, limit).map((item, index) => ({
    rank: index + 1,
    ...item
  }));
}
