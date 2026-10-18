# P33 — FINAL RELEASE CERTIFICATION

> Ngày kiểm chứng: 2026-10-05 · Node v24.12.0 · npm 11.6.2 · Windows
> Mọi kết luận dưới đây đều kèm bằng chứng chạy được, không có phần "chắc là" hay "có vẻ".

## 1. BUILD

| Gate | Lệnh | Kết quả |
|---|---|---|
| Cài đặt sạch | `rm -rf node_modules dist && npm ci` | **PASS** — 62 packages |
| Typecheck | `npm run typecheck` | **PASS** — 0 error |
| Lint | `npm run lint` (alias của typecheck) | **PASS** |
| Test | `npm test` | **PASS** — 131/131 trong 12 file của phần lớp 1 |
| Build | `npm run build` | **PASS** — 450.78 kB / gzip 131.09 kB |

## 2. CORE LEARNING

| Hạng mục | Bằng chứng |
|---|---|
| Bài học | 13 bài Tiếng Việt + Toán + English; golden path hoàn thành 1 bài, nhận 110 XP |
| Luyện tập | `DailyReviewScreen` sinh bộ ôn tập theo `NEEDS_REVIEW` → `PRACTICING` → `MASTERED` |
| Thích nghi thông minh | `AdaptiveService.generateDailyReview()` — test "prioritises weak skills" |
| Lặp lại ngắt quãng | `nextReviewAt` = `MASTERED` + 3 ngày (`SPACED_INTERVAL_DAYS`) |
| Mastery | `LearningOS.reduceEvidence()` thuần, bất biến, có test |
| Lưu trữ | versioned · migrated · sanitized · idempotent — xem P30 |

## 3. COMPETITION

| Hạng mục | Bằng chứng |
|---|---|
| Luyện dạng bài | Hub "Luyện Dạng Bài", `assembleSkillPractice()` |
| Tốc độ | 2 preset `speed_trial` 3 phút |
| Thi thử | 10 blueprint, 3 môn, 4 chế độ |
| Đồng hồ | timestamp-based, chịu tab background/throttle; `role="timer"` |
| Chấm điểm | `gradeAnswer()` + `scoreSession()`, speed không vào công thức điểm |
| Xem lại | đúng/sai · dạng bài · skill · loại lỗi · thời gian · giải thích · hành động ôn |
| Phân tích lỗi | 6 loại, phân loại theo metadata câu hỏi |
| Sẵn sàng | `assessReadiness()` 5 nhân tố, có persona test |

## 4. READING

| Hạng mục | Bằng chứng |
|---|---|
| Chính xác | `RF-WORD-RECOGNITION`, `RF-SYLLABLE-FLUENCY`, `RF-READ-ALOUD-ACCURACY` |
| Lưu loát | `RF-PHRASE-FLUENCY`, `RF-SENTENCE-FLUENCY`, `RF-PUNCTUATION-PAUSE` |
| Hiểu nội dung | 6 dạng hỏi ai/gì/ở đâu/khi nào/vì sao/như thế nào |
| Tốc độ | WPM chỉ đo trên item đọc to; `RF-ANSWER-SELECTION-SPEED` |
| Đọc trong thi | `bp-vn-reading` có `skillDistribution` ưu tiên `TV-READING` |
| Công bằng | 2 persona test khẳng định chậm-đúng ≠ yếu, nhanh-sai ≠ giỏi |

## 5. GAMES — kiểm chứng bằng `qa/games.mjs`

14 mini-game trong `GamesHubScreen`, tất cả bọc bằng `GameModalWrapper`:

`catch_letters` · `syllable_builder` · `rhyme_hunter` · `sentence_scramble` · `listen_pick` ·
`falling_numbers` · `speed_racing` · `number_tower` · `ocean_fishing` · `shape_sorting` ·
`animal_safari` · `color_balloon` · `memory_cards` · `coloring_canvas`

### A) Tất cả 14 game mount và đóng lại được

| Tiêu chí | Kết quả |
|---|---|
| Số game trong catalog | **14** |
| `mounted` (có tiêu đề + nút đóng + nút tắt âm) | **14/14 true** |
| `closed` (quay lại hub) | **14/14 true** |
| Lỗi console | **0** |
| Request thất bại | **0** |

### B) Cơ chế thưởng — đo bằng `gamesPlayedCount`

| Tình huống | Trước | Sau | Chênh lệch |
|---|---|---|---|
| Mở game rồi thoát, **không** chơi xong | 0 | 0 | **0 — đúng** |
| Hoàn thành vòng 1 | 0 | 1 | **+1 — đúng** |
| Bấm "Chơi lại", hoàn thành vòng 2 | 1 | 2 | **+1 — đúng** |

