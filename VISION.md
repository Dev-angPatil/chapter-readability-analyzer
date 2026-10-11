# VISION.md: Chapter Readability Lens

## Core Problem
Authors, novelists, and essayists frequently struggle to calibrate narrative pacing and reader comprehension across long-form book chapters. While high-level readability metrics (like Flesch Reading Ease) exist, traditional writing tools provide opaque aggregate numbers without showing the author *where* their prose bogs down. 

Furthermore, naive NLP tools mangle literary prose:
- They split sentences midway through dialogue (`"Wait!" cried Watson.` gets counted as two separate sentences).
- They break on common abbreviations (`Dr. Jekyll`, `Mr. Darcy`, `vol. 1`).
- They use simplistic vowel counting that completely miscounts silent letters, diphthongs, and inflections.

As a result, authors either receive distorted scores or have to manually hunt through thousands of words to find sentences causing cognitive friction.

## Target User Experience
1. **Frictionless Entry**: The author pastes an entire draft chapter into a distraction-free, warm literary canvas.
2. **Instant Precision Analytics**: In less than 50 milliseconds, the app analyzes the entire chapter, displaying:
   - Flesch Reading Ease (with plain-language interpretation)
   - Flesch-Kincaid Grade Level
   - Gunning Fog & Coleman-Liau indices
   - Estimated Reading Time and vocabulary complexity
3. **Interactive 5 Hardest Sentences**:
   - The prose view cleanly highlights the **five hardest sentences** with subtle warm amber/terracotta tints and numbered badges (`#1` through `#5`).
   - A companion **Hardest Sentences Inspector** details the exact diagnostic reason for each sentence's difficulty (length fatigue, polysyllabic cluster, nested clauses) and provides a 1-click **Jump to Sentence** action with smooth scroll and visual focus glow.
4. **Zero-Setup Quick Demos**: One-click loaders featuring famous literary chapters (Charles Dickens vs. Ernest Hemingway vs. Jane Austen) so reviewers and authors can immediately test and contrast different prose densities.

## Success Criteria
- **100% Client-Side Privacy**: Chapter text never leaves the author's browser.
- **Accurate Literary Tokenization**: Dialogue and honorifics are preserved without false sentence boundaries.
- **Minimalist Aesthetic**: Ember Studio design tokens provide a warm, literary, clutter-free reading environment.
- **Deployability**: Free zero-cost static hosting anywhere (GitHub Pages, Vercel, Netlify).
