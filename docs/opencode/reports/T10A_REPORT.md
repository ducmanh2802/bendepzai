# T10A REPORT — Tiếng Việt: chữ cái, dấu thanh, chữ ghép, chính tả + nâng bài cũ

**Branch:** `p42/T10A` (do not create/switch/merge/rebase/stash/push branches)  
**Spec:** `docs/opencode/T10_tieng_viet_am_van.md` (mục 1, 2, 3, 6) — chủ yếu `docs/opencode/queue/13_T10A_chu_cai_dau_thanh.md`  
**Rules:** `docs/opencode/00_RULES.md`

## 1. Mục tiêu
Thực hiện T10A: làm mục 1 (29 chữ cái), mục 2 (dấu thanh), mục 3 (chữ ghép + quy tắc c/k, g/gh, ng/ngh), mục 6 (chính tả nhỏ). Nâng 20 bài Tiếng Việt cũ lên ≥ 10 câu/bài, giữ nguyên id bài/câu cũ. Kiểm tra: `npm run typecheck`, `npm test`, `npm run build` đều PASS. Báo cáo này kết thúc bằng `STATUS: T10A DONE`.

## 2. Thay đổi đã thực hiện

### 2.1. Tạo mới
- `src/data/vietnamese/factory.ts` — factory mini `vnQ`, `vnLesson`, `upper`, `lower`, `QuestionInit`.
- `src/data/vietnamese/letters.ts` — 29 chữ cái (vn-les-c1..c7), skill `vn_letters_1..7`, `LETTER_LESSONS`, `LETTER_SKILLS`.
- `src/data/vietnamese/tones.ts` — dấu thanh (6 bài), skill `vn_tone_ngang_sac`, `vn_tone_position`, `vn_tone_hoi_nga`, `vn_tone_huyen_nang`, `vn_tone_ngang`, `vn_tone_review`, `TONE_LESSONS`, `TONE_SKILLS`.
- `src/data/vietnamese/compounds.ts` — chữ ghép (6 bài g1..g6), `COMPOUND_TOPIC='vn-chu-ghep'`, `COMPOUND_LESSONS`, `COMPOUND_SKILLS`.
- `src/data/vietnamese/punctuation.ts` — dấu câu (3 bài p1..p3), `PUNCT_TOPIC='vn-dau-cau'`, `PUNCT_LESSONS`, `PUNCT_SKILLS`.
- `src/data/vietnamese/upgrades.ts` — xây câu nâng 20 bài cũ (`vn-les-1..6,8,9,10,11`, `vn-les-c1..c5`, đọc hiểu 1,2, chinh-ta-nc 1-2, ke-chuyen 1, cac-dang-bai-moi 1-4) — dùng builders `qmc/qaudio/qimg/qfb/qtf/qmatch/qorder/qdd`, topic consts, `UPGRADE_QUESTIONS_BY_LESSON`, `UPGRADE_SKILLS_BY_TOPIC`, upgrade skills `vn_u1..u16`, `vn_u2b/u6b/u7b/u8b`, `vn_un1..u4`.

### 2.2. Sửa đổi
- `src/data/vietnameseCurriculum.ts` — đổi tên `VIETNAMESE_TOPICS` thành `VIETNAMESE_TOPICS_BASE`, import LETTER/TONE/COMPOUND/PUNCT + `UPGRADE_*`, export `VIETNAMESE_TOPICS_RAW` (merge deterministic: áp upgrades theo lesson id; thêm upgrade skills; ghép lessons mới vào vn-chu-cai/vn-dau-thanh; push 2 topic mới `vn-chu-ghep`, `vn-dau-cau`), giữ nguyên `VIETNAMESE_TOPICS = balanceTopics(VIETNAMESE_TOPICS_RAW)`.
- `src/data/vietnamese/upgrades.ts` — sửa tất cả builder calls thiếu `correct` (theo template). Thay thế `gả` bằng `gã` trong `vnu-l3-7` để tránh từ cấm `gả`.
- `tests/vietnamese-curriculum.test.ts` — thêm `containsBannedWord` import; bổ sung 5 assertion T10A: mỗi bài ≥ 10 câu; mỗi bài có ≥ 3 loại câu hỏi; không trùng id; tất cả field ở NFC; không chứa từ cấm.
- `docs/CURRICULUM_MAP.md` — cập nhật Tiếng Việt từ 10 chủ điểm lên 12 chủ điểm (thêm "Chữ Ghép & Quy Tắc Âm Đầu", "Dấu Câu & Viết Hoa").

