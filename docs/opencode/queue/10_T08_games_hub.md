# T08 — Games Hub đẹp + khung game chuẩn mobile + registry

**Spec gốc:** `docs/opencode/T08_games_hub_khung_game.md`

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Điều chỉnh so với spec gốc
- **Thay mục A6**: giữ `src/data/gamesCatalog.ts` chỉ chứa dữ liệu (không import component); tạo `src/components/games/registry.ts` chứa `GAME_REGISTRY` với `lazy()`.
- Test đảm bảo catalog, registry và `LAUNCHABLE_GAME_IDS` (`src/config/policy.ts`) luôn khớp nhau.
- Nhãn "MỚI": dựa trên ngày bé thấy game lần đầu (lưu storage); bỏ `isNew` ghi cứng ở 4 game cũ.
- Thêm `skillIds` vào `GameInfo` để gợi ý game theo kỹ năng yếu.
- Nút tạm dừng chỉ cho game thời gian thực.
- Header game trên mobile đã sửa ở T01B — chỉ hoàn thiện, không làm lại.
- Viết lại `qa/games.mjs` (đang cũ: 14 tên game, luồng trước T02) cho đủ game và luồng mới.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T08_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
