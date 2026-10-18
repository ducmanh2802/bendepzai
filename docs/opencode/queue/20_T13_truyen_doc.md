# T13 — Luyện đọc: thêm 24 truyện theo chủ đề

**Spec gốc:** `docs/opencode/T13_truyen_doc_moi.md`

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Điều chỉnh so với spec gốc
- Luật số chữ theo cấp và luật "≥ 4 loại câu/truyện" **chỉ áp cho truyện mới**; 12 truyện cũ giữ nguyên.
- Chỉ dùng các loại câu đọc đang có (reading chưa có đúng/sai, nối); nếu cần loại mới thì đi qua adapter của T09A.
- Mỗi truyện mới **≥ 6 câu** (24 × 6 + 48 cũ ≥ 180).
- Theo `docs/CONTENT_GUIDE.md`.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T13_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
