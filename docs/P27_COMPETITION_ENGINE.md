# P27 — COMPETITION TRAINING ENGINE SPECIFICATION
## KHO BÁU TRI THỨC — LỚP 1

---

### 1. Kiến Trúc Tổng Thể (System Architecture)

Hệ thống Huấn luyện Đấu trường & Thi thử (Competition Training Engine) cho học sinh lớp 1 được phân tầng rõ rệt:

```text
Domain Logic & Taxonomy (src/types/competition.ts, src/data/competitionTaxonomy.ts)
                    ↓
Deterministic Question Bank (src/data/competitionQuestions.ts)
                    ↓
Exam Blueprints & Assembly (src/data/competitionBlueprints.ts)
                    ↓
Execution Engine & Monotonic Timer (src/services/competitionEngine.ts)
                    ↓
Scoring, Error Analysis & Readiness Model
                    ↓
Persistent Storage & Reward Integration (src/services/storage.ts)
                    ↓
Interactive UI Experience (src/components/competition/*)
```

---

### 2. Các Chế Độ Rèn Luyện (Training Modes)

1. **Thi Thử Đấu Trường (Mock Exam Library)**:
   - Các bài Mini Test (5–6 phút) và Full Mock (10 phút).
   - Mô phỏng phòng thi: đồng hồ đếm ngược monotonic timestamp, không hiển thị đúng/sai tức thì, duyệt câu hỏi linh hoạt, xác nhận nộp bài nếu còn câu bỏ trống, tự động nộp bài khi hết giờ.
2. **Luyện Dạng Bài (Targeted Skill Practice)**:
   - Bé tự chọn 1 trong 26 kỹ năng thuộc Tiếng Việt, Toán hoặc Tiếng Anh để làm 5 câu trọng tâm không áp lực thời gian.
3. **Luyện Tốc Độ (Speed Training 3 Phút)**:
   - Rèn luyện phản xạ tính nhẩm và đọc hiểu nhanh dưới nhịp độ thời gian vừa phải.
4. **Khóa Luyện Củng Cố Kỹ Năng Yếu (Adaptive Remediation)**:
   - Tự động kích hoạt ngay sau bài thi khi bé gặp câu sai, gom các kỹ năng dưới 60% vào bộ câu hỏi rèn luyện lại ngay lập tức.

---

### 3. Nguyên Tắc Sư Phạm & Tâm Lý Trẻ Lớp 1

- **Không so sánh thứ hạng (No Peer Ranking)**: Trẻ chỉ cạnh tranh với chính mình qua từng lần thi.
- **Đánh giá tốc độ có trọng số độ chính xác (Accuracy-Adjusted Speed)**: Bấm nhanh mà sai không được khuyến khích; trẻ làm cẩn thận và đúng được xếp loại "Vững vàng & Rất cẩn thận".
- **Không áp lực tiêu cực**: Không dùng các từ tiêu cực như "Thua", "Kém", "Thất bại"; thay vào đó là lời khuyên ấm áp: "Cùng luyện thêm nhé!", "Con đang tiến bộ từng ngày!".
