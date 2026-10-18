# KHO BÁU TRI THỨC — P40
# AUTONOMOUS FULL PASS
## LEARNING OUTCOME & FEEDBACK LOOP

ROLE: You are the autonomous senior engineer, QA engineer, accessibility engineer, and release certifier for the existing Kho Báu Tri Thức codebase.

MISSION:

Take P40 from the current repository state all the way to a REAL certified PASS.

Execute continuously:

```text
AUDIT
→ DESIGN FROM EXISTING ARCHITECTURE
→ IMPLEMENT
→ UNIT TEST
→ AUTO-FIX
→ BROWSER QA
→ AUTO-FIX
→ ACCESSIBILITY QA
→ MOBILE QA
→ P38/P39 REGRESSION
→ FULL TEST
→ TYPECHECK
→ BUILD
→ FINAL AUDIT
→ DOCUMENT
→ CERTIFY
```

DO NOT stop after analysis.

DO NOT merely provide recommendations.

DO NOT ask me to manually fix normal engineering issues.

When a normal defect is found:
FIX IT → TEST IT → RECHECK IT → CONTINUE.

Only stop for a genuine external blocker that cannot be solved from the repository/environment.

---

# 0. CURRENT CERTIFIED BASELINE

Treat these as existing certified capabilities and protect them:

```text
P37 — Exam Fidelity + Adaptive Competition Training      PASS
P38 — Praise Engine                                      PASS
P39 — Learning OS Decision Engine                        PASS
```

Known P39 certification:

```text
Decision Engine:
330/330 tests PASS
42 decision-engine tests PASS
storage tests PASS

Browser:
A DISCOVERY
B REMEDIATION
C SM2_DUE
D PROGRESS
E BALANCED
F no-speed
G deterministic + daily toggle + parent report

Persistence:
read-only Learning OS store
P30 sanitize/migrate
reload preserves identical recommendations

Recovery:
corrupt/empty → DISCOVERY
"Chưa đủ dữ liệu…"
DISCOVERY_NEEDED

Mobile:
375×667
0 overflow
0/12 buttons under 44×44

Accessibility:
heading present
"Vì sao?" aria-expanded=false
6/6 start buttons named

Typecheck:
PASS

Build:
PASS

Console:
0 errors

Network:
0 failed requests

Kid's Box:
CURRENT_UNIT context
track merge
Path E BALANCED
no remediation drowning

Parent Mode:
Ba Mẹ gate
insights
parent-decision-report
parent-next-best
```

DO NOT regress any of these.

---

# 1. P40 OBJECTIVE

Close the Learning OS loop:

```text
REAL LEARNING EVIDENCE
        ↓
P39 DECISION
        ↓
NEXT BEST ACTION
        ↓
REAL ACTIVITY
        ↓
REAL OUTCOME
        ↓
OUTCOME VALIDATION
        ↓
LEARNING EVIDENCE UPDATE
        ↓
P39 RE-EVALUATION
        ↓
NEXT BEST ACTION
```

The central invariant is:

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

---

# 2. AUTONOMOUS EXECUTION RULE

Start immediately.

First inspect the repository.

Do NOT assume filenames, architecture, state shape, or APIs.

Find the real implementations of:

- P39 Decision Engine
- Learning OS store
- Learning Engine
- competency
- SM-2
- activity launch
- activity completion
- scoring
- persistence
- migrations
- sanitization
- Praise Engine P38
- Parent Mode
- Kid's Box CURRENT_UNIT
- existing QA infrastructure
- browser automation
- existing test commands
- existing build commands

Reuse canonical infrastructure.

Never create a parallel system if an existing canonical system already performs the required responsibility.

---

# 3. CREATE A BASELINE

Before modification:

```bash
git status
```

Record:

- current branch
- current commit
- modified files
- test command
- build command
- typecheck command
- browser QA command

Run the existing baseline checks where practical.

If baseline failures already exist:

- identify them
- do not falsely attribute them to P40
- preserve evidence
- fix them only if they are in P40 scope or block certification

Never destroy unrelated user work.

---

# 4. REPOSITORY AUDIT

Perform a real dependency audit.

Find:

```text
P39 recommendation
      ↓
recommendation launch
      ↓
activity route
      ↓
activity state
      ↓
attempt/result
      ↓
existing learning result
      ↓
competency
      ↓
SM-2
      ↓
Learning OS
```

Also inspect:

```text
P38 Praise
Parent Mode
Kid's Box
Persistence
Migration
Sanitization
QA
```

Output the architecture internally and implement against the actual code.

Do not redesign the application.

---

# 5. IMPLEMENT P40

Implement the smallest canonical Learning Outcome / Feedback Loop layer required.

Prefer extending existing models.

