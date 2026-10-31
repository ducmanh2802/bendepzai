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
- **Merge `fd3e7da`** (lane khác): chế độ **challenge** trong `LessonPlayerModal`, chọn bậc
  (tier) ngay trong modal trò chơi — `GameModalWrapper` + `useGameStage.jumpToTier(targetTier)`
  (additive, không đổi hành vi mặc định), quân cờ vua SVG độ phân giải cao
  `src/components/learning/chess/ChessPieceSvg.tsx`, và **6 thế cờ tướng** có sẵn cho bé
  (`CotuongPuzzlesView.tsx` + `cotuongPuzzles.ts`: Ngọa Tào Mã, Song Pháo, Thiết Môn Khảm,
  Binh Nhập Cung, Mã Hậu Pháo, Song Xe Tảo Cung).

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
- **Nâng trần độ khó toàn catalog (T25)** theo phản hồi "các trò đang quá dễ" của phụ huynh;
  chuẩn mới là giữa–cuối lớp 1, tính 0–100 không nhớ/không mượn. Một bậc thang phương án dùng
  chung `TIER_OPTION_COUNT = [4, 4, 5, 5, 6, 6]` trong `src/data/gameLevels.ts` thay cho việc
  mỗi trò tự hardcode 4 đáp án.
  - Toán: `speed_racing` / `number_line_hop` / `number_tower` / `ocean_fishing` /
    `ten_frame_market` / `falling_numbers` lên trần 100, trộn phép hai bước ở bậc ≥5,
    giấy giờ chỉ bật từ bậc 4 và giảm dần còn 9 s ở bậc 6, chuỗi bóng Hứng Số tất định theo
    `(bậc, nonce)`, chợ Khung 10 thêm nút "Thêm 10" và hỏi theo chục.
  - Ngoài Toán: `shadow_match` / `animal_safari` / `listen_pick` lấy 6 phương án ở bậc 5–6
    (pool xoay trọn theo nonce), `rhyme_hunter` 4 → 12 trái/câu và chuyển sang builder riêng
    `buildRhymeRounds` thay vì cạo `options` từ ngân hàng câu hỏi (options của bank có chuỗi
    dài không phải một từ, hiển thị lên quả rất khó đọc), `syllable_builder` theo đúng
    `ROUNDS_PER_TIER` (8 câu ở bậc 6).
  - Puzzle: `memory_cards` 3 → 12 cặp (24 thẻ, lưới tự chuyển 3/4/5 cột thay vì ép 3 cột),
    `pixel_mosaic` 3×3 → 6×6 với 5 mẫu mới, `connect_dots` tới 18 chấm (thêm hoa 9 cánh,
    sao 8 cánh, bánh xe 14 tăm), `treasure_coding` bàn 4×4 → 8×8 với chương trình tới 18 lệnh
    (`MAX_TOKENS` 20) và đá chặn đường nhiều hơn.
- **Số liệu kiểm kê đo lại sau merge `fd3e7da`**: `README.md`, `docs/SDLC.md`,
  `docs/specs/{ARCHITECTURE,BRD,README,RTM,SRS}.md`, `docs/plan/{TASK_PLAN,TEST_PLAN}.md` cập
  nhật **71 file / 1035 test** và main chunk **531.2 kB** (thay cho 1034 / 512 kB đo trước
  merge); TEST_PLAN ghi 21 probe (20 `.mjs` + 1 `.cjs`).
- **T26 — Luyện thế cờ tướng có chấm bằng engine:** mỗi nước đi được kiểm bằng chính luật cờ
  (`inCheck(đen) && allLegalMoves(đen).length === 0` mới là chiếu bí), đi sai hiện phản hồi
  "Nước này chưa chiếu Tướng Đen. Bé thử quân khác nhé!", có nút gợi ý, lưu thế đã giải vào
  `kho_bau_cotuong_puzzles` (`StorageService.getCotuongSolvedPuzzles()` /
  `markCotuongPuzzleSolved()`, thưởng 25 XP đúng một lần), 6 tab thế cờ đủ 44 px.
- **T27 — Học hấp dẫn hơn:** chuỗi câu đúng liên tiếp (`lesson-combo`, âm thanh
  `sound.playCombo()`, confetti ở mốc 3 và 5), đồng hồ học (`lesson-timer`, dừng ở màn kết
  quả), xếp hạng 3 sao theo tỉ lệ đúng (`src/components/learning/lessonEngagement.ts`), danh
  sách câu chưa đúng kèm đáp án + nút "Ôn lại N câu" (lượt ôn chỉ gồm các câu sai, combo
  chạy lại từ 0), thẻ thống kê thời gian / chuỗi dài nhất / số câu đúng. Header bài học tách
  hai hàng để nút đóng luôn nằm trong màn 390 px.
