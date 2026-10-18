# P39 LEARNING OS DECISION ENGINE — CERTIFICATION

**Date:** 2026-10-06
**Status:** `P39 LEARNING OS DECISION ENGINE — PASS`
**Scope:** Evidence → Priority → Next Best Action → Daily Plan → Session Planner (autonomous implementation & certification)

---

## 1. Architecture

```text
Evidence sources (read-only)
  LearningOS store · Kid's Box store · Competition history · Parent settings
        ↓ collectEvidence()                 src/services/decisionEngine.ts
  quality (VERIFIED/PARTIAL/STALE/UNAVAILABLE)
  + freshness (RECENT/OLDER/STALE/UNKNOWN)
  + provenance (source, timestamp, subject, skill)
        ↓ aggregateSkillStates()
  SkillDecisionState[] + reasonCodes + needScore   (pure, deterministic)
        ↓ LearningOS.getNextBestActions()          (source of truth, unchanged)
  base candidates  ⊕ Kid's Box track actions  ⊕ subject-balance candidates
        ↓ toDecisionRecommendation() per candidate
  priority factors → priorityScore → reasonCodes → explanation (WHAT/WHY/HOW LONG)
        ↓ constraint filter (availability · fatigue · repetition)
        ↓ uniqueBySkill + RECOMMEND_MAX (5) + SM2_DUE pin
  DecisionOutput { mode, recommendations, nextBestAction, dailyPlan,
                   sessionPlan, parentReport, evidenceSummary }
        ↓
  UI: NextBestActionCard (child) · ParentDashboardModal insights (parent)
```

**Non-negotiables kept:**

| Rule | How |
|---|---|
| Learning Engine is source of truth | `LearningOS.reduceEvidence` / mastery / SM-2 / state untouched; Decision Engine only *reads* |
| Canonical statuses | `NOT_STARTED / LEARNING / PRACTICING / MASTERED / NEEDS_REVIEW` |
| No fake progress | No mastery/XP written by Decision Engine; recommendations are suggestions only |
| No peer comparison | No ranking vs other children anywhere in output |
| Determinism | Same `DecisionInput` (+ clock) → identical output; unit-tested |
| Reason codes | Every recommendation carries documented machine-readable codes |
| Honest cold start | `< 3` attempts → `DISCOVERY` + `insufficientEvidenceMessage`, never invented weakness |

**Files (P39 only):**

| File | Role |
|---|---|
| `src/types/decisionEngine.ts` | **NEW** — canonical P39 types |
| `src/services/decisionEngine.ts` | **NEW** — pipeline (~1.5k lines) |
| `src/config/policy.ts` | `P39_DECISION_POLICY` (weights, budgets, gates) |
| `src/components/learning/NextBestActionCard.tsx` | child-facing card rewrite |
| `src/components/parent/ParentDashboardModal.tsx` | parent decision report |
| `src/types/index.ts` | re-export `./decisionEngine` |
| `tests/decision-engine.test.ts` | **NEW** — 42 unit/adversarial tests |
| `tests/decision-engine-storage.test.ts` | **NEW** — StorageService golden-path C |
| `qa/decision-engine.mjs` | **NEW** — real-browser golden paths A–G |
| `qa/decision-engine-a11y.mjs` | **NEW** — mobile / 200% zoom / a11y probe |

---

## 2. Evidence model

- **Collector:** `DecisionEngine.collectEvidence` reads `StorageService.getLearningOSStore()`,
  Kid's Box (`buildKidBoxActions`), competition readiness (`CompetitionEngine.assessReadiness`),
  parent settings — never invents timestamps.
- **Normalizer:** per-skill `quality` from attempts/confidence; `freshness` from
  `lastPracticedAt` windows in `P39_DECISION_POLICY.FRESHNESS`; provenance on each
  evidence line in explanations.
- **Quality multipliers:** `VERIFIED 1 · PARTIAL 0.7 · STALE 0.4 · UNAVAILABLE 0` applied to
  accuracy-derived factors. **Exception:** `SM2_DUE` is a schedule fact and is never decayed.

---

## 3. Skill aggregation

`aggregateSkillStates(knowledgeMap, now)` maps each `KnowledgeState` →
`SkillDecisionState` with `reasonCodes`, `quality`, `freshness`, `needScore`.
Sorted by `needScore` desc, then `skillId` (stable tie-break).

`detectSkillReasonCodes` highlights: `SM2_DUE`, `NEEDS_REVIEW`, `REPEATED_ERRORS`,
`FOUNDATION_GAP`, `RECENT_ACCURACY_DROP`, `RECOVERY_AFTER_ERROR`,
`IMPROVEMENT_OPPORTUNITY`, `LOW_STABILITY`, `SPEED_SAFE`, reading-ladder codes.

---

## 4. Priority model

Named weights in `P39_DECISION_POLICY.WEIGHT` (no magic numbers in the engine):

