---
'@positronick/ui': minor
---

feat: add `RainBackdrop` — an animated rain background, drop-in sibling of `Backdrop`

A canvas-based full-page rain layer that follows the theme ink (white rain on `machine`, black on `samaritan`), with a small accent-red fraction of drops and splash-particle bursts where drops hit the bottom edge. Props: `intensity` (0–1 rain amount), `accentRatio` (red-drop fraction, default 0.03), `speed` (fall multiplier), `splash` (impact bursts on/off). Honors `prefers-reduced-motion` with a static sparse frame, recolors live on theme change without a remount, and bounds its canvas/drop count so very tall pages degrade gracefully.