- **T27 — Bằng chứng trình duyệt:** `qa/lesson-engagement.mjs` (2 lượt @390×844: lượt 1 học
  từ phản hồi của app rồi ôn lại) → `QA PASS — 3 step(s), 0 errors` (2/11 → 1 sao, 9 câu sai;
  ôn 9/9 → 3 sao, `maxCombo 9`, hàng sao trong màn hình, `overflowPx: 0`);
  `qa/cotuong-puzzles.mjs` → `QA PASS — 5 step(s), 0 errors` (giải 2 thế → `2/6 thế`, reload
  còn tiến độ, ô bấm ≥ 44 px).

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
- **Màn kết quả bài học che hàng sao (T27, bắt được bằng screenshot 390 px):** container
  dùng `justify-center` + `overflow-y-auto` nên khi danh sách câu sai dài, hàng sao bị cắt ở
  đầu và không cuộn tới được; nút "Về bản đồ" còn `autoFocus` khiến trình duyệt tự cuộn
  xuống đáy ngay khi mở. Sửa: wrapper `my-auto` (ngắn thì căn giữa, dài thì cuộn từ trên) và
  thay `autoFocus` bằng effect đưa tiêu điểm vào khung cuộn với `scrollTop = 0`.
- **Header bài học tràn ở 390 px (T27):** khi thêm bộ chọn độ khó + cụm điểm vào cùng hàng,
  nút đóng (X) bị đẩy ra ngoài màn hình; tách header thành hai hàng (tên bài + đồng hồ +
  đóng / độ khó + điểm), `min-w-[44px] min-h-[44px]` cho nút đóng, đo lại `overflowPx: 0`.
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
- **Đỏ CI do thiếu lockfile:** lane `3727f04` push lên `main` kèm việc **xoá
  `package-lock.json`** (3331 dòng) dù message chỉ nói `feat(auth,chess)`; cả 4 workflow đều
  chạy `npm ci --no-audit --no-fund` nên `npm ci` từ chối cài đặt, và `AGENTS.md` §1.6 coi
  lockfile là nguồn thật. Merge commit `b123fe9` giữ lại lockfile (package.json giữa hai lane
  không đổi nên không cần `npm install` lại). Số liệu kiểm kê trong `docs/specs` +
  `docs/plan` đo lại sau merge: **70 file / 1013 test**, entry `index-_TMkcsWv.js` **512 kB**,
  `three-vendor` 545.4 / `firebase-vendor` 537.9 / `ChessScreen` 43.5.
  **Tái diễn ở `fd3e7da`:** lane đó lại xoá `package-lock.json` (3331 dòng) trong merge nên
  merge lần này chạy `git merge --no-commit` rồi khôi phục lockfile trước khi commit;
  `package.json` vẫn không đổi giữa hai lane nên không cần `npm install` lại.
- **`origin/main` đỏ vì dữ liệu thế cờ tướng, không phải vì code:** test
  `tests/cotuong-engine.test.ts > validates COTUONG_PUZZLES integrity` fail ngay sau khi merge
  `fd3e7da`, vì 3/6 thế cờ tác giả đặt sai luật nên engine trả `legalMoves = []` và bé không
  chơi được: `ct-pz-1` hai Tướng cùng cột 4 thông (luật "tướng đối mặt" — `kingsFace()`
  ở `src/components/learning/cotuong/cotuongEngine.ts:201` — vô hiệu hoá **mọi** nước Đỏ),
  `ct-pz-2` Pháo sau có **hai** ngòi trên cột 4 (`b[1][4]` Sĩ + Pháo trước) nên không được
  phép bắn, `ct-pz-3` Xe bị Sĩ của chính mình ở `b[1][3]` chắn ngay trước mặt. Sửa trong dữ
  liệu: Tướng Đỏ `b[9][4]` → `b[9][3]`, Sĩ Đen `b[1][4]` → `b[1][3]`, Sĩ Đen `b[1][3]` →
  `b[1][4]`; hint `ct-pz-2` cập nhật toạ độ `[2, 4]` → `[6, 4]` cho khớp bàn cờ. Test cũ
  chạy lại **18/18 pass**.
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
- `tests/t25-difficulty-ladder.test.ts` — 18 test khoá bậc thang độ khó cả catalog: trần số
  `TIER_MAX_VALUE = [10, 20, 30, 50, 70, 100]`, không nhớ/không mượn ở mọi bước, ≥20% phép hai
  bước từ bậc 5, giấy giờ chỉ từ bậc 4 và giảm dần, chuỗi bóng Hứng Số tất định + bóng nhiễu
  sát ngưỡng, `TIER_OPTION_COUNT` áp cho cả nhóm ảnh/nghe (shadow/safari/listen-pick),
  `RHYME_FRUIT_CAP_BY_TIER = [4, 6, 8, 10, 12, 12]` kèm bất biến "không có hai quả đúng",
  trần nhóm Puzzle (24 thẻ lật, mosaic 6×6, 18 chấm, bàn coding 8×8 + chương trình ≤18 lệnh),
  và test nguồn quét 100% file `src/data/games/*.ts` cấm `Math.random` / `Date.now`.
