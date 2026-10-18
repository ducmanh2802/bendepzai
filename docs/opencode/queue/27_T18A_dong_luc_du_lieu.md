# T18A — Hệ thống động lực — phần dữ liệu & logic

**Spec gốc:** `docs/opencode/T18_he_thong_dong_luc.md` — **mục 1–6, chỉ phần dữ liệu/engine**

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Phạm vi
- Storage + engine cho: sticker (≥ 60, 6 bộ, độ hiếm), level bé (XP → 1–50 + danh hiệu), nhiệm vụ ngày xoay vòng (pool ≥ 30, tất định theo `localDateKey`, ưu tiên kỹ năng yếu), streak + khiên giữ chuỗi, dữ liệu Shop ≥ 40 món, thành tựu ≥ 30 với rule kiểm thử được.
- Migration + sanitizer + test cho mọi field mới; không làm mất sao/vé/đồ đã có.
- **Chưa làm giao diện lớn** (để T18B/T18C).

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T18A_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
