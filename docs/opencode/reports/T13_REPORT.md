# T13_REPORT — Luyện đọc: thêm 24 truyện theo chủ đề

**Nhánh:** `p42/T13` · **Task:** `docs/opencode/queue/20_T13_truyen_doc.md` (thắng spec gốc `T13_truyen_doc_moi.md` chỗ khác nhau).

## Đã làm gì

Sáng tác 24 truyện mới (tự viết, không chép SGK/truyện có bản quyền), 6 chủ đề × 4, mỗi truyện 6 câu hỏi:

| Chủ đề | File | L1 | L2 | L3 |
|---|---|---|---|---|
| Gia đình | `src/data/reading/t13-gia-dinh.ts` | Cơm Tối Sum Họp, Bé Giúp Bà | Sinh Nhật Bố | Về Quê Thăm Ông Bà |
| Trường lớp | `src/data/reading/t13-truong-lop.ts` | Bạn Mới Của Bé | Giờ Ra Chơi, Thư Viện Nhỏ | Ngày Hội Đọc Sách |
| Con vật | `src/data/reading/t13-con-vat.ts` | Đàn Gà Con, Chú Cá Vàng | Chú Chó Vàng | Bướm Vàng Và Hoa Hồng |
| Thiên nhiên & mùa | `src/data/reading/t13-thien-nhien.ts` | Nắng Mai | Mùa Hè Vui, Mùa Thu Lá Vàng | Mùa Đông Ấm Áp |
| Quê hương VN | `src/data/reading/t13-que-huong.ts` | Tết Sum Họp | Chợ Quê Sáng Sớm | Biển Quê Hương, Đội Lân Trong Xóm |
| Tình bạn & đức tính | `src/data/reading/t13-tinh-ban.ts` | Chia Bánh Cho Bạn | Bé Thật Thà, Lời Xin Lỗi | Giúp Bạn Cùng Học |

- Mỗi truyện: tiêu đề, bìa emoji, `theme`, `targetVowels` (vần trọng tâm), `pictureBank` 4 hình, 6 câu hỏi dùng **5–6 loại khác nhau** trong 14 loại đọc đang có (không thêm loại mới: không có đúng/sai, nối — thay bằng `question-meaning` dạng "Câu nào đúng theo bài?", "Việc nào xảy ra trước?", "Ai làm gì?").
- Số chữ đo bằng script (token `/\s+/`): L1 22–28 chữ, câu ≤ 6 chữ; L2 40–48 chữ; L3 65–80 chữ, truyện nào cũng có hội thoại trong `"..."`.
- Vị trí đáp án đúng xoay vòng 4 ô (mỗi ô 17–33%, không ô nào > 50%).

## File thay đổi

- `src/types/reading.ts`: thêm `ReadingTheme` + 2 field optional `theme?`, `targetVowels?` của `ReadingPassage` (tương thích ngược).
- `src/data/reading/t13-{gia-dinh,truong-lop,con-vat,thien-nhien,que-huong,tinh-ban}.ts` (mới): 24 passages + 144 questions.
- `src/data/reading/t13-index.ts` (mới): gộp 6 unit, export `T13_PASSAGES/_QUESTIONS/_PASSAGE_IDS/_QUESTION_IDS/_THEMES`, `isT13PassageUnlockedByLevel`.
- `src/data/readingContent.ts`: 12 truyện + 48 câu cũ giữ nguyên (đổi tên nội bộ `LEGACY_*`), export gộp `READING_PASSAGES` (36) / `READING_QUESTIONS` (192); thêm `getPassagesByTheme()`; giữ re-export `READING_SKILLS` đồng nhất với `readingTaxonomy` (test T02C vẫn PASS).
- `tests/reading-fluency.test.ts`: thêm describe T13 (9 test).
- `tests/personas-and-learning-os.test.ts`: CHILD F 40% → 25% (giữ nguyên mọi ngưỡng; xem "Quyết định" 3).
- `.ai/CURRENT.md`: 1 dòng trạng thái.

