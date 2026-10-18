# T03A — Design tokens + bộ component giao diện + chế độ ban đêm

**Spec gốc:** `docs/opencode/T03_design_system_linh_vat.md` — **chỉ phần A**

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Phạm vi
- Làm phần A của spec gốc (tokens trong `@theme`, component `src/components/ui/`: KidButton, KidCard, Pill, SpeakButton, ProgressStars, SectionTitle; thay dần class lặp ở Header, Home, GamesHub, Subject — **không đổi bố cục**).
- **Dùng lại** các biến `:root --kb-*` đang có (gộp vào hệ token mới), không tạo hệ màu song song.
- Chế độ "Ban đêm": thêm field mới trong cài đặt phụ huynh (ParentSettings) + sanitizer + test migration; nút bật/tắt trong cài đặt phụ huynh; token cho `[data-theme="night"]`.
- Chụp ảnh trước/sau best-effort (theo 00_RULES).
- Nút ≥ 44px, chữ cho bé ≥ 14px.
- **Không** làm linh vật/minh hoạ (để T03B).

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T03A_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
