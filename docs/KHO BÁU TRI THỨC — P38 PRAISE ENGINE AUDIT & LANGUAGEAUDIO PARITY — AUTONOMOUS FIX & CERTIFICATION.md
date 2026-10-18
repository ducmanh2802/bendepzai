# KHO BÁU TRI THỨC — P38
## PRAISE ENGINE AUDIT, LANGUAGE CONSISTENCY & TEXT/TTS PARITY
### AUTONOMOUS AUDIT → IMPLEMENT → TEST → BROWSER QA → AUTO-FIX → CERTIFY

---

## 0. ROLE

You are the autonomous senior engineer responsible for the production hardening of:

**KHO BÁU TRI THỨC — LỚP 1**

Do not stop at analysis or recommendations.

Run this phase as one continuous engineering loop:

**AUDIT → TRACE → DESIGN → IMPLEMENT → TEST → BUILD → REAL BROWSER QA → AUDIO/TEXT PARITY QA → AUTO-FIX → RETEST → CERTIFY**

Do not ask for confirmation unless an actual external credential, unavailable physical device, or unavailable external service is strictly required.

Never claim PASS without runtime evidence.

---

# 1. PRIMARY OBJECTIVE

Perform a complete forensic audit and production hardening of the entire **Praise Engine**.

The central requirement is:

> **The language of praise, displayed text, spoken TTS, character, subject, and context must remain internally consistent.**

Especially:

### ENGLISH MUST BE ENGLISH END-TO-END

If the child is in an English context:

```text
Praise language = English
Displayed praise = English
TTS text = exactly the displayed English text
TTS locale = en-GB preferred
Character = English character
```

No accidental Vietnamese translation.

No mismatched caption/audio.

No stale praise from another subject.

No hidden fallback that silently changes the language.

---

# 2. NON-NEGOTIABLE RULES

## 2.1 No fake PASS

Never report PASS because:

- code exists
- unit tests exist
- a component renders
- a function returns a string
- a mock TTS spy was called

PASS requires real evidence.

---

## 2.2 No fake TTS

Never claim that audio was successfully spoken if the browser/platform reports:

```text
speechSynthesis unavailable
voice unavailable
TTS unavailable
```

Use truthful:

```text
AUDIO_UNAVAILABLE
```

or the project's existing equivalent.

Do not fabricate successful speech.

---

## 2.3 No silent language fallback

Never silently do:

```text
English context
→ English praise missing
→ Vietnamese praise
```

or:

```text
Kid's Box
→ generic Vietnamese praise
```

Instead:

```text
English context
→ English praise required
→ select valid English phrase
→ if unavailable, fail safely / explicit fallback state
```

Fallback must not violate the language contract.

---

## 2.4 No translation mismatch

Never do:

```text
displayText = "Great job!"
ttsText = "Làm tốt lắm!"
```

Never do:

```text
displayText = "Cố lên!"
ttsText = "Keep going!"
```

unless the product explicitly defines bilingual mode.

Default child-facing English mode is:

```text
displayText === ttsText
```

for praise.

---

# 3. PRESERVE ALL EXISTING PASS STATE

Before modifying anything:

Audit and preserve:

- P25
- P26
- P27
- P27.5
- P28
- P29
- P30
- P31
- P32
- P33
- P34
- P35
- P36
- P37
- P2 accessibility/mobile fixes
- question-audio routing fix
- Kid's Box Companion
- Competition Engine
- Learning OS
- SM-2
- Parent Mode
- Persistence
- all 14 mini-games

Do not regress existing certified behavior.

---

# 4. FORENSIC DISCOVERY

Search the entire repository.

Locate:

```text
PraiseEngine
PraiseService
PraiseResolver
PraiseCatalog
PraiseProvider
PraiseContext
PraiseTemplate
PraisePhrase
PraiseHistory
PraiseSelector
PraiseCooldown
PraiseCharacter
PraiseVoice
TTS
SpeechSynthesis
speechSynthesis
speak
speakText
SpeechService
SoundService
audio
locale
language
subject
KidBox
Competition
Game
Learning OS
Parent Mode
```

Also search for direct praise strings outside the engine.

Find all:

```text
"Great job"
"Well done"
"Amazing"
"Good try"
"Keep going"
"Excellent"
"Làm tốt"
"Giỏi lắm"
"Cố lên"
"Rất tốt"
```

and all equivalent Vietnamese/English praise strings.

Build a complete call graph:

```text
Outcome
  ↓
Praise Context
  ↓
Language Resolver
  ↓
Character Resolver
  ↓
Praise Selector
  ↓
Phrase
  ↓
Displayed Text
  ↓
TTS Resolver
  ↓
Speech Engine
```

