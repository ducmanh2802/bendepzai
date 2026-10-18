# P27 — MÔ HÌNH CHẤM ĐIỂM & ĐÁNH GIÁ TỐC ĐỘ (SCORING MODEL)
## KHO BÁU TRI THỨC — LỚP 1

---

### 1. Nguyên Tắc Chấm Điểm (Core Scoring Principles)

- **Điểm Thô (Raw Score)**: Số lượng câu trả lời đúng trên tổng số câu hỏi.
- **Độ Chính Xác (Accuracy %)**: `(correctCount / totalQuestions) * 100` (làm tròn số nguyên).
- **Thang Điểm 10 (Normalized Score)**: `Math.round((correctCount / totalQuestions) * 10)`.

---

### 2. Mô Hình Đánh Giá Tốc Độ Có Trọng Số Chính Xác (Accuracy-Adjusted Speed)

Hệ thống không đánh giá tốc độ một cách cơ học dựa trên thời gian đơn thuần:

| Độ Chính Xác (%) | Thời Gian Trung Bình/Câu (s) | Xếp Loại (Speed Rating) | Nhãn Hiển Thị Thân Thiện |
| :--- | :--- | :--- | :--- |
| $\ge 80\%$ | $\le 18\text{s}$ | `EXCELLENT` | Tốc độ xuất sắc & Chuẩn xác ⭐ |
| $\ge 80\%$ | $> 18\text{s}$ | `STEADY` | Vững vàng & Rất cẩn thận 🎯 |
| $< 60\%$ | $\le 10\text{s}$ | `RUSHING` | Bé hơi vội vã, cần đọc kỹ đề bài 🐇 |
| $< 60\%$ | $> 10\text{s}$ | `NEEDS_TIME` | Cần thêm thời gian luyện phản xạ 🐢 |
| Khác | Khác | `SWIFT` | Tiến độ đều đặn & Tự tin 🚀 |

**Lợi ích sư phạm**:
- Trẻ làm bài cẩn thận, suy nghĩ kỹ (ví dụ mất 22s/câu nhưng đúng 90%) vẫn nhận được sự khích lệ cao (`STEADY`).
- Ngăn ngừa tình trạng trẻ bấm bừa thật nhanh chỉ để khoe "làm bài xong sớm".
