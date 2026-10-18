# T14C — Bổ sung test còn thiếu cho T07, T08, T09A, T09B, T14A

> File này là bản chính thức. Luật chung: `docs/opencode/00_RULES.md`.

## Bối cảnh
Các task T07, T08, T09A, T09B, T14A đã merge và typecheck/test/build đều PASS, nhưng tổng số test gần như không tăng (594 → 601) dù luật 3 và quy trình bước 4 bắt buộc có test cho logic mới và cho mọi field lưu trữ mới. Đọc báo cáo `docs/opencode/reports/T07_REPORT.md`, `T08_REPORT.md`, `T09A_REPORT.md`, `T09B_REPORT.md`, `T14A_REPORT.md`, file task tương ứng trong `queue/` và `git log -p` của các commit `(T07)`, `(T08)`, `(T09A)`, `(T09B)`, `(T14A)`.

## Phạm vi
- **Storage (luật 3):** mỗi field mới của T07 (sao từng bài, trạng thái rương cuối chặng, cờ "mở khoá tất cả" của phụ huynh), T08 (ngày bé thấy game lần đầu) và T09A (điểm phụ huynh chấm 😀/😐/🙁) phải có test: dữ liệu cũ thiếu field vẫn nạp được, giá trị rác bị sanitizer làm sạch, **không mất sao/vé/tiến độ đã có**.
- **T08:** test catalog `gamesCatalog.ts`, `registry.ts` và `LAUNCHABLE_GAME_IDS` luôn khớp nhau; nhãn "MỚI" dựa trên ngày thấy lần đầu.
- **T09A:** test adapter `ReadingQuestion → Question` (đáp án đúng giữ nguyên, options không mất); test `recordParentRating`. Gộp các file alias trùng (`src/adapters/readingAdapter.ts`, `src/utils/readingAdapter.ts`) về một file `src/services/readingAdapter.ts` nếu không có chỗ nào cần alias.
- **T14A:** test `CompetitionSubject` vẫn đúng 3 môn (thi đấu không nhận môn mới); `subjectDifficulty` trong `contentValidator.ts` không crash với môn mới; `praiseEngine` có ánh xạ môn mới; mọi `Record<SubjectType, …>` có khoá cho môn mới.
- **T09B:** test chế độ Bé / Thi thật không đổi engine/blueprint thi đấu.
- Test nào lộ ra lỗi thật thì **sửa code** (không sửa test cho khớp lỗi). Không xoá, bỏ qua hay làm yếu test cũ.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Số test tăng rõ rệt; báo cáo `docs/opencode/reports/T14C_REPORT.md` liệt kê từng test mới, lỗi tìm được và đã sửa, số test trước/sau.
