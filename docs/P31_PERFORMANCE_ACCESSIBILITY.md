# P31 — PERFORMANCE / RESPONSIVE / ACCESSIBILITY

> Kiểm chứng bằng trình duyệt thật: `qa/responsive-a11y.mjs` trên production build.

## 1. Bundle

| Mốc | Main chunk | gzip |
|---|---|---|
| Trước | 629.60 kB | 169.20 kB |
| Sau code splitting | **450.78 kB** | **131.09 kB** |

Cách làm: `React.lazy` + `Suspense` trong `src/App.tsx` cho mọi màn hình không nằm trên
đường vào lần đầu.

| Chunk | kB | gzip |
|---|---|---|
| `index` (entry) | 450.78 | 131.09 |
| `GamesHubScreen` (+14 game) | 70.33 | 17.08 |
| `CompetitionHubScreen` | 45.90 | 10.82 |
| `ParentDashboardModal` | 26.99 | 6.78 |
| `ReadingFluencyScreen` | 20.50 | 5.97 |
| `AvatarShopScreen` | 7.28 | 2.51 |
| `WeeklyChallengeScreen` | 6.05 | 2.27 |
| `AchievementsGardenScreen` | 5.13 | 2.08 |
| `ScreenTimeModal` | 2.31 | 1.18 |

Màn hình chờ tải có `role="status" aria-live="polite"` và nhãn tiếng Việt rõ ràng.

> Không thêm thư viện nào. `motion`, `esbuild`, `autoprefixer`, `tsx`, `express`,
> `@google/genai`, `dotenv` đã bị gỡ vì không dùng — bớt cả dependency lẫn bundle.

## 2. Responsive (§23) — 6 viewport, 0 lỗi

| Viewport | Tràn ngang | Touch target < 44px |
|---|---|---|
| 360×800 | 0 px | 0 |
| 390×844 | 0 px | 0 |
| 768×1024 | 0 px | 0 |
| 1024×768 | 0 px | 0 |
| 1280×800 | 0 px | 0 |
| 1440×900 | 0 px | 0 |

### Ba lỗi responsive thật đã phát hiện và sửa

**a) Tràn ngang ở MỌI viewport** (97px @360, tệ nhất **655px @768**).
Header gộp 7 link điều hướng + logo + 4 ô thông tin trong một hàng không vừa.
Sửa:
- Điều hướng trên chỉ hiện từ `xl`.
- Thanh điều hướng dưới (sticky) mang **đủ 7 mục**, cuộn ngang, hiện tới `2xl`.
- Các ô thông tin ẩn dần: XP ở `lg`, sao ở `sm`, chuỗi ngày ở `md`.
- Logo `truncate` + `sr-only` khi màn hình hẹp.

**b) Tràn ngang ở 1280px và 1440px** (167px / 87px) sau khi bật thanh trên.
7 link không vừa cùng 4 ô thông tin trong container `max-w-7xl` (1280px).
Sửa: ở `xl` chỉ hiện 4 mục chính; `2xl` mới hiện đủ 7.

**c) 4 touch target dưới 44px**: logo (33×32), nút "Ba Mẹ" (38×44),
nút loa chào (34×36), nút rương (cao 40). Sửa bằng `min-w/min-h-[44px]`.

### Điều hướng dưới sau khi sửa

```
┌──────────────────────────────────────────────────────────┐
│ 🏠 Trang Chủ │ 🗺️ Bản Đồ │ 📖 Luyện Đọc │ 🏆 Đấu Trường │  ← cuộn ngang
│ 🎮 Trò Chơi │ 💡 Ôn Tập  │ 🌳 Vườn Sao                    │     7 mục, 48px
└──────────────────────────────────────────────────────────┘
```

## 3. Accessibility (§24)

| Kiểm tra | Kết quả |
|---|---|
| `<html lang>` | `vi` |
| Landmark `<main>` | 1 |
| Landmark `<nav>` | 3 (có `aria-label`: chính + nhanh + trong hub) |
| Heading | 10 |
| Nút **không** có tên truy cập | **0** (trước: 2) |
| Ô nhập không có nhãn | **0** |
| `<img>` thiếu `alt` | **0** |

### Sửa gì

- Icon trong header và thanh điều hướng: `aria-hidden="true"` — **không** đọc "📖 Luyện Đọc"
  mà đọc "Luyện Đọc" (tên truy cập sạch, trình đọc màn hình đọc nhanh hơn).
- Nút chỉ có icon: thêm `aria-label` thật
  ("Tủ đồ thời trang và Linh thú", "Bật âm thanh" / "Tắt âm thanh",
  "Khu vực dành cho Ba Mẹ", "Thoát bài thi", "Nghe lời chào").
