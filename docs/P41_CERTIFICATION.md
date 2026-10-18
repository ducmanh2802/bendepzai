# P41 — CURRICULUM DEPTH & LEARNING QUALITY — CERTIFICATION REPORT

**Project:** Kho Báu Tri Thức — Lớp 1  
**Date:** 2026-10-11  
**Schema Version:** P41-v1  
**Status:** **PARTIAL** 🟡

> All executable gates pass (content validation, unit tests, typecheck, build, real-browser E2E).
> PARTIAL is declared **only** because the Phase-B aspiration of 8–12 distinct
> questions per active skill is not yet reached (bank is 2–6 per skill) and no
> session-practice **UI** exists, so QUICK/DEEP/pause-resume cannot be executed in
> a browser. Nothing is fabricated; both gaps are quantified below.

---

## 1. EXECUTIVE SUMMARY

| Gate | Command | Result |
|------|---------|--------|
| Content validation (all banks) | `runContentValidation()` via Vitest | **0 ERROR**, 0 curriculum WARNING |
| Unit + regression tests | `npx vitest run` | **401 / 401 pass** (24 files) |
| TypeScript | `npx tsc --noEmit` | **clean** |
| Production build | `npm run build` | **success** (1736 modules) |
| Browser E2E | `node qa/run-one.mjs qa/<probe>.mjs` | **5 / 5 probes, 0 errors** |

Baseline audit inherited from the Adaptive-Learning increment (reported 76
questions, 100% answer-index-0 bias). This increment expanded the lesson bank to
**111 validated questions**, eliminated the answer-position bias at the source,
repaired leaking hints and ambiguous items, added a permanent curriculum-quality
gate, and verified the wired flows in a real browser.

---

## 2. PHASE A — BASELINE AUDIT (ACTUAL)

Audited the real checkout (not the reported baseline):

- **Lesson bank before expansion:** 86 questions — VN 32, Math 33, English 21 (24 topics / 37 lessons).
- **Answer-position bias (headline defect):** 80 of 84 choice items (95%) placed the correct answer at `options[0]`.
- **Content validation:** 0 ERROR, 58 WARNING.
- **Zero-question skills:** `vn_alphabet_matching`, `vn_rhyme_am_ap`, `vn_word_building`, `vn_orthography_ng_ngh`.
- **One-question skills:** `vn_orthography_g_gh`, `vn_vocab_people`, `vn_vocab_objects`, `math_measurement`.
- **Missing difficulty 3:** Vietnamese and English.
- **Hint leaks:** ~18 `HINT_REVEALS_ANSWER` warnings.
- **Near-duplicates:** `vn-q3-2`/`vn-q3-1`, `vn-q5-2`/`vn-q5-1`.
- **Ambiguous multi-answer Math:** `math-q3-5`, `math-q4-5`, `math-q5-4`.
- **Duplicated distractor:** `vn-q7-4` (`'cạt'`/`'cạc'` collision).
- **UI reality check:** `sessionComposer` is referenced by engine/types/storage only — **no session-practice UI exists**, so QUICK/DEEP browser E2E is impossible without building UI (out of P41 scope; documented, not faked).

---

## 3. PHASE B — QUESTION BANK EXPANSION

Bank grew **86 → 111** (+25). Every new item has a stable ID, valid subject/skill
mapping, justified difficulty, unique options, non-leaking hint, and explanation.

### Vietnamese (+12)

| Question(s) | Skill | Difficulty |
|-------------|-------|------------|
| `vn-q2-4`, `vn-q2-5` (new lesson `vn-les-2b`) | `vn_alphabet_matching` | 1 |
| `vn-q6-3`, `vn-q6-4` (new lesson `vn-les-6b`) | `vn_rhyme_am_ap` | 1–2 |
| `vn-q7-3`, `vn-q7-4` (new lesson `vn-les-7b`) | `vn_word_building` | 2 |
| `vn-q8-4`, `vn-q8-5` (new lesson `vn-les-8b`) | `vn_orthography_ng_ngh` | 2 |
| `vn-q8-6` | `vn_orthography_g_gh` | 2 |
| `vn-q9-3` | `vn_vocab_people` | 1 |
| `vn-q9-4` | `vn_vocab_objects` | 1 |
| `vn-q13-3` | `vn_reading_comprehension` | 3 |

### Mathematics (+2)

| Question(s) | Skill | Difficulty |
|-------------|-------|------------|
| `math-q7-2` | `math_measurement` | 1 |
| `math-q7-3` | `math_measurement` | 2 |

### English (+11)

