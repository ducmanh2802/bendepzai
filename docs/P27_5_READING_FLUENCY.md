# P27.5 — READING FLUENCY ENGINE

> Mục tiêu: **Đọc chắc → Đọc lưu loát → Hiểu nhanh → Luyện dạng thi → Tăng tốc độ**
> Nguồn sự thật: `src/services/readingEngine.ts` · `src/data/readingContent.ts` · `src/types/reading.ts`

## 1. Vì sao cần một engine riêng

Trước P27.5, "đọc" chỉ tồn tại dưới dạng vài câu hỏi `TV-READING` trong ngân hàng thi.
Không có mô hình đo lường riêng, không có thang luyện, không có bảo vệ tính công bằng.

Bổ sung engine này giải quyết 3 rủi ro sư phạm thật sự với trẻ 6–7 tuổi:

| Rủi ro | Cách engine chặn |
|---|---|
| Bé đọc chậm nhưng đúng bị coi là yếu | Tốc độ **không bao giờ** trừ vào chỉ số nào |
| Bé đọc nhanh nhưng hiểu sai bị coi là giỏi | Speed stage mở khoá cần đạt cả cổng hiểu nội dung |
| Bé bị gán nhãn tiêu cực | Toàn bộ copy hướng dẫn là supportive, không có "chậm/kém/yếu/thua" |

## 2. Taxonomy kỹ năng đọc (§6.1) — đủ 11 mã

| Mã | Tên | Nhóm | Bậc |
|---|---|---|---|
| `RF-WORD-RECOGNITION` | Nhận Diện Từ | ACCURACY | ACCURACY |
| `RF-SYLLABLE-FLUENCY` | Ghép Âm Đều Nhịp | ACCURACY | ACCURACY |
| `RF-READ-ALOUD-ACCURACY` | Đọc To Chính Xác | ACCURACY | ACCURACY |
| `RF-PHRASE-FLUENCY` | Đọc Cụm Từ | FLUENCY | FLUENCY |
| `RF-SENTENCE-FLUENCY` | Đọc Câu Mạch Lạc | FLUENCY | FLUENCY |
| `RF-PUNCTUATION-PAUSE` | Ngắt Hơi Theo Dấu Câu | FLUENCY | FLUENCY |
| `RF-READ-ALOUD-SPEED` | Đọc Nhanh Mà Rõ | FLUENCY | PROCESSING_SPEED |
| `RF-READING-COMPREHENSION` | Hiểu Nội Dung Đoạn Văn | COMPREHENSION | COMPREHENSION |
| `RF-KEYWORD-FINDING` | Tìm Từ Khóa | COMPREHENSION | COMPREHENSION |
| `RF-QUESTION-UNDERSTANDING` | Hiểu Câu Hỏi | PROCESSING_SPEED | PROCESSING_SPEED |
| `RF-ANSWER-SELECTION-SPEED` | Chọn Đáp Án Nhanh | PROCESSING_SPEED | COMPETITION_SPEED |

**Tốc độ đọc không bao giờ là metric duy nhất.** Mỗi kỹ năng được đo độc lập.

## 3. Thang luyện 5 bậc (§7) — có cổng chặn

```
ACCURACY ──► FLUENCY ──► COMPREHENSION ──► PROCESSING_SPEED ──► COMPETITION_SPEED
  80%           80%           70%                 70%                   70%
```

Cổng nằm trong `src/config/policy.ts` → `READING_POLICY`.

- Bậc mới mở khi bậc trước **hoàn thành** (đạt cổng + tối thiểu 3 lượt).
- `PROCESSING_SPEED` và `COMPETITION_SPEED` **bắt buộc** có `COMPREHENSION.isCompleted`.
- Luyện một bậc đang khoá **không bao giờ** tự mở khoá (`isUnlocked: stageState.isUnlocked`).

## 4. Công thức chỉ số — và vì sao nó "công bằng"

```
accuracyIndex     = trung bình độ chính xác theo từng kỹ năng
fluencyIndex      = đo đã có? (accuracy + 2×fluency)/3 : accuracy
readingIndex      = base + speedBonus
    base          = weightedAverage([accuracy 0.6, comprehension 0.4])
                    ⚠ thành phần CHƯA ĐO được loại khỏi trung bình và phân bổ lại trọng số
    speedBonus    = min(10, wpm / TARGET_WPM × 2)   — 0 nếu chưa đo tốc độ
```

**Điểm mấu chốt:** thành phần chưa đo lập luôn được loại bỏ thay vì coi như 0%.
Nếu không có điều này, một bé đang ở bậc ACCURACY sẽ bị trừ điểm như thể đã "trượt"
bậc COMPREHENSION — đúng cái lỗi "đọc chậm mà đúng bị coi là yếu".

