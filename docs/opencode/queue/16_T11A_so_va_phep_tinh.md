# T11A — Toán: hình trực quan + số đến 100 + cộng trừ không nhớ

**Spec gốc:** `docs/opencode/T11_toan_den_100.md` — **mục 1–5** + phần visuals

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Phạm vi
- Component SVG `src/components/visuals/`: ClockFace, Ruler, TenFrame, NumberLine, PlaceValueBlocks; trường `visual?: { kind, props }` trong câu hỏi (mở rộng type có kiểm tra, renderer T05 hiển thị).
- Mục 1–5 của spec gốc: số 0–10, cộng trừ trong 10, số 11–100 (chục–đơn vị, so sánh, tia số), cộng trừ **không nhớ** trong 100 (đặt tính cột), bài toán có lời văn 1 bước.

## Điều chỉnh
- Câu số học có trường `calc: { a, op, b }` để test tính lại đáp án.
- Validator coi các câu chỉ khác nhau ở hình là **trùng** → đưa số cụ thể vào chữ của đề.
- Theo `docs/CONTENT_GUIDE.md`; giữ id cũ; tiền tố `math-`.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T11A_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
