# MASTER PROMPT — XÂY DỰNG PHÂN HỆ CỜ TƯỚNG TỪ CƠ BẢN ĐẾN SIÊU KHÓ
## Dự án: Kho Báu Tri Thức — Lớp 1

Bạn là Senior Game Developer, chuyên gia cờ tướng, chuyên gia giáo dục trẻ em và kỹ sư AI. Hãy trực tiếp kiểm tra mã nguồn dự án hiện tại trong Google AI Studio Build mode, sau đó xây dựng hoàn chỉnh một phân hệ học và chơi cờ tướng dành cho trẻ em Việt Nam, từ người chưa biết luật đến trình độ nâng cao.

Tên phân hệ: **VƯƠNG QUỐC CỜ TƯỚNG — BÉ LÀM KỲ THỦ**.

Mục tiêu: biến việc học cờ tướng thành hành trình khám phá, luyện tập, đấu với bot, vượt thử thách và trở thành kỳ thủ nhí.

## 1. NGUYÊN TẮC BẮT BUỘC

1. Không tạo dự án mới, không viết lại toàn bộ ứng dụng. Trước tiên đọc cấu trúc source, framework, routing, UI, cách lưu tiến độ và các thành phần hiện có.
2. Tích hợp vào ứng dụng Kho Báu Tri Thức hiện tại, tuân thủ phong cách thiết kế và hệ thống điều hướng đang dùng.
3. Không phá vỡ các phân hệ Toán, Tiếng Việt, Tiếng Anh, Cờ vua hoặc các tính năng khác.
4. Game phải có bàn cờ tương tác thật, xử lý luật cờ tướng chính xác và có thể chơi hoàn chỉnh từ đầu đến cuối.
5. Bot phải thực sự tìm kiếm và đánh giá nước đi. Không dùng lựa chọn nước ngẫu nhiên rồi quảng cáo là AI thông minh.
6. Mọi bài học, thế cờ, lời giải và nước đi mẫu phải được kiểm tra hợp lệ.
7. Giao diện hoàn toàn bằng tiếng Việt, phù hợp với trẻ 6 tuổi; giải thích ngắn, dễ hiểu, có hình ảnh minh họa, giọng điệu vui vẻ.
8. Ưu tiên thư viện mã nguồn mở và giải pháp chạy miễn phí. Không yêu cầu API trả phí hoặc API key bắt buộc.
9. Không báo tính năng đã hoàn thành nếu chưa chạy kiểm thử và xác minh thực tế.

## 2. THIẾT KẾ GIAO DIỆN GAME

Tạo một thế giới cờ tướng hoạt hình đẹp mắt, có cảm giác như một trò chơi giáo dục cao cấp.

### Màn hình chính

Tên: “Vương Quốc Cờ Tướng”.

Các khu vực:
- Tiếp tục bài học đang học.
- Học cách đi quân.
- Luyện tập theo nhiệm vụ.
- Đấu với máy.
- Giải thế cờ.
- Học chiến thuật.
- Lịch sử và thành tích.
- Hướng dẫn dành cho phụ huynh.

Hiển thị tiến độ hành trình bằng bản đồ các vùng đất:
- Làng Khởi Đầu.
- Rừng Quân Cờ.
- Thành Trì Phòng Thủ.
- Chiến Trường Chiến Thuật.
- Vương Quốc Cao Thủ.
- Đỉnh Cao Đại Sư.

Mỗi vùng đất có bài học, nhiệm vụ, phần thưởng và điều kiện mở khóa.

### Bàn cờ

- Bàn cờ tướng chuẩn 9 cột × 10 hàng, các quân đặt tại giao điểm.
- Có sông chia đôi bàn cờ.
- Có cung Tướng ở mỗi bên.
- Quân Đỏ và quân Đen phân biệt rõ ràng.
- Quân cờ có hình và chữ Hán/nhãn tiếng Việt dễ nhận biết.
- Nước đi hợp lệ được đánh dấu bằng chấm hoặc vùng sáng.
- Ô đang chọn, nước vừa đi, nước gợi ý và quân bị đe dọa có màu khác nhau.
- Có hiệu ứng chuyển động quân mượt, âm thanh tùy chọn và hiệu ứng chiến thắng.
- Có thể bật/tắt âm thanh và hiệu ứng.
- Hỗ trợ màn hình điện thoại 375 × 667, máy tính bảng và desktop.
- Không để bàn cờ tràn màn hình hoặc các nút bị che khuất.
- Có nút Hoàn tác, Làm lại khi phù hợp, Gợi ý, Chơi lại, Tạm dừng và Thoát.
- Cho phép chọn quân bằng cách chạm quân rồi chạm điểm đến; không bắt buộc kéo thả.

