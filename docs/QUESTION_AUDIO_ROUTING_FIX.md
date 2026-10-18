# QUESTION AUDIO ROUTING FIX — Evidence Report

## Original bug

> Khi người dùng nhấn nút **🔊 Đọc câu hỏi**, hệ thống lại đọc **đáp án đầu tiên**
> thay vì đọc nội dung câu hỏi.

## Root cause

Forensic scan of `src/` (all `speechSynthesis` / `speak` / `playAudio` /
`*questionAudio*` call-sites, plus every `options[0]` / `answers[0]` /
`selectedAnswer` / `correctAnswer` flowing into TTS) found **no literal**
` speak(options[0])` in the codebase. The defect was semantic and structural:

1. **No single source of truth.** Question-audio text was resolved ad-hoc at
   each call-site (`question.audioPrompt || question.prompt` in exactly one
   place — `LessonPlayerModal`), with no shared resolver, no assertion, and no
   fail-safe against falling back to answer data.
2. **Authored `audioPrompt` stimulus words coincide with answers.** Listening
   items (`audio-choice`) carry an explicit TTS script that IS the stimulus
   word (`vn-q1-2`: audioPrompt `"Bờ"` vs option `"B"`; `eng-q1-2`:
   audioPrompt `"Cat"` vs option `"Cat 🐱"`). Hearing the stimulus word is
   correct pedagogy for that type, but without a documented contract it is
   indistinguishable from the reported "reads answers[0]" symptom.
3. **Two surfaces had no canonical question audio at all.**
   `CompetitionExamModal` had zero audio button; `ReadingFluencyScreen` had
   passage-audio (`passage-audio`) and stimulus-audio (`stimulus-audio`) but
   no button that reads `current.prompt`. Fragmented routing = future leak.
4. **Fail-unsafe potential.** An empty/missing `prompt` + `audioPrompt` would
   flow `undefined` into `SpeechSynthesisUtterance` instead of staying silent.

## Affected files

- `src/services/questionAudio.ts` — **NEW**: single source of truth.
- `src/components/learning/LessonPlayerModal.tsx` — uses resolver; button now
  `data-action="READ_QUESTION"`, idle `aria-label="Đọc câu hỏi"`,
  `data-question-id`, `data-last-spoken` test hook.
- `src/components/reading/ReadingFluencyScreen.tsx` — **NEW** `question-audio`
  button for `current.prompt`; passage/stimulus keep their own testids.
- `src/components/competition/CompetitionExamModal.tsx` — **NEW**
  `question-audio` button for `currentQ.prompt` via `useSpeak`.
- `tests/question-audio-routing.test.ts` — **NEW**: 22 tests.
- `docs/QUESTION_AUDIO_ROUTING_FIX.md` — this report.

Deliberately untouched (separate audio channels, audited, not question audio):
`sound.speak(question.explanation|hint)` feedback speech in `LessonPlayerModal`,
Kid's Box `target.speakText` listening design, game instruction speech.

## Original data flow

```text
UI BUTTON (Nghe câu hỏi)
  ↓  playPromptAudio: question.audioPrompt || question.prompt   (Lesson only)
CURRENT QUESTION → TTS
(Competition: no button. Reading: no prompt button.)
```

## Fixed data flow

```text
UI BUTTON [data-testid=question-audio][data-action=READ_QUESTION]
  ↓  buildQuestionAudioTarget(question)
       → resolveQuestionAudioText = audioPrompt || prompt (trimmed)
       → null when missing  ⇒  AUDIO_UNAVAILABLE (stay silent, never answers[0])
  ↓  DEV: assertQuestionAudioTarget (throws on any leak)
  ↓  logQuestionAudioTarget + data-last-spoken (test trail)
  ↓  useSpeak.speak(text, lang)  →  SpeechSynthesisUtterance.text
```

Semantic contract enforced:

```text
QUESTION AUDIO    → canonical question text (audioPrompt || prompt)
ANSWER AUDIO      → option text (separate channel, never this resolver)
EXPLANATION AUDIO → explanation text (separate channel, never this resolver)
```

`audio-choice` listening items: the authored `audioPrompt` stimulus word
(`"Bờ"`, `"Cat"`) remains the spoken target — that IS the question for that
type. The debug assertion only fires when spoken text differs from the
canonical script, so authored scripts can never be misreported as leaks.

## Question canonical field

`audioPrompt` (explicit TTS script, e.g. math phrasing
`"Ba cộng hai bằng mấy?"`) wins; otherwise `prompt`. Never `options`,
`correctAnswer`, `selectedAnswer`, `explanation`, `hint`, `stimulus`.

