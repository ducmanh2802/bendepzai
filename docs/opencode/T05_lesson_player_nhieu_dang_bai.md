# T05 — Lesson Player: thêm dạng bài nối, đúng/sai, gõ chữ, kéo thả

**Nhánh:** `p42/T05` · Song song được với T04.

## Hiện trạng
`src/components/learning/LessonPlayerModal.tsx` chỉ xử lý riêng `ordering` (≈ dòng 318); mọi loại khác vẽ thành nút chọn (≈ dòng 362). `matching`, `drag-drop`, `true-false`, `math-expression` có trong `QuestionType` nhưng chưa dùng; `fill-blank` không cho gõ.

## Việc cần làm
1. Tách renderer theo loại vào `src/components/learning/questions/`: `ChoiceQuestion`, `ImageChoiceQuestion` (ô hình to), `TrueFalseQuestion` (2 nút lớn ✅/❌ có giọng đọc), `MatchingQuestion` (chạm trái → chạm phải, vẽ đường nối SVG; hỗ trợ bàn phím), `DragDropQuestion` (kéo thẻ vào ô; có chế độ chạm-để-đặt cho mobile), `FillBlankQuestion` (bàn phím chữ tiếng Việt thu gọn: chỉ các chữ/dấu cần thiết của câu + 3–4 chữ gây nhiễu; hoặc ô số cho Toán), `OrderingQuestion` (giữ logic cũ), `MathExpressionQuestion` (bàn phím số to).
2. Chấm điểm thống nhất trong `src/services/answerCheck.ts` (chuẩn hoá Unicode NFC, bỏ khoảng trắng thừa, so mảng cho matching/ordering). Test kỹ.
3. Trải nghiệm:
   - Ô đáp án chữ 20–24px, có hình khi có `mediaEmoji`/minh hoạ.
   - Câu chọn 1 đáp án: chạm là chấm luôn (bỏ bước "Kiểm tra"); các dạng nhiều bước: nút "Kiểm tra" dính đáy màn hình, luôn thấy trên 375×667.
   - Sai lần 1: gợi ý (`hint`) + thử lại; sai lần 2: hiện đáp án + `explanation` + đọc to. Mastery chỉ tính lần đầu.
   - Thanh tiến độ dạng "đường đi" có linh vật chạy theo.
4. Cập nhật `contentValidator.ts` + `CURRICULUM_POLICY` để kiểm tra cấu trúc của từng loại mới (pairs đủ, ordering có items…).
5. Thêm 1 bài mẫu cho mỗi loại mới vào chương trình (ít nhất 2 câu/loại) để kiểm thử.

## Nghiệm thu
- `qa/question-types.mjs` mở rộng: chạy được mỗi loại trên Chromium 375×667, 0 lỗi console.
- Test unit cho `answerCheck` + từng renderer (render + tương tác cơ bản). typecheck + test + build PASS.
