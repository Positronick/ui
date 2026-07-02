# @positronick/ui

## 0.7.0

### Minor Changes

- [#33](https://github.com/Positronick/ui/pull/33) [`9bf4929`](https://github.com/Positronick/ui/commit/9bf49298d74545ae9c153229648ab05208c7b112) Thanks [@nsollazzo](https://github.com/nsollazzo)! - feat: add `RainBackdrop` — an animated rain background, drop-in sibling of `Backdrop`

  A canvas-based full-page rain layer that follows the theme ink (white rain on `machine`, black on `samaritan`), with a small accent-red fraction of drops and splash-particle bursts where drops hit the bottom edge. Props: `intensity` (0–1 rain amount), `accentRatio` (red-drop fraction, default 0.03), `speed` (fall multiplier), `splash` (impact bursts on/off). Honors `prefers-reduced-motion` with a static sparse frame, recolors live on theme change without a remount, and bounds its canvas/drop count so very tall pages degrade gracefully.

## 0.6.0

### Minor Changes

- [#26](https://github.com/Positronick/ui/pull/26) [`899d46a`](https://github.com/Positronick/ui/commit/899d46a2488dce404ca9eba523cd450ebabdf942) Thanks [@nsollazzo](https://github.com/nsollazzo)! - feat: add two reusable components — `Prose` and `SectionNav`

  - `Prose` — a styling wrapper that applies the design system's long-form typography to whatever markup is passed as `children`. It never calls `{@html}` itself, so sanitization stays the consumer's responsibility and no XSS surface ships in the library.
  - `SectionNav` — a responsive section sub-navigation (horizontal scroll-row on mobile, sticky vertical sidebar on desktop) with active-item scroll-into-view. Route-agnostic via `{ items, current, label, isActive? }`; the `SectionNavItem` type is exported.

### Patch Changes

- [#27](https://github.com/Positronick/ui/pull/27) [`6c08af4`](https://github.com/Positronick/ui/commit/6c08af46960af73f8c619c485bc889db5375281a) Thanks [@nsollazzo](https://github.com/nsollazzo)! - docs: add a 0.4 → 0.5 migration guide + codemod for the silent `--poi-*` / `.poi-*` / `PoiTheme` renames

  `0.5.0` renamed identifiers, not just the package, and most of those renames break **silently** for consumers (CSS custom-property overrides become no-ops, `.poi-*` selectors stop matching). This adds:

  - **`MIGRATION.md`** — the 0.4 → 0.5 breaking renames and exact upgrade steps, linked from the README and CHANGELOG.
  - **`scripts/migrate-0.4-to-0.5.mjs`** — a dependency-free, idempotent codemod (with `--dry-run`) that applies all renames across a consumer's `src/`, skipping `node_modules`, lockfiles, and build output.

  No runtime or API changes.

## 0.5.0

### Minor Changes

- [#20](https://github.com/Positronick/ui/pull/20) [`4ed1b71`](https://github.com/Positronick/ui/commit/4ed1b718be255acf1e09c42e784cc9ec52b0bb0b) Thanks [@nsollazzo](https://github.com/nsollazzo)! - feat: add six reusable primitives — `UserAvatar`, `ScrollTopButton`, `ThemeToggle`, `PositronickMark`, `VerifiedBadge`, and `ProviderIcon`

  Ported from the Positronick app and generalised for the library: app-specific types are inlined, brand/icon SVGs are inlined (no asset or `~icons` dependency), tokens use `--pn-*`, and each ships with browser tests and Storybook stories. `ThemeToggle` pairs with the existing `ThemeProvider`/`useTheme` context; `PositronickMark` is the brand mark (with a `mono` tint mode).

- [#20](https://github.com/Positronick/ui/pull/20) [`4ed1b71`](https://github.com/Positronick/ui/commit/4ed1b718be255acf1e09c42e784cc9ec52b0bb0b) Thanks [@nsollazzo](https://github.com/nsollazzo)! - ⚠️ BREAKING: rebrand `@nsollazzo/poi-ui` → `@positronick/ui`

  The package is published under the new name `@positronick/ui`. Consumers must also update:
  - **CSS custom properties:** `--poi-*` → `--pn-*`
  - **BEM classes:** `.poi-*` → `.pn-*`
  - **Exported type:** `PoiTheme` → `PositronickTheme`

  Theme names (The Machine / Samaritan), component APIs, and runtime behavior are unchanged — only identifiers were renamed. (Pre-1.0, so this lands as a minor bump per semver convention.)

  These renames mostly break **silently** (CSS overrides no-op, selectors miss). See [MIGRATION.md](./MIGRATION.md) for the upgrade steps and a codemod (`scripts/migrate-0.4-to-0.5.mjs`).

## 0.4.1

### Patch Changes

- [#18](https://github.com/positronick/ui/pull/18) [`4b08f41`](https://github.com/positronick/ui/commit/4b08f411d02c832edb709ee12d45d25d05f893d2) Thanks [@nsollazzo](https://github.com/nsollazzo)! - Terminal: lead with the prompt sigil, add a copy button, and gate the cursor
  - The prompt sigil (e.g. `$`) now **leads** the command on a single line instead of sitting on a separate line below it.
  - Added a **copy-to-clipboard button** in the top-right that copies the command text only (the sigil is never included); its glyph flips `⧉` → `✓` on success and announces via an `aria-live` region.
  - Added a **`cursor` prop** (default `true`) to toggle the trailing blinking cursor.

## 0.4.0

### Minor Changes

- [#12](https://github.com/positronick/ui/pull/12) [`1374914`](https://github.com/positronick/ui/commit/13749146966fe76bae042a0a799072cadeee6805) Thanks [@nsollazzo](https://github.com/nsollazzo)! - Overlay theme inversion + filter primitives extracted from positronick.

  **New behavior — overlays invert theme polarity by default.** The UI is flat (no
  elevation), so `Dialog`, `Sheet`, `Tooltip` and `Toaster` now render in the
  opposite theme of the page (Samaritan page → Machine overlay, and vice versa)
  as their figure-ground cue. Pass `invert={false}` to keep the previous
  same-theme rendering. Inversion no-ops outside a `<ThemeProvider>`. `Dropdown`
  intentionally does not invert (it reads as an extension of its trigger). The
  tooltip bubble background is now opaque (surface-2 composited over
  surface-base).

  **Changed — Dropdown ARIA.** The trigger no longer claims
  `aria-haspopup="menu"` (the popup contains plain buttons, not menuitems); it is
  now an honest disclosure (`aria-expanded` + `aria-controls` wired to the menu)
  with focus management: first option focused on open, focus returned to the
  trigger on Escape or selection.

  **New — `Chip` disclosure props.** `expanded` now works without `hasPopup`, and
  the new `ariaControls` prop links the chip to its popup.

  **New components.** `SortControl` (segmented sort field + direction picker) and
  `FilterToolbar` (search command bar with global `/` shortcut, status readout,
  removable filter tokens, and `primary`/`controls` snippets).

  **New exports.** `oppositeTheme(theme)` and the `SortDir` type.

### Patch Changes

- [#7](https://github.com/positronick/ui/pull/7) [`1e9fbcc`](https://github.com/positronick/ui/commit/1e9fbcc7034473699cbee7785d4cb1f5e9cc486a) Thanks [@nsollazzo](https://github.com/nsollazzo)! - Declare supported `engines` in `package.json` (Node >= 22.12, pnpm >= 10). This is the only consumer-visible change in a larger internal CI/CD and supply-chain hardening pass.

## 0.3.0

### Minor Changes

- [#5](https://github.com/positronick/ui/pull/5) [`89a13ae`](https://github.com/positronick/ui/commit/89a13aee2fb2eea9954ac010c135681f043efb6f) Thanks [@nsollazzo](https://github.com/nsollazzo)! - Add eleven generic primitives — Dialog, Sheet, Tooltip, Input, Separator, Skeleton, a Toaster (with `toast`/`dismiss`), and a filter family built on a single `Chip` brick (toggle/link/menu-trigger): `ChipGroup` (single-select row), `SegmentedControl` (connected one-of-N), and a chip-triggered single-select `Dropdown` (closes on select/outside-click/Escape). All are pure vanilla CSS over the existing token system (no Tailwind, no runtime deps), accessible (native `<dialog>` focus-trap + focus-return that also survives unmount-while-open, `aria-labelledby`/`aria-label`, Escape; Tooltip links its description to the focusable trigger and dismisses on Escape even when hover-opened; Toaster announces via a persistent polite live region with assertive `role="alert"` errors), and verified in both themes. Adds semantic tokens `--poi-overlay-bg` (modal scrim) and `--poi-status-{info,success,warning,error}`. The `svelte` peer floor is now `^5.20.0` (the new components use `$props.id()`).

## 0.2.0

### Minor Changes

- [#3](https://github.com/positronick/ui/pull/3) [`98b64ed`](https://github.com/positronick/ui/commit/98b64ede9024747fac1c02eaaf5e323906a30979) Thanks [@nsollazzo](https://github.com/nsollazzo)! - Add a page-level `Backdrop` component that paints a theme-aware engineering graph-paper grid behind page content, and an opt-in `solid` prop on the see-through components (`Banner`, `Button`, `DesignationTag`, `Loading`, `ProgressBar`, `StatusRow`, `SubjectFrame`) so they read cleanly over the grid.

## 0.1.0

### Minor Changes

- [`2f41aad`](https://github.com/positronick/ui/commit/2f41aad9e87fa1c9fee68b0c0ff684728b913935) Thanks [@nsollazzo](https://github.com/nsollazzo)! - Add the core component set: `StatusRow` (the data primitive), `DesignationTag` (vocab-driven chip), `SubjectFrame`/`TargetBox` (theme-driven corner brackets in The Machine vs. a crosshair reticle in Samaritan), and the `Block` / `Card` / `Box` container densities (shared internal `Panel`). All support `neutral` / `threat` / `asset` tones and are verified in both themes with axe.

- [`75bad09`](https://github.com/positronick/ui/commit/75bad09f7906f8bf7cfb865180717a6bcd781f81) Thanks [@nsollazzo](https://github.com/nsollazzo)! - Foundation release. Adds `<ThemeProvider>` with two runtime-switchable themes selected by a `data-theme` attribute — The Machine (dark: white + red on black, neon glow) and Samaritan (light: black + red on white, glow-free). Ships a layered CSS-variable token system (primitives → semantic per-theme → component), exposed via `@positronick/ui/tokens.css`; the `useTheme()` context helper; subject designation vocabularies; and a reactive `reducedMotion` helper. All theming is overridable through CSS custom properties.

- [`4812d0d`](https://github.com/positronick/ui/commit/4812d0d6dfc202500cf15bd4ae1c50df6dbcd077) Thanks [@nsollazzo](https://github.com/nsollazzo)! - Add the secondary components: `Button` (glow/pulse in The Machine vs. crisp in Samaritan, optional rotate-on-hover), `ProgressBar` (sizes, glowing vs. flat fill), `RecDot` (pulsing record indicator), `Terminal` (monospace with blinking prompt), `Banner` (word-by-word "samaritanWrite" reveal), `Loading` (rotating cube), and `Window` (collapsible, theme-driven chrome — traffic-light dots vs. a severe red title bar). All motion is gated behind `prefers-reduced-motion`; everything is verified in both themes with axe. The full 13-component inventory is now complete.
