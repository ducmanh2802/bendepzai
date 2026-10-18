# P25 — KHO BÁU TRI THỨC: DEEP AUDIT REPORT
## Audit Execution Date: 2026-10-05
## Target: Parent Beta Readiness Certification

---

## 1. BASELINE ARCHITECTURE & INVENTORY

- **Runtime Environment**: Node.js v22.14.0, Vite 8.3.0, React 19.0.1, TypeScript 7.0.2
- **Audio Engines**: Web Audio API (Synthesizer Chimes & SFX) + Web Speech API (Vietnamese & English TTS)
- **Persisted State Engine**: LocalStorage with schema versioning (`kho_bau_version`)
- **Curriculum Scope**:
  - Tiếng Việt: 10 topics (Bảng chữ cái, Dấu thanh, Vần an/at/on/ot, Ghép tiếng, Chính tả c/k/g/gh, Từ chỉ người/vật, Từ chỉ hoạt động, Sắp xếp câu, Đọc hiểu 1, Đọc hiểu 2)
  - Toán Học: 10 topics (Đếm 0-10, So sánh >, <, =, Phép cộng 10, Phép trừ 10, Hình phẳng, Đo lường, Số 11-20, Cộng trừ 20, Bài toán có lời văn)
  - Tiếng Anh: 10 topics (Phonics, Numbers 1-10, Colors, Animals, Family, School, Body, Food, Toys, Greetings)
- **Playable Mini-Games**: 14 distinct interactive games with unique game loops
- **Adaptive System**: Spaced repetition daily review generator & mastery state machine
- **Parent Mode**: Math-challenge Parent Gate, diagnostic pedagogical insights, screen time limits

---

## 2. FORENSIC AUDIT FINDINGS

### P0 — CRITICAL DEFECTS (Data Integrity, Progress Loss, Fake Data)

1. **[P0-01] Stale Closure Progress Wipe in `WeeklyChallengeScreen.tsx`**:
   - *Location*: `src/components/challenge/WeeklyChallengeScreen.tsx:handleComplete`
   - *Root Cause*: `handleComplete` spread stale `profile` from component mount scope after `LessonPlayerModal` updated localStorage with challenge rewards (+100 XP, +10 Stars), overwriting and destroying the reward.
   - *Fix*: Always read fresh `StorageService.getChildProfile()` before persisting updates.

2. **[P0-02] Fake Seed/Demo Data Initializing New Child Profile & Analytics**:
   - *Location*: `src/services/storage.ts:DEFAULT_CHILD_PROFILE` and `getAnalytics()`
   - *Root Cause*: Hardcoded `xp: 150`, `stars: 18`, `streak: 3`, `completedLessons: ['vn-les-1', 'math-les-1']`, `totalMinutesSpent: 28`, `totalCorrect: 21` into default profile.
   - *Fix*: Zero out all initial child metrics (`xp: 0`, `stars: 0`, `gems: 0`, `tickets: 0`, `streak: 1`, `completedLessons: []`, `minutes: 0`, `answered: 0`, `correct: 0`). Add an explicit "Chế Độ Dùng Thử" toggle in Parent Mode for testers, rather than faking a new child's baseline.

3. **[P0-03] Fake 75% / 90% Fallback in Parent Diagnostic Report**:
   - *Location*: `src/services/adaptive.ts:generateParentReport`
   - *Root Cause*: If `totalAnswered === 0`, overall accuracy was hardcoded to `90`. If `subject.total === 0`, subject mastery was hardcoded to `75`.
   - *Fix*: Return 0 / `null` and explicit pedagogical status `INSUFFICIENT_DATA` ("Chưa có dữ liệu - Bé chưa bắt đầu làm bài môn này").

4. **[P0-04] Unlimited Reward Farming on Lesson Repeat**:
   - *Location*: `src/services/storage.ts:completeLesson`
   - *Root Cause*: Every re-take of an already completed lesson awarded full first-time star rewards and arcade tickets infinitely.
   - *Fix*: First-time completion awards full stars & tickets; repeat completions award practice review XP (+5 XP) without duplicating stars or ticket exploits.

5. **[P0-05] Corrupted LocalStorage Crash Vulnerability**:
   - *Location*: `src/services/storage.ts:getChildProfile` and `getAnalytics`
   - *Root Cause*: If localStorage contains partial or corrupted objects (missing `completedLessons`, `unlockedItems`, `equipped`), downstream components threw fatal TypeError.
   - *Fix*: Schema sanitization & defensive migration wrapper that merges with full schema defaults.

---

