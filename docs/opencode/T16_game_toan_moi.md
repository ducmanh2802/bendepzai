# T16 — 3 trò chơi Toán mới

**Phụ thuộc:** T15 (theo đúng "Hợp đồng chung cho mọi game mới" trong `T15_game_tieng_viet_moi.md`). **Nhánh:** `p42/T16`
Dùng lại visuals của T11 (`TenFrame`, `ClockFace`, `NumberLine`, `PlaceValueBlocks`) nếu đã có.

1. **Chợ Khung 10** (`ten_frame_market`): khách hàng (con vật) cần "đủ 10 quả"; bé kéo trái cây vào khung 10 ô, rồi trả lời "cần thêm mấy quả?". Cấp cao: 2 khung (đến 20), chục–đơn vị với bó que tính (đến 100), tiền mệnh giá nhỏ để mua hàng (không nhớ).
2. **Ếch Nhảy Tia Số** (`number_line_hop`): ếch đứng ở số a, đề "+3" → bé chạm 3 lần để ếch nhảy, hoặc chạm thẳng số đích. Cấp cao: tia số 0–20, nhảy theo chục (0–100), đề bằng lời ("Ếch lùi 4 bước").
3. **Thợ Sửa Đồng Hồ** (`clock_builder`): kéo kim giờ/phút trên mặt đồng hồ SVG để chỉ giờ đúng theo đề hoặc theo tranh hoạt động trong ngày ("Bé ăn sáng lúc 6 giờ"). Cấp cao: thứ trong tuần + lịch tờ ("Hôm nay thứ Hai, ngày mai thứ mấy?").

Giới hạn lớp 1: không phép tính có nhớ, không số > 100, chỉ giờ đúng.

## Nghiệm thu
- Test kiểm tra tính toán đúng ở mọi cấp; 3 game trong Hub mục Toán.
- `qa/games.mjs` chơi cấp 1 mỗi game. typecheck + test + build PASS.
