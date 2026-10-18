# BASELINE AUDIT REPORT — Adaptive Learning Upgrade
## Date: 2026-10-11

### Repository State
- Branch: main, clean working tree
- Stack: React 19 + TypeScript 7 + Vite 8 + Tailwind CSS 4 + Vitest 5
- Baseline: 330 tests passing across 21 test files

### Architecture Overview
The app has a sophisticated multi-layer learning system:
- **StorageService** (1367 lines): Versioned localStorage persistence with migration chain P28→P30
- **LearningOS** (594 lines): Evidence reduction, mastery scoring, next-best-action pipeline
- **DecisionEngine** (1383 lines): Priority scoring, session planning, parent reports
- **AdaptiveService** (341 lines): Daily review generation, parent diagnostics
- **CompetitionEngine** (747 lines): Exam assembly, grading, readiness assessment
- **ReadingEngine** (629 lines): 5-stage reading fluency ladder
- **KidBoxEngine** (914 lines): British English companion track
- **PraiseEngine** (672 lines): Language-parity praise system

### Key Findings

#### 1. Difficulty System (GAP: needs L1-L5)
- Current: `EvidenceDifficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE'` (4 levels)
- Curriculum questions: `difficulty: 1 | 2 | 3` (3 levels)
- No per-skill adaptive level tracking
- No progression rules based on accuracy thresholds
- No distinction between independent vs. assisted answers in difficulty progression

#### 2. Session Profiles (GAP: needs 4 configurable profiles)
- Current: QUICK(≤5min), STANDARD(10-15min), FULL(15-20min), RECOVERY, DISCOVERY
- No DEEP PRACTICE (25-30 questions) or EXTENDED CHALLENGE (35-40 questions)
- No percentage-based session composition (20/35/25/20)
- No parent-configurable session length
- No checkpoint/resume mechanism for long sessions

#### 3. Skill Profile (GAP: needs adaptive level tracking)
- `KnowledgeState` tracks: mastery, confidence, accuracy, attemptCount, consecutiveCorrect/Incorrect
- Missing: current demonstrated level, hint usage, independent vs. assisted counts, misconception categories, retention evidence

#### 4. Mastery & Review (PARTIAL: needs strengthening)
- Mastery: 4 attempts + 85% accuracy (legacy policy)
- No distinction between independent and hinted answers for mastery
- Spaced review: 3-day interval when MASTERED
- No remediation trigger for repeated failure
- Session completion ≠ mastery (already correct in design)

#### 5. Question Quality (PARTIAL: needs anti-guessing)
- Competition bank has 360+ items with quality gates
- Curriculum questions: 4-6 per lesson, difficulty 1-3
- No duplicate detection within sessions
- No balanced answer positions in curriculum questions
- No misconception-based distractors in curriculum questions

#### 6. Parent Mode (PARTIAL: needs evidence-based insights)
- Shows: subject mastery %, weak/strong skills, reading metrics
- Missing: per-skill difficulty level, independent vs. assisted accuracy, session completion evidence, recommended next practice

#### 7. Audio & Praise (GOOD: already solid)
- Question audio routing prevents answer leaks
- Praise engine enforces language parity (EN praise = English, VI praise = Vietnamese)
- No unexpected autoplay (parent-controlled)

### Root Causes
1. Difficulty is a static label, not an adaptive system
2. Session length is hardcoded in engine, not configurable
3. No skill-level progression tracking
4. No session composition strategy
5. Curriculum questions lack anti-guessing measures

### Implementation Plan
1. Add `AdaptiveLevel` type (L1-L5) and `SkillProfile` interface
2. Add adaptive difficulty policy to `policy.ts`
3. Implement `AdaptiveDifficultyService` with progression rules
4. Add session profiles and composition to policy
5. Implement `SessionComposer` service
6. Enhance `KnowledgeState` with adaptive fields
7. Add question quality validators
8. Enhance parent dashboard with evidence-based insights
9. Write comprehensive tests for all new systems
