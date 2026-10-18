# T07 — Màn môn học thành "con đường phiêu lưu" + bản đồ thế giới

**Spec gốc:** `docs/opencode/T07_con_duong_phieu_luu.md`

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Điều chỉnh so với spec gốc
- Storage chưa lưu sao từng bài, trạng thái rương cuối chặng và cờ "mở khoá tất cả" của phụ huynh → thêm field + sanitizer + migration + test.
- Giữ lối vào Kid's Box trong `SubjectScreen` (khoảng dòng 115).
- Sửa các script QA đang click nút "Vào học".

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T07_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
