# KHO BÁU TRI THỨC — P40
## LEARNING OUTCOME & FEEDBACK LOOP

STATUS: EXECUTE AUTONOMOUSLY

---

## 0. MISSION

Build and certify the next layer after:

- P37 — Exam Fidelity + Adaptive Competition Training
- P38 — Praise Engine
- P39 — Learning OS Decision Engine

P40 must close the loop:

```text
REAL LEARNING EVIDENCE
        ↓
P39 DECISION
        ↓
NEXT BEST ACTION
        ↓
REAL ACTIVITY EXECUTION
        ↓
REAL OUTCOME
        ↓
OUTCOME NORMALIZATION
        ↓
LEARNING EVIDENCE UPDATE
        ↓
P39 RE-EVALUATION
        ↓
NEXT BEST ACTION
```

The system must know what actually happened AFTER a recommendation was made.

P40 is NOT an AI generation phase.

P40 is NOT a UI-only phase.

P40 is NOT allowed to fabricate outcomes.

P40 must create a deterministic, explainable, persistent feedback loop from real child activity outcomes back into Learning OS.

---

# 1. NON-NEGOTIABLE RULES

1. DO NOT break P38.
2. DO NOT change P39 recommendation semantics unless required to consume real outcome evidence.
3. DO NOT invent scores.
4. DO NOT invent completion.
5. DO NOT mark an activity completed merely because it was launched.
6. DO NOT convert "started" into "mastered".
7. DO NOT create synthetic learning evidence.
8. DO NOT hide missing outcome data.
9. DO NOT silently recover corrupted outcome records.
10. DO NOT bypass existing Learning Engine / competency / SM-2 / persistence rules.
11. DO NOT introduce trading/execution-style concepts.
12. DO NOT introduce external backend requirements.
13. Preserve existing client-side architecture unless the repository already has a canonical persistence layer.
14. Reuse existing domain models whenever possible.
15. No UI financial math / irrelevant abstractions.
16. Fail closed.
17. Deterministic.
18. Explainable.
19. Persisted.
20. Testable.
21. Real browser validation is mandatory.
22. No console errors.
23. No failed network requests.
24. No fake PASS claims.

---

# 2. FIRST: AUDIT BEFORE MODIFYING

Inspect the repository and identify the actual implementations of:

- P39 Decision Engine
- DecisionRecommendation
- recommendation reason
- NextBestActionCard
- ParentDashboardModal
- Learning OS store
- Learning Engine
- competency state
- SM-2 state
- activity launch/navigation
- activity completion/result handlers
- quiz/game scoring
- Kid's Box CURRENT_UNIT context
- Praise Engine P38
- existing persistence/migration/sanitization
- existing analytics/event infrastructure

Do not assume filenames.

Use repository evidence.

Create a dependency map:

```text
Activity Start
      ↓
Activity State
      ↓
Question / Task Attempts
      ↓
Result
      ↓
Existing Learning Engine
      ↓
Competency / SM2
      ↓
Learning OS Evidence
      ↓
P39 Decision Engine
```

If an equivalent canonical mechanism already exists, extend it instead of creating a parallel mechanism.

---

# 3. DEFINE THE P40 DOMAIN

Introduce the smallest necessary canonical outcome model.

Conceptually:

```ts
type LearningOutcomeStatus =
  | "COMPLETED"
  | "PARTIAL"
  | "ABANDONED"
  | "INVALID"
  | "UNAVAILABLE";
```

Use repository naming conventions if equivalent types already exist.

An outcome must distinguish:

```text
STARTED
COMPLETED
PARTIAL
ABANDONED
INVALID
UNAVAILABLE
```

Do NOT collapse these states.

---

# 4. OUTCOME CONTRACT

Every real activity outcome should contain enough information to answer:

```text
What activity?
Why was it launched?
Was it actually started?
Was it completed?
What was the result?
When did it happen?
Which learning domain?
Which competency?
Which source generated the activity?
What evidence can safely be consumed by Learning OS?
```

Minimum conceptual fields:

```ts
{
  outcomeId,
  activityId,
  activityType,
  domain,
  competencyId?,
  sourceRecommendationId?,
  startedAt?,
  completedAt?,
  status,
  score?,
  maxScore?,
  accuracy?,
  attempts?,
  durationMs?,
  errors?,
  evidenceQuality,
  createdAt
}
```

Do not add fields that cannot be backed by real data.

---

# 5. EVIDENCE QUALITY

Every outcome must have explicit evidence quality.

Use existing repository vocabulary if available.

Otherwise:

```text
HIGH
MEDIUM
LOW
INVALID
```

Examples:

```text
COMPLETED + real score + valid activity result
→ HIGH

PARTIAL + real attempts
→ MEDIUM

STARTED only
→ LOW

Corrupt/malformed result
→ INVALID
```