## Số liệu trước/sau

| Chỉ số | Trước | Sau |
|---|---|---|
| Truyện đọc | 12 | **36** (12 cũ + 24 mới) |
| Câu hỏi đọc | 48 | **192** (48 + 144), mỗi truyện mới đúng 6 câu |
| Phân bố cấp (mới) | — | L1 **8** / L2 **9** / L3 **7** → tổng L1 12 / L2 14 / L3 10 |
| Loại câu/truyện mới | — | 5–6 loại/truyện (≥ 4 theo luật) |
| Phủ 14 loại câu (mới) | — | đủ 14, ít nhất là `comprehension-when` ×2; mọi skill ≥ 6 câu |
| Main chunk | 519,8 kB (PASS ≤ 600) | 519,8 kB PASS — T13 nằm trong lazy chunk `ReadingFluencyScreen` (142 kB, đã kiểm tra `dist` chứa `rp-t13-*` mà `index-*` không chứa) |

## Lệnh đã chạy + kết quả

- `npm run typecheck` — PASS.
- `npm test` — **693/693 PASS** (44 files), gồm 9 test T13 mới.
- `npm run build` — PASS (cảnh báo chunk > 500 kB có sẵn, không mới).
- `npm run check:budget` — PASS (519,8 kB ≤ 600 kB).
- `node qa/run-one.mjs qa/golden-path.mjs` và `qa/t02-smoke.mjs` — **SKIPPED**: probe cũ timeout ở selector trang chủ ("Chơi ngay") không liên quan T13 (UI đã đổi từ T06/T08); browser-QA best-effort theo luật.

## Quyết định tự đưa ra

1. **Tách file theo chủ đề** (`src/data/reading/t13-*.ts` + `t13-index.ts`) thay vì nhồi vào `readingContent.ts`, đúng gợi ý spec ("có thể tách"); `readingContent.ts` chỉ gộp, giữ đường import cũ và chunk lazy.
2. **Luật số chữ/câu và ≥ 4 loại câu chỉ áp truyện mới** (đúng điều chỉnh của file task); test phân biệt mới/cũ qua `T13_PASSAGE_IDS`, truyện cũ giữ nguyên 4 câu.
3. **CHILD F 40% → 25%** (không đổi ngưỡng): helper persona dùng `assembleStageItems(stage, 1, 4)` — trước T13 pool ACCURACY chỉ có 3 item nên `round(3×40%) = 1/3` (thật sự kém); sau T13 pool đủ 4 item nên `round(4×40%) = 2/4 = 50%`, `accuracyIndex` lên 57 và vỡ ngưỡng `< 50` dù engine đúng (không hoàn thành stage, không mở khoá — các assert đó vẫn PASS). Đặt 25% để persona lại thật sự kém (1/4), giữ nguyên mọi ngưỡng kiểm tra (không làm yếu test).
4. **Mở khoá "theo cấp"** (spec cho phép "theo vần T10 hoặc theo cấp"): `isT13PassageUnlockedByLevel()` thuần hàm, không chạm storage nên không cần migration; engine stage-gating sẵn có vẫn giữ nhịp đọc.
5. Dùng chữ **"khoẻ"** (kiểu SGK mới: hoà/khoẻ/thuỷ) trong truyện đội lân; tránh mọi từ trong `BANNED_WORDS` kể cả ở phương án nhiễu (`gả`, `Khóc`, `Buồn buồn`, `ma` trong "mờ a ma" đều đã bị test bắt và sửa).

## Việc còn tồn

- Không có việc tồn cho T13. Gợi ý cho task sau: probe QA `qa/*.mjs` đã cũ so với UI hiện tại (timeout ở nút "Chơi ngay") — T20A nên cập nhật selector trước khi dùng để nghiệm thu.
