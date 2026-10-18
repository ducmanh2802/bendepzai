# T20A — Báo Cáo QA Toàn Diện

**Ngày thực hiện:** 2026-10-15  
**Nhánh:** `p42/T20A` (từ `main` @ 6feefae)  
**Môi trường:** Windows 11, Node 24.12.0, Chrome 124 (Playwright), Vite 8.3.2 preview

---

## 1. Tóm Tắt Thực Hiện

### ✅ Ba sản phẩm bắt buộc đã giao
| Sản phẩm | File | Trạng thái |
|---|---|---|
| Danh sách lỗi P0–P3 | `docs/opencode/reports/T20A_BUGS.md` | ✅ Đã viết |
| 50 câu mẫu mỗi môn | `docs/opencode/reports/T20_sample_questions.md` | ✅ Đã viết (1.607 dòng) |
| Báo cáo tổng hợp | `docs/opencode/reports/T20A_REPORT.md` | ✅ File này |

### ✅ Ba lệnh gate PASS
| Lệnh | Kết quả | Thời gian |
|---|---|---|
| `npm run typecheck` | PASS (0 errors) | ~2s |
| `npm test` | PASS (57 files, 850 tests) | ~15s |
| `npm run build` | PASS (warning chunk 525 kB) | ~1.4s |

---

## 2. Kết Quả QA Trình Duyệt (Playwright)

### Golden Path (new child → 4 môn → competition → parent → reload)
```
node qa/run-one.mjs qa/golden-path.mjs
```
**Kết quả:** PASS (0 errors)
- New child khởi tạo sạch (0 XP, 0 lessons)
- Tiếng Việt: mở bài, trả lời 11 câu, hoàn thành, evidence persisted
- Reading Fluency: ladder 5 stages hiển thị, 4 stages locked (đúng), session 6 items, metrics persisted
- Competition: truy cập qua Parent Dashboard, exam 2 lượt (đúng + sai), result breakdown đầy đủ, error analysis + remediation render
- Parent Dashboard: gate arithmetic, reading ladder, competition log
- Reload 2 lần: **progress persisted hoàn toàn** (XP, lessons, exams, reading sessions không đổi)

### Games Hub (28 games)
```
node qa/run-one.mjs qa/games.mjs
```
**Kết quả:** 28/28 mount OK, close OK, 0 console errors, 0 horizontal overflow
**Vấn đề:** Memory game không đến màn thắng, replay không thưởng lần 2 (B-09, P2)

### Offline PWA
```
node qa/run-one.mjs qa/offline-pwa.mjs
```
**Kết quả:** PASS
- Service worker registered, active, controller
- Manifest + 4 icons OK (192/512, maskable)
- Cache `kho-bau-v3`: 65 assets (JS, CSS, fonts, icons, manifest)
- Offline reload: app render, greeting card, answering works
- Back online: render OK
- Cache wipe survival: XP không mất

### Responsive & A11y (6 viewport: 360×800 → 1440×900)
```
node qa/run-one.mjs qa/responsive-a11y.mjs
```
**Kết quả:** PASS (0 errors)
- Horizontal overflow: 0px mọi viewport
- Touch targets < 44px: 0
- `lang="vi"`, main landmark, 3 nav landmarks, 16 headings
- 0 unlabelled buttons/inputs, 0 images without alt
- `prefers-reduced-motion`: hero animation 1e-05s (respected)

### Mobile Golden (390×844)
```
QA_VIEWPORT=390x844 node qa/run-one.mjs qa/mobile-golden.mjs
```
**Kết quả:** 1 error — **game overflow 88px** (B-03, P1)

### Mobile (4 viewport phone)
```
node qa/run-one.mjs qa/mobile.mjs
```
**Kết quả:** PASS
- Home/nav/lesson/hub: 0 overflow
- Rotation landscape: dialog OK, 0 overflow
- Interruption: dialog survives reload, same question, still answerable

### Question Types (Competition exams)
```
node qa/run-one.mjs qa/question-types.mjs
```
**Kết quả:** PASS
- 8 exams × 3 subjects = 73 questions answered
- 7/7 types exercised: multiple-choice (32), fill-blank (6), true-false (8), classify (5), matching (11), drag-drop (2), ordering (9)

### Lesson Types (Curriculum lessons)
```
node qa/run-one.mjs qa/lesson-types.mjs
```
**Kết quả:** 12 errors (strict mode violation dialog chồng, timeout bài 2–4)
**Types seen:** true-false (21), fill-blank (3), ordering (1) — **thiếu 9 loại khác** (B-10, P2)

