# Kho Báu Tri Thức — Lớp 1

Ứng dụng học tập cho bé 6 tuổi: **Tiếng Việt · Toán · Tiếng Anh · Em & Cuộc sống**,
kèm 31 trò chơi giáo dục, luyện đọc lưu loát, đề thi mô phỏng, sticker/quest và
Chế độ Phụ huynh. Chạy trên trình duyệt, cài được như PWA, dùng được offline.

- Công nghệ: React 19 · TypeScript · Vite 8 · Tailwind v4 · Vitest · Playwright
- Dữ liệu: mặc định **chỉ nằm trên máy** (`localStorage`); đồng bộ Google Cloud là
  **tuỳ chọn**, phải bấm đăng nhập mới bật (`docs/specs/ARCHITECTURE.md` ADR-16)
- Quy trình làm việc: **[`docs/SDLC.md`](docs/SDLC.md)** — đọc trước khi sửa code
- Bộ tài liệu chuẩn (BRD · SRS · Kiến trúc · RTM · Task/Test Plan): [`docs/specs/README.md`](docs/specs/README.md)
- Lịch sử thay đổi: [`CHANGELOG.md`](CHANGELOG.md)

## Chạy dự án

```bash
npm install          # (npm, không dùng bun — package-lock.json là nguồn thật)
npm run hooks:install  # bật cổng kiểm tra cục bộ: pre-commit / commit-msg / pre-push
npm run dev          # http://localhost:3000
```

## Lệnh thường dùng

| Lệnh | Ý nghĩa |
|---|---|
| `npm run dev` | dev server, port 3000 |
| `npm run build` | build sản phẩm vào `dist/` |
| `npm run preview` | xem thử `dist/` (port do Vite chọn) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | 77 file / 1091 unit test, **sau đó tự chạy audit tăng dần** (`posttest`) |
| `npm run test:ci` | chỉ chạy test (dùng trong CI, không ghi file audit) |
| `npm run verify:quick` | typecheck + test — cổng trước khi push |
| `npm run verify` | **cổng đầy đủ**: typecheck + test + build + bundle budget |
| `npm run check:budget` | main chunk ≤ 600 kB (goal ≤ 450 kB) |
| `npm run qa:smoke` | probe Playwright trên `dist/`: golden path |
| `npm run qa:games` | probe Playwright mở, chơi, đóng đủ 31 trò chơi |
| `node qa/run-one.mjs qa/<probe>.mjs` | chạy một probe bất kỳ (cần `npm run build` trước) |

Trước khi mở PR, tối thiểu phải xanh:

```bash
npm run verify
```

## Cấu trúc repo

```
src/
  App.tsx             điều hợp màn hình chính
  components/
    games/            31 component trò chơi + registry.ts (lazy) + GameModalWrapper
    learning/         màn học theo môn; learning/cotuong/ là bàn cờ tướng 3D bằng CSS,
                      learning/chess/chess3d/ là bàn cờ vua 3D WebGL (three.js, chunk lazy)
    auth/             đăng nhập Google + banner đồng bộ (tuỳ chọn, mặc định tắt)
    competition/, reading/, parent/, shop/, home/, world/, ui/…  theo tính năng
  config/policy.ts    LAUNCHABLE_GAME_IDS, chính sách decision engine
  data/
    gamesCatalog.ts   GAMES_CATALOG — dữ liệu thuần, không import component
    games/*.ts        data pack deterministic cho từng trò chơi
    *.ts              curriculum, competition bank, achievement, skill taxonomy…
  hooks/useGameStage.ts  6 bậc độ khó, sao, XP, nonce xáo đề
  services/           storage (nguồn thật), sound, TTS, decision engine…,
                      cloudSync + firebase (mirror tuỳ chọn sau khi đăng nhập)
  types/              kiểu dùng chung
tests/                Vitest, đặt tên t<NN>-<chủ đề>.test.ts
qa/                   probe Playwright chạy trên bản build thật
docs/                 SDLC.md + specs/ (BRD, SRS, ARCHITECTURE, RTM) + plan/ (TASK_PLAN,
                      TEST_PLAN) + GAME_DESIGN.md + CURRICULUM_MAP.md + tài liệu audit/phase
scripts/              hooks, audit-snapshot, bundle budget, release notes
mcp/                  5 MCP server stdio zero-dependency cho agent (xem mcp/README.md)
```

## Cổng tự động

- **Cục bộ** (`scripts/hooks/`): chặn `.env*`, typecheck khi commit, Conventional
  Commits khi ghi message, `verify:quick` khi push.
- **CI** (`.github/workflows/`): `1. Quality` → `2. Build + artifact` (tải `dist/` về
  xem thử) → `3. Browser QA` → `4. Release` (chạy khi tag `vX.Y.Z`).
- Chi tiết và cách bật branch protection: `docs/SDLC.md` §4.

## MCP cho agent

Năm server trong [`mcp/`](mcp/README.md) — `node <đường-dẫn>/mcp/<server>.mjs` là chạy,
không cần cài gì thêm:

| Server | Dùng để |
|---|---|
| `kbt-quality-gates` | chạy `npm run verify`/probe QA và đọc kết quả đã cắt gọn |
| `kbt-curriculum` | kiểm tra 4 danh sách đăng ký trò chơi, số liệu chương trình, quy ước nội dung |
| `kbt-game-scaffold` | sinh khung trò chơi mới (dry-run mặc định), validate sau khi đăng ký |
| `kbt-progress` | đọc file export tiến độ cục bộ, che thông tin cá nhân của bé |
| `kbt-docs` | tìm trong toàn bộ tài liệu Markdown của repo (đếm lúc chạy), xem trạng thái hiện tại |

Đăng ký trong Qoder → **Settings → MCP Connectors** (hoặc `mcp.json` theo mẫu trong
`mcp/README.md`). Số liệu từ MCP là manh mối, không phải bằng chứng — vẫn phải có
output `npm run verify` trước khi nói “xong” (`docs/SDLC.md` §10).

## Bộ tài liệu chuẩn

| File | Trả lời câu hỏi |
|---|---|
| [`docs/specs/BRD.md`](docs/specs/BRD.md) | Vì sao làm sản phẩm này, đo bằng gì, phạm vi tới đâu |
| [`docs/specs/SRS.md`](docs/specs/SRS.md) | 88 yêu cầu chức năng + 25 phi chức năng + 11 giao diện ngoài, mỗi yêu cầu có nghiệm thu |
| [`docs/specs/ARCHITECTURE.md`](docs/specs/ARCHITECTURE.md) | Tầng, luồng dữ liệu, chunk, 17 quyết định (ADR), nợ kỹ thuật |
| [`docs/specs/RTM.md`](docs/specs/RTM.md) | Yêu cầu nào được test/probe nào chứng minh — và chỗ nào còn trống |
| [`docs/plan/TASK_PLAN.md`](docs/plan/TASK_PLAN.md) | WBS, việc đã làm theo phase, backlog còn lại, milestones |
| [`docs/plan/TEST_PLAN.md`](docs/plan/TEST_PLAN.md) | 5 tầng kiểm thử, đổi gì thì phải chạy gì, tiêu chí vào/ra |

Chỉ số trong bộ tài liệu này đo từ repo ngày **2026-10-30** (sau khi merge Firebase cloud-sync
và bàn cờ vua WebGL); quy ước cập nhật xem [`docs/specs/README.md`](docs/specs/README.md).

## Đóng góp

Mở Issue theo template, tạo nhánh `feature/<issue>-<slug>`, làm theo checklist trong
PR. Đọc [`CONTRIBUTING.md`](CONTRIBUTING.md).
