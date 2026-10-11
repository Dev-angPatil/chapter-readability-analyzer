/**
 * Comprehensive Readability Metrics Calculator.
 *
 * Implements standard, empirically verified readability formulas:
 * - Flesch Reading Ease
 * - Flesch-Kincaid Grade Level
 * - Gunning Fog Index
 * - Coleman-Liau Index
 * - Automated Readability Index (ARI)
 */

import { countSyllables, isComplexWord } from './syllables.js';
import { extractWords, tokenizeSentences } from './tokenizer.js';

/**
 * Returns qualitative band, description, and status color for Flesch Reading Ease.
 * @param {number} score 
 */
export function interpretFleschReadingEase(score) {
  if (score >= 90) {
    return {
      band: 'Very Easy',
      description: 'Conversational & breezy. Understandable by an average 11-year-old.',
      color: '#16A34A',
      gradeEquivalent: '5th Grade'
    };
  }
  if (score >= 80) {
    return {
      band: 'Easy',
      description: 'Casual, conversational prose. Simple sentence structures.',
      color: '#22C55E',
      gradeEquivalent: '6th Grade'
    };
  }
  if (score >= 70) {
    return {
      band: 'Fairly Easy',
      description: 'Accessible narrative prose. Ideal for broad consumer fiction.',
      color: '#84CC16',
      gradeEquivalent: '7th Grade'
    };
  }
  if (score >= 60) {
    return {
      band: 'Standard (Plain English)',
      description: 'Optimal balance of clarity and depth. Standard bestseller prose.',
      color: '#EAB308',
      gradeEquivalent: '8th - 9th Grade'
    };
  }
  if (score >= 50) {
    return {
      band: 'Fairly Difficult',
      description: 'More intricate sentences with descriptive vocabulary.',
      color: '#F97316',
      gradeEquivalent: '10th - 12th Grade'
    };
  }
  if (score >= 30) {
    return {
      band: 'Difficult',
      description: 'Dense literary or technical prose. Demands careful attention.',
      color: '#EA580C',
      gradeEquivalent: 'College Undergraduate'
    };
  }
  return {
    band: 'Very Confusing / Academic',
    description: 'Extremely dense or academic prose. Complex clauses and polysyllabic jargon.',
    color: '#DC2626',
    gradeEquivalent: 'College Graduate / Specialist'
  };
}

/**
 * Computes all readability metrics for a given chapter text.
 * @param {string} text 
 */
export function analyzeChapterReadability(text) {
  if (!text || !text.trim()) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      syllableCount: 0,
      complexWordCount: 0,
      characterCount: 0,
      letterCount: 0,
      readingTimeMinutes: 0,
      readingEase: 0,
      readingEaseInterpretation: interpretFleschReadingEase(0),
      gradeLevel: 0,
      gunningFog: 0,
      colemanLiau: 0,
      ari: 0,
      sentences: [],
      wordsPerSentence: 0,
      syllablesPerWord: 0
    };
  }

  const sentences = tokenizeSentences(text);
  const wordsTokens = extractWords(text);

  const totalSentences = Math.max(1, sentences.length);
  const totalWords = Math.max(1, wordsTokens.length);

  let totalSyllables = 0;
  let complexWordsCount = 0;
  let totalLetters = 0;

  wordsTokens.forEach(({ word, isCapitalized }) => {
    const syl = countSyllables(word);
    totalSyllables += syl;
    if (isComplexWord(word, isCapitalized)) {
      complexWordsCount++;
    }
    const lettersOnly = word.replace(/[^a-zA-Z]/g, '');
    totalLetters += lettersOnly.length;
  });

  const rawChars = text.replace(/\s/g, '').length;

  const wordsPerSentence = totalWords / totalSentences;
  const syllablesPerWord = totalSyllables / totalWords;

  // 1. Flesch Reading Ease Formula
  // 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
  const rawReadingEase = 206.835 - (1.015 * wordsPerSentence) - (84.6 * syllablesPerWord);
  const readingEase = Math.round(Math.min(100, Math.max(0, rawReadingEase)) * 10) / 10;

  // 2. Flesch-Kincaid Grade Level Formula
  // 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  const rawGradeLevel = (0.39 * wordsPerSentence) + (11.8 * syllablesPerWord) - 15.59;
  const gradeLevel = Math.round(Math.max(0, rawGradeLevel) * 10) / 10;

  // 3. Gunning Fog Index Formula
  // 0.4 * ((words / sentences) + 100 * (complexWords / words))
  const percentComplex = (complexWordsCount / totalWords) * 100;
  const rawGunningFog = 0.4 * (wordsPerSentence + percentComplex);
  const gunningFog = Math.round(Math.max(0, rawGunningFog) * 10) / 10;

  // 4. Coleman-Liau Index Formula
  // 0.0588 * L - 0.296 * S - 15.8 (L = letters per 100 words, S = sentences per 100 words)
  const L = (totalLetters / totalWords) * 100;
  const S = (totalSentences / totalWords) * 100;
  const rawColemanLiau = (0.0588 * L) - (0.296 * S) - 15.8;
  const colemanLiau = Math.round(Math.max(0, rawColemanLiau) * 10) / 10;

  // 5. Automated Readability Index (ARI)
  // 4.71 * (characters / words) + 0.5 * (words / sentences) - 21.43
  const rawARI = (4.71 * (rawChars / totalWords)) + (0.5 * wordsPerSentence) - 21.43;
  const ari = Math.round(Math.max(0, rawARI) * 10) / 10;

  // 6. Reading Time (based on standard silent reading rate: 220 words/minute)
  const readingTimeMinutes = Math.max(1, Math.ceil(totalWords / 220));

  return {
    wordCount: totalWords,
    sentenceCount: totalSentences,
    syllableCount: totalSyllables,
    complexWordCount: complexWordsCount,
    characterCount: rawChars,
    letterCount: totalLetters,
    readingTimeMinutes,
    readingEase,
    readingEaseInterpretation: interpretFleschReadingEase(readingEase),
    gradeLevel,
    gunningFog,
    colemanLiau,
    ari,
    sentences,
    wordsPerSentence: Math.round(wordsPerSentence * 10) / 10,
    syllablesPerWord: Math.round(syllablesPerWord * 100) / 100
  };
}