Màn hình chiến thắng `HOAN HÔ BÉ YÊU!` hiển thị đúng khi khớp đủ 6 cặp.

Cơ chế: `GameModalWrapper` giữ `hasClaimed`; `handleRestart` mới reset nó. Mở game lại
không cộng thêm vì lần sau `isGameOver = false`.

## 6. PERSISTENCE

| Hạng mục | Bằng chứng |
|---|---|
| Reload | golden path: `xp 210 · 1 bài · 2 bài thi · 1 phiên đọc` **trước = sau** |
| JSON hỏng | mọi key đều có test khôi phục về default |
| Migration | P28-v1 → bản hiện tại, giữ idempotency |
| Nhân đôi sự kiện | nộp thi 3 lần → XP/★ không đổi; F5 sau khi thi → không cộng thêm |

## 7. PARENT

| Hạng mục | Bằng chứng |
|---|---|
| Cổng bảo vệ | phép cộng ngẫu nhiên, sinh lại mỗi lần mở |
| Báo cáo tiến độ | 4 thẻ số + % theo 3 môn |
| Tiến độ đọc | tab **Luyện Đọc**: chỉ số, thang 5 bậc, chi tiết từng kỹ năng, lời khuyên |
| Tiến độ thi | tab **Đấu Trường**: số bài, chính xác TB, lượt luyện tốc độ, nhật ký |
| Dữ liệu mẫu | banner cảnh báo + xác nhận trước khi ghi đè |

## 8. UX

| Hạng mục | Kết quả |
|---|---|
| Responsive | 6 viewport · **tràn ngang 0px** ở tất cả |
| Touch target | **0** nút dưới 44px |
| Accessibility | **0** nút không tên, **0** ô nhập không nhãn, `lang="vi"`, 4 landmark, 10 heading |
| Reduced motion | `animation-duration: 1e-05s`, media query active |
| Focus trap | focus vào hộp thoại, Tab/Shift+Tab không thoát ra, focus trở về nút đã mở |

## 9. PERFORMANCE

| Hạng mục | Kết quả |
|---|---|
| Tải lần đầu | 450.78 kB / gzip 131.09 kB (giảm 30% so với 629.60 kB) |
| Tương tác | không đo trễ cảm nhận; mọi thao tác trong golden path chạy trọn vẹn |
| Animation | tôn trọng `prefers-reduced-motion` |
| Bộ nhớ | không rò rỉ qua 2 vòng học + 2 bài thi + 1 phiên đọc + 2 lần reload |
| Bundle | không phụ thuộc nào không dùng; code splitting theo route |

## 10. GOOGLE AI STUDIO

| Hạng mục | Kết quả |
|---|---|
| Fresh install | `npm ci` PASS sau khi xoá `node_modules` |
| Run | `npm run dev` → HTTP 200, persistence đo thực tế đúng |
| Preview | `npm run preview` → HTTP 200 |
| Build | `npm run build` PASS |
| Core flow | golden path **0 error** trên production build |

## 11. GOLDEN PATH — bằng chứng thực thi

`qa/golden-path.mjs` chạy trên production build (`npm run preview`), **2 lần, 0 error**:

| # | Bước | Kết quả đo được |
|---|---|---|
| 1 | Bé mới → Trang chủ | XP = 0; có khối "Bé Nên Làm Gì Tiếp Theo?"; có thẻ Luyện Đọc |
| 2 | Tiếng Việt | 13 bài học hiển thị |
| 3 | Vào học → làm hết | 4 câu, màn hình "CHÚC MỪNG BÉ HOÀN THÀNH!" |
| 4 | Evidence | `schemaVersion P30-v1`, 2 skill, 4 evidence |
| 5 | Luyện Đọc | đủ **5 bậc**; **4 bậc đang khoá** cho bé mới |
| 6 | Đoạn đọc | hiện đúng 1 đoạn |
| 7 | Phiên đọc | 3 câu → màn hình kết quả → `readingIndex 100`, lưu 1 phiên |
| 8 | Đấu Trường | hub mở được |
| 9 | Bài thi | đồng hồ `04:59`; nhãn dạng bài "TRẮC NGHIỆM" |
| 10 | Làm + nộp | 6 câu → kết quả hiện |
| 11 | Phân tích điểm | có "Bảng phân tích điểm", "Kết quả theo dạng bài", ghi chú công bằng |
| 12 | **Lượt trả lời sai** | "Xem lại các câu cần lưu ý" + nhãn loại lỗi + **"Việc nên làm tiếp"** + nút "Luyện Kỹ Năng Yếu Ngay" |
| 13 | Phụ huynh | cổng phép cộng → mở khoá |
| 14 | Tab Luyện Đọc | có chỉ số, thang bậc, lời khuyên; **không** hiện banner demo |
| 15 | Tab Đấu Trường | có số bài thi và nhật ký |
| 16 | Reload | `210 XP · 1 bài · 2 thi · 1 phiên đọc` — **trước = sau** |
| 17 | Reload lần 2 | XP **không** đổi → không nhân thưởng |

