# SRS — Specialized Requirements Specification
## KHO BÁU TRI THỨC — LỚP 1 (mã tài liệu KBT-SRS-1.0)

> **Kiểu tài liệu:** mềm, lấy khung ISO/IEC/IEEE 29148 (mục 4–6: yêu cầu chức năng, phi chức
> năng, ràng buộc) nhưng mọi yêu cầu đều phải **trỏ được vào file nguồn thật** hoặc
> **một test/probe thật**. Yêu cầu không đo được → không được ghi vào tài liệu này.
>
> **Nguồn sự thật:** `src/` + `tests/` + `qa/`. Tài liệu `docs/PRODUCT_SPEC.md`,
> `docs/MASTER_ROADMAP.md` là mô tả nghiệp vụ; khi chúng lệch code, **code đúng** và
> tài liệu này phải sửa theo code.
>
> **Ngày chốt số liệu:** 2026-10-30 (đo trên working tree **sau khi merge `origin/main`** —
> merge này mang vào Firebase cloud-sync tuỳ chọn và bàn cờ vua 3D bằng three.js; các phép
> đếm chạy bằng Vitest import trực tiếp array nguồn, không đếm bằng grep).

---

## 1. Phạm vi

| Khoản | Nội dung |
|---|---|
| Sản phẩm | PWA học tập lớp 1 (6–7 tuổi), chạy hoàn toàn trong trình duyệt; không backend riêng, cloud-sync Firebase là lớp **tuỳ chọn** (FR-Y09/NFR-C01) |
| Phiên bản | `package.json` → `1.0.0` |
| Nền tảng | Chrome/Edge/Android WebView/Safari iOS gần mới; màn hình 320→1440 px |
| Người đọc | Kỹ sư, QA, agent AI; phụ huynh/giáo viên đọc `docs/PARENT_MODE.md` thay |
| Ngoài phạm vi | Chấm điểm phát âm, thanh toán, quảng cáo, lớp học đa giáo viên, và **bất kỳ** đường nào buộc trẻ phải có tài khoản mới dùng được app |

**Bảng chữ cái yêu cầu**

| Tiền tố | Nhóm | Số lượng |
|---|---|---|
| `FR-Sxx` | Vỏ ứng dụng, điều hướng, hồ sơ bé, Parent Gate | 10 |
| `FR-Lxx` | Học theo môn, phiên học, Learning OS, Decision Engine | 12 |
| `FR-Gxx` | Trò chơi và khung bậc độ khó | 9 |
| `FR-Rxx` | Luyện đọc (Reading Fluency) | 7 |
| `FR-Exx` | Thi thử / Competition Engine / Tournament | 11 |
| `FR-Nxx` | Tiếng Anh: en-GB, Kid's Box, IOE, mastery | 7 |
| `FR-Mxx` | Động lực: XP, sao, sticker, shop, quest, streak, cây tri thức | 10 |
| `FR-Pxx` | Chế độ Phụ huynh, screen time, xuất/nạp dữ liệu | 8 |
| `FR-Yxx` | Hệ thống: PWA, offline, âm thanh, giọng đọc, cập nhật, tài khoản/cloud tuỳ chọn | 9 |
| `FR-Cxx` | Module cờ (cờ tướng CSS 3D + bàn cờ vua WebGL) | 6 |
| **Tổng FR** | | **88** |
| `NFR-x` | Phi chức năng (hiệu năng, a11y, offline, riêng tư trẻ em, trung thực dữ liệu, bảo trì) | 25 |
| `DC-x` | Yêu cầu dữ liệu (storage keys, schema, migration, sanitizer) | 17 |
| `IF-x` | Giao diện môi trường ngoài (trình duyệt API, CI, MCP, Firebase) | 11 |

---

## 2. Tài liệu tham chiếu

| Tài liệu | Vai trò |
|---|---|
| [`BRD.md`](BRD.md) | Nghiệp vụ: mục tiêu BG-01…BG-06, rủi ro R-01…R-07, Business DoD |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Kiến trúc + ADR; mọi FR dưới đây ánh xạ vào tầng của nó |
| [`RTM.md`](RTM.md) | Ma trận BR → FR/NFR → source → test → probe → gate |
| [`../SDLC.md`](../SDLC.md) | Quy trình, cổng CI, mục §3.1 bất biến đăng ký trò chơi, §10 MCP |
| [`../../AGENTS.md`](../../AGENTS.md) | Mệnh lệnh bắt buộc cho agent |
| [`../../CHANGELOG.md`](../../CHANGELOG.md) | Lịch sử thay đổi, mục `[Unreleased]` |
| [`../PARENT_MODE.md`](../PARENT_MODE.md), [`../GAME_DESIGN.md`](../GAME_DESIGN.md), [`../CURRICULUM_MAP.md`](../CURRICULUM_MAP.md), [`../cotuong.md`](../cotuong.md) | Đặc tả tính năng chi tiết theo mảng |

---

## 3. Phân loại người dùng

| Class | Đặc điểm kỹ thuật ảnh hưởng tới yêu cầu |
|---|---|
| **U1 — Bé 6–7 tuổi** | Chưa đọc thạo → mọi câu hỏi/phản hồi phải nghe được bằng giọng đọc (FR-Y02). Vận động tinh hạn chế → nút ≥ ~44 px, không yêu cầu kéo phức tạp (NFR-A03). Không biết khái niệm "lưu file" → mọi dữ liệu tự động ghi `localStorage` (DC-01). |
| **U2 — Phụ huynh** | Vào qua Parent Gate phép cộng hai số có hai chữ số (FR-S07). Cần bằng chứng, không cần cảm tính → báo cáo theo kỹ năng + xuất file (FR-P05…P07). |
| **U3 — Giáo viên / trung tâm** | Không có tài khoản; chỉ nhận file JSON hoặc dùng gói "Ôn ở nhà" (FR-N04). |
| **U4 — Kỹ sư / người vận hành** | Một cổng duy nhất `npm run verify` (NFR-M01). |
| **U5 — Agent AI** | Đọc `AGENTS.md` + 5 MCP server; bị ràng buộc bởi cùng các FR như U4 (NFR-M05). |

**Ngữ cảnh sử dụng bắt buộc hỗ trợ:** một bé dùng trên điện thoại gia đình, có lúc mất mạng
(FR-Y03), có lúc phụ huynh ngồi cạnh (FR-P01), có lúc bé dùng một mình sau Parent Gate (FR-S07).

---

## 4. Yêu cầu chức năng

Ký hiệu cột: **AC** = tiêu chí chấp nhận đo được; **Chứng cứ** = file nguồn + test/probe.
Cột **Gate** chỉ cổng nào chặn nếu vi phạm: `V` = `npm run verify` (typecheck+test+build+budget),
`Q` = probe Playwright trên `dist/`, `C` = CI workflow, `H` = git hook.

### 4.1 FR-S — Vỏ ứng dụng, điều hướng, hồ sơ, Parent Gate

