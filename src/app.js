/**
 * Application Controller for Chapter Readability Lens.
 * Handles user interactions, real-time metrics dispatch, prose annotation rendering,
 * and inspector jump-to-sentence interactions.
 */

import { analyzeChapterReadability } from './engine/readability.js';
import { rankHardestSentences } from './engine/sentenceRanker.js';
import { SAMPLE_CHAPTERS } from './samples.js';

// DOM Elements
const editorTextarea = document.getElementById('chapterInput');
const btnAnalyze = document.getElementById('btnAnalyze');
const btnClear = document.getElementById('btnClear');
const btnCopyReport = document.getElementById('btnCopyReport');

// Tabs & Views
const tabEditor = document.getElementById('tabEditor');
const tabProse = document.getElementById('tabProse');
const editorWrap = document.getElementById('editorWrap');
const proseWrap = document.getElementById('proseWrap');

// Live Counters
const liveWordCount = document.getElementById('liveWordCount');
const liveSentenceCount = document.getElementById('liveSentenceCount');
const liveCharCount = document.getElementById('liveCharCount');

// Metric Elements
const valReadingEase = document.getElementById('valReadingEase');
const badgeReadingEase = document.getElementById('badgeReadingEase');
const descReadingEase = document.getElementById('descReadingEase');
const valGradeLevel = document.getElementById('valGradeLevel');
const subGradeLevel = document.getElementById('subGradeLevel');
const valGunningFog = document.getElementById('valGunningFog');
const valColemanLiau = document.getElementById('valColemanLiau');
const valReadingTime = document.getElementById('valReadingTime');
const valComplexWords = document.getElementById('valComplexWords');

// Containers
const proseContent = document.getElementById('proseContent');
const sentenceCardList = document.getElementById('sentenceCardList');
const toastEl = document.getElementById('toast');

// Sample Buttons
const sampleBtns = document.querySelectorAll('[data-sample]');

// State
let currentAnalysis = null;
let currentHardest = [];
let activeRank = null;

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('visible');
  setTimeout(() => {
    toastEl.classList.remove('visible');
  }, 2600);
}

function updateLiveCounters() {
  const text = editorTextarea.value;
  const words = (text.match(/\b\w+\b/g) || []).length;
  const chars = text.length;
  // Fast approximate sentence count for live counter
  const approxSentences = (text.match(/[.!?]+(?:\s+|$)/g) || []).length || (text.trim() ? 1 : 0);

  liveWordCount.textContent = words.toLocaleString();
  liveSentenceCount.textContent = approxSentences.toLocaleString();
  liveCharCount.textContent = chars.toLocaleString();
}

function switchView(mode) {
  if (mode === 'editor') {
    tabEditor.classList.add('active');
    tabProse.classList.remove('active');
    editorWrap.style.display = 'block';
    proseWrap.style.display = 'none';
  } else {
    tabEditor.classList.remove('active');
    tabProse.classList.add('active');
    editorWrap.style.display = 'none';
    proseWrap.style.display = 'block';
  }
}

/**
 * Escapes raw HTML to prevent injection while rendering prose.
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Renders prose with the top 5 hardest sentences wrapped in interactive <mark> elements.
 */
function renderAnnotatedProse(text, sentences, hardestSentences) {
  if (!text || !text.trim()) {
    proseContent.innerHTML = `<div class="empty-state"><p>Paste your chapter in the editor and click "Analyze" to see prose highlights.</p></div>`;
    return;
  }

  // Create map of sentence start offset -> hardest item
  const hardMap = new Map();
  hardestSentences.forEach((item) => {
    hardMap.set(item.sentence.start, item);
  });

  // Split into paragraphs preserving paragraph breaks
  const paragraphs = text.split(/\n\s*\n/);
  let globalOffset = 0;
  let html = '';

  paragraphs.forEach((para) => {
    const trimmedPara = para.trim();
    if (!trimmedPara) {
      globalOffset += para.length + 2;
      return;
    }

    const paraStart = text.indexOf(para, globalOffset);
    const paraEnd = paraStart + para.length;
    globalOffset = paraEnd;

    // Find sentences belonging to this paragraph
    const paraSentences = sentences.filter(s => s.start >= paraStart && s.end <= paraEnd);

    if (paraSentences.length === 0) {
      html += `<p>${escapeHtml(trimmedPara)}</p>`;
      return;
    }

    let paraHtml = '';
    let lastIndex = paraStart;

    paraSentences.forEach((s) => {
      // Add text between sentences (e.g. whitespace or punctuation)
      if (s.start > lastIndex) {
        paraHtml += escapeHtml(text.slice(lastIndex, s.start));
      }

      const hardInfo = hardMap.get(s.start);
      if (hardInfo) {
        paraHtml += `<mark class="hard-sentence rank-${hardInfo.rank}" data-rank="${hardInfo.rank}" id="highlight-rank-${hardInfo.rank}" title="Rank #${hardInfo.rank} Hardest Sentence (${hardInfo.wordCount} words, Grade ${hardInfo.sentenceGrade})"><span class="hard-badge badge-rank-${hardInfo.rank}">#${hardInfo.rank}</span>${escapeHtml(s.text)}</mark>`;
      } else {
        paraHtml += escapeHtml(s.text);
      }

      lastIndex = s.end;
    });

    if (lastIndex < paraEnd) {
      paraHtml += escapeHtml(text.slice(lastIndex, paraEnd));
    }

    html += `<p>${paraHtml}</p>`;
  });

  proseContent.innerHTML = html;

  // Add click listeners to highlighted sentences
  proseContent.querySelectorAll('.hard-sentence').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const rank = parseInt(el.getAttribute('data-rank'), 10);
      focusSentence(rank, false);
    });
  });
}

