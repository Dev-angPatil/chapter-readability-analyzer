import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { countSyllables, isComplexWord } from '../src/engine/syllables.js';
import { tokenizeSentences, extractWords } from '../src/engine/tokenizer.js';
import { analyzeChapterReadability, interpretFleschReadingEase } from '../src/engine/readability.js';
import { rankHardestSentences } from '../src/engine/sentenceRanker.js';

describe('Syllable Counter', () => {
  it('correctly handles silent "e"', () => {
    assert.equal(countSyllables('make'), 1);
    assert.equal(countSyllables('bone'), 1);
    assert.equal(countSyllables('stride'), 1);
    assert.equal(countSyllables('time'), 1);
  });

  it('correctly handles consonant + "le" endings', () => {
    assert.equal(countSyllables('table'), 2);
    assert.equal(countSyllables('bottle'), 2);
    assert.equal(countSyllables('simple'), 2);
    assert.equal(countSyllables('little'), 2);
  });

  it('correctly handles past tense "-ed"', () => {
    assert.equal(countSyllables('walked'), 1);
    assert.equal(countSyllables('played'), 1);
    assert.equal(countSyllables('jumped'), 1);
    assert.equal(countSyllables('wanted'), 2);
    assert.equal(countSyllables('needed'), 2);
  });

  it('correctly handles irregular literary words', () => {
    assert.equal(countSyllables('rhythm'), 2);
    assert.equal(countSyllables('queue'), 1);
    assert.equal(countSyllables('business'), 2);
    assert.equal(countSyllables('choir'), 1);
    assert.equal(countSyllables('subtle'), 2);
    assert.equal(countSyllables('sesquipedalian'), 6);
  });

  it('flags complex words (> = 3 syllables) appropriately', () => {
    assert.equal(isComplexWord('cat'), false);
    assert.equal(isComplexWord('simple'), false);
    assert.equal(isComplexWord('complicated'), true);
    assert.equal(isComplexWord('extraordinary'), true);
    assert.equal(isComplexWord('Washington', true), false); // Exclude proper noun
  });
});

describe('Sentence Tokenizer', () => {
  it('does NOT split dialogue quotes followed by speech attribution', () => {
    const text = '"I cannot agree!" said Dr. Watson. He picked up his hat.';
    const sentences = tokenizeSentences(text);
    assert.equal(sentences.length, 2);
    assert.equal(sentences[0].text, '"I cannot agree!" said Dr. Watson.');
    assert.equal(sentences[1].text, 'He picked up his hat.');
  });

  it('protects honorific abbreviations from splitting', () => {
    const text = 'Mr. Darcy met Mrs. Bennett at the ball. Dr. Jekyll was absent.';
    const sentences = tokenizeSentences(text);
    assert.equal(sentences.length, 2);
    assert.equal(sentences[0].text, 'Mr. Darcy met Mrs. Bennett at the ball.');
    assert.equal(sentences[1].text, 'Dr. Jekyll was absent.');
  });

  it('protects decimals and ellipses from splitting', () => {
    const text = 'The speed was 3.14 miles per hour. He waited... and waited.';
    const sentences = tokenizeSentences(text);
    assert.equal(sentences.length, 2);
    assert.equal(sentences[0].text, 'The speed was 3.14 miles per hour.');
    assert.equal(sentences[1].text, 'He waited... and waited.');
  });

  it('returns exact character offsets for highlighting', () => {
    const text = 'First sentence. Second sentence.';
    const sentences = tokenizeSentences(text);
    assert.equal(sentences.length, 2);
    assert.equal(text.slice(sentences[0].start, sentences[0].end), 'First sentence.');
    assert.equal(text.slice(sentences[1].start, sentences[1].end), 'Second sentence.');
  });
});

describe('Readability Analysis', () => {
  it('correctly calculates Flesch Reading Ease and Grade Level', () => {
    // Sample test sentence: "The quick brown fox jumps over the lazy dog."
    // 9 words, 1 sentence, 11 syllables ("quick"(1) "brown"(1) "fox"(1) "jumps"(1) "o-ver"(2) "the"(1) "la-zy"(2) "dog"(1))
    const text = 'The quick brown fox jumps over the lazy dog.';
    const result = analyzeChapterReadability(text);

    assert.equal(result.wordCount, 9);
    assert.equal(result.sentenceCount, 1);
    assert.ok(result.readingEase > 80, `Expected ease > 80, got ${result.readingEase}`);
    assert.ok(result.gradeLevel < 5, `Expected grade < 5, got ${result.gradeLevel}`);
  });

  it('interprets Flesch scores into meaningful bands', () => {
    assert.equal(interpretFleschReadingEase(95).band, 'Very Easy');
    assert.equal(interpretFleschReadingEase(65).band, 'Standard (Plain English)');
    assert.equal(interpretFleschReadingEase(20).band, 'Very Confusing / Academic');
  });
});

describe('Hardest Sentences Ranker', () => {
  it('ranks and identifies the top hardest sentences', () => {
    const sample = `
      The cat sat on the mat.
      The boy ran.
      The extraordinary incomprehensibility of this philosophical epistemological treatise confounded every venerable academician in the university.
      She smiled gently.
      He closed the heavy oak door.
      A sudden reverberation echoed through the labyrinthine subterranean corridors, alarming the precarious expedition members.
    `;
    const analysis = analyzeChapterReadability(sample);
    const hardest = rankHardestSentences(analysis.sentences, 5);

    assert.equal(hardest.length, 5);
    assert.equal(hardest[0].rank, 1);
    // The longest / most complex sentence should be ranked #1
    assert.ok(
      hardest[0].sentence.text.includes('philosophical') ||
      hardest[0].sentence.text.includes('labyrinthine')
    );
    assert.ok(hardest[0].wordCount > 10);
    assert.ok(hardest[0].suggestions.length > 0);
  });
});
