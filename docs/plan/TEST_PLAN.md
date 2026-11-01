# TEST_PLAN — Kế hoạch kiểm thử từ đầu đến cuối
## KHO BÁU TRI THỨC — LỚP 1 (mã tài liệu KBT-TEST-1.0)

> Tài liệu này quy định **kiểm thử cái gì, bằng lớp nào, chạy lệnh nào, và khi nào được
> coi là xanh**. Danh sách yêu cầu cần kiểm: [`SRS.md`](../specs/SRS.md); ánh xạ
> yêu cầu ↔ test ↔ probe ↔ gate: [`RTM.md`](../specs/RTM.md); quy trình: [`../SDLC.md`](../SDLC.md).
>
> **Số liệu chốt 2026-11-01** (đo lại sau vòng sửa bug T26 cờ tướng, T27 học hấp dẫn hơn, audit UI T28, làm mượt luồng học T29, độ dày quân cờ T30, vòng soát bug T31, T32 (khung trò chơi), T33 (hẹn giờ phản hồi) và T34 (bộ cờ vua giống cờ gỗ) và T35 (đường kẻ ô cờ)): 80 file test / 1145 test ·
> 28 probe (27 `.mjs` + 1 `.cjs`) · 4 workflow CI · 3 git hook · main chunk 534 kB / trần
> 600 kB; vendor ngoài entry: `three-vendor` 572.6 kB, `firebase-vendor` 537.9 kB.

---

## 1. Triết lý kiểm thử của dự án này

1. **Bằng chứng là output lệnh, không phải mô tả.** `AGENTS.md` §1.1: không nói "xong"
   khi chưa chạy cổng. Số liệu từ MCP (`mcp/`) chỉ là *manh mối* — muốn "xanh" phải dán
   output `npm run verify` hoặc `QA PASS` thật.
2. **Máy không thay con người.** Có đúng hai việc máy không làm được: (a) đọc to câu hỏi
   xem bé 6 tuổi có hiểu không, (b) nhìn bàn cờ 3D có dễ chịu không. Hai việc đó nằm ở
   §11, không nằm ở test tự động.
3. **Test không phụ thuộc may rủi.** Dữ liệu đề thi/game deterministic theo `(tier, seed)`
   ⇒ cùng seed là cùng đề ⇒ probe so sánh được. Cấm `Math.random`/`Date.now` trong
   builder (`AGENTS.md` §2).
4. **Mỗi lớp chỉ làm việc của mình.** Unit test chứng minh *logic*; probe chứng minh
   *tính năng chạy trên build thật*; thiết bị thật chứng minh *trải nghiệm*; không lớp nào
   được gánh việc của lớp khác.

---

## 2. Năm lớp kiểm thử

```
Lớp 5  Người lớn đọc to + beta trẻ thật          → §11   (2 phiên/milestone, không tự động)
Lớp 4  Thiết bị thật: Android/iOS, offline, audio → §7    (qa/mobile.mjs + tay người)
Lớp 3  Probe trình duyệt trên dist/ (28 probe)    → §6    (npm run qa:smoke)
Lớp 2  Build + ngân sách + precache               → §9    (npm run build && npm run check:budget)
Lớp 1  Unit/integration Vitest (1145 test)        → §5    (npm run test:ci)
────────────────────────────────────────────────────────────────────────────────────────────
              npm run verify = typecheck + Lớp 1 + Lớp 2   ← cổng duy nhất
```

**Thứ tự bắt buộc khi kiểm:** Lớp 1 → 2 → 3 → 4 → 5. Không nhảy lớp: probe trên `dist/` mà
`dist/` chưa build từ code xanh thì kết quả vô nghĩa.

---

## 3. Ma trận "thay đổi gì → phải chạy gì"

| Vùng thay đổi | Bắt buộc chạy | Cần thêm |
|---|---|---|
| `src/services/**` (logic) | `npm run verify` | probe liên quan nếu logic ra UI (`qa/decision-engine.mjs`, `qa/question-types.mjs`) |
| `src/data/**` (nội dung) | `npm run verify` | `qa/p41-curriculum-quality.mjs`; nếu đổi kho thi → `qa/question-types.mjs` |
| Thêm/đổi trò chơi | `npm run verify` | `npm run qa:games`; tick đủ 4 nơi đăng ký (`docs/SDLC.md` §3.1) |
| `src/components/**` (UI) | `npm run verify` | `npm run qa:smoke` **hoặc** probe riêng + screenshot |
| Layout/responsive | `npm run verify` | `qa/responsive-a11y.mjs` + `qa/mobile.mjs` + `qa/games.mjs` @195 px |
| `public/sw.js`, `scripts/sw-precache.mjs` | `npm run verify` | `qa/offline-pwa.mjs` (bắt buộc, gồm cache-wipe survival) |
| `src/services/storage.ts`, schema | `npm run verify` | test migration mới (mọi bump phải có hàm migrate) |
| `vite.config.ts`, chunking | `npm run verify` | `npm run check:budget` trước/sau, dán hai số đo vào PR |
| `mcp/**` | `npm run verify` | `node mcp/devclient.mjs <server> <tool>` cho tool đổi schema |
| Tài liệu `docs/**` | — (không chặn) | cập nhật RTM nếu thêm/sửa yêu cầu |

