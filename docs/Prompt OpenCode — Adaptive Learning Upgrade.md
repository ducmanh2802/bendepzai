# MASTER PROMPT — KHO BÁU TRI THỨC LỚP 1
## Adaptive Difficulty + Deep Practice + Longer Learning Sessions

You are the autonomous senior engineer, educational game designer, assessment specialist, QA engineer, and release manager for the existing application "Kho Báu Tri Thức — Lớp 1".

Your mission is to AUDIT, IMPLEMENT, TEST, FIX, AND CERTIFY the application end-to-end.

Do not merely propose changes. Inspect the repository, modify the actual source code, run tests, fix regressions, and produce a final certification report.

## 1. NON-NEGOTIABLE RULES

1. Inspect the existing repository, architecture, roadmap, package scripts, documentation, and tests before modifying anything.
2. Preserve the existing technology stack and established project conventions.
3. Preserve all existing working features, learning content, progress records, parent controls, and local persistence.
4. Never delete or reset real user progress to make tests pass.
5. Never fabricate test results or claim a command passed without executing it.
6. Do not replace real learning logic with mocks, random scores, fake progress, or decorative UI.
7. No UI-only difficulty changes. Difficulty must be reflected in actual questions, distractors, progression rules, assessment, and review scheduling.
8. Implement the changes, rather than stopping after an audit or implementation plan.
9. Work in small, verifiable stages. Run targeted tests after each major change and the full regression suite before completion.
10. Do not introduce paid APIs, unnecessary dependencies, or infrastructure without a compelling reason.
11. Keep the app usable on mobile devices, including a 375 × 667 viewport.
12. Follow existing audio behavior: questions must not unexpectedly autoplay; the child should be able to read first and tap the speaker button when needed.
13. English encouragement must remain in English and match the praise text actually displayed.
14. Do not change trading, finance, or unrelated applications. This task concerns only the learning app repository.

## 2. PHASE 0 — REPOSITORY DISCOVERY

Identify the correct repository and inspect:

- Current branch, working tree, recent commits, and project instructions.
- All curriculum modules for Vietnamese, Mathematics, and English.
- Existing lessons, exercises, question generators, game mechanics, difficulty metadata, scoring, and retry behavior.
- Learning states, mastery rules, review scheduling, and adaptive algorithms.
- The existing "Ôn tập hôm nay" flow.
- Parent Mode, learning insights, and settings.
- Audio playback, answer feedback, accessibility, and responsive UI.
- Local persistence and migration/versioning logic.
- Existing automated tests and build/deployment scripts.

Search for:
- Lessons with too few questions.
- Repeated or trivially predictable questions.
- Questions that can be answered without understanding the concept.
- Difficulty labels that do not correspond to actual difficulty.
- Incorrect answers that immediately reveal the answer without a meaningful retry.
- Mastery awarded after lucky guesses or too few attempts.
- Exercises that are too short to provide meaningful practice.
- Broken curriculum links, orphaned lessons, and missing review questions.
- Any path that can corrupt or reset persisted learning progress.

Write a baseline audit report before implementation, but continue working immediately afterward.

## 3. PHASE 1 — REAL ADAPTIVE DIFFICULTY ENGINE

Build on the existing learning architecture. Avoid creating a duplicate engine if an appropriate one already exists.

Implement five meaningful difficulty levels:

L1 — FOUNDATION
- Identify, recognize, match, and answer simple questions.
- Clear instructions and supportive feedback.
- Used when the child is first learning a concept.

L2 — BASIC APPLICATION
- Apply a learned concept in a familiar situation.
- Require the child to recall rather than only recognize.
- Include plausible but age-appropriate distractors.

L3 — CHALLENGE
- Combine two related skills.
- Require multiple reasoning steps where appropriate.
- Include changed wording, changed examples, and unfamiliar arrangements.
- Reduce repetitive hints.

L4 — ADVANCED GRADE-1 PRACTICE
- Multi-step problems appropriate to the child's actual curriculum.
- Mixed question formats and transfer of knowledge to new examples.
- Require independent reasoning and explanation where suitable.
- Include carefully designed distractors targeting common misconceptions.

L5 — MASTERY CHALLENGE
- Novel problems, reasoning, error detection, and application in new contexts.
- Use harder variants of concepts the child has already learned.
- Never introduce unsupported advanced content merely to make questions harder.
- Provide scaffolding when the child struggles.

Difficulty must be specific to each skill, not a single global label for the entire child.

Maintain a skill profile using existing persisted structures where possible:

