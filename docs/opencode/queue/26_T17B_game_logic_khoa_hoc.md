# T17B — Trò chơi Logic & Khoa học: Lập trình tìm kho báu + Nhà khoa học nhí

**Spec gốc:** `docs/opencode/T17_game_anh_logic_khoahoc.md` — **game 3 và 4**

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Điều chỉnh so với spec gốc
- Thêm `GameCategory` mới `'logic'` và tab lọc "Logic & Khoa học".
- `little_scientist` thuộc danh mục `'logic'`; gắn `skillIds` của môn Em & Cuộc sống (nếu đã có).
- Áp dụng hợp đồng chung + điều chỉnh của T15.

## Nghiệm thu riêng
- Tổng số game trong Hub = **28**; solver BFS kiểm mọi màn của game lập trình đều có lời giải.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T17B_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