Only introduce new types when genuinely necessary.

Conceptually support:

```text
STARTED
IN_PROGRESS
COMPLETED
PARTIAL
ABANDONED
INVALID
UNAVAILABLE
```

Do not force states that the existing activity architecture cannot truthfully provide.

---

# 6. START ≠ COMPLETE

This is a hard requirement.

Launching an activity means:

```text
STARTED
```

NOT:

```text
COMPLETED
```

Completion requires the real activity result.

Leaving the activity early must not generate a fake completion.

A valid partial result must remain:

```text
PARTIAL
```

An invalid result must remain:

```text
INVALID
```

---

# 7. CANONICAL OUTCOME

Create/use one canonical outcome representation.

It should capture, where real data exists:

```text
outcomeId
activityId
activityType
domain
competencyId
sourceRecommendationId
startedAt
completedAt
status
score
maxScore
accuracy
attempts
duration
errors
evidenceQuality
createdAt
```

Do NOT invent values.

If data does not exist:

```text
UNAVAILABLE
```

rather than a guessed value.

---

# 8. EVIDENCE QUALITY

Implement or reuse evidence quality:

```text
HIGH
MEDIUM
LOW
INVALID
```

Examples:

```text
real completed activity + valid score
→ HIGH

real partial result
→ MEDIUM

started only
→ LOW

malformed result
→ INVALID
```

P39 must never interpret INVALID evidence as valid learning progress.

---

# 9. EXISTING LEARNING ENGINE IS SOURCE OF TRUTH

Do NOT create:

```text
Second competency engine
Second SM-2 engine
Second scoring engine
Second learning-state engine
```

Use the existing Learning Engine.

Correct architecture:

```text
REAL ACTIVITY RESULT
        ↓
EXISTING LEARNING ENGINE
        ↓
COMPETENCY / SM-2
        ↓
P40 OUTCOME
        ↓
LEARNING OS EVIDENCE
        ↓
P39
```

If the existing activity already updates competency/SM-2, consume that canonical result.

Do not double-apply it.

---

# 10. SCORE NORMALIZATION

When real data contains:

```text
score
maxScore
```

derive accuracy.

Example:

```text
4 / 6
→ 0.666...
```

Only derive it when both values are valid.

If score is missing:

```text
accuracy = unavailable
```

If malformed:

```text
INVALID
```

Never manufacture scores.

---

# 11. DUPLICATE SAFETY

Outcome recording must be idempotent.

The same completion event delivered twice must NOT:

- double count attempts
- double update competency
- double update SM-2
- duplicate evidence
- distort P39
- duplicate praise

Use existing event IDs when available.

Otherwise implement the smallest deterministic identity mechanism possible.

Add explicit tests.

---

# 12. PERSISTENCE

Extend the existing Learning OS store.

Do NOT create a parallel persistence architecture.

If schema migration is required:

```text
versioned migration
+
sanitization
+
backward compatibility
```

Required invariant:

```text
record outcome
→ reload
→ same outcome
→ same evidence
→ same recommendation
```

---

# 13. CORRUPTION SAFETY

Test:

```text
empty state
corrupt state
partial outcome
unknown status
missing score
invalid timestamp
duplicate event
```

Use existing P30/P39 recovery semantics.

Corruption must never become fabricated learning progress.

If evidence cannot be trusted:

```text
DISCOVERY_NEEDED
```

or the repository's canonical safe state.

---

# 14. P39 INTEGRATION

After a valid outcome:

```text
OUTCOME
 ↓
EVIDENCE UPDATE
 ↓
P39 RE-EVALUATION
```

The recommendation may change only because the evidence actually changed.

Do not hardcode recommendation changes.

Use the existing P39 policy.

Preserve:

```text
A DISCOVERY
B REMEDIATION
C SM2_DUE
D PROGRESS
E BALANCED
F NO-SPEED
G DETERMINISTIC
DAILY TOGGLE
PARENT REPORT
```

---

# 15. DECISION DETERMINISM

Given identical:

```text
Learning State
+
Outcome History
+
Policy
```

the result must be identical.

Test multiple executions.

No accidental:

```text
random()
unstable sorting
render-order dependence
hidden mutable state
```

unless explicitly part of existing policy.

---

# 16. FEEDBACK LOOP

Implement the real lifecycle:

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

Do not require unsupported lifecycle states.

Represent unavailable information honestly.

---

# 17. PRAISE ENGINE P38

P38 must remain intact.

Praise must be based on the real outcome, NOT merely the recommendation launch.

Bad:

```text
launch
→ "Great job!"
```

Correct:

```text
valid outcome
→ P38
→ context-appropriate praise
```

English activities must preserve English praise behavior already certified in P38.

Do not duplicate Praise Engine logic.

