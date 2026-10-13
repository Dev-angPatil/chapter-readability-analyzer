# Chapter Readability Lens

> **Free, High-Accuracy Book Chapter Readability & 5 Hardest Sentences Analyzer**  
> Designed for authors, editors, and novelists to diagnose cognitive friction, calibrate pacing, and isolate sprawling sentences in literary prose.

---

## 🌟 Features

- **Blank Tactile Notebook UI**: Opens as a distraction-free, warm manuscript notebook with binding stitch details and clean ruled lines. Zero empty metric clutter on load.
- **Paste-Triggered Analyzing Animation**: Simply pasting text immediately initiates an editorial scanning animation ("Tokenizing dialogue...", "Calculating syllable cadence...", "Isolating 5 hardest sentences...").
- **Accurate Literary Tokenization**: Protects against false sentence splitting on dialogue attributions (`"Wait!" cried Watson.` = 1 sentence), abbreviations (`Dr. Jekyll`, `Mr. Darcy`), ellipses (`...`), and decimals (`3.14`).
- **Comprehensive Readability Suite**:
  - **Flesch Reading Ease**: Scaled 0–100 with qualitative band interpretation (Very Easy, Standard, Difficult, Academic).
  - **Flesch-Kincaid Grade Level**: Precise US school grade equivalent.
  - **Gunning Fog Index**: Years of formal education needed to comprehend the text.
  - **Coleman-Liau Index**: Character/word-based formula completely immune to syllable counting discrepancies.
  - **Automated Readability Index (ARI)** & **Reading Time** (at 220 words/minute).
- **Interactive Top 5 Hardest Sentences**:
  - Automatically isolates and highlights the 5 most cognitively taxing sentences directly in the chapter prose with ranked badges (`#1` through `#5`).
  - An interactive **Inspector Sidebar** breaks down word count, syllable load, complex words, and actionable editorial recommendations (e.g., splitting compound clauses).
  - **1-Click Jump**: Click any card in the inspector to smoothly scroll and highlight the sentence in the text with a visual pulse glow.
  - **1-Click Return**: "← Return to Notebook" button to edit your chapter or paste a new one anytime.
- **Literary Benchmark Pre-loaders**: Instant 1-click loaders for Charles Dickens (*A Tale of Two Cities*), Ernest Hemingway (*The Old Man and the Sea*), and Jane Austen (*Pride and Prejudice*).
- **100% Client-Side Privacy**: Operates entirely in the user's browser with zero backend data transmission.
- **Ember Studio Design System**: Clean terracotta warmth (`#C2410C`), amber accents, and editorial typography (`Playfair Display` + `Source Sans 3`).

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js (v18+) or any static HTTP server (Python 3, Nginx, or `npx serve`).

### 1. Clone the repository
```bash
git clone https://github.com/Dev-angPatil/chapter-readability-analyzer.git
cd chapter-readability-analyzer
```

### 2. Run Automated Unit Tests
```bash
npm test
# Or natively with Node test runner:
node --test tests/readability.test.js
```

### 3. Run Locally
You can serve the directory with any static server:
```bash
# Using Python:
python3 -m http.server 4173

# Or using npx:
npx serve .
```
Open [http://localhost:4173](http://localhost:4173) in your browser.

---

## 🌐 Free Hosting & Deployment Guide

This project is a 100% static client-side web application requiring **zero server configuration or backend costs**.

### Option A: GitHub Pages (Recommended - 1-Click)
1. Push this repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "feat: initial chapter readability analyzer"
   git remote add origin https://github.com/Dev-angPatil/chapter-readability-analyzer.git
   git push -u origin main
   ```
2. In your GitHub repository, navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Branch**, select `main` and `/ (root)`.
4. Click **Save**. Within 60 seconds, your tool is live at:  
   `https://<your-username>.github.io/chapter-readability-analyzer/`

### Option B: Vercel (Instant Zero-Config)
```bash
npx vercel deploy --prod
```
Or import the GitHub repo into [vercel.com](https://vercel.com) for automatic SSL and preview deploys.

### Option C: Netlify
Drag and drop this project folder into [app.netlify.com/drop](https://app.netlify.com/drop) or link the GitHub repo.

---

## 🤖 AI Tools Used & Where They Got It Wrong

### AI Tools Utilized:
1. **Google Antigravity Agent**: Autonomous pair-programming agent orchestrating project scaffolding, architecture planning, and continuous verification.
2. **Gemini 3.8 Flash (High)**: Deep reasoning engine driving algorithm design, CMUdict phonological heuristics, and test suite synthesis.
3. **DesignMD MCP Server (`designmd.ai`)**: Curated design system search and token integration using the `Ember Studio` palette.
4. **GitHub MCP Server**: Repository and branch management.

### Critical Failure Mode: Where AI Tools Got It Wrong
When prompted to build readability tools, LLMs consistently propose naive standard patterns that fail in real-world literature:

1. **Dialogue Sentence Fragmentation**:
   - **AI Default**: AI models invariably write `text.split(/[.!?]+/)` or invoke standard sentence segmenters.
   - **The Bug**: In fiction, dialogue quotes like `"I don't think so!" he shouted.` get split into `"I don't think so` and `he shouted.`, falsely doubling the sentence count and artificially lowering the average sentence length ($W/S$). This erroneously inflates Flesch Reading Ease scores, making difficult prose appear deceptively easy.
   - **Our Fix**: Built a custom look-ahead tokenizer in [`tokenizer.js`](file:///home/deu/Coding Repos/chapter-readability-analyzer/src/engine/tokenizer.js) that detects closing quotes followed by lowercase speech attribution tags (`said`, `whispered`, `cried`, `replied`, pronouns) and retains them as a single grammatical sentence unit.

2. **Syllable Counting Hallucination**:
   - **AI Default**: AI generators frequently output trivial vowel-cluster regexes like `word.match(/[aeiouy]{1,2}/g).length` with a rudimentary `if (word.endsWith('e')) count--`.
   - **The Bug**: This severely miscounts words like `"table"` (counted as 1 instead of 2 because trailing 'e' is dropped despite the syllabic consonant 'le'), `"walked"` (counted as 2 instead of 1 because silent '-ed' is not elided), and irregular words like `"rhythm"` (counted as 0 or 1 despite having 2 distinct syllables).
   - **Our Fix**: Implemented comprehensive phonological rules in [`syllables.js`](file:///home/deu/Coding Repos/chapter-readability-analyzer/src/engine/syllables.js) incorporating consonant+'-le' exceptions, voiced vs. voiceless past-tense '-ed' elision, and an irregular lookup table calibrated against CMUdict standards.

---

## 📄 License
MIT License. Created by Devang Patil.
