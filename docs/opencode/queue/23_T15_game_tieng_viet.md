# T15 — 3 trò chơi Tiếng Việt mới

**Spec gốc:** `docs/opencode/T15_game_tieng_viet_moi.md` (gồm "Hợp đồng chung cho mọi game mới")

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Điều chỉnh so với spec gốc
- Đăng ký game ở **3 nơi**: `gamesCatalog.ts`, `registry.ts`, `LAUNCHABLE_GAME_IDS` (test T08 kiểm khớp).
- Dùng `wordBank.ts` (T04) cho từ ngữ.
- QA hooks: `data-testid="answer-option"` trên phương án; thuộc tính `data-correct` chỉ xuất hiện khi URL có `?qa=1`.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T15_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