Run the full P38 suite after implementation.

---

# 18. KID'S BOX

Preserve exactly:

```text
CURRENT_UNIT
track merge
Path E BALANCED
no remediation drowning
```

Outcome feedback must improve evidence without turning one poor result into excessive remediation.

Do not hardcode Kid's Box decisions.

Use P39.

Run Kid's Box regression.

---

# 19. PARENT MODE

Parent Mode must truthfully expose the new outcome information where appropriate.

Possible:

```text
Last activity
Outcome
Score
Evidence
What changed
Next best action
```

Do not expose internal machine IDs to the child.

Reuse existing:

```text
parent-decision-report
parent-next-best
```

Do not break Ba Mẹ gate.

---

# 20. CHILD UX

Child-facing UI should remain simple:

```text
Activity
↓
Result
↓
Praise
↓
Next step
```

Never expose:

```text
evidenceQuality
decisionId
policyCode
storage state
migration state
internal reason code
```

unless already part of an intentional parent-only explanation.

---

# 21. "VÌ SAO?"

Reuse P39's existing explanation.

If the recommendation changed because of a real outcome, explanation must reference actual evidence.

No fabricated explanation.

Maintain:

```text
aria-expanded
keyboard accessibility
focus behavior
```

---

# 22. REACT / EVENT SAFETY

Outcome recording MUST NOT happen because:

```text
component rendered
route mounted
card rendered
modal opened
state rehydrated
```

Only actual activity lifecycle events can record outcomes.

Test:

```text
render × N
→ outcome count unchanged
```

---

# 23. PERFORMANCE

Do not recompute the entire Learning OS on every render.

Correct:

```text
completion
→ record once
→ update evidence
→ recompute
```

Incorrect:

```text
every render
→ recompute entire decision engine
```

---

# 24. UNIT TESTS

Implement/extend tests for ALL:

```text
A STARTED
B COMPLETED
C PARTIAL
D ABANDONED
E INVALID
F SCORE NORMALIZATION
G MISSING SCORE
H DUPLICATE DELIVERY
I PERSISTENCE
J RELOAD
K DECISION UPDATE
L DETERMINISM
M CORRUPTION
N PRAISE
O KID'S BOX
P PARENT MODE
Q RENDER DOES NOT DUPLICATE
R MULTIPLE ACTIVITY TYPES
S LEGACY STATE MIGRATION
T UNKNOWN/FUTURE STATE
```

Do not merely test helper functions.

Test the real domain behavior.

---

# 25. BROWSER QA

Use the repository's existing browser QA infrastructure.

Execute a REAL browser flow:

```text
A
Open Learning OS
↓
B
Get P39 recommendation
↓
C
Launch recommended activity
↓
D
Actually perform activity
↓
E
Submit real result
↓
F
Verify outcome recorded
↓
G
Verify learning evidence updated
↓
H
Verify P39 recomputes
↓
I
Verify next recommendation
↓
J
Reload
↓
K
Verify persistence
↓
L
Open Parent Mode
↓
M
Verify parent report
↓
N
Verify Praise Engine
```

Do not mock the final completion in certification.

---

# 26. MOBILE QA

Run:

```text
375 × 667
```

Verify:

```text
no horizontal overflow
touch targets >= 44×44
result visible
next-best visible
Vì sao? usable
Parent Mode usable
praise visible
dialogs fit
```

---

# 27. ACCESSIBILITY

Run existing accessibility QA.

Verify:

```text
headings
accessible names
focus
dialogs
aria-expanded
keyboard
screen-reader meaningful labels
44×44 controls
```

No regressions from P39.

---

# 28. FULL REGRESSION

Run all repository tests.

At minimum:

```text
P30 storage
P31 English Content Factory
P32 adaptive
P34 mobile/PWA
P37 competition
P38 Praise Engine
P39 Decision Engine
P40 Outcome Feedback
```

If test commands differ, discover and use the actual repository commands.

---

# 29. TYPECHECK

Run the actual project typecheck.

Target:

```text
0 errors
```

Fix all P40-caused errors automatically.

Re-run.

---

# 30. BUILD

Run the canonical production build.

Target:

```text
PASS
```

If build fails:

```text
diagnose
→ fix
→ rebuild
```

Do not stop at the first fix.

---

# 31. CONSOLE / NETWORK

Real browser certification:

```text
Console errors = 0
Failed network requests = 0
```

Do not suppress errors.

Do not hide failures with:

```text
catch(() => {})
```

unless the failure is an intentionally handled unavailable state.

---

# 32. AUTO-FIX LOOP

Whenever a gate fails:

```text
IDENTIFY ROOT CAUSE
        ↓
PATCH
        ↓
TYPECHECK
        ↓
UNIT TEST
        ↓
BROWSER TEST
        ↓
REGRESSION
```

