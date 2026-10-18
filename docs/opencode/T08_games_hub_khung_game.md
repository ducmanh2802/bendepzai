# T08 — Games Hub đẹp + khung game chuẩn mobile

**Phụ thuộc:** T06. **Nhánh:** `p42/T08`

## A. GamesHubScreen
1. Thẻ game mới: ảnh minh hoạ/emoji lớn trên nền màu môn, tên ngắn (≤ 3 từ), hàng huy hiệu cấp (🐣→👑) và sao tốt nhất, nút ▶ to. Mô tả dài chỉ đọc khi bấm loa.
2. Bỏ chữ < 14px (hiện có ~125 phần tử < 12px).
3. Bộ lọc dạng tab icon cố định (Tất cả · Tiếng Việt · Toán · English · Vui) — không bị cắt trên 375px.
4. Khu "🔥 Gợi ý cho bé" đầu trang: 3 game liên quan kỹ năng yếu (lấy từ `decisionEngine`/`learningOS`).
5. Game mới (thêm ở T15–T17) có nhãn "MỚI" trong 7 ngày đầu bé thấy.
6. Đổi đăng ký game sang 1 nguồn duy nhất: `src/components/games/registry.ts` (catalog + component lazy) để T15–T17 chỉ thêm 1 entry.

## B. GameModalWrapper (khung mọi game)
1. Header 1 dòng trên 375px: nút đóng (luôn thấy, góc trái), tên game rút gọn, cấp dạng icon, tiến độ vòng dạng chấm, 1 nút loa duy nhất.
2. Vùng đề bài cố định, tách khỏi vùng chơi (không đè lên khu vực bóng bay rơi).
3. Màn hướng dẫn đầu game: Gấu nói hướng dẫn (bấm loa) + 1 hình minh hoạ thao tác + nút "Chơi!".
4. Màn kết thúc cấp: 3 sao bay vào lần lượt, lời khen, nút "Cấp tiếp" to, "Chơi lại", "Về".
5. Nút tạm dừng.

## Nghiệm thu
- `qa/games.mjs` mở cả 18 game ở 375×667: nút đóng thấy được, header 1 dòng, 0 lỗi console.
- Ảnh trước/sau. typecheck + test + build PASS.
