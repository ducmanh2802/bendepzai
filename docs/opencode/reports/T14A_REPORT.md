# T14A — Môn mới "Em & Cuộc sống" (phần kỹ thuật)

## Đã làm
- Mở rộng `SubjectType` thêm `'cuoc-song'`.
- Giữ `CompetitionSubject` là union 3 môn cũ (không nhận môn mới).
- Thêm `src/data/lifeCurriculum.ts` với 2 chủ đề × 1 bài (24 câu) môn mới, skill prefix `life_`.
- Cập nhật `ALL_TOPICS` và `getAllSkills` (strip `life_`).
- Mở ô môn trên `HomeScreen`; thêm đảo trên `WorldMapScreen`; thêm info trong `SubjectScreen`.
- Cập nhật storage sanitizer, adaptive, decisionEngine, contentValidator, praiseEngine mapping.
- Sửa regex test môn trong `tests/math-curriculum.test.ts`.

## File thay đổi
src/types/index.ts, src/types/competition.ts, src/data/curriculum.ts, src/data/lifeCurriculum.ts, src/components/home/HomeScreen.tsx, src/components/world/WorldMapScreen.tsx, src/components/subject/SubjectScreen.tsx, src/services/storage.ts, src/services/adaptive.ts, src/services/decisionEngine.ts, src/services/contentValidator.ts, src/components/competition/CompetitionHubScreen.tsx, tests/math-curriculum.test.ts, .ai/CURRENT.md

## Số liệu
- Test: 601/601 PASS trước & sau.
- Build: PASS.

## Lệnh đã chạy
- npm run typecheck PASS
- npm test PASS (601 tests)
- npm run build PASS

## Quyết định tự đưa
- Chỉ thêm 2 bài mẫu theo T14A; nội dung đầy đủ để T14B.
- Giữ praiseEngine map life → Vietnamese mặc định.

## Việc còn tồn
- T14B sẽ bổ sung đầy đủ ≥24 bài/≥240 câu.
