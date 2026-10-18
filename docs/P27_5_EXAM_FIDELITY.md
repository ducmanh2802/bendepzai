# P27.5 — EXAM FIDELITY

> Nguồn sự thật: `src/services/competitionEngine.ts` · `src/types/competition.ts`
> Dữ liệu: `src/data/competitionQuestions.ts` · `competitionExamFormats.ts` · `competitionBlueprints.ts`

## 1. Ranh giới tuyên bố (§5, §11)

Ứng dụng **không** tuyên bố là "bản sao đề thi chính thứt". Mọi bộ đề đều mang
`sourceNote`:

> "Bộ đề luyện tập do ứng dụng tự soạn theo cấu trúc thi tiểu học — không phải đề thi chính thức."

Toàn bộ câu hỏi là nội dung gốc. Không scrape, không sao chép đề thi có bản quyền.

## 2. Question contract (§10)

```ts
interface CompetitionQuestion {
  id: string;
  subject: CompetitionSubject;
  topic: string;                        // bắt buộc — dùng cho coverage matrix
  skillId: string;                      // bắt buộc — không câu nào mồ côi
  questionType: CompetitionQuestionType;
  difficulty: CompetitionDifficulty;
  prompt: string;
  options: string[];
  correctAnswer: string;                // canonical, xem bên dưới
  acceptedAnswers?: string[];           // fill-blank: đáp án đồng nghĩa
  matchingPairs?: { left: string; right: string }[];
  orderingItems?: string[];
  categoryBuckets?: string[];
  explanation: string;
  estimatedSeconds: number;
  version: number;                      // truy vết nguồn gốc
}
```

### Mã hoá canonical của đáp án

Giữ mọi câu trả lời ở dạng **một chuỗi duy nhất** để persistence, idempotency và review
đều tất định:

| Dạng | Canonical | Ví dụ |
|---|---|---|
| multiple-choice / true-false | chuỗi đáp án | `Chữ Đ` |
| fill-blank | số/từ | `10` |
| ordering | các phần tử nối `\|` | `Bé\|Lan\|chăm chỉ\|học bài` |
| matching | ` trái=phải` nối `\|` | `ba=bố\|me=mẹ` |
| drag-drop / classify | **nhãn nhóm** | `con vật` |

## 3. Bảy dạng bài thi

| Dạng | Nhãn hiển thị | Cách trả lời | Có trong bank |
|---|---|---|---|
| `multiple-choice` | Trắc nghiệm | chọn 1 | ✅ |
| `true-false` | Đúng / Sai | chọn 1 | ✅ |
| `fill-blank` | Điền vào chỗ trống | chọn đáp án | ✅ |
| `matching` | Nối hình ghép đôi | chạm trái → chạm phải | ✅ |
| `ordering` | Sắp xếp thứ tự | chạm ô theo thứ tự | ✅ |
| `drag-drop` | Kéo thả vào nhóm | chọn từ → thả vào nhóm | ✅ |
| `classify` | Phân loại | chọn từ → chọn nhóm | ✅ |

UI chỉ render; **không dạng nào tự chấm điểm**.

## 4. Grading thuộc domain engine (§1.3)

```ts
CompetitionEngine.gradeAnswer(question, userAnswer): boolean
```

- Chuẩn hoá khoảng trắng + `toLocaleLowerCase('vi')`.
- Chấp nhận `acceptedAnswers` cho fill-blank.
- **Không mutate** câu hỏi (có test).
- Điểm của phiên luôn tính lại từ đáp án: `scoreSession` bỏ qua cờ `isCorrect` do UI gửi lên.
  `tests/exam-fidelity.test.ts` có một test cố tình nói dối `isCorrect: true` với đáp án sai và
  khẳng định engine vẫn chấm đúng.

## 5. Blueprint cấu hình được (§11)

```ts
interface ExamBlueprint {
  durationSeconds, questionCount, maxScore,
  skillDistribution?,            // skillId -> số câu
  difficultyDistribution?,       // share (tổng = 1)
  questionTypeDistribution?,     // share (tổng = 1)
  sections?,                     // thứ tự phần thi
  sourceNote, version,
}
```

**Không hardcode một bài thi duy nhất.** Có 10 preset:

| id | Môn | Chế độ | Câu | Phút | Điểm tối đa |
|---|---|---|---|---|---|
| `bp-vn-mini-01` | Tiếng Việt | mini_test | 6 | 5 | 10 |
| `bp-vn-mini-02` | Tiếng Việt | mini_test | 8 | 6 | 10 |
| `bp-vn-full` | Tiếng Việt | full_mock | 12 | 15 | 20 |
| `bp-math-mini-01` | Toán | mini_test | 6 | 5 | 10 |
| `bp-math-mini-02` | Toán | mini_test | 8 | 6 | 10 |
| `bp-math-full` | Toán | full_mock | 12 | 15 | 20 |
| `bp-eng-practice` | English | mini_test | 6 | 5 | 10 |
| `bp-speed-math` | Toán | speed_trial | 8 | 3 | 10 |
| `bp-speed-viet` | Tiếng Việt | speed_trial | 8 | 3 | 10 |
| `bp-vn-reading` | Tiếng Việt | mini_test | 8 | 7 | 10 |

