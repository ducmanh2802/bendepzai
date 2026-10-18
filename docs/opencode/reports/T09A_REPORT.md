# T09A Report

## Đã làm
- Thêm parent grading (😀/😐/🙁) vào type đọc (`ReadingParentRating`), `ReadingResponse`, `ReadingMetrics.parentRatingCounts`, `ReadingProfile.parentRatings/parentGrades/selfReadRatings`) + sanitizer + storage methods + engine method `recordParentRating`.
- Viết adapter `src/services/readingAdapter.ts` (aliases) ánh xạ `ReadingQuestion` → `Question` để dùng renderer chung T05; `ReadingFluencyScreen` dùng `ChoiceQuestion`.
- UI luyện đọc: giá sách/thang đọc vẫn giữ tiêu đề; chữ đoạn đọc 24–28px; chạm từ để đọc+tô sáng; nút "Đọc cả câu" karaoke tô từng chữ (onboundary + fallback thời gian); chế độ Bé tự đọc với nút phụ huynh chấm emoji.
- Giữ nguyên engine ladder/fairness/persistence.

## File thay đổi
- src/types/reading.ts
- src/services/storage.ts
- src/services/readingEngine.ts
- src/services/readingAdapter.ts (+ aliases src/adapters, src/utils)
- src/components/reading/ReadingFluencyScreen.tsx
- .ai/CURRENT.md

## Kiểm thử
- npm run typecheck PASS
- npm test PASS (601 tests)
- npm run build PASS
