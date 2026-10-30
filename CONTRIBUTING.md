# Đóng góp — Kho Báu Tri Thức

Đọc [`docs/SDLC.md`](docs/SDLC.md) để hiểu quy trình, [`AGENTS.md`](AGENTS.md) nếu bạn
làm việc cùng agent AI. Ở đây chỉ là các bước thao tác.

## 1. Chuẩn bị

```bash
npm install          # npm, không dùng bun
npm run hooks:install# bật gate cục bộ (pre-commit / commit-msg / pre-push)
npm run dev          # http://localhost:3000
```

## 2. Một thay đổi

```bash
git checkout main && git pull --ff-only
git switch -c feature/42-them-tro-choi-moi
# …sửa code + test…
npm run verify                       # cổng đầy đủ như CI
npm run build && npm run qa:smoke    # nếu đổi UI
git commit                            # hook sẽ nhắc nếu sai format
git push -u origin feature/42-them-tro-choi-moi
```

Mở PR vào `main`, tick hết checklist trong template. PR được **squash-merge** sau khi
CI xanh. Không push thẳng `main`.

## 3. Điều kiện để PR được nhận

- CI xanh: typecheck → tests → build → bundle budget.
- Thêm/đổi trò chơi thì **4 danh sách đăng ký** phải khớp
  (`gamesCatalog.ts`, `registry.ts`, `policy.ts`, `qa/games.mjs`) — xem `docs/SDLC.md` §3.
- Có test cho hành vi mới; builder trò chơi phải deterministic theo `(tier, seed)`.
- Có mục trong `[Unreleased]` của `CHANGELOG.md`.
- Nội dung phù hợp trẻ 6 tuổi: câu ngắn, đúng dấu tiếng Việt, nút ≥ ~44px, phản hồi
  âm thanh/hình ảnh cho mỗi lượt.

## 4. Báo lỗi & đề nội dung

Dùng template Issue: **Báo lỗi** (kèm các bước tái hiện + thiết bị + phiên bản),
**Đề tính năng**, **Đề nội dung/bài học** (theo `docs/CURRICULUM_MAP.md`,
`docs/CONTENT_GUIDE.md`).

## 5. Câu hỏi thường gặp

- **`npm test` làm đổi file trong `docs/`?** Đúng — `posttest` chạy audit tăng dần.
  Commit `docs/AUDIT_REPORT.md` cùng phiên nếu đó là ý bạn.
- **Hook chặn commit của tôi oan?** Đọc thông báo lỗi; trong tình thế khẩn cấp dùng
  `git commit --no-verify` và nói rõ trong PR.
- **Muốn xem bản build của PR?** Tải artifact `dist-<số-PR>` ở tab *Artifacts* của run CI.