One higher-difficulty item added to each supported vocabulary skill, plus a
difficulty-3 challenge: `eng-q1-4`, `eng-q2-3`, `eng-q3-3`, `eng-q4-3`,
`eng-q5-3`, `eng-q6-3`, `eng-q7-3`, `eng-q8-3`, `eng-q9-3`, `eng-q10-3`,
`eng-q10-4`. Every English item carries an `audioPrompt`.

### Repairs

| Item | Repair |
|------|--------|
| `math-q3-5` | `7 < … < 10` (two valid answers) → `7 < … < 9` (single answer) |
| `math-q4-5` | ambiguous pair → "equal pair summing to 10" (unique answer) |
| `math-q5-4` | two options equal 5 → options reworked so only `9 - 4` equals 5 |
| `vn-q7-4` | duplicate distractor removed |
| ~20 items | hints rephrased to stop leaking the answer |
| `vn-q3-2`, `vn-q5-2`, `vn-q6-3`, `vn-q6-4` | prompts rephrased to break near-duplicates |

---

## 4. PHASE C — REAL CONTENT QUALITY GATES

### 4.1 Root cause of the answer-position bias (fixed at source)

`src/data/optionBalance.ts` (new) — a **pure, deterministic** rotator:

- `isBalanceable(q)` / `balanceOptionOrder(q, targetIndex)` / `balanceTopics(topics)`.
- Rotation target assigned **round-robin per option-length**, so distribution is
  guaranteed balanced rather than luck-dependent; no runtime randomness (tests
  stay reproducible).
- Relative option order is preserved; answer validation compares **values**, not
  indices, so nothing else breaks.

All three curriculum modules now export `balanceTopics(<SUBJECT>_TOPICS_RAW)`.
`*_RAW` exports are retained (and exported) so the gate can prove the transform
is deterministic.

**Before → after (correct-answer position):** 80/84 at index 0 (95%) → **`{0:29, 1:29, 2:27, 3:24}`** (max share 26.6%, `{EN: 8/8/8/8}` perfectly even).

### 4.2 Permanent gate

- `CURRICULUM_POLICY` added to `src/config/policy.ts` (`MIN_QUESTIONS_PER_SKILL: 2`,
  `MAX_ANSWER_POSITION_SHARE: 0.5`, `MIN_DIFFICULTY_LEVELS: 3`, version `P41-v1`).
- `buildCurriculumAnswerPositionReport()` added to `contentValidator.ts`; the
  per-subject share is now an **ERROR-level** check (`ANSWER_POSITION_BIAS`) inside
  `runContentValidation()` so it can never silently regress.
- `tests/curriculum-quality-p41.test.ts` (new, 13 tests) asserts: zero curriculum
  errors/warnings, balanced positions per subject, ≥2 questions per active skill,
  difficulty-3 present per subject, no ambiguous "between" items, fixed IDs stay
  fixed, deterministic balancing, and rotation purity.

### 4.3 Validation result (whole bank)

`runContentValidation()` → **0 ERROR**. Curriculum warnings: **0** (were 58).
Only 2 pre-existing competition `NEAR_DUPLICATE` WARNINGs remain (out of scope,
non-blocking, not introduced here).

---

## 5. PHASE D — SESSION QUALITY

Verified by unit tests (engine-only; **no UI** to drive in a browser):

- `tests/session-composer.test.ts` — QUICK 9 / STANDARD 18 / DEEP 28 / EXTENDED 38
  composition, interleaving (20/35/25/20 split), prerequisite gating,
  checkpoint/resume state, and shortage handling (shorter valid session, never
  duplicated filler).
- `tests/adaptive-difficulty.test.ts` — assisted answers do **not** inflate
  independent mastery; session completion does not auto-mark a skill MASTERED.

**Gap (documented):** pause/resume, early finish and QUICK/DEEP **progress** cannot
be exercised in a browser because the practice UI does not exist yet.

---

## 6. PHASE E — BROWSER E2E (REAL RUN)

Tooling: Playwright installed against the machine's pre-cached Chromium
(`chromium-1243`, launch via explicit `executablePath` to avoid a revision
mismatch). A generic runner was added: `qa/run-one.mjs <probe>` boots
`vite preview` and invokes any `qa/*.mjs` probe.

| Probe | Result |
|-------|--------|
| `qa/p41-curriculum-quality.mjs` (new) | **ok**, 0 errors |
| `qa/golden-path.mjs` | **0 errors** |
| `qa/decision-engine.mjs` | **0 errors** |
| `qa/offline-pwa.mjs` | **0 errors** |
| `qa/question-types.mjs` | **0 errors** |

