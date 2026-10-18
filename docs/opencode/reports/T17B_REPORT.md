# T17B_REPORT — 2 trò chơi Logic & Khoa học: Lập Trình Tìm Kho Báu + Nhà Khoa Học Nhí

**Nhánh:** `p42/T17B` · **Task:** `docs/opencode/queue/26_T17B_game_logic_khoa_hoc.md`
(thắng spec gốc `T17_game_anh_logic_khoahoc.md` chỗ khác nhau — chỉ làm **game 3 và 4**).

## Đã làm gì

2 game mới trong danh mục lọc mới **"Logic & Khoa học"** (`GameCategory 'logic'`),
mỗi game gồm **data pack thuần TS** (`src/data/games/`, builder seeded theo cấp) +
**component** (`src/components/games/`, `useGameStage` 6 cấp + `GameModalWrapper`),
đăng ký đủ **4 nơi** (catalog, registry, `LAUNCHABLE_GAME_IDS`, `qa/games.mjs`),
nhãn "MỚI" (`isNew: true`):

| Game | ID | Data pack | Nội dung theo cấp |
|---|---|---|---|
| Lập Trình Tìm Kho Báu 🗺️ | `treasure_coding` | `treasure_coding.ts` — 6 param-pool × 8, sinh màn seeded | T1 lưới 4×4 đường thẳng → T2 rẽ 1–2 lần → T3 5×5 đường vòng → T4 5×5 + 🗝️ chìa khoá phải lấy trước → T5 6×6 + chìa khoá + khối 🔁×2 → T6 6×6 nhiều đá, đường dài hơn (lời giải ≤ 12 bước). Nút 👣 "Từng bước" + nút ▶ Chạy (hoạt ảnh rAF, dừng khi tab ẩn) |
| Nhà Khoa Học Nhí 🔬 | `little_scientist` | `little_scientist.ts` — 6 pool × 8 vật | T1 chìm/nổi (thả chậu nước) → T2 sống/không sống → T3 ngày/đêm → T4 nóng/lạnh → T5 nam châm hút/không hút → T6 trộn cả 5 luật. Mỗi đáp án 1 câu giải thích ngắn, game **đọc to** sau khi bé đúng |

- Mỗi game: màn hướng dẫn ("Bắt đầu ▶"), phản hồi đúng/sai + `praiseEngine`
  (coding → `MATH`, scientist → `VIETNAMESE`, cả prop tường minh lẫn fallback
  trong wrapper) + Gấu 🐻 qua `GameModalWrapper`, nút loa nghe lại (không tự
  đọc mới — `audioInstruction` chuẩn của wrapper như mọi game cũ; giữ nguyên
  mặc định `questionAutoplay`), chuột + chạm + bàn phím (mũi tên/Enter/Backspace;
  phím số chọn giỏ), nút ≥ 44px, `data-testid="answer-option"` + `data-correct`
  **chỉ khi URL có `?qa=1`** (coding: gợi ý bước tiếp theo của lời giải BFS).
- Hoạt ảnh CSS thuần (`animate-shake`, `animate-pop`) + `requestAnimationFrame`
  cho Gấu đi (tự dừng khi tab ẩn qua `document.hidden`), `motion-reduce` đầy đủ;
  không `setInterval`.
- Tiếng Việt chuẩn GDPT + NFC; không từ cấm (quét cả tên vật và câu giải thích).
- `little_scientist` gắn `skillIds` môn Em & Cuộc sống có thật:
  `life_science_sinkfloat`, `life_science_living`, `life_weather_daynight`.
- Hub: tab "🔬 Logic & Khoa học" (lưới tab `grid-cols-3 sm:grid-cols-6` để
  mobile 375px không tràn), counts động đã gồm `logic`.
- `qa/games.mjs`: thêm 2 tựa đúng thứ tự catalog (26 → 28).

## File thay đổi

- Mới: `src/data/games/{treasure_coding,little_scientist}.ts`,
  `src/components/games/{TreasureCodingGame,TreasureCodingParts,LittleScientistGame}.tsx`
  (Parts = lưới bản đồ + thanh chương trình + cụm nút, tách để mỗi file < 300 dòng),
  `tests/{t17b-coding,t17b-scientist}.test.ts` (25 test).
