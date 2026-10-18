# T09B Report

## Đã làm

- CompetitionHub: gộp 5 tab thành 3 tab `Luyện thi`, `Thử thách`, `Thành tích`; thêm chế độ `Bé / Thi thật`.
- Default là chế độ Bé: ẩn bảng xếp hạng bot và đồng hồ đếm ngược thi; kết quả hiển thị huy chương (đồng/bạc/vàng) + lời khen, không hiện `x/10`.
- Chế độ Thi thật chỉ bật khi bé đạt ≥3 huy chương vàng hoặc mở từ Bảng phụ huynh.
- Giữ nguyên engine/blueprint/test thi đấu; chỉ thay đổi hiển thị/chế độ.

## File thay đổi

- `src/components/competition/CompetitionHubScreen.tsx`
- `src/components/competition/CompetitionExamModal.tsx`
- `src/components/competition/CompetitionResultModal.tsx`
- `src/components/parent/ParentDashboardModal.tsx`
- `src/App.tsx`
- `docs/opencode/reports/T09B_REPORT.md`
- `.ai/CURRENT.md`

## Kiểm thử

- `npm run typecheck` PASS
- `npm test` PASS (601 tests)
- `npm run build` PASS

## Quyết định tự đưa ra

- Huy chương vàng khi điểm ≥8/10, bạc ≥6/10, đồng còn lại.
- Thi thật mặc định khoá với chế độ Bé; mở bằng 3 huy chương vàng hoặc từ Bảng phụ huynh.

## Việc còn tồn

- Chưa có ảnh chụp màn hình trước/sau (best-effort).