Hai bài `full_mock` có `sections` 3 phần và `questionTypeDistribution` đủ 7 dạng.

### Assembly theo thứ tự ưu tiên

1. `skillDistribution` (ý định rõ nhất)
2. `questionTypeDistribution` cho phần còn thiếu
3. `difficultyDistribution` cho cả bài
4. Lấp từ pool của môn (đã shuffle bằng seed)

Sau đó **sắp xếp lại theo thứ tự `sections`**.

## 6. Seeded determinism (§17)

```ts
CompetitionEngine.hashSeed('bp-math-mini-01:v2:0')  // FNV-1a
CompetitionEngine.assembleExam(blueprint, seed)
```

- Cùng `(blueprint, bank version, seed)` → **cùng** đề.
- Seed khác → đề khác nhưng hợp lệ (UI dùng `hashSeed(blueprintId + version + số lần thi)`).
- **Không bao giờ** sinh câu trùng để lấp chỗ trống. Code cũ tạo `id_copy_3`; đã bỏ hoàn toàn.
- Nếu bank không đủ câu, `assembleExam` trả `shortfall` và UI **nói thẳng** với bé:
  *"Ngân hàng câu hỏi hiện có N câu cho dạng bài này… Đề vẫn chơi được và điểm được tính trên số câu thực tế."*
- Mỗi `CompetitionExamResult` lưu `provenance { blueprintVersion, questionBankVersion, seed }`.

## 7. Timer dựa trên timestamp (§12)

```ts
deadlineRef = Date.now() + durationSeconds * 1000
setInterval(250ms) → remaining = ceil((deadline - Date.now()) / 1000)
```

- Chống tab bị throttle / refresh / mất focus — luôn tính từ mốc thời gian thật.
- `submittedRef` one-shot chặn nộp hai lần.
- Đáp án nằm trong **ref**, không phải state, nên đường auto-submit không bao giờ đọc
  closure cũ (lỗi đã xoá sạch đáp án trước đây).
- Tự động nộp khi hết giờ, có giọng thông báo.
- Thời gian mỗi câu **đo thật**; chỉ câu chưa từng chạm mới fallback về 0 — không có "15 giây"
  giả lặp cho mọi câu như bản cũ.

## 8. Scoring tách bạch (§13)

```ts
scoring: {
  rawScore, maxScore,
  accuracy, completion, attemptedCount, correctCount, totalQuestions,
  totalSeconds, averageSecondsPerQuestion, fastestQuestionSeconds, slowestQuestionSeconds,
  skillPerformance, questionTypePerformance,
}
```

- `score = round(correct / total × maxScore)` — công thức một dòng, giải thích được.
- **Tốc độ không bao giờ vào công thức điểm.**
  Test: cùng bộ đáp án, 600s và 30s → `score` và `rawScore` **bằng nhau**.
- UI hiển thị "Bảng phân tích điểm" + "Kết quả theo dạng bài" + ghi chú công bằng.

## 9. Phân tích lỗi theo dữ liệu (§14)

Không còn hardcode `skillId === 'TV-SPELLING'`. Phân loại dựa trên metadata của câu:

| Điều kiện | Phân loại | Hành động đề xuất |
|---|---|---|
| chưa chọn đáp án | `UNCLASSIFIED` | đọc lại đề |
| ≤ 6 giây | `CARELESS_ERROR` | `SPEED_DRILL` — đọc hết phương án |
| HARD/CHALLENGE, hoặc ordering/matching | `REASONING_ERROR` | `PRACTICE_SKILL` |
| drag-drop/classify/fill-blank, hoặc TV-READING | `MISREAD` | `READ_PASSAGE` |
| còn lại | `KNOWLEDGE_GAP` | `PRACTICE_SKILL` |

Mỗi lỗi kèm: dạng bài, tên kỹ năng, đáp án bé chọn, đáp án đúng, giải thích, lời khuyên,
và `remediation.label` — hành động cụ thể, không phải lời nhắc chung chung.

## 10. Định nghĩa ngưỡng

Mọi ngưỡng nằm ở `src/config/policy.ts`: `SPEED_POLICY`, `READINESS_POLICY`,
`ERROR_ANALYSIS_POLICY`, `CONTENT_POLICY`, `SEED_POLICY`. UI không chứa magic number.

## 11. Kiểm chứng

`tests/exam-fidelity.test.ts` (36 test) + `tests/competition-bank.test.ts` +
`tests/content-quality.test.ts`:

- 10 blueprint × 4 seed → không câu trùng, không `_copy_`.
- Cùng seed → cùng đề; khác seed → khác đề hợp lệ.
- 7 dạng bài chấm đúng/sai đúng kỳ vọng.
- Tốc độ không đổi điểm.
- UI nói dối `isCorrect` → engine vằng mặt.
- Nộp 3 lần cùng exam → XP/★ không nhân đôi, lịch sử vẫn 1 bài.
- Lịch sử thi được giới hạn 30 bài.
- Màn hình kết quả hiển thị đủ bảng phân tích điểm, theo dạng bài, và hành động ôn.
