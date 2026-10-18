# T06 — Trang chủ gọn 1 màn hình + điều hướng 5 mục

**Spec gốc:** `docs/opencode/T06_home_mot_man_hinh.md`

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Điều chỉnh so với spec gốc
- Nhãn điều hướng **≥ 14px** (không phải 13px).
- Một cấu hình điều hướng duy nhất `src/config/navigation.ts` dùng cho App, menu trên và thanh dưới.
- Giữ `data-testid="nav-<screen>"` (T01B) và sửa mọi script `qa/*.mjs` click vào điều hướng.
- Phần chuyển sang Bảng phụ huynh giữ các `data-testid` cũ (`parent-decision-report`, `parent-next-best`) để test/QA không vỡ.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T06_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
