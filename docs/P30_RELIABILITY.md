# P30 — RELIABILITY / PERSISTENCE / SECURITY

> Nguồn sự thật: `src/services/storage.ts`
> Test: `tests/exam-fidelity.test.ts`, `tests/reading-fluency.test.ts`,
> `tests/learning-engine.test.ts`, `tests/personas-and-learning-os.test.ts`, `tests/parent-and-demo.test.ts`

## 1. Kiến trúc lưu trữ

```
localStorage
├── kho_bau_child_profile        ChildProfile        (+ isDemoData)
├── kho_bau_analytics            LearningAnalytics   (mastery legacy)
├── kho_bau_parent_settings      ParentSettings
├── kho_bau_daily_quests         { date, quests }
├── kho_bau_achievements         Achievement[]
├── kho_bau_competition_history  CompetitionHistoryStore
├── kho_bau_learning_os_store    LearningOSStore     ← MỚI (P28 trước đây không tồn tại)
└── kho_bau_reading_store        { profile, metrics } ← MỚI (P27.5)
```

`STORAGE_SCHEMA_VERSION` là hằng số duy nhất; chuỗi migration nằm ngay cạnh nó.

## 2. Ba helper bắt buộc cho mọi lần đọc/ghi

```ts
readJSONObject(key)   // không bao giờ throw; trả undefined cho JSON hỏng / mảng / rác
writeJSON(key, value) // không bao giờ throw (private mode, hết quota)
migrateToCurrentSchema(raw)
```

Không còn `try/catch` rải rác ở từng hàm — mọi đường đi qua đúng một chỗ.

## 3. Migration

```ts
const MIGRATIONS = {
  'P30-v1': (raw) => ({ ...raw, processedEvidenceIds: [...] }),
};
```

- Store không có `schemaVersion` được coi là `P29-v2` rồi chạy chuỗi migration.
- Bản **P28-v1** (thiếu `processedEvidenceIds`) được nâng cấp và dựng lại danh sách id từ
  `recentEvidences` còn sót → evidence lịch sử vẫn idempotent sau nâng cấp.
- Test: `migrates a legacy P28 Learning OS store and keeps evidence idempotent`.

## 4. Sanitize — không tin dữ liệu lưu trữ

`getLearningOSStore()` gọi `sanitizeLearningOSStore()`, kiểm tra **từng trường**:

| Trường | Rủi ro | Xử lý |
|---|---|---|
| `subject` | `"not-a-subject"` | → `tieng-viet` |
| `mastery: 5000` | mastery ngoài thang | clamp `0..100` |
| `accuracy: -20` | âm | clamp `0` |
| `attemptCount: "ten"` | sai kiểu | → `0` |
| `status: "HACKED"` | trạng thái bịa | → `NOT_STARTED` |
| `difficultyPerformance: "nope"` | hỏng cả nhóm | → về zero |
| `errorProfile.knowledgeGap: "x"` | sai kiểu | → `0`, còn `careless: 4` thì giữ `4` |
| `processedEvidenceIds: [1,"ok",null]` | lẫn kiểu | → `["ok"]` |
| **`fatigue.isFatigued: "yes"`** | chuỗi truthy | → `false` |

Dòng cuối là một **bug thật do test phát hiện**: `Boolean("yes") === true` khiến bé bị đánh
dấu mệt mỏi chỉ vì dữ liệu hỏng. Đã sửa thành so sánh nghiêm `=== true`.

Tương tự cho `ReadingProfile`: `currentStage: "HACKED"` → `ACCURACY`,
`readingIndex: 9999` → `100`, `isUnlocked: "yes"` → `false`.

## 5. Idempotency (§19)

### Tầng 1 — evidence

```ts
StorageService.recordLearningEvidence(evidence): boolean  // true = mới, false = đã xử lý
```

`processedEvidenceIds` chốt "sự kiện này đã được nếp vào KnowledgeState chưa".
Nếp lại cùng id → `false`, mastery **không** đổi.

```ts
expect(record(e)).toBe(true);
for (let i=0;i<10;i++) expect(record(e)).toBe(false);
expect(getKnowledgeStates()['vn_alphabet'].attemptCount).toBe(1);
```

### Tầng 2 — nộp bài thi

`CompetitionExamModal` có `submittedRef` one-shot. `handleFinalSubmit` chạy lần đầu thì
thắng chốt; mọi lời gọi sau là no-op — kể cả khi timer vừa hết giờ.

`StorageService.recordCompetitionResult()` cũng chốt theo `result.id`:
nộp 3 lần cùng một bài → XP/★ giữ nguyên, lịch sử vẫn 1 bài.

### Tầng 3 — phần thưởng bài học

`completeLesson()` chỉ trả đầy đủ lần đầu; học lại chỉ cộng 5 XP ôn tập, không cộng
sao/vé. Kiểm chứng bằng `enforces lesson reward idempotency`.

### Tầng 4 — phiên đọc

`ReadingEngine.finishSession()` với cùng `sessionId` → evidence không nhân đôi, profile
đọc chỉ giữ 1 metrics entry.

### Tầng 5 — rương kho báu & thử thách tuần

- Rương: `dailyChestClaimedDate` chặn nhận 2 lần/ngày.
- Thử thách tuần: `completedWeeklyChallenges` dùng `Set`.

## 6. Lỗi P0 đã sửa: auto-submit xoá sạch đáp án