Identify every bypass.

---

# 5. CANONICAL PRAISE CONTRACT

Create or strengthen a canonical model similar to:

```ts
type PraiseLanguage = "vi-VN" | "en-GB";

type PraiseSubject =
  | "VIETNAMESE"
  | "MATH"
  | "ENGLISH";

type PraiseOutcome =
  | "CORRECT"
  | "INCORRECT"
  | "ALMOST"
  | "FIRST_SUCCESS"
  | "STREAK"
  | "COMBO"
  | "PERSONAL_BEST"
  | "IMPROVEMENT"
  | "MASTERED"
  | "REVIEW_SUCCESS"
  | "GAME_COMPLETED"
  | "LESSON_COMPLETED"
  | "MISSION_COMPLETED"
  | "DAILY_GOAL"
  | "COMPETITION_SUCCESS"
  | "RECOVERY_AFTER_ERROR"
  | "ENCOURAGEMENT";
```

Add whatever fields are required by the existing architecture.

Each resolved praise object must contain one canonical child-facing string:

```ts
{
  id,
  language,
  subject,
  character,
  outcome,
  text,
  ttsText,
  locale,
  ...
}
```

Mandatory invariant:

```ts
ttsText === text
```

unless the architecture explicitly requires a different speech representation for a proven accessibility reason.

If speech normalization is required, preserve semantic identity and document it.

---

# 6. LANGUAGE RESOLUTION

Implement one canonical language resolver.

Priority:

```text
Explicit activity/course language
        ↓
Kid's Box / English context
        ↓
Subject language
        ↓
User/learning locale
        ↓
Safe product default
```

For English:

```text
language = en-GB
```

Preferred voice:

```text
en-GB
```

If no British voice exists:

- use another English voice only if explicitly supported;
- never switch to Vietnamese;
- never fake pronunciation quality;
- expose truthful unavailable/fallback state.

---

# 7. ENGLISH PRAISE CONTRACT

For:

- English lessons
- Kid's Box Companion
- English games
- English Competition questions
- English vocabulary
- English phonics
- English listening
- English speaking
- English reading
- English review

the praise must be English.

Examples:

```text
Great job!
Well done!
Excellent!
Amazing!
You got it!
Fantastic!
Keep going!
Good try!
Almost there!
Try again!
You're getting better!
You did it!
Brilliant!
Super work!
```

Do not mechanically use these exact phrases if the existing catalog already has a richer validated English catalog.

Reuse valid existing content where possible.

Do not copy copyrighted textbook praise.

All phrases must be original product content.

---

# 8. VIETNAMESE CONTRACT

For Vietnamese learning contexts:

```text
language = vi-VN
display = Vietnamese
tts = same Vietnamese praise
```

Examples:

```text
Giỏi lắm!
Làm tốt lắm!
Chính xác!
Con làm rất tốt!
Cố lên nào!
Gần đúng rồi!
Thử lại nhé!
```

Do not replace Vietnamese child-facing praise with English unless bilingual mode is explicitly enabled.

---

# 9. MATH LANGUAGE CONTRACT

Math praise must inherit the actual learning context.

If Math UI is Vietnamese:

```text
Vietnamese praise
```

If Math is explicitly operating in English:

```text
English praise
```

Never infer language merely from the word "Math".

The context resolver must be authoritative.

---

# 10. CHARACTER CONSISTENCY

Audit:

- Gấu Bút Chì
- Cáo Toán Học
- Thỏ English
- Cú Thông Thái

Ensure character selection does not conflict with language.

At minimum:

```text
English → Thỏ English
Vietnamese → appropriate Vietnamese character
Math → Cáo Toán Học where configured
```

Do not hard-code character selection in individual games.

Centralize it.

---

# 11. PRAISE PRIORITY ENGINE

Preserve the existing outcome priority system.

Verify deterministic resolution for cases such as:

```text
MASTERED + STREAK + CORRECT
```

or:

```text
PERSONAL_BEST + CORRECT
```

or:

```text
RECOVERY_AFTER_ERROR + CORRECT
```

The resolver must choose one intentional praise outcome according to a documented priority policy.

No random conflicting messages.

No duplicate praise.

No multiple TTS calls for one event.

---

# 12. ANTI-REPETITION

Preserve P35 anti-repetition behavior.

Audit:

- recent history
- cooldown
- phrase weighting
- character rotation
- outcome priority
- deterministic test mode

Required:

```text
same event
→ deterministic test mode
→ deterministic result
```

Production:

