# T20A — Danh Sách Lỗi (P0–P3)

Ngày kiểm thử: 2026-10-15  
Môi trường: Windows, Chrome 124 (Playwright), Vite preview @ localhost:4173  
Build: `npm run build` → dist/ (525 kB main chunk gzip 131 kB)

---

## P0 — Chặn phát hành / Sai lệch nghiêm trọng yêu cầu GDPT

| ID | Mô tả | Cách tái hiện | File liên quan | Ghi chú |
|---|---|---|---|---|
| **B-01** | **26 bài học có < 10 câu hỏi** (yêu cầu GDPT ≥ 10). Toán: 10 bài, Tiếng Anh: 16 bài. Tiếng Việt & Em & Cuộc sống đạt. | Chạy test `npm test` (test tự viết `curriculum-lesson-check.test.ts` — đã xoá sau khi ghi nhận). | `src/data/mathCurriculum.ts`, `src/data/englishCurriculum.ts`, `src/data/curriculum.ts` | Blocker cho chỉ số "Câu hỏi bài học ≥ 1.300, mỗi bài ≥ 10". Cần bổ sung câu hỏi cho 26 bài. |
| **B-02** | **Chunk chính 525 kB > mục tiêu 450 kB** (README §Kết quả mong đợi). | `npm run build` → warning "Some chunks are larger than 500 kB". | `vite.config.ts`, code-splitting entry points | Cần dynamic import cho màn hình lớn (ParentDashboard, CompetitionHub, ReadingFluency, KidBoxCompanion). |

---

## P1 — Hỏng chức năng chính, UX mobile/accessibility bị phá vỡ

| ID | Mô tả | Cách tái hiện | File liên quan | Ghi chú |
|---|---|---|---|---|
| **B-03** | **Game tràn ngang 88px trên mobile 390×844** (vi phạm "không cuộn ngang"). | `QA_VIEWPORT=390x844 node qa/run-one.mjs qa/mobile-golden.mjs` → `errors: ["mobile: game overflow 88px"]`. | `src/components/games/*`, `src/components/ui/KidCard.tsx`, CSS grid/flex | Ảnh hưởng trải nghiệm bé 6–7 tuổi trên điện thoại. |
| **B-04** | **Focus trap hỏng ở Lesson Modal**: focus không vào dialog, Tab/Shift+Tab thoát ra ngoài, không restore focus khi đóng. | `node qa/run-one.mjs qa/focus.mjs` → 4 lỗi lesson dialog. | `src/components/learning/LessonPlayerModal.tsx`, `src/hooks/useFocusTrap.ts` | Vi phạm WCAG 2.4.3, 2.4.7. Bé không điều khiển được bằng bàn phím/phím tắt. |
| **B-05** | **Lesson Player: strict mode violation (2 dialog elements) + timeout bài 2–4** | `node qa/run-one.mjs qa/lesson-types.mjs` → 12 lỗi (strict mode + timeout). | `src/components/learning/LessonPlayerModal.tsx`, `src/components/learning/questions/*` | Dialog chồng lấn (kết quả bài + level-up celebration). Cần dismiss celebration trước. |
| **B-06** | **Audio autoplay test timeout** (20s chờ selector không xuất hiện). | `node qa/run-one.mjs qa/audio.mjs` → `EXCEPTION: page.waitForSelector: Timeout 20000ms exceeded.` at `autoplayOff`. | `src/services/sound.ts`, `src/hooks/useSpeak.ts`, `qa/audio.mjs` | Có thể do race condition khi tắt autoplay. Cần kiểm tra logic `questionAutoplay` setting. |
| **B-07** | **Validator báo "choice question rendered with fewer than 3 options"**. | `node qa/run-one.mjs qa/p41-curriculum-quality.mjs` → error. | `src/services/contentValidator.ts`, ngân hàng câu hỏi competition | Vi phạm CONTENT_POLICY.MIN_OPTIONS (3 cho multiple-choice). |

---

## P2 — Lỗi UX/UI, hiệu năng, dữ liệu không nhất quán

| ID | Mô tả | Cách tái hiện | File liên quan | Ghi chú |
|---|---|---|---|---|
| **B-08** | **Tràn ngang nhẹ (5–16px) trên phone/tablet** ở header, daily quest cards, task buttons. | `node qa/run-one.mjs qa/responsive-a11y.mjs` → `wideSources` với `scrollWidth > clientWidth`. | `src/components/common/Header.tsx`, `src/components/home/HomeScreen.tsx`, `src/components/motivation/*` | Không cuộn ngang thực tế, nhưng vi phạm "pixel-perfect" tại zoom 200%. |
| **B-09** | **Memory game (Lật Thẻ Trí Nhớ Vàng) không đến màn thắng, replay không cho thưởng lần 2**. | `node qa/run-one.mjs qa/games.mjs` → `gameOverShown: false`, `round2AwardedOnce: false`. | `src/components/games/MemoryCardsGame.tsx`, `src/services/analytics.ts` | Logic hoàn thành game & reward replay cần xem lại. |
| **B-10** | **Lesson types thiếu đa dạng**: chỉ gặp true-false (21), fill-blank (3), ordering (1). Thiếu multiple-choice, matching, drag-drop, classify, image-choice, audio-choice, math-expression. | `node qa/run-one.mjs qa/lesson-types.mjs` → `typesNotEncountered` 9 loại. | `src/data/*Curriculum.ts`, `src/services/sessionComposer.ts` | Giảm tính hấp dẫn, không kiểm tra được đầy đủ component question. |
| **B-11** | **Competition Hub ("Đấu Trường") không có entry point dành cho bé** — chỉ truy cập qua Parent Dashboard. | Golden path probe dùng `openCompetitionHub()` qua parent gate. | `src/App.tsx`, `src/components/world/WorldMapScreen.tsx`, `src/components/competition/CompetitionHubScreen.tsx` | Spec T09B yêu cầu "Đấu Trường" trên bản đồ/nav. Chưa merge entry point. |

