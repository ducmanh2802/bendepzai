# MASTER PROMPT — CHESS KINGDOM
## Xây dựng game cờ vua giáo dục từ cơ bản đến siêu khó
### Tích hợp vào Kho Báu Tri Thức — Lớp 1

Bạn là một đội ngũ chuyên gia gồm:
- Kiến trúc sư phần mềm cấp cao.
- Nhà phát triển game cờ vua.
- Chuyên gia luật cờ vua FIDE.
- Chuyên gia engine cờ vua Stockfish.
- Huấn luyện viên cờ vua thiếu nhi.
- Chuyên gia UI/UX game giáo dục cao cấp.

Nhiệm vụ: kiểm tra source code hiện tại của **Kho Báu Tri Thức — Lớp 1**, sau đó trực tiếp xây dựng một phân hệ cờ vua hoàn chỉnh, có thể chơi được, có bài học từ cơ bản đến nâng cao, giải thích nước đi, luyện chiến thuật và đấu với máy từ dễ đến siêu khó.

Tên sản phẩm:

**CHESS KINGDOM — VƯƠNG QUỐC CỜ VUA**

Khẩu hiệu: “Học từng nước cờ — Rèn tư duy — Chinh phục Đại kiện tướng.”

Đây là yêu cầu lập trình và tích hợp thực tế. Không chỉ viết kế hoạch, tạo mockup hoặc dựng bàn cờ trang trí.

---

# PHẦN 1. KIỂM TRA DỰ ÁN VÀ BẢO TOÀN CODE

Trước khi sửa code:

1. Đọc kiến trúc dự án hiện tại.
2. Xác định công nghệ frontend, router, UI components, hệ thống lưu tiến độ và cấu hình build.
3. Kiểm tra xem dự án đã có thư viện bàn cờ, luật cờ hoặc engine cờ vua chưa.
4. Tận dụng component hiện có nếu phù hợp.
5. Chỉ sửa những file cần thiết.
6. Không tạo dự án mới bên ngoài ứng dụng hiện tại.
7. Không phá hỏng Toán, Tiếng Việt, Chính tả, English IOE và các phân hệ khác.
8. Không xóa dữ liệu hoặc ghi đè các thay đổi sẵn có của người dùng.
9. Không tự động triển khai production.
10. Sau mỗi giai đoạn, chạy kiểm thử và sửa lỗi.

Nếu chưa có thư viện phù hợp, đánh giá `chess.js` cho luật cờ và `react-chessboard` hoặc giải pháp tương thích với framework hiện tại cho bàn cờ. Chọn phiên bản tương thích trước khi thêm dependency.

Đối với AI chơi cờ, ưu tiên Stockfish thực sự chạy trong Web Worker nếu môi trường hỗ trợ. Kiểm tra giấy phép, nguồn tải, khả năng tương thích trình duyệt và giới hạn tài nguyên.

Không sử dụng các nước đi ngẫu nhiên để giả làm AI cờ vua.

---

# PHẦN 2. THIẾT KẾ GAME ĐẸP MẮT

Tạo giao diện có chất lượng như một game cờ vua thương mại cao cấp nhưng vẫn thân thiện với trẻ em.

## Phong cách hình ảnh

Chủ đề: lâu đài, vương quốc, hiệp sĩ, kho báu và hành trình trở thành đại kiện tướng.

Yêu cầu:
- Bàn cờ 8×8 rõ nét.
- Quân cờ đẹp, đồng nhất, dễ phân biệt.
- Có thể chọn phong cách quân cờ cổ điển hoặc hoạt hình.
- Hiệu ứng di chuyển quân mượt mà.
- Hiệu ứng đánh dấu nước đi trước.
- Hiệu ứng chiếu vua, chiếu bí và hoàn thành nhiệm vụ.
- Âm thanh di chuyển quân có thể bật/tắt.
- Giao diện tối và sáng nếu phù hợp design system hiện tại.
- Hỗ trợ tiếng Việt.
- Responsive trên điện thoại, tablet và desktop.
- Không để hiệu ứng làm giảm khả năng đọc bàn cờ.
- Không dùng quá nhiều animation gây mất tập trung.

