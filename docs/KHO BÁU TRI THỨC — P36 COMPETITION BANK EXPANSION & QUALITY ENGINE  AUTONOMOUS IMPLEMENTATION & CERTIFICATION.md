# KHO BÁU TRI THỨC — P36
# COMPETITION BANK EXPANSION & QUALITY ENGINE
# AUTONOMOUS IMPLEMENTATION → REAL BROWSER QA → AUTO-FIX → CERTIFICATION

## STATUS

P35/P2 baseline must remain PASS.

Current known baseline:

- Competition Engine functional
- Real question grading verified
- 132 canonical competition items
- validator gaps: 0
- 7 real question types verified
- 7 real exams / 58 questions browser-tested
- 0 console errors
- 0 failed requests
- P2-1 Voiceless TTS PASS
- P2-2 KidBox Focus Trap PASS
- P2-3 200% Zoom PASS
- 241/241 tests PASS
- fresh build PASS
- 10/10 QA suites PASS

Remaining honest item:

> COMPETITION BANK DEPTH = 132 items

Goal:

> Expand the competition question bank substantially while preserving correctness, diversity, canonical grading, anti-duplicate guarantees, curriculum alignment, accessibility, persistence, and real browser behavior.

DO NOT claim the bank is complete merely because more questions were generated.

---

# 0. NON-NEGOTIABLE RULES

You are an autonomous senior engineer + curriculum QA engineer.

Run continuously:

AUDIT
→ DESIGN
→ IMPLEMENT
→ TEST
→ BUILD
→ BROWSER QA
→ FIND DEFECT
→ FIX
→ REBUILD
→ RETEST
→ CERTIFY

Do not stop at an audit report if a safe implementation/fix is possible.

Never ask for confirmation for normal implementation decisions.

Do not fake PASS.

Do not fabricate evidence.

Do not silently downgrade failed tests.

Do not weaken validators to make generated content pass.

Do not delete existing valid questions merely to make statistics look better.

Do not replace real content with mocks.

Do not invent official Trạng Nguyên questions, copyrighted questions, textbook exercises, answer keys, or proprietary material.

Create original questions inspired by the required skills and age level only.

If official information is required and unavailable:

CONTENT_SOURCE_REQUIRED

Never invent it.

---

# 1. PROTECT ALL EXISTING PASS STATE

Before modifying anything, discover and preserve:

- Learning Engine
- Competition Engine
- Competition question registry
- canonical answer builders
- grading logic
- question-type registry
- scoring
- timing
- retry
- mastery
- adaptive review
- Learning OS
- Parent Mode
- rewards
- Praise Engine
- TTS
- KidBox integration
- PWA/offline behavior
- persistence
- responsive UI
- accessibility
- existing QA harness
- existing certification documents

Do not rewrite these systems unless a concrete defect is demonstrated.

Create a baseline snapshot in documentation, not by destructive Git operations.

Forbidden:

- git reset --hard
- git clean -fd
- git clean -fdx
- git restore .
- force push
- destructive history rewrite

---

# 2. FORENSIC AUDIT CURRENT COMPETITION BANK

Locate the canonical source of truth.

Report:

- total questions
- active questions
- questions by subject
- questions by topic
- questions by difficulty
- questions by question type
- questions by competency
- questions by skill
- duplicate IDs
- semantic duplicates
- duplicate canonical keys
- answer/explanation mismatch
- unreachable questions
- malformed questions
- unsupported question types
- missing metadata
- missing curriculum mapping
- missing difficulty
- missing competency
- invalid answer choices
- ambiguous answers
- impossible ordering questions
- invalid matching pairs
- duplicate distractors
- trivial distractors
- answer-position bias

Do not assume the existing count is correct.

Compute the real count from the canonical registry.

---

# 3. DEFINE BANK DEPTH TARGET

Do not blindly choose an arbitrary huge number.

First inspect:

- current curriculum
- existing question types
- competition flow
- child age
- current skill taxonomy
- existing 132 canonical items
- current competition configuration
- existing test coverage