- `aria-current="page"` cho tab đang xem; `aria-pressed` cho phương án đã chọn;
  `aria-expanded` cho nút "Vì sao?".
- `role="dialog" aria-modal` + `role="alertdialog"` cho hộp thoại xác nhận.
- `role="timer" aria-live="assertive"` khi còn ≤ 60 giây — trẻ được cảnh báo bằng âm thanh.
- `role="status"` cho phản hồi đúng/sai trong bài đọc và cho banner dữ liệu demo.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Đo thực tế với `emulateMedia({ reducedMotion: 'reduce' })`:

| Chỉ số | Giá trị |
|---|---|
| `heroAnimationDuration` | `1e-05s` |
| `heroTransitionDuration` | `1e-05s` |
| media query active | `true` |

## 4. Focus management (§24) — kiểm chứng bằng `qa/focus.mjs`

Hook dùng chung `src/hooks/useFocusTrap.ts`: khi mở, đưa focus vào phần tử tập trung đầu
tiên; giữ focus bên trong khi Tab / Shift+Tab; khi đóng, **trả focus về đúng nút đã mở nó**.

| Hộp thoại | Focus vào hộp | Tab giữ trong | Shift+Tab giữ trong | Trả focus về nút mở |
|---|---|---|---|---|
| Bài học (`LessonPlayerModal`) | PASS | PASS 25 lần | PASS 15 lần | PASS → "Vào học" |
| Game (`GameModalWrapper`, cả 14 game) | PASS | PASS 25 lần | — | PASS → "Chơi ngay" |
| Phụ huynh (`ParentDashboardModal`) | PASS | PASS 30 lần | — | — (chưa đóng trong test) |

### Hai lỗi thật do test phát hiện

1. **Mất focus sau cổng phụ huynh.** Khi màn hình cổng được thay bằng dashboard, nút
   "Mở Bảng Phụ Huynh" bị gỡ khỏi DOM → trình duyệt mất focus về `<body>`, tức người dùng
   bị ném về đầu trang. Đã thêm effect đưa focus trở lại dialog.
2. **Nút chỉ có icon không có tên truy cập.** Ba nút trong `GameModalWrapper` và một nút
   trong `LessonPlayerModal`. Đã thêm `aria-label` và kích thước tối thiểu 44px.

## 5. Test hook

Thêm `data-testid` ổn định thay vì đoán selector theo class:

| testid | Dùng ở |
|---|---|
| `answer-option` | LessionPlayerModal, ReadingFluencyScreen, CompetitionExamModal |
| `drag-item` / `drop-bucket` | kéo-thả của CompetitionExamModal |

## 6. Vòng đời & rò rỉ (§22)

| Nguồn rò | Cách xử lý |
|---|---|
| Timer bài thi | `setInterval` 250 ms, `clearInterval` trong cleanup của effect |
| Game dùng `setInterval` | đều `clearInterval` trong cleanup (đã kiểm ở 14 game) |
| Confetti (`canvas`) | phá canvas sau khi hạt rơi hết |
| Event listener | React tự quản lý; không `addEventListener` thô rò |
| TTS | `speechSynthesis.cancel()` trước khi phát câu mới |

Không phát hiện memory leak qua golden path (2 vòng học + 2 bài thi + 1 phiên đọc + reload ×2).

## 7. Offline / degraded mode (§25)

Ứng dụng **không** gọi mạng:

```bash
grep -rn "fetch(\|XMLHttpRequest\|axios" src   # → không có kết quả
```

Ngoài mạng, mọi thứ vẫn chạy: bài học, đọc hiểu, thi, game, phần thưởng, phụ huynh.
Không có AI provider để "mất".

## 8. Cách tự kiểm lại

```bash
npm run build
npm run preview -- --port 4180
node "<browser-skill>/browser.mjs" http://127.0.0.1:4180/ --script ./qa/responsive-a11y.mjs
node "<browser-skill>/browser.mjs" http://127.0.0.1:4180/ --script ./qa/focus.mjs
```

Kết quả mong đợi: mọi `horizontalOverflowPx` = 0, mọi `touchTargetsUnder44px` = 0,
`unlabelledButtons` = 0, `errors: []`.

> **Cảnh báo dành cho người viết QA:** đừng hardcode `http://127.0.0.1:PORT` trong script.
> Mỗi `host:port` là một **origin riêng**, và mỗi origin có `localStorage` riêng — chạy
> script trên cổng khác sẽ tạo ra ảo giác "app mất dữ liệu". `golden-path.mjs` đã ghi
> sentinel và kiểm tra origin để bắt đúng lỗi harness này.
