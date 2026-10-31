# TASK_PLAN — Kế hoạch công việc từ đầu đến cuối
## KHO BÁU TRI THỨC — LỚP 1 (mã tài liệu KBT-TASK-1.0)

> Ba phần: **(I) WBS** — chia toàn bộ sản phẩm thành gói công việc;
> **(II) Lịch sử** — P25 → P43 đã làm gì, bằng chứng ở đâu;
> **(III) Tương lai** — epic EP-A…EP-G, task T-xx kèm DoD, gate và độ lớn.
>
> Quy ước độ lớn (dựa trên tiền lệ có thật trong `docs/opencode/reports/`):
> **S** = 1 file + test (≤ 30 phút) · **M** = 1 tính năng nhỏ, 3–6 file (≈ 1 phiên ngắn,
> tiền lệ T01 hotfix) · **L** = 1 trò chơi mới trọn 4 nơi + data pack 6 bậc + test
> (tiền lệ T15: 3 game + 23 test trong 1 phiên) · **XL** = nhiều phiên, nhiều service.
> Không có "giờ công" ảo: mỗi task ghi độ lớn + tiền lệ, không cam kết ngày.

---

## I. WBS — Cấu trúc chia công việc

| WP | Gói công việc | Vùng mã | Chủ sở hữu trí thức |
|---|---|---|---|
| WP-01 | Vỏ ứng dụng, điều hướng, hồ sơ, Parent Gate | `src/App.tsx`, `src/components/{home,world,subject,common,parent,system,auth}`, `src/hooks/{useModalHistory,useFocusTrap}.ts` | SRS §4.1 |
| WP-02 | Nội dung học 4 môn | `src/data/*Curriculum.ts`, `src/data/{vietnamese,math,english}/`, `src/services/{gameContent,sessionComposer}.ts` | `docs/CURRICULUM_MAP.md` |
| WP-03 | Learning OS + Decision Engine + adaptive | `src/services/{learningOS,decisionEngine,adaptive,adaptiveDifficulty,levelEngine}.ts`, `src/types/learningOS.ts`, `P39_DECISION_POLICY` | `docs/P39_LEARNING_OS_DECISION_ENGINE.md` |
| WP-04 | Trò chơi (31) + framework bậc độ khó | `src/data/games/*.ts`, `src/components/games/*`, `src/hooks/useGameStage.ts`, `src/config/policy.ts:262` | `docs/GAME_DESIGN.md` |
| WP-05 | Luyện đọc | `src/data/reading*.ts`, `src/services/readingEngine.ts`, `src/components/reading/` | `docs/P27_5_READING_FLUENCY.md` |
| WP-06 | Thi thử + Tournament | `src/data/competition*.ts`, `src/services/{competitionEngine,competitionQuality,tournament}.ts`, `src/components/competition/` | `docs/P27_5_EXAM_FIDELITY.md` |
| WP-07 | Tiếng Anh nâng cao: Kid's Box, IOE, mastery, en-GB | `src/data/{kidBox*,englishSkillTaxonomy,englishIoe}`, `src/services/{kidBox*,britishSpeech,englishMastery*}.ts`, `src/components/english/` | `docs/ENGLISH_KIDBOX_*.md` |
| WP-08 | Động lực + cửa hàng + thành tựu | `src/services/{sticker,shop,quest,streak,achievement,praise}Engine.ts`, `src/components/{motivation,shop,achievements,challenge}` | `docs/PARENT_MODE.md` |
| WP-09 | Bền dữ liệu: storage, schema, migration, sanitizer, idempotency | `src/services/storage.ts`, `src/types/` | `docs/P30_RELIABILITY.md` |
| WP-10 | PWA/offline, âm thanh, giọng đọc, a11y, responsive | `src/services/{pwa,sound,questionAudio}.ts`, `public/sw.js`, `scripts/sw-precache.mjs`, `src/index.css` | `docs/P31_PERFORMANCE_ACCESSIBILITY.md`, `docs/P34_PWA_MOBILE_AUDIO_CERTIFICATION.md` |
| WP-11 | Module cờ (cờ vua + cờ tướng 3D) | `src/components/learning/{chess,cotuong}/` | `docs/cotuong.md`, `docs/covua.md` |
| WP-12 | Kỹ thuật chất lượng: cổng, CI, hooks, QA probe, MCP, tài liệu | `scripts/`, `.github/workflows/`, `qa/`, `tests/`, `mcp/`, `docs/` | `docs/SDLC.md` |

**Quy tắc:** một task chỉ thuộc một WP. Nếu phải sửa hai WP → tách hai task (để PR nhỏ,
review được). WP-12 áp dụng cho **mọi** task khác (không task nào xong nếu chưa chạy cổng).

---

## II. Lịch sử — P25 → P43 (tái dựng từ bằng chứng trong repo)

### 2.1 Giai đoạn nền móng

| Phase | Nội dung | Đầu ra nhìn thấy được | Bằng chứng |
|---|---|---|---|
| **P25** | Audit sâu toàn bộ | baseline lỗi, 3 lỗi P0 gốc rễ | `docs/P25_DEEP_AUDIT.md`, `docs/MASTER_BASELINE.md` |
| **P26** | Cơ chế học + trò chơi | khung lesson/game đầu tiên | `docs/LEARNING_ENGINE.md` |
| **P27** | Competition Engine | taxonomy kỹ năng, scoring, error analysis, readiness | `docs/P27_*.md` (8 file) |
| **P28** | Learning OS | *trước đây là code chết* → được cứu ở P27.5 | `docs/P28_BASELINE.md` |
| **P27.5** | Exam fidelity + reading fluency | 7 dạng bài, blueprint, seed, timer, scoring, review; thang 5 bậc đọc | `docs/P27_5_EXAM_FIDELITY.md`, `docs/P27_5_READING_FLUENCY.md` |

