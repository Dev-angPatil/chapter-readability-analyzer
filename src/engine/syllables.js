/**
 * High-accuracy English syllable counter and complex-word detector.
 *
 * Implements phonological heuristic rules calibrated against Carnegie Mellon University
 * Pronouncing Dictionary (CMUdict) patterns:
 * - Diphthong/vowel clustering
 * - Silent 'e' suppression (with '-le' syllabic exceptions)
 * - Past-tense '-ed' elision (silent unless preceded by 't' or 'd')
 * - Plural/verb '-es' elision (silent unless preceded by sibilants: s, z, x, ch, sh)
 * - Irregular polysyllabic literary words exception table
 */

// Irregular or common words where standard rules miscount
const IRREGULAR_SYLLABLES = new Map([
  ['simile', 3],
  ['epitome', 4],
  ['hyperbole', 4],
  ['catastrophe', 4],
  ['recipe', 3],
  ['sesquipedalian', 6],
  ['rhythm', 2],
  ['rhythms', 2],
  ['spasm', 2],
  ['chasm', 2],
  ['schism', 2],
  ['queue', 1],
  ['queued', 1],
  ['queues', 1],
  ['queuing', 2],
  ['business', 2],
  ['colonel', 2],
  ['wednesday', 2],
  ['choir', 1],
  ['subtle', 2],
  ['subtly', 2],
  ['area', 3],
  ['idea', 3],
  ['naive', 2],
  ['naïve', 2],
  ['poem', 2],
  ['poetry', 3],
  ['poet', 2],
  ['quiet', 2],
  ['science', 2],
  ['society', 4],
  ['create', 2],
  ['creation', 3],
  ['creative', 3],
  ['oasis', 3],
  ['chaos', 2],
  ['lion', 2],
  ['iron', 2],
  ['fuel', 2],
  ['cruel', 2],
  ['fluid', 2],
  ['ruin', 2],
  ['ruined', 2],
  ['genuine', 3]
]);

/**
 * Counts syllables in an individual English word.
 * @param {string} rawWord 
 * @returns {number} Estimated syllable count (minimum 1 for any word).
 */
export function countSyllables(rawWord) {
  if (!rawWord) return 0;
  
  // Clean word to lowercase alphabetical characters only
  let word = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 2) return 1;

  // Direct irregular lookup
  if (IRREGULAR_SYLLABLES.has(word)) {
    return IRREGULAR_SYLLABLES.get(word);
  }

  let count = 0;
  const len = word.length;

  // Special case: consonants-only with 'm' (rhythm, spasm, etc.)
  if (/^[bcdfghjklmnpqrstvwxz]+m$/.test(word)) {
    return 2;
  }

  // Identify vowel groups (a, e, i, o, u, y)
  // Group adjacent vowels together as initial syllable units
  const vowelGroupRegex = /[aeiouy]+/g;
  const matches = word.match(vowelGroupRegex);
  if (!matches) {
    return 1;
  }

  count = matches.length;

  // Adjustments for English phonological rules:

  // 1. Silent 'e' at end of word (e.g., 'rate', 'time', 'smoke')
  // Unless preceded by 'l' preceded by consonant (e.g. 'table', 'circle', 'candle')
  if (word.endsWith('e') && !word.endsWith('ee') && !word.endsWith('ye')) {
    if (len >= 3 && word.endsWith('le') && !/[aeiouy]le$/.test(word)) {
      // Consonant + 'le' creates a syllabic 'l' (ta-ble, lit-tle), do not subtract
    } else {
      count--;
    }
  }

  // 2. Past tense '-ed' (e.g. 'walked' = 1, 'played' = 1, but 'wanted'/'needed' = 2)
  if (word.endsWith('ed') && len > 4) {
    const charBeforeEd = word[len - 3];
    if (charBeforeEd !== 't' && charBeforeEd !== 'd') {
      // Only deduct if 'e' wasn't already deducted by the silent-e rule
      if (!word.endsWith('eed')) {
        count--;
      }
    }
  }

  // 3. Verb/plural '-es' (e.g. 'miles', 'types' vs 'buses', 'boxes', 'churches')
  if (word.endsWith('es') && len > 4) {
    const stem = word.slice(0, len - 2);
    // '-es' is only voiced if stem ends with s, z, x, ch, sh, dg
    if (!/(s|z|x|ch|sh|dg)$/.test(stem)) {
      count--;
    }
  }

  // 4. Two separate vowel sounds occurring in adjacent vowels that are NOT diphthongs
  // e.g., 'ia' in 'media', 'io' in 'radio', 'iu' in 'stadium', 'eo' in 'video', 'ua' in 'usual'
  const hiatusMatches = word.match(/(ia|io|iu|eo|ua|uo|ui)/g);
  if (hiatusMatches) {
    // Only add if not part of common suffixes like '-tion', '-sion', '-cial', '-tial', '-cious', '-tious'
    if (!/(tion|sion|cial|tial|cious|tious)$/.test(word)) {
      count += hiatusMatches.length;
    }
  }

  // 5. Ending in '-sm' (e.g. 'prism', 'realism', 'criticism')
  if (word.endsWith('sm') && len > 3 && !/[aeiouy]sm$/.test(word)) {
    count++;
  }

  // Always at least 1 syllable for non-empty word
  return Math.max(1, count);
}

/**
 * Determines whether a word is considered 'complex' (>= 3 syllables).
 * In Gunning Fog calculations, proper nouns, compound words, and words that only
 * reach 3 syllables via simple inflections (-ed, -es, -ing) are excluded.
 * 
 * @param {string} word 
 * @param {boolean} [isCapitalized=false] 
 * @returns {boolean}
 */
export function isComplexWord(word, isCapitalized = false) {
  if (isCapitalized) return false; // Exclude proper nouns from Gunning Fog complex words
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length < 5) return false;

  const syllables = countSyllables(clean);
  if (syllables < 3) return false;

  // Check if it reached 3 syllables merely by adding -ing, -ed, or -es to a 2-syllable stem
  if (clean.endsWith('ing') && countSyllables(clean.slice(0, -3)) < 3) {
    return false;
  }
  if (clean.endsWith('ed') && countSyllables(clean.slice(0, -2)) < 3) {
    return false;
  }
  if (clean.endsWith('es') && countSyllables(clean.slice(0, -2)) < 3) {
    return false;
  }

  return true;
}