## Trang chủ

Tạo các khu vực:

1. Học cờ vua.
2. Chơi với máy.
3. Luyện chiến thuật.
4. Giải thế cờ.
5. Xem lại ván đấu.
6. Bài học chiếu bí.
7. Lịch sử và thành tích.
8. Hành trình chinh phục các cấp độ.

Hiển thị cấp độ hiện tại, bài học tiếp theo, số trận thắng, kỹ năng đã hoàn thành và những kỹ năng cần luyện.

---

# PHẦN 3. CHƯƠNG TRÌNH HỌC TỪ SỐ 0

Xây dựng các bài học có bàn cờ tương tác. Mỗi bài gồm giải thích ngắn, minh họa trực quan, bài tập, phản hồi và đáp án được kiểm tra bằng luật cờ thực.

## Cấp 0 — Làm quen

- Cờ vua là gì?
- Mục tiêu của ván cờ.
- Hai bên Trắng và Đen.
- Bàn cờ có 64 ô.
- Hàng, cột, đường chéo.
- Tọa độ a–h và 1–8.
- Cách đặt bàn cờ.
- Cách xếp đủ 32 quân.

## Cấp 1 — Học sáu loại quân

Dạy riêng từng quân:

- Vua.
- Hậu.
- Xe.
- Tượng.
- Mã.
- Tốt.

Mỗi quân có:
- Hình minh họa lớn.
- Tên tiếng Việt.
- Ký hiệu hoặc tên tiếng Anh nếu hữu ích.
- Các hướng di chuyển.
- Những ô có thể đến.
- Quân có thể bắt.
- Ví dụ đi đúng và đi sai.
- Bài tập tương tác.
- Trò chơi nhận diện quân.

Đặc biệt:
- Mã đi hình chữ L và có thể nhảy qua quân khác.
- Xe, tượng, hậu không thể nhảy qua quân cản.
- Tốt đi thẳng nhưng bắt chéo về phía trước.
- Vua không được đi vào ô bị tấn công.

## Cấp 2 — Đi quân và ăn quân

- Chọn quân và xem nước đi hợp lệ.
- Chạm ô đích để di chuyển.
- Kéo thả quân nếu hỗ trợ tốt.
- Nhận biết ô bị chiếm.
- Nhận biết quân đang bị tấn công.
- Tìm quân được bảo vệ.
- Phân biệt nước đi hợp lệ và bất hợp lệ.
- Tính giá trị tương đối của quân.
- Thực hành đổi quân có lợi.

## Cấp 3 — Luật cờ hoàn chỉnh

- Luân phiên lượt.
- Trắng đi trước.
- Chiếu vua.
- Ba cách thoát chiếu khi hợp lệ.
- Chiếu đôi.
- Chiếu bí.
- Hòa do hết nước đi.
- Nhập thành cánh vua và cánh hậu.
- Phong cấp tốt.
- Bắt tốt qua đường.
- Lặp lại vị trí.
- Quy tắc 50 nước và các trường hợp hòa.
- Các quy tắc kết thúc ván đấu.

Mọi luật phải được thực thi trong bàn cờ, không chỉ mô tả bằng văn bản.

## Cấp 4 — Chiến thuật cơ bản

- Quân bị treo.
- Bắt quân miễn phí.
- Đòn đôi.
- Ghim quân.
- Xiên quân.
- Tấn công mở.
- Chiếu mở.
- Nhử quân.
- Đánh lạc hướng.
- Phòng thủ quân.
- Trao đổi quân có lợi.
- Nhận diện đe dọa của đối phương.

Mỗi chiến thuật phải có thế cờ hợp lệ, câu hỏi, gợi ý từng bước và lời giải.

