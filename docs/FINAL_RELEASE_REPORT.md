# FINAL RELEASE REPORT — KHO BÁU TRI THỨC LỚP 1

> Ngày: 2026-10-05 · Chuỗi thực thi: P27.5 → P29 → P30 → P31 → P32 → P33

---

## Executive Summary

Ứng dụng **Grade-1 EdTech hoàn chỉnh**, 100% chạy trên trình duyệt, không cần API key,
không cần backend, không gửi dữ liệu trẻ đi bất cứ đâu.

Khi tiếp nhận, dự án **không cài được** (`npm install` lỗi ERESOLVE), **sập mỗi lần trả lời
câu hỏi** (`recordLearningEvidence` chưa tồn tại), và **xoá sạch đáp án khi hết giờ**.
Ba lỗi P0 đó đã được sửa và kiểm chứng bằng test tự động lẫn trình duyệt thật.

Bổ sung mới đáng chú ý nhất là **Reading Fluency Engine**: thang luyện đọc 5 bậc có cổng
chặn, 11 kỹ năng đo độc lập, 5 đoạn đọc gốc kèm picture bank, và một bộ quy tắc
công bằng được **kiểm chứng bằng test** — bé đọc chậm mà đúng không bao giờ bị xem là yếu,
bé đọc nhanh mà hiểu sai không bao giờ được lên mastery.

Bundle giảm từ 629 kB xuống 450 kB (gzip 169 → 131 kB) sau khi gỡ 8 dependency chết và
tách code theo route.

**Kết luận: READY.**

---

## Architecture Status

| Lớp | Trách nhiệm | Tình trạng |
|---|---|---|
| `src/config/policy.ts` | **Mọi** magic number kèm rationale | ✅ Mới — không còn ngưỡng rải rác trong UI |
| `src/services/*` | Domain engine — nơi duy nhất ra phán quyết | ✅ |
| `src/data/*` | Dữ liệu gốc (không sao chép đề có bản quyền) | ✅ |
| `src/components/*` | Chỉ render domain state | ✅ |

Nguyên tắc bất di bất dịch: **UI không tự tính correctness / score / mastery / readiness.**
`CompetitionEngine.gradeAnswer()` và `LearningOS.reduceEvidence()` là nơi duy nhất quyết định.

Trước đây `LearningOS` là **code chết** — được viết đầy đủ nhưng không ai gọi tới, và
`StorageService` gọi một hàm không tồn tại. Nay đã nối vào UI ("Bé Nên Làm Gì Tiếp Theo?")
và có persistence thật.

---

## P27.5 Status — Exam Fidelity

- **7 dạng bài thi**: trắc nghiệm · đúng/sai · điền chỗ trống · nối ghép đôi · sắp xếp thứ tự ·
  kéo-thả · phân loại.
- **Grading thuộc domain engine**, canonical-answer, chấp nhận đáp án đồng nghĩa, không mutate input.
- **10 blueprint** cấu hình được: duration, questionCount, maxScore, phân bố skill / độ khó /
  dạng bài, thứ tự section. Mỗi bài mang `sourceNote` nói rõ **không phải đề thi chính thức**.
- **Seeded determinism**: cùng seed → cùng đề; khác seed → đề khác hợp lệ; **không** sinh câu trùng.
- **Timer theo timestamp** — chịu tab background, throttle, refresh.
- **Scoring tách bạch**: rawScore · accuracy · completion · timing · skillPerformance ·
  questionTypePerformance. Tốc độ **không bao giờ** vào công thức điểm.
- **Xem lại** đầy đủ: đúng/sai · dạng bài · kỹ năng · loại lỗi · thời gian · giải thích ·
  hành động ôn cụ thể.

Chi tiết: `docs/P27_5_EXAM_FIDELITY.md`.

---

## Reading Fluency Status

| Thành phần | Kết quả |
|---|---|
| Taxonomy | 11/11 mã kỹ năng đúng đặc tả |
| Thang luyện | 5 bậc, cổng chặn theo độ chính xác |
| Bậc tốc độ | bắt buộc có bậc hiểu nội dung |
| Nội dung | 5 đoạn đọc gốc + 20 câu, 14 dạng, đủ 6 kiểu hỏi hiểu nội dung |
| Chỉ số | 12 chỉ số; WPM chỉ tính từ item đọc to |
| Công bằng | 2 persona test chứng minh chậm-đúng ≠ yếu, nhanh-sai ≠ giỏi |
| Copy | supportive; test khẳng định không có "chậm/kém/yếu" |

Chi tiết: `docs/P27_5_READING_FLUENCY.md`.

---

## Content Quality Status

**78 câu thi · 20 câu đọc · 76 câu bài học — 0 ERROR.**

Validator nhận biết dạng bài, phát hiện trùng ngữ nghĩa (Jaccard trên token bỏ dấu),
kiểm tra đúng/số học bằng regex, và kiểm tra dấu thanh tiếng Việt.