### New P41 probe — real evidence

- 17 Vietnamese lessons listed; lesson opened and **completed**.
- 4 questions answered; rendered options `[4,4,4,4]` (all ≥ 3).
- **Correct option positions observed at runtime: `[0,1,2,3]`** — the bias fix is
  visible in the live DOM, not just in data.
- Persistence after play: `kho_bau_learning_os_store` → `schemaVersion: P41-v1`,
  `skillCount: 2`, `evidenceCount: 4`.
- Uncaught `pageerror`s: **0**; app console errors: **0** (network/font noise filtered).

### Golden-path persistence evidence

`xp` 210 before and after reload; `lessons 1`, `exams 2`, `reading 1` preserved;
sentinel `alive` (no storage wipe); `noDuplicateRewards` (210 → 210).

**Probe drift fixed:** the home "Next Best Action" card is now titled
“Hôm Nay Bé Nên Học Gì?”; `qa/golden-path.mjs` and `qa/offline-pwa.mjs` had stale
matchers and were updated (P39 label change, unrelated to this task).

---

## 7. PHASE F — REGRESSION RESULTS

```
npx tsc --noEmit            → clean
npx vitest run              → 401 passed / 401 (24 files)
npm run build               → success (1736 modules)
node qa/run-one.mjs qa/p41-curriculum-quality.mjs   → errors: []
node qa/run-one.mjs qa/golden-path.mjs              → errors: []
node qa/run-one.mjs qa/decision-engine.mjs          → errors: []
node qa/run-one.mjs qa/offline-pwa.mjs              → errors: []
node qa/run-one.mjs qa/question-types.mjs           → errors: []
```

A flaky 5s timeout in the O(n²) competition duplicate scan (pre-existing, exposed
under parallel worker startup) was made deterministic by setting
`test.testTimeout = 20000` in `vite.config.ts`.

---

## 8. COVERAGE MATRIX (POST-P41)

### Vietnamese — 44 questions

| Skill | Count | Difficulty |
|-------|-------|-----------|
| `vn_alphabet_vowel` | 4 | 1 |
| `vn_alphabet_consonant` | 3 | 1 |
| `vn_alphabet_matching` | 2 | 1 |
| `vn_tone_recognition` | 3 | 1 |
| `vn_tone_application` | 2 | 2 |
| `vn_rhyme_an_at` | 3 | 1–2 |
| `vn_rhyme_on_ot` | 2 | 1–2 |
| `vn_rhyme_am_ap` | 2 | 1–2 |
| `vn_syllable_blending` | 2 | 1–2 |
| `vn_word_building` | 2 | 2 |
| `vn_orthography_c_k` | 2 | 2 |
| `vn_orthography_g_gh` | 2 | 2 |
| `vn_orthography_ng_ngh` | 2 | 2 |
| `vn_vocab_people` | 2 | 1 |
| `vn_vocab_objects` | 2 | 1 |
| `vn_vocab_action` | 2 | 1 |
| `vn_sentence_ordering` | 2 | 2 |
| `vn_reading_comprehension` | 5 | 2–3 |

### Mathematics — 35 questions

| Skill | Count | Difficulty |
|-------|-------|-----------|
| `math_counting_10` | 6 | 1–2 |
| `math_number_recognition` | 3 | 1–2 |
| `math_comparison` | 5 | 1–3 |
| `math_addition_10` | 5 | 1–3 |
| `math_subtraction_10` | 5 | 1–3 |
| `math_geometry_shapes` | 2 | 1 |
| `math_measurement` | 3 | 1–2 |
| `math_numbers_20` | 2 | 1–2 |
| `math_calc_20` | 2 | 2 |
| `math_word_problems` | 2 | 2 |

### English — 32 questions

| Skill | Count | Difficulty |
|-------|-------|-----------|
| `eng_letters_phonics` | 4 | 1–2 |
| `eng_numbers_10` | 3 | 1–2 |
| `eng_vocab_colors` | 3 | 1–2 |
| `eng_vocab_animals` | 3 | 1–2 |
| `eng_vocab_family` | 3 | 1–2 |
| `eng_vocab_school` | 3 | 1–2 |
| `eng_vocab_body` | 3 | 1–2 |
| `eng_vocab_food` | 3 | 1–2 |
| `eng_vocab_toys` | 3 | 1–2 |
| `eng_greetings` | 4 | 1–3 |

**Zero-question active skills remaining: none.** **Difficulty 3 present in all three subjects.**

---

## 9. HARD CONSTRAINTS — PRESERVED

