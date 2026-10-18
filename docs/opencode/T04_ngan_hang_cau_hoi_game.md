# T04 — Ngân hàng câu hỏi chung cho game + phản hồi khen/sai sinh động

**Nhánh:** `p42/T04` · Có thể chạy song song với T05 (worktree riêng).

## Mục tiêu
Game không còn "đóng hộp" nội dung riêng: dùng lại kiến thức trong chương trình + hàng đợi ôn tập, nên nội dung lớn dần theo chương trình (T10–T14) mà không cần sửa game.

## Việc cần làm
1. Tạo `src/services/gameContent.ts`:
   - `getGameItems({ subject, skillIds?, kinds, count, tier, seed, preferReview? })` trả về item chuẩn hoá: `{ id, prompt, audioText?, emoji?, answer, options, skillId, difficulty, source: 'curriculum'|'review'|'game-pack' }`.
   - `kinds`: `'word-picture' | 'first-sound' | 'rhyme' | 'tone' | 'sentence' | 'arith' | 'compare' | 'count' | 'en-word' | 'en-phonics' | 'en-color' | 'en-animal' | 'shape' | 'time'`.
   - Nguồn: `ALL_TOPICS`, `READING_*`, `kidBox*`, competition bank (chỉ câu easy/medium), và các "game pack" riêng (dữ liệu tách ra ở T02).
   - Độ khó theo tier (1–6) ánh xạ sang `difficulty`/phạm vi số; ưu tiên kỹ năng yếu từ `learningOS` khi `preferReview`.
   - Kết quả trong game ghi ngược về evidence của Learning OS ở mức nhẹ (`source: 'game'`, trọng số thấp) — không làm hỏng mastery hiện có.
2. Chuyển ít nhất 6 game sang dùng `gameContent` khi phù hợp: ListenPick, CatchLetters, RhymeHunter, SentenceScramble, AnimalSafari, PhonicsPop (giữ game-pack làm fallback).
3. `GameModalWrapper`:
   - Dùng `praiseEngine` cho lời khen (VI cho game Việt/Toán, EN cho game Anh), đa dạng, không lặp liên tiếp.
   - Đúng: tile nảy + sao bay về thanh điểm + combo đếm (3 đúng liên tiếp → "Combo x3!"). Sai: tile rung nhẹ, sau lần sai thứ 2 thì tô sáng đáp án đúng và đọc to; không phạt nặng.
   - Linh vật (T03 nếu đã có; nếu chưa thì để slot) phản ứng theo kết quả.
4. Test `tests/game-content.test.ts`: đủ số item theo mọi tier, không trùng trong 1 lượt, đáp án ∈ options, seed tất định.

## Nghiệm thu
- Báo cáo: số item khả dụng cho từng kind trước/sau.
- typecheck + test + build PASS.
