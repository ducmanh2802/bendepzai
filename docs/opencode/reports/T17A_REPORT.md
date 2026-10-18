# T17A_REPORT — 2 trò chơi Tiếng Anh: Simon Says + Word Train

**Nhánh:** `p42/T17A` · **Task:** `docs/opencode/queue/25_T17A_game_tieng_anh.md` (thắng spec gốc `T17_game_anh_logic_khoahoc.md` chỗ khác nhau — chỉ làm **game 1 và 2**).

## Đã làm gì

2 game Tiếng Anh mới, mỗi game gồm **data pack thuần TS** (`src/data/games/`, builder seeded theo cấp) + **component** (`src/components/games/`, `useGameStage` 6 cấp + `GameModalWrapper`), đăng ký đủ **3 nơi** (catalog, registry, `LAUNCHABLE_GAME_IDS`), nhãn "MỚI" (`isNew: true`):

| Game | ID | Data pack | Nội dung theo cấp |
|---|---|---|---|
| Simon Says — Gấu Ra Lệnh 🐻 | `simon_says` | `simon_says.ts` — 6 pool × 8 mục | T1 bộ phận cơ thể 1 bước (Touch your nose!) → T2 hành động (Clap your hands!) → T3 màu sắc + đồ vật Kid's Box (Show me something red! / Find the cat!) → T4 lệnh 2 bước chạm 2 tranh đúng thứ tự → T5–T6 trộn 2 bước + **bẫy vui**: vòng không có "Simon says" thì bé phải nhịn, chạm thẻ 😴 Wait! |
| Word Train — Tàu Chữ Tiếng Anh 🚂 | `word_builder_train` | `word_builder_train.ts` — 6 pool × 8 từ | T1 CVC vần a (CAT, HAT…) → T2 vần e/i (BED, EGG, TEN…) → T3 vần o/u (DOG, SUN…) → T4 từ 4 chữ (DUCK, FROG, CRAB…) → T5 digraph sh/ch (+ck) theo Kid's Box (SHIP, CHICK…) → T6 ôn tổng hợp (SHEEP, GREEN, **GREY** 🇬🇧, CLOCK, TRAIN, BRUSH, THIN) |

- Mỗi game: màn hướng dẫn ("Bắt đầu ▶", Simon giải thích cả bẫy 😴), phản hồi đúng/sai + `praiseEngine` (**ENGLISH** → khen thuần tiếng Anh) + Gấu 🐻 qua `GameModalWrapper`, nút loa nghe lại (không tự đọc mới — autoplay lệnh qua `audioInstruction` chuẩn của wrapper như mọi game cũ; giữ nguyên mặc định `questionAutoplay`), chuột + chạm + bàn phím (phím số chọn, Word Train thêm Backspace gỡ chữ), nút ≥ 44px, `data-testid="answer-option"` + `data-correct` **chỉ khi URL có `?qa=1`**.
- Word Train: chạm toa **luôn được nghe âm** (phonics, `en-GB`) kể cả toa sai — đúng mới xếp vào tàu; chạm ô cuối đã xếp để gỡ; ô trống focus viền đứt.
- Simon 2 bước: chạm đúng bước 1 kêu click + đọc tên tranh, xong cả 2 mới tính đúng.
- British English: GREY (không GRAY), quét không dính COLOR/FAVOR/CENTER/TRAVELING/MOMMY; NFC; không từ cấm (quét cả gợi ý Việt).
- Hoạt ảnh CSS thuần (`animate-shake`, `animate-pop`, transition tàu) + `motion-reduce:transition-none`; không `setInterval` (không rAF nền → không cần dừng khi tab ẩn).
- `qa/games.mjs`: thêm 2 tựa đúng thứ tự catalog (21 → 23).

## File thay đổi