- Current demonstrated level.
- Recent accuracy.
- Number of independent correct answers.
- Number of attempts and retries.
- Hint usage.
- Response time, only when reliable and appropriate.
- Recurring misconception categories.
- Last practiced time.
- Evidence of retention on later review.

Do not rely on speed alone to assess learning. Never penalize a child for reading slowly.

### Adaptive progression

Implement configurable and tested progression rules:

- Start new skills at L1 or L2 according to available diagnostic evidence.
- Increase difficulty after repeated independent success across different questions.
- Use approximately 80–90% accuracy over a meaningful sample as a starting progression criterion; calibrate this using the actual question volume.
- If accuracy drops substantially, reduce difficulty temporarily or provide scaffolding.
- Do not lower the level permanently because of one mistake.
- Reassess after support and later practice.
- Distinguish independent answers from answers obtained after hints.
- Do not award mastery based on a tiny sample or repeated copies of the same question.

Store rules in a centralized, testable configuration rather than scattering magic numbers throughout components.

## 4. PHASE 2 — MAKE LEARNING SESSIONS LONGER AND MORE EFFECTIVE

The current learning experience must provide meaningful practice, not just a few easy questions followed by a completion screen.

Create configurable session profiles:

QUICK PRACTICE
- Approximately 8–10 questions.
- Suitable for a short review.

STANDARD PRACTICE
- Approximately 15–20 questions.
- Mix new questions, reinforcement, and previously learned material.

DEEP PRACTICE
- Approximately 25–30 questions.
- Multiple difficulty levels.
- Mixed question formats.
- Spaced review of earlier skills.
- A checkpoint and a meaningful completion summary.

EXTENDED CHALLENGE
- Approximately 35–40 questions, available when appropriate.
- Break the session into smaller rounds.
- Provide optional pauses and a clear resume mechanism.
- Never force a six-year-old to complete a long session.
- Allow the parent to configure session length.

These counts are initial targets, not reasons to pad a lesson with duplicate or meaningless questions.

### Session composition

Build sessions from real curriculum content:

- 20% foundation and prerequisite reinforcement.
- 35% current-skill practice.
- 25% challenging application.
- 20% spaced review and mixed retrieval.

Treat these percentages as configurable defaults. Adjust for a new skill, a weak skill, or a skill that is already mastered. Never force advanced questions when prerequisites are missing.

### Session requirements

- No duplicate questions within a session unless repetition is intentional and pedagogically justified.
- Use meaningful variations rather than changing only names or numbers.
- Mix question formats when the skill supports them.
- Include short checkpoints after reasonable groups of questions.
- Offer a break or early finish without shame or punishment.
- Save progress incrementally and resume safely after refresh or app restart.
- Show progress by completed questions and skills practiced.
- Keep the child informed about what remains, without creating anxiety.
- Never use countdown pressure by default.
- Do not artificially delay the next question to make the session longer.

## 5. PHASE 3 — CURRICULUM-SPECIFIC CHALLENGE DESIGN

Audit every existing curriculum topic in Vietnamese, Mathematics, and English.

Do not invent a curriculum inventory. Discover the real modules in the repository and produce a coverage matrix.

### A. VIETNAMESE — LỚP 1

Where supported by the actual curriculum, add or improve:

- Recognition of letters, vowels, consonants, and tones.
- Sound-to-letter and letter-to-sound mapping.
- Syllable construction and word formation.
- Reading words and age-appropriate sentences.
- Understanding the meaning of a short sentence or passage.
- Selecting the correct word in context.
- Detecting and correcting common spelling errors.
- Arranging words or sentences in a meaningful order.
- Short comprehension questions that require understanding, not guessing.
- Gradually increasing reading complexity within the Grade-1 curriculum.

Respect Vietnamese spelling, diacritics, phonetics, and regional pronunciation where applicable.

Do not mark a valid answer incorrect because of harmless normalization differences. Normalize text carefully without erasing distinctions that change meaning.

Do not introduce long passages that overwhelm a beginning reader. Increase reading difficulty gradually.

### B. MATHEMATICS — LỚP 1

Use only concepts supported by the app's actual curriculum and the child's current learning stage.

Potential challenge types include:

- Number recognition, ordering, comparison, and number decomposition.
- Addition and subtraction within the supported number range.
- Missing-number equations.
- Multiple representations of the same number.
- Simple word problems requiring the child to identify relevant information.
- Two-step reasoning when prerequisites are mastered.
- Finding and correcting a mathematical mistake.
- Choosing between plausible solutions and explaining why.
- Applying learned operations in unfamiliar but age-appropriate situations.

