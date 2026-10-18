# T17 — 4 trò chơi Tiếng Anh / Logic / Khoa học

**Phụ thuộc:** T16 (theo "Hợp đồng chung" trong `T15_game_tieng_viet_moi.md`). **Nhánh:** `p42/T17`

1. **Simon Says** (`simon_says`, English): Gấu nói lệnh British English ("Touch your nose!", "Clap three times!", "Show me something red"); bé chọn tranh đúng hành động/vật. Cấp cao: lệnh 2 bước, "Simon says" vs không có "Simon says" (bẫy vui).
2. **Word Train** (`word_builder_train`, English): ghép chữ cái thành từ CVC (cat, sun, pig, bed…) — chạm chữ nghe âm (phonics), xếp vào toa. Cấp cao: từ 4 chữ, digraph sh/ch đơn giản (ship, chip) theo Kid's Box.
3. **Lập Trình Tìm Kho Báu** (`treasure_coding`, logic): lưới 4×4 → 6×6, bé xếp chuỗi mũi tên ⬆️⬇️⬅️➡️ rồi bấm ▶ để Gấu đi tới rương, tránh đá/nước. Cấp cao: vòng lặp "×2", ô chìa khoá phải lấy trước. Có nút "chạy từng bước".
4. **Nhà Khoa Học Nhí** (`little_scientist`, khoa học — gắn môn "Em & Cuộc sống" nếu T14 xong, nếu chưa thì danh mục 'fun'): phân loại vào 2 giỏ theo luật thay đổi mỗi vòng — Chìm/Nổi (có hoạt ảnh thả vào chậu nước), Sống/Không sống, Ngày/Đêm, Nóng/Lạnh, Nam châm hút/không hút. Mỗi đáp án có 1 câu giải thích ngắn bằng giọng đọc.

Thêm danh mục lọc **"Logic & Khoa học"** trong Hub.

## Nghiệm thu
- Test cho bộ giải lưới (mọi màn chơi đều có lời giải; solver BFS kiểm chứng), test dữ liệu phân loại đúng khoa học.
- Tổng số game trong Hub = 28. `qa/games.mjs` chơi cấp 1 mọi game mới.
- typecheck + test + build PASS.
