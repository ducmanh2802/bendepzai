## Tóm tắt thay đổi

<!-- Cái gì thay đổi, vì sao? Link Issue/Đề nếu có. -->

## Đã kiểm thử thế nào

- [ ] `npm run verify` (typecheck + tests + build + bundle budget) chạy xanh
- [ ] `npm run qa:smoke` (hoặc probe QA liên quan) chạy xanh trên `dist/`
- [ ] Chạm thử tay trên máy: <liệt kê màn hình/trò chơi đã mở>

## Gates bắt buộc

**Commit & CI**
- [ ] CI xanh: typecheck → tests → build → budget → QA smoke
- [ ] Commit message theo Conventional Commits:
      `feat|fix|docs|test|refactor|perf|chore|build|ci|revert[(scope)][!]: mô tả`

**Bất biến kiến trúc** — áp dụng khi thêm/đổi một trò chơi hoặc module đăng ký game.
Cả 4 danh sách sau phải khớp nhau:

- [ ] `src/data/gamesCatalog.ts` → `GAMES_CATALOG`
- [ ] `src/components/games/registry.ts` → `GAME_REGISTRY` (lazy import)
- [ ] `src/config/policy.ts` → `LAUNCHABLE_GAME_IDS`
- [ ] `qa/games.mjs` → `GAME_TITLES` (đúng `title` tiếng Việt trong catalog)

- [ ] Data builder deterministic theo `(tier, seed)` — dùng `seededRng` / `shuffleSeeded` / `pickDistinct`, không `Math.random` trong builder
- [ ] Có test mới chứng minh các bất biến trên cho ID vừa thêm

**Chất lượng cho trẻ lớp 1**

- [ ] Câu chữ ngắn, đúng dấu tiếng Việt, không dùng từ khó
- [ ] Nút bấm đủ lớn (~44px), thao tác chạm đơn giản, không yêu cầu kéo phức tạp
- [ ] Có phản hồi âm thanh + hình ảnh cho mỗi lượt đúng/sai

**Tài liệu**

- [ ] Thêm mục vào `[Unreleased]` của `CHANGELOG.md`
- [ ] Cập nhật `docs/SDLC.md` / `docs/GAME_DESIGN.md` nếu đổi quy trình hoặc cơ chế trò chơi
