# T11 — Toán: số đến 100, cộng trừ trong 100, đo độ dài, giờ, lịch, hình

**Phụ thuộc:** T05. **Nhánh:** `p42/T11` · Song song được với T10, T12, T13.
**File chính:** `src/data/mathCurriculum.ts` (có thể tách `src/data/math/*.ts`).

## Hiện trạng
10 chủ đề / 12 bài / 49 câu; không bài nào vượt quá 20; cm = 0 câu; lịch = 1 câu.

## Nội dung (theo SGK Toán 1 – GDPT 2018)
1. **Số 0–10:** đếm, nhận biết, so sánh (>, <, =), tách – gộp số (mấy và mấy).
2. **Phép cộng, trừ trong 10:** ý nghĩa (thêm vào / bớt đi), bảng cộng trừ, bài toán bằng tranh.
3. **Số 11–20, 21–100:** chục và đơn vị, đọc – viết số, số tròn chục, so sánh, sắp thứ tự, số liền trước/liền sau, tia số.
4. **Cộng, trừ KHÔNG nhớ trong 100:** tròn chục ± tròn chục, số 2 chữ số ± số 1 chữ số, số 2 chữ số ± số 2 chữ số; đặt tính rồi tính (hiển thị dạng cột).
5. **Bài toán có lời văn** 1 bước (thêm, bớt, gộp) trong 100, không nhớ.
6. **Đo độ dài:** dài hơn/ngắn hơn, đo bằng gang tay/que tính, **xăng-ti-mét**, dùng thước (hình thước SVG đọc số đo).
7. **Thời gian:** xem giờ đúng (mặt đồng hồ SVG, không dùng emoji), các ngày trong tuần, đọc lịch tờ.
8. **Hình học:** hình vuông, tròn, tam giác, chữ nhật; **khối lập phương, khối hộp chữ nhật**; vị trí trên–dưới, trái–phải, trước–sau, ở giữa; đếm hình.
9. **Tư duy:** quy luật dãy số/hình, câu đố "số nào còn thiếu".

## Yêu cầu chất lượng
- **Mỗi bài ≥ 10 câu**, trộn loại câu (multiple-choice, fill-blank số, math-expression, matching, ordering, true-false, image-choice). Độ khó 40/40/20.
- Câu số học dùng **hàm sinh có kiểm chứng** (đáp án tính bằng code) + câu viết tay có ngữ cảnh đời sống Việt Nam (quả xoài, chợ, que tính, bánh chưng…).
- Tuyệt đối không có phép cộng/trừ có nhớ, không kết quả âm, không số > 100.
- Distractor từ lỗi phổ biến: lệch 1, đảo chữ số (23↔32), nhầm cộng/trừ, cộng chục với đơn vị.
- Thêm component nhỏ cần thiết (SVG): `ClockFace`, `Ruler`, `TenFrame`, `NumberLine`, `PlaceValueBlocks` trong `src/components/visuals/` và cho phép câu hỏi tham chiếu qua trường `visual?: { kind, props }` (mở rộng type có kiểm tra; renderer từ T05 hiển thị).
- Giữ `id` bài/câu cũ. Cập nhật `docs/CURRICULUM_MAP.md`.

## Nghiệm thu
- Mục tiêu **≥ 35 bài, ≥ 350 câu**; bảng số liệu trong báo cáo.
- Test: mọi câu số học đáp án đúng (tính lại), không nhớ, ≤ 100; mỗi bài ≥ 10 câu; visuals render được.
- typecheck + test + build PASS.
