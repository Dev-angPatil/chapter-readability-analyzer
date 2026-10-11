# Internship Application Submission: Chapter Readability Lens

**Candidate Name:** Devang Patil  
**Project Name:** Chapter Readability Lens  
**Repository:** [https://github.com/Dev-angPatil/chapter-readability-analyzer](https://github.com/Dev-angPatil/chapter-readability-analyzer)  
**Live URL (GitHub Pages):** [https://dev-angpatil.github.io/chapter-readability-analyzer/](https://dev-angpatil.github.io/chapter-readability-analyzer/)  

---

## 1. Live Link & Quick Demo

- **Live URL**: [https://dev-angpatil.github.io/chapter-readability-analyzer/](https://dev-angpatil.github.io/chapter-readability-analyzer/)
- **Repository**: [https://github.com/Dev-angPatil/chapter-readability-analyzer](https://github.com/Dev-angPatil/chapter-readability-analyzer)

### How It Works:
1. Paste any book chapter into the editor or click one of the quick benchmark presets:
   - **Dickens** (*A Tale of Two Cities* — Victorian multi-clause dense prose, Grade ~12+)
   - **Hemingway** (*The Old Man and the Sea* — Crisp, punchy, accessible prose, Grade ~4)
   - **Austen** (*Pride and Prejudice* — Balanced narrative irony and dialogue, Grade ~8)
2. View instant, accurate readability scorecards:
   - **Flesch Reading Ease** (with qualitative interpretation from *Very Easy* to *Academic*)
   - **Flesch-Kincaid Grade Level** (US school grade equivalent)
   - **Gunning Fog Index** (formal education years)
   - **Coleman-Liau Index** (pure character/word formula immune to syllable variance)
   - **Estimated Reading Time** (based on 220 words/min)
3. Examine the **Top 5 Hardest Sentences**:
   - Highlighted directly inside the chapter prose with distinct ranked badges (`#1` through `#5`).
   - Inspected in the sidebar with word counts, complex syllables, and actionable revision suggestions.
   - Click any card in the sidebar to smoothly scroll to and illuminate that sentence in the text.

---

## 2. AI Tools Used

During the architecture, algorithm development, and design of this application, the following AI tools and autonomous agent capabilities were utilized:

1. **Google Antigravity Agent & SDK**:
   - Autonomous multi-agent pair programming framework used to scaffold the project structure, coordinate architectural documentation (`VISION.md`, `ARCHITECTURE.md`, `DESIGN.md`), manage git version control, and enforce code verification gates.
2. **Gemini 3.8 Flash (High)**:
   - Utilized for deep mathematical reasoning, synthesizing linguistic phonological rules for syllable counting (calibrated against Carnegie Mellon University Pronouncing Dictionary rules), and designing test suites covering edge cases in narrative literature.
3. **DesignMD MCP Server (`designmd.ai`)**:
   - Used to query and import the curated **Ember Studio** design system (`chef/ember-studio`), implementing a terracotta (`#C2410C`) and warm parchment palette tailored specifically for distraction-free editorial and literary writing.
4. **GitHub MCP Server**:
   - Automated repository creation, branch synchronization, and deployment workflow integration directly with GitHub.

---

## 3. One Critical Place Where AI Tools Got It Wrong (And How It Was Solved)

When prompted to generate text readability and sentence analysis tools, **raw LLM code generators consistently fail on two fundamental linguistic edge cases** that corrupt accuracy:

### The Failure: Naive Sentence Segmentation in Literary Prose
When asking standard AI models to split text into sentences, they almost universally produce either a naive regular expression:
```javascript
// Typical flawed AI code generation:
const sentences = text.split(/[.!?]+/g);
```
or an unconfigured call to `Intl.Segmenter` with default boundaries.

#### Why This Breaks Down in Real Literature:
1. **Dialogue Attribution Destruction**:
   In literary chapters, authors frequently write dialogue ending with exclamation marks or question marks inside quotes, followed by attribution:
   > *"I cannot agree!" said Dr. Watson.*
   
   A standard AI-generated regex splits this single grammatical sentence into:
   - Sentence 1: `\"I cannot agree!\"`
   - Sentence 2: `said Dr.`
   - Sentence 3: `Watson.`
   
   This artificially turns **1 sentence of 7 words** into **3 fragmented pseud-sentences**!
2. **Skewing the Readability Math**:
   In the Flesch-Kincaid formula:
   $$\text{Grade Level} = 0.39 \left(\frac{\text{words}}{\text{sentences}}\right) + 11.8 \left(\frac{\text{syllables}}{\text{words}}\right) - 15.59$$
   Artificially inflating sentence counts from 1 to 3 drastically slashes the words-per-sentence ratio $\frac{\text{words}}{\text{sentences}}$, causing the algorithm to report that dense, complex prose is artificially simple!

### The Engineering Solution: Look-Ahead Literary Tokenizer
To achieve genuine accuracy, we implemented a custom state-aware tokenizer in [`src/engine/tokenizer.js`](https://github.com/Dev-angPatil/chapter-readability-analyzer/blob/main/src/engine/tokenizer.js):
- **Dialogue Look-Ahead Guard**: When closing punctuation inside quotation marks (`!"`, `?"`, `."`) is detected, the tokenizer scans ahead. If it matches lowercase speech attribution tags (`said`, `whispered`, `murmured`, `cried`, pronouns), it treats the quote and tag as a single unified sentence.
- **Honorific Abbreviation Whitelist**: Prevents sentence splitting on `Dr.`, `Mr.`, `Mrs.`, `Prof.`, `St.`, `vol.`, `ch.`, etc.
- **Ellipses & Decimals Protection**: Retains `...` and numeric decimals (`3.14`) without erroneous termination.
- **Lossless Character Offsets**: Tracks exact 0-indexed start and end character positions, enabling the UI to highlight sentences without mutating formatting or losing paragraph breaks.

### The Syllable Counting Flaw & Fix:
Standard AI code also miscalculates syllables using simplistic vowel counting (`word.match(/[aeiouy]/g)`), failing on silent 'e' (*"make"* = 1, not 2), consonant + 'le' endings (*"table"* = 2, not 1), and past-tense '-ed' elisions (*"walked"* = 1, not 2). We engineered phonological exception handlers in [`src/engine/syllables.js`](https://github.com/Dev-angPatil/chapter-readability-analyzer/blob/main/src/engine/syllables.js) calibrated against CMUdict standards, accompanied by 12 comprehensive automated unit tests (`node --test tests/readability.test.js`).

---

## 4. How It Is Hosted (Zero Cost, Infinite Scale)

The application is architected as a pure client-side static web application with **zero backend dependencies**:
- **GitHub Pages**: Automatically deployed via the included GitHub Actions workflow ([`.github/workflows/deploy.yml`](https://github.com/Dev-angPatil/chapter-readability-analyzer/blob/main/.github/workflows/deploy.yml)) triggered on pushes to `main`.
- **Alternative Free Deployments**: 1-click importable on Vercel, Netlify, or Cloudflare Pages with zero configuration needed.
