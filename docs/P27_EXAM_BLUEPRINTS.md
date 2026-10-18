# P27 — CẤU TRÚC ĐỀ THI & THIẾT KẾ BLUEPRINT
## KHO BÁU TRI THỨC — LỚP 1

---

### 1. Ma Trận Đề Thi Mặc Định (Exam Blueprint Matrix)

| Mã Đề | Tên Đề Thi | Môn | Dạng | Thời Gian | Số Câu | Độ Khó | Phần Thưởng |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `bp-vn-mini-01` | Tiếng Việt Mini Test 01 | Tiếng Việt | Mini Test | 5 phút (300s) | 6 câu | Cơ bản (EASY) | +50 XP, +4 Sao |
| `bp-vn-mini-02` | Tiếng Việt Mini Test 02 | Tiếng Việt | Mini Test | 6 phút (360s) | 8 câu | Tiêu chuẩn (MEDIUM) | +70 XP, +5 Sao |
| `bp-vn-full` | Đấu Trường Tiếng Việt Toàn Diện | Tiếng Việt | Full Mock | 10 phút (600s) | 12 câu | Nâng cao (HARD) | +120 XP, +8 Sao |
| `bp-math-mini-01` | Toán Học Mini Test 01 | Toán | Mini Test | 5 phút (300s) | 6 câu | Cơ bản (EASY) | +50 XP, +4 Sao |
| `bp-math-mini-02` | Toán Học Mini Test 02 | Toán | Mini Test | 6 phút (360s) | 8 câu | Tiêu chuẩn (MEDIUM) | +70 XP, +5 Sao |
| `bp-math-full` | Đấu Trường Toán Học Toàn Diện | Toán | Full Mock | 10 phút (600s) | 12 câu | Nâng cao (HARD) | +120 XP, +8 Sao |
| `bp-eng-practice` | English Challenge Practice | English | Mini Test | 5 phút (300s) | 6 câu | Cơ bản (EASY) | +60 XP, +5 Sao |
| `bp-speed-math` | Thử Thách Tốc Độ: Phép Tính Nhanh | Toán | Speed Trial | 3 phút (180s) | 6 câu | Tiêu chuẩn (MEDIUM) | +60 XP, +4 Sao |
| `bp-speed-viet` | Thử Thách Tốc Độ: Nhận Diện Từ Nhanh | Tiếng Việt | Speed Trial | 3 phút (180s) | 6 câu | Tiêu chuẩn (MEDIUM) | +60 XP, +4 Sao |

---

### 2. Thuật Toán Sinh Đề Xác Định (Deterministic Assembly)

- **Không trùng lặp (Zero Duplicates)**: Đề thi lọc danh sách câu hỏi theo môn học, xáo trộn bằng thuật toán giả ngẫu nhiên có seed `deterministicShuffle`.
- **Đảm bảo số lượng**: Đề thi luôn có chính xác số lượng câu hỏi theo quy định của Blueprint.
- **Bảo toàn dữ liệu khi thoát hoặc làm lại**: Idempotency token ngăn ngừa nhận trùng sao và điểm thưởng.