---

## P3 — Lỗi nhỏ, polish, nội dung

| ID | Mô tả | Cách tái hiện | File liên quan | Ghi chú |
|---|---|---|---|---|
| **B-12** | **Ít nhất 1 câu competition multiple-choice có < 3 options** (validator chỉ báo aggregate). | `node qa/run-one.mjs qa/p41-curriculum-quality.mjs` | `src/data/competitionQuestions.ts` | Cần scan toàn bộ ngân hàng competition. |
| **B-13** | **Reading Fluency: speed stages locked for new child (đúng thiết kế) nhưng UI không giải thích rõ**. | Golden path → `lockedStageButtons: 4` | `src/components/reading/ReadingFluencyScreen.tsx` | Có thể thêm tooltip "Hoàn thành bước trước để mở". |
| **B-14** | **Parent Dashboard: demo banner không hiển thị cho profile thật** (test pass) nhưng text "DỮ LIỆU THỬ NGHIỆM" còn trong code. | `node qa/run-one.mjs qa/golden-path.mjs` → `hasDemoBanner: false` (pass). | `src/components/parent/ParentDashboardModal.tsx` | Dọn code chết nếu không dùng. |
| **B-15** | **Tiếng Việt: một số câu audio-choice/audio-prompt thiếu file âm thanh thực (chỉ có text)**. | Kiểm tra ngân hàng Tiếng Việt `audioPrompt` fields. | `src/data/vietnamese/*` | Không block chạy (SpeechSynthesis fallback), nhưng trải nghiệm kém. |

---

## Tóm tắt chỉ số so với mục tiêu README

| Chỉ số | Mục tiêu | Thực tế | Trạng thái |
|---|---|---|---|
| Câu hỏi bài học | ≥ 1.300, mỗi bài ≥ 10 | 1.394 total, **26 bài < 10** | ❌ P0 (B-01) |
| Vần Tiếng Việt | ≥ 70 | ~45 (đếm skill vn_rhyme_*) | ⚠️ Cần kiểm tra |
| Toán | Đến 100 + đo lường + thời gian + hình khối | Có (mathCurriculum) | ✅ |
| Truyện đọc | ≥ 36 | 36+ (readingContent) | ✅ |
| Môn học | 4 (Tiếng Việt, Toán, Tiếng Anh, Em & Cuộc sống) | 4 | ✅ |
| Trò chơi | 28, nội dung đúng, có test | 28 mount OK, **1 game logic lỗi** | ⚠️ P1 (B-09) |
| Linh vật | Gấu Bút Chì SVG nhiều tư thế | Có (Mascot component) | ✅ |
| Hệ thưởng | Sao + sticker + level + nhiệm vụ + lịch | Có | ✅ |
| Tải trang (main chunk) | ≤ 450 kB gzip | **525 kB (131 kB gzip)** | ❌ P0 (B-02) |
| Offline PWA | Hoàn toàn offline | Pass (offline-pwa.mjs) | ✅ |
| Console errors | 0 | 0 (golden-path, games, offline) | ✅ |
| Nút ≥ 44px, chữ bé ≥ 14px | Pass | Pass (responsive-a11y) | ✅ |

---

## Quyết định cho T20B

1. **P0 (B-01, B-02)** — Phải sửa trước khi release. B-01 cần content writers bổ sung ~150+ câu hỏi. B-02 cần refactor code-splitting.
2. **P1 (B-03–B-07)** — Phải sửa. B-03, B-04, B-05 là regression mobile/a11y. B-06, B-07 là logic/content validation.
3. **P2 (B-08–B-11)** — Nên sửa trong T20B. B-11 (Competition entry point) là feature thiếu theo spec T09B.
4. **P3 (B-12–B-15)** — Dọn dẹp sau T20B hoặc task riêng.

---

## File sản xuất T20A

- `docs/opencode/reports/T20A_BUGS.md` — bản này
- `docs/opencode/reports/T20_sample_questions.md` — 50 câu ngẫu nhiên × 4 môn (1.607 dòng)
- `docs/opencode/reports/T20A_REPORT.md` — báo cáo tổng hợp (file riêng)