# T01B REPORT — Sửa gấp giao diện điện thoại & desktop

**Nhánh:** `p42/T01B` · **Ngày:** 2026-10-14 · **Chạy:** unattended (auto-runner, không hỏi ai — mọi quyết định dưới đây do tôi tự đưa ra)

**Kết quả:** `npm run typecheck` PASS · `npm test` **496/496 PASS** (471 cũ + 25 mới) · `npm run build` PASS ·
probe trình duyệt thật `qa/t01b-fixes.mjs` **30/30 PASS** · probe hồi quy `qa/t01-hotfix.mjs` PASS.

**Điểm xuất phát:** nhánh đã có commit `deb664c` (phiên trước để lại: header game, hook history, sticky, font, banner, pwa, touch targets, water, probe T01B).
Tôi kiểm tra toàn bộ, giữ phần đúng, sửa phần còn hỏng (menu vẫn tràn 1280/1440, probe so icon sai + testid trùng, test breakpoint cũ), thêm test vitest + báo cáo, chạy lại đủ 3 lệnh + 2 probe rồi mới commit.

## 1. Đã làm gì (đủ 11 mục task)

| # | Mục task | Việc làm | File |
|---|---|---|---|
| 1 | Header game 1 dòng, nút đóng luôn hiện + Esc/Back | Viết lại header `GameModalWrapper`: nút đóng **đứng đầu** (`data-testid="game-close"`, 44px, `title="Đóng trò chơi (Esc)"`), tên game `truncate` + tooltip đầy đủ, tiến độ gọn `Màn 2/6 · Câu 3/6` (tên màn chỉ hiện ≥420px). Hook mới `useModalHistory`: mở modal → `pushState`; Back (`popstate`) / Esc → đóng (Esc đi qua `history.back()` để không kẹt entry); cleanup tự bóc entry thừa. Áp dụng cho cả `LessonPlayerModal` (`data-testid="lesson-close"`) | `src/hooks/useModalHistory.ts` (mới), `GameModalWrapper.tsx`, `LessonPlayerModal.tsx` |
| 2 | Bài học 375×667 nút khuất | Tách vùng cuộn (`flex-1 overflow-y-auto`) và **footer dính đáy** (`shrink-0 border-t-2 bg-white/95`, safe-area) chứa nút Kiểm tra/Câu tiếp theo | `LessonPlayerModal.tsx` |
| 3 | Menu desktop tràn ở 1024/1280/1440 | Top nav lg–2xl hiện **cả 7 mục dạng icon-only** (aria-label/title giữ tên đầy đủ); nhãn đầy đủ chỉ từ 2xl. XP pill `hidden lg:flex` → `hidden xl:flex` | `src/components/common/Header.tsx` |
| 4 | Đổi màn cuộn về đầu | `useEffect [currentScreen]` → `window.scrollTo({top:0})`, tôn trọng `prefers-reduced-motion` | `src/App.tsx` |
| 5 | Font Nunito bị `font-sans` ghi đè | Thêm `@theme { --font-sans: 'Nunito', …; --font-display: … }` (Tailwind v4 sinh `font-sans` từ token này) | `src/index.css` |
| 6 | Chữ trắng banner Home 2,1–2,7:1 → ≥4,5:1 | Gradient `amber-400/orange-400/rose-400` → **`amber-700/orange-700/rose-700`**; pill thống kê `bg-white/20` → `bg-black/25` | `HomeScreen.tsx` |
| 7 | Banner "Có bản mới" hiện sai lần đầu | `sw.js`: `matchAll({includeUncontrolled:true})` → `matchAll({type:'window'})` (chỉ báo trang đang bị SW điều khiển). `pwa.ts onServiceWorkerUpdate`: bỏ qua `SW_UPDATED` khi `navigator.serviceWorker.controller == null` | `public/sw.js`, `src/services/pwa.ts` |
| 8 | 2 icon loa giống nhau | Nút hướng dẫn → icon **Megaphone** + `aria-label="Nghe hướng dẫn chơi"`; nút tắt tiếng giữ loa + `aria-label="Tắt/Bật âm thanh trò chơi"` | `GameModalWrapper.tsx` |
| 9 | Nút < 44px | `min-h-[44px]` cho: Chơi ngay hub (`px-5`), tab thể loại, Vào học, tab shop, Mở khóa, "Bé cần gợi ý?", "Nghe lại", mọi nút quay lại (WorldMap/Games/Subject/Garden/Review/Weekly/Competition/Shop), nút tưới cây | 10 file component (xem §2) |
| 10 | WorldMap "10+ Mini-Game" + confetti mỗi chạm | Subtitle ← `GAMES_CATALOG.length` (=18, import data-only, không phình main chunk). Tưới cây: key mới `kho_bau_tree_water` + `get/setTreeWateredDate` (sanitizer YYYY-MM-DD, key mới nên không cần migration, tiến độ cũ nguyên vẹn); cùng ngày → không confetti, lời khen khác, nút "Đã tưới hôm nay 💧" | `WorldMapScreen.tsx`, `storage.ts`, `AchievementsGardenScreen.tsx` |
| 11 | QA hooks + script hỏng | `data-testid="nav-<screen>"` cho nav trên (Header) + dưới (App); bottom nav thêm `aria-label` tên đầy đủ (script cũ tìm "Trò Chơi"/"Luyện Đọc"/"Đấu Trường" qua scoped navigation vẫn chạy). Probe mới `qa/t01b-fixes.mjs` (30 assert, dùng được với `qa/run-one.mjs` + standalone) | `App.tsx`, `Header.tsx`, `qa/t01b-fixes.mjs` |