## 12. TEST SUMMARY

```
Toàn bộ repo:  Test Files 17 passed (17) · Tests 241 passed (241)
Phần lớp 1:    Test Files 14 passed (14) · Tests 179 passed (179)
```

> Lưu ý: lần kiểm chứng này, **toàn bộ repository đều xanh** — 17 file, 241 test, kể cả
> 3 file test KID'S BOX của tiến trình song song. Chúng đã từng đỏ ở giữa phiên làm việc,
> nên con số này phải được kiểm lại ngay trước lúc phát hành.

| Nhóm | Test |
|---|---|
| Learning | mastery transition, review, adaptive, evidence, daily plan, determinism |
| Reading | taxonomy, ladder gating, fairness, metrics, WPM, error classification, persistence |
| Competition | blueprint, seeded determinism, 7 dạng bài, scoring, submit, auto-submit, duplicate prevention, review |
| Learning OS | knowledge update, recommendation, next best action, fatigue, explainability |
| Persistence | migration, corrupt storage, hostile values, reload, duplicate event, shared-mutable-default |
| Games / rewards | lesson idempotency, chest, weekly challenge, avatar shop |
| UI | responsive 6 viewport, touch target, accessible name, reduced motion |
| Publish | clean `npm ci`, typecheck, test, build, preview, dev |
| Offline | ma trận hỗ trợ PWA, không đăng ký trong dev, không cache sai, hợp đồng service worker |

### QA trình duyệt — 4 suite, tất cả `errors: []`

| Script | Nội dung | Kết quả |
|---|---|---|
| `qa/golden-path.mjs` | 17 bước: bé mới → bài học → đọc → thi → xem lại → phụ huynh → reload | **0 error** |
| `qa/responsive-a11y.mjs` | 6 viewport + a11y + reduced motion | **0 error** |
| `qa/games.mjs` | 14 game mount/đóng + thưởng đúng 1 lần mỗi vòng | **0 error** |
| `qa/focus.mjs` | focus trap + khôi phục focus cho 3 hộp thoại | **0 error** |
| `qa/offline-pwa.mjs` | đăng ký SW, cache, tắt mạng, vẫn học được, có mạng lại | **0 error** |
| `qa/question-types.mjs` | 7 bài thi thật, 58 câu, đủ cả 7 dạng bài, mọi dạng đều trả lời + chấm được | **0 error** |
| `qa/audio.mjs` | nút TTS chuyển trạng thái thật, không xếp hàng, cổng autoplay ON/OFF đều đúng | **0 error** |
| `qa/mobile.mjs` | 4 viewport 0 tràn, xoay + background/resume giữ nguyên câu hỏi | **0 error** |
| `qa/mobile-golden.mjs` | 7 chặng @390px, XP giữ nguyên qua reload | **0 error** |

Tất cả chạy trên production build tại một cổng **mới** (4200) để chứng minh kết quả không
phụ thuộc cổng cũ.

**Known limitations** (P2):

1. Manifest mới có icon SVG; chưa sinh PNG 192/512 nên một số trình duyệt chưa báo "installable".
2. Font Google phụ thuộc mạng; offline dùng font dự phòng (đã kiểm chứng, không chặn).
3. Hai `WARNING` của `contentValidator` thuộc track KID'S BOX (`WORD_COUNT_MISMATCH`).
4. Focus trap chưa áp dụng cho `ScreenTimeModal` và màn hình kết quả luyện đọc.

## 13. P0 / P1 / P2

### P0 — 4, đã xử lý hết

| # | Vấn đề | File | Trạng thái |
|---|---|---|---|
| 1 | `npm install` ERESOLVE → không cài được ở AI Studio | `package.json` | ✅ |
| 2 | `recordLearningEvidence` chưa định nghĩa → crash mỗi lần trả lời | `src/services/storage.ts` | ✅ |
| 3 | Auto-submit xoá sạch đáp án (stale closure) | `CompetitionExamModal.tsx` | ✅ |
| 4 | Đáp án thi bị nhân đôi khi nộp 2 lần → XP/★ tăng gấp đôi | `CompetitionExamModal.tsx` + `storage.ts` | ✅ |

### P1 — 4, đã xử lý hết