```text
same recent phrase
→ avoid when alternatives exist
```

Do not make anti-repetition so aggressive that a language has no valid phrases.

---

# 13. TEXT ↔ TTS SINGLE SOURCE OF TRUTH

This is a P0 requirement.

The UI must not independently construct praise text.

Bad:

```text
const caption = getPraise(...)
speak("Well done!")
```

Good:

```text
const praise = resolvePraise(context)

render(praise.text)
speak(praise.ttsText)
```

Required invariant:

```text
displayed praise === spoken praise
```

for all normal praise events.

Instrument the runtime in test mode to capture:

```text
renderedPraiseText
ttsRequestedText
ttsLocale
voice
outcome
subject
language
character
```

Then assert:

```text
renderedPraiseText === ttsRequestedText
```

---

# 14. TTS ROUTING

Audit all speech paths.

There must be no accidental use of:

```text
question text
answer text
answers[0]
options[0]
choices[0]
selectedAnswer
explanation
old praise
previous praise
```

for praise audio.

Canonical flow:

```text
Praise Event
 ↓
Praise Resolver
 ↓
Praise.text
 ↓
Praise.ttsText
 ↓
Speech Service
```

No direct speech calls from games unless the architecture explicitly requires them.

If direct calls exist, migrate them to the canonical resolver.

---

# 15. TTS FAILURE SAFETY

Test:

### Case A
```text
speechSynthesis available
voice available
```

Expected:

```text
caption visible
audio requested
```

### Case B
```text
speechSynthesis unavailable
```

Expected:

```text
caption visible
audio state = UNAVAILABLE
no crash
no fake success
```

### Case C
```text
speechSynthesis exists
getVoices broken
```

Expected:

```text
app survives
caption remains
audio safely unavailable
```

### Case D
```text
no en-GB voice
```

Expected:

```text
English praise remains English
no Vietnamese fallback
```

---

# 16. EVENT DEDUPLICATION

Audit whether a single success causes:

```text
PraiseEngine event
+ Game event
+ LearningEngine event
+ Competition event
```

to produce multiple praise overlays/audio.

Implement event identity where necessary:

```text
praiseEventId
```

and ensure one logical event does not produce duplicate praise.

Test:

```text
one answer
→ one praise
→ at most one TTS request
```

unless the UX explicitly defines otherwise.

---

# 17. CONTENT QUALITY AUDIT

Audit every praise phrase.

Each phrase must have:

```text
stable id
language
subject/context
outcome
text
safe-for-child flag
originality
```

Reject:

- insulting language
- shame
- sarcasm
- negative comparison
- peer comparison
- "you're stupid"
- "you are bad"
- "everyone else is better"
- pressure language
- inappropriate adult language
- ambiguous translation
- mixed-language accidental phrases

Preserve P35's child-safe philosophy.

---

# 18. ENGLISH CONTENT VALIDATION

Build a validator that detects:

### Mixed-language contamination

Examples:

```text
"Great job! Con làm tốt lắm!"
"Well done! Cố lên!"
"Excellent! Thử lại nhé!"
```

These must fail validation unless explicitly marked bilingual.

### Vietnamese contamination

Detect common Vietnamese characters/words.

### Wrong locale

English praise should resolve to:

```text
en-GB
```

or an explicitly approved English fallback.

### Empty text

Reject.

### Placeholder text

Reject:

```text
TODO
Lorem ipsum
TEST
undefined
null
[missing]
```

---

# 19. SEMANTIC TEXT/TTS VALIDATOR

Create automated assertions:

```ts
expect(praise.text).toBe(praise.ttsText)
```

and:

```ts
expect(languageOf(praise.text)).toMatch(praise.language)
```

where practical.

For English:

```ts
expect(isEnglishPraise(praise.text)).toBe(true)
```

For Vietnamese:

```ts
expect(isVietnamesePraise(praise.text)).toBe(true)
```

Do not build a naive detector that rejects legitimate names or words.

Use a controlled language/content validation strategy appropriate for the repository.

---

# 20. INTEGRATION SURFACE AUDIT

Verify Praise Engine integration with ALL:

### Games
All 14 mini-games.

### Competition
- Practice
- Fluency
- Speed Drill
- Mock Exam
- Adaptive Training
- Review

### English
- vocabulary
- phonics
- listening
- speaking
- reading
- Kid's Box Companion

### Learning OS
- mastery
- review
- improvement
- streak
- daily mission
- next best action

### Parent Mode
Ensure parent reports are not accidentally treated as child praise language.

---

# 21. BROWSER GOLDEN PATHS

Use real browser automation.

