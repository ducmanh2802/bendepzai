# T02 REPORT — Sửa nội dung game + kinh tế thưởng công bằng

**Nhánh:** `p42/T02` · **Ngày:** 2026-10-14 · **Phụ thuộc:** T01 (đã merge)

## A. Nội dung game (trước → sau)

| Game | Lỗi (audit) | Đã sửa |
|---|---|---|
| SpellingDuel | `…iêng`→ng, `…on nớt`→ng, `…ó`🪿→g, `…ái bàn` mơ hồ; distractor đùa (vàngg, mèok…); hint lộ đáp án | `…iêng`→**ngh**, `…on nớt`→**n**, `…ỗng` (ngỗng)→**ng**, `…ái cây` (trái cây)→**tr**; bỏ toàn bộ distractor đùa, thay bằng lỗi trẻ hay mắc (kái/qái, kon, ghấu, tăng, trè, vỡ…); hint viết lại theo ngữ nghĩa, không chứa đáp án; T1–T4 chỉ c/k·g/gh·ng/ngh, ch/tr·s/x gom vào T5, d/gi/r vào T6 (dạng thử thách) |
| OceanFishing | trừ âm (`3 − 9` = 0) | sinh `b ∈ 1..a` → `a − b ≥ 0` luôn đúng, ≤ 20 |
| RhymeHunter | decoy chứa vần mục tiêu (con cá/chó/vịt ~ "on"); 3 vòng/cấp | lọc decoy theo **vần** (`containsRhyme`, không dấu); mỗi họ vần 4 từ (+khăn, nón, mặt đất, gạch, chanh, bàn tay); số vòng = policy (5–8/cấp) |
| SyllableBuilder | từ cấm (mả, mộ, thù, thê, gả, thạ); emoji sai (thị🛒, cọ🧹, bì🎒) | 6 tier × **12 từ** vui đúng nghĩa (cá…đỗ), emoji đúng (cọ🖌️, mò🦀); mở rộng âm đầu (đ/l/n/t); vòng chơi [4,4,5,5,6,6] → pool = 2× vòng lớn nhất |
| ShapeSorting | "Cờ sina", "Hòn bi sắt"🍇, 🛡️ tam giác, 🍬 "vuông" | Mũ sinh nhật🎉, Hòn bi ve🔮, Bánh pizza🍕, Bánh chưng🟩 |
| PhonicsPop | ONE→O, PHO📞, THIN📏, SCH | ORANGE (O), PHONE (PH), THIN🧍, SCHOOL trả lời **S** |
| ColorBalloon | TURQUOISE, LIME vượt lớp 1 | WHITE thay TURQUOISE, bỏ LIME (11 màu Kid's Box) |
| WordStory T4–T6 | 85+47, 120−75, phép nhớ/vượt 100 | viết lại 18 truyện: **cộng không nhớ / trừ không mượn, ≤ 100**, kiểm chứng bằng test parse hint |
| ClockMoney | km, dm, "30 phút", đổi tiền nhân/chia | bỏ km/dm/rưỡi/km↔m; thay bằng giờ đúng, lịch, tiền cộng/trừ không mượn (thối 1000–2000đ) |
| FallingNumbers | "chia hết cho 5", chẵn/lẻ nâng cao | T5 **số tròn chục** (≤100), T6 **số liền sau số tròn chục** (11,21…); T4 đã có "lớn hơn 10"; không còn "chia hết" |

## B. Kinh tế thưởng

1. **Sao theo thành tích thật** (`computeStars` export từ `useGameStage`): 3★ = 0 lỗi, 2★ ≤ 2 lỗi, còn lại 1★ — dùng ngưỡng `GAME_LEVEL_POLICY`. `GameModalWrapper` hiển thị + thưởng đúng `stage.starsEarned`; bỏ `earnedStars` cứng ở **18/18 game** (script kiểm chứng), thêm prop `gameId` + `prevBestStars`.
2. **Chơi lại chỉ nhận chênh lệch** (`StorageService.recordTierReward`): sao = max(0, sao mới − kỷ lục), XP lần đầu 100% / chơi lại **20%**. `completeGameTier` giữ nguyên vai trò lưu kỷ lục.
3. **ColoringCanvas**: nút Hoàn thành đo `coverageFromPixels` — dưới **30%** không thưởng, hiện % đã tô + lời nhắc bé tô thêm.
4. **MemoryCards** (`shouldCountMemoryMistake`): lỗi chỉ tính khi lật sai cặp **đã từng thấy**; khám phá lần đầu không trừ sao.
5. **Seed vòng chơi** (`playNonce` lưu số lần chơi mỗi cấp): `useGameStage` expose `nonce`; builder nhận `(tier, nonce, seed?)` — replay đổi thứ tự/câu, test truyền seed cố định vẫn tất định. Đã đấu nối: ocean, rhyme, syllable, shape, spelling, wordstory, clockmoney, phonics, memory.

## File thay đổi

- Mới: `src/data/contentSafety.ts` (`BANNED_WORDS`), `tests/games-content.test.ts`, `tests/game-rewards.test.ts`, `qa/t02-smoke.mjs`
- Sửa: 12 game content (bảng trên) + 6 game chỉ vá thưởng (catch_letters, sentence_scramble, listen_pick, speed_racing, number_tower, animal_safari) + `GameModalWrapper.tsx` + `useGameStage.ts` + `storage.ts`

## Số liệu

| Lệnh | Kết quả |
|---|---|
| `npm run typecheck` | PASS |
| `npm test` | **435/435 PASS** (28 file; +16 content +10 rewards) |
| `npm run build` | PASS, không cảnh báo mới |
| `node qa/t02-smoke.mjs` | dialog mở đúng, **0 console/page error**; ảnh `T02_spelling.png`, `T02_ocean.png` (3−1=2, đáp án 2 có trong 4 cá) |

## Việc còn tồn / ghi chú

- `STARS_PER_TIER` giữ làm metadata max theo cấp; sao thực trả = `computeStars` (đúng tinh thần "theo thành tích thật", tránh tier 1 flawless bị chặn 1★).
- FallingNumbers/ColorBalloon realtime vẫn dùng `Math.random` khi spawn (gameplay), logic điều kiện đã thuần + test được.
- Các emoji tofu trong ảnh headless (🪡…) là thiếu font emoji của máy QA, không phải lỗi app.