### 2.2 Giai đoạn đóng gói chất lượng

| Phase | Nội dung | Số liệu/hiệu quả đã đo | Bằng chứng |
|---|---|---|---|
| **P29** | Content / Question Quality | validator + coverage matrix; 5 lỗi nội dung sửa | `docs/P29_CONTENT_QUALITY.md`, `tests/content-quality.test.ts` |
| **P30** | Reliability / persistence / security | migration + sanitize + idempotency 5 tầng + parent mode | `docs/P30_RELIABILITY.md`, `tests/decision-engine-storage.test.ts` |
| **P31** | Performance / responsive / a11y / offline | bundle + 6 viewport + reduced motion | `docs/P31_PERFORMANCE_ACCESSIBILITY.md`, `qa/responsive-a11y.mjs` |
| **P32** | Google AI Studio | dependency/metadata/fresh-env | `docs/P32_GOOGLE_AI_STUDIO.md`, `docs/GOOGLE_AI_STUDIO_RUNBOOK.md` |
| **P33** | Final certification | từng gate + golden path | `docs/P33_FINAL_CERTIFICATION.md`, `docs/FINAL_RELEASE_REPORT.md` |

### 2.3 Giai đoạn mở rộng nội dung + hardening thiết bị

| Phase | Nội dung | Kết quả đo được | Bằng chứng |
|---|---|---|---|
| **P34** | PWA + offline + focus trap + audio + mobile hardening; roadmap Capacitor APK | icon 192/512 any+maskable + apple-touch, WebAudio synth 0 file, ScreenTimeModal trap | `docs/P34_PWA_MOBILE_AUDIO_CERTIFICATION.md`, `qa/offline-pwa.mjs` |
| **P36** | Competition bank expansion + quality engine | bank v4 (+230 câu), rebalancing đáp án, 15 lỗi nội dung sửa | `tests/competition-p36.test.ts`, `src/config/policy.ts` (`P36_BANK_POLICY`) |
| **P37** | (giữ nguyên, không hồi quy) | suite xanh | `docs/MASTER_ROADMAP.md` |
| **P38** | Praise Engine + parity ngôn ngữ/âm thanh | sửa language + audio routing | `docs/P38_PRAISE_ENGINE_CERTIFICATION.md`, `tests/praise-engine.test.ts`, `docs/QUESTION_AUDIO_ROUTING_FIX.md` |
| **P39** | Learning OS Decision Engine | pipeline NBA canonical: `decisionEngine.ts` + `P39_DECISION_POLICY` | `docs/P39_LEARNING_OS_DECISION_ENGINE.md`, `tests/decision-engine.test.ts`, `qa/decision-engine.mjs` |
| **P40** | Learning outcome + feedback loop | vòng bằng chứng → `KnowledgeState` → hành động kế tiếp | `LearningOS.reduceEvidence` (`src/services/learningOS.ts:133`), `tests/decision-engine.test.ts`. Phase này không có tài liệu chứng nhận riêng; prompt đã gỡ — đọc bằng `git show "99edd29:docs/KHO BÁU TRI THỨC — P40 AUTONOMOUS FULL PASS.md"` |
| **P41** | Adaptive Learning Upgrade (sessionState + trường adaptive per skill), font/toán học/tả | schema `P41-v1` backfill không mất lịch sử; main chunk 446 kB | `docs/P41_CERTIFICATION.md`, `tests/curriculum-quality-p41.test.ts`, `qa/p41-font-visual.mjs` |

### 2.4 P42 — hàng đợi task tự động (35 task, 39 báo cáo; prompt đã gỡ, chỉ còn `queue/00_README.md` + `05_T03B`)

Cơ chế: `docs/opencode/run-all.ps1` đọc `queue/NN_ID_mô-ta.md` theo thứ tự tên file, mỗi
task một phiên trên nhánh `p42/ID`, tự kiểm typecheck/test/build, tự sửa tối đa 2 lần rồi
merge `main`. Trạng thái: `docs/opencode/TRANG_THAI.md`; báo cáo: `docs/opencode/reports/`.

34/35 prompt task đã **gỡ** khỏi `queue/` ngày 2026-10-30 (mỗi task đều có báo cáo trong
`reports/`); hai file còn lại là `00_README.md` (cách chạy) và `05_T03B_linh_vat_minh_hoa.md`
(task nợ). 20 brief `docs/opencode/T01…T20.md` cũng đã gỡ. Cách lấy lại từng file:
`docs/MASTER_ROADMAP.md` mục "Cấu trúc `docs/` sau khi gỡ prompt".