## Cấp 5 — Khai cuộc

Dạy nguyên tắc trước khi học thuộc nước đi:

- Kiểm soát trung tâm.
- Phát triển mã và tượng.
- Đưa vua đến vị trí an toàn.
- Nhập thành khi phù hợp.
- Kết nối các quân.
- Không đưa hậu ra quá sớm khi không cần thiết.
- Không di chuyển cùng một quân quá nhiều lần mà không có mục đích.
- Không tham ăn tốt mà bỏ quên an toàn của vua.

Sau đó giới thiệu một số khai cuộc cơ bản với biến thể đã kiểm tra bằng engine.

Không dạy trẻ học thuộc các chuỗi nước dài mà không hiểu mục đích.

## Cấp 6 — Trung cuộc

- Lập kế hoạch.
- Cải thiện vị trí quân.
- Tấn công vua.
- Phòng thủ vua.
- Chiếm cột mở.
- Tạo điểm yếu.
- Tốt thông.
- Cấu trúc tốt.
- Tìm nước đi ứng viên.
- Tính toán biến thể.
- So sánh các phương án.

## Cấp 7 — Tàn cuộc

- Vua và tốt.
- Đối vua.
- Ô vuông của tốt.
- Tốt thông.
- Phong cấp.
- Chiếu bí bằng hậu và vua.
- Chiếu bí bằng xe và vua.
- Một số thế chiếu bí cơ bản.
- Tàn cuộc xe căn bản.
- Quy tắc hòa trong tàn cuộc.
- Tránh sai lầm khiến thế thắng thành hòa.

## Cấp 8 — Tư duy nâng cao

- Tính toán nhiều nước.
- Phòng thủ chính xác.
- Tìm nước duy nhất để cứu ván.
- Hy sinh quân có cơ sở.
- Đánh giá vị trí.
- Lợi thế vật chất.
- Lợi thế không gian.
- Hoạt động của quân.
- An toàn vua.
- Tạo kế hoạch dài hạn.
- Phân tích sai lầm sau ván đấu.
- Thực hành các thế cờ chiến thuật và chiến lược nâng cao.

Mỗi bài phải mở khóa theo tiến độ hoặc cho phép phụ huynh mở thủ công.

---

# PHẦN 4. HỆ THỐNG ĐỐI THỦ AI TỪ DỄ ĐẾN SIÊU KHÓ

Đây là một trong những tính năng quan trọng nhất.

Xây dựng màn hình “Chọn đối thủ” với các cấp độ sau:

### Cấp 1 — Tập sự
Dành cho người vừa học xong cách đi quân.

- Chơi chậm.
- Cho phép gợi ý.
- Ưu tiên nước đi đơn giản.
- Giải thích lỗi cơ bản sau ván.

### Cấp 2 — Học việc
- Biết bắt quân khi thuận lợi.
- Có thể bỏ sót một số chiến thuật.
- Hạn chế tính toán sâu.

### Cấp 3 — Tân binh
- Biết phát triển quân.
- Biết nhập thành khi thích hợp.
- Tránh một số nước đi mất quân trực tiếp.

### Cấp 4 — Chiến binh
- Tìm chiến thuật cơ bản.
- Biết phối hợp các quân.
- Phòng thủ các đe dọa rõ ràng.

### Cấp 5 — Hiệp sĩ
- Tính toán sâu hơn.
- Biết khai cuộc và tàn cuộc cơ bản.
- Khó bị bắt quân miễn phí.

### Cấp 6 — Kỵ sĩ tinh nhuệ
- Chơi chắc chắn.
- Phát hiện đòn đôi, ghim và xiên.
- Biết xử lý các vị trí chiến thuật thông thường.

### Cấp 7 — Chỉ huy
- Tính toán nhiều biến thể.
- Tìm kế hoạch trung cuộc.
- Phòng thủ tốt hơn.