The Decision Engine must never treat LOW or INVALID evidence as equivalent to HIGH evidence.

---

# 6. START ≠ COMPLETION

This is mandatory.

When P39 launches:

```text
activity_started
```

record only:

```text
STARTED
```

When the actual activity produces a valid result:

```text
activity_completed
```

record:

```text
COMPLETED
```

If the child leaves:

```text
ABANDONED
```

If the activity produces an incomplete but valid partial result:

```text
PARTIAL
```

Never infer completion from route navigation.

---

# 7. OUTCOME NORMALIZATION

Create one canonical normalization layer:

```text
Raw Activity Result
        ↓
Outcome Normalizer
        ↓
Canonical LearningOutcome
```

It must support existing activity types.

At minimum audit and support:

- Vietnamese learning activities
- Math activities
- English activities
- Kid's Box activities
- mini-games
- adaptive review
- competition/training activities
- any existing learning activity already connected to P39

Do not create separate incompatible outcome systems per domain.

---

# 8. REAL SCORE HANDLING

If the activity produces:

```text
score = 4
maxScore = 6
```

derive:

```text
accuracy = 4 / 6
```

ONLY when both values are real and valid.

If maxScore is missing:

```text
accuracy = UNAVAILABLE
```

Do not guess.

If score is malformed:

```text
evidenceQuality = INVALID
```

and do not feed the invalid result into competency updates.

---

# 9. EXISTING LEARNING ENGINE IS THE SOURCE OF TRUTH

Do not create a second competency engine.

Do not create a second SM-2 engine.

P40 must integrate with existing canonical systems.

The intended architecture is:

```text
Activity Result
      ↓
Existing Learning Engine
      ↓
Existing competency state
      ↓
Existing SM-2 state
      ↓
P40 Learning Outcome
      ↓
P39 Decision Engine
```

If the existing system already updates competency/SM-2 at completion, P40 must consume that canonical result rather than duplicate the calculation.

---

# 10. P39 RE-EVALUATION

After a valid outcome:

```text
LearningOutcome
      ↓
Evidence Update
      ↓
P39 Decision Engine
      ↓
New Decision
```

The new recommendation must be allowed to change.

Example:

```text
Before:

Phonics /sh/
NEEDS_REVIEW
→ Recommend phonics remediation
```

Child completes activity:

```text
5/6
```

New evidence:

```text
Phonics /sh/
improved
```

P39 may now choose:

```text
Vocabulary
```

or:

```text
Reading
```

The exact recommendation must come from existing P39 policy.

Do not hardcode this example.

---

# 11. DETERMINISM

Given identical:

```text
Learning State
+
Outcome History
+
Policy
```

the resulting recommendation must be identical.

Test:

```text
same state
→ same outcome
→ same recommendation
```

across multiple runs.

No:

- random()
- current-time-dependent ranking
- unstable iteration
- hidden browser state
- arbitrary tie breaking

unless already explicitly defined by policy.

---

# 12. FEEDBACK LOOP STATE

Add explicit lifecycle:

```text
DISCOVERY
   ↓
RECOMMENDED
   ↓
STARTED
   ↓
IN_PROGRESS
   ↓
COMPLETED / PARTIAL / ABANDONED
   ↓
OUTCOME_RECORDED
   ↓
EVIDENCE_UPDATED
   ↓
RECOMMENDATION_RECOMPUTED
```

Do not require every activity to expose every state if the activity architecture cannot support it.

Represent unavailable states honestly.

---

# 13. DUPLICATE PROTECTION

Outcome recording must be idempotent.

If the same completion event arrives twice:

```text
event A
event A again
```

the system must not:

- double count attempts
- double update SM-2
- double update competency
- create duplicate evidence
- distort recommendation ranking

Use an existing event/outcome ID when available.

Otherwise introduce the smallest deterministic identity mechanism possible.

Test duplicate delivery explicitly.

---

# 14. PERSISTENCE

Use the existing Learning OS persistence mechanism.

Do NOT create:

```text
P40_STATE_V1
```

if P39 already has the canonical Learning OS store.

Prefer:

```text
existing Learning OS store
      +
versioned migration
```

if schema expansion is required.

Persistence requirements:

```text
write
↓
reload
↓
read
↓
same outcome history
↓
same recommendation
```

must PASS.

---

# 15. SANITIZATION / CORRUPTION

Reuse P30/P39 sanitization/migration rules.

Test:

### Empty

```text
[]
```

→ honest empty state.

### Corrupt

```text
malformed outcome
```

→ reject safely.

### Unknown future status

```text
status = "UNKNOWN_NEW_STATE"
```

→ do not crash.

