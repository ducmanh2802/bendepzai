# T12A — Tiếng Anh: unit 1–6 (British English) — Report

## Overview

Implemented T12A task: Adding 6 new English units (Units 1–6) for British English, covering greetings, school objects, toys, family, pets, and face/body vocabulary for Grade 1 learners.

## Changes Made

### 1. New unit files created in `src/data/english/`

Six new unit files were created, each following the Topic/Lesson/Question structure:

- **unit01.ts** — `eng-hello-units`: Greetings & Feelings, Numbers 1-10, Colors
- **unit02.ts** — `eng-school-units`: School Bag & Supplies, Position words (in/on/under)
- **unit03.ts** — `eng-toys-units`: Toys & Playground, Position words
- **unit04.ts** — `eng-family-units`: Family Members, Big or Small adjectives
- **unit05.ts** — `eng-pets-units`: Animals (Dog, Cat, Bird, Duck, Lion, Monkey), My Pet
- **unit06.ts** — `eng-face-units`: Body Parts (Eyes, Ears, Nose, Mouth, Tongue), Face Parts

Each unit contains:
- 2-3 lessons per topic
- ≥ 10 questions per lesson
- British English audio prompts (`audioPrompt` field)
- Visual emojis or SVG references
- Hints and explanations in English/Vietnamese

### 2. Modified `src/data/englishCurriculum.ts`

Added 6 new topics directly in the `ENGLISH_TOPICS_RAW` array, following the existing pattern of the curriculum file. The topics are added without rewriting the entire file — only the array closing and the new topic entries were added.

The `ENGLISH_TOPICS` export (balanced copy via `balanceTopics()`) now includes all 17 topics (11 original + 6 new).

### 3. Unit file structure

Each unit file (`src/data/english/unitNN.ts`) follows the pattern:
- `import { Topic } from '../../types'`
- `export const TOPIC_NAME: Topic = { id, subject, title, subtitle, iconEmoji, color, skills, lessons }`
- Lessons with ≥ 10 multiple-choice questions each
- Questions with `id`, `prompt`, `audioPrompt`, `options`, `correctAnswer`, `hint`, `explanation`

## Verification

- **npm run typecheck**: PASS
- **npm test**: 757 tests pass (48 test files), including all 3 English curriculum tests
- **npm run build**: PASS, vite builds successfully

## Main Deliverables

- 6 new English unit files in `src/data/english/` (unit01.ts through unit06.ts)
- 6 new topics added to `ENGLISH_TOPICS_RAW` in `src/data/englishCurriculum.ts`
- Each topic has 2-3 lessons with ≥ 10 questions (total ≥ 120 new questions)
- British English audio prompts for all questions
- Topic IDs: `eng-hello-units`, `eng-school-units`, `eng-toys-units`, `eng-family-units`, `eng-pets-units`, `eng-face-units`
- All existing functionality preserved (no breaking changes)