Không sử dụng hình bàn cờ tĩnh thay cho game tương tác.

## 3. CHƯƠNG 1 — NHẬN BIẾT QUÂN CỜ

Dạy từng quân theo thứ tự từ dễ đến khó.

### Tướng
- Tướng là ai trong vương quốc?
- Vị trí ban đầu của Tướng.
- Tướng đi ngang hoặc dọc một điểm trong cung.
- Tướng không được tự đi vào vị trí bị đối phương ăn.
- Hai Tướng không được nhìn thẳng mặt nhau trên cùng một cột nếu không có quân cản.
- Tướng bị chiếu là gì?
- Cách thoát chiếu.

### Sĩ
- Sĩ bảo vệ Tướng.
- Chỉ đi chéo một điểm trong cung.
- Giới hạn phạm vi hoạt động.

### Tượng
- Tượng đi chéo hai điểm.
- Không được qua sông.
- Nếu có quân chặn giữa đường chéo thì Tượng không đi được.
- Giải thích lỗi “cản mắt Tượng” bằng hoạt ảnh.

### Xe
- Đi ngang hoặc dọc bao nhiêu ô cũng được nếu đường đi thông.
- Không được nhảy qua quân.
- Làm quen với sức mạnh của Xe qua trò chơi nhỏ.

### Pháo
- Đi ngang hoặc dọc như Xe khi không ăn quân.
- Khi ăn quân, phải có đúng một quân làm ngòi giữa Pháo và quân bị ăn.
- Giải thích “ngòi Pháo” bằng mô phỏng trực quan.
- Cho trẻ thử nhiều tình huống ăn quân và không ăn được.

### Mã
- Mã đi theo hình chữ L.
- Giải thích “cản chân Mã”.
- Minh họa tất cả hướng đi hợp lệ và trường hợp bị chặn.

### Tốt/Binh
- Trước khi qua sông, chỉ đi thẳng một điểm về phía trước.
- Sau khi qua sông, được đi thẳng hoặc ngang một điểm.
- Không được đi lùi.
- Tốt không ăn quân theo đường chéo như cờ vua.

Với mỗi quân, bắt buộc có:
1. Hình minh họa.
2. Mô phỏng nước đi.
3. Các điểm đến hợp lệ.
4. Ví dụ quân bị chặn.
5. Bài tập chọn nước đi đúng.
6. Trò chơi nhỏ tương tác.
7. Bài kiểm tra 5 câu.
8. Phần thưởng khi hoàn thành.

Không chỉ đưa ra văn bản dài để trẻ đọc.

## 4. CHƯƠNG 2 — LÀM QUEN BÀN CỜ VÀ XẾP QUÂN

Dạy trẻ:
- Nhận biết bên Đỏ và bên Đen.
- Tên và vị trí 32 quân cờ.
- Cách xếp quân ban đầu chính xác.
- Hàng, cột và tọa độ nước đi.
- Cách luân phiên lượt Đỏ và Đen.
- Cách chọn quân và di chuyển.
- Vì sao không được đi vào vị trí không hợp lệ.
- Cách ghi lại nước đi ở mức cơ bản.

Có chế độ “Tự xếp bàn cờ”: trẻ tự kéo hoặc chạm để đặt quân vào đúng vị trí. Hệ thống kiểm tra, gợi ý và cho phép thử lại.

## 5. CHƯƠNG 3 — LUẬT CHƠI CỜ TƯỚNG

Dạy qua các thế cờ tương tác:
- Bắt quân đối phương.
- Quân bảo vệ lẫn nhau.
- Đổi quân.
- Chiếu Tướng.
- Chống chiếu bằng cách di chuyển Tướng, ăn quân đang chiếu hoặc chắn đường chiếu khi luật cho phép.
- Chiếu bí.
- Bắt bí và nhận biết tình thế thua.
- Hai Tướng đối mặt.
- Nước đi bất hợp lệ.
- Kết thúc ván và xác định bên thắng.
- Các trường hợp hòa theo bộ luật được triển khai.

