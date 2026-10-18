# T04 — Ngân hàng câu hỏi chung cho game + phản hồi khen/sai sinh động

**Spec gốc:** `docs/opencode/T04_ngan_hang_cau_hoi_game.md`

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Điều chỉnh so với spec gốc
- Pool và hàm sinh vòng đã nằm ở `src/data/games/` (T02B) — xây `src/services/gameContent.ts` trên đó.
- Nguồn evidence dùng giá trị **đang có** `'GAME'` (không tạo `'game'`). Learning OS hiện chỉ xử lý riêng REVIEW: thêm trọng số tối thiểu theo nguồn (GAME thấp, ví dụ 0,3) kèm test; nếu rủi ro làm hỏng mastery thì **không ghi ngược** và giải thích trong báo cáo.
- Tạo `src/data/wordBank.ts`: danh sách từ có cấu trúc (word, onset, rhyme, tone, emoji, topic) — nguồn duy nhất cho game Tiếng Việt, kiểm bằng `composeSyllable` (T02B).
- Chuyển **3 game** (không phải 6) sang `gameContent`: ListenPick, CatchLetters, RhymeHunter.
- Giữ phần GameModalWrapper của spec gốc (praiseEngine, combo, rung khi sai, tô đáp án đúng sau lần sai thứ 2, linh vật phản ứng nếu đã có từ T03B).

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T04_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
