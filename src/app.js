/**
 * Application Controller for Chapter Readability Lens.
 * Handles state transitions:
 * 1. State 1: Blank tactile Notebook for chapter drafting / pasting.
 * 2. State 2: Multi-phase Analyzing loading animation.
 * 3. State 3: Complete Feedback Dashboard with scorecards, annotated prose, and inspector.
 */

import { analyzeChapterReadability } from './engine/readability.js';
import { rankHardestSentences } from './engine/sentenceRanker.js';
import { SAMPLE_CHAPTERS } from './samples.js';

// DOM Views
const viewNotebook = document.getElementById('viewNotebook');
const viewAnalyzing = document.getElementById('viewAnalyzing');
const viewResults = document.getElementById('viewResults');

// Header Navigation
const brandHome = document.getElementById('brandHome');
const btnReturnNotebook = document.getElementById('btnReturnNotebook');
const btnCopyReport = document.getElementById('btnCopyReport');

// Notebook View Elements
const notebookInput = document.getElementById('chapterInput');
const btnAnalyzeNotebook = document.getElementById('btnAnalyzeNotebook');
const btnClearNotebook = document.getElementById('btnClearNotebook');
const liveWordCount = document.getElementById('liveWordCount');
const liveCharCount = document.getElementById('liveCharCount');

// Analyzing Animation Elements
const analyzingStatusText = document.getElementById('analyzingStatusText');
const analyzingProgressFill = document.getElementById('analyzingProgressFill');
const stepChip1 = document.getElementById('stepChip1');
const stepChip2 = document.getElementById('stepChip2');
const stepChip3 = document.getElementById('stepChip3');

// Results View Elements
const resultsWordCount = document.getElementById('resultsWordCount');
const resultsSentenceCount = document.getElementById('resultsSentenceCount');
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
let isAnalyzing = false;

function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('visible');
  setTimeout(() => {
    toastEl.classList.remove('visible');
  }, 2600);
}

function updateLiveCounters() {
  const text = notebookInput.value || '';
  const words = (text.match(/\b\w+\b/g) || []).length;
  const chars = text.length;

  liveWordCount.textContent = words.toLocaleString();
  liveCharCount.textContent = chars.toLocaleString();
}

/**
 * Transitions between views: 'notebook' | 'analyzing' | 'results'
 */