Đặc biệt phải kiểm tra đầy đủ các tình huống:
- Tướng không được rời cung.
- Sĩ không được rời cung.
- Tượng không qua sông.
- Mã bị cản chân.
- Tượng bị cản mắt.
- Pháo ăn đúng một ngòi.
- Tốt không đi lùi.
- Không được để Tướng của mình bị chiếu sau nước đi.
- Không được bỏ qua nước chiếu.
- Tướng không được đối mặt trực tiếp khi không có quân cản.

Không cho phép game tiếp tục như bình thường khi ván đã kết thúc.

## 6. CHƯƠNG 4 — LUYỆN TẬP THEO NHIỆM VỤ

Tạo các bài tập tương tác từ dễ đến khó:
- Chọn đúng quân cờ.
- Tìm tất cả điểm đến hợp lệ.
- Di chuyển quân đến vị trí được yêu cầu.
- Ăn một quân cụ thể.
- Tìm nước đi giúp bảo vệ Tướng.
- Phát hiện quân đang bị đe dọa.
- Tìm cách thoát chiếu.
- Tìm nước chiếu Tướng.
- Tìm nước chiếu bí trong một hoặc nhiều nước.
- Chọn quân nào nên đổi.
- Tìm nước đi tốt nhất trong thế cờ.

Mỗi bài phải có:
- Mục tiêu rõ ràng.
- Hướng dẫn ngắn.
- Phản hồi đúng/sai ngay lập tức.
- Giải thích vì sao đúng hoặc sai.
- Nút gợi ý theo từng cấp.
- Nút thử lại.
- Điểm thưởng và tiến độ.

Không cho điểm chỉ vì trẻ bấm đúng nút hoặc đoán may mắn. Phải kiểm tra nước đi thực tế.

## 7. CHƯƠNG 5 — CHIẾN THUẬT CỜ TƯỚNG

Dạy từng chiến thuật bằng bàn cờ mô phỏng:
- Chiếu Tướng trực tiếp.
- Chiếu đôi khi có thể áp dụng hợp lệ.
- Bắt quân không được bảo vệ.
- Đòn đánh đôi.
- Đòn ghim và ràng buộc quân.
- Dụ quân.
- Đòn đánh lạc hướng.
- Chiếu để giành nhịp.
- Pháo đầu và các thế khai cuộc cơ bản.
- Phối hợp Xe, Pháo và Mã.
- Bảo vệ quân chủ lực.
- Tạo đòn tấn công vào Tướng.
- Nhận biết bẫy và tránh mất quân.
- Tính toán chuỗi nước đi.

Mỗi chiến thuật phải có thế cờ hợp lệ, đáp án được xác minh, lời giải từng bước và giải thích hậu quả nếu đi sai.

Không dùng tên chiến thuật nếu ví dụ minh họa không thực sự thể hiện chiến thuật đó.

## 8. CHƯƠNG 6 — KHAI CUỘC, TRUNG CUỘC, TÀN CUỘC

### Khai cuộc
- Mục tiêu phát triển quân.
- Đưa Xe, Mã, Pháo vào vị trí hữu ích.
- Tránh di chuyển một quân quá nhiều lần không cần thiết.
- Bảo vệ Tướng.
- Giới thiệu một số khai cuộc cờ tướng phổ biến bằng thế cờ đã xác minh.
- Không yêu cầu trẻ học thuộc quá nhiều biến ngay từ đầu.

### Trung cuộc
- Xây dựng kế hoạch.
- Phối hợp các quân.
- Tấn công và phòng thủ.
- Tìm điểm yếu trong đội hình đối thủ.
- Đánh giá lợi thế quân số và vị trí.
- Tính toán biến ngắn trước khi đi.

### Tàn cuộc
- Vai trò của Tướng, Tốt, Xe, Pháo và Mã trong tàn cuộc.
- Đưa Tốt qua sông.
- Phối hợp quân để tấn công.
- Phòng thủ thế yếu.
- Nhận biết thế hòa.
- Giới thiệu các thế tàn cuộc cơ bản, có lời giải xác minh.

## 9. CHẾ ĐỘ CHƠI VỚI BOT — TỪ DỄ ĐẾN SIÊU KHÓ

