# RTM — Requirements Traceability Matrix
## KHO BÁU TRI THỨC — LỚP 1 (mã tài liệu KBT-RTM-1.0)

> Ma trận hai chiều: **xuôi** (nghiệp vụ → yêu cầu → code → test → probe → gate) và
> **ngược** (test/probe → yêu cầu, để tìm thứ đang chạy mà không phục vụ yêu cầu nào).
>
> Nguyên tắc ghi: một dòng RTM chỉ được coi là **ĐẠT** khi ô Test **hoặc** Probe có thật
> và chạy được. Không có ô "sẽ test". Không có yêu cầu nào được ghi mà không trỏ file.
>
> **Ngày chốt:** 2026-10-29, đo lại 2026-10-30 sau merge `origin/main` · nguồn yêu cầu: [`SRS.md`](SRS.md) · nghiệp vụ: [`BRD.md`](BRD.md)
> · kiến trúc: [`ARCHITECTURE.md`](ARCHITECTURE.md).

**Cột Gate:** `V` = `npm run verify` · `Q` = probe Playwright trên `dist/` (`qa/run-one.mjs`) ·
`1`/`2`/`3`/`4` = workflow `.github/workflows/01-quality.yml…04-release.yml` ·
`H` = git hook trong `scripts/hooks/`.

---

## 1. Truy vết xuôi cấp nghiệp vụ (BR → yêu cầu)

| ID nghiệp vụ | Nội dung | Yêu cầu liên quan | Bằng chứng tổng | Trạng thái |
|---|---|---|---|---|
| BG-01 | Bé tự học 15–20 phút/ngày không cần người lớn | FR-S01…S06, FR-L06…L11, FR-Y02, NFR-A03 | `qa/golden-path.mjs` (17 bước), `qa/mobile-golden.mjs` | **CHƯA ĐO ĐƯỢC** — dữ liệu nằm `localStorage`, cloud-sync là tuỳ chọn nên vẫn không có aggregate server-side (ADR-01/ADR-16) |
| BG-02 | Chỉ rõ điểm yếu theo kỹ năng | FR-L01, FR-L04…L08, FR-E07, FR-E08, FR-P07 | `tests/decision-engine.test.ts`, `tests/competition-readiness.test.ts` | ĐẠT (máy), chưa đạt (người dùng thật) |
| BG-03 | Không sai nội dung (đáp án, dấu, kiến thức) | FR-L01, FR-E01, FR-E05, NFR-C04, NFR-C05 | `tests/content-quality.test.ts`, `tests/exam-fidelity.test.ts`, `tests/math-typography.test.ts`, `tests/vietnamese-rhymes.test.ts` | ĐẠT — 0 lỗi validator, 18 WARNING đã xoá (P42/T20B) |
| BG-04 | Dùng được trên điện thoại gia đình, offline | FR-Y01, FR-Y03, FR-Y04, NFR-R01, NFR-A01…A04, FR-G09 | `qa/offline-pwa.mjs`, `qa/mobile.mjs`, `qa/responsive-a11y.mjs`, `qa/games.mjs` @195 px | ĐẠT |
| BG-05 | Phụ huynh tin về dữ liệu của con | NFR-C01, NFR-C02, NFR-C03, FR-Y07, FR-Y08, FR-P04…P06 | `tests/firebase-auth-sync.test.ts`, `tests/parent-and-demo.test.ts`, `tests/t23-mcp-servers.test.ts` | ĐẠT (máy) — chưa đóng được phần "phụ huynh hiểu đúng" vì sync mới có test mock, chưa có UI xoá dữ liệu cloud (BRD R-08) |
| BG-06 | Đổi nội dung không phá tiến độ cũ | NFR-R02, NFR-R03, NFR-R04, DC-01…DC-17 | `tests/exam-fidelity.test.ts`, `tests/t18a-motivation.test.ts`, `tests/reading-fluency.test.ts`, `tests/decision-engine-storage.test.ts` | ĐẠT |
| R-01…R-08 (rủi ro BRD) | Xem `BRD.md` §6 | NFR-M01, NFR-P01, NFR-C03, ADR-05, ADR-08 | `npm run check:budget`, `.ai/CURRENT.md`, `isDemoData` | ĐANG KIỂM SOÁT |

---

## 2. Ma trận FR → nguồn → test → probe → gate

### 2.1 FR-S — Vỏ ứng dụng

