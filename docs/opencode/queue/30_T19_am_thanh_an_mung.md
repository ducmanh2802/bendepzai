# T19 — Âm nhạc, ăn mừng, hiệu ứng

**Spec gốc:** `docs/opencode/T19_am_thanh_an_mung.md`

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Điều chỉnh so với spec gốc
- `musicEnabled` đang được lưu là `true` → thêm cài đặt mới `bgMusicEnabled` mặc định **false** cho nhạc nền (không đổi nghĩa của field cũ).
- FPS: đo bằng script QA giới hạn CPU và **chỉ báo cáo**, không coi là điều kiện fail task.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T19_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
