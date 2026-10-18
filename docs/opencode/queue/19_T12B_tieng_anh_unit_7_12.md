# T12B — Tiếng Anh: unit 7–12 + 40 câu thi đấu Phonics/Listening/Sentence

**Spec gốc:** `docs/opencode/T12_tieng_anh_mo_rong.md` — **unit 7–12 + phần competition**

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Phạm vi
- Unit 7–12 theo spec gốc, cùng quy ước T12A.
- Thêm ~40 câu thi đấu English loại Phonics/Listening/Sentence để cân lại bank; tăng `COMPETITION_BANK_VERSION`.

## Nghiệm thu riêng
- Tổng Tiếng Anh sau T12A–B: **≥ 30 bài, ≥ 300 câu, ≥ 250 từ vựng**.

## Ghi chú kỹ thuật (bắt buộc)
- **Không viết lại cả `src/data/englishCurriculum.ts`** (file > 1.000 dòng): model free bị lỗi 504 khi sinh output quá dài.
- Mỗi unit mới đặt trong **một file riêng** `src/data/english/unitNN.ts` (dưới ~300 dòng), rồi chỉ thêm vài dòng `import` + đưa vào danh sách trong `englishCurriculum.ts` (sửa nhỏ bằng edit, hoặc tạo `src/data/english/index.ts` gom các unit). Cách này giống T10A với `src/data/vietnamese/`.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T12B_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
