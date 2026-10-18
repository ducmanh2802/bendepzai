# T01 — Hotfix giao diện, ngày giờ, font offline

**Đọc trước:** `00_RULES.md`, `P42_AUDIT.md` mục 1 (B1, B8, B10, B11, B12, B13).
**Nhánh:** `p42/T01`

## Việc cần làm
1. **B1 – Banner hero trắng** (`src/index.css`, `HomeScreen.tsx`, `GamesHubScreen.tsx`): `.kb-hero-pattern` đang ghi đè `background-image` của `bg-gradient-*`. Sửa sao cho gradient cam hiện ra VÀ hoạ tiết chấm nằm trên (đưa vào `@layer components` + dùng pseudo-element `::before`, hoặc background nhiều lớp). Kiểm tra mọi chỗ dùng class này.
2. **B8 – Ngày theo giờ VN:** thay mọi `new Date().toISOString().split('T')[0]` dùng làm "ngày" bằng hàm `localDateKey(date = new Date())` (YYYY-MM-DD theo giờ máy) đặt trong `src/services/dateUtils.ts`. Áp dụng cho streak, nhiệm vụ ngày, ôn tập, screen time, decision engine. Dữ liệu cũ vẫn đọc được. Test: 06:30 sáng giờ VN phải ra đúng ngày hôm nay.
3. **B10:** thêm rule mở khoá cho `ach_review_pro` (hoàn thành ôn tập 5 ngày) và `ach_weekly_hero` (hoàn thành 1 Thử Thách Tuần); clear timer trong `useGameStage` khi unmount.
4. **B11 – Điều hướng:** ≥ 1024px chỉ hiện top nav; < 1024px chỉ hiện bottom nav. (Giảm còn 5 mục sẽ làm ở T06 — ở đây chỉ hết trùng & hết bị cắt: cho bottom nav co icon + nhãn ngắn vừa 375px.)
5. **B12 – Font offline:** self-host Nunito + Comfortaa (woff2, subset latin + vietnamese) trong `public/fonts/`, khai báo `@font-face` với `font-display: swap`, bỏ link Google Fonts; thêm vào precache của `public/sw.js` (tăng version cache).
6. **B13:** cây ở Vườn Sao hiển thị giai đoạn đúng với số bài (0 bài = "Hạt giống"); nhãn số game trong Home/Hub lấy từ `GAMES_CATALOG.length`, không ghi cứng.

## Nghiệm thu
- Ảnh chụp Home + Games Hub (1280 và 375) thấy rõ chữ trắng trên nền cam (dùng playwright script trong `qa/`, lưu ảnh vào `docs/opencode/reports/img/T01_*`).
- Test mới: `tests/date-utils.test.ts`, test unlock 2 thành tựu.
- typecheck + test + build PASS.