Tạo ít nhất 10 cấp độ AI có tên riêng, hình đại diện và phong cách chơi khác nhau.

1. **Bé Tập Sự** — chỉ chọn trong các nước hợp lệ, thiên về học và làm quen.
2. **Bạn Nhỏ** — biết ăn quân khi có cơ hội rõ ràng.
3. **Tân Binh** — biết tránh mất quân trong một số tình huống đơn giản.
4. **Chiến Binh** — biết tìm đòn chiếu và phòng thủ cơ bản.
5. **Hiệp Sĩ** — tính toán trước các nước bắt quân.
6. **Tướng Quân** — biết phối hợp quân và tránh một số bẫy.
7. **Cao Thủ** — đánh giá thế trận và tính toán nhiều nước hơn.
8. **Đại Cao Thủ** — tìm chiến thuật phức tạp và phản công.
9. **Thử Thách Khắc Nghiệt** — dùng engine mạnh với thời gian tính toán phù hợp.
10. **SIÊU KHÓ** — cấu hình engine mạnh nhất trong giới hạn phần cứng và thời gian thực tế cho phép.

### Yêu cầu kỹ thuật cho bot

- Dùng engine cờ tướng thực sự, ưu tiên engine mã nguồn mở tương thích với giao thức UCCI hoặc giao thức mà engine hỗ trợ.
- Nghiên cứu khả năng tích hợp Pikafish hoặc một engine cờ tướng mã nguồn mở phù hợp. Kiểm tra giấy phép, định dạng engine, khả năng chạy trên trình duyệt và giới hạn tài nguyên trước khi lựa chọn.
- Nếu engine native không chạy trực tiếp trên trình duyệt, dùng Web Worker/WebAssembly hoặc một phương án tương thích với môi trường deploy hiện tại.
- Không mặc định Stockfish là engine cờ tướng; Stockfish chủ yếu dành cho cờ vua quốc tế.
- Không giả vờ rằng tăng thời gian chờ hoặc chọn nước ngẫu nhiên sẽ tạo ra cấp độ khó cao hơn.
- Nếu cần bot mô phỏng nhẹ cho các cấp đầu, phải sử dụng tìm kiếm minimax/alpha-beta và hàm đánh giá phù hợp với luật cờ tướng; ghi rõ đó là bot nội bộ, không quảng cáo là engine mạnh.
- Các cấp độ thấp có thể giảm độ sâu, thời gian tìm kiếm hoặc sức mạnh lựa chọn nước đi, nhưng tuyệt đối không được đi nước bất hợp lệ.
- Các cấp cao phải tăng chất lượng tính toán thực tế, không chỉ đổi tên hoặc đổi màu giao diện.
- Có giới hạn thời gian tìm kiếm để tránh treo trình duyệt.
- Không chạy tính toán nặng trên luồng giao diện chính.
- Có cơ chế dừng engine khi đổi ván, thoát màn hình hoặc tải lại.
- Nếu engine không tải được, hiển thị thông báo rõ ràng và cho phép thử lại; không âm thầm chuyển sang bot giả.
- Hiển thị tên cấp độ, mô tả khả năng và thời gian suy nghĩ; không bịa Elo hoặc xếp hạng sức mạnh chưa được kiểm chứng.

### Tùy chọn trận đấu
- Người chơi chọn đi Đỏ hoặc Đen.
- Cho phép người chơi đi trước hoặc đi sau.
- Chọn cấp bot.
- Chọn chơi tự do hoặc có trợ giúp.
- Gợi ý một nước đi.
- Giải thích vì sao bot vừa đi nước đó.
- Xem lại toàn bộ nước đi.
- Hoàn tác trong chế độ luyện tập.
- Chơi lại từ đầu.
- Xin hòa hoặc đầu hàng khi luật và trạng thái ván cho phép.
- Lưu lịch sử ván đấu và cho phép xem lại.
- Tạm dừng hoặc thoát trận an toàn.

## 10. CHẾ ĐỘ “THẦY DẠY CỜ”

Tạo một người thầy hoạt hình thân thiện.

