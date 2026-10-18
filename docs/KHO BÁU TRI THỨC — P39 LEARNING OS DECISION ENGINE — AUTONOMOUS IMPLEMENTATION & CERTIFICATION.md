# KHO BÁU TRI THỨC — P39
## LEARNING OS DECISION ENGINE
### EVIDENCE → PRIORITY → NEXT BEST ACTION → SESSION PLAN
### AUTONOMOUS AUDIT → IMPLEMENT → TEST → BROWSER QA → AUTO-FIX → CERTIFY

---

# 0. MISSION

You are the autonomous senior learning-platform engineer responsible for implementing and certifying:

**KHO BÁU TRI THỨC — LỚP 1**

P39 transforms the existing Learning OS from:

```text
tracking learning
+
showing progress
+
showing review items
```

into:

```text
observe evidence
→ understand current learning state
→ identify highest-value need
→ select next best action
→ explain why
→ generate an appropriate session
→ execute
→ record evidence
→ recalculate
```

The core product question is:

> **“Hôm nay bé nên học gì tiếp theo?”**

The system must answer this deterministically, explainably, safely, and using only real learning evidence.

Do not stop at audit.

Run:

```text
AUDIT
→ DESIGN
→ IMPLEMENT
→ TEST
→ BUILD
→ REAL BROWSER QA
→ AUTO-FIX
→ REGRESSION
→ CERTIFY
```

---

# 1. NON-NEGOTIABLE PRINCIPLES

## 1.1 Learning Engine remains the source of truth

Do NOT replace or duplicate:

- mastery
- competency
- SM-2
- Learning Engine state
- question correctness
- game scores
- Competition readiness

The Decision Engine consumes evidence.

It does not invent evidence.

Canonical states remain:

```text
NOT_STARTED
LEARNING
PRACTICING
MASTERED
NEEDS_REVIEW
```

---

# 2. NO FAKE PROGRESS

Never infer:

```text
10 questions displayed
→ 10 questions mastered
```

Never infer:

```text
game completed
→ skill mastered
```

Never infer:

```text
opened lesson
→ learned
```

Never infer:

```text
high score
→ permanent mastery
```

Every recommendation must be traceable to actual evidence.

---

# 3. NO PEER COMPARISON

Do not compare the child against:

- other children
- average users
- leaderboard
- percentile
- imaginary benchmark

Compare:

```text
child now
vs
child's own previous evidence
```

Only use curriculum/skill thresholds where explicitly defined by the product.

---

# 4. P39 CORE MODEL

Create a canonical Decision Engine.

Conceptually:

```ts
LearningDecisionEngine
```

with:

```text
Evidence Collector
        ↓
Evidence Normalizer
        ↓
Skill State Aggregator
        ↓
Need Detector
        ↓
Priority Scorer
        ↓
Constraint Filter
        ↓
Next Best Action Selector
        ↓
Session Planner
        ↓
Explanation Generator
```

---

# 5. INPUT EVIDENCE

Audit and integrate all real evidence sources.

## Learning Engine

- competency state
- mastery
- needs review
- learning state

## SM-2

- due date
- interval
- repetitions
- ease
- review history

## Questions

- correctness
- incorrect count
- repeated errors
- response time
- question type
- difficulty
- skill
- topic

## Games

- attempts
- completion
- score
- accuracy
- retry
- performance where actually recorded

## Competition Engine

- accuracy
- fluency
- comprehension
- speed
- stability
- recovery
- readiness

## Kid's Box

- vocabulary
- phonics
- listening
- speaking
- reading
- language patterns
- current unit
- review evidence

## Learning OS

- recent sessions
- completed activities
- daily goals
- recent recommendations
- recommendation outcomes

## Praise Engine

Only use praise events as contextual evidence.

Do NOT treat praise itself as proof of mastery.

---

# 6. EVIDENCE QUALITY

Every evidence record must have provenance.

Conceptually:

```ts
{
  source,
  timestamp,
  subject,
  skillId,
  topicId,
  evidenceType,
  value,
  confidence,
}
```

Possible evidence quality:

```text
VERIFIED
PARTIAL
STALE
UNAVAILABLE
```

The Decision Engine must not silently treat:

```text
UNAVAILABLE
```

as:

```text
GOOD
```

---

# 7. STALENESS

Define evidence freshness.

Do not use ancient activity as if it represents current ability.

