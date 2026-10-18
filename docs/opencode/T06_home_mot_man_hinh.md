# T06 — Trang chủ gọn trong 1 màn hình + điều hướng 5 mục

**Phụ thuộc:** T03 (dùng `Mascot`, `KidButton`, token). **Nhánh:** `p42/T06`

## Hiện trạng
Home dài ~3.900px trên mobile (~6 màn hình): 3 thẻ môn, 5 lối tắt, Next Best Action 3 gợi ý, ôn tập 5 mục, kế hoạch phiên, 5 nhiệm vụ — trùng lặp, nhiều chữ phân tích dành cho người lớn ("Chưa đủ dữ liệu để xác định điểm yếu").

## Bố cục mới (mobile 375×667 vừa ≤ 1,5 màn hình; desktop 1 màn hình)
1. **Hero:** Gấu Bút Chì (pose `wave`) + bong bóng "Chào [tên bé]! Hôm nay mình tìm kho báu nào?" (bấm loa để nghe) + 3 pill: ⭐ sao, 🔥 chuỗi ngày, 🎟️ vé.
2. **Nút khổng lồ "▶ Học tiếp"**: chạy hành động tốt nhất từ `decisionEngine` (NBA). Dưới nút 1 dòng nhỏ tên bài. Nút "Vì sao?" chuyển sang Phụ huynh.
3. **4 ô môn học** (Tiếng Việt / Toán / Tiếng Anh / Em & Cuộc sống — ô thứ 4 hiện "Sắp mở 🔒" cho tới T14) với minh hoạ SVG + vòng tiến độ.
4. **Dải "Nhiệm vụ hôm nay"**: 3 icon nhiệm vụ tròn + rương kho báu (rung nhẹ khi mở được).
5. **Hàng ngang 3 lối tắt**: Trò chơi · Luyện đọc · Thử thách tuần.
6. Ôn tập hôm nay + kế hoạch phiên + phân tích ⇒ chuyển vào: (a) nút "Học tiếp" tự đi theo kế hoạch, (b) Bảng phụ huynh. Giữ nguyên dữ liệu/logic `decisionEngine` (chỉ đổi nơi hiển thị). Cập nhật test/QA đang tìm các `data-testid` cũ (`parent-next-best`… giữ nguyên ở Parent).

## Điều hướng
- Bottom nav (mobile/tablet) **đúng 5 mục**: Nhà · Bản đồ · Trò chơi · Đọc · Vườn Sao. Icon 28px, nhãn ≥ 13px, mục đang chọn phồng lên + màu môn.
- Ôn tập, Đấu trường, Thử thách tuần, Shop vào từ Home/Bản đồ.
- Top nav (≥1024px) cùng 5 mục + nút Phụ huynh.

## Nghiệm thu
- Ảnh chụp 375×667 và 1280×800 trước/sau trong báo cáo; đo chiều cao trang.
- Golden path cũ (`qa/golden-path.mjs`, `qa/decision-engine.mjs`) sửa selector và PASS.
- typecheck + test + build PASS.