| Nhóm task | Việc | Kết quả |
|---|---|---|
| T01, T01B | hotfix UI, header, Esc/Back, touch 44 px, contrast ≥ 4.5:1, font tự chứa | 496 → 504 test, probe QA 30/30 |
| T02, T02B, T02C, T02D | sửa nội dung game + thưởng delta; tách 18 game sang `src/data/games`; hạ tầng chunk (727 → 253 kB, `react-vendor` riêng; validator 1679 ms → 35 ms); 2 lỗi nội dung | 435 → 523 test |
| T03A, T04 | design tokens tập trung + tách ngân hàng câu hỏi game sang `src/data/games/` (18 game). **T03B (component Mascot) chưa làm** — task còn trong `queue/` | `docs/opencode/reports/T03A_REPORT.md`, `T04_REPORT.md` |
| T05…T09B | LessonPlayer nhiều dạng bài, home một màn, con đường phiêu lưu, Games Hub + registry lazy, luyện đọc + đấu trường | 599 → 601 test; 31 game sau này |
| T10A…T14C | nội dung 4 môn (Tiếng Việt âm/vần, Toán đến 100, Anh unit 1–12, truyện đọc, Em & Cuộc sống 14 chủ đề/26 bài/264 câu) + 35 test bổ sung | 616 → 651 test |
| T15…T17B | 10 trò chơi mới theo nhóm môn + Logic/Khoa học (mỗi trò data pack 6 bậc + đăng ký 4 nơi + test) | 716 → 822 test, 26 → 28 game |
| T18A/B/C | hệ động lực dữ liệu (60 sticker/6 bộ, shop 43 món, 31 quest, level XP 1–50, khiên), UI, shop/thành tựu/phụ huynh | 679 test; schema `P42-v2` |
| T19, T20A/B | âm thanh chúc mừng, QA + sửa P0/P1 + auto-fix 18 WARNING nội dung | 843 test |

### 2.5 P43 — phiên hiện tại (2026-10-17 → 2026-10-29)

| Block | Việc | Bằng chứng |
|---|---|---|
| 3 lỗi P0 | ordering chấm sai (`toPipeText`), fatigue kẹt (`resetStaleFatigue` + `FATIGUE_SESSION_GAP_MS`), Word Safari không thắng (1 target + decoy) | `docs/opencode/reports/P43_SESSION_STATE.md`, `tests/answerCheck.test.ts`, `tests/fatigue-reset.test.ts` (7/7) |
| Cờ tướng | engine negamax + alpha-beta có node budget, bàn 3D CSS, luật khoá bằng test | `src/components/learning/cotuong/`, `tests/cotuong-engine.test.ts` |
| Trò chơi mới | Nối Số Tô Màu, Đoán Bóng Hình, Bé Xếp Hình Mosaic (đủ 4 nơi) | `CHANGELOG.md` `[Unreleased]`, `qa/games.mjs` |
| Quy trình | SDLC + hooks + 4 workflow CI + template PR/Issue + `AGENTS.md` | `docs/SDLC.md`, `scripts/hooks/`, `.github/workflows/` |
| MCP cho agent | 5 server / 27 tool zero-dependency + test guarding | `mcp/`, `tests/t23-mcp-servers.test.ts` |
| Bộ tài liệu | BRD, SRS, ARCHITECTURE, RTM + TASK_PLAN/TEST_PLAN này | `docs/specs/`, `docs/plan/` |

### 2.6 P44 — dọn tài liệu + merge thực tế mới (2026-10-30)