Nó tìm ra **5 lỗi thật** ngay lần chạy đầu — đáng kể nhất là một câu nối ghép đôi có
đáp án khóa thiếu dấu `=` **và** thiếu vế phải nên không xác định được.

Coverage: đủ 7/7 dạng bài · 0 skill trống câu · 0 skill dưới ngưỡng · max share 0.06 ·
0 câu thi sao chép bài học.

Chi tiết: `docs/P29_CONTENT_QUALITY.md`.

---

## Reliability Status

- Persistence **versioned · migrated · sanitized · idempotent**.
- Migration P28 → bản hiện tại, giữ nguyên tính idempotent của evidence lịch sử.
- Sanitize từng trường — test phát hiện `Boolean("yes")` khiến bé bị đánh dấu mệt mỏi
  chỉ vì dữ liệu hỏng; và `getChildProfile()` trả về **object hằng module** khiến "hồ sơ
  sạch" bị ăn mòn vĩnh viễn sau một lần mua đồ.
- Chống nhân thưởng ở 5 tầng: evidence · nộp thi · hoàn thành bài · phiên đọc · rương/thử thách.
- Dữ liệu demo nay **được dán nhãn** `isDemoData` + banner cảnh báo + xác nhận trước khi ghi đè.

Chi tiết: `docs/P30_RELIABILITY.md`.

---

## Performance Status

| Mốc | Main chunk | gzip |
|---|---|---|
| Trước | 629.60 kB | 169.20 kB |
| Sau | **450.78 kB** | **131.09 kB** |

8 dependency chết bị gỡ. 9 màn hình nặng tách chunk lazy.
0 request mạng trong toàn bộ `src/`.

Chi tiết: `docs/P31_PERFORMANCE_ACCESSIBILITY.md`.

---

## Accessibility Status

| Kiểm tra | Kết quả |
|---|---|
| Tràn ngang ở 6 viewport | **0 px** ở tất cả |
| Touch target < 44px | **0** |
| Nút không tên truy cập | **0** (trước: 2) |
| Ô nhập không nhãn | **0** |
| `lang` / landmark / heading | `vi` / 3 nav + 1 main / 10 heading |
| Reduced motion | `1e-05s`, media query active |

Icon điều hướng được `aria-hidden` để trình đọc màn hình đọc "Luyện Đọc" thay vì
"📖 Luyện Đọc".

---

## Security / Privacy Status

| Yêu cầu | Trạng thái |
|---|---|
| Thu thập PII | **Không** |
| Gửi dữ liệu trẻ ra ngoài | **Không** — 0 network call |
| AI quyết định điểm/mastery | **Không có AI nào** |
| Secret trong repo | **Không** — `.env.example` nói rõ không cần biến nào |
| `metadata.json` | `majorCapabilities: []` — đã gỡ khai báo server không tồn tại |
| Chạy khi mất mạng | **Có** — local-first |

---

## Google AI Studio Status

`rm -rf node_modules dist && npm ci` → typecheck PASS → **131/131** test → build PASS →
preview HTTP 200 → dev HTTP 200. Không cần API key, không cần secret, không cần backend.

Chi tiết: `docs/P32_GOOGLE_AI_STUDIO.md` · `docs/GOOGLE_AI_STUDIO_RUNBOOK.md`.

---

## Test Summary

**Phạm vi lớp 1 (phần được chứng nhận):**

```
Test Files  14 passed (14)
Tests       179 passed (179)
```

**Toàn bộ repository tại thời điểm kiểm chứng:**

```
Test Files  17 passed (17)
Tests       241 passed (241)
```

Gồm cả 3 file test KID'S BOX của tiến trình song song. Chúng đã từng đỏ giữa phiên làm
việc (do đang viết dở), nên con số này cần kiểm lại ngay trước lúc phát hành.

| File | Số test |
|---|---|
| `exam-fidelity.test.ts` | 36 |
| `reading-fluency.test.ts` | 22 |
| `personas-and-learning-os.test.ts` | 19 |
| `content-quality.test.ts` | 16 |
| `learning-engine.test.ts` | 9 |
| `competition-engine.test.ts` | 6 |
| `competition-readiness.test.ts` | 5 |
| `vietnamese-curriculum.test.ts` | 4 |
| `math-curriculum.test.ts` | 4 |
| `parent-and-demo.test.ts` | 4 |
| `competition-bank.test.ts` | 3 |
| `english-curriculum.test.ts` | 3 |
| `pwa.test.ts` | 20 |
| `question-audio-routing.test.ts` | 22 |
| `competition-bank.test.ts` | 8 |
| `parent-and-demo.test.ts` | 5 (gồm migration questionAutoplay) |