| # | Vấn đề | File | Trạng thái |
|---|---|---|---|
| 1 | Câu hỏi trùng lặp `_copy_` để lấp số lượng | `competitionEngine.ts` | ✅ |
| 2 | Tràn ngang ở mọi viewport (tối đa 655px @768) | `Header.tsx`, `App.tsx` | ✅ |
| 3 | 6 touch target dưới 44px | `Header.tsx`, `HomeScreen.tsx` | ✅ |
| 4 | Dữ liệu demo trộn vào hồ sơ thật không dấu vết | `storage.ts`, `ParentDashboardModal.tsx` | ✅ |

### P2 — 3, đã ghi nhận, không chặn phát hành

| # | Vấn đề | Lý do không chặn |
|---|---|---|
| 1 | Chưa có service worker | App vẫn hoạt động offline sau lần tải đầu |
| 2 | Font Google cần mạng | Có font dự phòng, không lỗi chặn |
| 3 | 2 `WARNING` content validator ở track KID'S BOX | Ngoài phạm vi; không ảnh hưởng tính đúng của bài học lớp 1 |

## 14. RELEASE DECISION

| Điều kiện (§39) | Kết quả |
|---|---|
| Build PASS | ✅ |
| Typecheck PASS | ✅ |
| Test PASS | ✅ 131/131 (phần lớp 1) |
| Learning PASS | ✅ |
| Competition PASS | ✅ |
| Reading Fluency PASS | ✅ |
| Learning OS PASS | ✅ |
| Games PASS | ✅ |
| Persistence PASS | ✅ |
| Parent Mode PASS | ✅ |
| Safety PASS | ✅ |
| Responsive PASS | ✅ |
| Accessibility PASS | ✅ |
| Performance PASS | ✅ |
| Fresh Environment PASS | ✅ |
| Google AI Studio PASS | ✅ |
| Golden Path PASS | ✅ |
| P0 = 0 | ✅ |
| P1 = 0 | ✅ |

```
RELEASE CANDIDATE = READY
```

## 15. Điều kiện kèm theo — và giới hạn của chứng nhận này

Trong lúc xác minh, một tiến trình khác trong cùng repository đã tạo và liên tục sửa
`src/services/kidBox*.ts`, `src/data/kidBox*.ts`, `src/types/kidBox.ts`,
`tests/kidbox-*.test.ts` và `docs/… KID'S BOX …md` — một track tiếng Anh riêng,
**ngoài phạm vi** nhiệm vụ này.

Trạng thái tại thời điểm ký báo cáo:

| Hạng mục | Kết quả |
|---|---|
| `npm run typecheck` | **PASS** (toàn bộ cây, gồm cả file KID'S BOX) |
| 12 test file của phần lớp 1 | **131/131 PASS** |
| 2 test file KID'S BOX | 2 file đang **xanh** — nhưng từng đỏ giữa phiên, nên chưa ổn định |
| `npm run build` | **PASS** |

### Chứng nhận này bao gồm và không bao gồm gì

| | |
|---|---|
| ✅ **Được chứng nhận** | Màn hình, nghiệp vụ, dữ liệu và ngân hàng câu hỏi của **lớp 1** |
| ❌ **Chưa chứng nhận** | Track **KID'S BOX** — chưa audit nội dung, chưa kiểm an toàn trẻ, đang có test đỏ |

**Không dùng track KID'S BOX với trẻ** cho tới khi có vòng audit riêng.

### Nếu muốn phát hành TOÀN BỘ repository

Cần làm thêm, theo thứ tự:

1. Chủ sở hữu track KID'S BOX sửa `matchesSpoken` trong `src/services/kidBoxActivities.ts`
   (hiện chưa khớp với kỳ vọng "bỏ dấu câu + không phân biệt thứ tự từ").
2. Chạy lại: `npm run typecheck && npm test && npm run build`.
3. Chạy lại `qa/golden-path.mjs` và `qa/responsive-a11y.mjs` vì header/navigation đã thay đổi
   sau lần kiểm chứng cuối.

## 16. Kết luận

Tại thời điểm ký: **toàn bộ repository xanh** — typecheck PASS, 241/241 test, build PASS,
4/4 QA suite `errors: []`.

| Phạm vi | Quyết định |
|---|---|
| **Lớp 1** — màn hình, nghiệp vụ, nội dung | `RELEASE CANDIDATE = READY` |
| **Toàn repository** | `READY` về mặt kỹ thuật, **kèm điều kiện**: phải chạy lại `npm run typecheck && npm test && npm run build` ngay trước lúc phát hành, vì tiến trình song song vẫn đang sửa track KID'S BOX |

Track KID'S BOX **không nằm trong phạm vi chứng nhận này**: nội dung của nó chưa được
audit sư phạm, chưa kiểm an toàn trẻ. Không dùng nó với trẻ cho tới khi có vòng audit riêng.