At minimum distinguish:

```text
RECENT
OLDER
STALE
UNKNOWN
```

Use actual timestamps where available.

If timestamps do not exist:

```text
do not fabricate them
```

Use the existing product semantics instead.

---

# 8. SKILL STATE AGGREGATION

For every meaningful skill calculate a transparent state.

Example:

```text
Skill:
Vietnamese → Initial Sounds → "b"

Evidence:
accuracy = 72%
recent accuracy = 60%
attempts = 12
needsReview = true
SM2 due = true
last practiced = recent
```

Decision Engine output:

```text
NEEDS_REVIEW
```

The calculation must be deterministic and documented.

---

# 9. PRIORITY MODEL

Create a transparent priority score.

Possible factors:

```text
review due
+
repeated errors
+
recent deterioration
+
low confidence
+
unfinished foundation
+
curriculum relevance
+
recent practice gap
+
competition readiness need
+
Kid's Box current-unit relevance
-
recent repetition
-
over-practice
```

Do NOT create arbitrary magic numbers without documenting them.

Use named weights/constants.

Example:

```ts
DecisionPriorityFactor
```

with explicit reason codes.

---

# 10. REASON CODES

Every recommendation must have machine-readable reasons.

Examples:

```text
SM2_DUE
REPEATED_ERRORS
RECENT_ACCURACY_DROP
NEEDS_REVIEW
FOUNDATION_GAP
CURRENT_UNIT
LOW_FLUENCY
LOW_COMPREHENSION
LOW_STABILITY
COMPETITION_READINESS
NOT_PRACTICED_RECENTLY
IMPROVEMENT_OPPORTUNITY
RECOVERY_AFTER_ERROR
```

A recommendation should be explainable like:

```text
reasonCodes: [
  "SM2_DUE",
  "REPEATED_ERRORS"
]
```

---

# 11. NEXT BEST ACTION CONTRACT

Create a canonical model:

```ts
type NextBestAction = {
  id: string
  subject: Subject
  skillId: string
  topicId?: string
  activityType:
    | "REVIEW"
    | "PRACTICE"
    | "GAME"
    | "LESSON"
    | "FLUENCY"
    | "LISTENING"
    | "SPEAKING"
    | "READING"
    | "COMPETITION"
  priority: number
  reasonCodes: string[]
  explanation: string
  estimatedMinutes: number
}
```

Adapt to the existing architecture instead of blindly copying this shape.

---

# 12. NEXT BEST ACTION RULES

The engine should prefer:

### Rule 1
Due review when genuinely due.

### Rule 2
Repeated error before new difficulty.

### Rule 3
Foundation skill before dependent skill.

### Rule 4
Accuracy before speed.

### Rule 5
Stable accuracy before Speed Drill.

### Rule 6
Weak skill before already-mastered skill.

### Rule 7
Current Kid's Box unit relevance when English course context exists.

### Rule 8
Avoid immediately repeating the same activity unless recovery is intentionally required.

### Rule 9
Do not recommend an activity the system cannot actually launch.

### Rule 10
If evidence is insufficient:

```text
recommend discovery / diagnostic practice
```

rather than pretending to know the weakness.

---

# 13. SUBJECT BALANCE

Do not blindly rotate:

```text
Vietnamese → Math → English
```

Instead balance using evidence.

However, prevent starvation.

If English has been ignored for a long period while Vietnamese dominates activity history, English can become a priority.

Likewise for Math/Vietnamese.

The decision must remain evidence-driven.

---

# 14. CHILD DAILY PLAN

Implement:

```text
ÔN TẬP HÔM NAY
```

as a real Decision Engine output.

Target:

```text
3–5 meaningful actions
```

rather than an arbitrary long list.

Example:

```text
1. Review: Initial Sounds
2. Practice: Addition within 10
3. Kid's Box: Current Unit vocabulary
4. Game: phonics reinforcement
5. Optional challenge
```

Each item must have a reason.

---

# 15. SESSION PLANNER

Create a session planner capable of generating:

### QUICK SESSION

```text
5 minutes
```

### STANDARD SESSION

```text
10–15 minutes
```

### FULL SESSION

```text
15–20 minutes
```

Respect the existing parent screen-time guidance.

Do not force the child into a session longer than configured limits.

---

# 16. SESSION STRUCTURE

A recommended session should normally follow:

```text
Warm-up
→ Review
→ Targeted Practice
→ Reinforcement/Game
→ Short Check
→ Update Evidence
```

Do not require this structure when the evidence says another structure is more appropriate.

For example:

```text
recent repeated error
→ short targeted recovery
```

may be better than a full session.

---

# 17. ADAPTIVE DIFFICULTY

Integrate P37 Competition adaptive logic.

Do not increase difficulty merely because:

```text
one question was correct
```

Require sufficient evidence.

Likewise:

```text
one wrong answer
```

must not automatically downgrade the skill.

Use stability.

---

# 18. SPEED SAFETY

Maintain the principle:

> Faster wrong is not improvement.

Speed practice should require sufficient accuracy stability.

If:

```text
accuracy unstable
```

recommend:

```text
ACCURACY PRACTICE
```

not:

```text
SPEED DRILL
```

---

# 19. COMPREHENSION SAFETY

For reading/listening comprehension:

Do not optimize only for speed.

Use:

```text
accuracy
+
understanding
+
retention
```

before recommending speed.

---

# 20. KID'S BOX DECISION LOGIC

When the child has an active Kid's Box course context:

Prefer:

```text
current Unit
→ unfinished skill
→ weak skill
→ review
```

before unrelated English content.

Example:

```text
Current Unit:
Unit X

Vocabulary:
MASTERED

Phonics:
NEEDS_REVIEW

Decision:
Phonics practice
```

Do not invent Unit titles, vocabulary, lessons, or official course mapping.

Use:

```text
CONTENT_SOURCE_REQUIRED
```

where source data is genuinely unavailable.

---

# 21. COMPETITION DECISION LOGIC

Use P37 readiness states:

```text
NOT_READY
BUILDING_FOUNDATION
ACCURACY_READY
FLUENCY_READY
SPEED_READY
MOCK_READY
COMPETITION_READY
```

Decision Engine must respect progression.

Example:

```text
accuracy unstable
→ targeted accuracy practice
```

not:

```text
→ mock exam
```

---

# 22. PRACTICE REPETITION CONTROL

Prevent:

```text
same skill
same activity
same question
same praise
```

from repeatedly appearing without reason.

However, deliberate repetition is allowed when:

```text
NEEDS_REVIEW
RECOVERY_AFTER_ERROR
SM2_DUE
```

provides a valid reason.

---

# 23. QUESTION/ACTIVITY AVAILABILITY

Before recommending an activity, verify that it is actually available.

Never recommend:

```text
activity exists in database
```

if the runtime cannot launch it.

Decision Engine should produce:

```text
AVAILABLE
```

or exclude the candidate.

No dead-end recommendations.

---

# 24. NO EMPTY RECOMMENDATION STATE

If there is insufficient evidence, show an honest state.

Example:

```text
Chưa đủ dữ liệu để xác định điểm yếu.
Hãy làm một bài luyện ngắn để hệ thống hiểu khả năng hiện tại của bé.
```

For English:

```text
Let's do a short practice activity so we can see what you already know.
```

Do not fabricate weakness.

---

# 25. EXPLANATION ENGINE

Every recommendation shown to the parent should answer:

```text
WHAT?
WHY?
HOW LONG?
```

Example:

```text
Ôn luyện âm đầu
Vì bé đang cần ôn lại kỹ năng này và đã có một số lỗi gần đây.
Khoảng 5 phút.
```

English context:

```text
Practice phonics
Because this skill needs a little more practice.
About 5 minutes.
```

Do not expose technical reason codes to the child.

---

# 26. CHILD VS PARENT UX

## Child

Simple:

```text
Hôm nay mình học gì nhỉ?
🌟 Ôn âm đầu
🎯 Luyện cộng
🐰 Practice English
```

Avoid:

```text
72% accuracy
SM-2 interval 4
priority score 83.5
```

## Parent

Can show:

```text
Why recommended
Recent evidence
Skill state
Progress trend
Recommended duration
```

---

# 27. PARENT REPORT

Enhance Parent Mode with:

```text
Hôm nay
Điểm mạnh
Cần củng cố
Đang tiến bộ
Nên học tiếp
```

All values must come from real evidence.

No fake charts.

No invented percentages.

---

# 28. LEARNING LOOP

The canonical loop must become:

