# T09 — Luyện đọc & Đấu trường thân thiện với bé 6 tuổi

**Phụ thuộc:** T06. **Nhánh:** `p42/T09`

## A. ReadingFluencyScreen
1. "Thang đọc" thành **giá sách**: mỗi truyện là 1 cuốn sách có bìa minh hoạ (SVG/emoji ghép) + sao. Sách khoá có dây ruy băng.
2. Màn đọc truyện: chữ 24–28px, giãn dòng rộng; chạm 1 từ → đọc từ đó + tô sáng; nút "Đọc cả câu" tô sáng từng chữ theo giọng đọc (karaoke, dùng `onboundary` nếu có, fallback chia thời gian theo số âm tiết).
3. Chế độ "Bé tự đọc": bé đọc to, phụ huynh chấm nhanh 😀/😐/🙁 (dùng cơ chế chấm có sẵn trong readingEngine nếu có).
4. Câu hỏi sau truyện dùng renderer mới từ T05.

## B. CompetitionHub (Đấu Trường)
1. Mặc định **chế độ Bé**: ẩn bảng xếp hạng bot và đồng hồ đếm ngược; kết quả hiển thị bằng huy chương (đồng/bạc/vàng) + lời khen, không hiện "x/10".
2. Chế độ **Thi thật** (Trạng Nguyên 4 vòng, có giờ) chỉ mở từ Bảng phụ huynh hoặc khi bé đạt huy chương vàng ≥ 3 lần.
3. Gộp 5 tab thành 3: "Luyện thi", "Thử thách", "Thành tích". Bớt chữ.
4. Giữ nguyên engine/blueprint/test hiện có (không đổi logic chấm).

## Nghiệm thu
- Ảnh trước/sau 375×667. Test cũ về competition vẫn PASS.
- typecheck + test + build PASS.
