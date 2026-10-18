# T05 — Lesson Player: nối, đúng/sai, gõ chữ, kéo thả

**Spec gốc:** `docs/opencode/T05_lesson_player_nhieu_dang_bai.md`

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Điều chỉnh so với spec gốc
- `CompetitionExamModal.tsx` (khoảng dòng 628 trở đi) đã có renderer cho ordering/matching/drag-drop → **tách ra** `src/components/learning/questions/` và dùng chung cho cả bài học lẫn thi đấu.
- Thống nhất `pairs` (bài học) và `matchingPairs` (thi đấu) bằng adapter, không đổi dữ liệu cũ.
- Validator: lỗi `ANSWER_NOT_IN_OPTIONS` chỉ áp cho dạng chọn đáp án — viết theo từng loại câu.
- Repo chưa có jsdom: test bằng `renderToString` + tách logic trạng thái thành hàm thuần; chỉ thêm `happy-dom` (devDependency) nếu thật cần và ghi lý do.
- 22 câu fill-blank dạng chọn đáp án hiện có phải chạy đúng như cũ.
- Tạo `qa/lesson-types.mjs` cho bài học (`qa/question-types.mjs` hiện kiểm đề thi đấu, giữ nguyên).

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T05_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
