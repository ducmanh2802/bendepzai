# P29 — CONTENT / QUESTION QUALITY

> Nguồn sự thật: `src/services/contentValidator.ts`
> Test: `tests/content-quality.test.ts` (16 test, chạy trên toàn bộ 3 ngân hàng)

## 1. Vấn đề: validator cũ chỉ kiểm bằng "multiple-choice"

`tests/competition-bank.test.ts` bản cũ có một khẳng định duy nhất cho mọi câu:
`expect(q.options).toContain(q.correctAnswer)`. Điều này **đúng về mặt kỹ thuật** khi mọi câu đều
là trắc nghiệm — nhưng nó đã chặn mọi dạng bài thi thật (nối, sắp xếp, phân loại).

Validator mới **nhận biết dạng**: mỗi `questionType` có contract riêng.

## 2. Những lỗi nội dung thật đã phát hiện và sửa

Validator không phải để trang trí — nó tìm ra lỗi thật ngay lần chạy đầu:

| # | Mã lỗi | Câu hỏi | Vấn đề | Cách sửa |
|---|---|---|---|---|
| 1 | `PAIR_ANSWER_MISMATCH` | `cq-math-m01` | Đáp án khóa thiếu dấu `=` → đáp án không khớp `matchingPairs`. Tệ hơn: cặp so sánh "3 + 2 … ?" thiếu vế phải nên **không xác định** | Viết lại thành `3 + 2 ... 4`, `4 + 1 ... 5`, `2 + 2 ... 5` |
| 2 | `ANSWER_NOT_IN_OPTIONS` | `cq-vn-d01`, `cq-vn-d02`, `cq-math-d01`, `cq-eng-d01` | Câu drag-drop/classify lưu đáp án `"con mèo\|con vật"` — không tồn tại trong `options` và không khớp UI | Đổi canonical thành **nhãn nhóm** (`con vật`), sửa lại UI và validator |
| 3 | `ORDER_ANSWER` | `cq-vn-o02` | Ô xếp `['Sáng nay', …]` nhưng đáp án `'Sáng nay,\|…'` — bé không thể tạo ra ô có dấu phẩy | Bỏ dấu phẩy khỏi đáp án, giải thích dấu câu ở `explanation` |
| 4 | `SKILL_SUPPLY_SHORTFALL` | `bp-vn-reading` | Blueprint yêu cầu 4 câu `TV-READING` nhưng bank chỉ có 2 | Bổ sung `cq-vn-r01`, `cq-vn-r02` |
| 5 | `UNKNOWN_SKILL_IN_DISTRIBUTION` | `bp-vn-reading` | `skillDistribution` chứa `'TV-KEYWORD': 0` — skill không tồn tại | Xoá khỏi blueprint |

Ngoài ra, kiểm tra `isDemoData` của tài khoản phụ huynh đã phát hiện và buộc phải dán nhãn
dữ liệu mẫu (xem `P30_RELIABILITY.md`).

## 3. Kiểm tra theo từng dạng bài

| Dạng | Quy tắc |
|---|---|
| `multiple-choice`, `true-false`, `fill-blank` | đáp án ∈ `options`; 2 hoặc 4 phương án (cảnh báo nếu khác) |
| `matching` | ≥ 2 cặp, không trùng vế trái, mọi vế phải ∈ `options`, `correctAnswer` **phải dựng lại được** từ `matchingPairs` |
| `ordering` | `orderingItems` khớp độ dài `options`, mọi phần tử ∈ `options`, đáp án đúng số phần tử và không lặp |
| `drag-drop`, `classify` | ≥ 2 nhóm, đáp án đúng phải là **một nhãn nhóm** |

## 4. Kiểm tra chung (mọi câu)

- `id` không trùng trong toàn ngân hàng.
- `topic` không rỗng — bắt buộc cho coverage matrix.
- `skillId` có trong taxonomy.
- `difficulty` ∈ 4 mức hợp lệ.
- `estimatedSeconds` ∈ `[8, 90]` — ngưỡng ở `CONTENT_POLICY`.
- `options` 2–6 phương án, không rỗng, **không trùng**.
- `explanation` không rỗng.
- **Trùng ngữ nghĩa**: so sánh Jaccard trên token đã bỏ dấu thanh.
  ≥ 0.90 → `ERROR`; ≥ 0.75 → `WARNING`.
- Prompt Tiếng Việt phải có ít nhất một nguyên âm có dấu (bắt lỗi mất dấu).
- Kiểm tra đúng/sai số học bằng regex cho `a+b`, `a+b+c`, `a-b`, `a+…=b`, `a-…=b`.

## 5. Coverage matrix (§16)

```
Subject → Topic → Skill → Difficulty → Question Type
```

| Chỉ số | Kết quả hiện tại |
|---|---|
| Ngân hàng thi | **78 câu** (tăng từ 49) |
| Ngân hàng đọc hiểu | 20 câu / 5 đoạn |
| Ngân hàng bài học | 76 câu |
| Dạng bài có mặt | cả **7/7** |
| Dạng bài thiếu | **0** |
| Skill taxonomy chưa có câu | **0** |
| Skill dưới ngưỡng tối thiểu (2 câu) | **0** |
| Skill chiếm > 50% ngân hàng | **0** — max share đo được **0.06** (đề thi cân bằng, không dồn câu) |
| Topic trong coverage matrix | 14 |
| Lỗi trong 3 ngân hàng của lớp 1 | **0 ERROR / 0 WARNING** |
| Câu hỏi thi sao chép từ bài học | **0** (mọi id đều theo mẫu `cq-*`) |

> Hai `WARNING` còn lại trong `runContentValidation()` thuộc về track **KID'S BOX**
> (`kidbox:unit:...WORD_COUNT_MISMATCH`) — ngoài phạm vi lớp 1, do tiến trình khác trong
> repo tạo ra, không phải nội dung của bản phát hành này.

### Bank thi ≠ bank bài học

```
Lesson bank ids  : vn-*, math-*, eng-*      (bài học theo chương trình)
Competition ids  : cq-*                     (đề luyện thi)
```

Test `keeps the competition bank from being a copy of the lesson bank` chặn trường hợp
tài liệu thi chỉ là bản sao bài học.

## 6. Cách chạy

```bash
npm test -- tests/content-quality.test.ts
```

Test quan trọng nhất báo cáo **tên câu hỏi, mã lỗi và thông điệp** khi fail, nên khi
được giao một câu hỏi mới ta biết ngay phải sửa gì:

```
Found 1 content errors:
  [competition:cq-math-m01] PAIR_ANSWER_MISMATCH: correctAnswer không khớp với matchingPairs.
```

Ngoài ra có thể in báo cáo đầy đủ:

```ts
import { runContentValidation, formatValidationReport } from './src/services/contentValidator';
console.log(formatValidationReport(runContentValidation()));
```

## 7. Ngưỡng kiểm tra blueprint

- Mỗi preset phải có `sourceNote` nói rõ **không phải đề thi chính thức** (test bắt buộc).
- `questionTypeDistribution` phải cộng đúng 1.
- `skillDistribution` không được tham chiếu skill không tồn tại.
- `skillDistribution` không được yêu cầu nhiều câu hơn ngân hàng thực sự có.
- Section phải có tiêu đề và chỉ tham chiếu skill có thật.