Then define a defensible target.

Minimum target:

> at least 300 validated canonical competition items

Preferred target if the existing architecture supports it cleanly:

> 360+ validated items

Do NOT generate 300 near-duplicates.

The bank must gain breadth AND depth.

If quality gates cannot support the target:

> stop at the highest genuinely validated count and report the limitation honestly.

---

# 4. COVERAGE MATRIX

Build a machine-readable coverage matrix.

Dimensions:

## SUBJECT

- Vietnamese
- Math
- English

## DIFFICULTY

Use the project's existing difficulty taxonomy.

Do not invent a second incompatible taxonomy.

## QUESTION TYPES

Discover the existing canonical seven types and use them exactly.

Do not create duplicate variants under different names.

## SKILLS

Map every question to a real Learning Engine / Competition competency.

## TOPICS

Use the actual curriculum registry.

No invented curriculum topics.

## COGNITIVE DEMAND

Where supported:

- recognition
- recall
- application
- comparison
- sequencing
- comprehension
- reasoning

Avoid turning every question into simple recognition.

---

# 5. DISTRIBUTION QUALITY

Detect and prevent:

- excessive answer A
- excessive answer B
- excessive answer C
- excessive answer D
- repeated correct-answer positions
- one dominant question type
- one dominant topic
- one dominant difficulty
- one dominant skill
- excessive repeated vocabulary
- repeated numbers
- repeated sentence structures
- repeated distractor patterns

Correct-answer position must be balanced where the question type permits it.

For non-position-based question types, do not artificially force meaningless balance.

---

# 6. QUESTION FACTORY

Build or extend typed builders.

Every generated item must produce:

- stable ID
- subject
- topic
- skill
- difficulty
- question type
- prompt
- options where applicable
- canonical answer
- explanation
- metadata
- curriculum mapping
- deterministic grading representation

The canonical answer must be computed from the same source representation used by grading.

Never independently hand-write:

question → answer

when the answer can be deterministically derived.

---

# 7. QUESTION-TYPE SPECIFIC VALIDATION

For every supported question type, implement validators.

Examples:

## MULTIPLE CHOICE

- exactly one canonical correct answer
- distractors valid
- no duplicate options
- no accidental second correct answer
- answer position not structurally biased

## ORDERING

- all required tiles exist
- no duplicated tile
- canonical order exists
- shuffled state remains solvable
- grading accepts only valid canonical order

## MATCHING

- left/right cardinality valid
- every left item has exactly one valid target
- no orphan pair
- no duplicated identity
- grader agrees with canonical mapping

## COMPARISON

- mathematical relation correct
- answer and explanation agree
- no floating-point ambiguity for elementary values

## CLASSIFICATION

- exactly one intended classification where required
- category boundaries unambiguous

## INPUT

- canonical normalization correct
- whitespace/diacritics rules intentional
- no accidental acceptance of wrong answers

Use actual project types, not hypothetical ones.

---

# 8. SEMANTIC DUPLICATE ENGINE

Do not rely only on IDs.

Detect duplicates through canonical semantic signatures.

At minimum compare:

- normalized prompt
- normalized option set
- canonical answer
- topic
- skill
- numerical parameters
- sentence pattern
- ordering structure
- matching structure

Near-duplicate threshold must be configurable and tested.

Example:

Question A:

"Which number is greater: 7 or 9?"

Question B:

"Which number is bigger: 7 or 9?"

must be flagged as semantic duplicate unless there is a meaningful pedagogical reason.

Do not reject legitimate variations where the underlying skill and cognitive demand genuinely differ.

---

# 9. DIFFICULTY QUALITY

Difficulty must not simply equal larger numbers.

Validate difficulty using actual cognitive characteristics.

Examples:

Easy:

- direct recognition
- one-step operation

Medium:

- two-step reasoning
- comparison
- short context

Hard:

- multi-step reasoning
- distractor discrimination
- comprehension
- transfer/application

For Grade 1, do not create fake difficulty through unnecessarily complex language.

---

# 10. EXPLANATION QUALITY