- Sửa: `src/data/gamesCatalog.ts` (type `GameCategory` + 2 entry `logic`),
  `src/components/games/registry.ts` (+2 lazy),
  `src/config/policy.ts` (`LAUNCHABLE_GAME_IDS` +2),
  `src/components/games/GameModalWrapper.tsx` (`treasure_coding` vào nhóm MATH
  cho praise mặc định đúng; scientist mặc định VIETNAMESE),
  `src/components/games/GamesHubScreen.tsx` (tab + counts + lưới),
  `qa/games.mjs` (+2 tựa).
- Không file ngoài phạm vi (không đụng storage/validator — không migration cần thiết).

## Số liệu trước/sau

| Chỉ số | Trước | Sau |
|---|---|---|
| Trò chơi (catalog/registry/LAUNCHABLE) | 26 | **28** (test t08 khớp 3 danh sách PASS) |
| Danh mục lọc Hub | 4 (+Tất cả) | **5** (+ Logic & Khoa học, 2 game) |
| Màn lập trình có lời giải (BFS kiểm) | — | **100%** (6 cấp × 20 seed × mọi vòng) |
| Test | 797 (51 files) | **822** (53 files), gồm 25 test T17B mới |
| Main chunk | 538,6 kB | **538,6 kB** PASS (≤ 600 kB) — 2 game nằm trong lazy chunk riêng (Coding 14,9 kB / Scientist 12,8 kB) |

## Lệnh đã chạy + kết quả

- `npm run typecheck` — PASS.
- `npm test` — **822/822 PASS** (53 files).
- `npm run build` — PASS (cảnh báo chunk > 500 kB có sẵn, không mới).
- `npm run check:budget` — PASS (538,6 kB ≤ 600 kB); `bundle-budget` +
  `sw-precache` + `t08` test PASS trên dist mới (2 chunk game mới được precache).
- `node qa/run-one.mjs qa/games.mjs` — **SKIPPED** (lý do có sẵn như
  T15/T16/T17A: probe chờ text `Xin chào`, trang chủ nay là `Chào Bé Minh!`;
  hỏng trước khi mở bất kỳ game nào — thuộc T20, ngoài phạm vi).
- Không thêm dependency nào.

## Quyết định tự đưa ra

1. **Màn chơi sinh có kiểm chứng thay vì viết tay 48 màn**: đặt đá ngẫu nhiên
   (ưu tiên ngoài đường gốc), rồi BFS kiểm lại — vô nghiệm hoặc lời giải
   > 12 bước thì bớt đá dần. Vừa đảm bảo nghiệm thu "mọi màn đều có lời giải",
   vừa giữ màn vừa sức lớp 1 (UI tối đa 14 token).
2. **Chìa khoá chỉ từ T4, vòng lặp ×2 chỉ từ T5** (đúng spec "cấp cao");
   test khoá điều này. Praise coding = MATH (tư duy thứ tự gần toán nhất),
   scientist = VIETNAMESE (mặc định cho `cuoc-song`, như `toPraiseSubject`).
3. **Giữ chương trình của bé sau khi sai** (chỉ reset khi sửa token): bé lớp 1
   sửa từng bước thay vì xếp lại từ đầu; nút ⌫/🗑 + Backspace.
4. **Giải thích khoa học đọc to sau khi đúng** (feedback speech như mọi game),
   hiện chữ kèm "💡 Vì sao?" trong lúc chờ qua câu — không phải autoplay mới.
5. **Test builder + kiểm tra tĩnh source** (không render): theo chuẩn T15–T17A
   (repo không có testing-library/jsdom); riêng luật thắng/thua/chìa khoá có
   thêm màn tay 2×2 dựng trực tiếp để kiểm `simulateProgram` chính xác.
6. **Tách file < 300 dòng**: `TreasureCodingParts.tsx` (lưới + thanh lệnh +
   cụm nút), test chia 2 file (coding / scientist+đăng ký+hợp đồng).

## Việc còn tồn

- `qa/games.mjs` cần T20 sửa selector (`Xin chào` → `Chào`, nav desktop) để
  nghiệm thu chung chạy lại được (đã ghi từ T15).
- T18B/T19/T20 (luồng khác): hệ động lực, âm thanh, QA tổng — không thuộc T17B.