### Partial record

```text
missing score
```

→ preserve as unavailable rather than fabricate.

### Corrupted store

→ existing discovery/recovery behavior remains intact.

Never convert corruption into fake learning progress.

---

# 16. PRAISE ENGINE INTEGRATION

P38 must remain intact.

Praise must be triggered by the actual outcome, not merely by recommendation launch.

Bad:

```text
Recommendation launched
→ "Great job!"
```

Correct:

```text
Valid outcome
→ Praise Engine
→ context-appropriate praise
```

For English activities:

```text
English activity
→ English praise
```

The displayed praise must remain consistent with P38.

Do not create a second praise engine.

---

# 17. KID'S BOX

Preserve:

```text
CURRENT_UNIT context
+
track merge
+
Path E Balanced
```

Outcome feedback must update the appropriate evidence without drowning the child in remediation.

Do not convert one weak result into aggressive remediation.

Do not override P39 policy.

Use real evidence.

Example conceptual flow:

```text
Kid's Box CURRENT_UNIT
        ↓
Activity
        ↓
Outcome
        ↓
Evidence
        ↓
P39
        ↓
Balanced next action
```

---

# 18. PARENT MODE

Parent Mode must gain truthful visibility into outcome feedback.

Add only what is necessary.

Possible information:

```text
Last activity
Outcome
Score
Evidence quality
What changed
Next recommended action
```

Example:

```text
Today
English — Phonics
Completed: 5/6

Learning evidence updated.

Next best action:
Reading practice
```

Do not expose internal engine jargon to the child.

Parent Mode may expose more explanation.

---

# 19. CHILD UX

The child should NOT see:

- evidence quality
- internal decision IDs
- policy codes
- machine-readable reason codes
- storage state
- migration state

The child should see:

```text
Activity
→ Result
→ Praise
→ Simple next step
```

Keep existing UX intact.

---

# 20. "WHY?" EXPLANATION

Reuse P39's existing explanation system.

If a recommendation changes because of a real outcome:

```text
Vì sao?
```

must explain the actual evidence.

Example:

```text
Bé vừa hoàn thành hoạt động Phonics
với kết quả tốt hơn trước.
```

Only show claims backed by actual stored evidence.

Never generate explanations from assumptions.

---

# 21. DAILY TOGGLE

Preserve P39's daily recommendation toggle/determinism behavior.

P40 must not cause recommendation thrashing simply because an outcome was recorded.

Define clearly:

```text
same-day policy
vs
new-evidence policy
```

A new valid outcome may trigger recomputation according to P39 policy.

Do not accidentally recompute on every render.

---

# 22. EVENT BOUNDARIES

Audit React lifecycle carefully.

Outcome recording must NOT happen because:

- component rendered
- route mounted
- recommendation card displayed
- button became visible
- modal opened

Only actual activity lifecycle events may record outcomes.

Test for:

```text
render × N
→ outcome count remains unchanged
```

---

# 23. PERFORMANCE

Do not create an expensive full Learning OS recomputation on every render.

Use:

```text
activity completion
      ↓
record outcome once
      ↓
update evidence
      ↓
recompute decision
```

not:

```text
every React render
      ↓
recompute everything
```

---

# 24. TEST MATRIX

Create/extend unit tests covering at minimum:

### A — START

```text
start activity
→ STARTED
```

### B — COMPLETE

```text
valid completion
→ COMPLETED
```

### C — PARTIAL

```text
partial valid result
→ PARTIAL
```

### D — ABANDONED

```text
leave before completion
→ ABANDONED
```

### E — INVALID

```text
malformed result
→ INVALID
```

### F — SCORE

```text
4/6
→ accuracy 0.666...
```

### G — MISSING SCORE

```text
missing score
→ accuracy unavailable
```

### H — DUPLICATE

```text
same completion twice
→ one effective outcome
```

### I — PERSISTENCE

```text
record
→ reload
→ identical evidence
```

### J — DECISION UPDATE

```text
old evidence
→ recommendation A

new real outcome
→ recommendation may change
```

### K — DETERMINISM

```text
same state
→ same outcome
→ same recommendation
```

### L — CORRUPTION

```text
corrupt state
→ safe recovery
```

### M — PRAISE

```text
real outcome
→ P38 praise
```

### N — KID'S BOX

```text
CURRENT_UNIT
→ outcome
→ Balanced policy remains intact
```

### O — PARENT REPORT

```text
outcome
→ parent report contains truthful evidence
```

---

# 25. BROWSER QA

Create/extend a real browser QA script.

Test:

```text
A — recommendation displayed
B — activity launched
C — real activity completed
D — real result recorded
E — outcome persisted
F — P39 recomputed
G — next recommendation updated
H — reload preserves result
I — Parent Mode sees result
J — Praise Engine remains correct
K — mobile 375×667
L — accessibility
M — console errors = 0
N — failed network requests = 0
```