Trong ván chơi, người thầy có thể giải thích:
- “Con đang đưa quân nào đi?”
- “Quân này có thể đi đến những điểm nào?”
- “Nếu đi nước này, quân nào của con có thể bị ăn?”
- “Tướng của con có đang bị đe dọa không?”
- “Con có cách nào tốt hơn không?”
- “Vì sao đối thủ vừa đi nước đó?”
- “Nước đi này có giúp con bảo vệ quân không?”

Các nút trợ giúp:
- Gợi ý nhẹ.
- Hiện các nước hợp lệ.
- Gợi ý chiến thuật.
- Hiện nước đi tốt nhất nếu có phân tích đáng tin cậy.
- Giải thích từng bước.
- Phân tích sau ván đấu.

Không tiết lộ ngay đáp án nếu trẻ đang ở chế độ thử thách. Hãy đưa ra gợi ý tăng dần, khuyến khích trẻ tự suy nghĩ.

### Phân tích sau ván
- Tóm tắt ván đấu bằng ngôn ngữ đơn giản.
- Đánh dấu một số nước đi tốt.
- Phát hiện các nước đi có thể làm mất quân hoặc bỏ lỡ cơ hội rõ ràng, khi engine đủ khả năng xác định.
- Cho phép phát lại từ vị trí sai lầm để trẻ thử cách khác.
- Không khẳng định một nước là “sai lầm lớn” nếu chưa có phân tích đáng tin cậy.

## 11. KHO THẾ CỜ VÀ CÂU ĐỐ

Tạo bộ sưu tập thế cờ theo chủ đề:
- Ăn quân trong một nước.
- Chiếu Tướng trong một nước.
- Thoát chiếu.
- Bảo vệ quân.
- Chống chiếu bí.
- Chiếu bí trong một số nước.
- Tìm nước thắng.
- Tìm cách cứu hòa.
- Bài tập khai cuộc.
- Bài tập tàn cuộc.

Mỗi thế cờ phải chứa:
- Mã định danh ổn định.
- Vị trí bàn cờ được mã hóa theo định dạng phù hợp.
- Bên tới lượt đi.
- Mục tiêu.
- Lời giải hoặc tập nước đi đáp án.
- Lời giải thích.
- Mức độ khó.
- Bộ kiểm tra xác nhận lời giải hợp lệ.

Không sinh ngẫu nhiên thế cờ rồi tự nhận là có lời giải. Nếu chưa xác minh được, không đưa vào bài học chính thức.

## 12. LƯU TIẾN ĐỘ VÀ THÀNH TÍCH

Lưu theo hồ sơ người học:
- Bài đã học.
- Quân cờ đã thành thạo.
- Bài tập đúng/sai.
- Số lần dùng gợi ý.
- Cấp bot đã thắng.
- Ván đấu đã chơi.
- Thành tích theo ngày.
- Các kỹ năng còn yếu.
- Bài nên học tiếp theo.

Ưu tiên hệ thống lưu trữ hiện có của ứng dụng. Nếu chưa có backend phù hợp, dùng cơ chế lưu cục bộ an toàn theo kiến trúc hiện tại. Không thêm backend hoặc dịch vụ trả phí chỉ để lưu vài trường dữ liệu.

Có nút tiếp tục học và học lại từ đầu. Không làm mất tiến độ của các phân hệ khác.

## 13. THIẾT KẾ TRẢI NGHIỆM CHO TRẺ 6 TUỔI

- Chữ lớn, dễ đọc.
- Mỗi lần chỉ đưa ra một nhiệm vụ.
- Câu giải thích ngắn, từ ngữ thân thiện.
- Hạn chế chữ Hán khó đọc; luôn có nhãn tiếng Việt.
- Nút bấm đủ lớn trên điện thoại.
- Màu sắc sinh động nhưng không gây rối.
- Không phạt nặng khi đi sai.
- Khuyến khích thử lại và suy nghĩ.
- Có phần hướng dẫn cha mẹ hỗ trợ con.
- Có thể chơi mà không cần đăng nhập dịch vụ ngoài.
- Không yêu cầu trẻ cung cấp thông tin cá nhân.

## 14. KIẾN TRÚC VÀ CHẤT LƯỢNG CODE

Trước khi viết code:
1. Kiểm tra cấu trúc dự án.
2. Xác định framework, thư viện, router, hệ thống UI và cách lưu tiến độ.
3. Kiểm tra thư viện cờ tướng có sẵn và giấy phép sử dụng.
4. Thiết kế module luật chơi độc lập với giao diện.
5. Xác định giải pháp engine bot tương thích với môi trường Build/deploy.

