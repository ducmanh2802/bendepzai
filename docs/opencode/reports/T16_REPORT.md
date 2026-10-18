# T16_REPORT — 3 trò chơi Toán mới

**Nhánh:** `p42/T16` · **Task:** `docs/opencode/queue/24_T16_game_toan.md` (thắng spec gốc `T16_game_toan_moi.md` chỗ khác nhau).

## Đã làm gì

3 game mới, mỗi game gồm **data pack thuần TS** (`src/data/games/`, builder seeded theo cấp) + **component** (`src/components/games/`, `useGameStage` 6 cấp + `GameModalWrapper`), đăng ký đủ **3 nơi** (catalog, registry, `LAUNCHABLE_GAME_IDS`), nhãn "MỚI", dùng visuals T11 (`TenFrame`, `PlaceValueBlocks`, `NumberLine`, `ClockFace`):

| Game | ID | Data pack | Nội dung theo cấp |
|---|---|---|---|
| Chợ Khung 10 🧺 | `ten_frame_market` | `ten_frame_market.ts` — 6 pool × 8 mục | T1–T2 khung 10 (cần thêm mấy để đủ 10) → T3 hai khung đến 20 → T4 bó que tính chục–đơn vị (hỏi số chục hoặc số que lẻ còn thiếu) → T5 tiền hàng mệnh giá nhỏ (có tròn chục, giá hơn vài đồng) → T6 trộn |
| Ếch Nhảy Tia Số 🐸 | `number_line_hop` | `number_line_hop.ts` — 6 pool × 8 mục | T1 cộng 1–3 trong 0–10 → T2 cộng/trừ 1–4 → T3 cộng/trừ trong 0–20 → T4 nhảy theo chục 0–100 → T5 đề bằng lời ("Ếch lùi 4 bước") → T6 trộn |
| Thợ Sửa Đồng Hồ ⏰ | `clock_builder` | `clock_builder.ts` — 6 pool × 8 mục | T1 giờ đúng 1–6 buổi sáng → T2 giờ 1–12 cả ngày → T3 giờ + buổi sáng/chiều (đúng cả 2 ý) → T4 giờ khó + thứ trong tuần → T5 thứ + ngày tờ lịch → T6 trộn |

- Mỗi game: màn hướng dẫn ("Bắt đầu ▶"), phản hồi đúng/sai + `praiseEngine` MATH + Gấu 🐻 qua `GameModalWrapper`, nút loa nghe lại (không tự đọc mới, giữ nguyên `questionAutoplay`), chuột + chạm + bàn phím, nút ≥ 44px, `data-testid="answer-option"` + `data-correct` **chỉ khi URL có `?qa=1`**.
- Tương tác đúng spec: Chợ — bấm "Thêm 1 quả" để lấp đầy khay xem trước rồi chạm số đáp án; Ếch — bấm "Nhảy 1 bước" đúng số lần (tới đích là đúng ngay) hoặc chạm thẳng số đích; Đồng hồ — chạm số giờ để kim chạy, màn 3+ chọn thêm buổi sáng/chiều, bấm "Chốt giờ ✅".
- Hoạt ảnh CSS thuần (`animate-shake`, transition) + `motion-reduce:transition-none`; không `setInterval` cho chuyển động; `prefers-reduced-motion` toàn cục giữ nguyên.
- Giới hạn lớp 1: đáp án luôn 0–9 (vòng hỏi "mấy chục" đáp bằng số chục), số ≤ 100, phép hiện rõ trên tia số đều không nhớ/không mượn (kiểm bằng `isNoCarryAdd`/`isNoBorrowSub`), chỉ giờ đúng (`phut={0}`), ngày 1–28 không tràn tháng, NFC, không từ cấm, đề không lộ đáp án (test quét).
- `qa/games.mjs`: thêm 3 tựa đúng thứ tự catalog (23 → 26).

## File thay đổi

- Mới: `src/data/games/{ten_frame_market,number_line_hop,clock_builder}.ts`, `src/components/games/{TenFrameMarketGame,NumberHopGame,ClockBuilderGame}.tsx`, `tests/{t16-math-games,t16-math-contract}.test.ts` (27 test).
- Sửa: `src/data/gamesCatalog.ts` (+3 entry `math`, `isNew`), `src/components/games/registry.ts` (+3 lazy), `src/config/policy.ts` (`LAUNCHABLE_GAME_IDS` +3), `qa/games.mjs` (+3 tựa).
- Không thêm dependency nào. Không sửa file ngoài phạm vi (không cần migration storage — game mới chưa có tiến độ cũ).

