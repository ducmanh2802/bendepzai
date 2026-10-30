# CHANGELOG

Mọi thay đổi đáng chú ý của **Kho Báu Tri Thức — Lớp 1** đều được ghi ở đây.
Format: [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), version theo
[Semantic Versioning](https://semver.org/lang/vi/). Mục `Added / Changed / Fixed /
Tests` giữ tên tiếng Anh cho tooling đọc được; nội dung viết tiếng Việt.

Quy trình tạo ra các mục này: xem `docs/SDLC.md` §6.

## [Unreleased]

### Added
- Trò chơi mới cho bé lớp 1 (tab Fun), mỗi trò có data pack deterministic 6 bậc +
  component + đăng ký đủ 4 nơi (`gamesCatalog`, `GAME_REGISTRY`, `LAUNCHABLE_GAME_IDS`,
  `qa/games.mjs`):
  - `connect_dots` — **Nối Số Tô Màu**: nối 1→N theo chấm, khép thành hình rồi tô màu
    (10 hình: con diều, ngôi nhà, ngọn núi, chiếc lá, con thuyền, con cá, trái tim,
    cái cây, ngôi sao, mặt trời).
  - `shadow_match` — **Đoán Bóng Hình**: 24 ảnh/danh từ, chọn 1 trong 4 bóng; nghiêng
    từ bậc 3, lật gương từ bậc 5.
  - `pixel_mosaic` — **Bé Xếp Hình Mosaic**: ghép ô màu 3×3 → 5×5 theo mẫu, có ô ma
    trận mờ gợi ý ở bậc 1–2.
- Bàn cờ tướng 3D `src/components/learning/cotuong/CotuongBoard3D.tsx` — phối cảnh CSS
  (`perspective`, `rotateX`, `preserve-3d`), quân cờ có `id` ổn định để trượt giữa các ô.
- Quy trình phát triển: `docs/SDLC.md`, `CONTRIBUTING.md`, `AGENTS.md`, `README.md`.
- Cổng chất lượng: git hooks trong `scripts/hooks/` (`pre-commit` typecheck + chặn
  `.env*`, `commit-msg` Conventional Commits, `pre-push` `verify:quick`) và 4 workflow
  GitHub Actions: `1. Quality`, `2. Build + artifact`, `3. Browser QA`, `4. Release`.
- Template cộng tác: `.github/pull_request_template.md` (kèm checklist bất biến đăng ký
  trò chơi), `.github/ISSUE_TEMPLATE/{bug_report,feature_request,content_request}.yml`,
  `.github/dependabot.yml`.
- Scripts npm mới: `test:ci`, `verify:quick`, `verify`, `qa:smoke`, `qa:games`,
  `hooks:install`, `prepare`.
- `package-lock.json` — để CI cài đặt tái lập được bằng `npm ci` (npm là package manager
  thật của repo; `bun.lock` cũ không còn phản ánh `node_modules`).
- Lớp MCP cho agent trong `mcp/` — 5 server stdio **zero-dependency** (tự viết JSON-RPC,
  không thêm package npm): `kbt-quality-gates` (chạy gate + probe QA + báo cáo bundle),
  `kbt-curriculum` (danh mục trò chơi, kiểm 4 danh sách đăng ký, số liệu chương trình),
  `kbt-game-scaffold` (sinh khung game mới, mặc định dry-run), `kbt-progress` (đọc file
  export tiến độ cục bộ, che PII của bé), `kbt-docs` (tra toàn bộ tài liệu Markdown + trạng
  thái hiện tại). Kèm `mcp/lib/{server,repo}.mjs`, `mcp/devclient.mjs` để smoke-test,
  `mcp/sample-export.json` (dữ liệu giả định) và `mcp/README.md`.
- `.gitignore`: loại `progress/` ra khỏi VCS vì file export chứa dữ liệu cá nhân của trẻ.
- Bộ tài liệu chuẩn đo từ repo (mọi số liệu đều có lệnh kiểm chứng lại), **đo lại ngày
  2026-10-30 sau merge**: `docs/specs/BRD.md` (mục tiêu · phạm vi · thước đo · 8 rủi ro),
  `docs/specs/SRS.md` (88 FR + 25 NFR + 17 DC + 11 IF, mỗi dòng có nghiệm thu và gate),
  `docs/specs/ARCHITECTURE.md` (tầng, luồng dữ liệu, chunk, PWA, ADR-01…ADR-17, nợ kỹ
  thuật), `docs/specs/RTM.md` (yêu cầu → test → probe → gate, 0 test mồ côi),
  `docs/plan/TASK_PLAN.md` (WBS WP-01…WP-12, lịch sử P25→P44, Definition of Ready, backlog
  EP-A…EP-G, milestone M1–M4), `docs/plan/TEST_PLAN.md` (5 tầng kiểm thử, ma trận
  "đổi gì → chạy gì", 20 probe, tiêu chí vào/ra) và `docs/specs/README.md` làm chỉ mục.

### Changed
- Engine cờ tướng viết lại: negamax + alpha-beta kèm **node budget** để không bao giờ
  chặn UI thread của bé, evaluation tách khỏi move generation, quân cờ mang `id`.
- `qa/run-one.mjs`: không còn phụ thuộc đường dẫn Chromium hardcode trên Windows —
  thứ tự ưu tiên `PW_CHROME` → cache máy dev → Chromium do Playwright quản lý; thêm
  `--no-sandbox` khi chạy trong CI; in `QA PASS`/`QA FAIL` và chỉ exit 1 khi probe thực
  sự có lỗi (trước đây `!state.ok` làm probe sạch cũng trả exit 1).
- `qa/games.mjs`: bổ sung 3 title trò chơi mới (bắt buộc — 4 test đối chiếu catalog).
- `README.md`, `docs/SDLC.md` §9, `docs/MASTER_ROADMAP.md`: thêm liên kết tới bộ `docs/specs/`
  và `docs/plan/`.
- **Đo lại toàn bộ số liệu sau merge `75d364e`** (lane khác đưa Firebase cloud-sync + bàn cờ
  vua WebGL vào `main`): `npm run verify` **EXIT=0** với **69 file / 993 test**, build 8.92 s,
  main chunk `index-DGxWhyYx.js` **508.2 kB PASS** (trần 600, mục tiêu 450); dependency runtime
  **5 → 8** (`firebase ^13.1.0`, `three ^0.186.1`, `@types/three ^0.186.0`).
  Kèm theo: `AGENTS.md` §2 thu hẹp bất biến "không WebGL" thành "không WebGL ngoài màn cờ vua
  lazy" và ghi rõ cloud-sync là tuỳ chọn; `README.md` thêm mục dữ liệu; SRS lên **88 FR / 11 IF**
  (FR-Y08 viết lại, thêm FR-Y09 + FR-C06); ARCHITECTURE thêm **ADR-16** (sync opt-in) và
  **ADR-17** (vendor >200 kB phải ở chunk lazy), sửa ADR-01/ADR-11/ADR-13 và bảng kiểm kê §12;
  RTM thêm dòng FR-Y09/FR-C06, đổi tên `firebase-cloud-sync` → `firebase-auth-sync`;
  BRD sửa BG-01/BG-05/§4.2/R-02 và thêm **R-08** (dữ liệu trẻ trên cloud, chưa có UI xoá);
  TEST_PLAN thêm ca `chess-3d` + 2 khoảng trống mới (§16 #8, #9); TASK_PLAN thêm **§2.6 P44**
  và epic **EP-G (G1…G6)** cho nợ phát sinh.
- Bỏ con số hardcode "166 tài liệu Markdown" trong `README.md`, `docs/SDLC.md`, `mcp/README.md` —
  `kbt-docs` đếm lại lúc chạy nên con số cố định luôn sai theo thời gian; BRD ghi số đo được.

### Removed
- **68 prompt đã dùng xong trong `docs/` (358 kB)**, gỡ ngày 2026-10-30: 11 prompt phase ở gốc
  (`KHO BÁU TRI THỨC — P34/P36/P38/P39/P40…`, `MASTER AUTONOMOUS PROMPT — P27.5…`,
  `Prompt OpenCode — Adaptive Learning Upgrade`), `p41.md`, `skill.md` (prompt của dự án khác —
  VN-STOCK-AI-PRO), `docs/opencode/UI.txt` (bản paste tài liệu Claude Code), 20 brief
  `docs/opencode/T01…T20.md` và 34 task `docs/opencode/queue/` (mỗi task đều đã có báo cáo).
  **Giữ lại:** 3 master prompt module còn là mô tả thiết kế duy nhất (`cotuong.md`, `covua.md`,
  `olypictienganh.md`), `queue/05_T03B_linh_vat_minh_hoa.md` (task Mascot **chưa làm**), toàn bộ
  `docs/opencode/reports/` (41 mục: 39 `.md` + `_metrics.json` + `img/` — `qa/t01-hotfix.mjs`
  và `qa/t02-smoke.mjs` vẫn ghi ảnh vào `reports/img/`), `00_RULES.md` + runner `run-all.ps1`
  + 4 file `.bat`.
  Báo cáo cũ vẫn nhắc tên brief đã gỡ — không sửa tài liệu đã chứng nhận. Khôi phục:
  `git show "99edd29:<đường-dẫn>"` (xem `docs/MASTER_ROADMAP.md` §"Cấu trúc docs/ sau khi gỡ prompt").

### Fixed
- Luật cờ tướng được khoá lại bằng test (cản chân Mã, mắt Tượng, Pháo phải có đúng một
  screen khi ăn, tốt chỉ ngang sau khi qua hà, hai Tướng không đối mặt, không tự bỏ
  chiếu, `applyMove` cập nhật bàn cờ).
- Lỗi hiển thị bàn cờ 3D: cạnh dưới bàn cờ bị cắt (thêm padding `.ct-scene`) và nhãn
  "sông" bị nhoè (chuyển sang lớp HTML thay vì text trong CSS-3D).
- **Hồi quy offline (FR-Y03 / NFR-R01):** chunk lazy (`SubjectScreen`,
  `LessonPlayerModal`, `praiseEngine`, `questionAudio`…) chết `net::ERR_FAILED` khi tắt
  mạng, bé không mở được môn học nào — `qa/offline-pwa.mjs` đỏ 2/2 lần chạy. Nguyên nhân
  đo được bằng probe tạm: `vite preview` trả asset kèm `vary: Origin`, khoản precache lưu
  theo request *không* có header `Origin` trong khi request script của trang *có*
  `Origin: http://localhost:4173` ⇒ `cache.match()` mặc định trượt dù `dist/sw.js` đã
  precache đủ 98/98 URL (`assetCount: 86`). Sửa trong `public/sw.js`: nhánh same-origin
  match với `{ ignoreVary: true }` (tên file đã hash nội dung), fallback navigation dùng
  `ignoreSearch + ignoreVary`, cross-origin vẫn tôn trọng Vary. Probe chạy lại **3 lần đều
  `QA PASS — 10 step(s), 0 errors`**, học và trả lời câu hỏi được khi offline; hợp đồng
  khoá lại bằng test mới trong `tests/pwa.test.ts`.
- **Bé lớp 1 không nghe được phép tính (FR-Y02):** đề thi viết ký hiệu — `Tính: 6 + 4 = ?`,
  `Điền số: ... + 27 = 60` — nhưng giọng tiếng Việt của nền tảng bỏ qua `+`, `−`, `=` nên bé
  chỉ nghe "sáu bốn" và mất ngữ cảnh. Đo 2026-10-30: **24/475** câu trong kho thi mang ký
  hiệu trong văn bản đọc (260 câu Toán của curriculum đã có `audioPrompt` viết bằng lời nên
  không bị). Thêm lớp phát âm `src/services/speechText.ts` (`toSpeechText`): nối
  "cộng / trừ / bằng mấy / bằng bao nhiêu" vào đúng văn bản giao cho
  `SpeechSynthesisUtterance` ở **cả hai** đường đọc (`sound.speak`, `useSpeak.speak`).
  Chữ hiển thị, assert routing trong `questionAudio.ts` và `data-last-spoken` giữ nguyên văn
  đề; dãy trong ngoặc vuông (`[1 - 3 - 5]`), khoảng en dash (`1–3`), tên file
  (`add-sub-10`) và số âm đứng một mình không bị đọc thành phép trừ. `qa/audio.mjs` có bước
  mới ghi lại văn bản thật sự vào utterance và **FAIL nếu còn ký hiệu thô**:
  `QA PASS — 9 step(s), 0 errors` (2/2 lần chạy, `symbolicSeen: 4`, `symbolicSpoken: 4`,
  `rawSpoken: []`).

### Tests
- `tests/t24-speech-math-operators.test.ts` — 18 test cho lớp phát âm phép tính: cộng/trừ/
  bằng và `= ?` → "bằng mấy", U+2212, chuỗi `12 + 3 + 2 = ?`, mệnh đề có kết quả
  (`"6 + 4 = 11."`), `= ...` → "bằng bao nhiêu", **chỗ chấm đứng trước** dấu phép
  (`... + 27 = 60`, `... - 3 = 7` — bằng chứng từ thiết bị thật), không bịa lời cho chỗ chấm
  so sánh (`8 + 2 ... 9`), giữ dãy trong `[...]` / en dash `1–3` / `add-sub-10` / `-5 độ`,
  giới hạn đã biết (`30-10` đọc thành "30 trừ 10"), idempotency, tiếng Anh dùng
  plus/minus/equals, và test nguồn buộc **cả hai** đường đọc đi qua `toSpeechText` trong khi
  `questionAudio.ts` không được chạm tới nó.
- `tests/pwa.test.ts` — test hợp đồng `sw.js`: same-origin match dùng `{ ignoreVary: true }`,
  navigation fallback `ignoreSearch + ignoreVary`, cross-origin vẫn tôn trọng Vary.
- `tests/t21-fun-games.test.ts` — 14 test: hình well-formed, số chấm tăng theo bậc,
  đánh số 1..N và trong ngưỡng 7..93, determinism + xáo theo seed, pool bóng hình không
  trùng, 4 phương án duy nhất chứa đáp án, cổng nghiêng/lật theo bậc, mosaic chữ nhật +
  màu khai báo + ≥5 ô tô + ≥2 màu, số round theo bậc, ánh xạ `null`, bảng chân lý
  `isMosaicComplete`, và parity đăng ký của 3 id mới.
- `tests/t23-mcp-servers.test.ts` — 18 test cho lớp MCP: đủ 5 server, mỗi file `.mjs`
  parse bằng Node trần, **không import package ngoài** (giữ cam kết zero-dependency),
  `readRegistration()` trả 4 danh sách khớp nhau, fixture `mcp/sample-export.json` mang
  cờ `isDemoData`, và `progress/` nằm trong `.gitignore`.

## [1.0.0] - baseline

- Toàn bộ ứng dụng trước đợt SDLC này: lộ trình Tiếng Việt / Toán / Tiếng Anh / Em &
  Cuộc sống, 28 trò chơi giáo dục, Games Hub + registry lazy, luyện đọc karaoke,
  Competition Engine, Learning OS + Decision Engine, Praise Engine, sticker/shop/quest,
  PWA offline, Parent Mode, đồng bộ Google account.
- 971 unit test (67 file), cổng bundle main chunk ≤ 600 kB, audit tăng dần bằng
  `scripts/audit-snapshot.mjs`.

[Unreleased]: https://github.com/ducmanh2802/kho-bau-tri-thuc/commits/main
[1.0.0]: https://github.com/ducmanh2802/kho-bau-tri-thuc
