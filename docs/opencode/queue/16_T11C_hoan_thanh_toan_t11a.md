# T11C — Hoàn thành phần T11A còn thiếu: nội dung Toán 0–100 + nối hình trực quan

**Spec gốc:** `docs/opencode/T11_toan_den_100.md` — mục 1–5. Đọc thêm `docs/opencode/queue/16_T11A_so_va_phep_tinh.md` và `docs/opencode/reports/T11A_REPORT.md`.

> File này là bản chính thức. Luật chung: `docs/opencode/00_RULES.md`.

## Bối cảnh
T11A đã merge nhưng **chỉ làm hạ tầng**: 5 component trong `src/components/visuals/` và trường `visual?` trong `Question`. Báo cáo T11A ghi "chưa thực hiện" phần nội dung vì edit tool lỗi khoảng trắng với `src/data/mathCurriculum.ts`. Task này làm nốt — **phần nội dung là sản phẩm chính, không được bỏ**.

## Phạm vi
1. **Nội dung Toán (mục 1–5 của spec):** số 0–10; cộng trừ trong phạm vi 10; số 11–100 (chục – đơn vị, so sánh, tia số); cộng trừ **không nhớ** trong 100 (đặt tính cột); bài toán có lời văn 1 bước.
   - Mỗi bài ≥ 10 câu, ≥ 3 loại câu (dùng renderer T05); độ khó tăng dần; giữ id cũ, tiền tố `math-`; theo `docs/CONTENT_GUIDE.md`.
   - Nếu sửa `src/data/mathCurriculum.ts` bằng edit tool bị lỗi, **tạo file mới** (ví dụ `src/data/math/*.ts`, giống cách T10A làm với `src/data/vietnamese/`) rồi import vào curriculum. Không được dừng vì lỗi công cụ.
2. **Kiểm đáp án bằng máy:** mọi câu số học có `calc: { a, op, b }`; test tính lại đáp án từ `calc`, kiểm phạm vi 0–100 và **không nhớ** (phép cộng: hàng đơn vị cộng ≤ 9; phép trừ: đơn vị số bị trừ ≥ đơn vị số trừ). Đưa số cụ thể vào chữ của đề để validator không coi là trùng.
3. **Sửa component hình:** `TenFrame` phải là khung 10 ô (2 hàng × 5 ô) tô theo số lượng 0–10 (số lớn hơn thì nhiều khung); dùng thuộc tính JSX camelCase (`strokeWidth`, không `stroke-width`) ở mọi component trong `src/components/visuals/`.
4. **Nối hình vào bài học:** renderer của lesson player (T05) hiển thị `question.visual` (kind → component tương ứng); ít nhất các bài số/tia số/chục–đơn vị có câu dùng `visual`. Test `renderToString` cho từng `kind`.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T11C_REPORT.md`: số bài và số câu Toán trước/sau theo từng mục, test mới, những gì còn thiếu (nếu có thì phải nêu lý do cụ thể).