| Block | Việc | Bằng chứng |
|---|---|---|
| Gỡ prompt | xoá **68** file prompt đã chạy xong (13 ở `docs/` gốc, 21 ở `docs/opencode/`, 34 ở `queue/`), giữ 3 master prompt module + `queue/05_T03B`; lối hồi phục ghi ở `docs/MASTER_ROADMAP.md` | `git -c core.quotepath=off status --porcelain \| grep -c "^ D"` = 68; hồi phục bằng `git show "99edd29:<đường-dẫn>"` |
| Sửa tham chiếu | 6 tài liệu cũ trỏ vào prompt đã gỡ được viết lại thành trỏ commit hồi phục hoặc bằng chứng code thật (`docs/MASTER_ROADMAP.md`, `docs/opencode/README.md`, `queue/05_T03B…`, `reports/P43_SESSION_STATE.md`, `TASK_PLAN` §2.4) | Read + `grep` |
| Merge | `75d364e` merge `origin/main` (lane khác): Firebase cloud-sync + bàn cờ vua WebGL; `package.json` auto-merge ⇒ runtime deps 5 → **8** | `git log --merges -1`, `package.json` |
| Đo lại | `npm install` + `npm run verify` **EXIT=0**: 69 file / 994 test, build 8.92 s, main chunk `index-DGxWhyYx.js` **508.2 kB PASS**; `three-vendor` 544.1 / `firebase-vendor` 537.9 | output `npm run verify`, `npm run check:budget` |
| Viết lại specs | ARCHITECTURE (§1, §2, §3, §4.3, §6, §7, §8, §9, ADR-01/11/13, thêm ADR-16/17, §12, §13) · SRS (88 FR, 11 IF, FR-Y08/Y09, FR-C01/C06, NFR-P01/C01/M04/M05, §8, A-03) · BRD (BG-01/BG-05, §4.2, R-02/R-08, chi phí, phụ lục A) · RTM · TEST_PLAN | `docs/specs/*.md`, `docs/plan/TEST_PLAN.md` |
| Sửa hồi quy offline | chunk lazy chết `net::ERR_FAILED` khi tắt mạng dù precache đủ 98/98 URL — `vite preview` trả `vary: Origin`, key precache (không có `Origin`) không khớp request script của trang (có `Origin`). `public/sw.js`: same-origin match `{ ignoreVary: true }`, navigation fallback `ignoreSearch + ignoreVary`, cross-origin giữ nguyên. Khoá bằng test mới trong `tests/pwa.test.ts` (⇒ tổng test **994**) | `node qa/run-one.mjs qa/offline-pwa.mjs` → `QA PASS — 10 step(s), 0 errors` (3/3 lần chạy, `assetCount: 86`, `offlineAnswering.showedFeedback: true`) |
| Sửa T24: phép tính không đọc | đề thi viết ký hiệu (`Tính: 6 + 4 = ?`, `Điền số: ... + 27 = 60`) nhưng giọng tiếng Việt của nền tảng bỏ qua `+ − =` ⇒ bé chỉ nghe "sáu bốn". Đo 24/475 câu trong kho thi có ký hiệu trong văn bản đọc; 260 câu Toán curriculum đã có `audioPrompt` bằng lời nên không bị. Thêm lớp phát âm `src/services/speechText.ts` (`toSpeechText`) nối "cộng/trừ/bằng mấy/bằng bao nhiêu" NGAY TRƯỚC utterance ở cả hai đường (`sound.speak`, `useSpeak.speak`); không sửa chữ hiển thị, không đụng assert routing trong `questionAudio.ts`. `qa/audio.mjs` thêm bước ghi lại văn bản thật sự giao cho `SpeechSynthesisUtterance` và FAIL nếu còn ký hiệu thô | `node qa/run-one.mjs qa/audio.mjs` → `QA PASS — 9 step(s), 0 errors` (2/2 lần chạy; `symbolicSeen: 4`, `symbolicSpoken: 4`, `rawSpoken: []`); `tests/t24-speech-math-operators.test.ts` 18 test |
| Merge + giữ lockfile | `origin/main` có `3727f04` (lane auth/chess) **xoá `package-lock.json`** 3331 dòng trong khi cả 4 workflow chạy `npm ci`; merge bằng `--no-commit` rồi khôi phục lockfile trước khi commit (`package.json` hai lane không đổi ⇒ không cần `npm install` lại). Đo lại toàn bộ số liệu kiểm kê sau merge | `b123fe9`; `npm run verify` **EXIT=0**: 70 file / **1013 test**, main chunk `index-_TMkcsWv.js` **512 kB PASS**, `three-vendor` 545.4 / `firebase-vendor` 537.9 |
| T25 nâng trần độ khó | Phụ huynh báo "các trò đang quá dễ"; chốt hướng **nâng trần trong 31 trò đang có** (không thêm trò mới), chuẩn giữa–cuối lớp 1. Một bậc thang dùng chung: `TIER_OPTION_COUNT = [4,4,5,5,6,6]` trong `src/data/gameLevels.ts` + `tierOptionCount()`; Toán 0–100 không nhớ/mượn, phép hai bước từ bậc 5, giấy giờ từ bậc 4 (9 s ở bậc 6), chuỗi bóng Hứng Số tất định; `rhyme_hunter` 4 → 12 trái và **chuyển từ cạo `options` trong ngân hàng câu hỏi sang `buildRhymeRounds`** (options của bank có chuỗi dài không phải một từ); Puzzle: 12 cặp thẻ (lưới 3/4/5 cột), mosaic 6×6, 18 chấm, coding 8×8 + 18 lệnh | `tests/t25-difficulty-ladder.test.ts` 18 test; `node qa/run-one.mjs qa/tier6-ladder-evidence.mjs` → `QA PASS — 0 step(s), 0 errors` (9/9 trò Màn 6: 6 phương án, 24 thẻ, mosaic 6×6, 16–18 chấm, bàn 8×8, `overflowPx: 0`, `belowFoldPx: 0`, ô bấm ≥ 44 px); `node qa/run-one.mjs qa/games.mjs` → `QA PASS`, `catalogCount: 31`, 31/31 mounted; `npm run verify` **EXIT=0**: 71 file / **1034 test**, build 1.92 s, main chunk `index-B2ct57KD.js` **512 kB PASS** |
| Merge `fd3e7da` + sửa thế cờ tướng | Lane đó đưa challenge mode, chọn bậc trong modal (`useGameStage.jumpToTier`), quân cờ vua SVG và 6 thế cờ tướng, đồng thời **xoá `package-lock.json` lần hai**; merge `--no-commit` + khôi phục lockfile. `origin/main` đã **đỏ sẵn** vì 3/6 thế cờ trái luật (hai Tướng đối mặt ở `ct-pz-1`; Pháo hai ngòi ở `ct-pz-2`; Xe bị Sĩ nhà chặn ở `ct-pz-3`) ⇒ `legalMoves = []`, bé không đi được nước nào. Sửa dữ liệu: Tướng Đỏ `b[9][4]`→`b[9][3]`, Sĩ Đen `b[1][4]`→`b[1][3]` và `b[1][3]`→`b[1][4]`, cập nhật hint `ct-pz-2` | `tests/cotuong-engine.test.ts` 18/18; `npm run verify` **EXIT=0**: 71 file / **1035 test**, main chunk `index-Gnw1Zwiz.js` **531.2 kB PASS**; `qa/games.mjs` + `qa/tier6-ladder-evidence.mjs` + `npm run qa:smoke` đều `QA PASS` |
| T26 luyện thế cờ tướng | Chấm nước đi bằng engine (`inCheck(after,'black') && allLegalMoves(after,'black').length === 0`), lưu thế đã giải (`kho_bau_cotuong_puzzles`, thưởng 25 XP một lần), gợi ý + phản hồi "chưa chiếu", 6 tab thế cờ ≥ 44 px | `tests/t26-cotuong-puzzles.test.ts`; `node qa/run-one.mjs qa/cotuong-puzzles.mjs` → `QA PASS — 5 step(s), 0 errors` (đi sai báo "Nước này chưa chiếu Tướng Đen", giải `ct-pz-1`/`ct-pz-2` → `2/6 thế`, reload còn 2 huy hiệu đã giải, 0 tràn, ô bấm ≥ 44 px) |
| T27 học hấp dẫn hơn | Chuỗi đúng liên tiếp + âm thanh combo + confetti mốc 3/5, đồng hồ đếm và đứng yên ở màn kết quả, xếp hạng 3 sao theo tỉ lệ đúng, danh sách câu sai + nút "Ôn lại N câu"; header 2 hàng để nút X không bị đẩy khỏi màn 390 px; màn kết quả cuộn từ đầu (bỏ `autoFocus` từng tự cuộn xuống đáy, che hàng sao) | `tests/t27-lesson-engagement.test.ts`; `node qa/run-one.mjs qa/lesson-engagement.mjs` → `QA PASS — 3 step(s), 0 errors` (lượt 1: 2/11 → 1 sao, 9 câu sai; ôn lại 9/9 → 3 sao, `maxCombo 9`, hàng sao trong màn hình, `overflowPx: 0`); `npm run verify` **EXIT=0**: 73 file / **1052 test**, main chunk `index-B0-nRwl6.js` **533.6 kB PASS** |
| Vòng sửa bug T26/T27 | Soát lại sau bằng chứng trình duyệt, sửa 5 lỗi thật: (1) bàn cờ nhận thao tác khi đang hiện nước chiếu suông ⇒ chặn `status !== 'playing'` + timer trả bàn cờ xoá `selected`/`legal`; (2) sau nước chiếu suông hiện lời nhắc "Nước này chưa chiếu" ⇒ tách `missNotice`, tắt khi trả bàn cờ; (3) overlay giải lại vẫn ghi "+25 XP" ⇒ hiện "Đã giải trước đó — ôn lại không thêm XP"; (4) đổi độ khó ở màn kết quả chỉ reset điểm ⇒ gom mọi reset vào `startRun()` dùng chung cho học lại/ôn câu sai/đổi độ khó; (5) lượt ôn câu sai hiện khối "+Sao/+XP/+1 Vé" sai ⇒ khối `lesson-review-reward` nói đúng "+5 XP" | `tests/t26-cotuong-puzzles.test.ts` 12 test + `tests/t27-lesson-engagement.test.ts` 11 test + `tests/lesson-completion.test.ts` kiểm `startRun()`; `node qa/run-one.mjs qa/cotuong-puzzles.mjs` → `QA PASS — 7 step(s), 0 errors` (`afterRevert.feedback: false`, giải lại `xpBeforeReplay 50 = xpAfterReplay 50`); `node qa/run-one.mjs qa/lesson-engagement.mjs` → `QA PASS — 5 step(s), 0 errors` (khối ôn "+5 XP", đổi độ khó `starsGone: 0`); `npm run verify` **EXIT=0**: 73 file / **1058 test**, main chunk `index-Z0QUlAuF.js` **533.8 kB PASS** |
| Audit UI T28 | Sửa lỗi UI bé báo bằng ảnh: (1) lưới bàn cờ tướng vẽ từ (0,0) trong khi quân đặt theo lề M ⇒ quân biên lệch gần một ô, hàng/cột cuối ra ngoài khung; bọc lưới/cung/dấu mốc trong `<g transform="translate(M M)">`; (2) máy gắp sticker xoay 8 emoji quanh tâm bán kính 60 px ⇒ dồn cục giữa kính và không vẽ lại khi quay: xếp 10 sticker theo % khung, thêm `gacha-jumble`, đưa nút "Gắp Ngay" xuống dưới máy thay vì đè lên sticker; (3) 9 lớp `animate-*` dùng trong UI nhưng chưa từng khai báo CSS (modal `fade-in`/`slide-down`/`pop-in`, `pulse-slow`, `float-slow`, `bounce-subtle`, `spin-slow`, `pulse-ring`, `claw-drop`) ⇒ modal và máy gắp đứng im | `tests/t28-ui-polish.test.ts` 3 test (quét mọi `animate-*` trong `src/**/*.tsx` phải có khai báo trong `index.css`); `node qa/run-one.mjs qa/cotuong-puzzles.mjs` → `QA PASS — 8 step(s), 0 errors` (`gridAlignment`: 10 đường ngang + 16 dọc khớp `translate(0.95 0.95)`); `node qa/run-one.mjs qa/gacha-machine.mjs` → `QA PASS — 4 step(s), 0 errors` (`spreadXRatio: 68`, `outside: 0`, `claw: claw-drop`, `pile: gacha-jumble`, vé 5 → 4); `qa/golden-path.mjs` + `qa/games.mjs` + `qa/lesson-engagement.mjs` PASS; `npm run verify` **EXIT=0**: 74 file / **1062 test**, main chunk `index-PGWPiTgJ.js` **533.8 kB PASS** |
| Làm mượt luồng học T29 | Bé/người lớn báo "cảm giác học chưa mượt". Đo bằng probe rồi sửa 5 lỗi thật trong `LessonPlayerModal`: (1) thanh "Kiểm tra câu trả lời" nằm **trong** vùng cuộn ⇒ cuộn xuống là mất nút, phải cuộn ngược lên mới bấm được ⇒ tách thành sibling `shrink-0` dưới scroller; (2) vị trí cuộn dính từ câu trước ⇒ câu mới mở ở giữa, đọc đề bị hụt ⇒ reset `scrollTop = 0` khi đổi câu, khi `startRun()`, và cuộn lên đầu khi "Thử lại câu này"; (3) banner "Chuỗi N câu đúng" chèn thêm một hàng ⇒ toàn bộ đề nhảy xuống ⇒ đặt vào slot cố định `h-6` (`data-testid="lesson-combo-slot"`) luôn chiếm chỗ; (4) câu trả lời xong mà phản hồi đúng/sai nằm dưới đáy vùng cuộn ⇒ `feedbackRef.scrollIntoView({ block: 'nearest' })`; (5) `setInterval` đặt state trong modal ⇒ cả cây render lại mỗi giây ⇒ tách `<LessonClock>` riêng, `elapsedSec` chỉ tính một lần lúc kết thúc | `tests/t29-lesson-smooth.test.ts` 6 test; `node qa/run-one.mjs qa/lesson-smooth.mjs` → `QA PASS — 8 step(s), 0 errors` (`barInsideScroller: false`, thanh đứng yên `barTop 714..766` khi cuộn, `scrollTop: 0` sau mỗi "Câu tiếp theo", `comboShift: 0`, `barShift: 0`, `comboSlotHeight: 24`, `feedbackVisible: true`, `overflowPx: 0`); `qa/lesson-engagement.mjs` + `qa/golden-path.mjs` vẫn PASS; `npm run verify` **EXIT=0**: 75 file / **1068 test**, main chunk `index-AUAPmuH2.js` **533.8 kB PASS** |

