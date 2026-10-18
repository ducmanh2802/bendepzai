# T14C — Bổ sung test cho T07, T08, T09A, T09B, T14A — BÁO CÁO

## Tổng quan
Thực hiện đầy đủ task T14C: bổ sung **35 test mới** (616 → 651, đều PASS),
sửa **3 lỗi thật** do test mới phát hiện, gộp 2 file alias trùng về một nguồn
duy nhất. Không xoá/sửa/yếu bất kỳ test cũ nào.

## File thay đổi

### Code sửa (lỗi thật do test mới lộ ra)
- **src/services/storage.ts**
  - Thêm helper `isRealDateKey` (regex + round-trip `parseDateKey`/`localDateKey`):
    ngày không tồn tại như `2026-13-99`, `2026-02-30` giờ bị loại.
  - Áp dụng cho 4 chỗ dùng regex lỏng lẻo trước đây: `sanitizeGameFirstSeen`
    (T08), `getTreeWateredDate`/`setTreeWateredDate` (T01B), `getReviewCompletedDays`.
- **src/services/readingEngine.ts** — `recordParentRating` giờ idempotent theo
  từng passage: chấm lại chỉ cập nhật, không append trùng vào `selfReadRatings`
  (khớp ngữ nghĩa `StorageService.saveReadingParentRating`). Trước đây chấm lại
  cùng passage 2 lần tạo 2 phần tử trùng (mảng phình vô hạn, đếm trùng).
- **src/services/contentValidator.ts** — vòng lặp `subjectDifficulty` có guard
  `if (!subjectDifficulty[q.subject]) … = new Set()`: môn mới/tương lai không
  bao giờ crash gate bằng `undefined.add(...)`.
- **Xoá `src/adapters/readingAdapter.ts`, `src/utils/readingAdapter.ts`**
  (cả 2 thư mục giờ trống nên cũng xoá luôn): grep toàn repo xác nhận không
  file nào import 2 alias này — `ReadingFluencyScreen.tsx` import trực tiếp từ
  `src/services/readingAdapter.ts`, là nguồn duy nhất còn lại.

### Test mới
- **tests/t14c-storage.test.ts** (16 test)
  - T07: legacy thiếu field vẫn nạp + giữ nguyên xp/sao/vé/bài đã xong; rác
    `lessonStars`/`chestState` bị lọc, entry hợp lệ giữ lại; học lại bài không
    nhân sao/vé; rương đã nhận không nhận lại, bài chưa xong không nhận được;
    `unlockAllLessons` round-trip.
  - T08: thiếu key → seed baseline 18 game (không NEW); rác ngày bị lọc;
    game mới thấy lần đầu NEW + ngày đầu không bị ghi đè; nhãn NEW đúng 7 ngày
    (ngày 7 NEW, ngày 8 hết); seed first-seen không đụng sao/vé.
  - T09A: CRUD grade 😀/😐/🙁 qua 3 alias; grade rác/bỏ qua; chấm lại cập nhật
    không trùng; payload cũ chỉ có `parentGrades` vẫn nạp; sanitizer lọc rác.
  - Date-key nghiêm ngặt: tree-water + review-days loại ngày không tồn tại.
- **tests/t14c-logic.test.ts** (19 test)
  - T08: không trùng id (NFC); mọi game resolve component, id lạ → null;
    `REALTIME_GAME_IDS` là tập con catalog; `LAUNCHABLE` khớp catalog;
    mọi game có `skillIds` + chữ hiển thị.
  - T09A: adapter giữ nguyên id/subject/skill/options/đáp án đúng, đáp án nằm
    trong options; 4 alias là cùng 1 hàm; `recordParentRating` + 2 alias.
  - T14A: blueprint thi đấu chỉ dùng 3 môn; engine **từ chối** môn `cuoc-song`
    (throw, không chấm sai); validation 0 error + 4 môn đều có difficulty 3;
    `toPraiseSubject('cuoc-song') → VIETNAMESE` + bất biến `ttsText === text`;
    `ALL_TOPICS`/skills bao phủ đủ 4 môn.
  - T09B: cùng blueprint+seed → đề giống hệt; đề đúng môn, không trùng câu;
    `gradeAnswer` thuần nhất (mode Bé/Thi thật chỉ là hiển thị).

## Số liệu trước/sau
| Chỉ số | Trước | Sau |
|---|---|---|
| Test | 616 | **651** (+35) |
| `npm run typecheck` | PASS | PASS |
| `npm test` | PASS | **43 file / 651 test PASS** |
| `npm run build` | PASS | PASS (chunk chính ~411 kB) |

## Lệnh đã chạy + kết quả
- `npm run typecheck` — PASS (sửa 1 lỗi type `as unknown as ExamBlueprint` trong test).
- `npm test` — lần 1: 648/649 (1 fail chính là bug `2026-13-99` → sửa code,
  không sửa test); lần 2: **651/651 PASS**.
- `npm run build` — PASS.
- QA trình duyệt: best-effort, SKIPPED (thay đổi là logic thuần + test, không
  đổi UI; không chạy `playwright install` theo luật).

## Quyết định tự đưa ra
1. Test fail vì bug thật (`2026-13-99` lọt sanitizer) → **sửa code**, giữ nguyên
   test (đúng yêu cầu task).
2. `recordParentRating` (engine) chọn ngữ nghĩa idempotent giống storage thay vì
   giữ lịch sử append — vì hàm engine hiện chưa có caller nào trong `src`, đổi
   an toàn và tránh đếm trùng.
3. Sửa luôn 3 chỗ regex ngày lỏng lẻo ngoài phạm vi T08 (tree-water, review-days)
   vì cùng một lỗi, cùng một helper — ghi rõ ở đây.
4. Xoá cả thư mục `src/adapters/`, `src/utils/` (trống sau khi gộp alias, git
   không track thư mục trống nên tree sạch).
5. Không đổi hành vi `completeLesson(..., 'cuoc-song', ...)` dồn vào quest
   `lesson_english` (phát hiện thêm, ngoài phạm vi T14C): cần thêm loại quest mới
   + UI, để dành T18. Ghi nhận ở "Việc còn tồn".

## Việc còn tồn
- Quest ngày chưa có loại riêng cho môn `cuoc-song` (đang dồn vào quest English).
- Nút pause game real-time vẫn là UI toggle (đã ghi từ T08, chưa làm).