---

## 4. Yêu cầu kiểm thử (test basis)

| Nguồn | Dùng làm cơ sở | Ghi chú |
|---|---|---|
| `SRS.md` §4 (88 FR) | mỗi FR phải có ≥ 1 ô Test **hoặc** Probe | FR không chứng minh được → gắn "CHƯA ĐẠT", không xoá |
| `SRS.md` §5 (25 NFR) | ngưỡng đo được (kB, viewport, quota, từ cấm) | NFR chỉ đạt khi **đo**, không đạt vì "hợp lý" |
| `SRS.md` §6 (17 DC) | schema + migration + sanitizer | xem §8 |
| `BRD.md` §8 (Business DoD) | tiêu chí phát hành | xem §10 |
| `docs/AUDIT_REPORT.md` | hồi quy: lỗi từng phát hiện phải có test khoá | 3 lỗi P0 của P43 đã có test (§12) |

---

## 5. Lớp 1 — Unit & integration (Vitest)

**Chạy:** `npm run test:ci` (bản CI). **Không** dùng `npm test` trong tự động hoá vì
`posttest` gọi `scripts/audit-snapshot.mjs` ghi `docs/audit-state.json` và nối
`docs/AUDIT_REPORT.md` (`AGENTS.md` §1.2).

**Bố trí 77 file theo vai trò:**

| Nhóm | File | Kiểm gì |
|---|---|---|
| Engine học tập | `answerCheck`, `learning-engine`, `session-composer`, `adaptive-difficulty`, `decision-engine`, `decision-engine-storage`, `personas-and-learning-os`, `lesson-completion`, `fatigue-reset` | chấm đúng/sai, bằng chứng idempotent, NBA deterministic, profile phiên, reset fatigue |
| Thi thử | `competition-bank`, `competition-engine`, `competition-p36`, `exam-fidelity`, `competition-readiness` | size bank, assemble + `shortfall`, 7 dạng chấm được, seed ổn định, đáp án không trùng, readiness |
| Nội dung | `content-quality`, `content-validator-t02c`, `curriculum-quality-p41`, `vietnamese-curriculum`, `vietnamese-rhymes`, `math-curriculum`, `math-t11c`, `math-typography`, `english-curriculum`, `life-curriculum`, `t12b-english-units`, `t02d-content-fixes` | số lượng chủ đề/bài/câu, dấu chuẩn GDPT, U+2212, không mojibake, không near-duplicate |
| Trò chơi | `games-all`, `games-content`, `game-content`, `game-rewards`, `t08-games-hub`, `t15-viet-games`, `t16-math-games`, `t16-math-contract`, `t17a-english-games`, `t17b-coding`, `t17b-scientist`, `t21-fun-games`, `t25-difficulty-ladder` | builder deterministic 6 bậc, thưởng 1 lần/vòng, hợp đồng câu hỏi, BFS màn lập trình, **bậc thang độ khó toàn catalog** (trần số 0–100, số phương án, trần nhóm Puzzle, cấm `Math.random`/`Date.now`) |
| Luyện đọc | `reading-fluency` | 5 bậc, công thức chỉ số, parent rating không đè điểm đo |
| Tiếng Anh | `kidbox-curriculum`, `kidbox-activities`, `kidbox-learning-os`, `kidbox-bridge-practice`, `english-ioe`, `p32-english-mastery`, `voice-persona`, `english-curriculum` | **0 unit bịa** + 7 nhóm cần nguồn, en-GB fallback, mastery key riêng |
| Động lực | `t18a-motivation`, `t01-achievements`, `praise-engine`, `t14c-logic`, `t14c-storage`, `t20a-levelup-hooks` | sticker/quest/streak/level, lời khen không từ cấm, hooks order |
| Persistence | `t14c-storage`, `date-utils`, `parent-and-demo`, `firebase-auth-sync` | sanitize, `isRealDateKey`, export/import, **trạng thái offline khi chưa đăng nhập**, hợp nhất `Math.max`/`Set` union (mock Firestore) |
| Âm thanh & giọng đọc | `question-audio-routing`, `voice-persona`, `t24-speech-math-operators` | nút "Đọc câu hỏi" luôn lấy canonical text (không rò rỉ đáp án/option/giải thích), persona + fallback en-GB, **phép tính `+ − =` đọc thành lời** mà không đổi chữ hiển thị |
| Hệ thống | `bundle-budget`, `pwa`, `sw-precache`, `mobile-layout`, `t02c-startup-split`, `p41-font-encoding`, `t31-bug-hunt-fixes` | ngân sách chunk, precache, layout, tách chunk, font/dấu, **hợp đồng tĩnh của 5 lỗi T31 + 7 probe đã sửa** |
| Cờ | `cotuong-engine`, `chess-3d`, `t30-cotuong-piece-depth` | luật (mã/tượng/pháo/tốt/tướng đối mặt/tự bỏ chiếu), node budget, `applyMove`; mesh 12 quân có shadow, bàn 64 ô + hitbox, marker nước đi/chiếu, nước mở đầu hợp lệ với engine; **độ nổi của quân cờ tướng** (bóng tiếp đất tràn ra ngoài đĩa, thành quân thò dưới mặt quân, thứ tự 3 lớp) |
| Tooling | `t23-mcp-servers` | 5 server tồn tại, `node --check`, 0 import ngoài, `progress/` gitignored, 4 danh sách đăng ký khớp |

