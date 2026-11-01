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
- **Bộ cờ vua đổi sang cờ gỗ thật (đợt T34, theo yêu cầu "giống bộ cờ ngoài đời"):** bàn 3D
  bỏ toàn bộ kim loại vàng — ô cờ hai tông phong/gụ có vân gỗ tiện, viền óc chó 4 thanh,
  khắc a–h / 1–8; quân Staunton tiện lại bằng `ExtrudeGeometry` + bevel, mọi `metalness` về
  0, đai trang trí tối một bậc theo rãnh tiện thay cho vòng vàng; bàn 2D khung `#3f2817` /
  nền `#5b3a21` kèm dải nhãn hạng 8→1 và cột a→h; thẻ "Quân cờ", panel chi tiết và demo
  "Nước đi mẫu" thay ký tự Unicode ♜♞♝♛♚♟ bằng `ChessPieceSvg` — sửa luôn lỗi tương phản
  quân trắng Unicode gần như vô hình trên ô kem. Đo lại sau đợt: `npm run verify` **EXIT=0**,
  **80 file / 1143 test** (+9 test `tests/t34-chess-real-set.test.ts`), main chunk
  `index-CDvYH0Li.js` **534 kB PASS** (trần 600), `three-vendor` **572.6 kB** (từ 545.4, do
  `ExtrudeGeometry`), `ChessScreen` **52.3 kB** (từ 43.5). Bằng chứng nhìn thấy: screenshot
  bàn 3D (top/iso/POV), bàn 2D có khung gỗ và ô chọn, thẻ quân, tab Minh họa.
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
- **Vòng sửa bug T26/T27 (soát lại sau khi có bằng chứng trình duyệt), 5 lỗi thật:**
  - Bàn cờ tướng vẫn nhận thao tác khi đang hiện nước chiếu suông: bé bấm quân trong 1,1 s
    "bàn cờ tạm" rồi bàn cờ trả về sẽ giữ `selected`/`legal` tính trên thế cờ khác. Chặn mọi
    thao tác khi `status !== 'playing'`, và timer trả bàn cờ xoá sạch quân đang chọn.
  - Đã xoá lời nhắc "Nước này chưa chiếu" ngay sau nước **chiếu suông**: trước đây `misses`
    tăng nên sau khi bàn cờ trả về bé vừa đọc "Chiếu rồi!" lại thấy "chưa chiếu"; tách cờ
    `missNotice` và tắt trong timer trả bàn cờ.
  - Overlay thế cờ giải lại vẫn ghi "+25 XP" dù `markCotuongPuzzleSolved` trả `false` và
    không cộng XP; giờ hiện "Đã giải trước đó — ôn lại không thêm XP" (probe đọc XP trước/sau
    để chắc không đổi).
  - Đổi độ khó (Chuẩn/Thử thách) ở **màn kết quả** chỉ reset điểm: bé kẹt ở màn kết quả với
    "0 / N" và 1 sao. Gom mọi reset vào `startRun()`, dùng chung cho học lại, ôn câu sai và
    đổi độ khó.
  - Lượt **ôn câu sai** vẫn hiện khối thưởng "+Sao / +XP / +1 Vé" dù `completeLesson` chỉ
    cộng 5 XP luyện lại; giờ hiện khối `lesson-review-reward` nói đúng "+5 XP" và ghi rõ
    không thêm Sao/Vé.
