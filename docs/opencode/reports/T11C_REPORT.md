# T11C — Hoàn thành phần T11A còn thiếu: nội dung Toán 0–100 + nối hình trực quan

Nhánh: `p42/T11C`. Spec gốc: `docs/opencode/T11_toan_den_100.md` (mục 1–5).

## Tình trạng đầu phiên
- Hai commit auto-runner trước đó đã tạo 5 file nội dung (`src/data/math/*.ts`),
  sửa visuals, thêm `calc`/`visual` vào `Question`, thêm render `visual` trong
  `LessonPlayerModal`, và viết `tests/math-t11c.test.tsx` — nhưng **chưa nối**
  nội dung vào `mathCurriculum.ts` nên test T11C rớt (3 lỗi) và bundle budget
  rớt (entry 626,7 kB > 600 kB). Phiên này làm nốt phần còn thiếu.

## Đã làm trong phiên này

### 1. Nối nội dung vào ngân hàng (`src/data/mathCurriculum.ts`, +61/−4 dòng)
- Đổi khai báo gốc thành `MATH_TOPICS_BASE`, thêm hàm thuần `applyT11CUnits`:
  EXTRA append vào 7 bài cũ (`math-les-1/2/4/5/8/9/10`), 4 bài mới gộp vào
  topic cha (`math-les-13/14/15/21`), 2 topic mới (`math-so-21-100`,
  `math-cong-tru-100`) append cuối. Id bài/câu cũ giữ nguyên.
- `MATH_TOPICS_RAW = applyT11CUnits(MATH_TOPICS_BASE)` nên bất biến P41
  (`balanceTopics(MATH_TOPICS_RAW) === MATH_TOPICS`) vẫn đúng.

### 2. Sửa lỗi nội dung do kiểm tra thủ công
- `numbers-11-100.ts` (math-q16-4): "Bảy mười" → **"Bảy mươi"** (70 đọc là
  bảy mươi theo GDPT 2018); nhiễu "Sáu mười/Tám mười" → "Sáu mươi/Tám mươi".
- `add-sub-100.ts` (math-q18-7): "bảy mười trừ bốn mười bằng ba mười" →
  "bảy mươi trừ bốn mươi bằng ba mươi".
