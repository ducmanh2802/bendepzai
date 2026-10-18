# T13 — Luyện đọc: thêm 24 truyện theo chủ đề

**Phụ thuộc:** T05. **Nhánh:** `p42/T13` · Song song được với T10–T12.
**File chính:** `src/data/readingContent.ts` (có thể tách `src/data/reading/*.ts`), type ở `src/types/reading.ts`.

## Hiện trạng
12 đoạn (24–44 chữ), mỗi đoạn đúng 4 câu; 7/14 loại câu đọc gần như không dùng.

## Việc cần làm
1. Sáng tác **24 truyện mới** (TỰ VIẾT, không chép SGK/truyện có bản quyền), chia 6 chủ đề × 4: Gia đình · Trường lớp · Con vật · Thiên nhiên & mùa · Quê hương Việt Nam (Tết, Trung thu, chợ quê, biển) · Tình bạn & đức tính (thật thà, chia sẻ, xin lỗi).
2. Cấp độ: L1 (20–35 chữ, câu ≤ 6 chữ, chỉ vần đã học ở T10 nhóm đầu), L2 (35–60 chữ), L3 (60–90 chữ, có hội thoại). Phân bố 8/9/7.
3. Mỗi truyện: tiêu đề, bìa (emoji ghép/SVG), `targetVowels`/vần trọng tâm, 5–7 câu hỏi dùng **ít nhất 4 loại khác nhau** (hiểu chi tiết, thứ tự sự việc, đúng/sai, tìm tiếng có vần, nối nhân vật–hành động, đọc to, bài học rút ra).
4. Có thông điệp tích cực nhẹ nhàng; không bạo lực, không sợ hãi.
5. Mở khoá dần theo tiến độ vần ở T10 (nếu có mapping) hoặc theo cấp.

## Nghiệm thu
- **≥ 36 truyện, ≥ 180 câu hỏi**; bảng số liệu theo chủ đề/cấp/loại câu.
- Test `reading-fluency.test.ts` mở rộng: số chữ đúng theo cấp, mọi `questionIds` tồn tại, mỗi truyện ≥ 4 loại câu, không từ cấm, NFC.
- typecheck + test + build PASS.