- Mới: `src/data/games/{simon_says,word_builder_train}.ts`, `src/components/games/{SimonSaysGame,WordTrainGame}.tsx`, `tests/t17a-english-games.test.ts` (19 test).
- Sửa: `src/data/gamesCatalog.ts` (+2 entry `english`, `isNew`), `src/components/games/registry.ts` (+2 lazy), `src/config/policy.ts` (`LAUNCHABLE_GAME_IDS` +2), `src/components/games/GameModalWrapper.tsx` (danh sách game ENGLISH +2 để praise mặc định đúng), `qa/games.mjs` (+2 tựa).
- Không file ngoài phạm vi.

## Số liệu trước/sau

| Chỉ số | Trước | Sau |
|---|---|---|
| Trò chơi (catalog/registry/LAUNCHABLE) | 21 | **23** (t08 test khớp 3 danh sách PASS) |
| Game Tiếng Anh trong Hub | 3 | **5** |
| Test | 716 (45 files) | **735** (46 files), gồm 19 test T17A mới |
| Main chunk | 521,6 kB | **521,6 kB** PASS (≤ 600 kB) — 2 game nằm trong lazy chunk riêng (Simon 12,2 kB / Word 10,7 kB) |

## Lệnh đã chạy + kết quả

- `npm run typecheck` — PASS.
- `npm test` — **735/735 PASS** (46 files).
- `npm run build` — PASS (cảnh báo chunk > 500 kB có sẵn, không mới).
- `npm run check:budget` — PASS (521,6 kB ≤ 600 kB); `bundle-budget` + `sw-precache` + `t08` test PASS trên dist mới (2 chunk game mới được precache).
- `node qa/run-one.mjs qa/games.mjs` — **SKIPPED** (lý do có sẵn như T15: probe chờ text `Xin chào`, trang chủ nay là `Chào Bé Minh!`; hỏng trước khi mở bất kỳ game nào). Thay bằng probe tạm (không commit) mở → Bắt đầu → đếm `answer-option` → đóng ở **390×844** cho đúng 2 game mới: Simon (intro ✓, 4 đáp án ✓, đóng ✓), Word Train (intro ✓, 3 toa ✓, đóng ✓), **0 console error, 0 pageerror**. Tràn ngang 149px đo được **giống hệt** ở Home/Hub/game cũ (lỗi header có sẵn, thuộc T01B/T20 — game mới không gây thêm).
- Không thêm dependency nào.

## Quyết định tự đưa ra

1. **Không thêm autoplay riêng, dùng `audioInstruction` chuẩn của wrapper** (như mọi game cũ): autoplay lệnh Simon đi qua cơ chế có sẵn của `GameModalWrapper`; nút loa luôn nghe được nên tắt `questionAutoplay` vẫn chơi đầy đủ. Không đụng wrapper (ngoài phạm vi, ảnh hưởng 21 game cũ) — chỉ bổ sung 2 id vào danh sách ENGLISH để praise mặc định đúng kể cả khi thiếu prop (prop `praiseSubject="ENGLISH"` vẫn truyền tường minh).
2. **Bẫy Simon chỉ từ T5** (spec: "cấp cao"): T1–T4 luôn có "Simon says" để bé lớp 1 học luật trước; test khóa điều này.
3. **T4 FISH tách chữ đơn, T5 FISH tách F-I-SH**: cùng từ nhưng T4 giải mã từng chữ, T5 học cụm sh — chủ ý sư phạm, test chỉ yêu cầu `cars.join('') === word`.
4. **Khen nói thêm giữ thuần tiếng Anh** (`Great job!`, `Try again! Listen!` + đọc tên tranh/từ bằng `en-GB`), theo đúng tiền lệ `animal_safari`; caption praise từ engine vẫn parity text=tts.
5. **Test builder + kiểm tra tĩnh source** (không render): repo không có testing-library/jsdom — theo chuẩn T15.

## Việc còn tồn

- `qa/games.mjs` cần T20 sửa selector (`Xin chào` → `Chào`, nav desktop) để nghiệm thu chung chạy lại được (đã ghi từ T15).
- Header trang chủ tràn 149px ở 390px (lỗi T01B cũ, ngoài phạm vi).
- T17B (luồng khác): 2 game Logic & Khoa học + danh mục lọc "Logic & Khoa học" trong Hub — KHÔNG thuộc T17A nên chưa làm.
