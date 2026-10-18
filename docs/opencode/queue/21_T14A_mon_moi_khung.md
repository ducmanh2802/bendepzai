# T14A — Môn mới "Em & Cuộc sống" — phần kỹ thuật

**Spec gốc:** `docs/opencode/T14_mon_em_va_cuoc_song.md` — **mục Kỹ thuật**

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Điều chỉnh so với spec gốc
- Giữ `CompetitionSubject` đúng 3 giá trị (hiện đang `= SubjectType`) — tách kiểu để thi đấu không nhận môn mới.
- `subjectDifficulty` trong `contentValidator.ts` (khoảng dòng 550) sẽ crash với môn mới → sửa.
- Ánh xạ môn mới trong `praiseEngine`.
- Tìm **mọi** `Record<SubjectType, …>` và switch theo môn (đừng chỉ grep `'english'`).
- Thêm 2 bài mẫu của môn mới để chạy thông luồng Home → môn → bài → nhận sao. Nội dung đầy đủ làm ở T14B.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T14A_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
