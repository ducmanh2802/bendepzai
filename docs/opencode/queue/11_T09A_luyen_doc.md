# T09A — Luyện đọc: giá sách, đọc karaoke, phụ huynh chấm

**Spec gốc:** `docs/opencode/T09_doc_va_dau_truong_than_thien.md` — **chỉ phần A (ReadingFluencyScreen)**

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Điều chỉnh so với spec gốc
- `readingEngine` chưa có điểm phụ huynh chấm (😀/😐/🙁) → thêm field lưu trữ + sanitizer + test.
- Câu hỏi đọc dùng loại riêng (khác `QuestionType`) → viết adapter để dùng renderer chung của T05.
- Cập nhật script QA golden-path liên quan.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T09A_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