### Cấp 8 — Đại kiện tướng
- Sử dụng engine với cấu hình sức chơi mạnh.
- Hạn chế gợi ý trong ván đấu nếu người chơi chọn.
- Có phân tích ván đấu sau khi kết thúc.

### Cấp 9 — Thử thách chuyên gia
- Tăng tài nguyên tính toán và giới hạn tìm kiếm phù hợp.
- Phân tích sâu hơn.
- Hỗ trợ các thế cờ khó.

### Cấp 10 — SIÊU KHÓ
- Sử dụng Stockfish thực sự với cấu hình engine mạnh nhất mà thiết bị và môi trường cho phép.
- Tăng giới hạn tìm kiếm, thời gian hoặc tài nguyên tính toán.
- Hạn chế hoặc tắt gợi ý trong khi chơi.
- Cho phép phân tích hậu kiểm sâu hơn sau trận.

## Quy tắc kỹ thuật quan trọng

1. Ưu tiên Stockfish chạy trong Web Worker để không khóa giao diện.
2. Dùng thư viện luật cờ đáng tin cậy để xác thực nước đi.
3. Không dùng danh sách nước đi ngẫu nhiên để giả làm đối thủ AI.
4. Nếu engine có hỗ trợ cấu hình Skill Level, UCI Elo hoặc giới hạn tìm kiếm, hãy kiểm tra phiên bản thực tế trước khi dùng.
5. Nếu giới hạn sức chơi bằng cách giảm Skill Level hoặc độ sâu, phải ghi rõ cách vận hành.
6. Không tuyên bố cấp độ có Elo cụ thể nếu chưa đo kiểm đáng tin cậy.
7. Cấp “siêu khó” phải thực sự dùng engine và cấu hình mạnh hơn các cấp dễ.
8. Tôn trọng giới hạn bộ nhớ, CPU và pin trên điện thoại.
9. Có nút dừng suy nghĩ, hủy phân tích và bắt đầu ván mới.
10. Nếu engine không tải được, thông báo rõ và không giả vờ rằng máy đã suy nghĩ.
11. Hiển thị trạng thái “Máy đang tính toán” khi engine hoạt động.
12. Không để engine chiếm dụng toàn bộ CPU hoặc làm treo trang.

Nếu thiết bị không đủ sức chạy cấu hình mạnh, tự giảm tài nguyên một cách minh bạch và giải thích rằng sức chơi thực tế phụ thuộc cấu hình.

---

# PHẦN 5. CHẾ ĐỘ HƯỚNG DẪN NƯỚC ĐI

Xây dựng chế độ “Huấn luyện viên cờ vua”.

Khi con chơi:
- Cho phép yêu cầu gợi ý.
- Làm nổi bật các nước đi hợp lệ.
- Hiển thị mối đe dọa của đối phương.
- Cảnh báo quân đang bị tấn công nếu người chơi bật trợ giúp.
- Giải thích tại sao một nước đi có thể tốt hoặc nguy hiểm.
- Cho phép xem ví dụ trên bàn cờ.
- Cho phép hoàn tác trong chế độ luyện tập.
- Có thể tắt gợi ý khi đấu thử thách.

Ví dụ phản hồi:

“Con đang định di chuyển hậu. Hãy kiểm tra xem vua của con có an toàn không nhé.”

“Quân mã của con đang bị tấn công. Con có thể di chuyển nó, bảo vệ nó hoặc đổi quân nếu hợp lý.”

“Đối thủ vừa chiếu vua. Con phải chọn một nước đi hợp lệ để thoát chiếu.”

Không chỉ nói “Sai rồi”. Phải chỉ ra vấn đề và hướng dẫn con suy nghĩ.

## Giải thích sau nước đi

Nếu engine hỗ trợ phân tích:
- Xác định vị trí trước và sau nước đi.
- Phân tích nước đi bằng engine.
- Giải thích bằng ngôn ngữ phù hợp cấp độ.
- Phân biệt sai lầm nghiêm trọng với nước đi chưa tối ưu.
- Không bịa ra biến thể nếu chưa được tính toán.

