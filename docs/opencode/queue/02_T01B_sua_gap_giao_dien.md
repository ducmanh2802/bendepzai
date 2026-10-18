# T01B — Sửa gấp giao diện điện thoại & desktop

**Spec gốc:** `docs/opencode/T01_hotfix_giao_dien_ngay.md` (T01 đã xong) · Audit: `docs/opencode/P42_AUDIT_2.md` mục 3

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Phạm vi
1. **(Quan trọng nhất)** Ở 360–375px không thấy nút đóng game (header game cần 428px, chỉ có 343px). Header game chỉ 1 dòng, nút đóng luôn hiện ở góc trái, tên game rút gọn, cấp/tiến độ dạng icon. Thêm phím **Esc** và nút **Back** của trình duyệt/điện thoại (history) để đóng modal game và bài học.
2. **Bài học 375×667**: nút "Kiểm tra"/"Câu tiếp theo" bị đẩy khuất → thanh hành động dính đáy (sticky), luôn thấy, không phải cuộn.
3. **Desktop 1024–1440**: thanh menu trên tràn 90–176px, mất nút "Ba Mẹ", tắt tiếng, Shop → gom mục phụ vào menu "Thêm" hoặc chỉ hiện icon; không được tràn ở 1024, 1280, 1440.
4. Đổi màn hình phải **cuộn về đầu trang**.
5. **Font Nunito chưa được áp dụng** (class `font-sans` của Tailwind ghi đè) → khai báo `--font-sans` trong `@theme` là Nunito và kiểm tra `font-family` thực tế của body.
6. Chữ trắng trên banner Home tương phản chỉ 2,1–2,7:1 → **≥ 4,5:1** (nền đậm hơn, lớp phủ tối hoặc viền chữ).
7. Banner "Có bản mới…" hiện sai ở lần mở đầu tiên → chỉ hiện khi có service worker mới thay thế SW đang điều khiển trang.
8. Header game có 2 icon loa giống nhau (nghe hướng dẫn / tắt tiếng) → icon khác nhau + `aria-label` rõ ràng.
9. Nút chạm < 44px: "Chơi ngay", "Vào học" (32px), tab (32–34px), "Mở khóa" (28px), "Bé cần gợi ý?" (24px), "Nghe lại" (16px), nút quay lại (36px) → tất cả ≥ 44px.
10. World Map còn ghi "10+ Mini-Game" → lấy số từ `GAMES_CATALOG.length`. "Tưới nước cho cây" bắn confetti mỗi lần chạm → giới hạn 1 lần/ngày.
11. QA: thêm `data-testid="nav-<screen>"` cho mọi mục điều hướng (trên + dưới), sửa các script `qa/*.mjs` đang hỏng vì T01 đổi nhãn (chạy thử best-effort theo 00_RULES).

## Nghiệm thu riêng
- Số đo trong báo cáo: vị trí nút đóng game ở 360 và 375px, độ rộng menu ở 1024/1280/1440, tỉ lệ tương phản chữ banner, `font-family` của body.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T01B_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
