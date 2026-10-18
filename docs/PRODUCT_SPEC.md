# KHO BÁU TRI THỨC — LỚP 1
## Product Specification Document (EdTech MVP)

### 1. Vision & Core Philosophy
"Kho Báu Tri Thức" là hệ sinh thái học tập và rèn luyện toàn diện dành riêng cho học sinh lớp 1 (độ tuổi 6–7 tuổi). Ứng dụng kết hợp giữa chương trình chuẩn của Bộ Giáo dục & Đào tạo (Tiếng Việt, Toán, Tiếng Anh) với cơ chế game hóa (Gamification) và công nghệ học tập thích ứng (Adaptive Learning).

### 2. Đối tượng Người dùng
- **Người dùng chính (Học sinh 6–7 tuổi)**: Giao diện trực quan, nút bấm lớn, hình ảnh sinh động, tích hợp giọng đọc nhân tạo (Web Speech API) để các bé chưa thạo chữ vẫn có thể nghe và làm bài độc lập.
- **Người dùng phụ (Phụ huynh)**: Được trang bị cổng bảo vệ (Parent Gate), bảng phân tích năng lực chi tiết (Diagnostic Insights), giới hạn thời gian học bảo vệ mắt (Screen Time Control) và công cụ xuất báo cáo tiến độ.

### 3. Hệ sinh thái 4 Môn Học
1. **Tiếng Việt**: Bảng chữ cái & Âm đầu, 5 dấu thanh diệu kỳ, Vần cơ bản (an, at, on, ot), Ghép tiếng, Quy tắc chính tả (c/k, g/gh, ng/ngh), Từ chỉ người/vật, Từ chỉ hoạt động, Sắp xếp câu, Đọc hiểu truyện ngắn.
2. **Toán Học**: Nhận biết & Đếm số 0–10, So sánh số (>, <, =), Phép cộng trong phạm vi 10, Phép trừ trong phạm vi 10, Nhận biết hình phẳng (tròn, vuông, tam giác, chữ nhật), Đo lường (dài-ngắn, cao-thấp), Số từ 11 đến 20, Cộng trừ phạm vi 20, Bài toán có lời văn minh họa sinh động.
3. **Tiếng Anh**: Phonics & Alphabet, Numbers 1–10, Colors, Animals, Family, School Supplies, My Body, Food & Fruits, Toys, Greetings & Feelings.
4. **Em & Cuộc Sống** (T14): 14 chủ đề — cảm xúc, an toàn giao thông, gia đình, nhà an toàn, trường học, cộng đồng, thực vật, động vật, cơ thể & giác quan, vệ sinh & ăn uống, thời tiết & mùa, an toàn quanh em (số khẩn cấp 111/113/114/115), lễ phép & kỹ năng sống, khoa học vui — 26 bài, 264 câu hỏi.

### 4. 14 Mini-Game Tương Tác Độc Quyền
Mỗi mini-game sở hữu cơ chế gameplay riêng biệt:
- **Tiếng Việt**: Bắt chữ cái bay, Xưởng ghép tiếng, Săn vần trong vườn cây, Đoàn tàu xếp câu, Đôi tai thính (nghe & chọn).
- **Toán Học**: Hứng số rơi rộn ràng, Đường đua toán học thần tốc, Xây tháp số lên mây, Câu cá đại dương xanh, Phân loại hình học.
- **Tiếng Anh**: Safari động vật tiếng Anh, Pop The Color Balloons.
- **Giải trí trí tuệ**: Lật thẻ trí nhớ vàng, Bé tập vẽ và tô màu canvas.

### 5. English Companion Track: Kid's Box New Generation 1 (British English)

Ngoài 10 chủ đề English nền, môn Tiếng Anh có một **learning track riêng** bám theo
chương trình Kid's Box New Generation 1 mà trung tâm đang dạy:

- **British English `en-GB`**: locale duy nhất của track; fallback có kiểm soát
  (en-GB → en-GB regional → English → chỉ chữ/phụ đề) và nhãn trung thực khi thiết bị
  không có giọng en-GB.
- **Vòng lặp 9 bước**: Nhìn → Nghe → Hiểu → Lặp lại → Luyện tập → Dùng → Ôn tập →
  Trò chơi → Kiểm tra. Không bước nào bị khoá; bước nào có bằng chứng thì gắn DONE.
- **Listening là kỹ năng hạng nhất**: nghe lại không giới hạn, có nút nghe chậm, không
  bao giờ bị trừ điểm.
- **Speaking không chấm điểm phát âm**: kết quả được ghi là `speech recognition match`
  hoặc `self-check`; thiếu nhận giọng nói thì bé vẫn nghe – lặp lại – tự đối chiếu.
- **“English hôm nay”**: kế hoạch 8–12 phút tùy tuổi, dựng từ điểm yếu thật đo
  được, mục đến hạn ôn tập và mức mệt của bé.
- **Center ↔ Home**: phụ huynh chọn Unit/Tuần và bấm “Ôn ở nhà” để lấy gói ôn tập
  (từ vựng · nghe · nói · âm thanh · mini game) mà không phải nhập điểm.
- **Nội dung giáo trình**: repo chưa có nguồn đã xác minh, nên các ô Unit giáo trình
  được đánh dấu `CONTENT_SOURCE_REQUIRED` và app liệt kê chính xác 7 nhóm tài liệu cần
  bổ sung. Không có tên Unit hay từ vựng nào được bịa ra.