Nếu chưa có engine phân tích, chỉ đưa ra phản hồi dựa trên luật hoặc quy tắc đơn giản đã xác minh. Không tuyên bố đó là nước đi tốt nhất.

---

# PHẦN 6. GAME CHIẾN THUẬT VÀ GIẢI ĐỐ

Tạo nhiều chế độ chơi:

1. Tìm nước đi hợp lệ.
2. Tìm quân có thể bắt.
3. Thoát chiếu.
4. Chiếu trong một nước.
5. Chiếu bí trong một nước.
6. Chiếu bí trong hai nước.
7. Tìm đòn đôi.
8. Tìm ghim quân.
9. Tìm xiên quân.
10. Tìm nước đi thắng quân.
11. Tìm nước phòng thủ.
12. Giải thế cờ tàn cuộc.
13. Tìm nước đi duy nhất để cứu ván.
14. Thử thách tính toán ba nước.
15. Thử thách chiến thuật nâng cao.

Mỗi câu đố phải có:
- ID duy nhất.
- Vị trí FEN hợp lệ.
- Bên đi.
- Nhiệm vụ.
- Đáp án.
- Các biến thể hợp lệ nếu có.
- Gợi ý.
- Giải thích.
- Mức độ.
- Nguồn hoặc phương pháp kiểm tra.

Dùng thư viện luật cờ để xác minh nước đi hợp lệ. Dùng engine hoặc quy trình kiểm chứng đáng tin cậy để xác nhận các câu đố chiến thuật. Không đánh dấu một bài là chiếu bí nếu vẫn tồn tại nước đi thoát chiếu.

---

# PHẦN 7. PHÂN TÍCH VÁN CỜ SAU KHI CHƠI

Sau khi ván đấu kết thúc, cung cấp:
- Kết quả thắng, thua hoặc hòa.
- Số nước đã đi.
- Các nước đi đáng chú ý.
- Các lỗi chiến thuật lớn nếu xác định được.
- Các cơ hội bắt quân bị bỏ lỡ nếu có cơ sở.
- Thời điểm vua bị nguy hiểm.
- Nước đi nên xem lại.
- Bài học tương ứng để luyện thêm.

Nếu Stockfish được tích hợp:
- Cho phép phân tích từng nước.
- Hiển thị đánh giá vị trí nếu cấu hình hỗ trợ.
- Có thể so sánh nước đã đi với phương án engine đề xuất.
- Giải thích khác biệt theo trình độ người học.

Không gọi mọi nước không trùng với lựa chọn engine là sai. Phải phân biệt nước sai rõ ràng, nước chưa tối ưu và các phương án hợp lý.

Không bịa số liệu về độ chính xác hoặc Elo.

Cho phép lưu lịch sử ván đấu theo định dạng PGN nếu có thể triển khai an toàn.

---

# PHẦN 8. LƯU TIẾN ĐỘ VÀ HỆ THỐNG THÀNH TÍCH

Lưu:
- Bài học đã hoàn thành.
- Kỹ năng đã nắm vững.
- Câu đố đã giải.
- Lịch sử đấu với máy.
- Kết quả thắng/thua/hòa.
- Cấp độ đối thủ đã thử.
- Các lỗi lặp lại.
- Mục tiêu học tiếp theo.

Tạo huy hiệu:
- Nhận diện quân cờ.
- Bậc thầy mã.
- Chuyên gia thoát chiếu.
- Thợ săn chiến thuật.
- Vua khai cuộc.
- Nhà chiến lược.
- Bậc thầy tàn cuộc.
- Nhà vô địch vương quốc.

Chỉ cấp huy hiệu khi điều kiện thực tế được thỏa mãn. Không cấp thưởng giả khi chỉ mở màn hình.

Tạo chế độ phụ huynh để xem tiến độ và điều chỉnh độ khó. Không yêu cầu tài khoản ngoài nếu kiến trúc hiện tại không cần.