### P1 — HIGH SEVERITY DEFECTS (Curriculum Accuracy, UX Feedback, Audio)

1. **[P1-01] Ambiguous Multiple Valid Answers in Vietnamese Question `vn-q1-4`**:
   - *Location*: `src/data/vietnameseCurriculum.ts:vn-q1-4`
   - *Prompt*: "Hình nào có tên bắt đầu bằng chữ B?"
   - *Options*: `['Búp bê 🪆', 'Ngôi sao ⭐', 'Mặt trời ☀️', 'Bông hoa 🌸']`
   - *Bug*: Both "Búp bê" and "Bông hoa" start with the letter B. A grade 1 child selecting "Bông hoa" was incorrectly penalized!
   - *Fix*: Replace "Bông hoa" with "Cây thông 🌲" or "Quả táo 🍎".

2. **[P1-02] Missing Tone "Dấu Ngã (~)" in Syllable Builder Game**:
   - *Location*: `src/components/games/SyllableBuilderGame.tsx`
   - *Bug*: Only 4 tones were listed; Dấu Ngã was missing from the workbench buttons.
   - *Fix*: Add `{ label: 'Dấu Ngã (~)', val: 'ngã', sym: '~' }`.

3. **[P1-03] Inability to Retry Mistakes in `LessonPlayerModal`**:
   - *Location*: `src/components/learning/LessonPlayerModal.tsx`
   - *Bug*: When a child answers incorrectly, they were immediately forced to click "Câu tiếp theo" without the ability to retry and correct their mistake.
   - *Fix*: Add "Thử lại câu này 🔁" button with visual hint and encouraging feedback.

4. **[P1-04] SpeechSynthesis Asynchronous Voice Cache on Page Load**:
   - *Location*: `src/services/sound.ts`
   - *Bug*: On initial load, `getVoices()` is asynchronous and returns `[]`.
   - *Fix*: Attach `speechSynthesis.onvoiceschanged` event listener and cache available Vietnamese and English voices.

5. **[P1-05] Train Car Click Removal in `SentenceScrambleGame`**:
   - *Location*: `src/components/games/SentenceScrambleGame.tsx`
   - *Bug*: If a child tapped the wrong word, they had to reset the entire train.
   - *Fix*: Allow tapping any assembled train car to remove it and return it to the word pool.

---

### P2 — POLISH & ACCESSIBILITY ENHANCEMENTS

1. **[P2-01]** Keyboard accessibility and visible focus rings on interactive game cards.
2. **[P2-02]** Responsive touch targets $\ge 44\text{px}$ across all mobile viewports.
3. **[P2-03]** Safe screen-time persistence across browser sessions.
4. **[P2-04] iFrame Sandbox Compliance**: Replaced blocking native `window.confirm` and `alert` in `ParentDashboardModal.tsx` with friendly in-modal confirmation and ephemeral status toast.
5. **[P2-05] Parent Demo Simulation Tool**: Added safe `StorageService.seedDemoProfile()` callable directly from Parent Mode, enabling evaluators to inspect populated diagnostic charts, weak skill alerts, and pedagogical recommendations without corrupting fresh baseline metrics.

---

## 3. AUTOMATED TEST SUITE & VERIFICATION MATRIX

| Test Suite | File | Tests | Status |
| :--- | :--- | :--- | :--- |
| **Learning Engine & Storage** | `tests/learning-engine.test.ts` | 9 | **PASS** |
| **Math Curriculum Determinism** | `tests/math-curriculum.test.ts` | 4 | **PASS** |
| **Vietnamese Curriculum Quality** | `tests/vietnamese-curriculum.test.ts` | 4 | **PASS** |
| **English Curriculum Invariants** | `tests/english-curriculum.test.ts` | 3 | **PASS** |
| **Parent Mode & Store Mechanics** | `tests/parent-and-demo.test.ts` | 4 | **PASS** |
| **Total** | **5 test files** | **24 tests** | **100% PASS** |

---

## 4. PARENT BETA READINESS CERTIFICATION

- [x] Zero fake metrics / zero unearned progress for new accounts.
- [x] Full curriculum integrity across 10 Vietnamese topics, 10 Math topics, and 10 English topics.
- [x] 14 distinct interactive mini-games with zero game-breaking bugs.
- [x] Parent Gate secured with multi-digit math calculation.
- [x] iFrame sandbox compliant: zero `window.alert` / `window.confirm`.
- [x] TypeScript strict compilation: `tsc --noEmit` PASS (0 errors).
- [x] Production build: `vite build` PASS (0 errors).

**CERTIFICATION STATUS: APPROVED FOR PARENT BETA** 🚀
