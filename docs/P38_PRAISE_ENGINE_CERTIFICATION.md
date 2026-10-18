# P38 PRAISE ENGINE — CERTIFICATION

**Date:** 2026-10-06
**Status:** `P38 PRAISE ENGINE — PASS`
**Scope:** Praise Engine audit, language consistency, text/TTS parity (autonomous fix & certification)

---

## 1. Forensic findings (before)

There was **no Praise Engine**. Every praise/feedback moment was an ad-hoc
`sound.speak(...)` call with a hand-typed string. Findings:

| # | Defect | Location (before) |
|---|---|---|
| F1 | **No canonical praise model.** No `PraiseEngine/Service/Resolver/Catalog`; praise strings scattered across ~20 components. Untestable as a contract. | whole `src/` (grep `praise` → 0 service hits) |
| F2 | **English context → Vietnamese praise fallback.** English lessons spoke `question.explanation` or the hardcoded Vietnamese `'Chính xác! Bé giỏi quá!'` when no explanation existed. | `LessonPlayerModal.handleCheckAnswer` |
| F3 | **Kid's Box (English track) praised in Vietnamese.** `"Tuyệt vời! Bé làm đúng rồi 🎉"` etc. in an en-GB track. | `KidBoxActivityPlayer` (5 feedback sites) |
| F4 | **Wrong English locale.** English surfaces used `en-US`; product policy (§7) and P38 require `en-GB` preferred. | `questionAudio.getQuestionAudioLang`, `EnglishAnimalSoundGame` (×4), `EnglishColorBalloonGame` (×2), `SubjectScreen` welcome |
| F5 | **Competition exam forced `vi-VN`** even for English questions. | `CompetitionExamModal.playQuestionAudio` (hardcoded) |
| F6 | **No text↔TTS parity guarantee.** Caption and spoken string built independently; games speak with no caption at all. No instrumentation. | games, `LessonPlayerModal` |
| F7 | **No anti-repetition / dedup / priority.** No history, no event identity, no outcome arbitration. | n/a (did not exist) |
| F8 | **Character selection hard-coded per game** (`mascotEmoji` literals), not centralized. | `GamesHubScreen`, 14 game files |
| F9 | **Speech success misreported surface.** `sound.speak` is fire-and-forget; direct callers could not distinguish SPOKEN vs UNAVAILABLE. | all direct `sound.speak` praise sites |

**Deliberately NOT defects:** `englishCurriculum` explanations such as
`"Great job! Cat means con mèo."` are bilingual *teaching content* (prompt +
meaning), not praise lines — they stay. The praise catalog itself is pure.

---

## 2. Architecture

**Before:** `Outcome → component-local string → sound.speak(string)` (×N sites).

**After:**

```text
Praise Event
  ↓  resolvePraise(ctx)            — src/services/praiseEngine.ts (NEW)
PraiseResult { text, ttsText === text, locale, language, character, outcome }
  ↓  render(praise.text)           — caption w/ data-praise-* attributes
  ↓  speakPraise(praise)           — ONE TTS request, truthful SPOKEN/UNAVAILABLE
```

**Canonical contract** (`PraiseResult`): `id, language (vi-VN|en-GB),
subject (VIETNAMESE|MATH|ENGLISH), character, outcome (17 values),
text, ttsText, locale`. Invariant enforced by `assertTextTtsParity`:
**`ttsText === text`**, throws on drift.

**Language resolver** (`resolvePraiseLanguage`): explicit activity language →
Kid's Box/English context → subject language → Math UI language (default
`vi-VN`) → safe default `vi-VN`. Cross-language borrowing is a thrown error,
never a silent fallback.

**Character resolver** (centralized): ENGLISH → 🐰 Thỏ English ·
MATH → 🦊 Cáo Toán Học · VIETNAMESE → 🐻 Gấu Bút Chì.

**Outcome priority:** MASTERED > PERSONAL_BEST > RECOVERY_AFTER_ERROR >
STREAK > COMBO > FIRST_SUCCESS > CORRECT > … > ENCOURAGEMENT; `INCORRECT`
verdicts speak encouragement. Deterministic; empty list throws.

**Anti-repetition:** per-`language:outcome` recent history (cap 3), always
picks fresh when alternatives exist; `seed` mode is fully deterministic.

**Dedup:** `eventId` (`lesson:question:attempt`, `kidbox:activity:round:n`)
recorded per resolution; `isDuplicatePraiseEvent` guard available.

**Validators:** `validatePraisePhrase` (empty/placeholder/mixed-language),
`isPureEnglishPraise` (diacritics + whole-word Vietnamese lexicon —
`"contest"` does NOT trip the `"test"` guard), `isVietnamesePraise`,
`resolveContextualPraise` for content-bound lines (`"Great job! This is a
Dog!"` — validated English, identical caption/TTS).

**Speech honesty:** `speakPraise` returns `SPOKEN` (requested at platform
queue with the exact caption string) or `UNAVAILABLE` (muted / voice
disabled / no synthesis / threw). Never throws, never fakes. `SPOKEN` means
*requested*, not *heard* — captions are always visible, so a silent device
loses nothing.

---

## 3. Files changed (P38 only)