**Quy tắc viết test (bắt buộc):**

1. Tên file `tests/t<NN>-<chủ đề>.test.ts` hoặc `<chủ-đề>.test.ts`; hành vi mới ⇒ test mới,
   cùng PR.
2. Test **engine thuần** không import React. Test component dùng `.tsx` (tiền lệ
   `math-t11c.test.tsx`, `t20a-levelup-hooks.test.tsx`).
3. Không mock `localStorage` nếu đang test persistence — dùng storage thật trong
   `beforeEach` reset (tiền lệ `decision-engine-storage.test.ts`).
4. Không assertion kiểu `length ≥ N` thay cho kiểm hành vi. Các ngưỡng `≥ 45`/`≥ 30` hiện có
   là **sàn chống hồi quy**, phải đi kèm test hành vi thật (`tests/exam-fidelity.test.ts`).
5. Mọi ngưỡng nghiệp vụ khi test phải đọc từ `src/config/policy.ts`, không hard-code con số
   trùng lặp.

**Coverage (mục tiêu, chưa phải gate):** ≥ 80% dòng cho `src/services/**`; UI không tính.
Task hiện thực: `TASK_PLAN.md` C4.

---

## 6. Lớp 3 — Probe trình duyệt (Playwright)

**Runner:** `node qa/run-one.mjs <probe>` — không build gì thêm, boot `vite preview`
(cổng `PORT`, mặc định 4173), nạp Chromium theo thứ tự `PW_CHROME` → cache máy dev →
registry của Playwright, cộng `--no-sandbox` khi `CI` được set.
**Hợp đồng exit code:** in `QA PASS`/`QA FAIL` và **chỉ** exit khác 0 khi probe ghi `errors[]`
hoặc tự khai `ok: false` (nhiều probe không set `ok` ⇒ thiếu `ok` **không** phải lỗi).

**Danh mục 28 probe:**