- **Audit UI T28 — sửa các lỗi nhìn thấy được từ ảnh chụp của bé:**
  - **Bàn cờ tướng lệch quân:** lưới, cung Tướng và dấu mốc được vẽ từ `(0,0)` trong khi
    quân đặt theo lề `M = 0.95` ô, nên mỗi quân lệch gần một ô và hàng/cột biên nằm ngoài
    đường bao. Bọc toàn bộ lưới trong `<g transform="translate(M M)">`; probe đo lại 10
    đường ngang + 16 đường dọc khớp tọa độ quân.
  - **Máy gắp sticker dồn cục:** 8 sticker được xoay quanh tâm cửa kính với bán kính 60 px
    (lại tính bằng `Date.now()` mỗi lần render nên không hề quay), trên khung ngang chúng
    chụm thành một cục. Xếp 10 sticker theo % khung (2 lớp đống ở đáy kính), thêm hiệu ứng
    `gacha-jumble` + `claw-drop`, và đưa nút "Gắp Ngay" xuống **dưới** máy thay vì đè lên
    đống sticker.
  - **9 lớp `animate-*` chưa từng khai báo CSS** (`fade-in`, `slide-down`, `pop-in`,
    `pulse-slow`, `float-slow`, `bounce-subtle`, `spin-slow`, `pulse-ring`, `claw-drop`):
    modal tài khoản/lên cấp/kết quả và máy gắp đứng im vì Tailwind không sinh class tuỳ
    biến. Khai báo đủ trong `src/index.css`, kèm guard `tests/t28-ui-polish.test.ts` quét
    mọi `animate-*` trong `src/**/*.tsx`.
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
- **Luồng học chưa mượt (T29) — 5 lỗi thật, sửa sau khi đo bằng probe trình duyệt:**
  - **Mất thanh "Kiểm tra câu trả lời" khi cuộn:** thanh hành động nằm *trong* vùng
    `overflow-y-auto`, nên đề dài (hoặc khi mở bàn phím) đẩy nút xuống dưới đáy và bé phải
    cuộn ngược lên mới bấm được. Tách thanh thành anh em `shrink-0` nằm ngoài vùng cuộn;
    probe đo `barInsideScroller: false`, thanh đứng yên `barTop 714..766` khi cuộn hết đề.
  - **Câu mới mở ở giữa:** `scrollTop` dính lại từ câu trước nên đề tiếp theo xuất hiện
    không ở đầu. Reset `scrollTop = 0` khi đổi câu, trong `startRun()` (học lại / ôn câu sai
    / đổi độ khó) và cuộn lên đầu khi "Thử lại câu này".
  - **Banner chuỗi câu đúng làm nhảy đề:** banner `combo` chèn thêm một hàng vào luồng nên
    toàn bộ đề dịch xuống mỗi khi tạo/thoát chuỗi. Đặt vào slot cố định `h-6`
    (`data-testid="lesson-combo-slot"`) luôn chiếm chỗ; probe đo `comboSlotHeight: 24`,
    `comboShift: 0`, `barShift: 0`.
  - **Không thấy phản hồi đúng/sai:** với đề dài, phản hồi nằm dưới đáy vùng cuộn nên bé
    trả lời xong không thấy kết quả. Thêm `feedbackRef.scrollIntoView({ block: 'nearest',
    behavior: 'smooth' })` sau khi chấm; probe đo `feedbackVisible: true`.
  - **Cả modal render lại mỗi giây:** `setInterval` đặt state đồng hồ ở component cha nên
    toàn bộ đề/ảnh/nút render lại 1 lần/giây. Tách `<LessonClock startedAt paused>` riêng,
    `elapsedSec` chỉ tính một lần lúc kết thúc bài.