- `qa/tier6-ladder-evidence.mjs` — probe bằng chứng nhìn thấy được: mở 9 trò Ngôn ngữ/Puzzle ở
  Màn 6 trên viewport 390×844, đếm số phương án/thẻ/ô/chấm **thực sự render trong DOM**,
  bắt tràn ngang (`overflowPx > 2`), phương án nằm ngoài màn hình mà vùng chơi không cuộn,
  ô bấm nhỏ hơn 44px, rồi chụp 9 ảnh màn hình. `node qa/run-one.mjs qa/tier6-ladder-evidence.mjs`
  → `QA PASS — 0 step(s), 0 errors`.
- Cập nhật test cũ theo bậc thang mới: `t16-math-games`, `t17b-coding` (`TIERS` 4→8,
  `MAX_STEPS` 8→18, bậc 6 dài hơn bậc 4), `t21-fun-games` (bậc thang bóng hình, kích thước
  mosaic, trần số chấm + khoảng cách chấm ≥12 đơn vị), `games-all` và `games-content`
  (pool xoay theo bậc, 12 con vật đều xuất hiện, pool vần ≥1.5× số câu).
- **Đo lại sau T25**: `npm run verify` **EXIT=0** — typecheck sạch, **71 file / 1034 test**
  passed, build 1.92 s, main chunk `index-B2ct57KD.js` **512 kB PASS** (trần 600).
- **Đo lại sau merge `fd3e7da` + sửa thế cờ tướng**: `npm run verify` **EXIT=0** — typecheck
  sạch, **71 file / 1035 test** passed, main chunk `index-Gnw1Zwiz.js` **531.2 kB PASS**
  (trần 600). Bằng chứng nhìn thấy được chạy trên bản merge: `node qa/run-one.mjs qa/games.mjs`
  và `node qa/run-one.mjs qa/tier6-ladder-evidence.mjs` đều `QA PASS — 0 step(s), 0 errors`,
  `npm run qa:smoke` `QA PASS — 28 step(s), 0 errors`.
- `tests/t26-cotuong-puzzles.test.ts` — khoá dữ liệu 6 thế cờ hợp luật, mỗi thế có lời giải
  chiếu bí đúng 1 nước và engine chấm được, cùng lớp lưu tiến độ thế đã giải.
- `tests/t27-lesson-engagement.test.ts` — `formatElapsed`, xếp hạng sao theo tỉ lệ đúng,
  nhãn tiếng Việt, cùng các hợp đồng nguồn: combo + âm thanh + confetti, đồng hồ dừng ở màn
  kết quả, danh sách câu sai không lặp, lượt ôn chỉ chứa câu sai và reset combo.
- **Đo lại sau T26/T27**: `npm run verify` **EXIT=0** — typecheck sạch, **73 file / 1052 test**
  passed, main chunk `index-B0-nRwl6.js` **533.6 kB PASS** (trần 600; con số script in nhãn
  `kB` nhưng chia 1024). Probe mới `qa/cotuong-puzzles.mjs` (5 step) và
  `qa/lesson-engagement.mjs` (3 step) đều `QA PASS`, 0 lỗi.

## [1.0.0] - baseline

- Toàn bộ ứng dụng trước đợt SDLC này: lộ trình Tiếng Việt / Toán / Tiếng Anh / Em &
  Cuộc sống, 28 trò chơi giáo dục, Games Hub + registry lazy, luyện đọc karaoke,
  Competition Engine, Learning OS + Decision Engine, Praise Engine, sticker/shop/quest,
  PWA offline, Parent Mode, đồng bộ Google account.
- 971 unit test (67 file), cổng bundle main chunk ≤ 600 kB, audit tăng dần bằng
  `scripts/audit-snapshot.mjs`.

[Unreleased]: https://github.com/ducmanh2802/kho-bau-tri-thuc/commits/main
[1.0.0]: https://github.com/ducmanh2802/kho-bau-tri-thuc