Tổ chức code thành các module phù hợp với dự án, chẳng hạn:
- XiangqiBoard: bàn cờ.
- XiangqiPiece: quân cờ.
- XiangqiRules: luật và nước đi hợp lệ.
- XiangqiGame: trạng thái ván.
- XiangqiEngineAdapter: kết nối engine.
- XiangqiBot: cấp độ và cấu hình bot.
- XiangqiLessons: nội dung bài học.
- XiangqiPuzzles: kho thế cờ.
- XiangqiCoach: giải thích và gợi ý.
- XiangqiProgress: lưu tiến độ.
- XiangqiGameHistory: lịch sử trận đấu.

Đây là gợi ý, không bắt buộc tạo đúng tên nếu dự án có cấu trúc phù hợp hơn.

Không để component giao diện tự tính luật cờ. Tất cả nước đi phải đi qua một bộ luật thống nhất.

## 15. KIỂM THỬ BẮT BUỘC

Viết và chạy test cho:
- Bàn cờ ban đầu có đúng 32 quân.
- Tất cả quân ở đúng vị trí xuất phát.
- Nước đi hợp lệ và bất hợp lệ của từng loại quân.
- Mã bị cản chân.
- Tượng bị cản mắt và không qua sông.
- Pháo ăn quân đúng một ngòi.
- Tốt không đi lùi.
- Tướng và Sĩ không ra khỏi cung.
- Hai Tướng không đối mặt trực tiếp khi không có quân cản.
- Không được để Tướng mình bị chiếu.
- Phát hiện chiếu và chiếu bí.
- Đổi lượt chính xác.
- Phát hiện kết thúc ván.
- Bot luôn trả về nước đi hợp lệ.
- Hủy tìm kiếm engine khi thoát trận.
- Bài tập chỉ chấp nhận lời giải hợp lệ.
- Lưu và khôi phục tiến độ.
- Không lỗi khi chơi nhiều ván liên tiếp.
- Responsive trên điện thoại 375 × 667.
- Không làm hỏng các phân hệ hiện có.

Chạy các lệnh kiểm tra sẵn có của dự án như typecheck, lint, unit tests và build. Không tự ý xóa test hoặc nới lỏng kiểm tra để làm cho build xanh.

## 16. CÁCH TRIỂN KHAI

Thực hiện theo thứ tự:
1. Khảo sát source hiện tại và nêu ngắn gọn kế hoạch tích hợp.
2. Xây dựng bộ luật cờ tướng và test trước.
3. Xây dựng bàn cờ tương tác.
4. Xây dựng bài học cơ bản.
5. Xây dựng bot và xác minh engine.
6. Xây dựng chế độ thầy dạy cờ và bài tập.
7. Xây dựng cấp độ khó và kho thế cờ.
8. Tích hợp lưu tiến độ.
9. Hoàn thiện giao diện mobile.
10. Chạy kiểm thử hồi quy và build.

Ưu tiên hoàn thành một luồng chơi thật từ đầu đến cuối trước khi thêm hiệu ứng trang trí.

## 17. BÁO CÁO CUỐI

Sau khi thực hiện, báo cáo:
- Các file đã tạo và chỉnh sửa.
- Tính năng thực sự hoạt động.
- Engine cờ tướng đã tích hợp, nguồn và giấy phép.
- Cách 10 cấp độ bot khác nhau về mặt kỹ thuật.
- Kết quả test, typecheck và build.
- Những tính năng chưa hoàn thành.
- Các giới hạn hiệu năng trên trình duyệt hoặc thiết bị yếu.
- Hướng dẫn kiểm tra thủ công trên điện thoại.

Không tuyên bố “đã xong” nếu chỉ dựng giao diện. Nếu chưa tích hợp được engine mạnh, hãy nói rõ và hoàn thành phần luật, giao diện cùng bot nội bộ trong phạm vi đã kiểm chứng.

**BẮT ĐẦU:** Khảo sát dự án hiện tại, sau đó trực tiếp triển khai phân hệ cờ tướng hoàn chỉnh. Không chỉ trả lời bằng kế hoạch hoặc đoạn code minh họa; hãy sửa mã nguồn thật, kiểm thử và báo cáo kết quả trung thực.