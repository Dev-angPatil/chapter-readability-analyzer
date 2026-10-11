# ARCHITECTURE.md: Chapter Readability Lens

## System Overview

Chapter Readability Lens is an ultra-fast, zero-dependency, client-side web application built with vanilla modern Web Standards (ES Modules, HTML5, CSS3, `Intl` APIs). It operates entirely within the user's browser, guaranteeing data confidentiality and sub-50ms execution times for multi-thousand word book chapters.

## Architectural Diagram

```mermaid
flowchart TD
    User([Author / Reviewer]) -->|Pastes Chapter Text| UI[Editor View]
    User -->|Or selects Sample Chapter| Samples[Sample Chapter Preloader]
    Samples --> UI

    UI --> Controller[App Controller / State Manager]
    Controller --> Engine[Readability Engine]

    subgraph Engine Pipeline
        Engine --> Tokenizer[Literary Tokenizer]
        Tokenizer -->|Dialogue attribution check| Sentences[Sentence Segments with Offsets]
        Tokenizer --> Words[Word & Contraction Extractor]
        
        Words --> SyllableCounter[Phonological Syllable Counter]
        SyllableCounter --> SyllableStats[Total Syllables & Polysyllabic Words]

        Sentences & Words & SyllableStats --> MetricFormulas[Readability Metrics Calculator]
        MetricFormulas --> FleschEase[Flesch Reading Ease]
        MetricFormulas --> FKGrade[Flesch-Kincaid Grade Level]
        MetricFormulas --> GunningFog[Gunning Fog Index]
        MetricFormulas --> ColemanLiau[Coleman-Liau Index]
        
        Sentences & Words & SyllableStats --> Ranker[Sentence Difficulty Ranker]
        Ranker --> TopFive[Top 5 Hardest Sentences & Diagnosis]
    end

    MetricFormulas --> Dashboard[Scorecards & Metric Gauges]
    TopFive --> Inspector[Hardest Sentences Inspector]
    TopFive & Sentences --> ProseView[Annotated Prose Highlighting View]
    
    Inspector -.->|Click to Jump & Focus| ProseView
    Dashboard & Inspector & ProseView --> DOM[Rendered UI]
```

## Data Flow & Processing Pipeline

1. **Input Ingestion**:
   - The user inputs raw text or selects a classic prose benchmark.
   - Text is normalized without losing paragraph breaks (`\n\n`) or typographic punctuation.

2. **Literary Tokenization (`tokenizer.js`)**:
   - Scans text character by character.
   - Guardrails honorific abbreviations (`Dr.`, `Mr.`, `Mrs.`, `Prof.`, `St.`, `vol.`, `ch.`).
   - Dialogue preservation: When punctuation inside a quote (`!"`, `?"`) is followed by lowercase speech attribution (`said`, `whispered`, `he`, `she`), the sentence continues.
   - Extracts exact 0-indexed character offsets `[start, end]` for each sentence to facilitate non-destructive highlight wrapping.

3. **Phonological Syllable Counter (`syllables.js`)**:
   - Applies CMUdict-calibrated rules: silent 'e' deduction, '-le' syllabic exceptions, vowel cluster coalescing, past-tense '-ed' elision, and irregular lookup tables.
   - Flags complex words ($\ge 3$ syllables, excluding proper nouns and simple suffixes).

4. **Metric Formulation (`readability.js`)**:
   - **Flesch Reading Ease**: $206.835 - 1.015 \left(\frac{W}{S}\right) - 84.6 \left(\frac{Y}{W}\right)$
   - **Flesch-Kincaid Grade Level**: $0.39 \left(\frac{W}{S}\right) + 11.8 \left(\frac{Y}{W}\right) - 15.59$
   - **Gunning Fog**: $0.4 \left[\frac{W}{S} + 100 \left(\frac{\text{complex}}{W}\right)\right]$
   - **Coleman-Liau**: $0.0588 L - 0.296 S - 15.8$ (syllable-independent character formula)

5. **Sentence Difficulty Scorer (`sentenceRanker.js`)**:
   - Evaluates each sentence against a composite heuristic combining word count fatigue ($W > 25$), polysyllabic load, and clause punctuation density.
   - Extracts the Top 5 hardest sentences, decorated with ranked badges (`#1` to `#5`) and editorial suggestions.

6. **Interactive Rendering (`app.js` & `styles.css`)**:
   - Renders the full prose into structured paragraphs.
   - Wraps the top 5 sentences in accessible `<mark>` nodes with numbered badges and hover tooltips.
   - Renders the sidebar inspector cards with smooth scroll event listeners (`scrollIntoView({ behavior: 'smooth' })`).

## Technical Stack Decisions

- **Zero Runtime Dependencies**: No heavy frameworks (React/Vue/Angular) or bundled bloated libraries. Instant initial load time (<100ms), 0 kB framework overhead, and runs natively in any browser.
- **Node Test Runner**: Uses native Node.js `node:test` and `node:assert` for clean, sub-second continuous testing.
- **Design System**: Fully grounded in `Ember Studio` design tokens using native CSS custom properties.
- **Deployment Ready**: Standard static distribution deployable to GitHub Pages, Vercel, Netlify, or Cloudflare Pages with zero configuration.