**Hệ quả chưa đóng:** EP-G (G1…G6) — cloud sync chưa test với project thật, chưa có UI xoá
dữ liệu cloud, WebGL chưa có fallback, `@types/three` sai chỗ, 4 lỗ hổng npm chưa đọc.

---

## III. Tương lai — Epic và task

### 3.0 Definition of Ready (một task chỉ được bắt đầu khi đủ 5)

1. Có ID + thuộc 1 WP.
2. DoD viết thành **lệnh** hoặc **bước bấm** (không dùng "làm cho đẹp hơn").
3. Nói rõ có đụng bất biến nào (`AGENTS.md` §2) hay không.
4. Không phụ thuộc task chưa xong khác (nếu phụ thuộc → ghi rõ `blockedBy`).
5. Có ô "không được làm" để khoá phạm vi (chống scope creep).

### 3.1 EP-A — Hoàn thiện nội dung (khối lượng lớn nhất còn lại)

| ID | Task | WP | DoD (đo được) | Độ lớn | Phụ thuộc |
|---|---|---|---|---|---|
| A1 | Thu thập 7 nhóm tài liệu Kid's Box đã xác minh (`KIDBOX_REQUIRED_ARTIFACTS`) | WP-07 | `KIDBOX_MAPPED_UNITS.length > 0` và mỗi unit có `source` + `license` chỉ rõ; `tests/kidbox-curriculum.test.ts` xanh; **không** bịa tên unit | XL | người cung cấp nguồn |
| A2 | Validator cho nội dung Kid's Box đã nhập | WP-07 | `kidBoxValidator` chạy trên toàn bộ unit nhập; 0 lỗi; duplicate/near-duplicate = 0; test khoá | M | A1 |
| A3 | Audit track Kid's Box với trẻ thật | WP-07 | 3 bé × 3 phiên, mỗi phiên ghi: bước nào bé tự làm được, từ nào bé không phát âm/nhận diện được; kết luận vào `docs/ENGLISH_KIDBOX_TEST_REPORT.md` | L | A1, A2 |
| A4 | Rà câu thi theo chương trình mới (TOán 0–100, Em & Cuộc sống) | WP-06 | `assembleExam` mọi blueprint 16/16 `shortfall = 0` sau khi thêm chủ đề; phân phối 7 dạng vẫn trong band policy; `tests/exam-fidelity.test.ts` xanh | M | — |
| A5 | Phủ kỹ năng còn mỏng trong bank | WP-06 | mỗi `skillId` trong 26 kỹ năng ≥ 8 câu; in bảng phân phối ra `docs/P27_QUESTION_COVERAGE.md` | M | — |
| A6 | Kiểm chứng dấu Thanh/Toán chuẩn GDPT toàn kho | WP-02 | `math-typography` + `vietnamese-rhymes` mở rộng: 0 cảnh báo; U+2212 cho dấu trừ | S | — |

