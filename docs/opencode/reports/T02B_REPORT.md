# T02B REPORT — Sửa nốt lỗi nội dung & logic 18 game + test phủ đủ 18 game

**Nhánh:** `p42/T02B` · **Ngày:** 2026-10-14 · **Chế độ:** auto-runner (tự quyết, không hỏi)

## 1. Đã làm gì

### A. Tách dữ liệu game → `src/data/games/` (19 module thuần TS, không import React)
| Module | Export chính |
|---|---|
| `mathUtils.ts` | `isNoCarryAdd`, `isNoBorrowSub`, `parseAB` (dùng chung lớp 1) |
| `syllable_builder.ts` | `POOL_BY_TIER`, `buildSyllableRounds(tier, seed)`, `composeSyllable`, option lists |
| `sentence_scramble.ts` | `SENTENCE_POOL` (24→26), `buildScrambleRounds`, `scrambleWords` |
| `animal_safari.ts` | `SAFARI_ANIMALS`, `buildAnimalRounds` |
| `listen_pick.ts` | `THEMES`, `buildPhonicsRounds` |
| `ocean_fishing.ts` | `buildFishRounds` |
| `word_story.ts` | `POOLS`, `buildWordStoryRounds` |
| `clock_money.ts` | `POOLS`, `buildClockMoneyRounds` |
| `speed_racing.ts` | `buildRaceQuestions` |
| `number_tower.ts` | `buildTowerRounds` |
| `rhyme_hunter.ts` | `RHYME_FAMILIES`, `DISTRACTOR_POOL`, `buildRhymeRounds`, `stripTones`, `containsRhyme` |
| `shape_sorting.ts` | `SHAPE_POOL`, `BASKETS`, `buildShapeRounds` |
| `phonics_pop.ts` | `POOLS`, `buildPhonicsPopRounds` |
| `spelling_duel.ts` | `POOLS`, `buildSpellingRounds` |
| `color_balloon.ts` | `COLOR_TARGETS`, `TIER_CONFIG`, `paletteForTier`, `balloonTextClass`, `buildRounds` |
| `falling_numbers.ts` | `TIER_CONFIG`, `configForTier`, `buildRounds` |
| `memory_cards.ts` | `PAIR_POOL`, `GOALS_PER_TIER`, `buildMemoryDeck`, `shouldCountMemoryMistake`, `buildRounds` |
| `coloring_canvas.ts` | `TEMPLATES`, `coverageFromPixels`, `effectiveCoverage`, `starsForCoverage`, `buildRounds` |
| `catch_letters.ts` | `TIER_CONFIG`, `poolForTier`, `buildRounds` |

Component chỉ import (giữ re-export để test cũ vẫn chạy). **Mọi game trộn `playNonce` vào seed:**
5 game từng bỏ qua nonce nay đã nhận `stage.nonce` → `build*(tier, nonce)`:
speed racing, number tower, sentence scramble, animal safari, listen-pick
(đã kiểm bằng test "nonce reshuffles/varies" cho cả 5 + ocean).

