# T01 REPORT — Hotfix giao diện, ngày giờ, font offline

**Nhánh:** `p42/T01` · **Ngày:** 2026-10-14

## Đã làm

1. **B1 – Banner hero trắng** (`src/index.css`, `GamesHubScreen.tsx`)
   - Chuyển `.kb-hero-pattern` vào `@layer components`, dùng `::before` overlay chấm + `isolation: isolate`, không còn ghi đè `background-image` của `bg-gradient-*`.
   - Hero Home/Games Hub giữ gradient cam/tím, chữ trắng đọc rõ. Kiểm chứng: `getComputedStyle(hero).backgroundImage` = `linear-gradient(...)`.
   - Tách `src/data/gamesCatalog.ts` (single source of truth, không import component) để `HomeScreen` đếm game mà không kéo cả chunk Games Hub vào main bundle (fix cảnh báo INEFFECTIVE_DYNAMIC_IMPORT).
2. **B8 – Ngày theo giờ VN** (`src/services/dateUtils.ts` mới + 6 file)
   - `localDateKey(date)` (YYYY-MM-DD giờ máy), `parseDateKey`, `diffDateKeys`.
   - Áp dụng: `storage.ts` (streak, quests, analytics), `HomeScreen` (rương), `learningOS.generateDailyPlan`, `kidBoxStore.todayISO`, `kidBoxIngest.normaliseISODate`, `ParentDashboardModal` (tên file export). Dữ liệu cũ YYYY-MM-DD vẫn đọc được.
3. **B10 – Thành tựu + timer**
   - `ach_review_pro`: mở khi đủ 5 ngày ôn tập khác nhau (`kho_bau_review_days` + `recordDailyReviewCompleted()`); `ach_weekly_hero`: mở khi `completedWeeklyChallenges >= 1` (`recordWeeklyChallengeCompleted()`).
   - `DailyReviewScreen` ghi nhận ngày review + quest `daily_review`; `WeeklyChallengeScreen` dùng API mới (gọi `checkAchievements`).
   - `useGameStage`: cleanup `clearTimeout` khi unmount.
   - Sửa mô tả `ach_review_pro` thành "5 ngày khác nhau".
4. **B11 – Điều hướng**
   - Top nav: `hidden lg:flex` (4 mục) + `hidden xl:flex` (đủ 7); Bottom nav: `lg:hidden` (chỉ < 1024px). Không còn hiện cả 2 cùng lúc.
   - Bottom nav 7 tab gọn vừa 375px: `flex-1 min-w-0`, nhãn ngắn (L.Đọc, Đ.Trường, T.Chơi, V.Sao), icon 18px, chữ 10px, touch 48px.
5. **B12 – Font offline**
   - Tải 14 file woff2 (Nunito 500–900 + Comfortaa 600–700, latin + vietnamese) vào `public/fonts/`, khai báo `@font-face font-display: swap`, bỏ link Google Fonts, preload Nunito 800.
   - `sw.js`: cache version `kho-bau-v2`, precache shell + 14 font (best-effort).
6. **B13 – Vườn Sao + đếm game**
   - Cây: 0 bài = "Hạt giống 🌱" (trước luôn "Đang Nở Hoa"); 1–2 Nảy mầm, 3–4 Cây non, 5–7 Cây lớn, 8+ Nở hoa.
   - Nhãn game lấy từ `GAMES_CATALOG.length` (Home + Hub đã động).

## File thay đổi

- Mới: `src/services/dateUtils.ts`, `src/data/gamesCatalog.ts`, `tests/date-utils.test.ts`, `tests/t01-achievements.test.ts`, `qa/t01-hotfix.mjs`, `public/fonts/*.woff2` (14), `docs/opencode/reports/img/T01_*.png` (4)
- Sửa: `src/index.css`, `index.html`, `public/sw.js`, `src/services/storage.ts`, `src/services/learningOS.ts`, `src/services/kidBoxStore.ts`, `src/data/kidBoxIngest.ts`, `src/hooks/useGameStage.ts`, `src/App.tsx`, `src/components/common/Header.tsx`, `src/components/home/HomeScreen.tsx`, `src/components/games/GamesHubScreen.tsx`, `src/components/achievements/AchievementsGardenScreen.tsx`, `src/components/review/DailyReviewScreen.tsx`, `src/components/challenge/WeeklyChallengeScreen.tsx`

## Số liệu

| Lệnh | Kết quả |
|---|---|
| `npm run typecheck` | PASS |
| `npm test` | **409/409 PASS** (26 file; cũ 401 + 5 date-utils + 3 achievements) |
| `npm run build` | PASS (~1–15s), hết cảnh báo INEFFECTIVE_DYNAMIC_IMPORT |
| `node qa/t01-hotfix.mjs` | ok:true, hero gradient hiện, bottom nav 375-visible / 1280-hidden |

## Ảnh

- `docs/opencode/reports/img/T01_home_1280.png` — hero cam chữ trắng rõ, top nav đủ 7, không bottom nav
- `docs/opencode/reports/img/T01_hub_1280.png`
- `docs/opencode/reports/img/T01_home_375.png` — bottom nav 7 mục vừa khít
- `docs/opencode/reports/img/T01_hub_375.png`

## Việc còn tồn

- T06 sẽ giảm bottom nav còn 5 mục (hiện 7 mục gọn tạm).
- Font Comfortaa/Nunito chỉ self-host 2 subset; cyrillic/greek không cần cho lớp 1.
