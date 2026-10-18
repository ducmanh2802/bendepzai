# ENGLISH KIDBOX COMPANION — PROGRESS, ADAPTIVE & REVIEW
### Bé đang yếu gì trong English? (§18) · English hôm nay (§19) · Ôn ở nhà (§20) · Ôn tập (§25)

---

## 1. Nguồn sự thật

| Loại thông tin | Nguồn |
| :--- | :--- |
| mastery / confidence / accuracy / NEEDS_REVIEW | `LearningOS` (`StorageService.getKnowledgeStates()`) |
| trạng thái 9 bước của Unit | `KidBoxStore.unitProgress` |
| lịch ôn tập theo mục | `KidBoxStore.reviewStates` |
| số liệu tuần | `KidBoxStore.counters.days` |

Track **không** có bảng điểm riêng và **không** dùng AI để đoán. Khi chưa có evidence,
câu trả lời là "chưa có dữ liệu".

## 2. Chân đất (§18)

`analyseEnglishProfile(knowledge)` gom evidence theo 6 nhóm rồi trả về:

```ts
{ weakestStrand, strongestStrand, nextBestFocus, strands, totalAttempts, isColdStart, explanation }
```

Ngưỡng trong `KIDBOX_POLICY`:

| Trạng thái | Điều kiện |
| :--- | :--- |
| `NO_EVIDENCE` | chưa có lượt nào |
| `NEEDS_WORK` | `accuracy < 70` hoặc `recentAccuracy < 70` |
| `SECURE` | `accuracy ≥ 85` **và** `attempts ≥ 4` |
| `PRACTICING` | còn lại |

Quy tắc chọn focus:

1. `attempts < 3` → `GENTLE_BASELINE` (không chạm điểm số).
2. Nhóm yếu nhất → focus tương ứng (Child A → nghe, Child B → nói, Child C → từ vựng).
3. Nhóm đã `SECURE` → focus **củng cố** thay vì dạy lại (`STRENGTHENING_FOCUS`).
4. Không có nhóm yếu → `VOCABULARY_RECALL`.

## 3. English hôm nay (§19)

`buildDailyEnglishPlan({ store, knowledge, ageYears, isFatigued })`:

1. **Ôn tập** nếu `buildReviewQueue()` thật sự có mục đến hạn.
2. **Điểm yếu** đo được (3 phút).
3. **Nghe** (2 phút) — luôn có mặt trừ khi bé mệt.
4. **Nói** (2 phút) — bỏ qua khi `isFatigued`.
5. **Trò chơi** (2 phút).

Ngân sách theo tuổi: 6 tuổi → 8 phút, 7 tuổi → 10 phút, 8 tuổi → 12 phút
(`DAILY_MINUTES_BY_AGE`), kẹp trong `[MIN_DAILY_MINUTES, MAX_DAILY_MINUTES]` và trong
giới hạn 10–20 phút/ngày mà app đã áp dụng cho cả ba môn.

`factors` ghi lại điều chỉnh đã dùng: `ageAdjusted`, `fatigueAdjusted`,
`weaknessAdjusted`, `reviewAdjusted`.

## 4. Ôn ở nhà (§20)

`buildHomeworkPack({ unitId, weekLabel })` sinh gói 5 phần (từ vựng · nghe · nói · âm
thanh · trò chơi) từ **chính các hoạt động** bé đang luyện tại trung tâm. Phụ huynh
không phải nhập điểm. Ghi chú trung tâm lưu ở `courseState.centerHomework`.

## 5. Ôn tập theo đường cong quên (§25)

`computeReviewPriority(state, now)` cân bằng 5 yếu tố:

| Yếu tố | Trọng số (`KIDBOX_POLICY`) |
| :--- | :---: |
| tỉ lệ sai | 1.0 |
| thời gian từ lần cuối (recency) | 1.0 |
| độ khó | 0.6 |
| chuỗi đúng liên tiếp | 0.8 |
| số lần quên (lapse) | 0.15 |

- Khoảng cách lần ôn kế tiếp: `[1, 2, 4, 7, 15, 30]` ngày theo chuỗi đúng, **nhân
  với** hệ số quên `1 / (1 + lapses × 1.5)`.
- **Sai một lần không xoá tiến bộ**: `correctCount` được giữ nguyên, chỉ
  `consecutiveCorrect = 0` và `lapses += 1`.
- Hàng đợi lấy mục đã đến hạn (`nextReviewAt <= now`) hoặc `priority >= 40`.

## 6. Bước tiến hành (§9)

`getStepProgress(store, unit)` trả về đúng 9 bước; mỗi bước có `status`
(`AVAILABLE` → `IN_PROGRESS` → `DONE`) và `evidenceCount`.

- **Không bước nào bị khóa** (§22): mọi bước đều mở, kể cả xem trước.
- `DONE` chỉ khi có evidence thật.
- `getStepsMissingContent(unit)` liệt kê bước chưa có nội dung nguồn — hiển thị
  `CONTENT_SOURCE_REQUIRED`, không tự tạo bài.

## 7. Đấu trường tách môn (§26)

`buildKidBoxActions()` sinh `LearningAction` với `subject: 'english'` và
`trackId: 'kids-box-companion'`. Không action nào có `examBlueprintId`, nên chúng không
thể lọt vào Trạng Nguyên. `NextBestActionCard.routeFor()` điều hướng theo `trackId`.

## 8. Idempotency (§30)

`buildAttemptId(activityId, responseKey, at)` tạo id ổn định. `KidBoxStore.recordAttempt()`
và `StorageService.recordLearningEvidence()` đều từ chối id đã xử lý, nên bấm đúp,
tải lại trang, quay lại trước hoặc mở lại game đều không làm phồng lên tiến bộ.
