# T02B — Sửa nốt lỗi nội dung & logic của 18 game + test phủ đủ 18 game

**Spec gốc:** `docs/opencode/T02_sua_noi_dung_game_va_thuong.md` (T02 đã làm một phần) · Audit: `docs/opencode/P42_AUDIT_2.md` mục 2

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Phạm vi

### A. Tách dữ liệu game
Chuyển pool + hàm sinh vòng của **cả 18 game** sang `src/data/games/<gameId>.ts` (TypeScript thuần, không import React; export pool và `buildRounds(tier, seed)`). Component chỉ import. Mọi game trộn `playNonce` vào seed (hiện speed racing, number tower, sentence scramble, animal safari, listen-pick đang bỏ qua nonce → chơi lại y hệt).

### B. Lỗi đã phát hiện (kiểm lại trong code rồi sửa tận gốc)
1. **SyllableBuilder**: 14/72 từ tách sai âm đầu/vần/dấu (đa = d; che, hề = th; mê, thề = e; thuê = ê; bố, dỗ, đô, đồ, đổ, đỗ, tô = o; lúa = u) → sửa cho đúng hoặc thay từ (lê🍐, bế, dế🦗, bó💐, đỏ🔴, lá🍃); li🔍 → 🥛; bỏ thề, thuê, mù, đô.
2. **SentenceScramble**: gọi `submitWrong()` khi bé sai; xáo từ bằng seed (không bao giờ hiện đúng thứ tự ngược của câu).
3. **EnglishAnimalSound, ListenPickPhonics**: đáp án luôn ở vị trí đầu → xáo sau khi chọn đáp án.
4. **Không nhớ/không mượn** (lớp 1) ở OceanFishing (tier 4–6 có 11−6, 17−8), WordStory (6+5, 9+6, 12−5, 8+7, 14−6, 9+8, 20−12, 16−9), ClockMoney, MathSpeedRacing (5+7, 20−8; khi a = max thì tổng vượt max), NumberTower (3+?=11): cộng thì đơn vị cộng ≤ 9, trừ thì đơn vị số bị trừ ≥ đơn vị số trừ; kết quả 0–100.
5. **RhymeHunter**: hàm bỏ dấu đang bỏ cả dấu mũ/móc (ă, â, ơ…) → chỉ bỏ 5 dấu thanh. "cái khăn" (ăn), "mặt đất" (ăt/ât) không thuộc an/at → thay "quả nhãn", "mát mẻ".
6. **ShapeSorting**: bánh chưng dùng 🟩 trùng icon rổ hình chữ nhật; xoài không tròn; emoji mâu thuẫn hình (🍫, 🍈, 🧣, 🎉, 🧱, 🍞) → chọn vật có hình dạng rõ ràng.
7. **PhonicsPop**: có phương án cùng âm với đáp án (PHONE/F, KITE/C, FIVE/PH, FATHER/PH); mục "blend" lại hỏi chữ đầu → sửa nội dung. Mọi game: mỗi tier phải có đủ item cho số vòng (tier 4–6 cần 7–8 vòng) — PhonicsPop, WordStory, ClockMoney đang thiếu.
8. **ClockMoney**: gợi ý luôn hiện và lộ đáp án → chỉ hiện khi bé bấm "Gợi ý" và không chứa đáp án; đề không được nêu sẵn đáp án; bỏ mét (lớp 2) và 110 cm (> 100); câu "mấy giờ" hỏi khoảng thời gian → sửa.
9. **SpellingDuel**: câu có 2 đáp án đúng (xách vở, xúp, dông) → sửa; nghĩa gợi ý sai (ghe là thuyền; nghiêng không phải cúi chào); câu điền âm đầu đang ghi "Điền vần"; emoji sai (✏️, 🌾, 🐻); gợi ý lộ chữ "Con".
10. **EnglishColorBalloon**: GRAY → GREY (Anh–Anh); bóng WHITE chữ trắng trên nền trắng → chữ/viền tối.
11. **FallingNumbers**: bỏ "SỐ CHẴN"; luật "số tròn chục" không tính 100 (phạm vi 10–90).
12. **MemoryCards**: theo dõi **thẻ** đã lật (card id), không theo cặp; chỉ tính lỗi khi lật lại thẻ đã từng thấy mà ghép sai.
13. **ColoringCanvas**: tính độ phủ trên vùng hình mẫu và không tính pixel của hình mẫu mờ; sao theo độ phủ (≥ 30% 1★, ≥ 60% 2★, ≥ 85% 3★), không mặc định 3★.
14. **storage.ts — reset của phụ huynh**: xoá cả tiến độ game (tier/sao) và play nonce.
15. **contentSafety.ts**: khớp được cụm nhiều từ (cô đơn, ly dị, vũ khí…) và thêm danh sách **cụm cho phép** (đánh răng, đánh vần, đánh giá, đánh thức…) để không cấm nhầm nội dung hợp lệ.
16. **useGameStage**: lưu điểm tốt nhất **theo từng tier**, không cộng dồn qua các tier.

### C. Test `tests/games-all.test.ts` (giữ test cũ, bổ sung)
Cho **cả 18 game**, mọi tier 1–6, ≥ 20 seed/nonce mỗi tier:
- đáp án ∈ options; options không trùng; vị trí đáp án phân bố đều (không luôn cùng một ô);
- pool ≥ số vòng của tier (không lặp câu trong một lượt);
- toán: tính lại kết quả, không âm, ≤ 100, không nhớ/không mượn;
- ghép tiếng: helper `composeSyllable(onset, rhyme, tone)` (chuẩn NFC) phải ra đúng từ;
- chính tả c/k, g/gh, ng/ngh trước i/e/ê;
- tiếng Anh theo chính tả Anh–Anh (GREY, COLOUR…);
- quét từ cấm trên **mọi chuỗi** (đề, gợi ý, từ, câu, chủ đề); gợi ý không chứa đáp án;
- logic thưởng ở hook/modal: giữ kỷ lục cũ, chỉ trả 1 lần, tăng nonce; sanitizer nonce với dữ liệu hỏng.

## Nghiệm thu riêng
- Bảng từng game trong báo cáo: lỗi đã sửa, số item mỗi tier trước/sau.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T02B_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
