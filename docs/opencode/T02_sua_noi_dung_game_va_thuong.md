# T02 — Sửa nội dung SAI trong game + kinh tế phần thưởng công bằng

**Đọc trước:** `00_RULES.md`, `P42_AUDIT.md` (B2–B7, B9). **Nhánh:** `p42/T02`

## A. Nội dung game (soát TỪNG item của 18 game trong `src/components/games/`)
1. **SpellingDuel:** sửa đáp án sai (`…iêng`→`ngh`, `…on nớt`→`n`, `…ó`🪿 kiểm tra lại cho đúng từ "ngỗng"→`ng`, `…ái bàn` xem lại từ cho rõ nghĩa). Bỏ distractor đùa ("vàngg", "mèok"); distractor phải là lỗi chính tả trẻ hay mắc (c/k, g/gh, ng/ngh). Hint KHÔNG được chứa đáp án. Bỏ ch/tr, s/x, d/gi/r ở cấp 1–3 (giữ cấp 5–6 dưới dạng "thử thách").
2. **OceanFishing:** mọi phép trừ phải có a ≥ b, kết quả ≥ 0, trong phạm vi lớp 1.
3. **RhymeHunter:** lọc decoy theo **vần** (không phải so khớp nguyên từ) – không decoy nào chứa vần mục tiêu. Tăng lên ≥ 5 vòng/cấp.
4. **SyllableBuilder:** bỏ từ không phù hợp (mả, mộ, thù, thê, gả, "thạ") – thay bằng từ vui, có nghĩa, có emoji đúng. Sửa emoji sai (thị, cọ, cù, bì). Pool ≥ 2× số vòng của cấp lớn nhất.
5. **ShapeSorting, PhonicsPop, ColorBalloon:** sửa nhãn/emoji sai ("Cờ sina", "Hòn bi sắt"🍇, 🛡️, 🍬 "vuông", ONE→O, PHO, THIN, SCH, TURQUOISE, LIME).
6. **Giới hạn lớp 1:** WordStory cấp 4–6 chỉ cộng/trừ không nhớ trong 100; ClockMoney bỏ km/dm/"30 phút" (giữ giờ đúng, xem lịch, tiền xu/tờ mệnh giá nhỏ); FallingNumbers bỏ "chia hết cho 5" → thay bằng "số lớn hơn 10", "số tròn chục", "số liền sau".
7. Viết `tests/games-content.test.ts`: export dữ liệu/hàm sinh vòng của mỗi game (tách ra `src/data/games/<game>.ts` nếu cần) và kiểm tra: đáp án ∈ options, không trùng options, phép trừ không âm, số ≤ 100, không có từ trong `BANNED_WORDS` (tạo danh sách trong `src/data/contentSafety.ts`), đủ item cho số vòng.

## B. Kinh tế thưởng
1. Sao theo thành tích thật: 3★ = 0 lỗi, 2★ ≤ 2 lỗi, 1★ còn lại — dùng `GAME_LEVEL_POLICY` (dùng `STARS_PER_TIER`, bỏ `earnedStars` cứng trong từng game).
2. Chơi lại cấp đã qua: chỉ nhận phần **chênh lệch** khi đạt nhiều sao hơn kỷ lục + XP nhỏ (≈20%). Lưu `bestStars` theo cấp (migration an toàn).
3. ColoringCanvas: chỉ thưởng khi đã tô ≥ 30% vùng của tranh mẫu.
4. MemoryCards: lỗi chỉ tính khi lật lại cặp **đã từng thấy** mà vẫn sai.
5. Seed vòng chơi: thêm biến `playNonce` (lưu số lần chơi mỗi cấp) để mỗi lần chơi lại đổi thứ tự/câu; vẫn tất định cho test (truyền seed được).

## Nghiệm thu
- Bảng "trước/sau" số item mỗi game trong báo cáo.
- Test mới cho thưởng (`tests/game-rewards.test.ts`) + nội dung game. typecheck + test + build PASS.