/**
 * Renders the Hardest Sentences Inspector cards in the right sidebar.
 */
function renderInspectorCards(hardestSentences) {
  if (!hardestSentences || hardestSentences.length === 0) {
    sentenceCardList.innerHTML = `<div class="empty-state"><p>No sentences analyzed yet.</p></div>`;
    return;
  }

  sentenceCardList.innerHTML = hardestSentences.map((item) => {
    const complexList = item.complexWords.length > 0
      ? `<div class="sentence-meta"><span class="meta-pill" title="Polysyllabic words: ${item.complexWords.join(', ')}">${item.complexWords.length} complex words</span></div>`
      : '';

    return `
      <div class="sentence-card ${activeRank === item.rank ? 'active' : ''}" data-rank="${item.rank}" id="card-rank-${item.rank}">
        <div class="card-top">
          <div class="card-rank">
            <span class="hard-badge badge-rank-${item.rank}">#${item.rank}</span>
            <span>Hardest Sentence</span>
          </div>
          <div class="card-grade">Grade ${item.sentenceGrade}</div>
        </div>
        <div class="sentence-excerpt">"${escapeHtml(item.sentence.text)}"</div>
        <div class="sentence-meta">
          <span class="meta-pill">${item.wordCount} words</span>
          <span class="meta-pill">${item.syllableCount} syllables</span>
          ${item.complexWords.length > 0 ? `<span class="meta-pill">${item.complexWords.length} complex words</span>` : ''}
        </div>
        <div class="sentence-suggestion">
          <span>💡</span>
          <div>${escapeHtml(item.suggestions[0] || 'High cognitive density sentence.')}</div>
        </div>
      </div>
    `;
  }).join('');

  // Add click listeners to inspector cards
  sentenceCardList.querySelectorAll('.sentence-card').forEach((card) => {
    card.addEventListener('click', () => {
      const rank = parseInt(card.getAttribute('data-rank'), 10);
      focusSentence(rank, true);
    });
  });
}

/**
 * Focuses a specific sentence, syncing the card and the prose highlight.
 */