- **Quân cờ tướng trông "dán phẳng" lên mặt bàn (T30, bé báo bằng ảnh chụp):** đo trên build thật
  cho thấy hai nguyên nhân CSS, không phải lỗi thứ tự vẽ (`elementsFromPoint` trả mặt quân #4
  so với lưới #9 — quân đã nằm trên lưới). (1) Bóng tiếp đất khai `inset: 16% 8% -2% 8%` nên nằm
  lọt hoàn toàn trong lòng quân, không bao giờ nhìn thấy; (2) `.ct-piece__base` cùng kích thước
  với mặt quân nên không có thành, quân chỉ là một hình tròn in trên gỗ. Sửa: bóng đổ tràn dưới
  quân (`top: 54%`, `bottom: -24%`, đậm hơn, ở `translateZ(0.6px)`); đế `inset: 2% 2% -6% 2%`
  thò 6% dưới mặt quân với gradient gỗ tối dần (thành quân); mặt quân nâng `translateZ(14px)`
  và thêm bóng thường `0 2px 0` làm mép thành. Chế độ "Góc 2D" (`perspective: none`) vẫn giữ
  được khối vì toàn bộ hiệu ứng nằm trong mặt phẳng, không phụ thuộc `translateZ`.
- **Vòng soát bug T31 (5 lỗi thật, mỗi lỗi tái hiện bằng probe trước khi sửa):**
  - **Popup giới thiệu bài học không bẫy focus** (`qa/focus.mjs` đỏ): `SubjectScreen` mở
    `role="dialog"` nhưng Tab đi xuyên xuống bản đồ phía sau, không có nhãn cho trình đọc
    màn hình và không đóng được bằng Esc. Dùng `useFocusTrap`, `aria-label`, `tabIndex={-1}`,
    bấm nền để đóng, Esc để đóng; focus trả về đúng nút đã mở popup.
  - **Header tràn, nút "Ba Mẹ" ra ngoài màn hình** (`qa/mobile-home.mjs` + `qa/t01b-fixes.mjs`
    đỏ): nút đăng nhập Google chiếm chỗ nên ở 375/768/1024 px khu vực phụ huynh bị đẩy khỏi
    viewport (đo 10/42/90 px). Chữ nút auth chỉ hiện từ `xl`, giữ icon + `aria-label`.
  - **Thoại gấu lẫn chữ Hàn và câu vô nghĩa** (`Header.tsx`): một câu còn nguyên chữ Hàn,
    các câu "Bouncing!", "Hết lâu rưỡi!", lời chào "bé oir"; TTS đọc các từ đệm
    vô nghĩa. Viết lại 5 câu tiếng Việt trọn nghĩa, đọc đúng cả câu qua `sound.speak(...,
    'vi-VN')`, sửa lời chào theo buổi và câu khen chuỗi ngày học.
  - **Bàn cờ vua 3D trắng màn khi máy không có WebGL:** không có `ErrorBoundary` nên tạo
    `WebGLRenderer` thất bại là sập cả tab. `Chess3DCanvas` dò context trước, bắt exception
    khi tạo renderer và báo `onUnsupported`; `ChessGame` tự chuyển sang bàn 2D.
  - **Rò rỉ GPU khi đổi bàn cờ:** mỗi lần cập nhật thế cờ, mesh cũ bị bỏ khỏi scene nhưng
    `geometry` không `dispose()`; dọn kèm geometry của mọi mesh con.
- **Vòng soát bug T32 (khung trò chơi — lỗi nào cũng có bằng chứng trên build thật):**
  - **Chơi lại không xoá lượt cũ, bảng bị khoá mềm:** 13 trò reset trạng thái vòng theo
    `current.id`, nhưng builder sinh **id lặp lại ở cùng chỉ số** khi `nonce` đổi (đo trực tiếp
    trên `buildRounds` của `read_and_do` và `clock_builder`), nên sau khi bấm "Chơi lại" hoặc
    chọn lại màn, đồ vật đã chọn / đã đặt / số đã chạm vẫn treo nguyên và bé không chơi tiếp
    được. Đổi khoá reset sang `[current.id, stage.nonce]` (10 trò) và remount theo
    `key={`${current.id}-${stage.nonce}`}` (3 trò Nối Số Tô Màu, Bé Xếp Hình Mosaic, Đoán Bóng Hình).
  - **Chọn lại màn làm mất phần thưởng đã hứa:** `claimedKeys`, `receipt`, combo và dấu câu sai
    không được xoá trong `handleSelectTier`, nên lượt chơi mới ở cùng màn không còn được ghi
    sao/XP. Thêm `resetRewardState()` dùng chung cho đổi màn và "Chơi lại".
  - **Đồng hồ vẫn đếm khi bảng chơi bị che:** Đường Đua Thần Tốc trừ giờ của bé trong lúc lớp
    phủ "Chọn Màn & Độ Khó" đang mở. `GameModalWrapper` báo `onOverlayOpenChange`, game dừng
    tick khi bị che (bằng chứng: 15s → 15s sau 3 giây mở lớp phủ, rồi 15s → 12s sau khi đóng).
  - **Lời khen của gấu vang ở màn hình khác:** phản hồi đúng/sai hẹn giờ 250–900 ms bằng
    `setTimeout(() => sound.speak(...))` và không ai huỷ khi bé tắt trò chơi. Thêm
    `sound.speakLater()` + `sound.stopSpeaking()`, cắt tiếng khi `GameModalWrapper` và
    `KidBoxActivityPlayer` unmount; 12 chỗ gọi hẹn giờ chuyển sang `speakLater`.
  - **Nút chỉ có icon, không tên truy cập:** lớp phủ chọn màn, bảng điều khiển phụ huynh và bảng
    kết quả bài thi dùng nút ✕ không nhãn → bàn phím và máy đọc màn hình không đóng được.
    Thêm `aria-label` + `title="Đóng"`.
  - **Chữ Anh lẫn trong giao diện của bé (AGENTS §3):** "Đọc fluently" và bốn chuỗi
    `Level …` trong hộp chúc mừng lên cấp → viết lại tiếng Việt có dấu.
  - **Bắt Chữ Cái Bay đổi chữ đích lung tung:** hai effect cùng ghi `targetChar`, effect thứ hai
    đọc pool trước khi pool kịp nạp. Gộp thành một effect, chữ đầu tiên lấy thẳng pool vừa sinh.
  - **Nhận đủ mọi bước của câu thay vì theo thứ tự (Đọc Câu Làm Theo):** `isCorrectDrop` so khớp
    toàn bộ danh sách bước, nên câu nhiều bước cho phép làm bước sau trước. Siết lại thành
    "chỉ bước kế tiếp". Dữ liệu hiện tại mới có một bước mỗi vòng nên đây là phòng ngừa, chưa
    phải lỗi quan sát được trên màn hình.
  - **Hồi quy do chính đợt sửa:** đổi `aria-label` hộp chúc mừng lên cấp làm
    `dismissLevelUpCelebration()` khớp tuyệt đối trong `qa/lib.mjs` (và `qa/cotuong-puzzles.mjs`)
    bị lệch, kéo `qa/golden-path.mjs` đỏ vì hộp thoại chặn điều hướng. Probe chuyển sang khớp tiền tố.
  - **`qa/p41-font-visual.mjs` đỏ vì race trong chính probe:** sau `reload` probe chỉ *đếm* hộp mừng
    lên cấp một lần rồi bấm tiếp, nhưng hộp mount muộn hơn `[data-testid="nav-home"]` nên cú click
    bị chặn tới timeout 12 s (3 lần chạy đều đỏ — không phải lỗi may rủi của app). Probe giờ chờ hộp
    hiện (5 s) và đóng lặp lại tối đa 3 hộp; `tests/t31-bug-hunt-fixes.test.ts` đổi hợp đồng sang
    `dismissLevelUpCelebration(page)`.

- **Vòng soát bug T33 (hẹn giờ phản hồi sống lâu hơn lượt chơi):**
  - **Lời khen và gấu bị lượt trước xoá:** `GameModalWrapper` hẹn 1.500 ms (nhãn gấu) và
    2.500 ms (bóng lời khen) bằng `setTimeout` trần, nên bé trả lời liên tiếp trong vòng
    2,5 s thì hẹn giờ của lượt cũ vẫn chạy và làm phản hồi của lượt mới biến mất giữa
    chừng. Gom vào `showFeedback()` dùng hai ref, cắt khi lên lịch mới, khi đóng bảng chơi
    và khi sang màn/chơi lại.
  - **Lật Thẻ Trí Nhớ bị màn cũ "úp hộ":** id thẻ đánh số 1..2N nên **trùng nhau giữa mọi
    màn**; hẹn giờ 900 ms úp lại thẻ của Màn 1 còn sống khi bé đã nhảy sang Màn 4 sẽ úp
    luôn hai thẻ bé vừa lật, mất lượt (bằng chứng probe: lật hai thẻ ở màn mới mà bộ đếm
    "Đã thử" vẫn là 0). Hẹn giờ giờ nằm trong ref và bị cắt khi đổi màn/vòng.
  - **Luyện đọc có hai chuỗi highlight cùng chạy:** bấm "Đọc cả câu" lần hai là thêm một
    chuỗi `setTimeout` thứ hai (và hẹn giờ dò `onboundary` không nằm trong ref nào) ⇒ ô
    sáng nhảy lùi về đầu, bé không theo kịp chữ nào đang được đọc. Cả chuỗi lẫn hẹn giờ
    dò boundary giờ ở trong `karaokeTimersRef` và bị cắt khi bấm lại / sang đoạn / rời màn.
  - **Bấm "Thoát" mà đoạn văn vẫn được đọc:** `backToLobby()` chỉ đổi `phase` nên giọng
    đọc và chuỗi highlight vẫn chạy trên thang luyện đọc. Nay cắt `speechSynthesis` và
    chuỗi hẹn giờ ngay khi thoát (probe: `speakingDuringRead: true` → `speakingAfterExit: false`).
  - **Tiếng hò reo ăn mừng chết âm thầm:** mỗi lần bắn confetti mở một `new AudioContext()`
    (Chrome chỉ cho ~6 context mỗi tab) ⇒ sau vài lần ăn mừng lớn, lời reo không phát nữa
    dù hình vẫn bay. Một context dùng chung, tôn trọng công tắc tắt tiếng của Ba Mẹ.
  - **Nhạc nền thành tiếng rè:** `playBgMusicLoop` tự gọi lại bằng `requestAnimationFrame`
    (restart cùng một nốt G4 mỗi frame), sáu nốt của chuỗi đều `start(currentTime)` thay vì
    nối tiếp nhau, và `stopBgMusic` chỉ `suspend()` nên không giải phóng context. Chuỗi nốt
    giờ nối tiếp (`start` lệch theo trường độ), vòng lặp hẹn bằng `setTimeout` đúng lúc chuỗi
    kết thúc, và `close()` khi tắt.
  - **Bấm sai liên tiếp làm mất highlight và tụt sao (6 trò):** Phonics Pop, Đấu Trường Chính
    Tả, Chuyện Kể Toán Học, Thám Hiểm Giờ & Tiền, Xưởng Ghép Tiếng, Câu Cá Đại Dương tắt
    highlight bằng `setTimeout` trần, mà đáp án **sai thì không khoá bàn chơi** — lần bấm sau
    trong 900 ms bị hẹn giờ của lần trước xoá phản hồi, bé tưởng app chưa nhận nên bấm tiếp,
    mỗi lần bấm cộng thêm một lỗi và sao tụt 3→2→1 trên cùng một câu. Hook mới
    `src/hooks/useRoundFeedbackTimer.ts` bảo mỗi lượt chỉ có một hẹn giờ còn sống.
  - **Máy Gắp kéo vé và nổ confetti trên trang chủ:** vòng quay 2 s là chuỗi
    `requestAnimationFrame` không huỷ ⇒ bé bấm "Về Trang Chủ" giữa lúc quay vẫn bị trừ vé,
    tiếng "lên cấp" và confetti bắn ngay trên màn hình khác (rAF còn bị treo khi tab ẩn nên
    phần thưởng giật ra lúc bé quay lại). chu kỳ quay giờ lưu id frame và `cancelAnimationFrame`
    khi rời màn (probe: vé 5→5, 0 canvas).
  - **Cảnh báo "số liệu mẫu" chết sau ~1 s:** `ParentDashboardModal` cho hai thao tác dùng
    chung một trạng thái với hẹn giờ 3 s/6 s; bấm nạp dữ liệu thử nghiệm ngay sau khi đặt lại
    thì hẹn giờ 3 s của thao tác trước xoá cảnh báo sớm. Gom vào `showResetNotice()` một hẹn giờ.
  - **Điểm neo cho probe (không đổi câu chữ tiếng Việt):** thêm `data-testid="praise-toast"`,
    `memory-card`, `karaoke-read-all` và `answer-option` + `data-correct` cho `spelling_duel`.

### Tests
- `tests/t34-chess-real-set.test.ts` — 9 test cho bộ cờ vua gỗ: chiều cao quân tăng dần
  tốt < xe < mã < tượng < hậu (và hậu < 0.88 vua) đo bằng `Box3` thật, footprint mọi quân
  < 0.8 ô; không còn hex vàng (`0xfde047`/`0xf59e0b`/`0xd97706`/`0xb45309`) và không còn
  `goldMat` trong `pieceGeometries.ts` + `ChessPieceSvg.tsx`, mọi `metalness` bằng 0;
  phím bàn 3D in a–h thường; **guard hình học**: không mesh nào footprint ≥ 8×8 đơn vị
  nằm cao hơn mặt ô (chống lặp lại lỗi viền đặc che kín bàn cờ); hợp đồng bàn 2D
  (`border-[#3f2817]`, dải 8→1 và a→h, ô `#efd6ae`/`#9c6a40`, hết `ring-yellow-400`);
  tab Quân cờ và Nước đi mẫu không còn ký tự Unicode quân cờ, bắt buộc vẽ bằng
  `ChessPieceSvg`.
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
- **Đo lại sau vòng sửa bug T26/T27**: `npm run verify` **EXIT=0** — typecheck sạch,
  **73 file / 1058 test** passed (+6 test hồi quy cho 5 bug), main chunk
  `index-Z0QUlAuF.js` **533.8 kB PASS**. Probe mở rộng: `qa/cotuong-puzzles.mjs` (7 step:
  chặn thao tác khi bàn cờ tạm, không thưởng XP khi giải lại) và `qa/lesson-engagement.mjs`
  (5 step: khối thưởng lượt ôn "+5 XP", đổi độ khó ở màn kết quả mở lượt mới) đều
  `QA PASS — 0 errors`; `lesson-completion.test.ts` chuyển sang kiểm `startRun()`.
- **Đo lại sau audit UI T28**: `npm run verify` **EXIT=0** — typecheck sạch,
  **74 file / 1062 test** passed (+4 test: 1 lưới bàn cờ ở `t26`, 3 test chống hồi quy UI ở
  `t28`), main chunk
  `index-PGWPiTgJ.js` **533.8 kB PASS** (nhãn script là `kB` nhưng chia 1024). Probe:
  `qa/cotuong-puzzles.mjs` (8 step, thêm `gridAlignment` + ảnh bàn cờ đầy đủ) và probe mới
  `qa/gacha-machine.mjs` (4 step: 10 sticker trải 68% bề ngang kính, `claw-drop` +
  `gacha-jumble` chạy khi gắp, vé 5 → 4, lịch sử hiện sticker) đều `QA PASS`;
  `qa/golden-path.mjs` (28 step), `qa/games.mjs` (31/31) và `qa/lesson-engagement.mjs`
  (5 step) cũng `QA PASS`.
- `tests/t29-lesson-smooth.test.ts` — 6 test khoá cấu trúc màn học: vùng cuộn đóng **trước**
  thanh hành động (đếm độ sâu `<div>`), thanh là sibling `shrink-0` có viền trên, đúng 2 chỗ
  reset `scrollTop = 0`, có `feedbackRef.scrollIntoView({ block: 'nearest' })`, slot combo
  `h-6` đứng trước banner và banner đứng trước nút gửi, không còn banner ngoài luồng cũ, và
  `LessonClock` là component riêng với chữ ký `{ startedAt, paused }`.
- `qa/lesson-smooth.mjs` — probe mới (8 step) đo trên trình duyệt 390×844: thanh không nằm
  trong scroller, cuộn hết đề vẫn thấy thanh, tạo được chuỗi ≥2 câu đúng, `comboShift` /
  `barShift` ≤ 2 px, `scrollTop ≤ 4` sau mỗi "Câu tiếp theo", phản hồi hiện trong tầm nhìn,
  0 tràn ngang; chụp 4 ảnh (`01-question-open` … `04-next-question`).
- **Đo lại sau T29**: `npm run verify` **EXIT=0** — typecheck sạch, **75 file / 1068 test**
  passed (+6 test `t29`), main chunk `index-AUAPmuH2.js` **533.8 kB PASS** (nhãn script là
  `kB` nhưng chia 1024). Probe: `qa/lesson-smooth.mjs` **8 step** và
  `qa/lesson-engagement.mjs` (5 step, đồng hồ chạy 0:07 rồi đứng yên, lượt ôn 9/9 → 3 sao),
  `qa/golden-path.mjs` (28 step) đều `QA PASS — 0 errors`.
- `tests/t30-cotuong-piece-depth.test.ts` — 7 test khoá khối CSS của quân: bóng đổ tràn dưới quân
  (`top: 54%` / `bottom: -24%`, không còn `inset: 16% 8% -2% 8%`), đế có `inset` đáy âm (lộ thành
  quân) và `translateZ` thấp hơn mặt quân, mặt quân có bóng thường `0 2px 0` + viền `128, 86, 36`,
  trạng thái chọn nâng cao hơn 14px và giữ viền vàng, thứ tự render shadow → base → face, cùng
  hợp đồng của probe (đo pixel bằng `zlib.inflateSync`, có đo cả "Góc 2D").
- `qa/cotuong-depth.mjs` — probe mới (3 step): đo thứ tự vẽ 3 lớp quân so với lưới
  (`elementsFromPoint`, tạm bật `pointer-events` cho quân vì mặc định là `none`), đo đế thò dưới
  mặt quân (`rimBelowFacePx`), và **giải mã PNG** ảnh chụp để so độ sáng nền bàn ngay dưới quân
  với phía trên (`contactShadowDelta`). `node qa/run-one.mjs qa/cotuong-depth.mjs` →
  `QA PASS — 3 step(s), 0 errors` (`rimBelowFacePx: 3`, `contactShadowDelta: 11` ở 3D / `12` ở 2D,
  `faceLuma: 191`).
- **Đo lại sau T30**: `npm run verify` **EXIT=0** — typecheck sạch, **76 file / 1075 test** passed
  (+7 test `t30`), main chunk `index-BJHmn7nJ.js` **533.9 kB PASS**. `qa/cotuong-puzzles.mjs`
  (8 step) vẫn `QA PASS — 0 errors`.
- `tests/t31-bug-hunt-fixes.test.ts` — 16 test khoá lại các lỗi T31: `SubjectScreen` có
  `useFocusTrap`/`aria-label`/Esc/bấm nền; `AuthButton` không còn nhãn hiện ở `min-[420px]`/
  `min-[480px]` mà chỉ từ `xl`; thoại gấu không có Hangul, không còn "Bouncing!" /
  "Hết lâu rưỡi!", TTS đi qua `sound.speak(phrase` và không tự tạo
  `SpeechSynthesisUtterance` với từ đệm; `Chess3DCanvas` dò WebGL, bọc `try/catch` khi tạo
  renderer, gọi `onUnsupported` và `child.geometry.dispose()`; cùng hợp đồng của 7 probe vừa
  sửa (focus/mobile/golden-path/t01b/offline/p41-curriculum/p41-font).
- **7 probe đo sai được sửa để QA nói đúng sự thật:** `qa/focus.mjs` so `data-testid` thay vì
  nhãn nút cũ ("Vào học"/"Học lại"); `qa/mobile.mjs` bỏ chuỗi đồng hồ đang chạy khỏi đề khi so
  sánh; `qa/golden-path.mjs` chờ card `decision-engine-card` (chunk nạp lười); `qa/t01b-fixes.mjs`
  nhận nút CTA nhà "Học tiếp|Bắt đầu:"; `qa/offline-pwa.mjs` poll trạng thái service worker từ
  Node thay vì `waitForFunction` với predicate async (Playwright trả về ngay); 
  `qa/p41-curriculum-quality.mjs` chấp nhận màn kết quả còn mở sau câu cuối (T20A/B-03);
  `qa/p41-font-visual.mjs` đóng hộp mừng lên level trước khi bấm tiếp.
- **Đo lại sau T31**: `npm run verify` **EXIT=0** — typecheck sạch, **77 file / 1091 test** passed
  (+16 test `t31`), main chunk `index-hJ50GmCf.js` **533.5 kB PASS**. 24 probe trên đúng dist đó
  đều `QA PASS — 0 errors`: `games` 31/31 mount + thưởng `0→0→1→2`, `mobile-home`
  `headerOffscreen: 0` ở 8 bề rộng, `focus` `focusRestoredToTrigger: true`, `offline-pwa` 10 step
  (`active: true, controller: true`), `p41-font-visual` 13 step, `p41-curriculum-quality` 5 step,
  `lesson-types` 137 step, `golden-path` 28 step, `decision-engine` 12 step, `audio` 9 step,
  `question-types` 9 step, `lesson-smooth` 8 step, `cotuong-puzzles` 8 step, `lesson-engagement` /
  `gacha-machine` / `cotuong-depth` / `responsive-a11y` / `mobile` / `mobile-golden` /
  `kidbox-focus` / `decision-engine-a11y` / `t01-hotfix` / `t01b-fixes` / `tier6-ladder-evidence`.
- `tests/t33-feedback-timers.test.ts` — 23 test cho vòng soát bug T33: deck mọi màn của
  Lật Thẻ trùng id 1..6 (nguyên nhân khiến hẹn giờ cũ úp nhầm thẻ màn mới); hẹn giờ úp thẻ
  phải nằm trong ref và bị cắt khi sang màn/chơi lại/unmount; `GameModalWrapper` không còn
  `setTimeout` trần cho `mascotReaction`/`praiseText`; chuỗi karaoke chỉ một nguồn sáng, có
  boundary thì chuỗi tự chạy bị tắt, rời màn thì cắt tiếng; `backToLobby` cắt cả hai; sáu trò
  phải dùng `useRoundFeedbackTimer` (đo bằng fake `window`/fake timer: mười lần ăn mừng lớn
  chỉ một `AudioContext`, sáu nốt nhạc nền sáu thời điểm khác nhau, tắt nhạc là `close()`).
- `tests/t32-game-stage-reset.test.ts` — 20 test cho vòng soát bug T32: 13 trò phải reset theo
  `stage.nonce` (quét nguồn, chặn `}, [current.id]);` và `key={current.id}` còn sót), đo id va
    chạm thật của builder `read_and_do` / `clock_builder`, hợp đồng `resetRewardState` khi đổi
  màn, khoá `pickerOpen` của đồng hồ đua, thứ tự bước của Đọc Câu Làm Theo, một effect cấp đích
  của Bắt Chữ Cái Bay, `sound.speakLater` / `stopSpeaking` bằng fake timer, không còn
  `setTimeout` gọi thẳng `sound.speak`, `aria-label` cho nút icon-only và chữ tiếng Việt trong
  `HomeScreen` / `LevelUpCelebrationModal`.
- `qa/t32-game-replay-evidence.mjs` — probe thứ 27: bằng chứng trên build thật cho ba lỗi khung
  trò chơi (chơi lại xoá lượt dở, đồng hồ đứng khi bị lớp phủ che rồi chạy tiếp, ✕ đóng lớp phủ
  chọn màn) + 4 ảnh chụp, chạy với `?qa` để DOM lộ bước hợp lệ.
- **Sửa probe do đổi nhãn:** `dismissLevelUpCelebration()` (`qa/lib.mjs`) và
  `qa/cotuong-puzzles.mjs` khớp `aria-label` tuyệt đối của hộp chúc mừng lên cấp, đổi câu chữ
  tiếng Việt là cả `qa/golden-path.mjs` đỏ; chuyển sang khớp tiền tố `aria-label^="Chúc mừng"`.
- **Đo lại sau T32**: `npm run verify` **EXIT=0** — typecheck sạch, **78 file / 1111 test** passed
  (+20 test `t32`), main chunk `index-BNbdkwuO.js` **533.8 kB PASS** (trần 600). Quét lại **toàn bộ
  27 probe** trên đúng dist đó: 25 probe chạy qua `qa/run-one.mjs` in `QA PASS — 0 errors`
  (`t32-game-replay-evidence` 5 step, `golden-path` 28, `lesson-types` 137, `p41-font-visual` 13,
  `p41-curriculum-quality` 5, `question-types` 9, `offline-pwa` 10, `audio` 9, `decision-engine` 12,
  `games` 31/31 mount + thưởng `0→0→1→2`, `cotuong-puzzles` 8, `cotuong-depth` 3, `lesson-smooth` 8,
  `lesson-engagement` 5, `gacha-machine` 4, `tier6-ladder-evidence`, `focus`, `mobile`, `mobile-home`,
  `mobile-golden`, `responsive-a11y`, `kidbox-focus`, `decision-engine-a11y`, `t01-hotfix`,
  `t01b-fixes`), `qa/t02-smoke.mjs` chạy trực tiếp `ERRORS: []` exit 0; **riêng
  `qa/p38-browser-probe.cjs` exit 1 vì `require('puppeteer')` mà repo không có dependency đó**
  (không tự thêm theo `AGENTS.md` §1.4) — xem ghi chú nợ ở `docs/plan/TEST_PLAN.md` §6.
- **Đo lại sau T33**: `npm run verify` **EXIT=0** — typecheck sạch, **79 file / 1134 test** passed
  (+23 test `t33`), main chunk `index-RJBSh_JH.js` **534 kB PASS** (trần 600; `check:budget` chia
  1024 nên bản chất là 534 KiB, log `vite build` in 546.84 kB thập phân). Quét lại **toàn bộ
  28 probe** trên đúng dist đó (build 16:14): 26 probe chạy qua `qa/run-one.mjs` in
  `QA PASS — 0 errors` (`t33-feedback-timers` 6 step, `t32-game-replay-evidence` 5, `lesson-types`
  137, `golden-path` 28, `p41-font-visual` 13, `decision-engine` 12, `offline-pwa` 10, `audio` 9,
  `question-types` 9, `cotuong-puzzles` 8, `lesson-smooth` 8, `lesson-engagement` 5,
  `p41-curriculum-quality` 5, `gacha-machine` 4, `cotuong-depth` 3, `games` (`catalogCount` 31),
  `tier6-ladder-evidence`, `focus`, `mobile`, `mobile-home`, `mobile-golden`, `responsive-a11y`,
  `kidbox-focus`, `decision-engine-a11y`, `t01-hotfix`, `t01b-fixes`), `qa/t02-smoke.mjs` chạy trực
  tiếp `play buttons: 31` / `dialog buttons: 8` / `ERRORS: []` exit 0; **riêng
  `qa/p38-browser-probe.cjs` vẫn exit 1 vì `require('puppeteer')` mà repo không có dependency đó**
  (không tự thêm theo `AGENTS.md` §1.4).

## [1.0.0] - baseline

- Toàn bộ ứng dụng trước đợt SDLC này: lộ trình Tiếng Việt / Toán / Tiếng Anh / Em &
  Cuộc sống, 28 trò chơi giáo dục, Games Hub + registry lazy, luyện đọc karaoke,
  Competition Engine, Learning OS + Decision Engine, Praise Engine, sticker/shop/quest,
  PWA offline, Parent Mode, đồng bộ Google account.
- 971 unit test (67 file), cổng bundle main chunk ≤ 600 kB, audit tăng dần bằng
  `scripts/audit-snapshot.mjs`.

[Unreleased]: https://github.com/ducmanh2802/kho-bau-tri-thuc/commits/main
[1.0.0]: https://github.com/ducmanh2802/kho-bau-tri-thuc