```text
DISCOVERY_NEEDED 30 · SM2_DUE 45 · NEEDS_REVIEW 20 · FOUNDATION_GAP 18
REPEATED_ERRORS 15 · RECOVERY_AFTER_ERROR 14 · CURRENT_UNIT 14
RECENT_ACCURACY_DROP 12 · LOW_STABILITY 12 · NOT_PRACTICED_RECENTLY 10
SUBJECT_BALANCE 8 · IMPROVEMENT_OPPORTUNITY 6 · SPEED_SAFE 4 · AVAILABILITY_OK 2
Penalties: RECENT_REPETITION −20 · OVERPRACTICE −25 · FATIGUE −40
ACCURACY_BEFORE_SPEED / competition demotion applied as negative contributions
```

`priorityScore = Σ (weight × multiplier)` after dedup-by-code (highest contribution wins).

**Ladder (§13):** weak skill before mastered; speed only after accuracy gate;
competition only when readiness allows; current-unit context boosts English track.

---

## 5. Reason codes

All codes documented in `REASON_LABEL_VI` inside `decisionEngine.ts` and typed as
`DecisionReasonCode`. Parent UI shows codes under "Vì sao?" expandable explanation;
child sees only friendly `childExplanation` text.

---

## 6. Next Best Action

- Candidate pool = `LearningOS.getNextBestActions(core)` ⊕ Kid's Box tracks ⊕ balance candidates.
- Constraint filter drops `UNAVAILABLE` activities (dead-end prevention).
- Dedup by skill keeps the highest score; visible list = top 5 (`RECOMMEND_MAX`).
- **SM2_DUE pin:** a due spaced review can never be crowded out of the visible list
  by lower-signal discovery fillers (golden path C).
- `nextBestAction` = first available recommendation.

---

## 7. Daily plan & session planner

- **Daily plan:** title `ÔN TẬP HÔM NAY`, 3–5 items (`DAILY_PLAN.MIN/MAX`), budget-aware,
  each item carries `reason` (shown after toggle).
- **Session planner:** kinds `QUICK ≤5 · STANDARD 10–15 · FULL 15–20 · RECOVERY ≤5 · DISCOVERY`;
  respects parent `dailyLimitMinutes`; fatigue forces recovery/light game;
  phases `WARM_UP → PRACTICE → REINFORCEMENT → CHECK`.

---

## 8. Kid's Box logic

- Track actions merged with core candidates (a track never blindly outranks a measured
  `NEEDS_REVIEW` in another subject).
- `CURRENT_UNIT` reason when activity belongs to the active unit.
- Companion route always `AVAILABLE`.

---

## 9. Competition logic

- `assessReadiness()` mapped to `DecisionCompetitionReadiness`.
- Unstable accuracy → competition/mock demoted via `LOW_STABILITY` + `ACCURACY_BEFORE_SPEED`
  penalties; never surfaces as top NBA without `SPEED_SAFE`-class evidence.
- `SPEED_PRACTICE` blocked unless `recentAccuracy ≥ 80` and `consecutiveCorrect ≥ 3`.

---

## 10. Insufficient evidence behavior

- `totalAttempts < 3` → mode `DISCOVERY`, `insufficientEvidence = true`,
  Vietnamese message: *"Chưa đủ dữ liệu để xác định điểm yếu…"*
- Recommendations still launchable discovery activities with `DISCOVERY_NEEDED` codes —
  **never** a fabricated weakness.

---

## 11. Persistence

- Read path: `StorageService.getLearningOSStore()` → migrate → sanitize (P30).
- Decision Engine writes **nothing** to mastery/SM-2 stores.
- Recommendation history (for repetition control) is input-only (`DecisionInput.recommendationHistory`).

---

## 12. Recovery

- Corrupted/missing store → empty store → cold start discovery (honest).
- Idempotent: reload with same evidence → same recommendations (golden path G, browser).

---

## 13. Browser evidence (`qa/decision-engine.mjs` + `qa/decision-engine-a11y.mjs`)

Real Chromium (patchright) against `dist/` on `:4173`:

| Golden path | Result |
|---|---|
| A — New child → honest discovery | **PASS** — mode `DISCOVERY`, insufficient message, 3 launchable recs |
| B — Weak skill evidence → weak skill NBA | **PASS** — `remediate_math_subtraction_10` priority 79 + NEEDS_REVIEW/FOUNDATION_GAP/REPEATED_ERRORS |
| C — SM-2 due → review recommendation | **PASS** — `review_math_addition_10` with `SM2_DUE` at priority 55 |
| D — Improvement → recommendation changes | **PASS** — mode `PROGRESS`, `REPEATED_ERRORS` no longer on top |
| E — Kid's Box current-unit context | **PASS** — English track recs present, mode `BALANCED` |
| F — Unstable competition accuracy → no speed drill | **PASS** — no `SPEED_SAFE` on top rec; remediation leads |
| G — Persistence / reload determinism | **PASS** — store intact, identical top rec after reload |
| Daily plan toggle → reasons | **PASS** — 5 reason lines |
| Parent mode gate → decision report | **PASS** — `parent-decision-report` + `parent-next-best` |
| Mobile 375×667 | **PASS** — card visible, 0 horizontal overflow, **0 buttons under 44×44** |
| ~200% zoom (640×480) | **PASS** — card + 3 recs + 2490 body chars |
| A11y | **PASS** — heading present, "Vì sao?" named + `aria-expanded`, 6/6 start buttons named |
| Console errors | **0** |
| Failed requests | **0** |