**Không được làm trong EP-A:** tự viết nội dung giáo trình Kid's Box khi chưa có nguồn
(ADR-15, FR-N04); dùng AI chấm điểm (ADR-04).

### 3.2 EP-B — Nợ kỹ thuật đã ghi nhận

| ID | Task | WP | DoD | Độ lớn | Phụ thuộc |
|---|---|---|---|---|---|
| B1 | Đưa `kho_bau_ioe_store` về `STORAGE_KEYS` + đọc/ghi qua `readJSONObject`/`writeJSON` | WP-09 | `grep -rn "localStorage" src/components/` trả 0 (hiện **đúng 1** file phạm: `EnglishIoeScreen.tsx`, 2 lời gọi); test đếm đủ **17 key** trong registry; tiến độ máy cũ vẫn đọc được (migration no-op + sanitizer) | S | — |
| B2 | Giảm entry chunk về ≤ 450 kB | WP-12 | `npm run check:budget` in `≤ 450 kB PASS (goal)`; nêu rõ đã tách gì trong `vite.config.ts` | M | — |
| B3 | Error boundary toàn app + recovery khi store lỗi | WP-01 | thêm boundary; probe giả lập `localStorage` ném → app hiện màn "cần phụ huynh giúp", không trang trắng | M | — |
| B4 | `docs/specs/RTM.md` thành gate tự động | WP-12 | script so khớp: mỗi FR trong SRS có ≥ 1 dòng RTM và mỗi file `tests/*.test.ts` xuất hiện ở RTM; chạy trong `verify:quick` | M | — |
| B5 | Dọn `bun.lock` và dependency không dùng | WP-12 | `npm ls --depth=0` sạch; ghi quyết định vào `CHANGELOG.md`; **không** xoá nếu chưa hỏi người giữ repo | S | — |
| B6 | Chiến lược quota `localStorage` đầy (> ~5 MB) | WP-09 | test giả lập quota exceeded → app vẫn chạy, báo phụ huynh, không mất dữ liệu mới nhất | M | B3 |