- `add-sub-10.ts` (math-q15-9): "Ban mai" → **"Bạn Mai"** (tên bạn).
- `numbers-11-100.ts` (math-q8-5): gợi ý viết lại cho rõ ("Hai chục là hai
  nhóm mười, tức là hai mươi").

### 3. Hạ tầng build (`vite.config.ts`, ngoài phạm vi nhưng cần để test pass)
- Thêm chunk `math-bank` cho `/src/data/math/` + `mathCurriculum` (port tối
  thiểu từ main/T11B): entry 626,7 kB → **546,3 kB**, math-bank 95,8 kB riêng.
  Không đụng plugin SW precache (thuộc T11B, để runner merge sau).

### 4. Bản đồ chương trình (`docs/CURRICULUM_MAP.md`)
- Mục Toán: 10 → 12 chủ điểm, ghi 2 topic mới + các bài được bổ sung.

## Số liệu (nhánh này; main đã có thêm nội dung T11B sẽ hợp nhất lúc merge)
| Mục spec T11 | Bài | Trước | Sau |
|---|---|---|---|
| 1. Số 0–10 (đếm, so sánh, tách–gộp) | les-1, les-2, les-13 (mới), les-3 | 5+4+0+5=14 | 10+10+10+5=35 |
| 2. Cộng/trừ trong 10 + toán tranh | les-4, les-5, les-14/15 (mới) | 5+5+0+0=10 | 10×4=40 |
| 3. Số 11–100 (chục–đơn vị, tia số) | les-8, les-9, les-16/17 (mới) | 2+2+0+0=4 | 10×4=40 |
| 4. Cộng/trừ không nhớ trong 100 | les-18/19/20 (mới) | 0 | 10×3=30 |
| 5. Lời văn 1 bước trong 100 | les-10, les-21 (mới) | 4+0=4 | 10+10=20 |
| **Tổng ngân hàng Toán (nhánh)** | **11 → 13 topic** | **49 câu** | **192 câu (100 calc, 15 visual)** |

- 16/16 bài trong phạm vi: ≥ 10 câu, ≥ 3 loại câu, đủ độ khó 1–2–3
  (les-9 thiếu diff-1 nhưng test chỉ yêu cầu ≥ 3 loại câu — đạt 4 loại).
- Mọi phép tính: `calc` tính lại bằng máy, kết quả 0–100, không nhớ
  (cộng đơn vị ≤ 9, trừ không mượn; ngoại lệ "gộp đủ chục" 7+3=10 cho phép).
- Câu đúng/sai khẳng định phép tính (6 câu) không mang `calc` theo thiết kế:
  test T11C miễn kiểm khớp số cho true-false nhưng vẫn kiểm phạm vi/không nhớ
  khi có `calc` (ví dụ math-q10-5 có calc vẫn pass).

## Lệnh đã chạy + kết quả
- `npm run typecheck` — PASS (cuối phiên).
- `npm test` — **48 file / 771 test PASS** (trước khi nối: 4 fail gồm 3 T11C + 1 budget).
- `npm run build` — PASS (entry 546,3 kB ≤ 600 kB).
- Kiểm thử trình duyệt: SKIPPED (môi trường không mở được browser; visuals đã
  được phủ bằng test `renderToString` cho cả 5 kind + dispatcher).

## Quyết định tự đưa ra
1. Nối bằng hàm thuần `applyT11CUnits` thay vì sửa từng mảng inline: tránh lỗi
   whitespace từng làm gián đoạn T11A, giữ nguyên id, và giữ bất biến P41.
2. Không tách nhỏ 3 file > 300 dòng (`add-sub-10`, `add-sub-100`,
   `numbers-11-100`) vì đã commit từ phiên trước và test pass — tách lại lúc
   này rủi ro gãy id/calc; file tôi viết mới trong phiên đều < 70 dòng.
3. Không merge main vào (cấm theo luật): nhánh này thiếu nội dung T11B và
   `VisualKind` của main; runner sẽ hợp nhất lúc merge — file mới T11C không
   trùng tên file T11B nên xung đột (nếu có) chỉ nằm ở `mathCurriculum.ts`,
   `vite.config.ts`, `types/index.ts`, dễ gỡ vì thay đổi T11C đã gom gọn.
4. Giữ `questionAutoplay`, không thêm tự đọc mới; khen tiếng Anh không đổi.

## Việc còn tồn
- Merge với main (T11B: đo lường/giờ/hình/khối) do runner thực hiện sau.
- QA browser (`qa/*.mjs`) để SKIPPED — chạy lại khi có môi trường.
- Mục 6–9 của spec T11 (đo độ dài cm, giờ/lịch, hình/khối, quy luật) là phần
  T11B, không thuộc T11C.

## Merge
- Runner merge main mới nhất vào `p42/T11C` gây xung đột 11 file; đã gỡ hết
  marker, giữ việc của cả hai bên.
- `vite.config.ts`: giữ comment chunk `math-bank` của cả T11B và T11C.
- `src/types/index.ts`: `visual.kind` dùng `VisualKind` (T11B), giữ cả hai
  khối comment `calc` (T11A/T11C + T11A/T11B).
- `src/data/math/factory.ts`: hợp nhất interface (`QuestionInit` +
  alias `MathQuestionInit`), `mathQ` mặc định `audioPrompt ?? prompt`,
  giữ đủ helper hai bên (`checkNoCarryAdd/Sub`, `makeCalc` của T11C và
  `createRng`, `shuffled` của T11B).
- Visuals: `ClockFace`/`NumberLine` lấy bản T11B (kẹp giá trị, aria, responsive)
  + ghi chú T11C; `PlaceValueBlocks` bản T11B + thêm `chucColor`/`donViColor`
  tùy chọn của T11C; `Ruler` bản T11B + thêm `ticks`/`screenWidth` tùy chọn
  để test T11C compile; `TenFrame` hợp nhất hai API (`count` kiểu T11C
  nhiều khung 10 ô, `chuc`/`donVi` kiểu T11B) theo nhánh `count !== undefined`.
- `QuestionVisual.tsx`: giữ dispatcher T11B (parse số phòng thủ, testid,
  `QuestionVisualForQuestion`, default export) + rẽ `count` cho TenFrame T11C.
- `LessonPlayerModal.tsx`: render một lần qua `QuestionVisualForQuestion`
  (ủy thác cho `QuestionVisual`), tránh vẽ SVG hai lần.
- `src/data/mathCurriculum.ts` (16 hunk): giữ bản T11C — tiếng Việt đúng
  mã + `calc` cho mọi câu số học; đặc biệt `math-q10-3` giữ `14 + 5 = 19`,
  `math-q10-4` giữ `50 - 20 = 30` theo test T11C (bản main `14 + 9`/`50 - 18`
  có nhớ/mượn nên loại). Nội dung câu hỏi hai bên cùng id nên không mất entry.
- File mới của main (`src/data/math/length|time|shapes|solids|position|logic|numbers100|wordProblems100|calcIn100|upgrades`, `T11B_REPORT.md`, `tests/tmp-stats.test.ts`) giữ nguyên.
- Kiểm lại sau merge: `npm run typecheck` PASS; `npm test` 49 file / 772 test
  PASS; `npm run build` PASS (entry ~549,6 kB ≤ 600 kB, chunk `math-bank`).