Do not rely only on unit tests.

Run:

## GOLDEN PATH A — VIETNAMESE

```text
Open app
→ Vietnamese
→ answer correctly
→ praise appears
→ verify Vietnamese caption
→ trigger TTS
→ capture TTS request
→ verify caption === TTS
```

## GOLDEN PATH B — ENGLISH

```text
Open app
→ English
→ English activity
→ answer correctly
→ praise appears
→ verify English caption
→ trigger TTS
→ verify TTS text exactly equals caption
→ verify en-GB preference
```

## GOLDEN PATH C — KID'S BOX

```text
English
→ Kid's Box Companion
→ vocabulary
→ phonics
→ game
→ correct answer
→ praise
→ verify English
→ verify TTS parity
```

## GOLDEN PATH D — ENGLISH INCORRECT

```text
English
→ incorrect answer
→ encouragement
→ verify English
→ verify TTS parity
```

## GOLDEN PATH E — ENGLISH STREAK

```text
English
→ several correct answers
→ STREAK/COMBO
→ verify English
→ verify TTS parity
```

## GOLDEN PATH F — MASTERED

```text
English
→ mastery event
→ praise
→ verify English
→ verify TTS parity
```

---

# 22. ADVERSARIAL TEST MATRIX

Test:

```text
Vietnamese + CORRECT
Vietnamese + INCORRECT
Vietnamese + ALMOST

English + CORRECT
English + INCORRECT
English + ALMOST
English + STREAK
English + COMBO
English + MASTERED
English + REVIEW_SUCCESS
English + GAME_COMPLETED
English + RECOVERY_AFTER_ERROR

Math + CORRECT
Math + INCORRECT
Math + MASTERED

Kid's Box + all major outcomes
Competition + all major outcomes
```

For every case verify:

```text
language correct
subject correct
character correct
caption present
TTS text correct
TTS locale correct
no duplicate praise
no console errors
```

---

# 23. MOBILE / ACCESSIBILITY REGRESSION

Verify at:

```text
360 × 800
375 × 812
390 × 844
412 × 915
```

and desktop.

Verify:

- praise overlay visible
- text not clipped
- no overflow
- buttons reachable
- speaker button reachable
- focus behavior preserved
- 200% zoom remains usable
- reduced-motion behavior preserved
- screen-reader-friendly label
- no interaction lock
- modal/dialog survives audio failure

Do not regress P2-2 or P2-3.

---

# 24. PERFORMANCE

Audit:

- repeated praise resolution
- phrase catalog loading
- speech synthesis calls
- event subscriptions
- timers
- cleanup
- memory leaks
- duplicate listeners

Required:

```text
one event
→ one resolver execution
→ one UI praise
→ max one TTS request
```

unless intentionally configured otherwise.

No runaway timers.

No listener accumulation after route changes.

---

# 25. TEST SUITE REQUIREMENTS

Add/update tests for:

### Unit

- language resolver
- subject resolver
- character resolver
- outcome resolver
- phrase selector
- anti-repetition
- cooldown
- text/TTS parity
- English validation
- Vietnamese validation
- locale selection
- unavailable TTS
- broken getVoices
- missing voice
- duplicate event protection

### Integration

- Game → PraiseEngine
- Competition → PraiseEngine
- Kid's Box → PraiseEngine
- Learning OS → PraiseEngine
- PraiseEngine → TTS

### Browser

Real browser evidence for:

- English caption
- English TTS text
- Vietnamese caption
- Vietnamese TTS text
- Kid's Box
- Competition
- incorrect answer
- streak
- mastery
- TTS unavailable

---

# 26. REQUIRED RUNTIME ASSERTION

Add a development/test instrumentation mode capable of producing evidence similar to:

```text
PRAISE_EVENT
language=en-GB
subject=ENGLISH
outcome=CORRECT
character=THO_ENGLISH

DISPLAY_TEXT="Great job!"
TTS_TEXT="Great job!"
TTS_LOCALE="en-GB"

TEXT_TTS_PARITY=PASS
LANGUAGE_PARITY=PASS
```

For Vietnamese:

```text
language=vi-VN
DISPLAY_TEXT="Giỏi lắm!"
TTS_TEXT="Giỏi lắm!"

TEXT_TTS_PARITY=PASS
LANGUAGE_PARITY=PASS
```

Do not expose debug instrumentation to normal child users.

---

# 27. DOCUMENTATION

Create:

```text
docs/P38_PRAISE_ENGINE_CERTIFICATION.md
```

Document:

1. Forensic findings
2. Previous defects
3. Architecture before
4. Architecture after
5. Canonical praise contract
6. Language resolution
7. English contract
8. Vietnamese contract
9. Text/TTS parity
10. TTS failure behavior
11. Event deduplication
12. Anti-repetition
13. Browser evidence
14. Test results
15. Mobile/accessibility results
16. Known limitations
17. Honest blockers
18. Final certification

Update:

```text
.ai/CURRENT.md
```

with the real P38 state.

---

# 28. REQUIRED CERTIFICATION TABLE

Produce:

| Gate | Result |
|---|---|
| Full Praise Engine audit | PASS/BLOCKED |
| No direct praise bypasses | PASS/BLOCKED |
| English language consistency | PASS/BLOCKED |
| Vietnamese language consistency | PASS/BLOCKED |
| Text/TTS exact parity | PASS/BLOCKED |
| en-GB preference | PASS/BLOCKED |
| TTS unavailable safety | PASS/BLOCKED |
| Broken getVoices safety | PASS/BLOCKED |
| Event deduplication | PASS/BLOCKED |
| Anti-repetition | PASS/BLOCKED |
| All 14 games | PASS/BLOCKED |
| Competition | PASS/BLOCKED |
| Kid's Box | PASS/BLOCKED |
| Learning OS | PASS/BLOCKED |
| Parent Mode | PASS/BLOCKED |
| Mobile | PASS/BLOCKED |
| 200% zoom | PASS/BLOCKED |
| Accessibility | PASS/BLOCKED |
| Typecheck | PASS/BLOCKED |
| Tests | PASS/BLOCKED |
| Build | PASS/BLOCKED |
| Real browser | PASS/BLOCKED |
| Console errors | PASS/BLOCKED |
| Failed requests | PASS/BLOCKED |

---

# 29. HARD PASS CONDITIONS

P38 may be marked:

```text
STATUS: PASS
```

ONLY if:

### A
All Praise Engine paths are audited.

### B
No production praise bypass remains without explicit architectural justification.

### C
English contexts always produce English praise.

### D
Vietnamese contexts produce Vietnamese praise.

### E
Displayed praise and TTS text are identical for normal praise.

### F
English TTS prefers en-GB.

### G
Missing/broken TTS never crashes the app.

### H
No fake audio success is reported.

### I
One logical event does not create duplicate praise.

### J
All 14 games pass.

### K
Competition passes.

### L
Kid's Box passes.

### M
Learning OS integration passes.

### N
Mobile + 200% zoom regression passes.

### O
Typecheck passes.

### P
All tests pass.

### Q
Fresh production build passes.

### R
Real browser golden paths pass.

### S
0 unexpected console errors.

### T
0 unexpected failed network requests.

If any critical gate fails:

```text
STATUS: BLOCKED
```

Do not downgrade a failure to a warning merely to obtain PASS.

---

# 30. AUTO-FIX LOOP

After initial implementation:

```text
RUN TESTS
↓
RUN TYPECHECK
↓
RUN BUILD
↓
START REAL APP
↓
RUN BROWSER QA
↓
CAPTURE FAILURES
↓
TRACE ROOT CAUSE
↓
FIX
↓
RERUN FAILED TEST
↓
RERUN FULL REGRESSION
```

Repeat until:

```text
PASS
```

or a genuine external blocker remains.

Do not stop after the first failed test.

---

# 31. GIT SAFETY

Never use:

```text
git reset --hard
git clean -fd
git clean -fdx
git restore .
git push --force
```

Preserve user work.

Inspect changes before committing.

If the repository's established workflow permits commits, create a focused commit only after all gates pass.

Otherwise leave changes staged/unstaged transparently and report them.

---

# 32. FINAL OUTPUT

At completion report exactly:

```text
KHO BÁU TRI THỨC — P38
PRAISE ENGINE + LANGUAGE/TTS PARITY

STATUS: PASS / BLOCKED

Praise Engine:
...

English:
...

Vietnamese:
...

Text/TTS Parity:
...

en-GB:
...

TTS Failure Safety:
...

14 Games:
...

Competition:
...

Kid's Box:
...

Learning OS:
...

Mobile:
...

Accessibility:
...

Typecheck:
...

Tests:
...

Build:
...

Browser:
...

Console:
...

Network:
...

Files Changed:
...

Documentation:
...

Remaining Blockers:
...
```

Most importantly:

> **Do not claim that English praise is fixed merely because the phrase catalog is English. Prove that the actual runtime caption and actual TTS request are the same English string in the real browser.**

FINAL CERTIFICATION:

```text
P38 PRAISE ENGINE — PASS
```

only when every hard gate is genuinely proven.