For example, if addition and subtraction within 10 are already taught, progress from:

3 + 2 = ?

to:

□ + 3 = 7

then:

Lan has 4 pencils. Her friend gives her some more pencils. Now she has 7. How many pencils did her friend give her?

Use examples appropriate to the lesson's verified number range. Do not expose a beginner to an advanced concept merely because it is classified as L5.

### C. ENGLISH — EXISTING CAMBRIDGE / KID'S BOX CONTENT

Discover the actual English vocabulary, grammar, topics, and learning objectives already included in the application.

Where supported, progressively challenge:

- Vocabulary recognition and recall.
- Word-to-picture matching.
- Listening discrimination when audio assets support it.
- Completing simple sentences.
- Selecting words based on context.
- Recognizing differences between similar words.
- Building short sentences from known vocabulary.
- Understanding simple questions and instructions.
- Retrieval of previously learned vocabulary in later sessions.

Respect the child's current English level. Do not silently introduce advanced grammar or vocabulary unrelated to the existing syllabus.

All English praise must remain in English and exactly match the text displayed on screen.

### Content integrity

Every question must have:
- A stable identifier.
- A skill or learning objective.
- A justified difficulty level.
- A correct answer or answer-validation rule.
- Plausible distractors where relevant.
- An explanation or feedback strategy.
- A source or curriculum reference when available.
- A misconception tag where meaningful.

Never generate unverified questions dynamically and treat them as authoritative curriculum content without validation.

## 6. PHASE 4 — QUESTION QUALITY AND ANTI-GUESSING

Audit the real question bank and question generation system.

Implement or strengthen:

- Distractors based on realistic child misconceptions.
- Balanced answer positions.
- Protection against obvious answer-length or formatting clues.
- Avoidance of predictable answer sequences.
- Controlled variation of question parameters.
- Duplicate detection using normalized question content and skill metadata.
- Deterministic seeded generation for reproducible tests.
- Strict validation that each question has at least one valid answer.
- Validation that multiple-choice questions have the expected number of distinct options.
- Detection of ambiguous or conflicting correct answers.
- Meaningful feedback after an incorrect answer.

Do not make questions harder by making them confusing, grammatically incorrect, unfair, or dependent on trick wording.

Where appropriate, let the child retry before showing the solution. Provide a hint that supports reasoning rather than immediately revealing the answer.

Record learning evidence without storing unnecessary sensitive information.

## 7. PHASE 5 — MASTERY, REVIEW, AND RETENTION

Strengthen the existing learning-state model without breaking backward compatibility.

Preserve and correctly integrate existing states such as:

NOT_STARTED
LEARNING
PRACTICING
MASTERED
NEEDS_REVIEW

Requirements:

- Mastery must be skill-specific.
- Repeated identical questions must not inflate mastery.
- Hinted answers must be recorded separately from independent answers.
- Weak skills should reappear in later sessions.
- Mastered skills should still receive occasional spaced retrieval.
- A single mistake must not erase previous mastery evidence.
- Repeated failure should trigger remediation and prerequisite review.
- Session completion must not automatically mean skill mastery.
- The daily review should contain actual questions selected from learning evidence, not random filler.

Use the existing review scheduling mechanism if it is sound. Otherwise implement a simple, deterministic, explainable scheduler that can be tested.

Persist session state, question history, skill evidence, and review scheduling safely.

Add backward-compatible migrations only when required. Test old persisted state and recovery from malformed or partially missing state.

## 8. PHASE 6 — PARENT MODE AND LEARNING INSIGHTS

Enhance the existing Parent Mode rather than building a disconnected dashboard.

Display useful, evidence-based information:

- Skills practiced during the selected period.
- Current difficulty level by skill.
- Independent accuracy versus assisted accuracy.
- Skills that need reinforcement.
- Retention on later review.
- Session duration and completed questions.
- Whether a session ended early or was completed.
- Recommended next practice based on real learning evidence.

Offer parent controls for:

- Default session length.
- Whether to include advanced questions.
- Maximum difficulty by subject or skill.
- Review intensity.
- Optional breaks.

Protect child-facing screens from unnecessary complexity.

Never label a child as unintelligent, lazy, or incapable. Use constructive language such as "Cần luyện thêm", "Đang tiến bộ", and "Đã nắm vững".

Do not turn the experience into a punitive streak or leaderboard system.

## 9. PHASE 7 — UX, AUDIO, ACCESSIBILITY, AND PERFORMANCE

Verify:

- All existing games still work.
- Audio buttons play the intended question or vocabulary, never the first answer by mistake.
- Questions do not autoplay unexpectedly.
- Progress indicators accurately reflect actual session state.
- Retry, hint, skip, pause, resume, and finish behavior are consistent.
- The app handles rapid taps without duplicate submissions.
- No progress is lost after refresh or restart.
- Layout remains usable at 375 × 667 and larger screen sizes.
- Vietnamese text and diacritics render correctly.
- English praise remains in English and matches the displayed text.
- Parent controls remain appropriately gated.
- No inaccessible low-contrast text or tiny essential touch targets are introduced.

Do not redesign the entire application unnecessarily. Keep the existing visual identity unless a genuine usability problem requires a targeted improvement.

## 10. PHASE 8 — TESTING AND REGRESSION

Create or update automated tests for:

### Adaptive difficulty
- New skill starts at the correct level.
- Independent success can increase difficulty.
- Assisted success does not incorrectly count as independent mastery.
- Failure triggers appropriate support.
- A single mistake does not cause unstable level oscillation.
- Difficulty remains specific to each skill.

### Session engine
- All four session profiles produce valid sessions.
- Session lengths follow configured targets when enough valid content exists.
- Sessions do not contain accidental duplicates.
- Shortage of valid questions is reported honestly.
- Pausing and resuming preserve state.
- Early finishing is supported.
- Progress counters are accurate.

### Curriculum and question quality
- Every question references a valid skill.
- Every answer key is valid.
- Every question has a valid difficulty.
- Multiple-choice options are distinct.
- Question generation is reproducible under a fixed seed.
- Grade-1 scope restrictions are enforced.
- Review questions are linked to real learning evidence.

### Persistence and compatibility
- Existing saved progress remains available.
- Legacy states load correctly.
- Partial or malformed data fails safely.
- Migration does not reset learning history.
- Reloading the app does not duplicate progress events.

### End-to-end and UI
- Complete a lesson.
- Fail an answer and retry.
- Request a hint.
- Finish a deep-practice session.
- Pause and resume a session.
- Restart the app and recover progress.
- Open Parent Mode and inspect learning insights.
- Complete Vietnamese, Mathematics, and English practice.
- Verify speaker buttons and answer feedback.

Run:
1. Targeted unit tests.
2. Integration tests.
3. Type checking.
4. Linting where configured.
5. Production build.
6. Full regression test suite.
7. Existing mobile or end-to-end tests where available.

Do not weaken, delete, or skip existing tests to obtain a passing result.

## 11. PHASE 9 — ACCEPTANCE CRITERIA

The work is complete only when:

- The existing application builds successfully.
- Existing features and saved progress are preserved.
- Adaptive difficulty changes real question selection and challenge.
- All four session profiles work.
- Session length is configurable.
- Question quality checks are implemented and tested.
- Learning states and review scheduling remain consistent.
- Parent insights are derived from real persisted evidence.
- Audio and praise regressions are absent.
- Mobile layout remains usable.
- New and existing tests pass.
- All executed commands and their actual outcomes are recorded.

If any criterion fails, fix the root cause and rerun the relevant tests.

If a failure cannot be fixed safely, document it as BLOCKED with its evidence. Never falsely report PASS.

## 12. REQUIRED DELIVERABLES

Create or update appropriate project documentation, following existing conventions:

- Adaptive learning architecture and decision rules.
- Curriculum coverage and difficulty matrix.
- Session composition and duration configuration.
- Question quality audit.
- Persistence and migration notes.
- Test results and unresolved risks.
- A certification report, for example:
  docs/ADAPTIVE_LEARNING_CERTIFICATION.md

The final report must contain:

1. Initial audit findings.
2. Root causes found.
3. Files changed and why.
4. New learning behaviors.
5. Session-length configuration.
6. Test commands actually executed.
7. Actual pass/fail counts.
8. Build status.
9. Data-preservation verification.
10. Remaining limitations.
11. Final PASS, PARTIAL, or BLOCKED status.

## EXECUTION INSTRUCTION

Start now.

Inspect the repository first. Then execute every applicable phase in order.

Do not stop after producing the audit, plan, or documentation. Implement the actual code changes, run the tests, fix failures, and certify the result.

Do not ask for confirmation for ordinary implementation decisions that can be resolved safely from the existing codebase. If a critical ambiguity affects curriculum correctness or data integrity, choose the safest reversible behavior and document the decision.

At the end, provide a concise Vietnamese summary of what was actually changed, how the difficulty adapts, how session length works, the real test results, and any remaining blockers.