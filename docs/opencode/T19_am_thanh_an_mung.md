# T19 — Âm nhạc, ăn mừng, hiệu ứng "đã tay"

**Phụ thuộc:** T18. **Nhánh:** `p42/T19`

## 1. Âm thanh (`src/services/sound.ts`)
- Nâng hiệu ứng từ beep sang âm tổng hợp có "màu" (WebAudio: hợp âm, envelope, filter): đúng (chuông 3 nốt), sai (tiếng "boop" mềm, không chê), combo (cao dần), mở rương, lên level (fanfare ngắn), nhặt sticker, chạm nút (tick nhẹ).
- **Nhạc nền** vui, nhẹ, lặp 30–60 giây cho Home/Bản đồ và 1 bản sôi động cho game — tự sáng tác bằng sequencer WebAudio đơn giản (không file bản quyền). Âm lượng thấp, tự giảm (ducking) khi đọc TTS.
- Cài đặt: bật/tắt nhạc, hiệu ứng, giọng đọc riêng biệt; mặc định nhạc TẮT cho tới khi bé/phụ huynh bật.

## 2. Ăn mừng (`src/services/confetti.ts` + component `Celebration`)
- 4 kiểu theo mức: nhỏ (lấp lánh quanh đáp án), vừa (confetti màu môn), lớn (pháo hoa + Gấu nhảy `cheer`), cực lớn (lên level/đủ bộ sticker: màn toàn cảnh + mưa sao).
- Không lặp kiểu liên tiếp; tắt theo reduced-motion (thay bằng hiệu ứng mờ dần).

## 3. Cảm giác chạm
- Nút có hiệu ứng nhấn lún + nảy; `navigator.vibrate` ngắn khi đúng/sai trên mobile (có cài đặt tắt).
- Chuyển màn mượt (fade/slide nhẹ ≤ 250ms).

## 4. Linh vật sống động hơn
- Gấu thỉnh thoảng nói câu khích lệ theo ngữ cảnh (sáng/chiều/tối, sau chuỗi đúng, khi bé quay lại sau 2 ngày nghỉ: "Gấu nhớ bé quá!"). Chạm Gấu → phản ứng ngẫu nhiên (cười, nhảy, hắt xì).

## Nghiệm thu
- Không có âm thanh nào tự phát trước khi người dùng tương tác (chính sách autoplay).
- Hiệu năng: không giảm FPS dưới 50 trên giả lập CPU 4× chậm (đo bằng Playwright trace hoặc `performance.now`).
- typecheck + test + build PASS.
