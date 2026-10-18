# T10A — Tiếng Việt: chữ cái, dấu thanh, chữ ghép, chính tả + nâng bài cũ

**Spec gốc:** `docs/opencode/T10_tieng_viet_am_van.md` — **mục 1, 2, 3, 6** + nâng 20 bài cũ

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Phạm vi
- Làm mục 1 (29 chữ cái), 2 (dấu thanh), 3 (chữ ghép + quy tắc c/k, g/gh, ng/ngh), 6 (chính tả nhỏ) của spec gốc.
- Nâng **20 bài Tiếng Việt cũ** lên ≥ 10 câu/bài (giữ nguyên id cũ).
- Theo `docs/CONTENT_GUIDE.md` (T02C).

## Điều chỉnh
- Giữ tiền tố id bài `vn-` (thành tựu và storage dựa vào).
- Một kiểu đặt dấu thống nhất theo SGK hiện hành: dấu ở nguyên âm chính (**hoà, khoẻ, thuỷ**); chuẩn hoá NFC; thêm test kiểm kiểu đặt dấu.
- Gợi ý (`hint`) không được chứa đáp án.
- Mỗi bài ≥ 10 câu, ≥ 3 loại câu (dùng renderer T05).

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T10A_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