Every item must have a child-appropriate explanation.

Requirements:

- concise
- Vietnamese/English according to subject
- no shame
- no misleading reasoning
- explanation agrees with canonical answer
- no answer leakage in the prompt
- no unnecessary adult terminology

Test:

wrong answer → explanation

and

correct answer → explanation

through the real Competition Engine.

---

# 11. CONTENT SAFETY

Reject:

- violence
- frightening scenarios
- inappropriate names
- adult content
- unsafe instructions
- shaming
- stereotypes
- discriminatory examples
- manipulative language

Keep examples appropriate for Grade 1.

---

# 12. ORIGINALITY / COPYRIGHT

All newly generated content must be original.

Do not:

- copy Trạng Nguyên questions
- copy textbook exercises
- copy Kid's Box exercises
- reproduce copyrighted answer banks
- scrape question websites
- reproduce proprietary competition content

It is acceptable to use curriculum concepts and publicly known educational skill structures.

---

# 13. GENERATION STRATEGY

Do NOT generate the whole bank in one giant uncontrolled batch.

Generate in batches by:

subject × topic × difficulty × question type

After every batch:

GENERATE
→ VALIDATE
→ DEDUP
→ GRADE
→ REGISTER
→ TEST

Rejected items must remain rejected.

Do not silently auto-correct an item in a way that changes its pedagogical intent without revalidation.

---

# 14. CANONICAL ANSWER CERTIFICATION

Every final item must be tested through the REAL CompetitionEngine.

For every item:

1. derive canonical answer
2. submit canonical answer
3. expect correct
4. submit representative wrong answers
5. expect incorrect
6. verify score behavior
7. verify explanation
8. verify result state

Minimum:

> 100% of final canonical items must pass real grading.

No sampled-only certification.

---

# 15. PERTURBATION TESTING

For generated numeric / ordering / matching / comparison questions:

create controlled perturbations.

Examples:

- change one operand
- swap two ordering tiles
- change one match
- change comparison sign
- change answer choice

Verify that:

- canonical answer changes when expected
- stale answer does not survive
- validator catches inconsistency

This prevents template-level answer bugs.

---

# 16. REAL BROWSER TESTING

Run actual browser QA against the real application.

Do not test only React components.

At minimum test:

- Vietnamese competition
- Math competition
- English competition
- mixed competition if supported
- all question types
- multiple difficulty levels
- correct answer
- incorrect answer
- next question
- score
- completion
- retry
- reward
- praise
- Learning OS update

Record:

- console errors
- failed requests
- runtime exceptions
- blank states
- layout issues
- inaccessible controls

Target:

```text
console errors = 0
failed requests = 0
uncaught exceptions = 0
```

---

# 17. MOBILE / 200% REGRESSION

Existing P2 PASS must remain intact.

Run:

- 360px
- 375px
- 390px
- 412px
- 768px
- desktop

And zoom:

- 100%
- 125%
- 150%
- 175%
- 200%

Especially test:

- competition question
- options
- ordering
- matching
- result screen
- explanation
- praise
- retry
- navigation

No new overflow.

Do not weaken P2-3.

---

# 18. AUDIO REGRESSION

Existing question-audio routing fix must remain intact.

For every question type where audio exists:

CLICK QUESTION AUDIO
→ canonical question text
→ TTS

Must never read:

- answers[0]
- options[0]
- choices[0]
- selectedAnswer
- explanation

Run both:

- TTS available
- TTS unavailable

Voiceless mode must remain:

UNAVAILABLE
→ truthful label
→ safe no-op
→ UI survives

---

# 19. LEARNING OS INTEGRATION

New competition questions must generate valid learning evidence.

Verify:

competition answer
→ skill evidence
→ competency update
→ weak-skill detection
→ review recommendation

Do not directly mutate mastery.

Learning Engine remains source of truth.

Do not mark MASTERED merely because the child answered one question correctly.

---

# 20. PRAISE ENGINE INTEGRATION

Use the existing P35 Praise Engine.

Do not introduce a second praise system.

Test:

