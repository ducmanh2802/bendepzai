# T07 — Màn môn học thành "Con đường phiêu lưu" + Bản đồ thế giới thật

**Phụ thuộc:** T06. **Nhánh:** `p42/T07`

## A. SubjectScreen → con đường
Hiện tại: ~20 thẻ chữ nhỏ giống nhau, nút "Vào học" lặp lại. Làm mới:
1. Mỗi **chủ đề** = 1 chặng có tên + minh hoạ; mỗi **bài** = 1 nút tròn to (72px) nằm trên con đường uốn lượn (SVG path, zig-zag trái-phải).
2. Trạng thái nút: đã xong (vàng + 1–3 sao), đang học (phát sáng + Gấu đứng cạnh), sắp tới (màu nhạt), khoá (ổ khoá — mở khi xong bài trước; phụ huynh có thể mở hết).
3. Cuối mỗi chặng có **rương kho báu**: mở khi xong cả chặng → thưởng sao + 1 sticker (hook cho T18; tạm thời thưởng sao).
4. Chạm nút → popup nhỏ: tên bài, số câu, nút loa đọc mô tả, nút "Bắt đầu" to. Không còn đoạn mô tả dài.
5. Tự cuộn tới bài đang học khi mở màn.
6. Dữ liệu tiến độ lấy từ storage hiện có (không tạo store mới).

## B. WorldMapScreen → bản đồ có đường đi
1. Nền SVG: biển, đảo, núi; 4–6 vùng đảo (Đảo Chữ Cái, Núi Toán, Rừng English, Làng Cuộc Sống, Hang Truyện, Đấu Trường) dùng minh hoạ từ T03.
2. Đường chấm nối các đảo; Gấu đứng ở vùng bé học gần nhất; vùng có huy hiệu % hoàn thành.
3. Kéo/vuốt để xem bản đồ trên mobile (CSS scroll-snap, không thư viện).

## Nghiệm thu
- 375×667: nút ≥ 44px, không cuộn ngang trang (bản đồ cuộn trong khung riêng).
- Bàn phím: Tab qua các nút bài theo thứ tự, Enter mở.
- Ảnh trước/sau. typecheck + test + build PASS.