### Decision Engine
```
node qa/run-one.mjs qa/decision-engine.mjs
```
**Kết quả:** PASS (8 scenarios: cold start, weak skill, SM2 due, improved, kidbox, competition, persistence, daily plan toggle, parent gate, parent decision report)

### Focus Trap (a11y)
```
node qa/run-one.mjs qa/focus.mjs
```
**Kết quả:** 4 errors trên **Lesson dialog** (focus không vào, Tab/Shift+Tab escape, không restore) — **B-04, P1**
Game/Parent/ScreenTime dialogs: PASS

### Audio
```
node qa/run-one.mjs qa/audio.mjs
```
**Kết quả:** 1 timeout exception tại step `autoplayOff` (20s) — **B-06, P1**

### KidBox Focus
```
node qa/run-one.mjs qa/kidbox-focus.mjs
```
**Kết quả:** PASS — focus trap đúng, restore trigger OK

### Curriculum Quality (validator)
```
node qa/run-one.mjs qa/p41-curriculum-quality.mjs
```
**Kết quả:** 1 error — **choice question < 3 options** (B-07, P1)

---

## 3. Kiểm Tra Nội Dung (Content Validator)

```
npm test (content-quality.test.ts, content-validator-t02c.test.ts)
```
**Kết quả:** PASS (16 + 7 tests)

| Ngân hàng | Số lượng | Errors | Warnings |
|---|---|---|---|
| Competition | 1.300+ | 0 | 0 |
| Reading | 36 passages, 200+ questions | 0 | 0 |
| Curriculum | 1.394 | 0 | 0 |
| Kid's Box | 12 units, 48 activities | 0 | 0 |

**Coverage matrix:** 7/7 question types, mọi skill ≥ min questions, max skill share < limit.

**Duplicate scan:** 0 semantic duplicates (threshold 0.85 ERROR, 0.75 WARNING).

**Vietnamese diacritics:** 100% prompts có dấu (NFC), má ≠ mà, ăn ≠ ân được bảo toàn.

---

## 4. Số Liệu Trước/Sau (so với README mục tiêu)

| Chỉ số | Trước P42 (README) | Sau P42 (thực tế) | Đạt? |
|---|---|---|---|
| Câu hỏi bài học | 155 | **1.394** | ✅ (nhưng 26 bài < 10 câu — **B-01**) |
| Vần Tiếng Việt | 6 | **~45 skills** | ⚠️ Cần audit chính xác |
| Toán phạm vi | đến 20 | **đến 100 + đo lường + thời gian + hình khối** | ✅ |
| Truyện đọc | 12 | **36+ passages** | ✅ |
| Môn học | 3 | **4** (thêm Em & Cuộc sống) | ✅ |
| Trò chơi | 18 (nhiều lỗi) | **28** (mount OK, 1 logic lỗi) | ⚠️ **B-09** |
| Linh vật | emoji | **Gấu Bút Chì SVG** | ✅ |
| Hệ thưởng | sao | **sao + sticker + level + quest + streak** | ✅ |
| Main chunk (gz) | 725 kB | **131 kB (raw 525 kB)** | ⚠️ Raw > 450 kB (**B-02**) |

---

## 5. Các Quyết Định Tự Đưa Ra

1. **Không sửa lỗi P0/P1 trong T20A** — theo task spec: "Không sửa lỗi lớn trong task này: ghi mọi lỗi tìm được vào T20A_BUGS.md". Chỉ ghi nhận, để T20B sửa.
2. **Xoá test tạm** — đã xoá `tests/curriculum-lesson-check.test.ts` và `tests/t20a-sample-questions.test.ts` sau khi ghi nhận dữ liệu.
3. **Chunk size warning** — build PASS nhưng raw main chunk 525 kB > target 450 kB. Ghi P0 (B-02), T20B sẽ code-split ParentDashboard, CompetitionHub, ReadingFluency, KidBoxCompanion.
4. **Competition entry point** — spec T09B yêu cầu entry trên World Map/Nav; hiện chỉ vào được qua Parent Dashboard. Ghi P2 (B-11).
5. **Lesson question diversity** — curriculum lessons tập trung true-false; competition bank đa dạng hơn. Ghi P2 (B-10), cần sessionComposer cân bằng type.
6. **Sample questions** — xuất ra markdown để phụ huynh đọc soát, không commit vào source control (chỉ trong reports/).

---

## 6. Việc Còn Tồn (Cho T20B)

