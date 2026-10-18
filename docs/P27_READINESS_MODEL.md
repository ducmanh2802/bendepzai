# P27 — MÔ HÌNH ĐÁNH GIÁ MỨC ĐỘ SẴN SÀNG (READINESS MODEL)
## KHO BÁU TRI THỨC — LỚP 1

---

### 1. Bốn Trụ Cột Đánh Giá (Four Pillars of Readiness)

Hệ thống đánh giá độ sẵn sàng dựa trên bằng chứng thực nghiệm (Explainable Evidence):

1. **Kiến Thức & Chuẩn Xác (Knowledge & Accuracy - Trọng số 40%)**:
   - Dựa trên độ chính xác trung bình của 5 bài thi gần nhất.
2. **Tốc Độ & Phản Xạ (Pacing & Speed - Trọng số 20%)**:
   - Dựa trên thời gian trung bình/câu so với mốc tối ưu của học sinh lớp 1 (12–20 giây/câu).
3. **Độ Ổn Định (Consistency - Trọng số 20%)**:
   - Tính toán phương sai giữa các lần thi. Độ lệch chuẩn càng nhỏ chứng tỏ phong độ làm bài của bé càng vững vàng.
4. **Độ Bao Phủ Kỹ Năng (Skill Coverage - Trọng số 20%)**:
   - Tỷ lệ số kỹ năng trong bảng phân loại (26 kỹ năng) mà bé đã thực sự trải nghiệm và cọ xát.

---

### 2. Các Cấp Độ Sẵn Sàng (Readiness Levels)

| Cấp Độ | Tên Hiển Thị | Tiêu Chí Bằng Chứng |
| :--- | :--- | :--- |
| `FOUNDATION` | Bắt đầu hành trình thử sức 🌱 | Chưa thi bài nào (`exams.length === 0`) hoặc đang làm quen |
| `DEVELOPING` | Đang rèn luyện & khám phá 🌱 | Đã làm $\ge 1$ bài thi, điểm tổng hợp $< 60$ |
| `PRACTICING` | Tiến bộ rõ rệt qua từng bài 🚀 | Điểm tổng hợp $60 - 74$ |
| `STRONG` | Vững vàng kiến thức ⭐ | Điểm tổng hợp $75 - 84$, chính xác $\ge 75\%$ |
| `READY_FOR_MOCK` | Sẵn sàng chinh phục Đấu Trường 🏆 | Đã làm $\ge 3$ bài thi, điểm tổng hợp $\ge 85$, chính xác $\ge 85\%$ |

---

### 3. Nguyên Tắc Bằng Chứng & Bảo Vệ Trẻ

- **Không ảo tưởng / Không giả định**: Trẻ mới dùng app luôn nhận thông báo trung thực: `Chưa đủ dữ liệu (isSufficientData: false)` kèm lời động viên làm bài Mini Test đầu tiên.
- **Lời khuyên sư phạm cụ thể**: Chỉ ra chính xác 1–2 kỹ năng yếu nhất cần củng cố và gợi ý bài tập tương ứng.