## Số liệu trước/sau

| Chỉ số | Trước | Sau |
|---|---|---|
| Trò chơi (catalog/registry/LAUNCHABLE) | 23 | **26** (test T08 khớp 3 danh sách PASS) |
| Game Toán trong Hub | 7 | **10** |
| Test | 770 (49 files) | **797** (51 files), gồm 27 test T16 mới |
| Build | PASS | **PASS** (3 game mới nằm trong lazy chunk riêng ~9–12 kB/game; cảnh báo chunk > 500 kB có sẵn) |
| Probe Chromium thật (3 game mới, viewport 390×844, `?qa=1`) | — | **mở/có tiêu đề/chơi đúng/đóng được cả 3, 0 console error**; catalog 26; tràn ngang 149px là header trang chủ phía sau modal (lỗi T01B có sẵn) |

## Lệnh đã chạy + kết quả

- `npm run typecheck` — PASS (sửa 3 lỗi: `PlaceValueBlocks` không có `showTotal` → render tổng bằng text; regex `＋-−` ngược thứ tự → escape gạch nối; `new Set(number[]|string[])` → `Set<string|number>`).
- `npm test` — **797/797 PASS** (51 files). Trên đường đi test bắt được 1 lỗi thiết kế thật (xem "Quyết định" 1).
- `npm run build` — PASS.
- `node qa/run-one.mjs qa/games.mjs` — **SKIPPED**: probe chung hỏng ở selector cũ `text=Xin chào` (trang chủ nay là `Chào {tên}!`) + nav desktop `lg:hidden` — lỗi có sẵn thuộc T20 (T15/T17A đã ghi). Thay bằng probe tạm (không commit, đã xoá) mở/chơi/đóng 3 game mới ở 390×844 với `?qa=1`: **PASS, 0 console error** — mỗi game `hasTitle:true`, `answer-option` 4/4/12 nút, `data-correct` đúng 1 nút, bấm đáp án đúng/Chốt giờ đều qua màn, đóng sạch.

## Quyết định tự đưa ra

1. **Vòng hỏi "mấy chục" đáp bằng số chục (test bắt được):** thiết kế đầu để `need = target − have` cho mọi vòng nên vòng `sticks(7,2,chuc)` đáp án 70 que — vượt lớp 1 và sai ý hỏi. Sửa data: thêm `need?` ghi đè, vòng hỏi chục đáp bằng số chục (1–9); test khẳng định `need = chuc` ở vòng đó, `need = target − have` ở các vòng còn lại, mọi đáp án ≤ 9.
2. **Đề bằng lời của Ếch không chứa số đích:** bản đầu `promptText` ghép số đích vào câu ("Ếch tới số 5?") — lỗi lộ đáp án theo audit. Viết lại: "Ếch đang đứng ở số 4. Ếch tiến 3 bước. Ếch tới số mấy?" + test `expectNoLeak` cho mọi đề worded.
3. **Pool tia số chỉnh để qua guard không nhớ/không mượn tuyệt đối:** thay 5 mục vi phạm (`5+5`, `8+4`, `12−3`, `9+4`, `6+5`) bằng cặp tương đương không nhớ/mượn (`4+5`, `10+4`, `14−3`, `5+4`, `4+5`); test dùng lại `mathUtils` (không tự chế guard).
4. **Khen MATH qua prop** (`praiseSubject="MATH"`) thay vì sửa `getPraiseSubjectFromGameId` — ít chạm file chung nhất mà vẫn đúng môn.
5. **Nhãn "MỚI"**: như T15/T17A — Hub tự gắn qua `StorageService.isNewGame`, vẫn đặt `isNew: true` trong catalog cho đủ dữ liệu.

## Auto-fix

- Lỗi typecheck: `src/data/games/ten_frame_market.ts(119,88)` — hàm `sticks()` truyền `need` vào helper `m()` nhưng kiểu tham số `extra` của `m()` chỉ khai báo `chuc/donVi/askPart` nên TS2353.
- Sửa: thêm `need?: number` vào kiểu `extra` của `m()` (1 dòng). Không đổi logic game/data, không đụng test.
- Kiểm lại: `npm run typecheck` PASS, `npm test` 797/797 PASS (51 files), `npm run build` PASS.

## Việc còn tồn

- `qa/games.mjs` cần T20 sửa selector (`Xin chào` → `Chào`, nav desktop) để nghiệm thu chung chạy lại được.
- Header trang chủ tràn 149px ở 390px (lỗi T01B cũ, đo lại vẫn còn, ngoài phạm vi).