| Probe | Kịch bản | Tiêu chí xanh | Chạy khi |
|---|---|---|---|
| `golden-path.mjs` | home → bé mới → bài học → luyện đọc → thi → xem lại → phụ huynh → reload; 25 log point | 0 `errors[]`, `failedAt` trống, XP/`evidence`/`readingStore` tăng thật | mọi PR đổi UI, bắt buộc trước release |
| `responsive-a11y.mjs` | 6 viewport: 360×800, 390×844, 768×1024, 1024×768, 1280×800, 1440×900 | 0 tràn ngang, role/label đạt, reduced motion tôn trọng | đổi layout |
| `mobile.mjs` | 4 viewport 360/375/390/412 + xoay + background/resume | không nút nào < ngưỡng chạm, không mất phiên khi resume | đổi mobile |
| `mobile-golden.mjs` | 7 chặng @390 px và @195 px (zoom 200%), so XP | XP không đổi giữa hai mức zoom; 0 tràn | đổi mobile/game |
| `games.mjs` | 31 game mount/đóng + thưởng chỉ 1 lần/vòng; cả @195 px | 31/31; overflow ≤ 2 px; không farming | thêm/đổi game |
| `focus.mjs` | focus trap + khôi phục focus mọi dialog (kể `ScreenTimeModal`) | focus trở về phần tử mở; ESC đúng ngữ nghĩa | đổi modal |
| `kidbox-focus.mjs` | trap + restore cho activity player Kid's Box | như trên | đổi track Anh |
| `decision-engine.mjs` | NBA hiện trên màn, bấm dẫn tới hoạt động đúng | thẻ NBA đúng action từ engine | đổi decision engine |
| `decision-engine-a11y.mjs` | semantics + focus của vùng NBA | 0 lỗi a11y vùng NBA | đổi UI NBA |
| `lesson-types.mjs` | 8 kiểu câu hỏi bài học, mỗi kiểu trả lời được | không kiểu nào treo/không chấm | đổi LessonPlayer/data |
| `question-types.mjs` | 7 dạng bài thi thật: đủ dạng, mọi dạng trả lời + chấm được | `shortfall = 0`, đáp án vào `errorAnalysis` | đổi kho thi |
| `offline-pwa.mjs` | SW install, precache, tắt mạng vẫn học, icon decode, xoá cache vẫn còn tiến độ | app chạy offline; dữ liệu còn nguyên | đổi SW/PWA |
| `audio.mjs` | trạng thái TTS, chống stacked utterance, cổng autoplay, audio đoạn đọc, **phép tính `+ − =` đọc thành lời** (ghi âm văn bản thật đưa vào `SpeechSynthesisUtterance`, còn ký hiệu thô là FAIL) | không 2 utterance đồng thời | đổi sound/speak |
| `p41-curriculum-quality.mjs` | quét chất lượng nội dung trên build | 0 lỗi nội dung | đổi `src/data/**` |
| `p41-font-visual.mjs` | font/dấu hiển thị không vỡ | glyph đúng, không mojibake | đổi CSS/font |
| `mobile-home.mjs` | màn home trên mobile | phần tử chính đủ lớn, không tràn | đổi Home |
| `t01-hotfix.mjs` | achievements (P42/T01) | rule mở thành tựu đúng | đổi motivation |
| `t01b-fixes.mjs` | header/Esc/back/touch target | như ticket T01B | đổi UI shell |
| `t02-smoke.mjs` | startup split + network sạch | chunk tách đúng, không request ngoài | đổi chunking |
| `tier6-ladder-evidence.mjs` | mở 9 trò Ngôn ngữ/Puzzle ở **Màn 6** @390×844, đếm phương án/thẻ/ô/chấm render trong DOM + 9 screenshot | đúng bậc thang (6 phương án, 24 thẻ, mosaic 6×6, 18 chấm, bàn 8×8), 0 tràn ngang, không có phương án ngoài màn hình mà vùng chơi không cuộn, ô bấm ≥ 44 px | đổi bậc thang độ khó / UI lưới chọn đáp án |
| `cotuong-puzzles.mjs` | mở Cờ Tướng → Luyện thế cờ, đi sai (phải báo "chưa chiếu"), giải 2 thế chiếu bí rồi reload kiểm tiến độ + huy hiệu đã giải | 6 tab thế cờ, tiến độ `1/6 thế` → `2/6 thế`, localStorage `kho_bau_cotuong_puzzles`, sau reload còn 2 thế đã giải, 0 tràn ngang, ô bấm ≥ 44 px | đổi `cotuongPuzzles.ts` / view cờ tướng |
| `lesson-engagement.mjs` | 2 lượt bài học đầu tiên @390×844: lượt 1 chọn sai để ghi lại đáp án đúng, kiểm sao/đồng hồ/danh sách câu sai, bấm "Ôn lại" rồi trả lời đúng từng câu | sao khớp tỉ lệ đúng, đồng hồ đứng yên ở màn kết quả, combo tăng (`data-combo`), lượt ôn 9/9 → 3 sao + 0 câu sai, 0 tràn ngang | đổi `LessonPlayerModal` / `lessonEngagement.ts` |
| `p38-browser-probe.cjs` | hồi quy praise/parity (P38) | 0 lỗi console vùng đã đổi | đổi praise |
| `gacha-machine.mjs` | Máy Gắp @390×844: đo đống sticker trong cửa kính, bấm gắp, xem kết quả + lịch sử | 10 sticker trải ≥ 55% bề ngang kính, không tràn khung, `claw-drop` + `gacha-jumble` chạy khi gắp, trừ 1 vé, lịch sử hiện sticker, 0 tràn ngang | đổi `GachaMachineScreen` / hoạt ảnh UI |
| `lesson-smooth.mjs` | Luồng học @390×844: đo thanh hành động, vị trí cuộn sau mỗi câu, ô combo và phản hồi | thanh "Kiểm tra/Câu tiếp theo" **ngoài** vùng cuộn và luôn thấy, `scrollTop = 0` khi sang câu mới, ô combo cao 24 px nên dải hiện không đẩy đề (shift ≤ 2 px), phản hồi nằm trong tầm nhìn, 0 tràn ngang | đổi `LessonPlayerModal` / combo / đồng hồ |
| `cotuong-depth.mjs` | Độ nổi của quân cờ tướng @900×1100, đo cả chế độ 3D lẫn "Góc 2D": thứ tự vẽ 3 lớp quân so với lưới, đế thò dưới mặt quân, **giải mã PNG** ảnh chụp để so độ sáng nền bàn ngay dưới quân với phía trên | mặt quân vẽ **trên** lưới, `rimBelowFacePx ≥ 2`, nền dưới quân tối hơn nền trên ≥ 8 mức sáng (có bóng tiếp đất), mặt quân sáng ≥ 150 | đổi `src/index.css` khối `.ct-piece*` / `CotuongBoard3D.tsx` |
| `t32-game-replay-evidence.mjs` | Khung trò chơi @390×844 với `?qa`: Đọc Câu Làm Theo - chạm đồ vật rồi chọn lại Màn 1, đếm số ô được đánh dấu "bước hợp lệ" trong 8 lượt ở Màn 4; Đường Đua Thần Tốc Màn 4 - mở lớp phủ "Chọn Màn" giữ 3 giây rồi đóng | lựa chọn dở bị xoá sau khi chơi lại, mỗi lúc đúng 1 bước hợp lệ, đồng hồ đứng yên khi bị che (15s → 15s) và chạy tiếp khi đóng (15s → 12s), nút ✕ đóng lớp phủ có tên truy cập | đổi `GameModalWrapper` / `useGameStage` / `sound.ts` |
| `t33-feedback-timers.mjs` | Hẹn giờ phản hồi @390×844 với `?qa`: Ếch Nhảy Tia Số — bấm đúng rồi bấm sai trong 2,5 s; Lật Thẻ Trí Nhớ — đang hẹn giờ úp thẻ ở Màn 1 thì nhảy sang Màn 4 rồi lật tiếp hai thẻ; Luyện Đọc — bấm "Đọc cả câu" hai lần rồi bấm "Thoát" giữa lúc đọc; Đấu Trường Chính Tả — bấm hai phương án sai cách nhau ~0,5 s; Máy Gắp — bấm gắp rồi về Trang Chủ sau 300 ms | bóng lời khen của lượt mới còn nguyên tới mẫu 2.300 ms, Màn 4 vẫn tính 1 lượt, ô sáng karaoke đi một chiều và `speechSynthesis.speaking` về `false` khi bấm "Thoát", phương án bấm sau vẫn tô đỏ qua mốc 900 ms của lượt trước (đối chứng trên bản lỗi: `red` tụt 1→0 tại 1.104 ms), rời máy gắp giữa vòng quay không mất vé và không bắn confetti trên trang chủ | đổi `GameModalWrapper` / `useRoundFeedbackTimer` / karaoke `ReadingFluencyScreen` / `confetti.ts` / `sound.ts` |