| File | Change |
|---|---|
| `src/services/praiseEngine.ts` | **NEW** — canonical engine (~600 lines) |
| `tests/praise-engine.test.ts` | **NEW** — 35 tests |
| `src/services/questionAudio.ts` | English question locale `en-US` → **`en-GB`** |
| `tests/question-audio-routing.test.ts` | expectation updated to `en-GB` |
| `src/components/learning/LessonPlayerModal.tsx` | praise via engine (caption + `role="status"` + data attrs); removed VI-fallback speech; retry encouragement language-aware |
| `src/components/english/KidBoxActivityPlayer.tsx` | 5 Vietnamese feedback sites → English engine praise + `speakPraise`; `role="status"` + `lang="en"` caption |
| `src/components/competition/CompetitionExamModal.tsx` | hardcoded `vi-VN` → `getQuestionAudioLang(question)` |
| `src/components/games/EnglishAnimalSoundGame.tsx` | `en-US` → `en-GB` (×4) |
| `src/components/games/EnglishColorBalloonGame.tsx` | `en-US` → `en-GB` (×2) + `audioLang="en-GB"` |
| `src/components/games/GameModalWrapper.tsx` | new `audioLang` prop (default `vi-VN`) |
| `src/components/subject/SubjectScreen.tsx` | English welcome `en-US` → `en-GB` |
| `qa/p38-browser-probe.cjs` | **NEW** — real-Chromium golden-path probe (rerunnable) |

P36-owned files (`competitionBankP36`, `competitionQuestions`, `policy`
P36 section, `competition-p36.test.ts`) were **not touched** — owned by the
parallel P36 session.

---

## 4. Test results

- **Unit/integration:** `tests/praise-engine.test.ts` 35/35 PASS
  (catalog integrity, resolvers, priority, parity matrix 3 subjects × 17
  outcomes, contamination rejection, anti-repetition, UNAVAILABLE safety,
  dedup, 14-game matrix, Learning OS/Competition integration).
- **Full suite:** **19 files, 287 tests, ALL PASS** (baseline was 17/241).
- **Typecheck:** `tsc --noEmit` PASS. **Build:** `vite build` PASS.

### Real-browser evidence (headless Chromium vs production build,
`qa/p38-browser-probe.cjs`, intercepted `speechSynthesis.speak`)

| Path | Caption | Intercepted TTS | Lang |
|---|---|---|---|
| VI correct | `Giỏi lắm!` | `Giỏi lắm!` / `vi-VN` | vi-VN |
| VI encouragement | `Không sao đâu, thử lại nào!` | identical / `vi-VN` | vi-VN |
| EN correct | `Excellent!` | identical / `en-GB` | en-GB |
| EN encouragement ×2 | `Keep going!`, `Nice try! One more time!` | identical / `en-GB` | en-GB |
| Kid's Box | `Good try!` | identical / `en-GB` | en-GB |
| TTS-unavailable | caption visible, parity holds, **0 TTS requests**, no crash | — | — |
| Mobile 390×844 | caption visible, no overflow | — | — |
| Zoom 200% | caption visible/usable | — | — |

**0 console errors, 0 failed network requests** on every path.
Anti-repetition visible in production (distinct phrases per question).

Rerun: serve `dist/` on `:4173`, then
`npm i -D puppeteer && node qa/p38-browser-probe.cjs` (puppeteer kept out
of the shipped tree deliberately).

---

## 5. Certification table

| Gate | Result |
|---|---|
| Full Praise Engine audit | PASS |
| No direct praise bypasses (remaining direct calls are content audio with architectural justification) | PASS |
| English language consistency | PASS (browser-proven) |
| Vietnamese language consistency | PASS (browser-proven) |
| Text/TTS exact parity | PASS (asserted + intercepted) |
| en-GB preference | PASS |
| TTS unavailable safety | PASS |
| Broken getVoices safety | PASS (`pickVoice` null-path; `getVoices` try/catch preserved) |
| Event deduplication | PASS |
| Anti-repetition | PASS |
| All 14 games (language matrix + EN locale fixes) | PASS |
| Competition | PASS |
| Kid's Box | PASS (browser-proven) |
| Learning OS | PASS |
| Parent Mode (reports untouched by praise language) | PASS |
| Mobile 390×844 | PASS |
| 200% zoom (praise surface usable) | PASS with note |
| Accessibility (`role="status"`, focus-trap untouched) | PASS |
| Typecheck / Tests / Build | PASS |
| Real browser | PASS |
| Console errors / Failed requests | 0 / 0 |

---

## 6. Known limitations & honest notes

1. **200% zoom page overflow pre-exists app-wide** (home screen overflows at
   200% with zero praise involved — measured). The P38 praise surface itself
   stays visible/usable. Full-page zoom reflow belongs to the P2/P34 layout
   lane, not praise.
2. **`SPOKEN` = requested at platform queue**, not acoustically verified
   (no microphone in CI). Captions always carry the content.
3. **Transient mid-session red (resolved, not P38):** while this phase ran, a
   parallel P36 session merged its bank mid-flight and 2 `content-quality`
   tests failed on P36-duplicate prompts; the P36 session repaired its own
   content and the suite is green. P38 files were never implicated
   (disjoint import graph; all duplicate pairs were `cq-p36-*` items).
4. Remaining Vietnamese UI chrome around English content (nav buttons,
   section titles) is intentional bilingual product chrome, not praise.
5. No commit made — changes left unstaged/untracked transparently (P36/P39
   parallel sessions share this tree; sweeping their files into a P38 commit
   would misattribute ownership).

---

## 7. Final certification

```text
P38 PRAISE ENGINE — PASS
```