| ID | Nguồn (`file:line`) | Test | Probe | Gate | Trạng thái |
|---|---|---|---|---|---|
| FR-S01 | `src/types/index.ts:254`, `src/App.tsx` | — (typecheck) | `qa/golden-path.mjs` | V,1,2 | ĐẠT |
| FR-S02 | `src/hooks/useModalHistory.ts:20` | `tests/t01b-ui-fixes.test.ts` | `qa/focus.mjs` | V,3 | ĐẠT |
| FR-S03 | `src/components/home/HomeScreen.tsx`, DC-02 | `tests/t07-subject-path.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |
| FR-S04 | `src/components/common/Header.tsx` | `tests/mobile-layout.test.ts` | `qa/responsive-a11y.mjs` | V,3 | ĐẠT |
| FR-S05 | `src/components/world/WorldMapScreen.tsx`, `src/services/levelEngine.ts` | `tests/t07-subject-path.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |
| FR-S06 | `src/data/{vietnamese,math,english,life}Curriculum.ts`, `src/components/subject/SubjectScreen.tsx` | `tests/t07-subject-path.test.ts`, `tests/vietnamese-curriculum.test.ts`, `tests/math-curriculum.test.ts`, `tests/english-curriculum.test.ts`, `tests/life-curriculum.test.ts` | `qa/mobile-home.mjs` | V,3 | ĐẠT |
| FR-S07 | `src/components/parent/ParentDashboardModal.tsx:51` | `tests/parent-and-demo.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |
| FR-S08 | `src/hooks/useFocusTrap.ts` | `tests/t20a-hooks-order.test.ts` | `qa/decision-engine-a11y.mjs` | V,3 | ĐẠT |
| FR-S09 | `src/data/contentSafety.ts`, `src/index.css` | `tests/p41-font-encoding.test.ts`, `tests/math-typography.test.ts` | `qa/p41-font-visual.mjs` | V,1,3 | ĐẠT |
| FR-S10 | `src/services/demoSeed.ts` | `tests/parent-and-demo.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |

### 2.2 FR-L — Học & Learning OS

