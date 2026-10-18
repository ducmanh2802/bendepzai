# T15 — 3 trò chơi Tiếng Việt mới

**Phụ thuộc:** T04 (gameContent), T08 (registry + khung game). **Nhánh:** `p42/T15`

## Hợp đồng chung cho mọi game mới (T15–T17)
- Component `React.FC<{ onExit: () => void }>` trong `src/components/games/`, đăng ký **1 entry** trong `src/components/games/registry.ts`.
- Dùng `useGameStage` (6 cấp 🐣→👑) + `GameModalWrapper`; nội dung lấy từ `gameContent.getGameItems` (+ game-pack riêng trong `src/data/games/` khi cần); độ khó tăng THẬT theo cấp.
- Có màn hướng dẫn, phản hồi đúng/sai, praiseEngine, linh vật; chạy tốt bằng cảm ứng + chuột + bàn phím; 375×667.
- Hoạt ảnh bằng CSS/SVG/`requestAnimationFrame` (không `setInterval` cho chuyển động), dừng khi tab ẩn, tôn trọng reduced-motion.
- Test `tests/games/<id>.test.ts`: hàm sinh vòng chơi (đủ item mọi cấp, đáp án đúng, không trùng), + render smoke test.

## Game
1. **Tô Dấu Thanh** (`tone_paint`): nghe 1 tiếng (bấm loa) + thấy hình; kéo (hoặc chạm) 1 trong 6 dấu thanh đặt lên đúng nguyên âm. Cấp cao: từ 2 tiếng, chọn đúng vị trí dấu trong vần có 2–3 nguyên âm (hoà, khoẻ, thuở…). Sai → dấu bật ra, Gấu đọc chậm lại.
2. **Đoàn Tàu Ghép Vần** (`rhyme_train`): đầu tàu mang âm đầu, các toa mang vần; bé nối toa để tạo tiếng có nghĩa khớp hình (b + ò = bò 🐄). Tàu chạy khi đúng (tiếng còi). Cấp cao: tạo từ 2 tiếng, vần khó (oang, uyên…), có dấu thanh.
3. **Đọc Câu Làm Theo** (`read_and_do`): một cảnh SVG đơn giản (phòng, sân, vườn) với vài đồ vật; bé đọc câu "Đặt quả bóng lên ghế." rồi kéo vật vào đúng chỗ. Cấp cao: câu 2 vế, từ chỉ vị trí (trên, dưới, cạnh, trong), màu sắc + số lượng.

## Nghiệm thu
- 3 game xuất hiện trong Hub mục Tiếng Việt, nhãn "MỚI".
- `qa/games.mjs` chơi tự động ít nhất cấp 1 của mỗi game (0 lỗi console).
- typecheck + test + build PASS.