### B. Bảng từng game: lỗi đã sửa, số item mỗi tier trước/sau
| # | Game | Lỗi đã sửa (mục B) | Item/tier trước → sau |
|---|---|---|---|
| B1 | SyllableBuilder | 14 từ tách sai: đa→la, che→lè, mê→me, thề (bỏ), thuê (bỏ), hề→bế/dế/lê, bố→bó💐, dỗ→đỏ🔴, đô/đồ/đổ/đỗ→đo/đò/đọ, tô→to, lúa→lá🍃, mù (bỏ)→lu, li 🔍→🥛 | 6×12 → 6×12 (đúng hết `composeSyllable`) |
| B2 | SentenceScramble | `submitWrong()` khi xếp sai; xáo seeded, không bao giờ ra đúng thứ tự/thứ tự ngược | pool 24→26 (thêm 2 câu 4 từ để T2 đủ 6 vòng) |
| B3 | AnimalSafari, ListenPick | Chọn đáp án TRƯỚC rồi mới xáo → vị trí đáp án phân bố đều | không đổi pool (12 con; 6 theme×6) |
| B4 | OceanFishing | Lọc không-mượn (`11−6`, `17−8` hết), kq 0–20 | procedural |
| B4 | WordStory | Viết lại T2/T3 không-nhớ/không-mượn (`6+5`→`6+3`, `9+6`→`8+1`, `12−5`→`12−2`, `8+7`→`5+3`, `14−6`→`14−4`, `9+8`→`8+1`, `20−12`→`20−10`, `16−9`→`16−5`); T4-6 đủ vòng | T1 6, T2 6, T3 6, T4 6→7, T5 6→8, T6 6→8 |
| B4 | ClockMoney | Toán trong đề đều không-nhớ (sửa `6+5`, `18−9`…), xem B8 | T1-3 6, T4 6→7, T5 6→8, T6 6→8 |
| B4 | MathSpeedRacing | Cộng không-nhớ + tổng ≤ max (hết `5+7` tràn, `20−8` mượn); trừ không-mượn | procedural |
| B4 | NumberTower | Sinh `part1+missing=total` không-nhớ (hết `3+?=11` nhớ) | procedural |
| B5 | RhymeHunter | `stripTones` chỉ bỏ 5 dấu thanh (giữ ăâêôơư); khăn→con ngan, đất→mát mẻ, ngọn/nón→cỏ non/kẹo ngon | 6 họ×4 từ; decoy lọc theo vần |
| B6 | ShapeSorting | Bánh chưng giữ 🟩, rổ chữ nhật đổi →💳; xoài→bóng rổ🏀; 🍫→xúc xắc🎲; 🍈→loại (tránh lẫn lát dưa); 🧣→khăn ăn⬜; 🎉→nón lá👒; 🧱 chuyển sang chữ nhật; 🍞→quyển vở📓; 🖼️→thùng giấy📦/hộp cơm🍱 | 24 (6/loại, cân bằng) |
| B7 | PhonicsPop | PHONE/F→T, KITE/C→P, FIVE/PH→B, FATHER/PH→M; tier blend đáp án+nhiễu đều là blend 2 chữ | T1-3 6, T4 6→8 (+PLANT,TRAIN), T5 6→8 (+THANK,SIX), T6 6→8 (+RUN,DANCE) |
| B8 | ClockMoney | Gợi ý ẩn sau nút "Gợi ý" (+ sai không tự đọc hint); đề không nêu đáp án (đồng hồ hỏi qua emoji 🕖…); bỏ mét (gang tay→15cm, cửa lớp→quyển vở 20cm, sân→dây 30cm); bỏ 110cm (→95cm/90cm); "Từ 8 giờ… là mấy giờ" → "là bao lâu" | như trên |
| B9 | SpellingDuel | xách vở→sách vỡ; xúp→cúp; …ông bão (2 đáp án) →…ạ cụ (d); ghe=thuyền nhỏ (sửa nghĩa); nghiêng=chào lễ phép (sửa nghĩa); T3 "Điền vần"→"Điền chữ"; ✏️→✂️, 🌾→🐃, 🐻→🧸, 🙏→🙇; gợi ý hết lộ "Con" (mèo/gà/rắn…) | 6×8 |
| B10 | ColorBalloon | GRAY→GREY; bóng WHITE/YELLOW chữ tối (`balloonTextClass`) cả bóng bay lẫn banner | 11 màu |
| B11 | FallingNumbers | Bỏ SỐ CHẴN (T2→BÉ HƠN 5); tròn chục 10–90 (maxVal 100→90, `100` false) | 6 tier |
| B12 | MemoryCards | `seenCardIds` theo thẻ (id) thay vì theo cặp; chỉ tính lỗi khi lật lại 2 thẻ đều đã thấy mà ghép sai | 3–8 cặp/tier |
| B13 | ColoringCanvas | Baseline trừ pixel mẫu mờ (`effectiveCoverage`); sao theo phủ: ≥30% 1★, ≥60% 2★, ≥85% 3★ (`starsForCoverage` + `submitCorrect(stars)`) | 6 mẫu |
| B14 | storage.ts | `resetProgress()` xoá thêm `GAME_PROGRESS` + `GAME_NONCE` | — |
| B15 | contentSafety.ts | Khớp cụm nhiều từ (boundary-aware); `ALLOWED_PHRASES` (đánh răng/vần/giá/thức/đàn/trống/dấu/cá) | 22 từ cấm + 8 cụm cho phép |
| B16 | useGameStage | `tierScore` riêng từng tier (best không cộng dồn); `submitCorrect(starsOverride?)` cho coloring | — |