## 5. Công bằng được kiểm chứng bằng test, không bằng lời hứa

`tests/reading-fluency.test.ts` — `tests/personas-and-learning-os.test.ts`

| Persona | Kịch bản | Kết quả bắt buộc |
|---|---|---|
| **CHILD E** | 100% đúng, 25s/câu (chậm) | `accuracyIndex ≥ 85`, `readingIndex ≥ 70`, copy không chứa "chậm/kém" |
| **CHILD F** | 40% đúng, 4s/câu (nhanh) | `accuracyIndex < 50`, `readingIndex < 50`, speed stage vẫn khoá |
| **CHILD C** | cân bằng 85–100% | đi hết ACCURACY → FLUENCY → COMPREHENSION |
| Bé hiểu nội dung kém | accuracy tốt nhưng COMPREHENSION sai | `PROCESSING_SPEED.isUnlocked === false` |

## 6. Chỉ số đo được (§8)

| Chỉ số | Nguồn | Ghi chú |
|---|---|---|
| `accuracy` | đúng / số câu | |
| `comprehensionAccuracy` | chỉ item `comprehension-*` | `-1` = chưa đo, **không** hiển thị như 0% |
| `questionInterpretationAccuracy` | chỉ item `question-meaning` | `-1` = chưa đo |
| `itemsProcessed`, `wordsProcessed` | đếm thật | |
| `durationMs`, `averageResponseMs` | timestamp thật từ UI | không có giá trị mặc định giả |
| `wordsPerMinute` | **chỉ** item có đọc to (`read-aloud`, `phrase-repeat`) | câu hỏi tap không được tính vào tốc độ |
| `hesitationCount`, `hesitationRatio` | > 8s/câu | ngưỡng ở `READING_POLICY.HESITATION_SECONDS` |
| `difficultyBreakdown` | theo độ khó 1/2/3 | |
| `skillPerformance`, `questionTypePerformance` | theo kỹ năng & dạng | |
| `errors[]` | phân loại lỗi đọc | SUBSTITUTION · OMISSION · MISPRONUNCIATION · PUNCTUATION_IGNORED · COMPREHENSION_GAP · KEYWORD_MISSED · CARELESS_TAP |

## 7. Seeded determinism (§17)

```ts
ReadingEngine.seedForDate(new Date(2025, 4, 17))  // seed theo ngày
ReadingEngine.assembleStageItems('COMPREHENSION', seed, 6)
```

- Cùng `(bậc, seed)` → **cùng** danh sách câu, cùng thứ tự.
- Seed khác → biến thể khác nhưng vẫn hợp lệ.
- Không câu nào lặp trong một phiên.
- Các đoạn đọc được xen kẽ, không dồn cục một đoạn.

## 8. Nội dung

- **5 đoạn đọc** gốc, do ứng dụng tự viết cho lớp 1 (level 1→3), kèm **picture bank** hỗ trợ bé
  chưa thạo đọc giải mã chữ.
- **20 câu hỏi** phủ 14 dạng: nhận diện từ, đếm tiếng, đọc cụm, dựng câu, đọc to (chính xác & nhanh),
  ngắt hơi theo dấu câu, và comprehension đủ 6 loại (ai / gì / ở đâu / khi nào / vì sao / như thế nào),
  tìm từ khóa, hiểu câu hỏi.
- **Không sao chép** bất kỳ đề thi hay nội dung có bản quyền nào.

## 9. UI

`src/components/reading/ReadingFluencyScreen.tsx`

- Hero hiển thị `headline` + `encouragement` (luôn supportive).
- 4 thẻ chỉ số + thang 5 bậc với trạng thái `Đang khóa` / `Đang luyện` / `Đạt chuẩn`.
- Màn hình làm bài: đoạn đọc + picture bank + nút nghe TTS + bảng lựa chọn.
- Màn hình kết quả: 8 thẻ chỉ số, kỹ năng mạnh, lỗi cần luyện, hành động tiếp theo.
- Đoạn đọc được ẩn/hiện (hỗ trợ bé mới tập đọc chậm).

## 10. Persistence

`localStorage["kho_bau_reading_store"]`

```ts
{
  schemaVersion,
  profile: ReadingProfile,      // đã sanitize từng trường
  metrics: ReadingMetrics[]     // tối đa 30 phiên, de-dup theo sessionId
}
```

- JSON hỏng → trả về profile sạch, app không sập.
- Giá trị độc hại (`"HACKED"`, `9999`, `-50`) → clamp về khoảng hợp lệ.
- `resetProgress()` của Parent Mode xoá cả reading store.
- Commit lại cùng `sessionId` → evidence **không** bị đếm hai lần.