function focusSentence(rank, shouldScrollToProse = true) {
  activeRank = rank;

  // Update card active classes
  sentenceCardList.querySelectorAll('.sentence-card').forEach((card) => {
    const cardRank = parseInt(card.getAttribute('data-rank'), 10);
    card.classList.toggle('active', cardRank === rank);
  });

  // Ensure card is in view inside inspector
  const activeCard = document.getElementById(`card-rank-${rank}`);
  if (activeCard) {
    activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // If currently in Editor view, auto-switch to Prose view
  switchView('prose');

  // Highlight and scroll to the in-prose mark
  proseContent.querySelectorAll('.hard-sentence').forEach((el) => {
    el.classList.remove('focused', 'pulsing');
  });

  const highlightEl = document.getElementById(`highlight-rank-${rank}`);
  if (highlightEl) {
    highlightEl.classList.add('focused', 'pulsing');
    if (shouldScrollToProse) {
      highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

/**
 * Executes full analysis on the current editor text.
 */
function runAnalysis() {
  const text = editorTextarea.value;
  if (!text.trim()) {
    showToast('Please paste a chapter before analyzing.');
    return;
  }

  currentAnalysis = analyzeChapterReadability(text);
  currentHardest = rankHardestSentences(currentAnalysis.sentences, 5);

  // Update Scorecards
  valReadingEase.textContent = currentAnalysis.readingEase;
  badgeReadingEase.textContent = currentAnalysis.readingEaseInterpretation.band;
  badgeReadingEase.style.backgroundColor = `${currentAnalysis.readingEaseInterpretation.color}20`;
  badgeReadingEase.style.color = currentAnalysis.readingEaseInterpretation.color;
  descReadingEase.textContent = currentAnalysis.readingEaseInterpretation.description;

  valGradeLevel.textContent = currentAnalysis.gradeLevel;
  subGradeLevel.textContent = `Equivalent to ~Grade ${Math.round(currentAnalysis.gradeLevel)} reading material`;

  valGunningFog.textContent = currentAnalysis.gunningFog;
  valColemanLiau.textContent = currentAnalysis.colemanLiau;
  valReadingTime.textContent = `${currentAnalysis.readingTimeMinutes} min`;
  valComplexWords.textContent = `${currentAnalysis.complexWordCount.toLocaleString()} (${Math.round((currentAnalysis.complexWordCount / currentAnalysis.wordCount) * 100)}%)`;

  // Render prose and inspector
  renderAnnotatedProse(text, currentAnalysis.sentences, currentHardest);
  renderInspectorCards(currentHardest);

  showToast(`Analyzed ${currentAnalysis.wordCount.toLocaleString()} words & ${currentAnalysis.sentenceCount} sentences!`);
}

// Copy Summary
function copyReadabilityReport() {
  if (!currentAnalysis) {
    showToast('Run analysis first to generate a report.');
    return;
  }

  const hardestSummary = currentHardest.map(h => 
    `  ${h.rank}. [Grade ${h.sentenceGrade} | ${h.wordCount} words]: "${h.sentence.text.slice(0, 90)}..."\n     Tip: ${h.suggestions[0]}`
  ).join('\n\n');

  const report = `# Chapter Readability Report
- Flesch Reading Ease: ${currentAnalysis.readingEase} (${currentAnalysis.readingEaseInterpretation.band})
- Flesch-Kincaid Grade Level: ${currentAnalysis.gradeLevel}
- Gunning Fog Index: ${currentAnalysis.gunningFog}
- Coleman-Liau Index: ${currentAnalysis.colemanLiau}
- Total Words: ${currentAnalysis.wordCount}
- Total Sentences: ${currentAnalysis.sentenceCount}
- Estimated Reading Time: ${currentAnalysis.readingTimeMinutes} min

## Top 5 Hardest Sentences:
${hardestSummary}

Generated with Chapter Readability Lens.`;

  navigator.clipboard.writeText(report).then(() => {
    showToast('Readability summary copied to clipboard!');
  }).catch(() => {
    showToast('Failed to copy to clipboard.');
  });
}

// Event Listeners
editorTextarea.addEventListener('input', updateLiveCounters);

btnAnalyze.addEventListener('click', () => {
  runAnalysis();
  switchView('prose');
});

btnClear.addEventListener('click', () => {
  editorTextarea.value = '';
  updateLiveCounters();
  proseContent.innerHTML = `<div class="empty-state"><p>Paste your chapter in the editor and click "Analyze".</p></div>`;
  sentenceCardList.innerHTML = `<div class="empty-state"><p>No sentences analyzed yet.</p></div>`;
  valReadingEase.textContent = '--';
  valGradeLevel.textContent = '--';
  valGunningFog.textContent = '--';
  valColemanLiau.textContent = '--';
  valReadingTime.textContent = '--';
  valComplexWords.textContent = '--';
  badgeReadingEase.textContent = 'Pending';
  badgeReadingEase.style.backgroundColor = 'var(--color-surface-raised)';
  badgeReadingEase.style.color = 'var(--color-text-secondary)';
  descReadingEase.textContent = 'Awaiting chapter text';
  subGradeLevel.textContent = 'Awaiting chapter text';
  showToast('Editor cleared.');
});

btnCopyReport.addEventListener('click', copyReadabilityReport);

tabEditor.addEventListener('click', () => switchView('editor'));
tabProse.addEventListener('click', () => switchView('prose'));

// Load sample chapters
sampleBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const sampleKey = btn.getAttribute('data-sample');
    const sample = SAMPLE_CHAPTERS[sampleKey];
    if (sample) {
      editorTextarea.value = sample.text;
      updateLiveCounters();
      runAnalysis();
      switchView('prose');
      showToast(`Loaded sample: ${sample.title}`);
    }
  });
});

// Initialize with Charles Dickens sample by default
window.addEventListener('DOMContentLoaded', () => {
  const defaultSample = SAMPLE_CHAPTERS.dickens;
  editorTextarea.value = defaultSample.text;
  updateLiveCounters();
  runAnalysis();
  switchView('prose');
});