---

## 14. Test evidence

```text
npm run typecheck  →  PASS (0 errors)
npm test           →  PASS — 330/330 in 21 files
                     (42 decision-engine + 1 storage golden-path C)
npm run build      →  PASS — index 626.49 kB / gzip 184.48 kB
```

Determinism, adversarial (hostile store, fake mastery attempts, availability dead-ends),
competition safety, subject balance, fatigue, repetition control covered in
`tests/decision-engine.test.ts`.

---

## 15. Known limitations

1. **Main bundle size** grew (Decision Engine ships with HomeScreen; ~626 kB / 184 kB gzip).
   Acceptable for P39; code-splitting `decisionEngine` behind a dynamic import is a follow-up.
2. **Page-level 200% zoom overflow** remains a pre-existing app-wide trait (noted in P38);
   the P39 card itself is usable at 640×480 with full content.
3. **Speed trials / mock readiness ladder** is mapped from `assessReadiness` but full
   mock-exam UX golden path is still owned by Competition lanes (P33/P36).
4. Recommendation history used for repetition control is currently input-supplied;
   wiring `recommendationHistory` from a persisted decision log is a natural next step.

---

## CERTIFICATION MATRIX

| Gate | Result |
|---|---|
| Evidence audit | **PASS** |
| Canonical Decision Engine | **PASS** |
| No fake progress | **PASS** |
| Deterministic recommendation | **PASS** |
| Reason codes | **PASS** |
| Next Best Action | **PASS** |
| Daily plan | **PASS** |
| Session planner | **PASS** |
| SM-2 integration | **PASS** |
| Learning Engine integration | **PASS** |
| Competition integration | **PASS** |
| Kid's Box integration | **PASS** |
| Praise Engine integration | **PASS** (P38 untouched surfaces; tests green) |
| Parent Mode | **PASS** |
| Persistence | **PASS** |
| Recovery | **PASS** |
| Mobile | **PASS** |
| 200% zoom | **PASS** (card usable; page-level overflow pre-existing) |
| Accessibility | **PASS** |
| Typecheck | **PASS** |
| Tests | **PASS** (330/330) |
| Build | **PASS** |
| Browser golden path | **PASS** (A–G) |
| Console errors | **PASS** (0) |
| Failed requests | **PASS** (0) |

---

## FINAL STATUS

```text
KHO BÁU TRI THỨC — P39
LEARNING OS DECISION ENGINE

STATUS: PASS

Evidence Engine:      collectEvidence — quality/freshness/provenance, no fabrication
Skill Aggregation:    pure normalize → SkillDecisionState + reasonCodes + needScore
Priority Engine:      named weights in P39_DECISION_POLICY; SM2_DUE=45 never decayed
Next Best Action:     LearningOS candidates ⊕ tracks, availability-filtered, SM2_DUE pin
Daily Plan:           ÔN TẬP HÔM NAY 3–5 items with reasons
Session Planner:      QUICK/STANDARD/FULL/RECOVERY/DISCOVERY, parent budget respected
SM-2:                 nextReviewAt → SM2_DUE → review recommendation (golden path C)
Competition:          readiness gates; no SPEED_SAFE without accuracy stability
Kid's Box:            CURRENT_UNIT context, track merge without drowning remediation
Praise Engine:        P38 intact — full suite green
Parent Mode:          Ba Mẹ gate → insights → parent-decision-report + reason codes
Persistence:          read-only on Learning OS store; P30 sanitize/migrate path
Recovery:             corrupt/empty store → honest discovery mode
Mobile:               375×667, no overflow, all touch targets ≥44×44
Accessibility:        headings, aria-expanded, named controls
Typecheck:            PASS
Tests:                PASS — 330/330
Build:                PASS — 626.49 kB / gzip 184.48 kB
Browser:              PASS — golden paths A–G + a11y/mobile/zoom probe
Console:              0 errors
Network:              0 failed requests
Files Changed:        types/decisionEngine.ts, services/decisionEngine.ts, policy.ts,
                      NextBestActionCard.tsx, ParentDashboardModal.tsx, types/index.ts,
                      tests/decision-engine*.ts, qa/decision-engine*.mjs
Documentation:        docs/P39_LEARNING_OS_DECISION_ENGINE.md, .ai/CURRENT.md
Remaining Blockers:   none
```

> **P39 is successful because every recommendation traces backward to real evidence,
> carries an explainable machine-readable reason, launches a real available activity,
> and changes when new evidence arrives — proven end-to-end in unit tests and a real
> browser.**
