# T15_REPORT — 3 trò chơi Tiếng Việt mới

**Nhánh:** `p42/T15` · **Task:** `docs/opencode/queue/23_T15_game_tieng_viet.md` (thắng spec gốc `T15_game_tieng_viet_moi.md` chỗ khác nhau).

## Đã làm gì

3 game mới, mỗi game gồm **data pack thuần TS** (`src/data/games/`, builder seeded theo cấp) + **component** (`src/components/games/`, `useGameStage` 6 cấp + `GameModalWrapper`), đăng ký đủ **3 nơi** (catalog, registry, `LAUNCHABLE_GAME_IDS`), nhãn "MỚI" (tự động qua `StorageService.isNewGame` + `isNew: true` trong catalog):

| Game | ID | Data pack | Nội dung theo cấp |
|---|---|---|---|
| Tô Dấu Thanh 🖌️ | `tone_paint` | `tone_paint.ts` — 6 pool × 8 mục | T1 ngang/sắc/huyền 1 nguyên âm → T2 +hỏi/ngã/nặng → T3 vần đôi dễ + chọn vị trí (bèo, cáo, mèo…) → T4 vần khó + vị trí (hoà, khoẻ, thửa, lưỡi, xoài, chuối…) → T5 từ 2 tiếng khoanh tiếng tô dấu → T6 từ 2 tiếng khó (quyển, vầng, thuyền…) |
| Đoàn Tàu Ghép Vần 🚞 | `rhyme_train` | `rhyme_train.ts` — 6 pool × 8 mục | T1–T2 âm đầu + vần đơn (b+ò=bò…) → T3 vần khó (oan, uyên, uôi, oài) → T4 vần khó + dấu → T5–T6 toa = tiếng thứ hai của từ 2 tiếng (xe+đạp, quyển+sách…) |
| Đọc Câu Làm Theo 🙋 | `read_and_do` | `read_and_do.ts` — 6 pool × 8 câu | T1 "Đặt … lên …" → T2 dưới/cạnh/trong → T3 màu sắc → T4 số lượng → T5 câu 2 vế (2 lần đưa) → T6 2 vế + màu/số |

- Mỗi game: màn hướng dẫn ("Bắt đầu ▶"), phản hồi đúng/sai + `praiseEngine` + Gấu 🐻 qua `GameModalWrapper`, nút loa nghe lại (không tự đọc mới, giữ nguyên `questionAutoplay`), chuột + chạm + bàn phím (phím số; ReadAndDo thêm kéo-thả HTML5), nút ≥ 44px, `data-testid="answer-option"` + `data-correct` **chỉ khi URL có `?qa=1`**.
- Hoạt ảnh CSS thuần (`animate-shake`, transition tàu chạy) + `motion-reduce:transition-none`; không `setInterval` cho chuyển động (không vòng rAF nào chạy nền → không cần dừng khi tab ẩn); `prefers-reduced-motion` toàn cục trong `index.css` vẫn giữ.
- Kiểu dấu theo SGK (hoà, khoẻ — không "hòa/khỏe"), NFC, không từ cấm (test quét toàn bộ), nội dung vui cho bé lớp 1.
- `qa/games.mjs`: thêm 3 tựa đúng thứ tự catalog (18 → 21).

## File thay đổi

- Mới: `src/data/games/{tone_paint,rhyme_train,read_and_do}.ts`, `src/components/games/{TonePaintGame,RhymeTrainGame,ReadAndDoGame}.tsx`, `tests/t15-viet-games.test.ts` (23 test).
- Sửa: `src/data/gamesCatalog.ts` (+3 entry `viet`, `isNew`), `src/components/games/registry.ts` (+3 lazy), `src/config/policy.ts` (`LAUNCHABLE_GAME_IDS` +3), `qa/games.mjs` (+3 tựa), `src/index.css` (+keyframes `shake-x`/`.animate-shake`).
- **Ngoài phạm vi (ghi rõ theo luật 00_RULES §13):** `RhymeHunterGame.tsx`, `ListenPickPhonicsGame.tsx`, `CatchFallingLettersGame.tsx` — sửa crash P0 có sẵn (xem "Quyết định" 1).

## Số liệu trước/sau

| Chỉ số | Trước | Sau |
|---|---|---|
| Trò chơi (catalog/registry/LAUNCHABLE) | 18 | **21** (t08 test khớp 3 danh sách PASS) |
| Game Tiếng Việt trong Hub | 6 | **9** |
| Test | 693 (44 files) | **716** (45 files), gồm 23 test T15 mới |
| Main chunk | 519,8 kB | **520,8 kB** PASS (≤ 600 kB) — 3 game nằm trong lazy chunk riêng (~23–30 kB/game) |
| Browser probe tự viết (6 game feedback, viewport 390×844) | — | **ok:true, 0 console error**; 3 game mới mở/chơi/đóng được, dialog 358/358 không tràn |

## Lệnh đã chạy + kết quả

- `npm run typecheck` — PASS.
- `npm test` — **716/716 PASS** (45 files).
- `npm run build` — PASS (cảnh báo chunk > 500 kB có sẵn, không mới).
- `npm run check:budget` — PASS (520,8 kB ≤ 600 kB).
- `node qa/run-one.mjs qa/games.mjs` — **SKIPPED**: probe chung stale từ T06 (chờ text `Xin chào`, trang chủ nay là `Chào {tên}!`; xem T14B_REPORT) — best-effort theo luật §10. Thay bằng probe tạm (không commit) mở/chơi/đóng 6 game feedback ở 390×844: **PASS, 0 console error**, dialog 3 game mới không tràn ngang (tràn 149px đo được là của header trang chủ phía sau modal — lỗi có sẵn, thuộc T01B/T20).
- Không thêm dependency nào.

## Quyết định tự đưa ra

1. **Sửa crash P0 có sẵn ở 3 game cũ** (`rhyme_hunter`, `listen_pick`, `catch_letters`): chúng gọi `useGameFeedback()` trong cùng component render `GameModalWrapper` (provider) → React throw *"must be used within GameModalWrapper"*, mở game là app trắng trang (probe xác nhận, kể cả game cũ). Sửa cơ học: tách phần chơi thành component `*Stage` con nằm trong provider, giữ nguyên mọi state/effect/hành vi (builder test không đổi, typecheck + probe xác nhận). Không thêm `answer-option` cho game cũ (ngoài phạm vi T15; probe vẫn đóng/mở sạch).
2. **Không sửa selector stale của `qa/games.mjs`** (ngoài `GAME_TITLES` bắt buộc): probe chung còn hỏng ở desktop (nav `lg:hidden`) — thuộc T20; đã ghi SKIPPED + bằng chứng.
3. **Nhãn "MỚI"**: Hub tự gắn qua `StorageService.isNewGame`; vẫn đặt `isNew: true` trong catalog cho đủ dữ liệu.
4. **Test builder thay vì render**: repo không có testing-library/jsdom — theo chuẩn hiện hành (logic builder + kiểm tra tĩnh source cho hợp đồng component, gồm quy tắc provider/consumer mới).
5. **Không storage migration**: 3 game mới chưa có tiến độ cũ; `useGameStage`/`StorageService` hiện có xử lý mặc định.

## Việc còn tồn

- `qa/games.mjs` cần T20 sửa selector (`Xin chào` → `Chào`, nav desktop) để nghiệm thu chung chạy lại được.
- Header trang chủ tràn 149px ở 390px (lỗi T01B cũ, ngoài phạm vi).
- Đề xuất T20B: thêm `answer-option` cho 6 game cũ còn lại để probe tự chơi được mọi game.
