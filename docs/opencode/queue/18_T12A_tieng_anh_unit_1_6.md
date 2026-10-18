# T12A — Tiếng Anh: unit 1–6 (British English)

**Spec gốc:** `docs/opencode/T12_tieng_anh_mo_rong.md` — **unit 1–6**

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Điều chỉnh so với spec gốc
- Đặt các unit trong `englishCurriculum.ts` (hoặc theo `docs/CONTENT_GUIDE.md`). **Không** nạp vào `KIDBOX_MAPPED_UNITS` — mảng này cố ý để trống (xem `docs/ENGLISH_KIDBOX_COMPANION.md` §7).
- Từ vựng không bắt buộc có emoji (được dùng hình SVG đơn giản hoặc chữ).
- Mỗi bài ≥ 10 câu; giọng British (`britishSpeech.ts`); lời khen tiếng Anh khớp chữ hiển thị.

## Ghi chú kỹ thuật (bắt buộc)
- **Không viết lại cả `src/data/englishCurriculum.ts`** (file > 1.000 dòng): model free bị lỗi 504 khi sinh output quá dài.
- Mỗi unit mới đặt trong **một file riêng** `src/data/english/unitNN.ts` (dưới ~300 dòng), rồi chỉ thêm vài dòng `import` + đưa vào danh sách trong `englishCurriculum.ts` (sửa nhỏ bằng edit, hoặc tạo `src/data/english/index.ts` gom các unit). Cách này giống T10A với `src/data/vietnamese/`.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T12A_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