- correct
- incorrect
- streak
- improvement
- completion
- retry
- recovery after error

No duplicate praise architecture.

---

# 21. PERSISTENCE

Run:

competition
→ answer questions
→ complete partial progress
→ reload
→ verify state

Also test:

- corrupt state
- missing state
- version mismatch
- empty state

Existing graceful recovery must remain intact.

---

# 22. REGRESSION MATRIX

Run all existing tests.

Required:

```text
typecheck
eslint
unit tests
integration tests
competition validators
question builders
canonical grading
duplicate detection
browser QA
mobile QA
200% zoom
audio routing
focus trap
persistence
fresh build
```

No existing PASS may regress.

---

# 23. PERFORMANCE

Measure the effect of bank expansion.

Do not allow a giant synchronous question registry to introduce obvious startup regressions.

If needed:

- lazy-load competition banks
- split by subject
- split by difficulty
- use deterministic indexes

But do not introduce complexity unless measurement proves it is necessary.

---

# 24. FINAL COVERAGE REPORT

Generate:

`docs/P36_COMPETITION_BANK_CERTIFICATION.md`

Include:

- previous item count
- final item count
- added
- rejected
- duplicates removed
- semantic duplicates
- validator failures
- final validator gaps
- distribution by subject
- distribution by topic
- distribution by difficulty
- distribution by question type
- distribution by competency
- answer-position distribution
- browser test results
- regression results
- performance observations
- known limitations

Never hide rejected items.

---

# 25. HARD CERTIFICATION

P36 can be:

## PASS

ONLY if:

- ≥300 genuinely validated items OR a documented evidence-based target approved by the existing curriculum constraints
- 0 validator gaps
- 0 canonical grading mismatches
- 0 semantic duplicates above threshold
- 100% final items pass real CompetitionEngine grading
- all question types covered
- meaningful subject/topic/difficulty coverage
- browser QA PASS
- mobile QA PASS
- 200% zoom regression PASS
- audio routing regression PASS
- Learning OS integration PASS
- Praise Engine integration PASS
- persistence PASS
- typecheck PASS
- lint PASS
- tests PASS
- fresh build PASS
- 0 console errors in final browser sweep
- 0 failed requests in final browser sweep
- no P2 regression

## BLOCKED

If any hard gate fails.

Never downgrade a hard failure to warning.

---

# 26. FINAL AUTONOMOUS LOOP

Do not stop after finding defects.

For every defect:

```text
REPRODUCE
↓
IDENTIFY ROOT CAUSE
↓
MINIMAL SAFE FIX
↓
ADD REGRESSION TEST
↓
RUN TARGETED TEST
↓
RUN FULL TEST SUITE
↓
BUILD
↓
REAL BROWSER
↓
REGRESSION
```

Repeat until:

PASS

or a genuine external/platform/content-source blocker exists.

If blocked:

- state exact blocker
- state evidence
- state what was completed
- do not fake PASS

---

# 27. GIT SAFETY

Commit only after certification evidence exists.

Before commit:

- inspect git diff
- inspect changed files
- verify no generated junk
- verify no secrets
- verify no environment credentials
- verify no copyrighted content
- verify existing PASS state

Use a clear commit message:

`feat(competition): expand and certify question bank`

Do not force push.

Do not rewrite history.

---

# FINAL REQUIRED OUTPUT

At the end print exactly:

```text
KHO BÁU TRI THỨC — P36
COMPETITION BANK EXPANSION & QUALITY ENGINE

STATUS: PASS | BLOCKED

Previous Bank:
Final Bank:
Added:
Rejected:
Duplicates Removed:
Validator Gaps:
Canonical Grading:
Browser QA:
Mobile QA:
200% Zoom:
Audio Routing:
Learning OS:
Praise Engine:
Persistence:
Typecheck:
Tests:
Build:
Console Errors:
Failed Requests:

Remaining Honest Items:
```

Then update:

- `.ai/CURRENT.md`
- phase status
- certification documentation

Never claim COMPLETE if meaningful curriculum/bank limitations remain.