| ID | Yêu cầu | AC | Chứng cứ | Gate |
|---|---|---|---|---|
| FR-S01 | Ứng dụng có đúng 17 màn hình được liệt kê trong `ActiveScreen` | `ActiveScreen` có 17 member, mỗi member đều tới được từ UI | [src/types/index.ts:254](file:///D:/trithuc/kho-bau-tri-thuc/src/types/index.ts#L254), [src/App.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/App.tsx) | V |
| FR-S02 | Màn hình chuyển bằng state, không đổi URL; modal dùng history riêng để nút_back trình duyệt đóng modal thay vì thoát app | Đóng modal bằng ESC và bằng nút đóng; mở modal đẩy một mục lịch sử để nút back của trình duyệt đóng modal trước | [src/hooks/useModalHistory.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/hooks/useModalHistory.ts), `qa/focus.mjs` | Q |
| FR-S03 | Bé khởi tạo hồ sơ (tên, avatar, lớp) trước khi học; hồ sơ được lưu và khôi phục khi tải lại | Reload → tên bé và XP còn nguyên | [src/components/home/HomeScreen.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/home/HomeScreen.tsx), DC-02, `qa/golden-path.mjs` (bước reload) | Q |
| FR-S04 | Header hiển thị XP / sao / tiền tệ / cài đặt, co giãn 6 viewport không tràn ngang | 0 phần tử tràn ngang tại 320/390/768/1024/1280/1440 | [src/components/common/Header.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/common/Header.tsx), `qa/responsive-a11y.mjs` | Q |
| FR-S05 | Bản đồ thế giới (world map) là lối vào các chủ đề đã mở khoá; khoá chủ đề kế tiếp theo tiến độ thật | Không vào được chủ đề khoá; mở khoá khi đủ điều kiện level engine | [src/components/world/WorldMapScreen.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/world/WorldMapScreen.tsx), [src/services/levelEngine.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/levelEngine.ts) | V |
| FR-S06 | Màn hình môn học liệt kê chủ đề → bài → câu hỏi của 4 môn | 66 chủ đề / 150 bài / 1570 câu hiển thị được, không màn nào rỗng | `src/data/{vietnamese,math,english,life}Curriculum.ts`, [src/components/subject/SubjectScreen.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/subject/SubjectScreen.tsx), `tests/t07-subject-path.test.ts` | V |
| FR-S07 | Chế độ Phụ huynh chặn bằng phép cộng hai số ≥ 10; sai thì xoá input và báo lỗi, không mở nội dung | Không đọc được bất kỳ số liệu nào của bé trước khi qua gate | [src/components/parent/ParentDashboardModal.tsx:51](file:///D:/trithuc/kho-bau-tri-thuc/src/components/parent/ParentDashboardModal.tsx#L51), `tests/parent-and-demo.test.ts` | V |
| FR-S08 | Sau khi qua gate, focus được trả về phần tử hợp lý (không rơi vào `body`) | `document.activeElement` nằm trong dashboard | [src/hooks/useFocusTrap.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/hooks/useFocusTrap.ts), `qa/decision-engine-a11y.mjs` | Q |
| FR-S09 | Toàn bộ nhãn UI tiếng Việt có dấu, câu ngắn, không ký tự CJK/Hán-Việt khó | `qa/p41-font-encoding` và test encoding không ghi nhận ký tự ngoài dải tiếng Việt | `tests/p41-font-encoding.test.ts`, `qa/p41-font-visual.mjs` | V, Q |
| FR-S10 | Nút "Chế độ mẫu / demo" phân biệt rõ với dữ liệu thật; dữ liệu mẫu luôn có cờ nhìn thấy được | Banner demo hiện khi `isDemoData` | [src/services/demoSeed.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/demoSeed.ts), `tests/parent-and-demo.test.ts` | V |

### 4.2 FR-L — Học, phiên học, Learning OS, Decision Engine

| ID | Yêu cầu | AC | Chứng cứ | Gate |
|---|---|---|---|---|
| FR-L01 | Mỗi câu hỏi gắn `skillId`; có 26 kỹ năng thi và phủ đủ 26/26 trong kho câu | `COMPETITION_SKILLS.length = 26`; `new Set(q.skillId).size = 26` | [src/data/competitionTaxonomy.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/data/competitionTaxonomy.ts), `tests/competition-bank.test.ts` | V |
| FR-L02 | `LessonPlayer` hỗ trợ 8 kiểu câu hỏi (choice, image-choice, math-expression, drag-drop, fill-blank, matching, ordering, true-false) | Mỗi kiểu có component chấm được đáp án | `src/components/learning/questions/*.tsx` (8 file), `tests/lesson-matching.test.ts`, `qa/lesson-types.mjs` | V, Q |
| FR-L03 | Đáp án chỉ do engine chấm, UI không tự quyết định đúng/sai | `answerCheck` là chỗ duy nhất trả về kết quả | [src/services/answerCheck.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/answerCheck.ts), `tests/answerCheck.test.ts` | V |
| FR-L04 | Mỗi lượt trả lời sinh một `LearningEvidence` bất biến, có `id` và không tính hai lần | Idempotency: gửi lại cùng `evidence.id` không đổi `mastery` | [src/services/learningOS.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/learningOS.ts) (`reduceEvidence`, `processedEvidenceIds`), `tests/personas-and-learning-os.test.ts` | V |
| FR-L05 | Trạng thái kỹ năng phân loại theo mức (L1…L5) và có `KnowledgeState` per skill | Store có `knowledgeStates: Record<skillId, KnowledgeState>` | [src/types/learningOS.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/types/learningOS.ts), DC-04 | V |
| FR-L06 | Decision Engine chọn hành động tốt kế tiếp (Next Best Action) từ bằng chứng, không từ random | Cùng input → cùng output (deterministic) | [src/services/decisionEngine.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/decisionEngine.ts), `tests/decision-engine.test.ts`, `qa/decision-engine.mjs` | V, Q |
| FR-L07 | NBA hiển thị trên màn chính như thẻ hướng dẫn, không phải popup chặn bé | Card tồn tại và bấm được → mở đúng hoạt động | [src/components/learning/NextBestActionCard.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/learning/NextBestActionCard.tsx) | Q |
| FR-L08 | Ôn tập hàng ngày dựng từ đường cong ôn, không lặp lại câu bé vừa làm đúng gần đây | `dailyReview` trả danh sách khác rỗng khi có kỹ năng đến hạn | [src/services/adaptive.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/adaptive.ts), `tests/learning-engine.test.ts`, [src/components/review/DailyReviewScreen.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/review/DailyReviewScreen.tsx) | V |
| FR-L09 | Độ khó tự thích ứng theo chuỗi đúng/sai trong phiên, có ngưỡng trong policy | Đổi policy → đổi hành vi, test khoá ngưỡng | [src/services/adaptiveDifficulty.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/adaptiveDifficulty.ts), `ADAPTIVE_DIFFICULTY_POLICY` [src/config/policy.ts:464](file:///D:/trithuc/kho-bau-tri-thuc/src/config/policy.ts#L464), `tests/adaptive-difficulty.test.ts` | V |
| FR-L10 | Phát hiện mệt trong phiên và giảm áp lực, không gán nhãn tiêu cực | Cờ `isFatigued` dựng từ `createDefaultFatigue`, không có từ "chậm/kém/yếu" trên UI bé | `SessionFatigueState` [src/types/learningOS.ts:179](file:///D:/trithuc/kho-bau-tri-thuc/src/types/learningOS.ts#L179), `createDefaultFatigue` [src/services/storage.ts:147](file:///D:/trithuc/kho-bau-tri-thuc/src/services/storage.ts#L147), `tests/fatigue-reset.test.ts` | V |
| FR-L11 | `sessionComposer` dựng phiên theo profile (QUICK/STANDARD/DEEP/EXTENDED) | 4 kind hợp lệ, mỗi kind sinh số câu đúng ngân sách | `SESSION_PROFILE_KINDS` [src/services/storage.ts:143](file:///D:/trithuc/kho-bau-tri-thuc/src/services/storage.ts#L143), [src/services/sessionComposer.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/sessionComposer.ts), `tests/session-composer.test.ts` | V |
| FR-L12 | Hoàn thành bài được ghi nhận một lần; vào lại bài đã hoàn thành không cộng XP lần hai | Làm lại cùng bài → XP không đổi | [src/services/learningOS.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/learningOS.ts), `tests/lesson-completion.test.ts` | V |

### 4.3 FR-G — Trò chơi

| ID | Yêu cầu | AC | Chứng cứ | Gate |
|---|---|---|---|---|
| FR-G01 | Catalog có đúng 31 trò chơi (9 Việt · 10 Toán · 5 Anh · 2 Logic · 5 Fun) | `GAMES_CATALOG.length = 31` | [src/data/gamesCatalog.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/data/gamesCatalog.ts), `tests/games-all.test.ts` | V |
| FR-G02 | Bất biến đăng ký 4 nơi, tên tiếng Việt khớp nhau | `ids(GAMES_CATALOG) == ids(GAME_REGISTRY) == LAUNCHABLE_GAME_IDS == keys(GAME_TITLES)` | [docs/SDLC.md §3.1](file:///D:/trithuc/kho-bau-tri-thuc/docs/SDLC.md), `tests/t23-mcp-servers.test.ts` (`readRegistration`), `qa/games.mjs` | V, Q |
| FR-G03 | Component trò chơi nạp lười | Mở game không tăng main chunk quá ngân sách | [src/components/games/registry.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/components/games/registry.ts), `npm run check:budget`, `tests/t02c-startup-split.test.ts` | V |
| FR-G04 | Mỗi trò có 6 bậc; số câu mỗi bậc `[5,6,6,7,8,8]`; **một bậc thang độ khó dùng chung** — số phương án `[4,4,5,5,6,6]`, trần số Toán `[10,20,30,50,70,100]`, giấy giờ chỉ bật từ bậc 4 và giảm dần, trần nhóm Puzzle (24 thẻ lật · mosaic 6×6 · 18 chấm · bàn coding 8×8) | `defaultRoundsPerTier()`/`TIER_OPTION_COUNT`/`TIER_MAX_VALUE` trả đúng mảng; probe đếm phương án render thật ở Màn 6 | [src/data/gameLevels.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/data/gameLevels.ts), [src/hooks/useGameStage.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/hooks/useGameStage.ts), `tests/t25-difficulty-ladder.test.ts`, `qa/tier6-ladder-evidence.mjs` | V, Q |
| FR-G05 | Dữ liệu trò chơi deterministic theo `(tier, seed)`; cấm `Math.random`/`Date.now` trong builder | Cùng seed → cùng đề; grep không thấy random/Date.now trong `src/data/games/*.ts` | `seededRng`/`shuffleSeeded`/`pickDistinct`, [src/config/policy.ts:297](file:///D:/trithuc/kho-bau-tri-thuc/src/config/policy.ts#L297) `SEED_POLICY`, `tests/game-content.test.ts` | V |
| FR-G06 | Nút "xáo đề" đổi `nonce` và sinh đề mới, vẫn deterministic theo nonce | `kho_bau_game_nonce` đổi → câu đổi | [src/hooks/useGameStage.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/hooks/useGameStage.ts), DC-08 | V |
| FR-G07 | Thưởng (XP/sao) trả **một lần mỗi vòng chơi**, không farming | Chơi lại vòng cũ không tăng `starsByTier`/`bestScoreByTier` đã đạt | `tests/game-rewards.test.ts`, `qa/games.mjs` | V, Q |
| FR-G08 | Mỗi game mở/đóng được trong modal có focus trap và trả focus về nút mở | 31/31 game mount + đóng; focus khôi phục | `qa/games.mjs`, `qa/focus.mjs`, `qa/kidbox-focus.mjs` | Q |
| FR-G09 | Ở zoom 200% (viewport ~195 px logical) không trò nào tràn quá 2 px | measured overflow ≤ 2 px × 31 | `qa/games.mjs` @195 px, `tests/mobile-layout.test.ts` | V, Q |

### 4.4 FR-R — Luyện đọc

| ID | Yêu cầu | AC | Chứng cứ | Gate |
|---|---|---|---|---|
| FR-R01 | Thang 5 bậc đọc gồm đúng 5 giá trị `ACCURACY, FLUENCY, COMPREHENSION, PROCESSING_SPEED, COMPETITION_SPEED` | `ReadingStage` có 5 member | [src/types/reading.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/types/reading.ts), `tests/reading-fluency.test.ts` | V |
| FR-R02 | Ngân hàng luyện đọc: 36 đoạn · 192 câu hỏi | đếm runtime array = 36/192 | [src/data/readingContent.ts:280](file:///D:/trithuc/kho-bau-tri-thuc/src/data/readingContent.ts#L280) | V |
| FR-R03 | Mỗi bậc chọn item từ `READING_STAGE_ITEM_IDS`, không randomly | Cùng stage + cùng profile → cùng danh sách id | [src/data/readingContent.ts:818](file:///D:/trithuc/kho-bau-tri-thuc/src/data/readingContent.ts#L818), `src/services/readingEngine.ts` (`assembleStageItems`) | V |
| FR-R04 | Chỉ số đọc tính bằng công thức khai báo trong policy (WPM, độ chính xác…) | `computeMetrics` thuần: không side-effect, không gọi API | [src/services/readingEngine.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/readingEngine.ts), `READING_POLICY` [src/config/policy.ts:94](file:///D:/trithuc/kho-bau-tri-thuc/src/config/policy.ts#L94) | V |
| FR-R05 | Phụ huynh chấm chủ quan 😀/😐/🙁; điểm chủ quan **không** đè điểm đo được | lưu trong `profile.parentRatings`, engine không đọc để tính readiness | `src/types/reading.ts`, DC-06 | V |
| FR-R06 | Mỗi phiên đọc ghi `ReadingMetrics[]` vào store, có `wordsPerMinute` | Store shape `{schemaVersion, metrics[], profile{parentRatings}}` | [src/components/reading/ReadingFluencyScreen.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/reading/ReadingFluencyScreen.tsx), `qa/golden-path.mjs` | Q |
| FR-R07 | Bảng "Luyện đọc" hiện trong Parent Dashboard, không nằm ở màn bé | Tab tồn tại sau Parent Gate | [src/components/parent/ParentDashboardModal.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/parent/ParentDashboardModal.tsx) | Q |

### 4.5 FR-E — Thi thử (Competition Engine)

| ID | Yêu cầu | AC | Chứng cứ | Gate |
|---|---|---|---|---|
| FR-E01 | Kho câu thi 475 câu, phiên bản bank = 6 (gồm 29 đề mẫu + 54 expansion + 271 P36 + 72 tournament) | `COMPETITION_BANK_VERSION = 6`, đếm array | [src/data/competitionQuestions.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/data/competitionQuestions.ts), `tests/competition-bank.test.ts`, `tests/competition-p36.test.ts` | V |
| FR-E02 | 7 dạng câu hỏi, mọi dạng phải chấm được | `byType = {multiple-choice 256, matching 55, fill-blank 46, ordering 42, true-false 39, classify 24, drag-drop 13}` | `CompetitionQuestionType` [src/types/competition.ts:21](file:///D:/trithuc/kho-bau-tri-thuc/src/types/competition.ts#L21), `src/data/competitionExamFormats.ts`, `qa/question-types.mjs` | Q |
| FR-E03 | 16 blueprint preset với phân phối dạng câu + số câu 6→30 + mode `mini_test/full_mock/speed_trial/tournament` | đếm runtime = 16 | [src/data/competitionBlueprints.ts:13](file:///D:/trithuc/kho-bau-tri-thuc/src/data/competitionBlueprints.ts#L13), `tests/exam-fidelity.test.ts` | V |
| FR-E04 | Khi bank không đủ câu cho blueprint, engine **báo `shortfall`** chứ không nhét câu trùng; hiện cả 16/16 assemble đủ | `assembleExam` trả `shortfall = max(0, questionCount − questions.length)`; đo 2026-10-29: 16/16 blueprint `shortfall = 0`; không id nào lặp trong một đề | `CompetitionEngine.assembleExam` [src/services/competitionEngine.ts:128](file:///D:/trithuc/kho-bau-tri-thuc/src/services/competitionEngine.ts#L128), `tests/exam-fidelity.test.ts:84`, [src/services/competitionEngine.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/competitionEngine.ts) | V |
| FR-E05 | Chấm điểm do engine, không do component | `gradeAnswer` / `scoreSession` thuần | `src/services/competitionEngine.ts`, `tests/competition-engine.test.ts` | V |
| FR-E06 | Đồng hồ thi chạy theo `durationSeconds`; hết giờ nộp bài tự động, không mất câu đã làm | 300 s / 1200 s preset honoured | [src/components/competition/CompetitionExamModal.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/competition/CompetitionExamModal.tsx), `qa/question-types.mjs` | Q |
| FR-E07 | Kết quả thi gồm `accuracy, score, speedLabel, weakSkills, errorAnalysis[]` đúng shape | type `CompetitionExamResult` | [src/types/competition.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/types/competition.ts), DC-05 | V |
| FR-E08 | Phân loại nguyên nhân sai theo 6 nhóm: `KNOWLEDGE_GAP, CARELESS_ERROR, SPEED_ERROR, MISREAD, REASONING_ERROR, UNCLASSIFIED` | enum khoá + test phân loại | `ErrorCategory` [src/types/competition.ts:123](file:///D:/trithuc/kho-bau-tri-thuc/src/types/competition.ts#L123), `ERROR_ANALYSIS_POLICY` [src/config/policy.ts:80](file:///D:/trithuc/kho-bau-tri-thuc/src/config/policy.ts#L80) | V |
| FR-E09 | Đánh giá độ sẵn sàng theo ngưỡng policy; **không** tuyên bố là đề chính thức | mỗi blueprint mang `sourceNote` "không phải đề thi chính thức" | `READINESS_POLICY` [src/config/policy.ts:53](file:///D:/trithuc/kho-bau-tri-thuc/src/config/policy.ts#L53), [src/components/competition/ReadinessView.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/competition/ReadinessView.tsx) | V |
| FR-E10 | Lịch sử thi tích luỹ: `examResults[]`, `practicedSkills`, `speedTrialsCompleted`, `remediationPlans` | store shape đúng, cap số bản ghi | DC-05, `tests/competition-readiness.test.ts` | V |
| FR-E11 | Chế độ Tournament 4 vòng (Hương→Huyện→Tỉnh→Quốc gia) với 72 câu riêng | `TOURNAMENT_QUESTIONS.length = 72`, 6 blueprint mode `tournament` | [src/services/tournament.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/tournament.ts), `src/data/competitionBankTournament.ts` | V |

### 4.6 FR-N — Tiếng Anh: en-GB, Kid's Box, IOE, mastery

| ID | Yêu cầu | AC | Chứng cứ | Gate |
|---|---|---|---|---|
| FR-N01 | Track Kid's Box dùng voice `en-GB` với fallback có kiểm soát và nhãn trung thực khi máy không có giọng en-GB | fallback order en-GB → regional → English → chỉ chữ | [src/services/britishSpeech.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/britishSpeech.ts), `tests/voice-persona.test.ts` | V |
| FR-N02 | Không chấm điểm phát âm; kết quả nói ghi là `speech recognition match` hoặc `self-check` | policy reporting không có "điểm phát âm" | `SPEECH_REPORTING_POLICY` [src/config/policy.ts:445](file:///D:/trithuc/kho-bau-tri-thuc/src/config/policy.ts#L445) | V |
| FR-N03 | Vòng lặp 9 bước Kid's Box, không bước nào khoá cứng; bước chỉ DONE khi có bằng chứng | `KIDBOX_POLICY` + engine không chặn bước | [src/services/kidBoxEngine.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/kidBoxEngine.ts), `tests/kidbox-curriculum.test.ts` | V |
| FR-N04 | **Không bịa nội dung giáo trình**: `KIDBOX_MAPPED_UNITS = []` và app liệt kê đúng 7 nhóm tài liệu cần bổ sung | đếm runtime mapped units = 0, required artifacts = 7 | [src/data/kidBoxCurriculum.ts:87](file:///D:/trithuc/kho-bau-tri-thuc/src/data/kidBoxCurriculum.ts#L87), `tests/kidbox-curriculum.test.ts` | V |
| FR-N05 | Kid's Box player có focus trap và dùng được bằng một tay trên mobile | `qa/kidbox-focus.mjs` pass | [src/components/english/KidBoxActivityPlayer.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/english/KidBoxActivityPlayer.tsx) | Q |
| FR-N06 | Mastery tiếng Anh và IOE lưu ở key riêng, không lẫn với Learning OS | `kho_bau_english_mastery_store`, `kho_bau_ioe_store` | [src/services/englishMasteryStore.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/englishMasteryStore.ts), `tests/p32-english-mastery.test.ts`, `tests/english-ioe.test.ts` | V |
| FR-N07 | Chủ đề tiếng Anh nền: 24 chủ đề / 40 bài / 434 câu; taxonomy 24 kỹ năng `CANONICAL_ENGLISH_SKILLS` | đếm runtime | `src/data/englishCurriculum.ts`, [src/data/englishSkillTaxonomy.ts:21](file:///D:/trithuc/kho-bau-tri-thuc/src/data/englishSkillTaxonomy.ts#L21), `tests/english-curriculum.test.ts`, `tests/t12b-english-units.test.ts` | V |

### 4.7 FR-M — Động lực

| ID | Yêu cầu | AC | Chứng cứ | Gate |
|---|---|---|---|---|
| FR-M01 | XP và cấp: trả lời/làm bài/hoàn thành trò chơi cộng XP theo policy, không tự tăng | `levelEngine` là nguồn duy nhất | [src/services/levelEngine.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/levelEngine.ts), `tests/t18a-motivation.test.ts` | V |
| FR-M02 | Sticker album: số lượng per sticker là số nguyên ≥ 0, cộng khi đạt điều kiện thật | `MotivationState.stickers: Record<string, number>` | [src/services/stickerEngine.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/stickerEngine.ts), `src/data/stickers.ts`, DC-07 | V |
| FR-M03 | Shop (avatar + vật phẩm) chỉ bán những gì catalog khai báo; không giao dịch tiền thật | giá là Xu/XP nội bộ | [src/services/shopEngine.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/shopEngine.ts), [src/data/shopCatalog.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/data/shopCatalog.ts), [src/components/shop/AvatarShopScreen.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/shop/AvatarShopScreen.tsx) | V |
| FR-M04 | Quest ngày dựng deterministic theo ngày + seed; hoàn thành thưởng một lần | `questPool` + `questEngine`, test snapshot | [src/services/questEngine.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/questEngine.ts), `src/data/questPool.ts` | V |
| FR-M05 | Streak + khiên giữ chuỗi; khiên chỉ dùng khi nghỉ đúng 1 ngày | `streakEngine` unit test | [src/services/streakEngine.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/streakEngine.ts), `tests/t18a-motivation.test.ts`, [src/components/motivation/StreakCalendarScreen.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/motivation/StreakCalendarScreen.tsx) | V |
| FR-M06 | Thành tựu chỉ mở khi điều kiện dữ liệu thật thoả mãn | `achievementEngine` đọc store, không đọc flag UI | [src/services/achievementEngine.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/achievementEngine.ts), `src/data/achievementCatalog.ts`, `tests/t01-achievements.test.ts` | V |
| FR-M07 | Cây tri thức lớn theo tiến độ ôn tập thật, tưới = hoàn thành ôn | key `kho_bau_tree_water` | [src/components/achievements/AchievementsGardenScreen.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/achievements/AchievementsGardenScreen.tsx), DC-13 | V |
| FR-M08 | Máy gacha chỉ quay bằng phần thưởng nội bộ, không tiền thật, tỉ lệ không được trình bày như cá cược | màn gacha không có input thanh toán | [src/components/motivation/GachaMachineScreen.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/motivation/GachaMachineScreen.tsx) | Q |
| FR-M09 | mọi feedback đúng/sai có âm thanh + hình ảnh; âm thanh tổng hợp WebAudio, không file tải ngoài | `sound.ts` không fetch URL audio | [src/services/sound.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/sound.ts), `qa/audio.mjs` | Q |
| FR-M10 | Khen ngợi (Praise Engine) chọn lời theo ngữ cảnh, không so sánh bé với bé, không từ tiêu cực | `praiseEngine` output không chứa banned words | [src/services/praiseEngine.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/praiseEngine.ts), `tests/praise-engine.test.ts`, `src/data/contentSafety.ts` | V |

### 4.8 FR-P — Chế độ Phụ huynh

| ID | Yêu cầu | AC | Chứng cứ | Gate |
|---|---|---|---|---|
| FR-P01 | Dashboard có các tab: tổng quan theo môn, kỹ năng, luyện đọc, thi thử, cài đặt | tab count ≥ 5, mỗi tab có nội dung từ store | [src/components/parent/ParentDashboardModal.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/parent/ParentDashboardModal.tsx), `qa/golden-path.mjs` | Q |
| FR-P02 | Screen time: giới hạn phút/phiên, hết giờ hiện modal nghỉ, bé không tự tắt được | `ScreenTimeModal` là dialog có trap, ESC **giữ modal mở** | [src/components/parent/ScreenTimeModal.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/parent/ScreenTimeModal.tsx), `qa/focus.mjs` | Q |
| FR-P03 | Cài đặt cha mẹ lưu ở `kho_bau_parent_settings` (gồm night mode, bg music) | DC-10 | `src/services/storage.ts`, `tests/t14c-storage.test.ts` | V |
| FR-P04 | Xuất báo cáo JSON ra file, tên `kho_bau_tri_thuc_report_*`, dữ liệu của chính máy đó | tải file thành công, JSON parse được | `src/services/storage.ts`, `qa/golden-path.mjs` | Q |
| FR-P05 | Nạp file báo cáo: chỉ nhận đúng schema, từ chối dữ liệu lạ mà không làm hỏng store hiện có | import file rác → store giữ nguyên + thông báo lỗi | `tests/parent-and-demo.test.ts` | V |
| FR-P06 | Đặt lại dữ liệu: cần xác nhận 2 bước trong Parent Gate | không reset từ màn bé | `qa/golden-path.mjs` | Q |
| FR-P07 | Báo cáo chẩn đoán per skill + gợi ý kèm theo, có "chuẩn" để so sánh | mỗi row hiển thị `accuracy` / `gate` | `parent/ParentDashboardModal.tsx:795`, [src/services/competitionQuality.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/competitionQuality.ts) | V |
| FR-P08 | Gói "Ôn ở nhà" Kid's Box: phụ huynh chọn Unit/Tuần → app dựng gói, không cần nhập điểm | panel tồn tại và hoạt động với units = 0 (hiện yêu cầu nguồn) | [src/components/parent/KidBoxParentPanel.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/parent/KidBoxParentPanel.tsx) | Q |

### 4.9 FR-Y — Hệ thống: PWA, offline, âm thanh, cập nhật

| ID | Yêu cầu | AC | Chứng cứ | Gate |
|---|---|---|---|---|
| FR-Y01 | PWA cài được: manifest hợp lệ + icon 192/512 (any + maskable) + apple-touch | manifest parse, mọi icon decode được | `public/`, `qa/offline-pwa.mjs` | Q |
| FR-Y02 | Mọi văn bản học tập đọc được bằng giọng nói; có nút nói lại; chống giọng đọc chồng nhau; **phép tính viết ký hiệu phải đọc thành lời** ("6 + 4 = ?" → "sáu cộng bốn bằng mấy") | TTS state machine, không 2 utterance đồng thời; `toSpeechText` chỉ đổi văn bản vào utterance, không đổi chữ hiển thị | [src/hooks/useSpeak.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/hooks/useSpeak.ts), [src/services/speechText.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/speechText.ts), `tests/t24-speech-math-operators.test.ts`, `qa/audio.mjs` | Q |
| FR-Y03 | Offline vẫn học được: service worker precache toàn bộ `dist/`, tắt mạng vẫn mở app và làm bài | probe offline: reload tắt mạng → app chạy, không lỗi console | [src/services/pwa.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/pwa.ts), `tests/sw-precache.test.ts`, `tests/pwa.test.ts`, `qa/offline-pwa.mjs` | V, Q |
| FR-Y04 | Xoá cache không mất tiến độ: dữ liệu nằm `localStorage`, không nằm trong Cache API | probe cache-wipe survival | `qa/offline-pwa.mjs` | Q |
| FR-Y05 | Có bản cập nhật thì báo cho người dùng, không tự đổi dữ liệu đang học | UpdateBanner hiển thị khi SW waiting | [src/components/system/UpdateBanner.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/system/UpdateBanner.tsx) | Q |
| FR-Y06 | Không phụ thuộc mạng cho tài nguyên trình bày: 0 file audio bên ngoài, 0 font CDN làm sập layout | build chạy được offline | `src/index.css`, `qa/p41-font-visual.mjs` | Q |
| FR-Y07 | Analytics chỉ là đếm sử dụng chung, **không** gửi tên bé, nội dung bài, hay điểm số | `@vercel/analytics` dùng mặc định; không `track()` payload cá nhân | `package.json`, [src/App.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/App.tsx) | V |
| FR-Y08 | Đăng nhập là **tuỳ chọn**: không đăng nhập vẫn dùng trọn vẹn app; `AccountModal` không bao giờ tạo tài khoản giả | `CloudSyncService.getState()` trả `status: 'offline'`, `user: null` khi chưa đăng nhập; không có đường nào ghi cloud | [src/services/firebase.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/firebase.ts), [src/components/auth/AccountModal.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/auth/AccountModal.tsx), `tests/firebase-auth-sync.test.ts:86` | V |
| FR-Y09 | Cloud mirror opt-in: sau khi đăng nhập Google, tiến độ được đẩy lên Firestore `users/{uid}` và kéo về **hợp nhất** (sao/XP/chuỗi/vé lấy `Math.max`, bài đã học lấy `Set` union) — không máy nào ghi đè làm mất tiến độ máy khác | debounce 2 s sau mỗi thay đổi `localStorage`, chỉ chạy khi `state.user != null`; rules chặn đọc/ghi chéo tài khoản | [src/services/cloudSync.ts:114](file:///D:/trithuc/kho-bau-tri-thuc/src/services/cloudSync.ts#L114), [src/services/cloudSync.ts:37](file:///D:/trithuc/kho-bau-tri-thuc/src/services/cloudSync.ts#L37), `firestore.rules`, `tests/firebase-auth-sync.test.ts` | V, Q |

### 4.10 FR-C — Cờ (tướng + vua)

| ID | Yêu cầu | AC | Chứng cứ | Gate |
|---|---|---|---|---|
| FR-C01 | Bàn **cờ tướng** 3D bằng CSS (`perspective`, `rotateX`, `preserve-3d`) — module này **không** dùng WebGL/three.js | board render bằng transform, test engine chạy trong Node không cần WebGL | [src/components/learning/cotuong/CotuongBoard3D.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/learning/cotuong/CotuongBoard3D.tsx), `AGENTS.md` §2 | V |
| FR-C02 | Quân cờ mang `id` ổn định để trượt giữa các ô, không remount mỗi nước | id không đổi qua các nước | [src/components/learning/cotuong/CotuongBoard3D.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/learning/cotuong/CotuongBoard3D.tsx), `tests/cotuong-engine.test.ts` | V |
| FR-C03 | Engine negamax + alpha-beta có **node budget** để không chặn UI thread | ngân sách node chặn; đo thời gian mỗi nước | [src/components/learning/cotuong/cotuongEngine.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/components/learning/cotuong/cotuongEngine.ts), `tests/cotuong-engine.test.ts` | V |
| FR-C04 | Luật bị khoá bằng test: cản chân Mã, mắt Tượng, Pháo cần đúng một screen, tốt ngang sau hà, hai Tướng không đối mặt, không tự bỏ chiếu, `applyMove` cập nhật bàn | mỗi điều khoản ≥ 1 case test | `tests/cotuong-engine.test.ts`, [docs/cotuong.md](file:///D:/trithuc/kho-bau-tri-thuc/docs/cotuong.md) | V |
| FR-C05 | Màn cờ có hướng dẫn và thế cờ demo cho bé lớp 1, không áp lực điểm | `ChessTutorial.tsx` + `ChessMoveDemo.tsx` tồn tại; nút Gợi ý/Hoàn tác ở `ChessGame.tsx:288`–`:303` | `src/components/learning/chess/`, [docs/cotuong.md](file:///D:/trithuc/kho-bau-tri-thuc/docs/cotuong.md) | Q |
| FR-C06 | Bàn **cờ vua** 3D bằng WebGL (three.js): quân là mesh ghép có đổ bóng, bàn 64 ô + hitbox, đánh dấu nước hợp lệ/chiếu bằng marker, chọn quân bằng `Raycaster`; có **Gợi ý** (`hintMove`) và **Hoàn tác** (`handleUndo` — lấy lại cả nước bé và nước máy đáp lại), 3 mức độ; **nạp lười** và ở chunk `three-vendor` riêng để entry không phình; máy không tạo được WebGL context (tablet cũ, tiết kiệm pin) thì tự chuyển sang bàn 2D thay vì màn trống (T31) | `pieceGeometries` sinh mesh đủ 12 quân trắng/đen có `castShadow`; `boardBuilder` đủ 64 ô + highlight; ChessScreen đứng sau `React.lazy`; `check:budget` vẫn PASS | [src/components/learning/chess/chess3d/Chess3DCanvas.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/learning/chess/chess3d/Chess3DCanvas.tsx), [src/App.tsx:18](file:///D:/trithuc/kho-bau-tri-thuc/src/App.tsx#L18), `tests/chess-3d.test.ts` | V, Q |

---

## 5. Yêu cầu phi chức năng

| ID | Nhóm | Yêu cầu | Ngưỡng chấp nhận | Đo bằng | Gate |
|---|---|---|---|---|---|
| NFR-P01 | Hiệu năng | Main chunk ≤ 600 kB | hiện 533.6 kB (mục tiêu ≤ 450 kB); vendor lớn `three-vendor` 545.4 / `firebase-vendor` 537.9 nằm ngoài entry, chỉ tải khi cần | `npm run check:budget`, `tests/bundle-budget.test.ts` | V, C |
| NFR-P02 | Hiệu năng | Game component là `lazy` — mở game không nạp toàn bộ app | mỗi id trong `GAME_REGISTRY` là `lazy(...)` | `tests/t23-mcp-servers.test.ts`, `tests/t02c-startup-split.test.ts` | V |
| NFR-P03 | Hiệu năng | Nước cờ không khoá UI | node budget có giới hạn, test timing | `tests/cotuong-engine.test.ts` | V |
| NFR-P04 | Hiệu năng | Không bộ đếm thời gian/chu kỳ nào gọi `Math.random` trong dữ liệu đề | grep 0 kết quả ở `src/data/games/*.ts` | `AGENTS.md` §2, `tests/games-content.test.ts` | V |
| NFR-A01 | A11y | Mọi modal có `role="dialog"`, focus trap, ESC trả focus | 0 phần tử focus mất tích khi đóng modal | `qa/focus.mjs`, `qa/decision-engine-a11y.mjs`, `qa/kidbox-focus.mjs` | Q |
| NFR-A02 | A11y | Nội dung nghe được: nút nói cho câu hỏi, đoạn đọc và lời khen | TTS state OK trên build | `qa/audio.mjs` | Q |
| NFR-A03 | A11y/Trẻ em | Vùng chạm ≥ ~44 px, không thao tác kéo bắt buộc để hoàn thành bài | 7 dạng câu đều trả lời được bằng chạm đơn | `qa/question-types.mjs`, `qa/responsive-a11y.mjs` | Q |
| NFR-A04 | A11y | Tôn trọng `prefers-reduced-motion` | animation tắt khi quota đặt | `qa/responsive-a11y.mjs` | Q |
| NFR-A05 | A11y | Phản hồi đúng/sai không chỉ dựa vào màu: có icon + chữ | probe a11y không ghi lỗi, màn review hiển thị nhãn chữ | `docs/P31_PERFORMANCE_ACCESSIBILITY.md`, `qa/responsive-a11y.mjs` | Q |
| NFR-R01 | Offline | App dùng được 100% không mạng sau một lần tải | tắt mạng + reload → vẫn học | `qa/offline-pwa.mjs` | Q |
| NFR-R02 | Bền dữ liệu | Mỗi schema bump phải có migration tương ứng | `SCHEMA_HISTORY` 7 bản, 6 hàm migrate | `tests/exam-fidelity.test.ts` (P28-v1 → hiện hành), `tests/t18a-motivation.test.ts`, `tests/reading-fluency.test.ts` (P29-v2) | V |
| NFR-R03 | Bền dữ liệu | Đọc store lỗi thời/ hỏng → sanitizer dựng lại, không ném | không crash khi JSON rác | `src/services/storage.ts` (sanitize), `tests/decision-engine-storage.test.ts` | V |
| NFR-R04 | Bền dữ liệu | Idempotency 5 tầng: evidence id, first-seen, nonce, completion, reward | làm lại thao tác không tăng thưởng | `docs/P30_RELIABILITY.md`, `tests/game-rewards.test.ts` | V |
| NFR-C01 | Riêng tư trẻ em | Mặc định: 100% dữ liệu ở `localStorage` máy người dùng, 0 backend, 0 upload. Ngoại lệ **duy nhất** là cloud mirror opt-in (FR-Y09): chỉ chạy sau khi người dùng tự đăng nhập Google, chỉ mang `ChildProfile` + các store đã serialize, ghi vào đúng `users/{uid}` với `firestore.rules request.auth.uid == userId`; không bao giờ upload ảnh/ghi âm/bài làm chi tiết | chưa đăng nhập ⇒ `CloudSyncService` ở `status: 'offline'`, `user: null` và listener bỏ qua mọi thay đổi `localStorage` (test); chưa có test end-to-end với project Firebase thật | [src/services/cloudSync.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/cloudSync.ts), `firestore.rules`, [src/services/storage.ts](file:///D:/trithuc/kho-bau-tri-thuc/src/services/storage.ts), FR-Y07, FR-Y08 | V |
| NFR-C02 | Riêng tư | `progress/` (export cho MCP) nằm ngoài VCS | `.gitignore` có `progress/` | `tests/t23-mcp-servers.test.ts` | V |
| NFR-C03 | Trung thực dữ liệu | Không sinh điểm giả/PASS giả; fixture demo phải có cờ `isDemoData` và banner | `mcp/sample-export.json` → `isDemoData: true` | `tests/t23-mcp-servers.test.ts`, FR-S10 | V |
| NFR-C04 | Ngôn ngữ tích cực | Không từ "chậm", "kém", "yếu", "thua" trong text dành cho bé | grep banned words = 0 | `src/data/contentSafety.ts`, `tests/content-quality.test.ts` | V |
| NFR-C05 | Nội dung | Không tuyên bố preset là đề thi chính thức | `sourceNote` có mặt ở 16/16 blueprint | `tests/exam-fidelity.test.ts` | V |
| NFR-C06 | Bản quyền | Không scraped questions, không file/media bản quyền bên ngoài | kho câu tự soạn; audio tổng hợp | `AGENTS.md`, `docs/P27_5_EXAM_FIDELITY.md` | V |
| NFR-M01 | Bảo trì | Một cổng duy nhất: `npm run verify` = typecheck + test + build + budget | exit 0 | [package.json](file:///D:/trithuc/kho-bau-tri-thuc/package.json) scripts | V, C |
| NFR-M02 | Bảo trì | Mọi ngưỡng nghiệp vụ nằm trong `src/config/policy.ts`, có rationale + test | 17 export policy, 693 dòng | `src/config/policy.ts` | V |
| NFR-M03 | Bảo trì | UI không quyết định correctness/score/mastery/readiness | engine là chỗ chấm duy nhất | FR-L03, FR-E05, `AGENTS.md` §0 principle 1 | V |
| NFR-M04 | Bảo trì | Tên test `tests/t<NN>-<chủ đề>.test.ts`; hành vi mới ⇒ test mới | 79 file / 1134 test | `AGENTS.md` §2 | V, H |
| NFR-M05 | Bảo trì | Không thêm dependency nếu chưa hỏi; runtime deps = 8 | `package.json` không đổi ngoài kế hoạch (`firebase`, `three`, `@types/three` vào repo cùng merge từ lane khác — đã ghi nợ vì `@types/three` lẽ ra thuộc `devDependencies`) | `AGENTS.md` §1.4 | H, C |
| NFR-M06 | Bảo trì | MCP layer zero-dependency, stdio tự viết | 0 import ngoài `node:*` trong `mcp/**` | `tests/t23-mcp-servers.test.ts` | V |

---

## 6. Yêu cầu dữ liệu

**Phiên bản schema hiện hành:** `STORAGE_SCHEMA_VERSION = 'P42-v3'`
([src/services/storage.ts:99](file:///D:/trithuc/kho-bau-tri-thuc/src/services/storage.ts#L99)).
**Lịch sử:** `P28-v1 → P29-v2 → P30-v1 → P41-v1 → P42-v1 → P42-v2 → P42-v3`
(`SCHEMA_HISTORY` [src/services/storage.ts:141](file:///D:/trithuc/kho-bau-tri-thuc/src/services/storage.ts#L141)).

**Kiểm kê key (đo 2026-10-29):** grep `kho_bau_` trong `src/` trả **19 chuỗi**, chia thành:
- **17 key `localStorage`** — 16 khai báo tập trung trong `STORAGE_KEYS`
  ([src/services/storage.ts:60](file:///D:/trithuc/kho-bau-tri-thuc/src/services/storage.ts#L60)) và **1 key khai báo cục bộ**
  `kho_bau_ioe_store` ở [src/components/learning/englishIoe/EnglishIoeScreen.tsx:6](file:///D:/trithuc/kho-bau-tri-thuc/src/components/learning/englishIoe/EnglishIoeScreen.tsx#L6)
  (nợ kỹ thuật: key nằm ngoài registry — ghi ở `ARCHITECTURE.md` §7).
- 2 chuỗi **không phải** key: `kho_bau_storage_change` (tên CustomEvent) và
  `kho_bau_tri_thuc_report_` (tiền tố tên file báo cáo). Đếm gộp hai chuỗi này vào kiểm kê là sai số.

| ID | Key | Nội dung | Ràng buộc |
|---|---|---|---|
| DC-01 | (nguyên tắc) | Mọi state bền vững của bé | JSON có `schemaVersion`; đọc qua `readJSONObject` có sanitize; ghi qua `writeJSON`; không write trực tiếp `localStorage` từ component |
| DC-02 | `kho_bau_child_profile` | Hồ sơ bé (tên, avatar, lớp) | DC-01; không PII ngoài lớp/tên do phụ huynh nhập |
| DC-03 | `kho_bau_game_progress` | `{version, games: {id: {unlockedTier, starsByTier, bestScoreByTier, updatedAt}}, updatedAt}` | `unlockedTier ∈ 0..6`; sao/score không giảm |
| DC-04 | `kho_bau_learning_os_store` | `knowledgeStates`, `recentEvidences` (cap 200), `processedEvidenceIds`, `sessionState`, `fatigue`, `schemaVersion` | evidence id không tính hai lần; `MAX_RECENT_EVIDENCES = 200` |
| DC-05 | `kho_bau_competition_history` | `{examResults[], practicedSkills, speedTrialsCompleted, remediationPlans}` | mỗi `examResults[i]` có `blueprintId`, `errorAnalysis[].category` ∈ 6 giá trị enum |
| DC-06 | `kho_bau_reading_store` | `{schemaVersion, metrics: ReadingMetrics[], profile{parentRatings}}` | `wordsPerMinute` do engine tính; `parentRatings` không dùng để tính readiness |
| DC-07 | `kho_bau_motivation` | `MotivationState {stickers: Record<string,number>, shields, streakDays, …}` | sticker count nguyên, ≥ 0 |
| DC-08 | `kho_bau_game_nonce` | nonce xáo đề per game | đổi nonce ⇒ đề đổi, không đổi tiến độ |
| DC-09 | `kho_bau_game_first_seen` | cờ đã thưởng lần đầu per game | chỉ cấp thưởng một lần (FR-G07) |
| DC-10 | `kho_bau_parent_settings` | screen time, night mode (P42-v1), bg music (P42-v3) | default an toàn khi key mất/corrupt |
| DC-11 | `kho_bau_analytics` | `{gamesPlayedCount, skillMastery: {skillId: {subject, attempts, correctCount}}}` | chỉ đếm, không chứa tên bé |
| DC-12 | `kho_bau_achievements` | id achievement đã mở | chỉ mở khi điều kiện dữ liệu thật thoả (FR-M06) |
| DC-13 | `kho_bau_tree_water` | tiến độ cây tri thức | tăng theo phiên ôn thật |
| DC-14 | `kho_bau_daily_quests` | quest ngày + trạng thái | deterministic theo ngày (FR-M04) |
| DC-15 | `kho_bau_english_mastery_store`, `kho_bau_kidbox_store` | track tiếng Anh, Kid's Box | key riêng, không lẫn Learning OS (FR-N06) |
| DC-17 | `kho_bau_ioe_store` | tiến độ luyện IOE | **đang nằm ngoài `STORAGE_KEYS` và đọc/ghi `localStorage` trực tiếp** ở [EnglishIoeScreen.tsx:6](file:///D:/trithuc/kho-bau-tri-thuc/src/components/learning/englishIoe/EnglishIoeScreen.tsx#L6) — nợ kỹ thuật, xem `ARCHITECTURE.md` §13.1 |
| DC-16 | `kho_bau_review_days` | nhật ký ngày ôn/streak | input của `streakEngine` |

**Quy tắc di trú:** bump `STORAGE_SCHEMA_VERSION` **bắt buộc** thêm hàm migrate tương ứng — test
`tests/t14c-storage.test.ts` chặn; migration chỉ được *backfill*, cấm tính lại mastery lịch sử.

---

## 7. Yêu cầu giao diện môi trường ngoài

| ID | Interface | Cách dùng | Ràng buộc |
|---|---|---|---|
| IF-01 | `localStorage` | lưu toàn bộ state | chỉ `readJSONObject`/`writeJSON` trong `src/services/storage.ts`; có sự kiện nội bộ `kho_bau_storage_change` |
| IF-02 | `ServiceWorker` + Cache API | precache build | không chứa dữ liệu người dùng (FR-Y04) |
| IF-03 | `Web Audio API` | âm hiệu đúng/sai/nền | tổng hợp tại chỗ, 0 file mp3 ngoài (FR-M09) |
| IF-04 | `SpeechSynthesis` | giọng đọc Việt + `en-GB` | chống chồng utterance, fallback có kiểm soát, honour `useSpeak` (FR-Y02, FR-N01) |
| IF-05 | `SpeechRecognition` | luyện nói Kid's Box | optional; thiếu thì bé vẫn nghe–lặp–tự đối chiếu; không thành điểm phát âm (FR-N02) |
| IF-06 | Download/Upload file | xuất & nhập báo cáo JSON | file `.json` duy nhất, không gửi đi đâu (FR-P04, FR-P05) |
| IF-07 | `@vercel/analytics` | đo lượt dùng | payload trắng, không dữ liệu học (FR-Y07) |
| IF-08 | npm scripts | cổng chất lượng | `verify`, `test:ci`, `qa:smoke`, `check:budget`, `hooks:install`; **CI không dùng `npm test`** (posttest ghi `docs/audit-state.json` + nối `docs/AUDIT_REPORT.md`) |
| IF-09 | GitHub Actions | `01-quality`, `02-build-artifact`, `03-qa-browser`, `04-release` | release chỉ khi tag `vX.Y.Z`; **không** deploy provider, **không** secret |
| IF-10 | MCP servers (`mcp/`) | 5 server / 27 tool cho agent | số liệu MCP là *manh mối*, không phải *bằng chứng*; muốn "xanh" phải chạy lệnh thật |
| IF-11 | Firebase Auth + Firestore (`firebase ^13.1.0`) | đăng nhập Google popup + đọc/ghi tài liệu `users/{uid}` cho cloud mirror | **chỉ sau khi người dùng tự đăng nhập** (FR-Y08/Y09); cấu hình công khai trong `firebase-applet-config.json`, quyền do `firestore.rules` kiểm soát; app **không** được phụ thuộc vào endpoint này để chạy (NFR-R01) |

---

## 8. Ràng buộc thiết kế (bắt buộc, vi phạm là đỏ cổng)

1. **Không backend riêng, không đường mặc định ra khỏi máy.** `localStorage` là nguồn thật;
   `firebase.ts`/`cloudSync.ts` chỉ là mirror **tuỳ chọn** sau khi đăng nhập (FR-Y09, ADR-01,
   ADR-16). Không chấp nhận yêu cầu nào bắt trẻ phải có tài khoản mới học được.
2. **Không dependency mới** khi chưa hỏi (kể cả devDependency ảnh hưởng bundle/CI).
3. **WebGL/three.js chỉ trong màn cờ vua lazy** (`Chess3DCanvas.tsx`, chunk `three-vendor`,
   ADR-17). Mọi 3D khác — gồm cờ tướng — vẫn dùng CSS transform, và **không** được import
   `three` vào `App.tsx` hay entry (gate `check:budget` sẽ đỏ).
4. **Bất biến 4 nơi** cho trò chơi ([docs/SDLC.md §3.1](file:///D:/trithuc/kho-bau-tri-thuc/docs/SDLC.md)).
5. **Data builder deterministic** `(tier, seed)`; cấm `Math.random`/`Date.now`.
6. **Ngưỡng trong `policy.ts`**, có rationale + test; component không hard-code ngưỡng.
7. **Sửa tăng dần**, không viết lại toàn bộ ứng dụng; không đụng lane khác trong `.ai/CURRENT.md`.
8. **Không commit** file dữ liệu của trẻ, `.env*`, hay secret.

---

## 9. Ma trận verification rút gọn

| Nhóm FR | Test đơn vị chính | Probe trình duyệt | Gate CI |
|---|---|---|---|
| FR-S | `tests/parent-and-demo.test.ts`, `tests/t07-subject-path.test.ts`, `tests/p41-font-encoding.test.ts` | `golden-path.mjs`, `responsive-a11y.mjs` | 01, 02, 03 |
| FR-L | `answerCheck`, `decision-engine`, `session-composer`, `adaptive-difficulty`, `learning-engine`, `fatigue-reset` | `decision-engine.mjs`, `lesson-types.mjs`, `golden-path.mjs` | 01, 02, 03 |
| FR-G | `games-all`, `games-content`, `game-content`, `game-rewards`, `t15-viet-games`, `t16-math-games`, `t17a-english-games`, `t21-fun-games`, `mobile-layout` | `games.mjs`, `focus.mjs` | 01, 02, 03 |
| FR-R | `reading-fluency` | `golden-path.mjs` | 01, 02 |
| FR-E | `competition-bank`, `competition-engine`, `competition-p36`, `exam-fidelity`, `competition-readiness` | `question-types.mjs` | 01, 02, 03 |
| FR-N | `kidbox-curriculum`, `kidbox-activities`, `kidbox-learning-os`, `p32-english-mastery`, `voice-persona`, `english-ioe` | `kidbox-focus.mjs`, `audio.mjs` | 01, 02 |
| FR-M | `praise-engine`, `t18a-motivation`, `t01-achievements`, `content-quality` | `audio.mjs`, `games.mjs` | 01, 02 |
| FR-P | `parent-and-demo`, `t14c-storage` | `focus.mjs`, `golden-path.mjs` | 01, 02, 03 |
| FR-Y | `pwa`, `sw-precache`, `bundle-budget`, `firebase-auth-sync` | `offline-pwa.mjs`, `p41-font-visual.mjs` | 01, 02, 03 |
| FR-C | `cotuong-engine`, `chess-3d` | `games.mjs` | 01, 02 |
| NFR-M | `t23-mcp-servers` | — | 01, 02 |

Chi tiết từng dòng: xem [`RTM.md`](RTM.md).

---

## 10. Giả định & phụ thuộc

| ID | Giả định | Rủi ro nếu sai | Kiểm chứng lại bằng |
|---|---|---|---|
| A-01 | Thiết bị đích có `SpeechSynthesis` tiếng Việt | bé không nghe được → phải dựa vào chữ | `qa/audio.mjs` + thiết bị thật |
| A-02 | Thiết bị đích có `localStorage ≥ 5 MB` | mất tiến độ khi store đầy | test sanitizer + giới hạn bản ghi |
| A-03 | Trẻ không có tài khoản; phụ huynh là chủ dữ liệu. Cloud mirror (FR-Y09) mặc định **tắt** và chỉ bật khi người lớn tự đăng nhập | nếu một UI nào đó bật sync mặc định hoặc bắt đăng nhập, toàn bộ NFR-C01 và lời hứa offline (NFR-R01) sụp đổ | `tests/firebase-auth-sync.test.ts:86`, [src/services/cloudSync.ts:37](file:///D:/trithuc/kho-bau-tri-thuc/src/services/cloudSync.ts#L37), ADR-16 trong `ARCHITECTURE.md` |
| A-04 | Kid's Box chưa có nguồn nội dung đã xác minh | đơn vị 0 unit (FR-N04) — tính năng chỉ hoàn chỉnh khi có nguồn | `KIDBOX_REQUIRED_ARTIFACTS` = 7 |
| A-05 | Repo dùng npm; `bun.lock` là tài liệu cũ | CI cài đặt sai nếu dùng lock file khác | `package-lock.json` + `npm ci` |

---

## 11. Trạng thái chấp nhận (tóm tắt)

| Hạng | Kết quả 2026-10-31 (sau vòng sửa bug T26/T27) |
|---|---|
| `npm run verify` | **EXIT=0** — typecheck sạch · 79 file / 1134 test pass · build OK · main chunk 534 kB → PASS |
| Probe QA | cần chạy lại trên `dist/` sau mỗi thay đổi UI (xem `docs/SDLC.md` §5) |
| FR chưa đạt / cần nguồn | FR-N04 (Kid's Box units = 0), BG-01 (vẫn chưa đo được: sync là tuỳ chọn nên không có số liệu server), FR-Y09 mới chỉ đạt một phần (chưa test với project Firebase thật) |
| Nợ ghi nhận | mục tiêu chunk 450 kB chưa đạt (đang 534 kB); audit riêng cho track Kid's Box trước khi dùng với trẻ; `@types/three` sai chỗ; `npm install` báo 4 lỗ hổng severity cao |

*Sửa tài liệu này khi sửa code. Một FR không còn chứng cứ phải bị xoá hoặc gắn "KHÔNG CÒN ĐÚNG",
không được để treo.*