## 2. File thay đổi (17 sửa + 3 mới)

Sửa: `src/index.css`, `src/App.tsx`, `src/components/common/Header.tsx`,
`src/components/games/GameModalWrapper.tsx`, `src/components/games/GamesHubScreen.tsx`,
`src/components/learning/LessonPlayerModal.tsx`, `src/components/home/HomeScreen.tsx`,
`src/components/world/WorldMapScreen.tsx`, `src/components/subject/SubjectScreen.tsx`,
`src/components/shop/AvatarShopScreen.tsx`, `src/components/achievements/AchievementsGardenScreen.tsx`,
`src/components/review/DailyReviewScreen.tsx`, `src/components/challenge/WeeklyChallengeScreen.tsx`,
`src/components/competition/CompetitionHubScreen.tsx`, `src/services/storage.ts`,
`src/services/pwa.ts`, `public/sw.js`.
Mới: `src/hooks/useModalHistory.ts`, `tests/t01b-ui-fixes.test.ts` (25 test), `qa/t01b-fixes.mjs`.
Không đụng: `docs/opencode/queue|state|logs|TRANG_THAI.md`. Không thêm dependency.

## 3. Số liệu trước → sau (đo thật bằng Chromium 1243, `vite preview` + build mới)

| Chỉ số | Trước | Sau |
|---|---|---|
| Nút đóng game 360px | ngoài màn hình (header cần 428px, có 343px) | **trong viewport, 44×44 tại x=24** |
| Nút đóng game 375px | ngoài màn hình | **trong viewport, 44×44 tại x=24** |
| Header game | 2 cụm, cao ~90px+ | **1 dòng, cao 62px** |
| Đóng bằng Esc / Back (game + bài học) | không có | **PASS cả 2 cỡ màn** |
| Nút Kiểm tra 375×667 | khuất, phải cuộn | **thấy ngay (bottom=624/667, cao 52px)** |
| Header tràn 1024 / 1280 / 1440 | tràn 90–176px (audit), nút Ba Mẹ mất | **overflow 0/0/0, Ba Mẹ hiện cả 3** |
| `font-family` của body | stack hệ thống (`font-sans` gốc thắng) | **`Nunito, -apple-system, …`** |
| Tương phản chữ trắng banner Home | 1,67 / 2,26 / 2,69:1 | **5,02 / 5,18 / 6,29:1 (≥4,5:1)** |
| Banner "Có bản mới" lần mở đầu | hiện sai | **không hiện (count=0)** |
| Icon loa game | 2× Volume2 | **megaphone vs volume-2, aria-label riêng** |
| Đếm game WorldMap | "10+ Mini-Game" cứng | **"18 Mini-Game" từ `GAMES_CATALOG.length`** |
| Tưới cây | confetti mỗi chạm | **confetti 1 lần/ngày** |
| `nav-<screen>` testid | 0 | **7/7 (trên + dưới)** |
| Probe T01 cũ (hồi quy) | — | **PASS (bottom nav 375 hiện / 1280 ẩn)** |