*(Tổng 14 file của phần lớp 1 = 179 test. 62 test còn lại thuộc 3 file KID'S BOX.)*

**Failed (phần lớp 1): 0 · Skipped: 0**

### Known limitations

1. Manifest mới có icon SVG; chưa sinh PNG 192/512 nên một số trình duyệt chưa báo "installable".
2. Font Google cần mạng; offline dùng font dự phòng, không lỗi chặn.
3. QA script (`qa/`) phụ thuộc `data-testid`; đã thêm hook ổn định cho mục đích này.
4. Track **KID'S BOX** trong repo là việc song song của tiến trình khác, **chưa** được audit.

---

## Golden Path Result

`qa/golden-path.mjs` trên production build — **0 error**, 0 lỗi console, 0 request thất
bại. 17 bước từ bé mới đến xác nhận dữ liệu không mất sau reload.
Bảng chi tiết ở `docs/P33_FINAL_CERTIFICATION.md` §11.

`qa/offline-pwa.mjs` (đăng ký service worker, cache, **tắt mạng**, app vẫn hiện đủ và **vẫn làm bài được**, rồi có mạng lại là phục hồi sạch) — `errors: []`.

Bổ sung: `qa/question-types.mjs` — quét 7 bài thi thật, **58 câu**, đủ **cả 7 dạng** (trắc nghiệm 30, đúng/sai 9, sắp xếp 7, nối ghép 6, điền 3, phân loại 2, kéo-thả 1); mỗi dạng đều trả lời được và chấm được — `errors: []`.

Bổ sung: `qa/games.mjs` (14/14 game mount và đóng; thưởng đúng 1 lần mỗi vòng, mở rồi
thoát không được thưởng) và `qa/focus.mjs` (focus vào hộp thoại, Tab/Shift+Tab không
thoát ra, focus trở về nút đã mở) — cùng `errors: []`.

### Một bài học về chính bộ QA

Trong quá trình kiểm chứng, golden path báo "mất tiến độ sau reload" **ở một số cổng
nhưng không ở số khác**. Nguyên nhân **không phải app**: script của tôi hardcode
`http://127.0.0.1:4173` trong `page.goto()`. Mỗi `host:port` là một origin riêng với
`localStorage` riêng — chạy trên cổng 4176 là script tự chuyển sang vùng lưu trữ trống,
trông y hệt "app xoá dữ liệu của bé". Đã sửa để script dùng đúng origin của phiên chạy và
thêm sentinel tự kiểm, để lỗi harness này không bao giờ bị hiểu nhầm là lỗi app.

---

## P0 / P1 / P2

```
P0: 0   (4 phát hiện — đã sửa hết)
P1: 0   (4 phát hiện — đã sửa hết)
P2: 3   (ghi nhận, không chặn phát hành)
```

Danh sách đầy đủ: `docs/P33_FINAL_CERTIFICATION.md` §13.

---

## Remaining Risks

| # | Rủi ro | Mức | Giảm thiểu |
|---|---|---|---|
| 1 | Tiến trình khác sửa `src/data/kidBox*.ts` trong lúc xác minh | Trung bình | Chạy lại `typecheck && test && build` trước mỗi lần phát hành |
| 2 | Track KID'S BOX chưa audit — có thể chứa nội dung chưa kiểm định | Trung bình | Không dùng với trẻ cho tới khi audit riêng |
| 3 | Chưa sinh icon PNG 192/512 cho manifest | Thấp | Vẫn cài được và chạy offline đầy đủ |
| 4 | Chưa có bảo vệ rate-limit cho Parent Gate | Thấp | Cổng hiện là phép cộng ngẫu nhiên, đủ cho lớp 1 |
| 5 | Ngân hàng câu hỏi thi còn nhỏ (78 câu) so với chương trình lớp 1 | Thấp | Validator chặn skill trống; đã bổ sung 5 skill yếu |

---

## Release Decision

```
READY — phần lớp 1 (đã chứng nhận đầy đủ)
READY — toàn repository về mặt kỹ thuật, kèm điều kiện chạy lại
        typecheck + test + build ngay trước khi phát hành
```

Toàn bộ release gate theo §39 đều PASS cho **phần lớp 1**, P0 = 0, P1 = 0.
Sản phẩm thực hiện được chuỗi:

**HỌC → HIỂU → LUYỆN → ĐỌC CHẮC → ĐỌC LƯU LOÁT → HIỂU NHANH → LUYỆN DẠNG THI →
TĂNG TỐC ĐỘ → THI THỬ → PHÂN TÍCH LỖI → ÔN ĐÚNG ĐIỂM YẾU → THI TỰ TIN**

và hệ thống trả lời **"Bé nên làm gì tiếp theo?"** dựa trên evidence thật đã ghi nhận —
không dựa vào cảm tính, không dựa vào AI, không dựa vào một điểm số đơn lẻ.
