# BÁO CÁO KIỂM THỬ CHẤT LƯỢNG — KHO BÁU TRI THỨC
## Quality Assurance & Verification Matrix

### 1. Ma Trận Kiểm Thử Chức Năng (Feature Test Matrix)

| Hạng mục kiểm thử | Kịch bản kiểm thử | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :--- |
| **Giao diện Trang Chủ** | Hiển thị lời chào cá nhân, XP, Sao, Chuỗi ngày, 3 nút môn học to rõ ràng | Hoạt động mượt mà, đúng chuẩn Top Bar Contract | **PASS** |
| **Môn Tiếng Việt** | 10 chủ điểm, các dạng câu hỏi: trắc nghiệm, điền khuyết, xếp câu, đọc hiểu | Tương tác tốt, có nút loa nghe phát âm | **PASS** |
| **Môn Toán Học** | 10 chủ điểm: đếm 0-20, so sánh >, <, =, cộng trừ, hình học, lời văn | Trực quan, minh họa sinh động | **PASS** |
| **Môn Tiếng Anh** | 10 chủ điểm: Phonics, numbers, colors, animals, school, family | Phát âm chuẩn tiếng Anh qua Web Speech API | **PASS** |
| **14 Mini-Games** | 14 trò chơi với cơ chế riêng biệt, có điểm, âm thanh và màn ăn mừng | Chơi mượt mà, không giật lag | **PASS** |
| **Ôn Tập Thông Minh** | Tự động chọn câu hỏi từ nhóm kỹ năng yếu và câu sai gần đây | Sinh bộ câu hỏi chính xác | **PASS** |
| **Thử Thách Tuần** | Đấu trường 8 câu hỏi tổng hợp, nhận cúp vàng danh dự | Hoàn thành và ghi nhận tiến độ | **PASS** |
| **Khu Vườn Cây Tri Thức** | Cây lớn theo số lượng bài học, tưới nước có hoa nở | Hiệu ứng sinh động, tạo động lực | **PASS** |
| **Phòng Đồ & Linh Thú** | Đổi mascot, mở khóa mũ, kính, balo bằng sao vàng | Lưu trữ trang bị vào hồ sơ | **PASS** |
| **Khu Vực Phụ Huynh** | Cổng Parent Gate phép tính 2 chữ số, bảng báo cáo phân tích | Bảo mật, chẩn đoán sư phạm chi tiết | **PASS** |
| **Giới Hạn Màn Hình** | Cảnh báo nghỉ ngơi khi học đủ số phút quy định | Nhắc nhở ấm áp bảo vệ mắt bé | **PASS** |
| **Lưu Trữ Dữ Liệu** | Tải lại trang (F5/Reload) tiến độ học tập vẫn giữ nguyên vẹn | Dữ liệu được lưu trữ an toàn trong localStorage | **PASS** |
| **Kiểm Tra Biên Dịch** | Typecheck và Build thành công không có lỗi | `tsc --noEmit` & `npm run build` PASS | **PASS** |
| **Kiểm Thử Tự Động (Vitest)** | 5 files kiểm thử (24 bài test) bao phủ: Learning Engine, Math, Vietnamese, English, Parent Mode | 24/24 tests passed (100%) | **PASS** |
| **Tuân Thủ iFrame Sandbox** | Không sử dụng `window.alert` hoặc `window.confirm` chặn giao diện | Toàn bộ xác nhận thực hiện in-modal an toàn | **PASS** |

---

## 2.1 Bổ sung — Kid's Box Companion Track (British English)

| Hạng mục kiểm thử | Kịch bản kiểm thử | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :--- |
| **Vào Kid's Box Companion** | English → thẻ Kid's Box → hub | Hiện đủ 9 bước, current unit do phụ huynh chọn | **PASS** |
| **British English** | Locale duy nhất `en-GB`, không dùng `en-US` làm mặc định | Nhãn `🔊 Giọng English (en-US) — không phải en-GB` trên máy không có en-GB | **PASS** |
| **Listening** | Nghe lại / nghe chậm / không trừ điểm | Cả hai nút luôn bật, có câu "không bị trừ điểm" | **PASS** |
| **Speaking** | Có/không nhận giọng nói | Ghi `speech recognition match` hoặc `self-check`; **không** có điểm phát âm | **PASS** |
| **Evidence → Learning OS** | Làm đúng hoạt động nghe | `P30-v1`, skill `EN-VOCAB-LISTENING`, evidence ghi vào store chung | **PASS** |
| **Idempotency** | Bấm lại / tải lại trang | Không đếm hai lần (test tự động) | **PASS** |
| **Trò chơi → evidence** | Word Safari | Taps đúng/sai đều thành evidence; điểm game **không** thành mastery | **PASS** |
| **Adaptive English** | Persona A/B/C/D/E | A→nghe, B→nói, C→từ vựng, D→khám phá nhẹ, E→không ép tốc độ | **PASS** |
| **English hôm nay** | Bé mới / bé mệt | 8–12 phút theo tuổi; bé mệt ⇒ bỏ nghe, nói, game | **PASS** |
| **Ôn tập quên** | Sai một lần | `correctCount` giữ nguyên, chỉ rút ngắn khoảng cách ôn | **PASS** |
| **Ôn ở nhà** | Chọn Unit → xem gói ôn | 5 phần từ chính hoạt động của Unit | **PASS** |
| **Parent Mode** | Cổng phép tính → tab Kid's Box | Current Unit/Lesson/Homework, sao theo bằng chứng, báo cáo tuần | **PASS** |
| **Báo cáo tuần** | 7 ngày | Số liệu thật, có câu "không so với bạn khác" | **PASS** |
| **Tách Đấu Trường** | Skill `EN-*` | Không xuất hiện trong competition taxonomy/blueprint/câu hỏi | **PASS** |
| **Không bịa nội dung** | Kiểm tra nội dung giáo trình | `CONTENT_SOURCE_REQUIRED` + 7 nhóm tài liệu cần bổ sung | **PASS** |
| **Validation nội dung** | `runContentValidation()` | 0 lỗi (đã gộp cổng kiểm tra Kid's Box) | **PASS** |
| **Persistence** | Reload | Evidence, tiến bộ, current unit giữ nguyên; JSON hỏng không crash | **PASS** |
| **Accessibility** | Audio không phải kênh duy nhất | Mọi mục có `captionEn`; nút ≥ 44px; có nhãn ARIA | **PASS** |
| **Hiệu năng** | Bundle | Chunk Kid's Box 23.5 kB (6.8 kB gzip), lazy-load | **PASS** |
| **Kiểm thử tự động** | 3 file mới | 62 test Kid's Box; tổng **193/193 test PASS** | **PASS** |

Chi tiết đầy đủ: `docs/ENGLISH_KIDBOX_TEST_REPORT.md`.
