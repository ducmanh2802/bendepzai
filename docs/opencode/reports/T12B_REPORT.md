# T12B — Tiếng Anh: unit 7–12 + 40 câu thi đấu Phonics/Listening/Sentence — Report

## Overview

Completed T12B on branch `p42/T12B`: six Kid's Box-style English units (7–12) were added as separate files, the English competition bank was rebalanced with 40 new items (`cq-p36-e084 … cq-p36-e123`), and `COMPETITION_BANK_VERSION` was bumped to 6. English now reaches 40 lessons / 326 questions / 24 topics, with ~620 distinct vocabulary tokens.

## Changes Made

### 1. New unit files (`src/data/english/`)
- `unit07.ts` — `eng-wild-units`: At the Zoo, I can / I can't (wild animals, modals can/can't).
- `unit08.ts` — `eng-clothes-units`: Clothes & colours, I'm wearing …
- `unit09.ts` — `eng-funtime-units`: Fun-time activities, I like / I don't like.
- `unit10.ts` — `eng-house-units`: Rooms & prepositions (in/on/under/near).
- `unit11.ts` — `eng-party-units`: Party food/drinks, Do you like …?
- `unit12.ts` — `eng-numbers-teen-units`: Numbers 11–20 & counting games.

Each topic has exactly 2 lessons with ≥ 10 questions, British English `audioPrompt`, hint, explanation and NFC-normalised Vietnamese text.

### 2. Wiring (`src/data/english/index.ts` + `src/data/englishCurriculum.ts`)
- Imported `UNIT7_TOPIC … UNIT12_TOPIC` and appended them to `ENGLISH_UNIT_TOPICS`.
- `ENGLISH_TOPICS_RAW` keeps using `...ENGLISH_UNIT_TOPICS`, so no rewrite of the large curriculum literal was needed.

### 3. Competition bank (`src/data/competitionBankP36.ts` + `src/data/competitionQuestions.ts`)
- Added 40 English items `cq-p36-e084 … cq-p36-e123` (Phonics/Listening/Sentence).
- Bumped `COMPETITION_BANK_VERSION` to 6.
- English competition items: 162 total.

### 4. Bundle split (`vite.config.ts`)
- Added `english-bank` manual chunk for `src/data/english/` and `src/data/englishCurriculum.ts`, keeping the entry chunk within budget.

### 5. Tests (`tests/t12b-english-units.test.ts`)
- Task-level acceptance: ≥ 30 lessons, ≥ 300 questions, ≥ 250 distinct words; topic ids exist with 2 lessons each of ≥ 10 questions; unique ids; audioPrompt/hint/explanation/NFC; option correctness; bank version 6; e084–e123 presence.

## Verification

- **npm run typecheck**: PASS (no errors)
- **npm test**: PASS — 767 tests, 48 test files
- **npm run build**: PASS — vite built successfully

## Decisions

- Reused the interrupted run's already-committed unit files and competition edits instead of regenerating them, to avoid duplication and 504 timeouts.
- No new dependency added; content is self-contained TypeScript data; British English audio prompts via existing `audioPrompt` field.

## Remaining

- None. Task report and `.ai/CURRENT.md` updated; ready to merge by auto-runner.

## Merge

After merging latest main into p42/T12B, the only file with conflict markers was vite.config.ts (manual chunk comment for the English/math banks). Resolved by keeping both T12B and T11C comments and both chunk rules; all other changes from main (T11C math units, T16/T17B games and tests) were retained alongside T12B English content, and .ai/CURRENT.md keeps lines from both sides. Verification after merge: npm run typecheck, npm test (832 passes) and npm run build all pass.