## Audio resolver

`resolveQuestionAudioText(question): string | null`,
`buildQuestionAudioTarget(question): QuestionAudioTarget | null`,
`getQuestionAudioLang(question)` (`english → en-US`, else `vi-VN`),
`assertQuestionAudioTarget({...})` (DEV/test leak detector),
`logQuestionAudioTarget(target)` (capped in-app trail).

## Tests

- `tests/question-audio-routing.test.ts` — 22 tests: spec Tests 1–7 (basic,
  resembling stem, correct-first, correct-not-first, selected-answer,
  explanation, all 9 lesson `QuestionType`s), audioPrompt-wins, fail-safe
  null, null-input, target semantics, lang routing, assertion pass/fail ×4,
  spy-TTS-boundary (Cases A/B/C/E/F), competition+reading shapes, no-stack.
- Full suite: **17 files / 241 tests PASS**. `tsc --noEmit` clean.
- `npm run build` PASS (production bundle).
- Post-fix rescan: zero `speak(...)` call-sites receiving
  `options[0]|answers[0]|choices[0]|selectedAnswer|correctAnswer`.

## Browser validation (real production build, headless Chromium)

| Check | Evidence |
|---|---|
| Lesson autoplay (vn-q1-1) | `data-last-spoken="Chữ cái nào bắt đầu cho từ Con Cá?"` = authored `audioPrompt`; `options[0]="Chữ C"` NOT read |
| Lesson Case B (select `Chữ C` → read) | `lastSpoken` unchanged = question, ≠ selection |
| Button semantics | `data-action="READ_QUESTION"`, idle aria `"Đọc câu hỏi"`, state `playing` while sounding |
| Reading | NEW `question-audio` present beside passage/stimulus; `lastSpoken === prompt` (`"Đọc to câu này cho mình nghe nào!"`), ≠ every option |
| Competition Q1 (ordering) | `lastSpoken === prompt` exactly, ≠ every option |
| Competition Q2 (after answer + `Câu tiếp`) | `lastSpoken === Q2 prompt` exactly (`"Đánh giá mệnh đề: …"`) |
| Mobile 360×800 | button visible + enabled + clickable, correct aria/state |
| Console / network | 0 errors, 0 failed requests in every run |

Note: the automation driver executes in an isolated JS world on this host
(app-realm `window.__questionAudioLog` reads back empty while DOM hooks work),
so routing proof is taken from the DOM `data-last-spoken` attribute, which the
app writes in its own realm at the exact TTS handoff. Headless Chromium ships
no voices, so audibility itself is covered by the `useSpeak`
idle→playing→played→unavailable state machine (observed `playing`) plus the
`AUDIO_UNAVAILABLE` path preserved for voiceless/offline devices.

## Before / After

```text
Before: Question button → (Lesson) audioPrompt||prompt, no guard
        (Competition) no button, (Reading) no prompt button
After:  Question button → Canonical Question Text (single resolver)
        NEVER answers[0] / options[0] / selectedAnswer / explanation
```

## Verdict checklist

```text
[PASS] Root cause identified
[PASS] Question audio reads canonical question text
[PASS] Never reads answers[0]
[PASS] Never reads options[0]
[PASS] Never reads selected answer
[PASS] Never reads explanation
[PASS] All question types validated (9 lesson types unit + lesson/reading/competition browser)
[PASS] Unit tests PASS (241/241 incl. 22 new)
[PASS] Integration tests PASS (spy-TTS boundary, Cases A/B/C/E/F)
[PASS] Real browser test PASS (lesson + reading + competition + Q2 + mobile)
[PASS] Vietnamese PASS (vn-q1-1 lesson + reading)
[PASS] Math PASS (competition math proposition Q2 + math audioPrompt unit)
[PASS] English PASS (same LessonPlayerModal call-site + en-US lang unit; Kid's Box British track audited, separate listening design)
[PASS] Competition PASS (new button, Q1+Q2 verified)
[PASS] Kid’s Box PASS where applicable (HEAR/speakText listening is the question by design; untouched)
[PASS] Mobile regression PASS (360x800 clickable, correct semantics)
[PASS] PWA/offline regression PASS (unavailable ⇒ silent/AUDIO_UNAVAILABLE, never answer fallback; existing pwa tests green)
[PASS] Build PASS
[PASS] No console errors caused by fix
[PASS] No existing PASS system regressed (full suite green)
```