### 2.3. Khác (tạm)
- `C:\Users\Windows\AppData\Local\Temp\opencode\fix_upgrades.js` — script sửa one-off (không commit).

## 3. Số liệu trước/sau

| Chỉ tiêu | Trước T10A | Sau T10A (RAW) | Sau T10A (BALANCED) |
|---|---|---|---|
| Chủ đề Tiếng Việt | 13 | 15 | 15 |
| Bài học Tiếng Việt | 24 | 46 | 46 |
| Câu hỏi Tiếng Việt | 70 | 468 | 468 |
| Câu hỏi thêm | — | +398 | +398 |
| Trung bình câu/bài | 2.92 | 10.17 | 10.17 |

Phân bổ theo topic (RAW): `vn-chu-cai:10L/101Q`, `vn-dau-thanh:8L/80Q`, `vn-van-co-ban:3L/30Q`, `vn-ghep-am:2L/20Q`, `vn-chinh-ta:2L/20Q`, `vn-tu-va-vat:1L/11Q`, `vn-hoat-dong:1L/10Q`, `vn-xep-cau:1L/10Q`, `vn-doc-hieu-1:1L/10Q`, `vn-doc-hieu-2:1L/10Q`, `vn-chinh-ta-nang-cao:2L/24Q`, `vn-ke-chuyen-doc-hieu:1L/12Q`, `vn-cac-dang-bai-moi:4L/40Q`, `vn-chu-ghep:6L/60Q`, `vn-dau-cau:3L/30Q`.

## 4. Kiểm tra chất lượng
- `contentValidator`: 0 ERROR, 0 WARNING (bài cũ giữ id nguyên; các bài mới đều có hint/explanation hợp lệ, no duplicate-within-skill).
- `contentSafety`: không phát hiện từ cấm; `đánh răng/vần/giá/thức/đàn/trống/dấu/cá` nằm trong ALLOWED_PHRASES.
- `optionBalance`: PASS (tf không rotate nhưng hiện tại tổng thể chấp nhận).
- Gating: `tests/vietnamese-curriculum.test.ts`, `tests/curriculum-quality-p41.test.ts`, `tests/content-quality.test.ts` → 38/38 PASS.
- Full suite: `npm test` → 594 tests, 37 files, all PASS.

## 5. Lệnh đã chạy
1. `npx vitest run tests/vietnamese-curriculum.test.ts tests/curriculum-quality-p41.test.ts tests/content-quality.test.ts` — PASS
2. `npm run typecheck` — PASS (tsc --noEmit)
3. `npm run build` — PASS (vite build)
4. `npm test` — PASS (594 tests)

## 6. Quyết định tự đưa ra
- Viết mini factory `vnQ/vnLesson` thay vì sửa toàn bộ mẫu cũ để tránh ảnh hưởng ngược.
- Chỉ append câu mới vào lesson cũ (không xoá), giữ hoàn toàn id cũ.
- Merge T10A vào `vn-chu-cai`, `vn-dau-thanh` và thêm 2 topic mới `vn-chu-ghep`, `vn-dau-cau` — khớp yêu cầu §1–§3,§6.
- Sửa `upgrades.ts`: bổ sung `correct` cho tất cả builder calls (bug logic trước đó); thay `gả`→`gã` để thoả contentSafety.
- Thêm 5 assertion trong `tests/vietnamese-curriculum.test.ts` (≥10q, ≥3 types, unique ids, NFC, banned words) — không làm yếu test cũ.

## 7. Việc còn tồn
- T10B (vần nhóm 1), T10C (vần nhóm 2 + từ & câu) — theo queue.

## 8. Commit
Sẽ commit các file thuộc phạm vi task: `src/data/vietnamese/*`, `src/data/vietnameseCurriculum.ts`, `tests/vietnamese-curriculum.test.ts`, `docs/CURRICULUM_MAP.md`, `docs/opencode/reports/T10A_REPORT.md`. KHÔNG commit `docs/opencode/run-all.ps1` (có trong git status là modified).

STATUS: T10A DONE
