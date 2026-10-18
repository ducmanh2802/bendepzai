# T19 — Âm nhạc, ăn mừng, hiệu ứng

## Summary

Implemented T19 "Âm nhạc, ăn mừng, hiệu ứng" on branch `p42/T19`. All three requirement checks pass: `npm run typecheck`, `npm test` (47 files, 756 tests), and `npm run build`.

## Changes Made

### 1. Sound Service (`src/services/sound.ts`)
- Added **background music** support using WebAudio sequencer with looping patterns
  - Home/Map: gentle ascending/descending sequence (392Hz → 329.63Hz → 349.23Hz → 392Hz → 261.63Hz → 329.63Hz)
  - Volume low (0.1) by default, configurable via `setBgMusicEnabled()`
  - **Ducking**: BGM volume automatically lowered when TTS speaks, then restored
- Added **new sound effects**:
  - `playCombo()`: Rising pitch triangle sequence for correct streaks
  - `playChestOpen()`: Sine sweep from 220Hz to 330Hz for chest opening
  - `playStickerPickup()`: Two-tone chime when sticker is collected
  - `playButtonTick()`: Soft sine pulse (330Hz → 261.63Hz) for button presses
- Added `setBgMusicEnabled()` / `getBgMusicEnabled()` methods
- Background music defaults to **disabled** (`bgMusicEnabled: false`), consistent with task spec

### 2. Celebration/Confetti (`src/services/confetti.ts`)
- Added **4 celebration types** with reduced-motion handling:
  - `fireCelebrationSmall()`: 20 particles shining around center (reduced-motion: fade)
  - `fireCelebrationMedium()`: 45 particles in subject colors (reduced-motion: fade)
  - `fireCelebrationLarge()`: 90 particles + cheer sound effect
  - `fireCelebrationExtreme()`: 200 stars full-screen + star rain effect
- Existing `fireCelebrationConfetti()` kept as alias for `fireCelebrationMedium()` for backward compatibility
- **History tracking**: Prevents repeating the same celebration type consecutively (max 3 types in history)
- All types respect `prefers-reduced-motion` (fade effect instead of confetti)

### 3. Celebration Component (`src/components/motivation/CelebrationScreen.tsx`)
- New reusable component that triggers the appropriate confetti type based on `type` prop
- Accepts `onComplete` callback when celebration finishes
- Types: `small`, `medium`, `large`, `extreme`

### 4. Button Bounce Effect (`src/components/ui/KidButton.tsx`)
- Removed `active:scale-[0.96]` CSS, replaced with JavaScript bounce effect
- On click: briefly scales to 0.95, then transitions back to 1.0 over 100ms
- Smooth `transform` transition with `ease-in-out`

### 5. Living Mascot (`src/components/common/Header.tsx`)
- **Bear mascot (Gấu Bút Chì)** 🐻 now has contextual phrases:
  - Time-of-day greetings: "Chào buổi sáng bé oir!", "Bé làm tốt lắm!", "Ngủ gật đi bé, gấu sẽ chờ bé mai!"
  - 2-day break detection: "Gấu nhớ bé quá!"
  - Correct streak encouragement: "Bền bỉ lắm bé!"
- **Touch reaction**: Tap the bear 🐾 for random response:
  - Random phrase + sound (laugh, encouragement, sneeze)
  - Visual feedback pulse for 2 seconds
- All speech respects `sound.getMuted()` setting

## Before / After Metrics

| Metric | Before T19 | After T19 |
|--------|-----------|-----------|
| Background music | Not supported | WebAudio sequencer + ducking |
| Celebration types | 1 type (medium confetti) | 4 types (small/medium/large/extreme) |
| Button press effect | Scale down only | Scale down + bounce back |
| Mascot interaction | Static emoji | Contextual phrases + touch reactions |

## Commands Run & Results

```
npm run typecheck    PASS
npm test             47 passed, 756 tests passed
npm run build        ✓ built in ~3-5s
```

## Notes & Decisions

- **`bgMusicEnabled` default = false**: Per task spec, new `bgMusicEnabled` field defaults to `false` (music off by default). The existing `musicEnabled` field is unchanged.
- **No new npm dependencies**: All features use native Web Audio API, Web Speech API, and CSS transitions — zero external audio files or packages added.
- **Backward compatibility**: `fireCelebrationConfetti()` remains available as alias; all existing confetti usage continues to work.
- **Reduced-motion**: Full support via `prefers-reduced-media-query` — confetti replaces with subtle fade effects.
- **No auto-play before interaction**: All sound requires user touch first, per autoplay policy.