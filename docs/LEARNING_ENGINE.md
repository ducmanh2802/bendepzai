# ĐỘNG CƠ HỌC TẬP THÍCH ỨNG & ĐÁNH GIÁ NĂNG LỰC
## Learning Engine Architecture

### 1. Mô Hình Đánh Giá Năng Lực (Mastery Taxonomy)
Hệ thống theo dõi độ thuần thục của từng kỹ năng theo 5 trạng thái:
- `NOT_STARTED`: Kỹ năng chưa được tiếp cận.
- `LEARNING`: Đang làm quen (< 2 lần làm bài).
- `PRACTICING`: Đang luyện tập (độ chính xác 60% - 84%).
- `MASTERED`: Đã nắm vững (tối thiểu 4 lần làm bài và độ chính xác $\ge 85\%$).
- `NEEDS_REVIEW`: Cần ôn lại khẩn cấp (sau 3 lần làm bài nhưng độ chính xác $< 60\%$ hoặc có lỗi sai gần đây).

### 2. Thuật Toán Sinh Bài Ôn Tập Hàng Ngày (Spaced Repetition Review)
Hàm `AdaptiveService.generateDailyReview()` áp dụng cơ chế:
1. Ưu tiên 1: Lấy 3 câu hỏi thuộc nhóm kỹ năng `NEEDS_REVIEW` hoặc từ danh sách lỗi sai gần nhất.
2. Ưu tiên 2: Lấy 3 câu hỏi thuộc nhóm kỹ năng `PRACTICING` để củng cố.
3. Ưu tiên 3: Lấy 1 câu hỏi thuộc nhóm `MASTERED` để chống đường cong quên lãng (Ebbinghaus Forgetting Curve).
4. Phân bổ cân bằng giữa Tiếng Việt, Toán và Tiếng Anh để trẻ không bị nhàm chán.

### 3. Hệ Thống Nhiệm Vụ Hàng Ngày (Daily Quests)
Mỗi ngày tự động làm mới 5 nhiệm vụ:
- 1 bài học Tiếng Việt
- 1 bài học Toán
- 1 bài học Tiếng Anh
- 1 trò chơi trí tuệ
- 1 phiên ôn tập thông minh
Hoàn thành 3/5 nhiệm vụ sẽ mở khóa **Rương Kho Báu Hàng Ngày** (+10 Sao, +50 XP).

---

## 4. Learning Track: Kid's Box Companion (British English)

Track English bổ sung **dùng chung** engine này, không tạo engine thứ hai:

- **Skill taxonomy**: `getAllSkills()` (`src/data/curriculum.ts`) được mở rộng trả về
  thêm 21 skill `EN-*` (6 nhóm: Vocabulary, Phonics, Listening, Speaking, Reading,
  Language Use). Evidence của track ghi vào đúng `KnowledgeState` và `mastery` chung.
- **Evidence**: `submitActivityResponse()` gọi
  `StorageService.recordLearningEvidence()` — cùng đường với lesson/game/competition.
  Lượt `SELF_CHECKED` và `SKIPPED` **không** phát evidence (không có tín hiệu trung
  thực thì không được đoán), nhưng vẫn được lưu để phụ huynh thấy bé đã thử.
- **Next Best Action**: `LearningOS.getNextBestActions(knowledgeMap, fatigue, now, trackActions)`
  nhận action của track và xếp chung một danh sách ưu tiên. `LearningAction.trackId`
  chỉ dùng để định tuyến UI.
- **Daily plan**: `LearningOS.generateDailyPlan()` nhận `trackActions` theo cùng cách,
  nên kế hoạch tổng vẫn cân bằng các môn.
- **Đấu trường**: skill track là `subject: 'english'`; test khẳng định chúng không bao
  giờ xuất hiện trong taxonomy/blueprint/câu hỏi thi.

Chi tiết: `docs/ENGLISH_KIDBOX_COMPANION.md`, `docs/ENGLISH_KIDBOX_PROGRESS.md`.