**Chính sách probe đỏ vì timing (đã ghi `AGENTS.md` §1.3):** chạy lại **một** lần;
nếu vẫn đỏ ⇒ là lỗi thật; khi báo cáo phải dán `errors[]` + `failedAt`, không chỉ exit code.
Nợ đã biết: selector `qa/games.mjs` từng khiến probe `SKIPPED` ở một số phiên — khắc phục
ở `TASK_PLAN.md` C2; khi C2 chưa xong, **không** được dùng "games.mjs skip" làm bằng chứng xanh.

**Nợ ghi ngày 2026-11-01 (vòng T32):** `qa/p38-browser-probe.cjs` nằm trong danh mục 28 probe
nhưng `require('puppeteer')` — dependency này **không** có trong `package.json` (và `AGENTS.md`
§1.4 cấm tự thêm), nên probe chết ngay khi chạy: `Cannot find module 'puppeteer'`, exit 1. Nó
không còn là bằng chứng xanh cho vùng praise/parity; muốn dùng lại phải port sang Playwright
(`qa/run-one.mjs`) chứ không thêm puppeteer. Hai probe tự chạy `qa/t02-smoke.mjs` và
`qa/p38-browser-probe.cjs` cũng **không** có `export default` ⇒ gọi qua `node qa/run-one.mjs` sẽ
`RUNNER_ERROR`; chạy trực tiếp `node qa/t02-smoke.mjs` (đã kiểm: `ERRORS: []`, exit 0).

---

## 7. Lớp 4 — Thiết bị thật (không tự động hoá được)