Do NOT mock the final outcome in browser certification.

The browser must execute the real activity flow.

---

# 26. MOBILE QA

At:

```text
375 × 667
```

verify:

- result card visible
- no horizontal overflow
- buttons ≥ 44×44
- recommendation remains usable
- Parent Mode remains usable
- "Vì sao?" works
- praise is visible
- no clipped text
- no modal overflow

---

# 27. ACCESSIBILITY

Verify:

- headings
- accessible names
- keyboard navigation
- `aria-expanded`
- dialog semantics
- focus restoration
- result announcements where appropriate
- no inaccessible outcome state

Do not regress P39's accessibility certification.

---

# 28. TYPECHECK / BUILD

Run:

```bash
tsc --noEmit
```

Then the repository's canonical build command.

No errors.

Do not accept:

```text
TS ignored
```

or:

```text
build warning = PASS
```

if it represents a real correctness problem.

---

# 29. FULL REGRESSION

Run all existing tests.

Especially:

```text
P30 storage
P31 English Content Factory
P32 adaptive
P34 Android/PWA
P37 competition
P38 Praise Engine
P39 Decision Engine
```

P40 PASS requires no regression.

---

# 30. NO UNRELATED REFACTORING

Do not:

- redesign the application
- change visual theme
- rewrite Learning Engine
- rewrite P39
- introduce a backend
- introduce AI
- change curriculum
- change Kid's Box policy
- change praise wording unless required for correctness
- change persistence architecture unnecessarily

Scope is:

```text
REAL OUTCOME
→ EVIDENCE
→ FEEDBACK
→ P39
```

---

# 31. REQUIRED DOCUMENTATION

Create:

```text
docs/P40_LEARNING_OUTCOME_FEEDBACK_LOOP.md
```

Document:

1. architecture
2. outcome lifecycle
3. outcome contract
4. evidence quality
5. duplicate protection
6. persistence
7. sanitization
8. P39 integration
9. Praise integration
10. Parent Mode integration
11. Kid's Box integration
12. test matrix
13. browser certification
14. known limitations

Documentation must describe the implementation actually shipped.

No aspirational claims.

---

# 32. FINAL CERTIFICATION FORMAT

At the end, print exactly this style:

```text
KHO BÁU TRI THỨC — P40
LEARNING OUTCOME & FEEDBACK LOOP

STATUS: PASS / FAIL

Outcome Lifecycle:
STARTED ........ PASS
COMPLETED ...... PASS
PARTIAL ........ PASS
ABANDONED ...... PASS
INVALID ........ PASS

Evidence:
REAL ........... PASS
QUALITY ........ PASS
DUPLICATE SAFE . PASS
PERSISTENT ..... PASS

Learning Engine:
COMPETENCY ..... PASS
SM-2 ........... PASS

P39 Integration:
RE-EVALUATION .. PASS
DETERMINISTIC .. PASS
EXPLAINABLE .... PASS

Praise Engine:
P38 INTACT ..... PASS

Kid's Box:
CURRENT_UNIT ... PASS
BALANCED ........ PASS

Parent Mode:
OUTCOME REPORT . PASS
NEXT BEST ...... PASS

Persistence:
RELOAD ......... PASS
CORRUPTION ..... PASS
MIGRATION ...... PASS

Mobile:
375x667 ........ PASS
OVERFLOW ....... PASS
44x44 .......... PASS

Accessibility:
PASS

Typecheck:
PASS

Tests:
X/X PASS

Browser:
PASS

Console:
0 errors

Network:
0 failed requests

Build:
PASS

Remaining Blockers:
none

P40 LEARNING OUTCOME & FEEDBACK LOOP — PASS
```

Do not claim PASS unless every required gate actually passes.

---

# 33. DEFINITION OF DONE

P40 is complete only when:

```text
P39 recommends an activity
        ↓
child actually starts it
        ↓
child actually completes/partially completes/abandons it
        ↓
real outcome is captured
        ↓
outcome is validated
        ↓
evidence is persisted
        ↓
existing Learning Engine receives canonical result
        ↓
P39 re-evaluates using the new evidence
        ↓
next recommendation can change
        ↓
Parent Mode can explain what happened
        ↓
P38 praise remains correct
        ↓
reload preserves the state
        ↓
browser proves the entire flow
```

The critical invariant is:

```text
NO REAL OUTCOME
        =
NO NEW LEARNING EVIDENCE
```

And:

```text
NO NEW EVIDENCE
        =
NO FABRICATED DECISION CHANGE
```

P40 must make the Learning OS a closed-loop system based on real learning behavior.