| Constraint | Evidence |
|-----------|----------|
| P38 Praise Engine / P39 Decision Engine intact | full suite + `decision-engine.mjs` E2E = 0 errors |
| Adaptive difficulty / persistence / migration | `learningOS` store reads `P41-v1`; golden-path reload preserves `xp 210` |
| Parent Mode intact | golden-path parent gate/tabs pass |
| No unexpected question autoplay | E2E records 0 unexpected audio starts |
| English praise stays English | English items keep English `audioPrompt`/praise |
| No real history reset | sentinel `alive`; `removals: []` |
| Deterministic decisions | pure `balanceTopics`; seeded selection tests green |
| No fabricated coverage/counts | every number in this report comes from the commands above |
| No duplicate filler questions | `runContentValidation()` duplicate gates = 0 ERROR |
| Existing tests not weakened | only the intentional timeout raise; no assertion loosened |

---

## 10. KNOWN BLOCKERS / GAPS (HONEST)

1. **Per-skill depth target not reached.** Spec aims 8–12 questions/active skill;
   current bank is 2–6. Expanding to ~250–350 items is a large content-authoring
   effort left for a follow-up increment (validated + duplicate-free, not filler).
2. **No session-practice UI.** QUICK/DEEP progress, pause/resume, early finish, and
   parent session-settings cannot be browser-verified; they are covered by engine
   unit tests only.
3. **Kid's Box alignment.** Official Kid's Box content is not invented or claimed;
   the companion track is untouched.
4. Two pre-existing competition `NEAR_DUPLICATE` warnings (non-blocking).

---

## 11. HOW TO REPRODUCE

```bash
npm install
npx tsc --noEmit
npx vitest run
npm run build
node qa/run-one.mjs qa/p41-curriculum-quality.mjs
node qa/run-one.mjs qa/golden-path.mjs
```

Chromium override (if the cache revision changes): `PW_CHROME=<path> node qa/run-one.mjs …`

---

## 12. TÓM TẮT TIẾNG VIỆT

**Trạng thái: PARTIAL 🟡** (mọi cổng kiểm tra đều đạt; chỉ còn thiếu độ sâu nội
dung theo mục tiêu 8–12 câu/kỹ năng và chưa có giao diện phiên học để chạy E2E
QUICK/DEEP — cả hai đều được ghi nhận trung thực, không tô vẽ).

**Đã làm:**

- **Sửa lỗi gốc về vị trí đáp án:** trước đây 80/84 câu (95%) để đáp án đúng ở ô
  đầu tiên. Thêm `src/data/optionBalance.ts` (thuần, tất định, quay vòng theo độ
  dài đáp án) và áp dụng cho cả 3 môn. Kết quả: phân bố vị trí đáp án đúng
  `{0:29, 1:29, 2:27, 3:24}` (cao nhất 26,6%; môn Tiếng Anh `8/8/8/8` cân bằng
  tuyệt đối). Đã kiểm chứng cả trong trình duyệt thật: vị trí đáp án đúng hiển
  thị `[0,1,2,3]`.
- **Mở rộng ngân hàng câu hỏi 86 → 111 câu** (+25): Tiếng Việt +12, Toán +2,
  Tiếng Anh +11. Không còn kỹ năng nào có 0 câu; cả 3 môn đều có câu độ khó 3.
- **Sửa nội dung lỗi:** 3 câu Toán mơ hồ/đa đáp án (`math-q3-5`, `math-q4-5`,
  `math-q5-4`), 1 câu trùng đáp án (`vn-q7-4`), ~20 gợi ý lộ đáp án, và các câu
  gần trùng.
- **Thêm cổng chất lượng vĩnh viễn:** `CURRICULUM_POLICY`, báo cáo phân bố vị trí
  đáp án (`ANSWER_POSITION_BIAS` mức ERROR), và `tests/curriculum-quality-p41.test.ts`
  (13 bài kiểm thử).
- **Kiểm thử & trình duyệt:** `tsc` sạch, **401/401** test đạt, build thành công;
  5 kịch bản Playwright thật (P41, golden-path, decision-engine, offline-pwa,
  question-types) đều **0 lỗi**; dữ liệu học tập (`P41-v1`) và tiến độ (xp 210)
  được giữ nguyên sau khi tải lại.

**Còn lại:** tăng số câu mỗi kỹ năng lên 8–12; xây dựng giao diện phiên học để
kiểm thử QUICK/DEEP, tạm dừng/tiếp tục và kết thúc sớm; nội dung Kid's Box chính
thức (không tự bịa).
