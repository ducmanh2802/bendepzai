# CONTENT_GUIDE — Quy ước thêm nội dung bài học (cho T10–T14 và về sau)

> Đối tượng: mọi task thêm câu hỏi/bài học vào Kho Báu Tri Thức (lớp 1, GDPT 2018).
> Mục tiêu: thêm ~1.300 câu mà validator vẫn < 5 s, bundle vẫn nhẹ, offline vẫn đủ,
> nội dung vẫn đúng chính tả và an toàn cho bé 6–7 tuổi.

## 1. Đặt file ở đâu

- Mỗi unit một file: `src/data/<môn>/<unit>.ts`
  (`<môn>` = `vietnamese` | `math` | `english` | `life`).
- Gộp qua đúng một file index mỗi môn
  (hiện tại: `vietnameseCurriculum.ts`, `mathCurriculum.ts`, `englishCurriculum.ts`;
  khi tách nhỏ dần, index `export *` từ các file unit).
- Không import file unit trực tiếp từ component — chỉ qua index của môn
  (giữ đường import ổn định để code-splitting không vỡ).

## 2. Id ổn định, có tiền tố môn

- Tiếng Việt: `vn-…` · Toán: `math-…` · Tiếng Anh: `eng-…` · Em & Cuộc sống: `life-…`
- Id không bao giờ tái sử dụng: sửa nội dung thì tăng `version` của câu,
  không đặt id cũ cho câu mới (kẻo trùng id = ERROR).
- Ví dụ: `vn-van-an-03`, `math-cong-pham-vi-20-11`, `eng-colors-07`, `life-gia-dinh-02`.

## 3. Câu số học: trường `calc` để test tính lại

Mọi câu hỏi số học (cộng/trừ trong phạm vi 100, KHÔNG nhớ — đúng lớp 1)
phải kèm đáp án có thể kiểm chứng bằng máy:

```ts
{
  id: 'math-cong-pham-vi-20-11',
  // ...
  prompt: '7 + 5 = …',
  correctAnswer: '12',
  calc: { a: 7, op: '+', b: 5 }, // test tính lại: a op b === correctAnswer
}
```

- `op` chỉ nhận `'+'` hoặc `'-'`; `a op b` phải bằng `Number(correctAnswer)`.
- Không ra đề cộng/trừ có nhớ, không vượt phạm vi của bài (ghi phạm vi vào tên unit).
- Câu đo lường/thời gian/hình khối: ghi đơn vị rõ trong prompt
  (`cm`, `giờ`, tên khối) và giữ đáp án là chuỗi đơn vị đó.

## 4. Không trùng đề (validator kiểm tự động)

- Trong cùng **môn + kỹ năng** (`subject` + `skillId`):
  `ERROR` khi độ tương đồng ≥ 0,9 · `WARNING` khi ≥ 0,75.
- Validator **giữ dấu tiếng Việt**: `má ≠ mà`, `ăn ≠ ân`.
  Đừng “né” bằng cách đổi dấu — hãy viết đề thật khác nhau.
- Khác môn hoặc khác kỹ năng thì không so với nhau,
  nhưng vẫn không copy đề giữa các bài: phụ huynh sẽ nhận ra.
- Mỗi câu trắc nghiệm lớp 1 có **2 hoặc 4 phương án**;
  đáp án đúng phải nằm trong `options`, các phương án không trùng nhau.
  (Quy tắc này tính cho **bài học**; trò chơi trong Hub đi theo bậc thang
  `TIER_OPTION_COUNT` 4→6 phương án theo bậc — xem `src/data/gameLevels.ts`
  và `tests/t25-difficulty-ladder.test.ts`.)

## 5. An toàn nội dung (`src/data/contentSafety.ts`)

- Mọi prompt/options/explanation mới đều phải qua
  `containsBannedWord()` = **false** (kiểm trong test của task).
- Từ cấm khớp theo cụm, có phân biệt dấu (`ma` ≠ `má` ≠ `mà`).
- Cụm cho phép (`đánh răng`, `đánh vần`, …) đã được miễn trừ —
  không cần né tránh, nhưng cũng đừng lạm dụng ngoài ngữ cảnh đúng.
- Chuẩn hoá **NFC**; kiểu đặt dấu theo SGK hiện hành (`hoà`, `khoẻ`, `thuỷ`).
- Tiếng Anh: **British English** (grey, colour), khớp Kid's Box 1.
- Tuyệt đối không từ ngữ buồn/đáng sợ/người lớn; lời khen tiếng Anh giữ tiếng Anh.

## 6. Hiệu năng: giữ bundle nhẹ + validator nhanh

- Đừng import dữ liệu competition/reading/Kid's Box vào đường khởi động
  (`storage.ts`, `HomeScreen`, `NextBestActionCard` nạp các bank này **động**).
  Dữ liệu bài học mới (curriculum) vẫn nằm trong chunk chính nên hãy viết gọn:
  không mô tả dài dòng, không emoji thừa trong dữ liệu.
- Mỗi câu chỉ được tokenize **một lần** bởi validator — không cần tối ưu gì thêm
  khi viết đề, chỉ cần tuân thủ mục 4 (trùng trong cùng môn+kỹ năng là lỗi).

## 7. Cách chạy kiểm tra (bắt buộc trước khi commit)

```powershell
npm run typecheck          # TypeScript sạch
npm test                   # toàn bộ suite, gồm:
                           # - tests/content-quality.test.ts (0 ERROR toàn bank)
                           # - tests/curriculum-quality-p41.test.ts (0 ERROR/WARNING curriculum)
                           # - tests/content-validator-t02c.test.ts (giữ dấu + 2.000 câu < 5 s)
                           # - tests/bundle-budget.test.ts (cần dist/ mới nhất)
npm run build              # build production
npm run check:budget       # chunk chính ≤ 600 kB (mục tiêu ≤ 450 kB)
node qa/run-one.mjs qa/offline-pwa.mjs   # kiểm offline (best-effort)
```

## 8. Checklist cho mỗi PR nội dung

1. [ ] File mới đúng vị trí `src/data/<môn>/<unit>.ts`, gộp qua index môn.
2. [ ] Id có tiền tố môn, không trùng, không tái dùng id cũ.
3. [ ] Câu số học có `calc` và máy tính lại đúng.
4. [ ] `containsBannedWord()` = false cho mọi chuỗi mới; chính tả + NFC đúng.
5. [ ] `npm run typecheck`, `npm test`, `npm run build`, `npm run check:budget` đều PASS.
6. [ ] Ghi số liệu vào báo cáo: số câu trước/sau, validator ms trước/sau.