| # | Thiết bị / điều kiện | Kiểm | Kết quả ghi ở đâu |
|---|---|---|---|
| 1 | Android (Chrome), màn 390 px | cài PWA, icon 192/512 + maskable, offline bật máy bay vẫn học, TTS tiếng Việt | `docs/FINAL_QA.md` |
| 2 | iPhone Safari | apple-touch icon, audio cần gesture, không vỡ layout dọc/ngang | `docs/FINAL_QA.md` |
| 3 | Máy yếu / 3G mô phỏng | thời gian tải màn đầu,hoạt ảnh không giật, nước cờ không treo UI | `docs/P31_PERFORMANCE_ACCESSIBILITY.md` |
| 4 | Thiết bị không có giọng `en-GB` | app **nhãn trung thực** thay vì giả vờ đọc chuẩn Anh | `qa/audio.mjs` + tay người |
| 5 | Bé thật (3 bé × 3 phiên, khi có nguồn Kid's Box) | bước nào bé tự làm được; từ nào bé không nhận diện | `docs/ENGLISH_KIDBOX_TEST_REPORT.md` (task A3) |

**Gate:** E3 trong `TASK_PLAN.md` chỉ đạt khi 1, 2, 4 có kết luận bằng mắt người.

---

## 8. Kiểm thử dữ liệu & persistence

| Loại | Ca kiểm | Tự động ở |
|---|---|---|
| Parse hỏng | `localStorage` chứa `{`, `null`, chuỗi, JSON thiếu dấu phẩy ⇒ không ném, trả store mặc định | `tests/decision-engine-storage.test.ts` |
| Field lạ | payload có key không có trong schema ⇒ sanitizer loại bỏ, phần hợp lệ giữ nguyên | `tests/kidbox-learning-os.test.ts`, `tests/t14c-storage.test.ts` |
| Migration | `P28-v1` và `P29-v2` đọc lên `P42-v3`; `schemaVersion` được ghi lại đúng; **không** tính lại mastery | `tests/exam-fidelity.test.ts:84`+, `tests/t18a-motivation.test.ts`, `tests/reading-fluency.test.ts` |
| Ngày ảo | `2026-13-99` bị `isRealDateKey` loại (first-seen / tree-water / review-days) | `tests/t14c-storage.test.ts` |
| Idempotency 5 tầng | evidence id lặp; first-seen; nonce; completion; reward delta | `tests/personas-and-learning-os.test.ts`, `tests/lesson-completion.test.ts`, `tests/game-rewards.test.ts` |
| Cap bộ nhớ | `recentEvidences` ≤ 200; `examResults` có trần | `tests/fatigue-reset.test.ts`, `tests/competition-readiness.test.ts` |
| Quota đầy | **CHƯA có test** — task B6 | — |
| Export/import | file rác bị từ chối, store hiện có không đổi; tên file `kho_bau_tri_thuc_report_*` | `tests/parent-and-demo.test.ts` |

---

## 9. Lớp 2 — Build, ngân sách, precache

| Kiểm | Lệnh | Ngưỡng | Hành vi khi đỏ |
|---|---|---|---|
| Ngân sách entry | `npm run check:budget` | entry ≤ **600 kB** (trần cứng); mục tiêu 450 kB chỉ báo | exit 1 ⇒ `verify` đỏ ⇒ không merge |
| Đúng file entry | script đọc `dist/index.html` để tìm `index-*.js` | không cộng nhầm chunk | — |
| Test dùng chung hàm | `tests/bundle-budget.test.ts` gọi `getBudgetReport()` | gate và test không thể lệch | — |
| Tách chunk | `math-bank`, `english-bank`, `react-vendor`, `three-vendor`, `firebase-vendor` | entry không phình theo nội dung **và** không mang vendor nặng | đo trước/sau, dán 2 số đo; nếu entry nhảy >50 kB sau một thay đổi, nghi ngờ có import thẳng `three`/`firebase` vào `App.tsx` |
| Precache | `tests/sw-precache.test.ts`, `qa/offline-pwa.mjs` | manifest đủ `/assets/*`; placeholder dev ⇒ danh sách rỗng nhưng SW vẫn sống | — |
| Loại trừ | `node_modules`, `.git`, `dist` không vào manifest | — | — |

**Số đo gần nhất (2026-11-01):** `index-CoDA-Iqy.js = 534 kB` → PASS trần, **trên** mục tiêu 450 kB.

---

## 10. Tiêu chí vào / ra (entry & exit criteria)

**Entry của một chu kỳ kiểm thử:** `npm run verify:quick` xanh tại máy; `dist/` được build từ
đúng commit đang test; không có file dữ liệu trẻ trong working tree (`progress/` gitignored).

**Exit cho PR:** `npm run verify` xanh nguyên văn output + probe tương thích §3 xanh +
`CHANGELOG.md` `[Unreleased]` có dòng + RTM được cập nhật nếu yêu đổi.

**Exit cho release (Business DoD — `BRD.md` §8):**

1. `npm run verify` xanh, dán output.
2. `qa/golden-path.mjs` trên build thật: 0 error, `failedAt` trống.
3. Không còn ISSUE P0/P1 mở; nợ ghi `docs/AUDIT_REPORT.md`.
4. Người lớn đã đọc to ≥ 1 bài/môn và xác nhận hợp trẻ 6 tuổi (§11).
5. `CHANGELOG.md` có mục version; tag `vX.Y.Z` → workflow `04-release` tạo Release + zip `dist/`.
6. Không có dữ liệu cá nhân của bé trong repo (`git status` sạch `progress/`).

---

## 11. Kiểm bằng người, không bằng máy (bắt buộc, không được bỏ)

| Việc | Cách làm | Thước đo |
|---|---|---|
| Đọc to nội dung | người lớn đọc ≥ 1 bài mỗi môn + 7 dạng câu thi; câu nào người lớn phải đọc 2 lần ⇒ sửa | biên bản ngắn trong `docs/CONTENT_GUIDE.md` hoặc `docs/AUDIT_REPORT.md` |
| Ngôn ngữ với bé | tìm chỗ nào vô tình mang nhãn tiêu cực ("chậm", "kém", "so với bạn") | 0 điểm; grep + cảm nhận |
| Thẩm mỹ bàn cờ 3D | nhìn thật trên 390 px và 1440 px | không cắt cạnh, nhãn "sông" rõ |
| Nút có đủ to không | bé thật bấm thử (hoặc găng tay để mô phỏng vận động tinh) | không lần nào trượt nút |

---

## 12. Danh sách hồi quy bắt buộc (lỗi từng xảy ra ⇒ test khoá vĩnh viễn)

| Lỗi lịch sử | Fix | Test khoá |
|---|---|---|
| Ordering chấm sai vì đáp án là chuỗi `'a\|b\|c'` | `toPipeText` trong `src/services/answerCheck.ts` | `tests/answerCheck.test.ts` (+4 ca) |
| Fatigue kẹt vĩnh viễn (chỉ `+= 1`) | `resetStaleFatigue()` + `FATIGUE_SESSION_GAP_MS` | `tests/fatigue-reset.test.ts` (7/7) |
| Word Safari không thể thắng (mọi item `isCorrect`) | 1 target + decoy, vị trí hash-seed | `tests/kidbox-learning-os.test.ts` |
| Matching LessonPlayer không bao giờ nối được cặp | sửa `handleMatch` | `tests/lesson-matching.test.ts` |
| `Math.random` làm đề không tái lập | `seededRng`/`shuffleSeeded`/`pickDistinct` | `tests/game-content.test.ts` |
| Đáp án MC luôn nằm ở `options[0]` (exploit "chọn A") | `placeAnswer` round-robin (`P36`) | `tests/competition-p36.test.ts` |
| Đọc số 70 sai ("muoi" → "mươi") | sửa data Toán | `tests/math-t11c.test.tsx`, `tests/math-typography.test.ts` |
| Ngày ảo `2026-13-99` lọt vào first-seen/tree/review | `isRealDateKey` | `tests/t14c-storage.test.ts` |
| `run-one.mjs` exit 1 cả khi probe sạch | chỉ exit khi `errors[]`/`ok:false` | chạy thật `node qa/run-one.mjs qa/t02-smoke.mjs` |
| Cạnh dưới bàn cờ 3D bị cắt, nhãn "sông" nhoè | padding `.ct-scene`, nhãn ra lớp HTML | screenshot + `docs/cotuong.md` |

---

## 13. Phân mức lỗi & phản ứng

| Mức | Định nghĩa | Phản ứng |
|---|---|---|
| **P0** | mất/khoá dữ liệu của bé; app không mở được; nội dung sai kiến thức; bé bị gọi là "dở" | chặn merge; sửa trong phiên; thêm test khoá; ghi `docs/AUDIT_REPORT.md` |
| **P1** | một tính năng chính không đi hết đường (thi, đọc, game); tràn màn hình; TTS không hoạt động | phải xong trước release |
| **P2** | lỗi thẩm mỹ, label chưa nhất quán, hiệu năng chưa tối ưu | đưa backlog `TASK_PLAN.md`, không chặn release |

**Không có "P0 sẽ sửa sau".** Một PR để hở P0 thì CI phải đỏ (đó là lý do tồn tại
`tests/content-quality.test.ts`, `tests/p41-font-encoding.test.ts`, `check:budget`).

---

## 14. Môi trường kiểm thử

| Môi trường | Cách dựng | Dùng cho |
|---|---|---|
| Local | `npm ci` → `npm run verify` → `npm run qa:smoke` | mọi thay đổi |
| CI | `01-quality` (typecheck+`test:ci`) → `02-build-artifact` (build+budget+upload `dist/`) → `03-qa-browser` (download `dist/`, `npx playwright install --with-deps chromium`, `node qa/run-one.mjs ${probe}`) → `04-release` (tag `vX.Y.Z`, `npm run verify`, `scripts/release-notes.mjs`, zip) | gate chính thức |
| Fresh env | `docs/GOOGLE_AI_STUDIO_RUNBOOK.md` (P32 đã chứng minh) | phát hiện phụ thuộc ẩn |
| Offline | tắt mạng + reload, hoặc xoá cache qua DevTools | `qa/offline-pwa.mjs` |

**Lưu ý CI:** dùng `test:ci`, **không** dùng `npm test` (xem §5).

---

## 15. MCP trong kiểm thử: được và không được

| Được | Không được |
|---|---|
| `kbt-quality-gates` liệt kê probe, chạy gate đã whitelist | coi output MCP là bằng chứng phát hành |
| `kbt-curriculum` đếm catalog/chương trình nhanh | bỏ qua `npm run verify` |
| `kbt-game-scaffold` sinh khung game (mặc định **dry-run**) | tự ý ghi file khi chưa duyệt |
| `kbt-progress` đọc file export cục bộ để điều tra | dán dữ liệu thật của bé vào chat/PR (PII) |
| `kbt-docs` tra 171 tài liệu Markdown | tin số liệu MCP khi nó khác output lệnh thật |

---

## 16. Khoảng trống đã biết của chính bộ test (self-assessment)

| # | Khoảng trống | Rủi ro | Xử lý |
|---|---|---|---|
| 1 | Không có visual regression | đổi CSS âm thầm vỡ layout ở màn không nằm trong golden path | task C1 |
| 2 | Không có lab thiết bị thật | §7 phụ thuộc tay người, dễ quên | E3 là gate release |
| 3 | `qa/games.mjs` có thể SKIPPED do selector | 31 game không được chứng minh đủ mỗi PR | task C2 |
| 4 | Chưa có coverage gate cho `src/services/**` | test mới tập trung vào tính năng đang sửa | task C4 |
| 5 | BG-01 (% phiên bé tự học) không đo được | cloud-sync là tuỳ chọn nên vẫn không có aggregate server-side (ADR-01/ADR-16) | chỉ đo được sau E3/M4 bằng báo cáo phụ huynh |
| 8 | Cloud sync mới test bằng mock, chưa có ca nào với project Firebase thật; chưa có test "mất mạng ⇒ app vẫn học được khi đã bật sync" | tính năng đang quảng bá có thể hỏng im lặng trên máy người dùng | thêm smoke manual theo checklist + probe `qa/cloud-sync.mjs` (task EP-G1 trong TASK_PLAN) |
| 9 | Bàn cờ vua WebGL không có ca fallback khi context creation thất bại | máy cấu hình thấp chỉ thấy màn trống | test + fallback CSS (nợ #7 ARCHITECTURE §13) |
| 6 | Quota `localStorage` đầy chưa có ca | mất tiến độ ở máy dùng lâu | task B6 |
| 7 | Không có test đổi ngưỡng ⇒ đổi hành vi cho cả 17 policy block | ngưỡng bị "đóng băng" sai | task C5 |

---

## 17. Phụ lục — bộ lệnh đầy đủ

```bash
npm ci                       # cài đúng theo package-lock.json
npm run hooks:install        # một lần sau khi clone

npm run verify               # cổng duy nhất: typecheck + test:ci + build + check:budget
npm run verify:quick         # typecheck + test:ci (pre-push)
npm run test:ci              # chỉ test (CI dùng cái này)
npm run build
npm run check:budget

npm run qa:smoke             # = node qa/run-one.mjs qa/golden-path.mjs
npm run qa:games
node qa/run-one.mjs qa/responsive-a11y.mjs
node qa/run-one.mjs qa/mobile.mjs
node qa/run-one.mjs qa/mobile-golden.mjs
node qa/run-one.mjs qa/offline-pwa.mjs
node qa/run-one.mjs qa/question-types.mjs
node qa/run-one.mjs qa/lesson-types.mjs
node qa/run-one.mjs qa/decision-engine.mjs
node qa/run-one.mjs qa/audio.mjs
node qa/run-one.mjs qa/focus.mjs
node qa/run-one.mjs qa/kidbox-focus.mjs

# MCP (manh mối, không phải bằng chứng)
node mcp/devclient.mjs mcp/quality-gates.mjs list_qa_probes
```

Cần biến môi trường: `PORT` (preview, mặc định 4173), `PW_CHROME` (đường dẫn Chromium),
`CI` (thêm `--no-sandbox`).
