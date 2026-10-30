# AGENTS.md — Hướng dẫn làm việc với AI

File này agent đọc tự động mỗi phiên. Phần **0** là mẫu để tái dùng ở project khác;
phần **1–4** đang khoá cho **Kho Báu Tri Thức — Lớp 1**. Quy trình đầy đủ: `docs/SDLC.md`.

## 0. Slot điền khi sang project mới

```
Project:            <tên>
Lệnh cổng (verify):  <vd: npm run verify | make check | ./gradlew check>
Lệnh test nhanh:     <vd: npm run test:ci>
Bằng chứng bắt buộc:  <lệnh + output | screenshot | video>
Vùng cấm sửa:        <thư mục/secret/file sinh tự động>
Tài liệu quy trình:  <đường dẫn>
Công cụ MCP:         <vd: mcp/ — server nào dùng cho việc gì>
```

## 1. Mệnh lệnh bắt buộc

1. **Không nói "xong" nếu chưa chạy cổng.** Với project này: `npm run verify`
   (typecheck + test + build + bundle budget) phải xanh, nguyên văn output.
2. **Dùng `npm run test:ci` / `verify` khi tự động hoá; tránh `npm test` trong CI.**
   `npm test` có `posttest` → `scripts/audit-snapshot.mjs` ghi `docs/audit-state.json`
   và nối `docs/AUDIT_REPORT.md`.
3. **Sửa UI/trò chơi phải có bằng chứng nhìn thấy được:** `npm run build` rồi
   `npm run qa:smoke` / `node qa/run-one.mjs qa/<probe>.mjs`, hoặc screenshot thật.
   Typecheck xanh ≠ tính năng đúng. Probe deep-flow thỉnh thoảng đỏ do timing — chạy lại
   một lần trước khi kết luận là lỗi, và dán `errors[]` + `failedAt` chứ không chỉ exit code.
4. **Không tự thêm dependency.** Muốn thêm → hỏi trước, nêu lý do và ảnh hưởng bundle.
5. **Không commit/force-push/tạo PR/Issue nếu chưa được yêu cầu.** Không xoá file lạ,
   không đụng lane khác trong `.ai/CURRENT.md` (nhiều phiên dùng chung một working tree).
6. **Package manager là npm** — `package-lock.json` là nguồn thật. `bun.lock` cũ, để nguyên.
7. **Ưu tiên MCP trong `mcp/` trước khi tự mò repo** (catalog + cách đăng ký:
   `mcp/README.md`, quy tắc dùng: `docs/SDLC.md` §10). `kbt-docs` trả lời "tài liệu nào
   nói về cái này", `kbt-curriculum` trả lời "trò chơi đã đăng ký đủ 4 nơi chưa",
   `kbt-quality-gates` chạy gate và cắt gọn output. Kết quả MCP là **manh mối**: vẫn phải
   chạy lệnh thật (mục 1–3) mới được nói "xong". `scaffold_game` mặc định dry-run — chỉ
   ghi file khi người dùng đồng ý; `kbt-progress` chỉ đọc file export trong `progress/`
   (đã `.gitignore`) và không bao giờ dán dữ liệu của trẻ vào chat/Issue.

## 2. Bất biến kiến trúc (thiếu một là test đỏ)

Thêm / đổi một trò chơi ⇒ đủ **4** nơi, tên tiếng Việt phải khớp:

- `src/data/gamesCatalog.ts` → `GAMES_CATALOG` (dữ liệu thuần, không import component)
- `src/components/games/registry.ts` → `GAME_REGISTRY` (always `lazy`)
- `src/config/policy.ts` → `LAUNCHABLE_GAME_IDS`
- `qa/games.mjs` → `GAME_TITLES`

Khác:

- Data builder trong `src/data/games/*.ts` phải deterministic theo `(tier, seed)`:
  dùng `seededRng` / `shuffleSeeded` / `pickDistinct`, **không** `Math.random` / `Date.now`.
- Framework trò chơi: `useGameStage` (6 bậc, sao, XP, `nonce` xáo đề) + `GameModalWrapper`.
- Main chunk ≤ 600 kB (`npm run check:budget`). 3D mặc định bằng CSS
  (`perspective`, `preserve-3d`) như `src/components/learning/cotuong/CotuongBoard3D.tsx`.
  **Ngoại lệ duy nhất** (từ merge 2026-10-30): bàn cờ vua WebGL `three.js` trong
  `src/components/learning/chess/chess3d/` — được vì nó nằm sau `React.lazy`
  (`src/App.tsx:18`) và trong chunk `three-vendor` riêng. Không import `three` hay `firebase`
  thẳng vào `App.tsx`/entry: entry sẽ vọt quá trần và gate đỏ.
- Dữ liệu trẻ **mặc định** chỉ nằm `localStorage`. `src/services/cloudSync.ts` là mirror
  **tuỳ chọn**, chỉ chạy sau khi người lớn tự đăng nhập Google — không được bật mặc định,
  không được buộc đăng nhập, và không bao giờ log/xuất nội dung bài làm của bé ra chat,
  Issue hay tài liệu.
- Test đặt tên `tests/t<NN>-<chủ đề>.test.ts`, mỗi hành vi mới kèm test.

## 3. Ngôn ngữ & trải nghiệm cho bé lớp 1

- Text toàn tiếng Việt có dấu, câu ngắn, không từ Hán-Việt khó; số/dấu phải chuẩn GDPT.
- Nút ≥ ~44px, thao tác chạm đơn giản, không yêu cầu kéo phức tạp; mọi lượt đúng/sai có
  phản hồi âm thanh + hình ảnh.
- Comments trong code: viết khi giải thích **vì sao**, ưu tiên tiếng Việt nếu dành cho
  người đọc Việt, không mô tả lại những gì tên biến đã nói.

## 4. Commit & báo cáo

- Message: `feat|fix|docs|test|refactor|perf|chore|build|ci|revert[(scope)][!]: mô tả`
  (`commit-msg` hook chặn, ví dụ `feat(games): thêm trò Nối Số Tô Màu`).
- Mỗi thay đổi đáng chú ý → một dòng trong `CHANGELOG.md` dưới `[Unreleased]`.
- Kết thúc phiên, báo cáo theo mẫu: **đã đổi file nào · lệnh đã chạy + kết quả ·
  điều chưa làm được/rủi ro · có cần commit không**. Không tự commit nếu bạn chưa nói.