| ID | Nguồn | Test | Probe | Gate | Trạng thái |
|---|---|---|---|---|---|
| FR-L01 | `src/data/competitionTaxonomy.ts` | `tests/competition-bank.test.ts` | — | V,1 | ĐẠT |
| FR-L02 | `src/components/learning/questions/*.tsx` (8 file) | `tests/lesson-matching.test.ts`, `tests/t16-math-contract.test.ts` | `qa/lesson-types.mjs` | V,3 | ĐẠT |
| FR-L03 | `src/services/answerCheck.ts` | `tests/answerCheck.test.ts` | `qa/lesson-types.mjs` | V,1 | ĐẠT |
| FR-L04 | `src/services/learningOS.ts` | `tests/personas-and-learning-os.test.ts`, `tests/kidbox-learning-os.test.ts` | `qa/decision-engine.mjs` | V,1 | ĐẠT |
| FR-L05 | `src/types/learningOS.ts`, DC-04 | `tests/learning-engine.test.ts` | — | V,1 | ĐẠT |
| FR-L06 | `src/services/decisionEngine.ts`, `src/config/policy.ts:146` | `tests/decision-engine.test.ts`, `tests/decision-engine-storage.test.ts` | `qa/decision-engine.mjs` | V,1,3 | ĐẠT |
| FR-L07 | `src/components/learning/NextBestActionCard.tsx` | `tests/personas-and-learning-os.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |
| FR-L08 | `src/services/adaptive.ts`, `src/components/review/DailyReviewScreen.tsx` | `tests/learning-engine.test.ts`, `tests/date-utils.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |
| FR-L09 | `src/services/adaptiveDifficulty.ts`, `src/config/policy.ts:464` | `tests/adaptive-difficulty.test.ts` | — | V,1 | ĐẠT |
| FR-L10 | `src/types/learningOS.ts:179`, `src/services/storage.ts:147` | `tests/fatigue-reset.test.ts` | — | V,1 | ĐẠT |
| FR-L11 | `src/services/sessionComposer.ts`, `src/services/storage.ts:143` | `tests/session-composer.test.ts` | `qa/lesson-types.mjs` | V,1 | ĐẠT |
| FR-L12 | `src/services/learningOS.ts` | `tests/lesson-completion.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |

### 2.3 FR-G — Trò chơi

| ID | Nguồn | Test | Probe | Gate | Trạng thái |
|---|---|---|---|---|---|
| FR-G01 | `src/data/gamesCatalog.ts:24` | `tests/games-all.test.ts`, `tests/games-content.test.ts` | `qa/games.mjs` | V,1,3 | ĐẠT |
| FR-G02 | `docs/SDLC.md` §3.1 | `tests/t23-mcp-servers.test.ts` (so 4 danh sách) | `qa/games.mjs` (`GAME_TITLES`) | V,1,3 | ĐẠT |
| FR-G03 | `src/components/games/registry.ts` (31 × `lazy`) | `tests/t02c-startup-split.test.ts`, `tests/bundle-budget.test.ts` | `qa/t02-smoke.mjs` | V,2 | ĐẠT |
| FR-G04 | `src/data/gameLevels.ts`, `src/hooks/useGameStage.ts` | `tests/t08-games-hub.test.ts`, `tests/game-content.test.ts`, `tests/t25-difficulty-ladder.test.ts` | `qa/games.mjs`, `qa/tier6-ladder-evidence.mjs` | V,3 | ĐẠT |
| FR-G05 | `src/config/policy.ts:297`, `src/data/games/*.ts` | `tests/game-content.test.ts`, `tests/t15-viet-games.test.ts`, `tests/t16-math-games.test.ts`, `tests/t17a-english-games.test.ts`, `tests/t17b-coding.test.ts`, `tests/t17b-scientist.test.ts`, `tests/t21-fun-games.test.ts`, `tests/t25-difficulty-ladder.test.ts` | `qa/games.mjs` | V,1,3 | ĐẠT |
| FR-G06 | `src/hooks/useGameStage.ts`, DC-08 | `tests/t08-games-hub.test.ts` | `qa/games.mjs` | V,3 | ĐẠT |
| FR-G07 | DC-09 (`kho_bau_game_first_seen`) | `tests/game-rewards.test.ts` | `qa/games.mjs` | V,1,3 | ĐẠT |
| FR-G08 | `src/components/games/GameModalWrapper.tsx`, `src/hooks/useFocusTrap.ts` | `tests/t01b-ui-fixes.test.ts` | `qa/focus.mjs`, `qa/kidbox-focus.mjs` | V,3 | ĐẠT |
| FR-G09 | `qa/games.mjs` @195 px | `tests/mobile-layout.test.ts` | `qa/games.mjs`, `qa/mobile-golden.mjs` | V,3 | ĐẠT |

### 2.4 FR-R — Luyện đọc

| ID | Nguồn | Test | Probe | Gate | Trạng thái |
|---|---|---|---|---|---|
| FR-R01 | `src/types/reading.ts` | `tests/reading-fluency.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |
| FR-R02 | `src/data/readingContent.ts:280`, `:798` | `tests/reading-fluency.test.ts` | `qa/golden-path.mjs` | V,1 | ĐẠT |
| FR-R03 | `src/data/readingContent.ts:818`, `src/services/readingEngine.ts` | `tests/reading-fluency.test.ts` | — | V,1 | ĐẠT |
| FR-R04 | `src/services/readingEngine.ts`, `src/config/policy.ts:94` | `tests/reading-fluency.test.ts`, `tests/curriculum-quality-p41.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |
| FR-R05 | `src/types/reading.ts`, DC-06 | `tests/reading-fluency.test.ts` | — | V,1 | ĐẠT |
| FR-R06 | `src/components/reading/ReadingFluencyScreen.tsx` | `tests/reading-fluency.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |
| FR-R07 | `src/components/parent/ParentDashboardModal.tsx` | `tests/parent-and-demo.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |

### 2.5 FR-E — Thi thử

| ID | Nguồn | Test | Probe | Gate | Trạng thái |
|---|---|---|---|---|---|
| FR-E01 | `src/data/competitionQuestions.ts:20`, `competitionBankP36.ts`, `competitionBankTournament.ts` | `tests/competition-bank.test.ts`, `tests/competition-p36.test.ts` | `qa/question-types.mjs` | V,1,3 | ĐẠT |
| FR-E02 | `src/types/competition.ts:21`, `src/data/competitionExamFormats.ts` | `tests/exam-fidelity.test.ts` | `qa/question-types.mjs` | V,3 | ĐẠT |
| FR-E03 | `src/data/competitionBlueprints.ts:13` | `tests/exam-fidelity.test.ts` | `qa/question-types.mjs` | V,1,3 | ĐẠT |
| FR-E04 | `src/services/competitionEngine.ts:128`, `src/services/competitionQuality.ts` | `tests/exam-fidelity.test.ts:84` | `qa/question-types.mjs` | V,1 | ĐẠT (16/16 shortfall = 0) |
| FR-E05 | `src/services/competitionEngine.ts` | `tests/competition-engine.test.ts` | — | V,1 | ĐẠT |
| FR-E06 | `src/components/competition/CompetitionExamModal.tsx` | `tests/competition-engine.test.ts` | `qa/question-types.mjs` | V,3 | ĐẠT |
| FR-E07 | `src/types/competition.ts` (CompetitionExamResult) | `tests/competition-readiness.test.ts` | `qa/question-types.mjs` | V,3 | ĐẠT |
| FR-E08 | `src/types/competition.ts:123`, `src/config/policy.ts:80` | `tests/competition-readiness.test.ts` | — | V,1 | ĐẠT |
| FR-E09 | `src/config/policy.ts:53`, `src/components/competition/ReadinessView.tsx` | `tests/competition-readiness.test.ts`, `tests/exam-fidelity.test.ts` (sourceNote) | `qa/question-types.mjs` | V,1,3 | ĐẠT |
| FR-E10 | DC-05 | `tests/competition-readiness.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |
| FR-E11 | `src/services/tournament.ts`, `src/data/competitionBankTournament.ts` | `tests/competition-bank.test.ts`, `tests/competition-p36.test.ts` | — | V,1 | ĐẠT |

### 2.6 FR-N — Tiếng Anh / Kid's Box / IOE

| ID | Nguồn | Test | Probe | Gate | Trạng thái |
|---|---|---|---|---|---|
| FR-N01 | `src/services/britishSpeech.ts` | `tests/voice-persona.test.ts` | `qa/audio.mjs` | V,3 | ĐẠT |
| FR-N02 | `src/config/policy.ts:445` | `tests/kidbox-activities.test.ts` | `qa/audio.mjs` | V,1 | ĐẠT |
| FR-N03 | `src/services/kidBoxEngine.ts`, `src/config/policy.ts:364` | `tests/kidbox-curriculum.test.ts`, `tests/kidbox-learning-os.test.ts` | `qa/kidbox-focus.mjs` | V,3 | ĐẠT |
| FR-N04 | `src/data/kidBoxCurriculum.ts:38`, `:87` | `tests/kidbox-curriculum.test.ts` | `qa/golden-path.mjs` | V,1 | **CHƯA ĐẠT** (0 unit — cần nguồn, ADR-15) |
| FR-N05 | `src/components/english/KidBoxActivityPlayer.tsx` | `tests/kidbox-activities.test.ts`, `tests/kidbox-bridge-practice.test.ts` | `qa/kidbox-focus.mjs` | V,3 | ĐẠT |
| FR-N06 | `src/services/englishMasteryStore.ts`, `kho_bau_ioe_store` | `tests/p32-english-mastery.test.ts`, `tests/english-ioe.test.ts` | — | V,1 | ĐẠT |
| FR-N07 | `src/data/englishCurriculum.ts:2767`, `src/data/englishSkillTaxonomy.ts:21` | `tests/english-curriculum.test.ts`, `tests/t12b-english-units.test.ts` | `qa/p41-curriculum-quality.mjs` | V,1,3 | ĐẠT |

### 2.7 FR-M — Động lực

| ID | Nguồn | Test | Probe | Gate | Trạng thái |
|---|---|---|---|---|---|
| FR-M01 | `src/services/levelEngine.ts` | `tests/t18a-motivation.test.ts`, `tests/t20a-levelup-hooks.test.tsx` | `qa/golden-path.mjs` | V,3 | ĐẠT |
| FR-M02 | `src/services/stickerEngine.ts`, `src/data/stickers.ts` | `tests/t18a-motivation.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |
| FR-M03 | `src/services/shopEngine.ts`, `src/data/shopCatalog.ts` | `tests/t14c-logic.test.ts`, `tests/t14c-storage.test.ts` | — | V,1 | ĐẠT |
| FR-M04 | `src/services/questEngine.ts`, `src/data/questPool.ts` | `tests/t14c-logic.test.ts`, `tests/date-utils.test.ts` | — | V,1 | ĐẠT |
| FR-M05 | `src/services/streakEngine.ts` | `tests/t18a-motivation.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |
| FR-M06 | `src/services/achievementEngine.ts`, `src/data/achievementCatalog.ts` | `tests/t01-achievements.test.ts` | `qa/t01-hotfix.mjs` | V,3 | ĐẠT |
| FR-M07 | `src/components/achievements/AchievementsGardenScreen.tsx`, DC-13 | `tests/t14c-storage.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |
| FR-M08 | `src/components/motivation/GachaMachineScreen.tsx` | — | `qa/golden-path.mjs` | V,3 | ĐẠT (probe-only) |
| FR-M09 | `src/services/sound.ts`, `src/services/questionAudio.ts` | `tests/question-audio-routing.test.ts` | `qa/audio.mjs` | V,3 | ĐẠT |
| FR-M10 | `src/services/praiseEngine.ts`, `src/data/contentSafety.ts` | `tests/praise-engine.test.ts`, `tests/content-quality.test.ts`, `tests/content-validator-t02c.test.ts`, `tests/t02d-content-fixes.test.ts` | `qa/p41-curriculum-quality.mjs` | V,1,3 | ĐẠT |

### 2.8 FR-P — Phụ huynh

| ID | Nguồn | Test | Probe | Gate | Trạng thái |
|---|---|---|---|---|---|
| FR-P01 | `src/components/parent/ParentDashboardModal.tsx` | `tests/parent-and-demo.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |
| FR-P02 | `src/components/parent/ScreenTimeModal.tsx` | `tests/t01b-ui-fixes.test.ts` | `qa/focus.mjs` | V,3 | ĐẠT |
| FR-P03 | DC-10, `src/services/storage.ts` | `tests/t14c-storage.test.ts` | — | V,1 | ĐẠT |
| FR-P04 | `src/services/storage.ts` (export JSON) | `tests/parent-and-demo.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |
| FR-P05 | `src/services/storage.ts` (import) | `tests/parent-and-demo.test.ts` | — | V,1 | ĐẠT |
| FR-P06 | `src/components/parent/ParentDashboardModal.tsx` | `tests/parent-and-demo.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |
| FR-P07 | `src/components/parent/ParentDashboardModal.tsx:795`, `src/services/competitionQuality.ts` | `tests/competition-readiness.test.ts` | `qa/golden-path.mjs` | V,3 | ĐẠT |
| FR-P08 | `src/components/parent/KidBoxParentPanel.tsx` | `tests/kidbox-bridge-practice.test.ts` | `qa/kidbox-focus.mjs` | V,3 | **CHƯA ĐẠT** (phụ thuộc FR-N04) |

### 2.9 FR-Y — Hệ thống

| ID | Nguồn | Test | Probe | Gate | Trạng thái |
|---|---|---|---|---|---|
| FR-Y01 | `public/manifest.webmanifest`, `public/icon-*.png` | — | `qa/offline-pwa.mjs` | V,2,3 | ĐẠT (probe-only) |
| FR-Y02 | `src/hooks/useSpeak.ts`, `src/services/britishSpeech.ts`, `src/services/speechText.ts` | `tests/voice-persona.test.ts`, `tests/question-audio-routing.test.ts`, `tests/t24-speech-math-operators.test.ts` | `qa/audio.mjs` | V,3 | ĐẠT |
| FR-Y03 | `src/services/pwa.ts`, `public/sw.js`, `scripts/sw-precache.mjs` | `tests/pwa.test.ts`, `tests/sw-precache.test.ts` | `qa/offline-pwa.mjs` | V,1,2,3 | ĐẠT |
| FR-Y04 | `public/sw.js` (cache không chứa dữ liệu bé) | `tests/sw-precache.test.ts` | `qa/offline-pwa.mjs` | V,3 | ĐẠT |
| FR-Y05 | `src/components/system/UpdateBanner.tsx` | `tests/pwa.test.ts` | `qa/offline-pwa.mjs` | V,3 | ĐẠT |
| FR-Y06 | `src/index.css`, `public/fonts` | `tests/p41-font-encoding.test.ts` | `qa/p41-font-visual.mjs` | V,3 | ĐẠT |
| FR-Y07 | `src/App.tsx` (@vercel/analytics mặc định) | `tests/firebase-auth-sync.test.ts` | `qa/t02-smoke.mjs` (network) | V,1 | ĐẠT |
| FR-Y08 | `src/services/firebase.ts:50`, `src/components/auth/AccountModal.tsx` | `tests/firebase-auth-sync.test.ts:86` (offline khi chưa đăng nhập) | `qa/golden-path.mjs` | V,1 | ĐẠT |
| FR-Y09 | `src/services/cloudSync.ts:37`, `:114`, `firestore.rules` | `tests/firebase-auth-sync.test.ts` (mock) | — | V,1 | ĐẠT MỘT PHẦN — chưa test với project Firebase thật, chưa có UI xoá dữ liệu cloud |

### 2.10 FR-C — Cờ tướng

| ID | Nguồn | Test | Probe | Gate | Trạng thái |
|---|---|---|---|---|---|
| FR-C01 | `src/components/learning/cotuong/CotuongBoard3D.tsx` (CSS transform, không import `three`) | `tests/cotuong-engine.test.ts` | `qa/golden-path.mjs` | V,1 | ĐẠT |
| FR-C02 | `src/components/learning/cotuong/CotuongBoard3D.tsx` | `tests/cotuong-engine.test.ts` | — | V,1 | ĐẠT |
| FR-C03 | `src/components/learning/cotuong/cotuongEngine.ts` | `tests/cotuong-engine.test.ts` | — | V,1 | ĐẠT |
| FR-C04 | `src/components/learning/cotuong/cotuongEngine.ts` | `tests/cotuong-engine.test.ts` (mã, tượng, pháo, tốt, tướng đối mặt, tự bỏ chiếu, `applyMove`) | — | V,1 | ĐẠT |
| FR-C05 | `src/components/learning/chess/ChessTutorial.tsx`, `ChessMoveDemo.tsx` | — | `qa/golden-path.mjs` | V,3 | ĐẠT (probe-only) |
| FR-C06 | `src/components/learning/chess/chess3d/Chess3DCanvas.tsx`, `pieceGeometries.ts`, `boardBuilder.ts`, `src/App.tsx:18` (lazy) | `tests/chess-3d.test.ts` (mesh 12 quân có shadow, 64 ô + hitbox, marker, đi nước mở đầu với engine) | `qa/games.mjs` | V,1,2 | ĐẠT |

---

## 3. Ma trận NFR

| ID | Nguồn | Test | Probe | Gate | Trạng thái |
|---|---|---|---|---|---|
| NFR-P01 | `scripts/check-bundle-budget.mjs` (`MAIN_CHUNK_BUDGET_BYTES`) | `tests/bundle-budget.test.ts` | — | V,2 | ĐẠT — 533.6 kB / 600 kB (mục tiêu 450 **chưa đạt**); `three-vendor` 545.4 + `firebase-vendor` 537.9 ở ngoài entry, có gate riêng bằng ADR-17 |
| NFR-P02 | `src/components/games/registry.ts` | `tests/t02c-startup-split.test.ts` | `qa/t02-smoke.mjs` | V,2 | ĐẠT |
| NFR-P03 | `src/components/learning/cotuong/cotuongEngine.ts` (node budget) | `tests/cotuong-engine.test.ts` | — | V,1 | ĐẠT |
| NFR-P04 | `src/config/policy.ts:297` | `tests/game-content.test.ts` | — | V,1 | ĐẠT |
| NFR-A01 | `src/hooks/useFocusTrap.ts` | `tests/t01b-ui-fixes.test.ts` | `qa/focus.mjs`, `qa/kidbox-focus.mjs`, `qa/decision-engine-a11y.mjs` | V,3 | ĐẠT |
| NFR-A02 | `src/hooks/useSpeak.ts` | `tests/voice-persona.test.ts` | `qa/audio.mjs` | V,3 | ĐẠT |
| NFR-A03 | `src/components/ui/KidButton.tsx`, `qa/question-types.mjs` | `tests/lesson-matching.test.ts` | `qa/question-types.mjs`, `qa/responsive-a11y.mjs` | V,3 | ĐẠT |
| NFR-A04 | `src/index.css:414` (`@media (prefers-reduced-motion: reduce)`) | — | `qa/responsive-a11y.mjs` | V,3 | ĐẠT (probe-only) |
| NFR-A05 | `docs/P31_PERFORMANCE_ACCESSIBILITY.md` | — | `qa/responsive-a11y.mjs` | V,3 | ĐẠT (probe-only) |
| NFR-R01 | `public/sw.js`, `src/services/pwa.ts` | `tests/pwa.test.ts` | `qa/offline-pwa.mjs` | V,2,3 | ĐẠT |
| NFR-R02 | `src/services/storage.ts:108`, `:141` | `tests/exam-fidelity.test.ts`, `tests/t18a-motivation.test.ts`, `tests/reading-fluency.test.ts` | — | V,1 | ĐẠT |
| NFR-R03 | `src/services/storage.ts:217` (`readJSONObject`) | `tests/decision-engine-storage.test.ts`, `tests/kidbox-learning-os.test.ts` | — | V,1 | ĐẠT |
| NFR-R04 | `src/services/storage.ts`, `src/services/learningOS.ts` | `tests/lesson-completion.test.ts`, `tests/game-rewards.test.ts`, `tests/personas-and-learning-os.test.ts` | `qa/games.mjs` | V,1,3 | ĐẠT |
| NFR-C01 | `src/services/storage.ts` (nguồn thật), `src/services/cloudSync.ts:37` (chỉ sync khi đã đăng nhập), `firestore.rules` | `tests/firebase-auth-sync.test.ts` | `qa/offline-pwa.mjs` | V,1 | ĐẠT (mặc định) — phần cloud mirror mới đạt một phần, xem FR-Y09 |
| NFR-C02 | `.gitignore` (`progress/`) | `tests/t23-mcp-servers.test.ts` | — | V,1,H | ĐẠT |
| NFR-C03 | `mcp/sample-export.json` (`isDemoData`), `src/services/demoSeed.ts` | `tests/t23-mcp-servers.test.ts`, `tests/parent-and-demo.test.ts` | `qa/golden-path.mjs` | V,1 | ĐẠT |
| NFR-C04 | `src/data/contentSafety.ts` | `tests/content-quality.test.ts`, `tests/praise-engine.test.ts` | `qa/p41-curriculum-quality.mjs` | V,1,3 | ĐẠT |
| NFR-C05 | `src/data/competitionBlueprints.ts:10` (`ORIGINAL_SOURCE_NOTE`) | `tests/exam-fidelity.test.ts` | `qa/question-types.mjs` | V,1 | ĐẠT |
| NFR-C06 | `docs/P27_5_EXAM_FIDELITY.md`, `src/data/competitionQuestions.ts` | `tests/competition-bank.test.ts` | — | V,1 | ĐẠT |
| NFR-M01 | `package.json` (`verify`, `verify:quick`) | — | — | V,H,1,2 | ĐẠT |
| NFR-M02 | `src/config/policy.ts` (17 export, có rationale) | test theo từng policy block | — | V,1 | ĐẠT |
| NFR-M03 | ADR-03; `src/services/answerCheck.ts` | `tests/answerCheck.test.ts`, `tests/competition-engine.test.ts` | `qa/question-types.mjs` | V,1 | ĐẠT |
| NFR-M04 | `tests/` naming | 73 file / 1052 test | — | V,H,1 | ĐẠT |
| NFR-M05 | `package.json` (8 runtime deps; `@types/three` sai chỗ — nợ #8 ARCHITECTURE §13) | `tests/t23-mcp-servers.test.ts` | — | V,H,1 | ĐẠT |
| NFR-M06 | `mcp/lib/server.mjs` | `tests/t23-mcp-servers.test.ts` | — | V,1 | ĐẠT |

---

## 4. Truy vết ngược: DC → nguồn

| ID | Key / đối tượng | Nơi khai báo | Pipeline đọc/ghi | Test |
|---|---|---|---|---|
| DC-01 | nguyên tắc mọi store | `src/services/storage.ts:217`, `:236` | `readJSONObject` → migrate → sanitize → default | `tests/decision-engine-storage.test.ts` |
| DC-02 | `kho_bau_child_profile` | `src/services/storage.ts:61` | StorageService | `tests/t07-subject-path.test.ts` |
| DC-03 | `kho_bau_game_progress` | `:71`, `GAME_PROGRESS_SCHEMA_VERSION:102` | StorageService | `tests/game-rewards.test.ts`, `tests/t08-games-hub.test.ts` |
| DC-04 | `kho_bau_learning_os_store` | `:67` | `createEmptyLearningOSStore:157` | `tests/t18a-motivation.test.ts`, `tests/fatigue-reset.test.ts` |
| DC-05 | `kho_bau_competition_history` | `:66` | StorageService | `tests/competition-readiness.test.ts` |
| DC-06 | `kho_bau_reading_store` | `:68`, đọc `:501` | StorageService | `tests/reading-fluency.test.ts` |
| DC-07 | `kho_bau_motivation` | `:81`, ghi `:1350` | StorageService | `tests/t18a-motivation.test.ts` |
| DC-08 | `kho_bau_game_nonce` | `:73` | StorageService | `tests/t08-games-hub.test.ts` |
| DC-09 | `kho_bau_game_first_seen` | `:75` | StorageService | `tests/game-rewards.test.ts` |
| DC-10 | `kho_bau_parent_settings` | `:63` | StorageService | `tests/t14c-storage.test.ts` |
| DC-11 | `kho_bau_analytics` | `:62` | StorageService | `tests/parent-and-demo.test.ts` |
| DC-12 | `kho_bau_achievements` | `:64` | StorageService | `tests/t01-achievements.test.ts` |
| DC-13 | `kho_bau_tree_water` | `:78` | StorageService | `tests/t14c-storage.test.ts` |
| DC-14 | `kho_bau_daily_quests` | `:65` | StorageService | `tests/t14c-logic.test.ts` |
| DC-15 | `kho_bau_english_mastery_store` / `kho_bau_kidbox_store` | `:69`, `:70` | `englishMasteryStore.ts`, `kidBoxStore.ts` | `tests/p32-english-mastery.test.ts`, `tests/kidbox-learning-os.test.ts` |
| DC-16 | `kho_bau_review_days` | `:72`, đọc `:1996` | StorageService | `tests/t14c-logic.test.ts` |
| DC-17 | `kho_bau_ioe_store` **(ngoài registry)** | `src/components/learning/englishIoe/EnglishIoeScreen.tsx:6` | `localStorage` trực tiếp | `tests/english-ioe.test.ts` — **LỖ HỔNG thiết kế**, xem `TASK_PLAN.md` EP-B3 |

---

## 5. Ma trận CI → yêu cầu

| Workflow | Chạy gì | Bảo vệ yêu cầu | Nếu đỏ thì không được |
|---|---|---|---|
| `01-quality.yml` | `npm ci` → `typecheck` → `test:ci` | NFR-M01, và mọi FR có ô Test | merge PR |
| `02-build-artifact.yml` | `npm run build` → `check:budget` → upload `dist/` | NFR-P01, NFR-P02, FR-G03, FR-Y01 | có artifact để QA |
| `03-qa-browser.yml` | download `dist/` → `playwright install chromium` → `node qa/run-one.mjs <probe>` | mọi ô Probe (NFR-A01…A05, FR-Y03, FR-G08/G09…) | release |
| `04-release.yml` | tag `vX.Y.Z` → `npm run verify` → `scripts/release-notes.mjs` → zip + GitHub Release | Business DoD (BRD §8) | phát hành |
| `scripts/hooks/pre-commit` | typecheck + chặn `.env*` | NFR-C01, NFR-M01 | commit |
| `scripts/hooks/commit-msg` | Conventional Commits | quy trình §4 `AGENTS.md` | commit |
| `scripts/hooks/pre-push` | `verify:quick` | NFR-M01 | push |

---

## 6. Ma trận ngược: probe → yêu cầu (tìm probe không chủ đích)

| Probe | Phục vụ | Ghi chú |
|---|---|---|
| `qa/golden-path.mjs` | BG-01…BG-06, FR-S01/03/05/07/10, FR-L07/08/12, FR-R01/R02/R04/R06/R07, FR-M01/02/05/07/08, FR-P01/04/06/07, FR-Y08, FR-C01/C05 | probe chính, bắt buộc xanh trước release |
| `qa/responsive-a11y.mjs` | BG-04, NFR-A03/A04/A05, FR-S04 | 6 viewport + a11y + reduced motion |
| `qa/games.mjs` | FR-G01…G09, NFR-R04 | 31 game, thưởng đúng 1 lần/vòng, @195 px |
| `qa/focus.mjs` | NFR-A01, FR-S02, FR-G08, FR-P02 | trap + restore |
| `qa/offline-pwa.mjs` | BG-04/BG-05, NFR-R01, FR-Y01/Y03/Y04/Y05 | cache-wipe survival, icon decode |
| `qa/audio.mjs` | NFR-A02, FR-M09, FR-N01/N02, FR-Y02 | chống stacked utterance, cổng autoplay, **phép tính `+ − =` đọc thành lời** (`mathOperatorsSpoken`: văn bản thật vào `SpeechSynthesisUtterance`) |
| `qa/mobile.mjs` | BG-04, FR-S03/04 | 4 viewport + xoay + resume |
| `qa/mobile-golden.mjs` | BG-01, BG-04, FR-G09 | 7 chặng @390 px và @195 px, XP giữ nguyên |
| `qa/mobile-home.mjs` | FR-S03, FR-S06 | mànHome trên mobile |
| `qa/kidbox-focus.mjs` | FR-G08, FR-N05, FR-P08 | activity player Kid's Box |
| `qa/lesson-types.mjs` | FR-L02, FR-L03, FR-L11 | 8 kiểu câu hỏi bài học |
| `qa/question-types.mjs` | FR-E02…E09, NFR-A03, NFR-M03 | 7 dạng bài thi, mọi dạng trả lời + chấm được |
| `qa/decision-engine.mjs` | FR-L06 | NBA trên build thật |
| `qa/decision-engine-a11y.mjs` | FR-S08, NFR-A01 | focus + semantics của NBA |
| `qa/p41-curriculum-quality.mjs` | NFR-C04, FR-M10, FR-N07 | chất lượng nội dung |
| `qa/p41-font-visual.mjs` | FR-S09, FR-Y06 | font/dấu không vỡ |
| `qa/p38-browser-probe.cjs` | FR-Y03 (history P38) | probe legacy, vẫn chạy được |
| `qa/t01-hotfix.mjs` | FR-M06 | achievements |
| `qa/t01b-fixes.mjs` | FR-S02, FR-G08, FR-P02 | UI fixes |
| `qa/t02-smoke.mjs` | NFR-P02, FR-Y07 | startup split + network sạch |
| `qa/lib.mjs`, `qa/run-one.mjs` | (hạ tầng, không phải probe) | runner + helper |

**Kết luận truy vết ngược:** không có probe nào không phục vụ yêu cầu; mỗi probe đều có chủ
đích ở bảng trên.

---

## 7. Ma trận ngược: test không phục vụ yêu cầu nào?

73 file test đều nằm trong ít nhất một dòng §2 hoặc §3 ở trên (mới: `tests/chess-3d.test.ts` → FR-C06; `tests/firebase-cloud-sync.test.ts` đổi tên thành `tests/firebase-auth-sync.test.ts` → FR-Y08/Y09/NFR-C01; `tests/t24-speech-math-operators.test.ts` → FR-Y02; `tests/t25-difficulty-ladder.test.ts` → FR-G04/G05; `tests/t26-cotuong-puzzles.test.ts` → FR-C06; `tests/t27-lesson-engagement.test.ts` → FR-M01/FR-S08), **ngoại trừ** các file sau —
chúng bảo vệ *chất lượng nền* chứ không bảo vệ một FR riêng lẻ:

| File | Vai trò thật |
|---|---|
| `tests/bundle-budget.test.ts` | đã ánh xạ NFR-P01 — không phải orphan |
| `tests/t23-mcp-servers.test.ts` | đã ánh xạ NFR-M02/M05/M06, FR-G02 — không phải orphan |
| `tests/date-utils.test.ts` | nền tảng dùng bởi FR-L08 + FR-M04 (không có FR riêng) |
| `tests/t20a-hooks-order.test.ts`, `tests/t20a-levelup-hooks.test.tsx` | quy tắc React (hooks order) — phục vụ FR-S08, FR-M01 |

→ **0 test mồ côi.** Nếu một ngày thêm test không khớp dòng nào, đó là dấu hiệu yêu cầu
chưa được ghi vào SRS (phải thêm FR hoặc xoá test).

---

## 8. Tổng kết độ phủ

| Hạng | Số | Độ phủ |
|---|---|---|
| FR | 88 | **86 ĐẠT** · 1 ĐẠT MỘT PHẦN (FR-Y09 — cloud mirror mới có test mock) · 2 CHƯA ĐẠT (FR-N04, FR-P08 — cùng một nguyên nhân: thiếu nguồn giáo trình) |
| FR có bằng chứng tự động (`tests/`) | 82/88 | 7 FR chỉ có probe (`FR-Y01`, `FR-M08`, `FR-C05`, `FR-S01`, `NFR-A04/A05`…) |
| NFR | 25 | 24 ĐẠT · 1 đạt một phần (NFR-P01: dưới ngân sách cứng, trên mục tiêu 450 kB) |
| DC | 17 | 17 có nguồn + test · **1 lỗ hổng thiết kế** (DC-17 key ngoài registry) |
| Probe | 23 | 23/23 có chủ đích |
| Test file | 73 | 73/73 có ánh xạ (`firebase-auth-sync` đổi tên từ `firebase-cloud-sync`; `chess-3d`, `t26-cotuong-puzzles`, `t27-lesson-engagement` thêm mới) |
| Yêu cầu **không đo được** | 1 | BG-01 (cần telemetry thật — bị chặn bởi ADR-01, không phải lỗi code) |

## 9. Cách cập nhật tài liệu này

1. Thêm FR/NFR/DC trong `SRS.md` ⇒ **bắt buộc** thêm dòng RTM trong cùng PR.
2. Xoá tính năng trong code ⇒ xoá dòng RTM và dòng SRS (giữ lại lịch sử ở `CHANGELOG.md`).
3. Một dòng RTM chỉ chuyển sang ĐẠT khi output lệnh thật được dán vào PR/Issue —
   không dựa vào số liệu MCP (`AGENTS.md` §1.7, docs/SDLC.md §10).
4. Số liệu kiểm kê (31 game / 475 câu / 73 test / 533.6 kB…) chỉ được sửa khi vừa đo lại
   bằng `npx vitest run`, `npm run check:budget` hoặc `ls`.
