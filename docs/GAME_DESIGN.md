# TÀI LIỆU THIẾT KẾ TRÒ CHƠI — KHO BÁU TRI THỨC
## Game Design Document (GDD)

### 1. Triết lý Thiết Kế Cho Trẻ 6–7 Tuổi
- Không phạt nặng: khi trẻ chọn sai, phát ra âm thanh boing nhẹ nhàng, hướng dẫn bằng giọng nói giải thích vì sao chưa đúng và cho trẻ thử lại.
- Thời lượng mỗi ván chơi từ 1.5 - 3 phút, tối đa 5-8 lượt/câu hỏi để trẻ duy trì sự tập trung tối ưu.
- Âm thanh và hình ảnh: Sử dụng Web Audio API tổng hợp âm thanh vui tươi, không tải file mp3 rời từ ngoài để đảm bảo ứng dụng chạy 100% offline không bao giờ bị lỗi link.

### 2. Chi Tiết Cơ Chế 14 Trò Chơi
1. **Bắt Chữ Cái Bay (Catch Falling Letters)**: Chữ cái rơi tự do từ bầu trời. Trẻ lắng nghe yêu cầu và chạm bóng bóng mục tiêu.
2. **Xưởng Ghép Tiếng (Syllable Builder)**: Khung ghép 3 vị trí [Âm đầu] + [Nguyên âm] + [Dấu thanh], máy tự động đọc to âm tiết khi trẻ ghép đúng.
3. **Săn Vần Trong Vườn Cây (Rhyme Hunter)**: Vườn trái cây trĩu quả mang các từ ngữ; trẻ hái những quả có vần được yêu cầu bỏ vào giỏ.
4. **Đoàn Tàu Xếp Câu (Sentence Scramble)**: Các toa tàu mang từ rời rạc; trẻ chạm từ theo trật tự ngữ pháp để đầu tàu xình xịch lăn bánh.
5. **Đôi Tai Thính (Listen & Pick)**: Loa phát âm chuẩn tiếng Việt; trẻ nghe kỹ để chọn hình ảnh tương ứng.
6. **Hứng Số Rơi (Falling Numbers Math)**: Rổ hứng các quả bóng mang số thỏa mãn điều kiện logic (> 5, < 6, chẵn/lẻ).
7. **Đường Đua Thần Tốc (Math Speed Racing)**: Xe đua phân khối lớn tăng tốc Nitro mỗi khi trẻ giải đúng phép tính số học.
8. **Xây Tháp Số (Number Tower)**: Tìm số còn thiếu để hoàn thành phép cộng và xếp chồng gạch lên đến cầu vồng.
9. **Câu Cá Đại Dương (Ocean Fishing)**: Cáo thuyền trưởng thả cần câu bắt chú cá mang đáp án phép trừ.
10. **Phân Loại Hình Học (Shape Sorting)**: 4 giỏ phân loại hình học; đồ vật chạy trên băng chuyền để trẻ phân loại.
11. **Safari Tiếng Anh (Animal Safari)**: Nhận diện động vật và nghe phát âm tiếng Anh chuẩn.
12. **Đập Bóng Màu Sắc (Color Balloon Pop)**: Đập bóng bay theo màu sắc tiếng Anh kèm âm thanh bóng nổ giòn tan.
13. **Lật Thẻ Trí Nhớ (Memory Cards)**: Tìm các cặp thẻ giống nhau để rèn luyện trí nhớ ngắn hạn.
14. **Bé Tập Vẽ & Tô Màu (Coloring Canvas)**: Bảng vẽ canvas HTML5 với cọ vẽ, bảng màu, tẩy và sticker dán hình.