### 3.3 EP-C — Nâng chất lượng kiểm chứng

| ID | Task | WP | DoD | Độ lớn | Phụ thuộc |
|---|---|---|---|---|---|
| C1 | Visual regression có baseline ảnh | WP-12 | `qa/` sinh screenshot 6 viewport × 5 màn chính; diff > 0.5% → đỏ; baseline cất ngoài VCS hoặc nén | L | — |
| C2 | Sửa selector `qa/games.mjs` (hiện `SKIPPED` vì selector cũ) | WP-12 | probe chạy đủ 31/31 game, không skip; kết quả in trong PR | S | — |
| C3 | Probe audio trên thiết bị thật | WP-10 | `qa/audio.mjs` chạy trên Android + iOS thật, ghi log thiết bị/kết quả vào `docs/FINAL_QA.md` | M | — |
| C4 | Coverage gate cho service logic | WP-12 | `vitest --coverage` ≥ 80% dòng cho `src/services/*` (UI không tính); số liệu in ra CI | L | — |
| C5 | Policy mutation check | WP-12 | test đổi từng ngưỡng trong `policy.ts` ⇒ hành vi đổi (đã có 1 số test, cần phủ đủ 17 khối) | M | — |

### 3.4 EP-D — Phụ huynh & giáo viên

| ID | Task | WP | DoD | Độ lớn | Phụ thuộc |
|---|---|---|---|---|---|
| D1 | Báo cáo in được (PDF qua in trình duyệt) | WP-08 | một trang A4 tóm tắt tuần, in ra không vỡ; Parent Gate vẫn chắn | M | — |
| D2 | Hồ sơ nhiều bé trên cùng máy | WP-01/09 | chọn bé ở Home; mỗi bé một namespace key; migration `P43-v1` + test; bé A không thấy dữ liệu bé B | XL | B1 |
| D3 | Gói "Ôn ở nhà" cho unit thật | WP-07 | phụ huynh chọn Unit → tải gói `.json` + `.md`; hoạt động khi `KIDBOX_MAPPED_UNITS > 0` | M | A1 |

### 3.5 EP-E — Phát hành

| ID | Task | WP | DoD | Độ lớn | Phụ thuộc |
|---|---|---|---|---|---|
| E1 | Bump `1.0.0` → `1.1.0`, chốt `CHANGELOG.md` mục release | WP-12 | mục version có thật, tag `v1.1.0`, workflow `04-release` tạo Release + zip `dist/` | S | tất cả epic khác |
| E2 | Chạy bộ QA đầy đủ trên bản build | WP-12 | 25 probe, mỗi probe in `QA PASS`; dán output `golden-path` (`errors[]`, `failedAt`) vào Release | M | E1 |
| E3 | Kiểm tra cài đặt PWA trên Android/iOS | WP-10 | cài được, icon đúng, offline hoạt động, trở lại foreground không mất phiên (`qa/mobile.mjs` + thiết bị) | M | E2 |
| E4 | (tuỳ chọn) Capacitor APK thật | WP-10 | build APK ký, chạy trên 1 máy thật; roadmap nằm trong prompt đã gỡ — `git show "99edd29:docs/KHO BÁU TRI THỨC — P34 FULL ANDROID APP ROADMAP  CAPACITOR → REAL-DEVICE APK.md"`; **cần người quyết** vì thêm dependency | XL | E3 |

### 3.6 EP-F — An toàn & quyền riêng trẻ em

| ID | Task | WP | DoD | Độ lớn | Phụ thuộc |
|---|---|---|---|---|---|
| F1 | Rà lời nhắn/label toàn app theo danh sách cấm | WP-08 | `contentSafety` mở rộng; grep 0 từ tiêu cực trong string UI dành cho bé; test đỏ nếu thêm từ cấm | M | — |
| F2 | Kiểm tra mọi đường ra ngoài của dữ liệu | WP-09/10 | bảng audit: key → đi đâu; analytics payload trắng; `progress/` gitignored; kết luận ghi `docs/SAFETY_PRIVACY.md` | S | — |
| F3 | Chính sách xoá dữ liệu cho phụ huynh | WP-09 | "Xoá toàn bộ" xoá đủ 17 key + cache app; xác nhận 2 bước; test đếm key bị xoá | M | B1 |

### 3.7 EP-G — Nợ phát sinh từ merge 2026-10-30 (Firebase cloud-sync + cờ vua WebGL)