`CompetitionExamModal` bản cũ:

```tsx
useEffect(() => {
  timerIntervalRef.current = setInterval(() => {
    ...
    handleFinalSubmit(true);       // ← đóng trên userAnswers = {} của render đầu
  }, 1000);
}, [isOpen, blueprint, questions]);
```

Bản mới: `answersRef` / `matchingRef` là nguồn sự thật, `setAnswers` chỉ để vẽ.
Đường timer đọc ref nên **luôn** thấy đáp án thật.

Ngoài ra `questionDurations[q.id] || 15` (giả 15 giây cho mọi câu chưa trả lời) đã bị
thay bằng phép đo thật tích luỹ theo `Date.now()`.

## 7. Lỗi chặn tiến trình bên ngoài đọc state

```ts
const fresh = { ...DEFAULT_CHILD_PROFILE, equipped: {...}, unlockedItems: [...], ... };
```

Trước đây `getChildProfile()` trả về **đúng object hằng module** khi chưa có dữ liệu.
Mọi màn hình (`AvatarShopScreen`, `HomeScreen`…) đang mutate kết quả đó → "profile sạch"
bị ăn mòn vĩnh viễn sau một lần mua đồ. Nay luôn trả bản sao.

## 8. Dữ liệu demo không được lẫn vào dữ liệu thật (§1.2)

Trước đây nút "Tạo dữ liệu thử nghiệm" ghi đè hồ sơ thật bằng số liệu bịa và **không**
để lại dấu vết nào.

Nay:

- `seedDemoProfile()` đặt `isDemoData: true` và `id: 'child_demo'`.
- `ParentDiagnosticReport.isDemoData` mang cờ đó ra UI.
- Bảng **"⚠️ DỮ LIỆU THỬ NGHIỆM"** hiện ngay dưới header khu vực phụ huynh, giải thích
  rõ đây là số liệu mẫu, không phải tiến bộ thật.
- Nút bấm phải **xác nhận trước** khi ghi đè.
- Bài thi mẫu được sinh bằng `CompetitionEngine.scoreSession()` thật, nên số liệu mẫu
  **không thể lệch** với logic chấm điểm production.
- Thông báo sau khi nạp tự nhắc lại yêu cầu xoá trước khi dùng thật.

Kiểm chứng trong `qa/golden-path.mjs`: hồ sơ thật **không** hiện banner demo.

## 9. Parent Mode (§20)

- **Cổng xác nhận**: phép cộng ngẫu nhiên sinh lại mỗi lần mở; sai thì xoá ô nhập.
- **Báo cáo tiến độ**: phút hôm nay, độ chính xác, số bài học, chuỗi ngày, % theo 3 môn.
- **Phân tích & lời khuyên**: kỹ năng yếu có bằng chứng số liệu, không dùng từ
  "bé kém / bé chậm / bé thua".
- **Tab Luyện Đọc** (mới): chỉ số đọc, thang 5 bậc với trạng thái khoá/đạt, chi tiết từng
  kỹ năng đọc, lời khuyên riêng. Nội dung lấy từ `AdaptiveService.generateReadingReport()`.
- **Tab Đấu Trường**: số bài thi, độ chính xác trung bình, số lượt luyện tốc độ, nhật ký.
- **Xuất dữ liệu**: tải file `.json` gồm profile + analytics + lịch sử thi.
- **Giới hạn thời gian**: 10/15/20/30/không giới hạn, mặc định 20 phút — khuyến nghị
  chuyên gia cho trẻ 6–7 tuổi.
- **Đặt lại tiến độ**: xoá **toàn bộ** 8 key (trước đây sót `kho_bau_learning_os_store`).

## 10. An toàn & quyền riêng tư (§21)

| Yêu cầu | Trạng thái |
|---|---|
| Thu thập PII | **Không**. Không tên, không email, không ảnh |
| Gửi dữ liệu trẻ đi nơi khác | **Không**. 100% client-side |
| AI quyết định correctness/score/mastery/readiness | **Không có AI nào trong app** |
| Hoạt động khi mất mạng | **Có** — local-first, không lời gọi mạng bắt buộc |
| `metadata.json` | `majorCapabilities: []` — gỡ khai báo `SERVER_SIDE_GEMINI_API` không tồn tại |
| `.env.example` | ghi rõ **không** cần biến môi trường nào |

## 11. Ma trận kiểm thử độ bền

| Tình huống | Kỳ vọng | Nơi kiểm |
|---|---|---|
| JSON hỏng ở mọi key | trả default, không sập | `learning-engine`, `exam-fidelity` |
| Giá trị kiểu sai / ngoài thang | sanitize về khoảng hợp lệ | `sanitises hostile knowledge-state values` |
| Store phiên bản cũ | nâng cấp, không mất idempotency | `migrates a legacy P28 …` |
| Nhân đôi sự kiện (double click, retry, refresh) | không đổi XP/★/mastery | `exam-fidelity`, `reading-fluency` |
| Lịch sử thi vượt giới hạn | cắt còn ≤ 30 bài | `keeps the exam history bounded` |
| Reset toàn bộ | xoá cả reading store | `clears reading progress on a full parent reset` |
| Hết giờ giữa chừng | tự nộp, đáp án không mất | `qa/golden-path.mjs` |
| F5 sau khi thi xong | không cộng XP lần hai | `noDuplicateRewards` |