Do not stop after a superficial patch.

Continue until the root cause is resolved.

---

# 33. NO FAKE CERTIFICATION

Never write:

```text
PASS
```

unless actually proven.

Never claim:

```text
browser PASS
```

without running browser QA.

Never claim:

```text
0 console errors
```

without observing the browser console.

Never claim:

```text
0 network failures
```

without checking network activity.

Never claim:

```text
persistence PASS
```

without reload verification.

---

# 34. DOCUMENTATION

Create:

```text
docs/P40_LEARNING_OUTCOME_FEEDBACK_LOOP.md
```

Document the ACTUAL implementation:

- architecture
- lifecycle
- outcome model
- evidence quality
- duplicate protection
- persistence
- migration
- corruption recovery
- P39 integration
- P38 integration
- Kid's Box integration
- Parent Mode
- browser QA
- mobile QA
- accessibility
- limitations
- certification results

Do not document features that were not implemented.

---

# 35. FINAL FILE AUDIT

Before certification:

Inspect changed files.

Remove:

- dead code
- temporary debug logs
- console.log
- unused imports
- test hacks
- fake data
- mock production paths
- duplicated logic
- TODOs introduced by P40
- unsafe fallback values

Do not remove legitimate existing work.

---

# 36. GIT SAFETY

Do not reset or discard unrelated user changes.

At the end:

```bash
git status
git diff --stat
git diff
```

Review all P40 modifications.

Do NOT commit unless repository workflow explicitly requires autonomous commits.

If committing is already the established project workflow, use:

```text
feat(learning-os): add outcome feedback loop
```

Otherwise leave changes ready for review.

---

# 37. FINAL CERTIFICATION

Only after every real gate passes, produce:

```text
KHO BÁU TRI THỨC — P40
LEARNING OUTCOME & FEEDBACK LOOP

STATUS: PASS

Architecture:
AUDIT ................ PASS
CANONICAL INTEGRATION . PASS

Outcome Lifecycle:
STARTED ............... PASS
IN_PROGRESS ........... PASS
COMPLETED ............. PASS
PARTIAL ............... PASS
ABANDONED ............. PASS
INVALID ............... PASS

Evidence:
REAL .................. PASS
QUALITY ............... PASS
DUPLICATE SAFE ........ PASS
PERSISTENT ............ PASS

Learning Engine:
COMPETENCY ............ PASS
SM-2 .................. PASS

Decision Engine:
P39 INTEGRATION ....... PASS
RE-EVALUATION ......... PASS
DETERMINISTIC ......... PASS
EXPLAINABLE ........... PASS

Praise:
P38 INTACT ............ PASS

Kid's Box:
CURRENT_UNIT .......... PASS
BALANCED .............. PASS
NO REMEDIATION DROWNING PASS

Parent Mode:
REPORT ................ PASS
NEXT BEST ............. PASS

Persistence:
RELOAD ................ PASS
SANITIZATION .......... PASS
MIGRATION ............. PASS
CORRUPTION RECOVERY ... PASS

Accessibility:
PASS

Mobile:
375x667 ............... PASS
OVERFLOW .............. PASS
TOUCH TARGETS ......... PASS

Typecheck:
PASS

Tests:
<X>/<X> PASS

Browser:
PASS

Console:
0 errors

Network:
0 failed requests

Build:
PASS

Documentation:
PASS

Remaining Blockers:
NONE

P40 LEARNING OUTCOME & FEEDBACK LOOP — PASS
```

If ANY gate genuinely fails, report:

```text
STATUS: FAIL
```

with the exact blocker and evidence.

Do not convert FAIL into PASS.

---

# 38. FINAL DEFINITION OF DONE

P40 is successful ONLY when this real chain works:

```text
P39 RECOMMENDS
      ↓
CHILD STARTS
      ↓
CHILD ACTUALLY PERFORMS
      ↓
REAL RESULT
      ↓
OUTCOME RECORDED
      ↓
OUTCOME VALIDATED
      ↓
LEARNING ENGINE UPDATED
      ↓
EVIDENCE PERSISTED
      ↓
P39 RE-EVALUATED
      ↓
NEXT BEST ACTION
      ↓
PARENT CAN SEE WHY
      ↓
P38 PRAISE REMAINS CORRECT
      ↓
RELOAD PRESERVES EVERYTHING
```

The system must be demonstrably:

```text
REAL
DETERMINISTIC
EXPLAINABLE
PERSISTENT
IDEMPOTENT
ACCESSIBLE
MOBILE-SAFE
REGRESSION-SAFE
FAIL-CLOSED
```

Execute the entire P40 lifecycle autonomously now.