| ID | Task | WP | DoD | Độ lớn | Phụ thuộc |
|---|---|---|---|---|---|
| G1 | Smoke test cloud sync với project Firebase thật | WP-12/10 | đăng nhập Google trên `dist/` thật → banner hiển thị `synced`; tắt mạng → `error`, app vẫn học; hai máy cùng tài khoản ⇒ sao/XP lấy max, không máy nào mất tiến độ; kết quả ghi `docs/FINAL_QA.md` (không dán dữ liệu thật của bé) | M | — |
| G2 | UI xoá dữ liệu trên cloud cho phụ huynh | WP-08/09 | nút "Xoá hồ sơ đám mây" sau Parent Gate + xác nhận 2 bước; xoá xong `users/{uid}` sạch; test trạng thái | M | G1, F3 |
| G3 | Fallback khi WebGL context thất bại ở `Chess3DCanvas` | WP-04 | giả lập `WebGLRenderer` ném → hiện bàn 2D/CSS + thông báo cho phụ huynh; không trang trắng; test + probe | M | — |
| G4 | Chuyển `@types/three` sang `devDependencies` | WP-12 | `package.json` + `package-lock.json` đổi; `npm run verify` xanh; kiểm kê deps trong specs sửa theo (runtime = 7) | S | — |
| G5 | `npm audit` có chủ đích 4 lỗ hổng severity cao | WP-12 | bảng advisory → quyết định sửa/bỏ qua kèm lý do; không downgrade im lặng; output dán vào PR | M | — |
| G6 | Sửa `AGENTS.md` §2 + `docs/SDLC.md` theo thực tế mới | WP-12 | bất biến "không WebGL" thu hẹp còn "không WebGL ngoài màn cờ vua lazy"; cloud-sync ghi là tuỳ chọn; `verify` xanh | S | — |

### 3.8 Backlog nhỏ (S) ghi để không quên

| ID | Việc | Gate |
|---|---|---|
| K-01 | **T03B — component Mascot Gấu Bút Chì (SVG) + avatar mặc đồ**: task P42 duy nhất còn nợ, prompt giữ lại ở `docs/opencode/queue/05_T03B_linh_vat_minh_hoa.md`; T03A/T04/T06 đang dùng emoji thay thế | `npm run verify` + screenshot 390 px | 
| K-02 | `AGENTS.md` §0 slot "Công cụ MCP" đã có — thêm slot "Bộ tài liệu specs" | docs |
| K-03 | Số liệu kiểm kê trong specs (31 game / 475 câu / 75 file test / 1068 test / 533.8 kB / 8 deps — đo 2026-10-31 sau vòng sửa bug T26/T27, audit UI T28 và làm mượt luồng học T29) cần refresh mỗi lần `verify` | `kbt-docs → project_state` |
| K-04 | `qa/p38-browser-probe.cjs` (`.cjs` duy nhất) — chuyển `.mjs` cho đồng bộ | QA |

---

## IV. Milestone

| M | Tên | Điều kiện thoát (đo được) |
|---|---|---|
| **M1** | Nợ kỹ thuật đóng | B1 + B2 + B4 xanh; `npm run verify` nguyên văn output; RTM 0 lỗ hổng |
| **M2** | Kiểm chứng tự động mạnh hơn | C2 + C4 + C5 xanh; CI 3 workflow không skip |
| **M3** | Kid's Box dùng được thật | A1 + A2 + A3 xong, `KIDBOX_MAPPED_UNITS > 0`, audit trẻ em có kết luận |
| **M4** | Phát hành 1.1.0 | E1 + E2 + E3; D2 **không** bắt buộc (chặn bởi XL) |

**Thứ tự khuyến nghị:** M1 → M2 → M4 → M3. Lý do: không nên mở track nội dung mới (M3,
cần nguồn từ người dùng) trước khi nợ kỹ thuật và gate tự động xong; phát hành sớm để
người dùng thật cho tín hiệu BG-01 mà app chưa đo được (ADR-01).

---

## V. Rủi ro lịch trình

| Rủi ro | Xác suất | Xử lý |
|---|---|---|
| Nguồn Kid's Box không có → A1/A2/A3/D3 treo | Cao | EP-B/C/E vẫn chạy độc lập; app hiển thị đúng yêu cầu nguồn (FR-N04), không bịa |
| Thêm nội dung làm phình entry, chạm trần 600 kB | Trung bình | B2 + C1; mọi bổ sung lớn phải kèm số đo `check:budget` trước/sau |
| Probe QA đỏ do timing làm loãng tín hiệu | Trung bình | C2; quy tắc "chạy lại 1 lần + dán `errors[]`/`failedAt`" (`AGENTS.md` §1.3) |
| Nhiều phiên/lanh sửa chung working tree | Trung bình | `.ai/CURRENT.md` + rule không đụng lane khác; PR theo `feature/<issue>-<slug>` |
| Người dùng kỳ vọng đồng bộ đám mây | Trung bình | ADR-01 giải thích bằng chứng + lợi ích; chỉ đổi khi có ADR mới |

---

## VI. Cách dùng tài liệu này

1. Một task = một Issue (template `.github/ISSUE_TEMPLATE/feature_request.yml`), dán nguyên
   hàng DoD sang Issue.
2. Nhánh `feature/<số-issue>-<slug>`; commit Conventional Commits; PR theo checklist.
3. xong → thêm dòng vào `CHANGELOG.md` `[Unreleased]` + cập nhật dòng RTM tương ứng.
4. Task lịch sử (P25→P43) **không** sửa; nếu phát hiện sai, thêm ghi chú "đính chính".