---

# PHẦN 9. KIỂM THỬ LUẬT CỜ

Viết test cho:
- Vị trí bắt đầu có 32 quân.
- Trắng đi trước.
- Nước đi hợp lệ của sáu loại quân.
- Quân cản đường.
- Mã nhảy qua quân.
- Tốt đi hai ô từ vị trí ban đầu.
- Tốt bắt chéo.
- Nhập thành đúng và sai điều kiện.
- Phong cấp.
- Bắt tốt qua đường.
- Không để vua tự đi vào ô bị tấn công.
- Chiếu và thoát chiếu.
- Chiếu bí.
- Hòa do hết nước đi.
- Hòa theo các quy tắc được hỗ trợ.
- Đổi lượt.
- Hoàn tác.
- Khởi động lại.
- Không để trạng thái bàn cờ sai sau nhiều nước đi.

Kiểm tra bàn cờ và engine không bị lệch trạng thái sau mỗi nước đi.

# PHẦN 10. HIỆU NĂNG VÀ TƯƠNG THÍCH

Kiểm tra:
- Điện thoại 320×568.
- Điện thoại 375×667.
- Điện thoại 390×844.
- Tablet.
- Desktop.

Đảm bảo:
- Bàn cờ không bị méo.
- Quân cờ không tràn ô.
- Không có lỗi khi chạm.
- Không bị treo khi engine suy nghĩ.
- Có thể dừng tìm kiếm.
- Không phát âm thanh nếu người chơi đã tắt âm thanh.
- Không làm hỏng các phân hệ hiện có.
- Không có lỗi typecheck, lint, test hoặc build mới.

# PHẦN 11. THỨ TỰ TRIỂN KHAI

Thực hiện theo từng giai đoạn:

Giai đoạn 1:
- Trang chủ Chess Kingdom.
- Bàn cờ thật.
- Sáu loại quân.
- Luật đi và bắt quân.
- Bài học tương tác.

Giai đoạn 2:
- Chiếu, thoát chiếu, chiếu bí.
- Luật đặc biệt.
- Câu đố chiến thuật.
- Lưu tiến độ.

Giai đoạn 3:
- Tích hợp Stockfish.
- Đấu với máy từ dễ đến siêu khó.
- Tùy chọn gợi ý.
- Điều chỉnh sức chơi theo tài nguyên.

Giai đoạn 4:
- Phân tích ván cờ.
- Hệ thống bài học cá nhân hóa.
- Khai cuộc, trung cuộc và tàn cuộc.
- Thành tích và báo cáo phụ huynh.

Nếu không thể hoàn thành toàn bộ trong một lượt, hoàn thiện một giai đoạn có thể sử dụng thật trước khi tiếp tục. Không tạo 15 màn hình rỗng và tuyên bố đã xong.

# PHẦN 12. BÁO CÁO CUỐI CÙNG

Báo cáo rõ:
1. Các tính năng đã hoạt động.
2. Các bài học đã triển khai.
3. Thư viện luật cờ được sử dụng.
4. Engine thực tế được tích hợp và cách chạy.
5. Các cấp độ đối thủ hoạt động như thế nào.
6. Các test đã chạy và kết quả.
7. Kết quả build.
8. Tình trạng Preview.
9. Các giới hạn thiết bị và tính năng chưa hoàn thành.

Không tuyên bố AI siêu mạnh nếu engine chưa chạy. Không tuyên bố luật cờ chính xác nếu chưa kiểm thử.

**Bắt đầu bằng việc kiểm tra source code hiện tại, sau đó trực tiếp xây dựng Chess Kingdom — Vương Quốc Cờ Vua trong Kho Báu Tri Thức — Lớp 1. Ưu tiên game đẹp, bàn cờ đúng luật, giải thích dễ hiểu và đối thủ AI thực sự có nhiều cấp độ từ dễ đến siêu khó.**