# P27 — HỆ THỐNG PHÂN TÍCH LỖI SAI (ERROR ANALYSIS)
## KHO BÁU TRI THỨC — LỚP 1

---

### 1. Phân Loại Danh Mục Lỗi Sai (Error Categories)

Mỗi câu hỏi trả lời sai được phân tích tự động dựa trên thời gian thao tác và đặc thù câu hỏi:

| Danh Mục Lỗi | Định Nghĩa Sư Phạm | Tiêu Chí Phát Hiện |
| :--- | :--- | :--- |
| `CARELESS_ERROR` | Lỗi bấm vội / bất cẩn | Thời gian trả lời câu hỏi $\le 6$ giây |
| `REASONING_ERROR` | Nhầm lẫn ở bước suy luận | Câu hỏi độ khó `HARD` hoặc `CHALLENGE` và thời gian $\ge 25$ giây |
| `KNOWLEDGE_GAP` | Lỗ hổng kiến thức căn bản | Sai ở câu hỏi nhận biết quy tắc chính tả hoặc ngữ âm cơ bản |
| `MISREAD` | Đọc sót dữ kiện hoặc nhầm từ khóa | Sai ở bài toán có lời văn ("thêm vào" làm nhầm thành trừ, v.v.) |
| `UNCLASSIFIED` | Lỗi thông thường khác | Các trường hợp còn lại |

---

### 2. Giao Diện Xem Lại Lỗi Sai (Review Screen)

Sau mỗi bài thi, hệ thống hiển thị chi tiết:
- Câu hỏi và phương án con đã chọn (màu đỏ).
- Đáp án chính xác (màu xanh).
- Lời giải thích từ ngữ cảnh bài học.
- Lời khuyên định hướng sư phạm cho ba mẹ và bé.

---

### 3. Vòng Khép Kín Củng Cố Kiến Thức (Adaptive Remediation Loop)

Ngay tại màn hình kết quả, nút **"Luyện Kỹ Năng Yếu Ngay"** sẽ tự động trích xuất các kỹ năng dưới 60%, tạo một phiên luyện tập 6 câu hỏi tập trung để bé sửa ngay lỗi sai vừa gặp!