function switchView(mode) {
  if (mode === 'notebook') {
    viewNotebook.style.display = 'block';
    viewAnalyzing.style.display = 'none';
    viewResults.style.display = 'none';
    btnReturnNotebook.style.display = 'none';
    btnCopyReport.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (mode === 'analyzing') {
    viewNotebook.style.display = 'none';
    viewAnalyzing.style.display = 'block';
    viewResults.style.display = 'none';
    btnReturnNotebook.style.display = 'none';
    btnCopyReport.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (mode === 'results') {
    viewNotebook.style.display = 'none';
    viewAnalyzing.style.display = 'none';
    viewResults.style.display = 'grid';
    btnReturnNotebook.style.display = 'inline-flex';
    btnCopyReport.style.display = 'inline-flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Triggers the staged analyzing loading animation, then reveals the results dashboard.
 */
function startAnalysisWorkflow(text) {
  if (!text || !text.trim()) {
    showToast('Please paste a chapter before analyzing.');
    return;
  }

  if (isAnalyzing) return;
  isAnalyzing = true;

  switchView('analyzing');

  // Step 1: Tokenizing
  analyzingStatusText.textContent = 'Scanning sentence boundaries & preserving dialogue...';
  analyzingProgressFill.style.width = '30%';
  stepChip1.className = 'step-chip active';
  stepChip2.className = 'step-chip';
  stepChip3.className = 'step-chip';

  // Step 2: Syllable cadence & readability math
  setTimeout(() => {
    analyzingStatusText.textContent = 'Calculating syllable cadence & Flesch-Kincaid indices...';
    analyzingProgressFill.style.width = '65%';
    stepChip1.className = 'step-chip done';
    stepChip2.className = 'step-chip active';
  }, 350);

  // Step 3: Hardest sentences isolation
  setTimeout(() => {
    analyzingStatusText.textContent = 'Isolating the 5 hardest sentences & formatting highlights...';
    analyzingProgressFill.style.width = '95%';
    stepChip2.className = 'step-chip done';
    stepChip3.className = 'step-chip active';
  }, 700);

  // Step 4: Finalize & render complete UI
  setTimeout(() => {
    analyzingProgressFill.style.width = '100%';
    stepChip3.className = 'step-chip done';

    // Run client-side analysis in memory
    currentAnalysis = analyzeChapterReadability(text);
    currentHardest = rankHardestSentences(currentAnalysis.sentences, 5);

    populateResults(currentAnalysis, currentHardest, text);
    switchView('results');
    isAnalyzing = false;
    showToast(`Analyzed ${currentAnalysis.wordCount.toLocaleString()} words & ${currentAnalysis.sentenceCount} sentences!`);
  }, 1000);
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
    proseContent.innerHTML = `<div class="empty-state"><p>Paste your chapter in the notebook to see prose highlights.</p></div>`;
    return;
  }

  const hardMap = new Map();
  hardestSentences.forEach((item) => {
    hardMap.set(item.sentence.start, item);
  });

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

    const paraSentences = sentences.filter(s => s.start >= paraStart && s.end <= paraEnd);

    if (paraSentences.length === 0) {
      html += `<p>${escapeHtml(trimmedPara)}</p>`;
      return;
    }

    let paraHtml = '';
    let lastIndex = paraStart;

    paraSentences.forEach((s) => {
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
    sentenceCardList.innerHTML = `<div class="empty-state"><p>No complex sentences detected.</p></div>`;
    return;
  }

  sentenceCardList.innerHTML = hardestSentences.map((item) => {
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

  sentenceCardList.querySelectorAll('.sentence-card').forEach((card) => {
    const cardRank = parseInt(card.getAttribute('data-rank'), 10);
    card.classList.toggle('active', cardRank === rank);
  });

  const activeCard = document.getElementById(`card-rank-${rank}`);
  if (activeCard) {
    activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

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
 * Populates metric scorecards and results views with computed data.
 */
function populateResults(analysis, hardest, text) {
  valReadingEase.textContent = analysis.readingEase;
  badgeReadingEase.textContent = analysis.readingEaseInterpretation.band;
  badgeReadingEase.style.backgroundColor = `${analysis.readingEaseInterpretation.color}20`;
  badgeReadingEase.style.color = analysis.readingEaseInterpretation.color;
  descReadingEase.textContent = analysis.readingEaseInterpretation.description;

  valGradeLevel.textContent = analysis.gradeLevel;
  subGradeLevel.textContent = `Equivalent to ~Grade ${Math.round(analysis.gradeLevel)} reading material`;

  valGunningFog.textContent = analysis.gunningFog;
  valColemanLiau.textContent = analysis.colemanLiau;
  valReadingTime.textContent = `${analysis.readingTimeMinutes} min`;
  valComplexWords.textContent = `${analysis.complexWordCount.toLocaleString()} (${Math.round((analysis.complexWordCount / analysis.wordCount) * 100)}%)`;

  resultsWordCount.textContent = analysis.wordCount.toLocaleString();
  resultsSentenceCount.textContent = analysis.sentenceCount.toLocaleString();

  renderAnnotatedProse(text, analysis.sentences, hardest);
  renderInspectorCards(hardest);
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

// 1. Live text counters
notebookInput.addEventListener('input', updateLiveCounters);

// 2. PASTE EVENT: Automatically trigger the analyzing loading animation on paste!
notebookInput.addEventListener('paste', (e) => {
  // Allow the paste action to populate the textarea, then initiate analysis
  setTimeout(() => {
    updateLiveCounters();
    const text = notebookInput.value;
    if (text && text.trim().length > 10) {
      startAnalysisWorkflow(text);
    }
  }, 60);
});

// 3. Analyze button click
btnAnalyzeNotebook.addEventListener('click', () => {
  startAnalysisWorkflow(notebookInput.value);
});

// 4. Clear button
btnClearNotebook.addEventListener('click', () => {
  notebookInput.value = '';
  updateLiveCounters();
  showToast('Notebook cleared.');
});

// 5. Return to notebook / Edit
btnReturnNotebook.addEventListener('click', () => {
  switchView('notebook');
});

brandHome.addEventListener('click', () => {
  switchView('notebook');
});

// 6. Copy Report button
btnCopyReport.addEventListener('click', copyReadabilityReport);

// 7. Sample chapters pre-loaders
sampleBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const sampleKey = btn.getAttribute('data-sample');
    const sample = SAMPLE_CHAPTERS[sampleKey];
    if (sample) {
      notebookInput.value = sample.text;
      updateLiveCounters();
      showToast(`Loaded sample: ${sample.title}`);
      startAnalysisWorkflow(sample.text);
    }
  });
});

// Initial Page Load: Blank tactile notebook state (no pre-loaded text)
window.addEventListener('DOMContentLoaded', () => {
  switchView('notebook');
  updateLiveCounters();
});