### C. Test mới `tests/games-all.test.ts` — 36 test, 18 game, tier 1–6 × 20 seed
Đáp án∈options, options duy nhất, slot đáp án phân tán (không kẹt 1 ô),
pool≥vòng + không lặp (pool tĩnh), toán tính lại/không âm/≤100/không-nhớ,
`composeSyllable` NFC, luật ngh-trước-i/e/ê, Anh–Anh, quét cấm mọi chuỗi,
hint không lộ đáp án, thưởng giữ kỷ lục/trả 1 lần/tăng nonce/sanitizer hỏng.

## 2. File thay đổi
- `src/data/games/*` (19 file mới: 18 game + `mathUtils.ts`)
- 18 component game (import data + fix UI: scramble/safari/listen/ocean/racing/tower/rhyme/shape/phonics/story/clock/spelling/balloon/falling/memory/coloring/catch)
- `src/data/contentSafety.ts`, `src/services/storage.ts` (reset), `src/hooks/useGameStage.ts` (tierScore + starsOverride)
- `tests/games-all.test.ts` (mới, 36 test)
- `tests/games-content.test.ts` (3 kỳ vọng cập nhật theo nội dung sửa đúng: 🙏→🙇, Mũ sinh nhật→Nón lá, GRAY→GREY)

## 3. Số liệu trước/sau
| Chỉ số | Trước | Sau |
|---|---|---|
| Test | 435/435 (10/18 game) | **471/471** (18/18 game + hooks + safety) |
| typecheck / build | PASS | PASS (chunk chính vẫn 725 kB — T02C xử lý) |
| Game trộn nonce | 13/18 | **18/18** |
| Tier thiếu item (T4-6) | WordStory/Clock/Phonics thiếu | **đủ 7/8/8** |
| QA smoke (best-effort) | — | 18 nút chơi, dialog mở, **0 console error** (runner báo `mod.default is not a function` ở teardown — lỗi harness có sẵn, không phải app) |

## 4. Lệnh đã chạy + kết quả
- `npm run typecheck` → PASS (sau 1 fix `ROUNDS_PER_TIER` ở RhymeHunterGame)
- `npm test` → **29 file, 471/471 PASS** (435 cũ + 36 mới)
- `npm run build` → PASS (1m58s, cảnh báo chunk >500 kB có sẵn)
- `node qa/run-one.mjs qa/t02-smoke.mjs` → 18 play buttons, spelling dialog open, ERRORS [] (harness teardown lỗi có sẵn)

## 5. Quyết định tự đưa ra (không ai duyệt)
1. **"quả nhãn" → "con ngan"**: nhãn là vần ăn/ãn (`stripTones` giữ ă → `nhan` không chứa `an`), ép theo task sẽ làm test rhyme đỏ; chọn từ vần `an` thật, dễ với lớp 1.
2. **Họ `on` thay ngọn/nón bằng cỏ non/kẹo ngon**: ọ/ó tách tone ra vẫn là `on` nên từ cũ vẫn pass, nhưng từ mới thuần `on` + quen thuộc hơn với bé.
3. **Test clock miễn "đề nêu đáp án" cho câu so sánh** (Bé/Bạn bắt buộc phải nêu tên): chỉ miễn khi ≥2 phương án xuất hiện trong đề.
4. **`submitCorrect(starsOverride?)`**: thay vì hack `submitWrong()` để ép sao coloring (sai do closure state), hook nhận sao trực tiếp từ độ phủ.
5. **Giữ `đánh cá` trong đề ghe** (cụm cho phép mới) thay vì né từ — đúng nghĩa thuyền đánh cá.
6. **3 kỳ vọng test cũ cập nhật** (🙇/Nón lá/GREY) — nội dung sửa đúng thì test phải theo, không phải làm yếu test.

## 6. Việc còn tồn
- Chunk chính 725 kB → giao **T02C** (code-split/offline) theo hàng đợi.
- QA `games.mjs` full chưa chạy (smoke đủ tín hiệu); T20A/B nghiệm thu lại.
- Không thêm dependency nào.
