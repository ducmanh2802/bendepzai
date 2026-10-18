# T14B — Môn "Em & Cuộc sống": nội dung (14 chủ đề · 26 bài · 264 câu)

## 1. Đã làm gì

- **Hoàn thành nội dung T14B** trong `src/data/lifeCurriculum.ts`:
  giữ nguyên 5 chủ đề mẫu của T14A (sửa 3 lỗi nhỏ), **viết tay toàn bộ 9 chủ đề còn lại**
  (18 bài × 10 câu = 180 câu mới, không dùng mẫu sinh tự động).
- **Xoá nội dung giữ chỗ** của phiên chạy trước còn sót trong cây làm việc
  (`MORE` + `makeQ()` sinh 180 câu vô nghĩa `"Bé chọn ý đúng nhất…"`, đáp án
  `"Đúng là ý này"` — vi phạm 00_RULES §8, đồng thời sẽ nổ validator trùng đề).
- **Sửa lỗi chặn golden path** trong `LessonPlayerModal.handleMatch` (phát hiện nhờ
  probe trình duyệt thật): câu hỏi `matching` không bao giờ nối được cặp
  (check luôn disabled → bé kẹt cứng ở câu nối), và chuỗi canonical bị tiền tố kép.
  Tách state machine thuần tuý vào `src/services/answerCheck.ts`
  (`applyMatchingTap`, `isMatchingComplete`, `buildMatchingCanonical`) + test riêng.
- Thêm `tests/life-curriculum.test.ts` (9 test) và `tests/lesson-matching.test.ts` (6 test).
- Cập nhật `docs/CURRICULUM_MAP.md` (§4 môn mới) và `docs/PRODUCT_SPEC.md` (3 → 4 môn).

## 2. File thay đổi

| File | Thay đổi |
|---|---|
| `src/data/lifeCurriculum.ts` | 5 chủ đề cũ (84 câu, sửa 3 lỗi) + 9 chủ đề mới (180 câu); xoá `MORE`/`makeQ` |
| `src/services/answerCheck.ts` | Thêm 3 helper matching thuần tuý (có test) |
| `src/components/learning/LessonPlayerModal.tsx` | `handleMatch` + nhánh `isSubmitDisabled` dùng helper mới (xóa ~30 dòng lỗi) |
| `tests/life-curriculum.test.ts` | Mới: số lượng, schema, an toàn, NFC, đủ 6 dạng câu |
| `tests/lesson-matching.test.ts` | Mới: state machine nối cặp + chấm đúng/sai |
| `docs/CURRICULUM_MAP.md`, `docs/PRODUCT_SPEC.md` | Ghi nhận môn thứ 4 (spec T14 yêu cầu) |
| `.ai/CURRENT.md` | 1 dòng trạng thái P42 |

Không đụng `docs/opencode/queue|state|logs`, `TRANG_THAI.md`. Không đổi storage
(chỉ thêm nội dung, id cũ giữ nguyên) nên **không cần migration**.

## 3. Số liệu trước / sau (môn `cuoc-song`)

| Chỉ số | Trước (T14A/HEAD) | Sau (T14B) | Yêu cầu task |
|---|---|---|---|
| Chủ đề | 2 | **14** | ≥ 12 ✅ |
| Bài | 2 | **26** | ≥ 24 ✅ |
| Câu hỏi | 24 | **264** (84 cũ + 180 mới) | ≥ 240 ✅ |
| Mỗi bài | 12 câu | **10–12 câu** | ≥ 10 ✅ |
| Kỹ năng `life_*` | 4 | **22** (18 mới × 10 câu) | ≥ 2 câu/skill ✅ |
| Validator curriculum | 0 error / 0 warning | **0 error / 0 warning** | ✅ |
| Test toàn repo | 601 | **616** (+15 mới) | ✅ |
| Chunk chính | ~401 kB | **401,6 kB** (≤ 450 kB) | ✅ |

## 4. Lệnh đã chạy + kết quả

- `npm run typecheck` → PASS (`tsc --noEmit`, sạch).
- `npm test` → **41 file / 616 test PASS** (lần cuối, trên `dist/` mới).
- `npm run build` → PASS (`index-*.js` 411 kB).
- `npm run check:budget` → PASS (main chunk 401,6 kB ≤ mục tiêu 450 kB).
- Golden path trình duyệt thật (`vite preview` + Playwright Chromium,
  probe tạm `t14b-golden.mjs` vì probe `p41` đã cũ — xem §6):
  Home → “Em & Cuộc Sống” → 26 nút bài → học hết 12/12 câu bài `life-les-1`
  (trắc nghiệm, ảnh, đúng/sai, sắp xếp, **nối cặp**) → `completed=["life-les-1"]`,
  `lessonStars={"life-les-1":3}`, xp 110 — **PASS, 0 console error, 0 page error**.

## 5. Các quyết định tự đưa ra (chạy unattended)

1. **Từ cảm xúc buồn/sợ/khóc** (task cho phép qua cụm cho phép): chọn **tránh hẳn**,
   dùng từ nhẹ (`không vui`, `tức giận`, `Rụt rè`, `rơi nước mắt`…) để giữ cổng
   an toàn nghiêm; đồng thời sửa 2 options cũ vi phạm (`Sợ hãi` → `Rụt rè`,
   `Khóc` → `Bỏ về`). Không sửa `contentSafety.ts`.
2. **Cụm cho phép duy nhất được dùng là `đánh răng`** (đã có sẵn): option
   `Đánh răng` qua được mask; nhưng `[đánh răng]` trong câu sắp xếp (có ngoặc
   `[ ]`) làm mask trượt → đổi thành `[chải răng]`.
3. **Sửa lỗi matching của LessonPlayerModal** thay vì né (xóa câu nối):
   spec T14 bắt buộc dạng nối; không sửa thì golden path “làm 1 bài → nhận sao”
   thất bại với mọi bài có câu nối. Ghi rõ ở §1.
4. **Test skill**: mẫu T14A trộn 2 skill trong 1 bài (7+5 câu) nên floor chung là
   chính sách (≥ 2), còn 18 skill mới của T14B khóa cứng **đúng 10 câu**.
5. Hint gợi ý nhưng **không bao giờ chứa đáp án** (validator WARNING):
   đã dính 2 ca (`kêu "bò"`, `màu cam`) và 1 cặp gần-trùng (0,80) — sửa đề, không sửa validator.
6. Mỗi bài mới gồm 5 trắc nghiệm + 2 chọn ảnh + 2 đúng/sai + 1 sắp xếp/**nối**,
   mỗi bài có câu độ khó 3; đáp án cân bằng vị trí nhờ `balanceTopics` có sẵn.

## 6. Việc còn tồn / ghi chú cho task sau

- **Probe `qa/p41-curriculum-quality.mjs` đã cũ**: chờ text `Xin chào` (mất từ T06)
  và hook `lesson-button` (nay là `lesson-button-<id>`); `qa/lesson-types.mjs`
  lỗi URL tương tự. Đề nghị T20A cập nhật probe. Probe T14B của task này là file
  tạm ngoài repo (đã xoá khỏi `tests/`), không commit.
- Nội dung 180 câu mới là **biên soạn tay 1 lượt**: đúng chính tả/NFC/validator,
  nhưng nên có phụ huynh đọc soát bằng mắt (mẫu T20A) trước khi coi là chốt.
- Đáp án trắc nghiệm do `balanceTopics` xoay vòng — thứ tự options trong file
  nguồn KHÔNG phải thứ tự hiển thị (cố ý, chống học vẹt vị trí).