```text
RECOMMEND
↓
CHILD PRACTICES
↓
EVIDENCE RECORDED
↓
LEARNING ENGINE UPDATES
↓
SM-2 UPDATES
↓
DECISION ENGINE RECOMPUTES
↓
NEXT BEST ACTION
```

Do not cache recommendations indefinitely.

After meaningful evidence changes, recompute.

---

# 29. PERSISTENCE

Decision state must survive reload where appropriate.

Audit:

```text
localStorage
state version
serialization
deserialization
migration
corrupt state
missing state
partial state
```

Never persist stale recommendations forever.

Persist enough information to restore session context, but recompute decisions from canonical evidence.

---

# 30. INTERRUPTION / RECOVERY

Test:

```text
recommendation
→ start activity
→ reload
```

and:

```text
activity
→ browser close
→ reopen
```

and:

```text
activity
→ incomplete
→ return
```

Expected behavior must be deterministic and safe.

No progress inflation.

No accidental mastery.

---

# 31. TESTING

Create comprehensive tests.

## Unit

- evidence normalization
- skill aggregation
- priority scoring
- reason codes
- candidate filtering
- recommendation selection
- tie-breaking
- repetition control
- activity availability
- session planning
- language-aware explanation
- insufficient evidence
- competition readiness
- Kid's Box current-unit logic

## Property / adversarial

Test:

```text
no evidence
one evidence
conflicting evidence
stale evidence
missing timestamps
multiple weak skills
all skills mastered
all activities unavailable
repeated errors
rapid improvement
rapid deterioration
```

---

# 32. DETERMINISM

Given identical canonical evidence:

```text
same state
→ same recommendation
```

in deterministic/test mode.

No uncontrolled randomness.

Production personalization may rotate equivalent activities only where explicitly allowed.

---

# 33. REAL BROWSER GOLDEN PATH

Run actual browser automation.

## GOLDEN PATH A — NEW CHILD

```text
New child
→ no evidence
→ Learning OS
→ verify honest discovery recommendation
```

## GOLDEN PATH B — WEAK SKILL

Create real learning evidence through UI:

```text
repeated errors
→ return to Learning OS
→ verify weak skill becomes recommendation
```

## GOLDEN PATH C — REVIEW

```text
SM-2 due
→ Learning OS
→ verify review recommendation
```

## GOLDEN PATH D — IMPROVEMENT

```text
weak skill
→ practice
→ improved evidence
→ recompute
→ verify recommendation changes appropriately
```

## GOLDEN PATH E — KID'S BOX

```text
English
→ Kid's Box
→ current Unit
→ evidence
→ Learning OS
→ current-unit recommendation
```

## GOLDEN PATH F — COMPETITION

```text
Competition
→ unstable accuracy
→ Learning OS
→ accuracy practice recommended
```

NOT Speed Drill.

## GOLDEN PATH G — PERSISTENCE

```text
recommendation
→ reload
→ evidence intact
→ recommendation recomputed consistently
```

---

# 34. RESPONSIVE / MOBILE QA

Test:

```text
360×800
375×812
390×844
412×915
768
1440
```

Verify:

- recommendation cards
- session plan
- explanation
- buttons
- scrolling
- no horizontal overflow
- no clipped text
- touch targets
- 200% zoom
- focus behavior

Preserve P2-2 and P2-3.

---

# 35. AUDIO / PRAISE INTEGRATION

P39 must integrate with P38 without bypassing it.

When a recommended activity produces praise:

```text
Decision Engine
→ activity
→ Learning Engine evidence
→ Praise Engine
```

Do not make Decision Engine directly call TTS.

English activities must continue using:

```text
English praise
+
caption/TTS parity
+
en-GB preference
```

---

# 36. PERFORMANCE

Audit:

- recommendation recomputation
- memoization
- subscriptions
- event listeners
- render loops
- localStorage writes
- large evidence sets

Avoid recomputing the entire Learning OS on every UI render.

Use explicit invalidation.

---

# 37. SECURITY / DATA INTEGRITY

Never trust client-provided:

```text
mastery
score
readiness
completion
```

more than canonical internal state.

Validate persisted state.

Reject malformed recommendation state.

No user-controlled string should become executable content.

---

# 38. DOCUMENTATION

Create:

```text
docs/P39_LEARNING_OS_DECISION_ENGINE.md
```

Document:

1. Architecture
2. Evidence model
3. Skill aggregation
4. Priority model
5. Reason codes
6. Next Best Action
7. Session planner
8. Kid's Box logic
9. Competition logic
10. Insufficient evidence behavior
11. Persistence
12. Recovery
13. Browser evidence
14. Test evidence
15. Known limitations

Update:

```text
.ai/CURRENT.md
```

with actual status.

---

# 39. CERTIFICATION MATRIX

Produce:

| Gate | Result |
|---|---|
| Evidence audit | PASS/BLOCKED |
| Canonical Decision Engine | PASS/BLOCKED |
| No fake progress | PASS/BLOCKED |
| Deterministic recommendation | PASS/BLOCKED |
| Reason codes | PASS/BLOCKED |
| Next Best Action | PASS/BLOCKED |
| Daily plan | PASS/BLOCKED |
| Session planner | PASS/BLOCKED |
| SM-2 integration | PASS/BLOCKED |
| Learning Engine integration | PASS/BLOCKED |
| Competition integration | PASS/BLOCKED |
| Kid's Box integration | PASS/BLOCKED |
| Praise Engine integration | PASS/BLOCKED |
| Parent Mode | PASS/BLOCKED |
| Persistence | PASS/BLOCKED |
| Recovery | PASS/BLOCKED |
| Mobile | PASS/BLOCKED |
| 200% zoom | PASS/BLOCKED |
| Accessibility | PASS/BLOCKED |
| Typecheck | PASS/BLOCKED |
| Tests | PASS/BLOCKED |
| Build | PASS/BLOCKED |
| Browser golden path | PASS/BLOCKED |
| Console errors | PASS/BLOCKED |
| Failed requests | PASS/BLOCKED |

---

# 40. HARD PASS CONDITIONS

P39 can be:

```text
STATUS: PASS
```

ONLY when:

1. Decision Engine uses canonical real evidence.
2. No fake mastery/progress exists.
3. Recommendations are deterministic in test mode.
4. Every recommendation has a reason.
5. Every recommendation launches a real available activity.
6. SM-2 is correctly integrated.
7. Learning Engine remains authoritative.
8. Competition readiness is respected.
9. Kid's Box current-unit context is respected.
10. Insufficient evidence is handled honestly.
11. Daily session planning works.
12. Recommendation changes appropriately after new evidence.
13. Persistence/recovery works.
14. P38 Praise Engine remains intact.
15. All existing PASS states remain green.
16. Typecheck passes.
17. Full test suite passes.
18. Production build passes.
19. Real browser golden paths pass.
20. No unexpected console errors.
21. No unexpected failed requests.
22. Mobile/200% zoom remains usable.

Otherwise:

```text
STATUS: BLOCKED
```

Never convert a genuine blocker into PASS.

---

# 41. AUTO-FIX LOOP

After implementation:

```text
RUN TYPECHECK
↓
RUN UNIT TESTS
↓
RUN INTEGRATION TESTS
↓
RUN BUILD
↓
START REAL APP
↓
RUN BROWSER GOLDEN PATHS
↓
CAPTURE FAILURES
↓
TRACE ROOT CAUSE
↓
FIX
↓
RERUN TARGETED TEST
↓
RERUN FULL REGRESSION
```

Continue until PASS or a genuine external blocker remains.

---

# 42. GIT SAFETY

Never use:

```text
git reset --hard
git clean -fd
git clean -fdx
git restore .
git push --force
```

Preserve all existing work.

Review changed files before commit.

If repository workflow allows committing, create a focused P39 commit only after certification.

---

# 43. FINAL REPORT

Return:

```text
KHO BÁU TRI THỨC — P39
LEARNING OS DECISION ENGINE

STATUS: PASS / BLOCKED

Evidence Engine:
...

Skill Aggregation:
...

Priority Engine:
...

Next Best Action:
...

Daily Plan:
...

Session Planner:
...

SM-2:
...

Competition:
...

Kid's Box:
...

Praise Engine:
...

Parent Mode:
...

Persistence:
...

Recovery:
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

FINAL RULE:

> **P39 is not successful because it displays “Hôm nay bé nên học gì?”. It is successful only when that recommendation can be traced backward to real evidence, has an explainable reason, launches a real activity, records new evidence, and changes the next recommendation appropriately.**

Final certification:

```text
P39 LEARNING OS DECISION ENGINE — PASS
```

only when every hard gate is genuinely proven.