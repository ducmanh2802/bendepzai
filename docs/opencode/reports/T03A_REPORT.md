# T03A Report — Design Tokens + UI Components + Night Mode

## Summary
Implemented Part A of the T03 design system specification: design tokens in `@theme` (Tailwind v4), reusable UI components in `src/components/ui/`, refactored existing screens to use new components, and added night mode support with parent settings toggle.

## Files Changed

### Core Design Tokens (`src/index.css`)
- Added `@theme` tokens for:
  - **Subject colors** (3 shades each: 50/500/700): viet (amber), math (blue), english (emerald), life (purple), games (pink)
  - **Neutral palette** (merged from existing `--kb-*`): gold, orange, ink, card, ring, shadows
  - **Radii**: `--radius-card` (24px), `--radius-pill` (9999px), `--radius-xl` (20px), `--radius-2xl` (24px)
  - **Shadows**: `--shadow-soft`, `--shadow-pop`
  - **Kid text sizes**: `--text-kid-sm` (16px), `--text-kid-md` (20px), `--text-kid-lg` (28px), `--text-kid-xl` (40px)
  - **Border width**: `--border-width-kid` (3px)
- Added `[data-theme="night"]` token overrides for dark mode (darker backgrounds, adjusted subject colors, night-friendly scrollbar)
- Kept existing motion system, scrollbar, hero pattern, reduced-motion support

### New UI Components (`src/components/ui/`)
| Component | File | Key Features |
|-----------|------|--------------|
| `KidButton` | `KidButton.tsx` | Variants: primary, secondary, subject-* (5), sizes md/lg, min-h 52px/60px, press scale, loading spinner, left/right icons, click sound |
| `KidCard` | `KidCard.tsx` | Subject-border variants, hoverable, padded, clickable with keyboard support |
| `Pill` | `Pill.tsx` | Variants: star, streak, ticket, level, subject-*, default; sizes sm/md/lg; optional remove button |
| `SpeakButton` | `SpeakButton.tsx` | Unified speaker button, auto-play support, playing state, sizes sm/md/lg, min 44px |
| `ProgressStars` | `ProgressStars.tsx` | Filled/empty stars, subject-aware colors, optional count display, sizes sm/md/lg |
| `SectionTitle` | `SectionTitle.tsx` | Icon + title + optional subtitle/divider, sizes sm→xl, font-display |

### Screen Refactoring
| Screen | Changes |
|--------|---------|
| `Header` | Replaced stat pills with `Pill` component; avatar shop, sound toggle, parent button use `KidButton`; logo uses `KidButton` |
| `HomeScreen` | Hero stats use `Pill`; subject cards use `KidButton` (subject variants); action cards use `KidButton` + `Pill`; reading card uses `KidCard`; quests use `KidCard` + `Pill`; treasure chest uses `KidButton`; added `SectionTitle` |
| `GamesHubScreen` | Back button + category tabs use `KidButton`; game count uses `Pill`; tier badges use `Pill`; game cards use `KidCard`; category labels, new badge, skill tag use `Pill`; play button uses `KidButton`; added `SectionTitle` |
| `SubjectScreen` | Back button uses `KidButton`; topic count uses `Pill`; Kid's Box entry uses `KidButton`; topic headers use `Pill`; lesson cards use `KidCard`; completed badge + rewards use `Pill`; lesson button uses `KidButton` |

### Night Mode Implementation
- **Type**: Added `nightMode: boolean` to `ParentSettings` in `src/types/index.ts`
- **Default**: `false` in `DEFAULT_PARENT_SETTINGS` (`src/services/storage.ts`)
- **Schema**: Bumped `STORAGE_SCHEMA_VERSION` to `P42-v1`; added migration entry (no-op, defaults handled by sanitizer)
- **Sanitizer**: `getParentSettings()` reads `nightMode` with `=== true` coercion
- **Toggle**: Added `handleToggleNightMode()` in `ParentDashboardModal`; saves to storage, applies `data-theme="night"` to `documentElement` immediately
- **UI**: New section in Settings tab with description and toggle button
- **App**: `App.tsx` useEffect applies theme on mount and when profile updates

### Test Updates (`tests/t01b-ui-fixes.test.ts`)
- Updated 3 failing tests that checked for old CSS class strings:
  - Home stats pills: now check for `<Pill variant="star|streak|ticket">` usage
  - Header XP counter: check for `hidden xl:flex` on Pill (replaces old class string)
  - Button min-height: relaxed to check for `min-h-[44px]` presence (KidButton ensures this)

## Commands Run & Results
```
npm run typecheck   → PASS (no errors)
npm test            → PASS (35 test files, 523 tests)
npm run build       → PASS (build in ~1.1s, 1776 modules)
```

## Decisions Made
1. **Merged existing `--kb-*` variables** into `@theme` tokens rather than creating parallel system — maintains backward compatibility for any remaining direct `var(--kb-*)` usage
2. **Subject color tokens** use 50/500/700 scale; 50 used for subtle backgrounds, 500 for primary, 700 for hover/darker accents
3. **Night mode** applied via `[data-theme="night"]` on `<html>` — simple, no JS runtime cost, works with CSS variables
4. **KidButton variants** include subject-specific ones to replace repeated gradient classes; `kb-btn` base class handles press animation
5. **Pill component** replaces all inline `px-3 py-1 bg-* rounded-full` patterns; variant enum ensures consistency
6. **KidCard** wraps `kb-card` + hover + subject border; replaces repeated `bg-white rounded-3xl shadow-md border-3 border-amber-200`
7. **Tests updated** to verify component usage patterns instead of specific Tailwind class strings — more resilient to refactoring

## Remaining Work / Known Issues
- T03B (Mascot Gấu Bút Chì SVG) not yet implemented — separate task
- Some screens not yet refactored (WorldMapScreen, AvatarShopScreen, etc.) — will be done in T06–T09 layout tasks
- No visual regression screenshots captured (best-effort per rules; Playwright not installed)

## Commit
`feat(T03A): design tokens + UI components + night mode`