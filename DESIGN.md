# Design System: Ember Studio (Chapter Readability Analyzer)

This design system is derived from the **Ember Studio** aesthetic kit, customized for high-focus literary and editorial software. It pairs terracotta warmth with modern minimalism, ensuring that long-form chapter reading and metrics analysis feel calm, focused, and distraction-free.

## Color Palette

| Token | Hex | Role | Usage |
|---|---|---|---|
| `--color-primary` | `#C2410C` | Terracotta | Primary CTAs, active states, #1 rank badge, key focus indicators |
| `--color-primary-hover` | `#9A3412` | Burnt Sienna | Button hover states, active press |
| `--color-accent` | `#F59E0B` | Amber | Notifications, highlight tints for hard sentences (#2 - #5), badges |
| `--color-accent-soft` | `rgba(245, 158, 11, 0.15)` | Soft Amber | In-text highlight background for difficult sentences |
| `--color-primary-soft` | `rgba(194, 65, 12, 0.18)` | Soft Terracotta | In-text highlight background for #1 hardest sentence |
| `--color-neutral` | `#78716C` | Stone | Muted metadata, borders, secondary labels |
| `--color-bg` | `#FAFAF9` | Warm White | Page background with warm parchment tint |
| `--color-surface` | `#FFFFFF` | Pure White | Elevated cards, editor panel, reading container |
| `--color-surface-subtle` | `#F5F5F4` | Warm Off-White | Secondary panels, pill tags, code backgrounds |
| `--color-surface-raised` | `#E7E5E4` | Soft Gray | Active tabs, button borders |
| `--color-text-primary` | `#1C1917` | Warm Near-Black | Chapter body text, headings, primary values |
| `--color-text-secondary` | `#57534E` | Warm Dark Gray | Captions, metric labels, helper text |
| `--color-border` | `#D6D3D1` | Warm Stone Border | Dividers, card borders, input borders |
| `--color-success` | `#16A34A` | Emerald Green | High readability scores (80-100), good metrics |
| `--color-warning` | `#D97706` | Amber Warning | Moderate difficulty sentences |
| `--color-error` | `#DC2626` | Deep Crimson | Severe cognitive fatigue / academic density |

## Typography

- **Display & Headings**: `Playfair Display`, serif. Loaded via Google Fonts.
  - Conveys literary craft and editorial authority.
  - Weights: `600`, `700`.
  - Letter spacing: `-0.02em`.
- **Body & Prose**: `Source Sans 3`, sans-serif. Loaded via Google Fonts.
  - Highly legible for extensive chapter reading.
  - Weights: `400` (Regular), `500` (Medium), `600` (Semibold).
  - Line height: `1.75` for chapter prose; `1.4` for UI labels.
- **Numbers & Metrics**: `Fira Code` / `JetBrains Mono`, monospace.
  - Clean tabular display for scores, word counts, and syllable stats.

## Elevation & Radii

- **Border Radius**:
  - `4px`: Inline code, microscopic tags.
  - `8px`: Buttons, select inputs, badge pills.
  - `12px`: Cards, inspector drawers, prose containers.
  - `9999px`: Pills, score gauges, circular rank chips.
- **Shadows**:
  - Card: `0 1px 3px rgba(28, 25, 23, 0.05), 0 10px 24px -5px rgba(28, 25, 23, 0.04)`
  - Elevated Popover: `0 8px 30px rgba(28, 25, 23, 0.12)`
  - Primary Glow: `0 4px 14px rgba(194, 65, 12, 0.25)`

## Component Principles

1. **Anti-Clutter**: Only show actionable editorial data. No decorative charts that do not aid writing clarity.
2. **Immediate Feedback**: Score recalculation and sentence isolation happen instantaneously client-side with zero network delay.
3. **Seamless Highlighting**: Highlights do not disrupt the prose flow; authors can read uninterrupted while spotting hard sentences.
