# P42 AUDIT — Kho Báu Tri Thức Lớp 1 (14/10/2026)

Mục tiêu đợt P42: **hấp dẫn hơn · đẹp mắt hơn · nhiều kiến thức hơn · nhiều trò chơi hơn**.

## 0. Baseline sức khoẻ (đã chạy thật)

| Hạng mục | Kết quả |
|---|---|
| Commit HEAD | `f97b333` (18 games, tournament Trạng Nguyên) — working tree sạch |
| `tsc --noEmit` | PASS |
| `vitest run` | **401/401 PASS** (24 file test) |
| Stack | React 19 + Vite 8 + TS 7 + Tailwind v4, offline PWA, localStorage |
| Test cho game | **0** (không có test nào cho 18 game) |

## 1. Lỗi đã xác nhận (phải sửa trước)

| # | Mức | Lỗi | Vị trí |
|---|---|---|---|
| B1 | 🔴 | Banner hero Home + Games Hub bị trắng, chữ trắng không đọc được (`.kb-hero-pattern` ghi đè `bg-gradient`) | `src/index.css` |
| B2 | 🔴 | Câu trả lời SAI trong Spelling Duel: "…iêng" đáp án `ng` (đúng: ngh), "…on nớt" đáp án `ng` (đúng: n), "…ó"🪿 đáp án `g`, "…ái bàn" `tr`; distractor đùa "vàngg","mèok"; hint lộ đáp án | `SpellingDuelGame.tsx:40-60` |
| B3 | 🔴 | Ocean Fishing từ cấp 4 sinh phép trừ âm ("3 − 9" = 0) | `OceanFishingGame.tsx:31-32` |
| B4 | 🟠 | Rhyme Hunter: decoy "con cá/con chó/con vịt" chứa vần "on" | `RhymeHunterGame.tsx:51` |
| B5 | 🟠 | Syllable Builder có từ không phù hợp trẻ (mả, mộ🪦, thù, gả, "thạ") + emoji sai (thị🛒, cọ🧹, bì🎒) | `SyllableBuilderGame.tsx` |
| B6 | 🟠 | Shape Sorting emoji/nhãn sai ("Cờ sina", 🍇 "bi sắt", 🛡️ tam giác) ; Phonics Pop ONE→"O", PHO📞, THIN📏, SCH | các file game tương ứng |
| B7 | 🟠 | Nội dung vượt lớp 1: Word Story cấp 4–6 (85+47, 120−75), Clock&Money (km, dm, 30 phút), Falling Numbers (chia hết cho 5, chẵn/lẻ) | |
| B8 | 🟠 | Ngày dùng `toISOString()` (UTC) → ở VN ngày mới bắt đầu lúc 7h sáng (streak, quest sai) | `storage.ts:334,354` |
| B9 | 🟡 | Kinh tế thưởng: chơi lại cấp đã qua vẫn nhận XP/sao; `earnedStars` cứng 1–2; `STARS_PER_TIER` không dùng; Coloring "Xong" với tranh trống vẫn nhận sao | `useGameStage`, `GameModalWrapper`, `ColoringCanvasGame` |
| B10 | 🟡 | `ach_review_pro`, `ach_weekly_hero` không có rule mở khoá; timer `useGameStage` không clear khi đóng | `storage.ts:1345`, `useGameStage.ts` |
| B11 | 🟡 | Mobile: header game vỡ (tiêu đề 4 dòng, nút đóng bị đẩy ra ngoài); bottom nav 7 mục bị cắt; desktop hiện cả top nav và bottom nav | |
| B12 | 🟡 | Font Google không self-host → offline mất font | `index.html` |
| B13 | 🟡 | Achievements: cây "Đang Nở Hoa" khi 0 bài; nhãn "18 mini-games" cứng | |

## 2. Kiến thức (nội dung)

| Bộ | Hiện có | Vấn đề |
|---|---|---|
| Bài học chính (lesson) | 44 bài / **155 câu** (TV 62, Toán 49, Anh 44) | **44/44 bài < 8 câu**, 22 bài chỉ 2–3 câu; phiên chuẩn cần 18 câu → lặp |
| Loại câu dùng | gần như chỉ multiple-choice | `matching`, `drag-drop`, `true-false`, `math-expression` có trong type nhưng LessonPlayer không render; fill-blank không cho gõ |
| Thi đấu | 435 câu | Anh lệch: 107/122 là từ vựng |
| Luyện đọc | 12 truyện / 48 câu | cần ≥ 30 truyện theo chủ đề |
| Kid's Box | bridge pack 42 từ | `KIDBOX_MAPPED_UNITS = []` |

Thiếu so với chương trình GDPT 2018 lớp 1:
1. **Vần**: chỉ có an/at, on/ot, am/ap — thiếu ~64 vần (em/ep, in/it, ang/ac, ong/oc, anh/ach, inh/ich, ai/oi/ui, ao/eo/au, ia/ua/ưa, iên/uôn/ươn, oa/oe/uy, oang/oanh/uyên…).
2. **Âm/chữ ghép**: ch, nh, ph, th, kh, gi, qu, tr, ng/ngh, gh… chưa dạy riêng.
3. **Toán đến 100**: không có bài nào > 20 (chục–đơn vị, so sánh, cộng trừ không nhớ trong 100).
4. **Đo lường & thời gian**: cm = 0 câu bài học; lịch/thứ = 1 câu; giờ đúng = 4 câu.
5. **Hình học**: hình phẳng 2 câu; không có khối lập phương/hộp chữ nhật, vị trí trên/dưới/trái/phải.
6. **Tiếng Anh**: số chỉ đến 5; rất ít mẫu câu, nghe, ghép âm.
7. **Môn chưa có**: Tự nhiên & Xã hội, An toàn, Đạo đức/kỹ năng sống, Khoa học vui.

## 3. Trò chơi & động lực

- 18 game, nội dung **hardcode trong từng file**, không game nào lấy từ curriculum; seed cố định → chơi lại y hệt.
- Không game nào dùng `praiseEngine`; sai không có hiệu ứng (rung, tô đáp án đúng).
- Gamification: chỉ 1 tiền tệ (sao); vé kiếm được nhưng không tiêu được; shop 12 món (~255 sao) → hết đồ để mua; 8 thành tựu; nhiệm vụ ngày cố định 4 cái; không có level người chơi, sưu tập (sticker), lịch chuỗi ngày, cốt truyện/linh vật.
- Âm thanh chỉ là beep tổng hợp, không nhạc nền; confetti giống nhau mọi lần.

## 4. Giao diện

- Toàn bộ art là emoji, không có linh vật/minh hoạ thật.
- Home dài 3.907px trên mobile (~6 màn hình), nhiều khối trùng; ngôn ngữ phân tích dành cho người lớn hiện cho bé.
- Màn môn học = danh mục chữ nhỏ (~20 nút "Vào học" giống nhau), không có lộ trình.
- 125 phần tử chữ < 12px ở Games Hub; Đấu trường quá "thi cử" với bé 6 tuổi.
- Điểm tốt: World Map và Shop dễ thương nhất; animation có sẵn + reduced-motion.

## 5. Kế hoạch

Xem `docs/opencode/README.md` — 20 task chia 6 đợt cho OpenCode.