## 4. Lệnh đã chạy + kết quả

- `npm run typecheck` → PASS (3 lần, sau mỗi đợt sửa).
- `npx vitest run tests/t01b-ui-fixes.test.ts` → 25/25 PASS.
- `npm test` → **30 file, 496/496 PASS** (gốc 471 + 25 mới).
- `npm run build` → PASS (~1,9s; cảnh báo chunk 727 kB có sẵn từ trước P42, T02C sẽ xử lý).
- `node qa/run-one.mjs qa/t01b-fixes.mjs` → `{"ok":true}` 30/30 PASS (lần 1 phát hiện tràn menu 1280/1440 + so sánh icon sai → đã sửa code + probe rồi chạy lại PASS).
- `node qa/run-one.mjs qa/t01-hotfix.mjs` → PASS, ảnh mới trong `docs/opencode/reports/img/T01_*`.
- Không chạy `npx playwright install` (đúng luật). Không có SKIPPED — trình duyệt mở được.

## 5. Quyết định tự đưa ra (không ai trả lời, tôi tự chốt)

1. **Menu: icon-only cả 7 mục ở lg–2xl** thay vì menu "Thêm" — vì task cho phép ("hoặc chỉ hiện icon"), dropdown thêm rủi ro a11y/JS cho bé lớp 1; icon-only đã chứng minh vừa 1024/1280/1440 bằng số đo thật. Nhãn đầy đủ giữ trong `aria-label`/`title`/tooltip + hiện lại từ 2xl.
2. **Esc đi qua `history.back()`** thay vì gọi `onExit` trực tiếp — để entry đã đẩy được bóc gọn, nút Back sau này không phải bấm 2 lần; cleanup cũng bóc entry khi modal tự đóng (nút "Tiếp tục học").
3. **Không sửa từng script `qa/*.mjs` cũ**: kiểm tra hết — mọi cú click nav đều đã scope theo `navigation "Điều hướng nhanh"` nên `aria-label` mới giúp chúng chạy lại mà không cần đụng; chỉ probe T01B mới dùng helper "bấm nút đang hiện" vì testid tồn tại song song trên/dưới.
4. **Ngày tưới cây lưu key riêng** (`kho_bau_tree_water`) thay vì nhét vào `ChildProfile` — tránh migration profile và mọi nguy cơ reset tiến độ bé; vẫn đúng luật (có sanitizer + test).
5. **Chỉ làm đậm banner Home**, không đụng banner GamesHub/môn học — task chỉ yêu cầu banner Home; để lại cho task giao diện sau (ghi ở §6).

## 6. Việc còn tồn

- Banner GamesHub/môn học dùng gradient 400–500 + pill `bg-white/20` nên tương phản chữ trắng vẫn < 4,5:1 — đề nghị task giao diện sau (T06/T08) áp dụng cùng công thức (700 + pill đen mờ).
- Subject card "Bắt đầu học" (chữ trắng trên `bg-white/20`) tương tự — ngoài phạm vi T01B.
- Chunk chính 727 kB (cảnh báo build có sẵn) — thuộc T02C (hạ tầng/offline/chia chunk).
- Ảnh `docs/opencode/reports/img/T01_*` bị probe hồi quy ghi đè (nội dung mới, đúng build T01B) — không commit ảnh (giữ repo gọn; chỉ commit code + báo cáo + test + qa script).