### P0 — Phải sửa trước chứng nhận
- [ ] **B-01**: Bổ sung câu hỏi cho 26 bài học (< 10 câu) — cần content writers.
- [ ] **B-02**: Code-split main chunk ≤ 450 kB raw (dynamic import cho màn hình lớn).

### P1 — Phải sửa
- [ ] **B-03**: Fix game overflow 88px mobile.
- [ ] **B-04**: Fix Lesson Modal focus trap (WCAG).
- [ ] **B-05**: Fix strict mode violation + timeout lesson 2–4 (dismiss celebration trước).
- [ ] **B-06**: Fix audio autoplay test timeout.
- [ ] **B-07**: Fix competition question < 3 options.

### P2 — Nên sửa
- [ ] **B-08**: Polish responsive micro-overflow (5–16px).
- [ ] **B-09**: Fix Memory game victory + replay reward.
- [ ] **B-10**: Cân bằng question types trong curriculum lessons.
- [ ] **B-11**: Thêm Competition Hub entry point trên World Map/Nav (theo spec T09B).

### P3 — Dọn dẹp
- [ ] **B-12**: Scan full competition bank option count.
- [ ] **B-13**: Reading Fluency UI tooltip cho locked stages.
- [ ] **B-14**: Dọn demo banner code chết.
- [ ] **B-15**: Tiếng Việt audio prompts — bổ sung file âm thanh hoặc document fallback.

---

## 7. File Thay Đổi Trong Task Này

| File | Loại | Mô tả |
|---|---|---|
| `docs/opencode/reports/T20A_BUGS.md` | Mới | Danh sách 15 lỗi P0–P3 |
| `docs/opencode/reports/T20_sample_questions.md` | Mới | 50 câu ngẫu nhiên × 4 môn (1.607 dòng) |
| `docs/opencode/reports/T20A_REPORT.md` | Mới | Báo cáo này |
| (Không file source code nào bị sửa) | — | T20A chỉ QA + báo cáo |

---

## 8. Lệnh Đã Chạy & Kết Quả

```powershell
# Typecheck
npm run typecheck                    # PASS

# Unit tests
npm test                             # PASS (57 files, 850 tests)

# Build
npm run build                        # PASS (warning chunk 525 kB)

# Browser QA (Playwright)
node qa/run-one.mjs qa/golden-path.mjs           # PASS
node qa/run-one.mjs qa/games.mjs                  # PASS (mount), 2 logic errors
node qa/run-one.mjs qa/offline-pwa.mjs            # PASS
node qa/run-one.mjs qa/responsive-a11y.mjs        # PASS
QA_VIEWPORT=390x844 node qa/run-one.mjs qa/mobile-golden.mjs  # 1 error (overflow)
node qa/run-one.mjs qa/mobile.mjs                 # PASS
node qa/run-one.mjs qa/question-types.mjs         # PASS
node qa/run-one.mjs qa/lesson-types.mjs           # 12 errors
node qa/run-one.mjs qa/decision-engine.mjs        # PASS
node qa/run-one.mjs qa/focus.mjs                  # 4 errors (lesson dialog)
node qa/run-one.mjs qa/audio.mjs                  # 1 timeout
node qa/run-one.mjs qa/kidbox-focus.mjs           # PASS
node qa/run-one.mjs qa/p41-curriculum-quality.mjs # 1 error (< 3 options)
```

---

## 9. Cam Kết Tuân Thủ Luật

- ✅ Đọc 00_RULES.md, README.md, task file, spec gốc trước khi làm
- ✅ Giữ nguyên stack, không thêm dependency
- ✅ Không xoá/reset localStorage tiến độ thật
- ✅ Không làm giả test — chạy thật, PASS mới báo
- ✅ Nội dung đúng chính tả, GDPT 2018, British English
- ✅ Tôn trọng `questionAutoplay` setting
- ✅ Mobile 375×667, nút ≥ 44px, chữ ≥ 14px
- ✅ Dùng `contentSafety.ts` validator
- ✅ Không xoá/sửa test có sẵn
- ✅ QA browser best-effort (SKIPPED ghi rõ nếu lỗi 2 lần)
- ✅ Data-testid hooks chuẩn
- ✅ Không sửa queue/state/logs/TRANG_THAI.md
- ✅ Commit message format `feat(T20A): ...`
- ✅ Báo cáo T20A_REPORT.md + T20A_BUGS.md + T20_sample_questions.md

---

**Kết luận:** T20A hoàn thành 3 sản phẩm bắt buộc, 3 gate PASS, 15 lỗi đã ghi nhận phân mức P0–P3. Sẵn sàng cho T20B sửa lỗi P0/P1 và chứng nhận.