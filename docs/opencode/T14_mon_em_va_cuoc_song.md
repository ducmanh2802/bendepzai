# T14 — Môn mới "Em & Cuộc sống" (Tự nhiên – Xã hội, An toàn, Kỹ năng sống)

**Phụ thuộc:** T10–T13 đã merge (tránh xung đột types). **Nhánh:** `p42/T14`

## Kỹ thuật
1. Mở rộng `SubjectType` (`src/types/index.ts:1`) thêm `'cuoc-song'`; cập nhật `DailyQuest.type`, `ALL_TOPICS` (`src/data/curriculum.ts`), tiền tố skill `life_`.
2. Rà **mọi** file switch/Record theo môn (~18 file: SubjectScreen, WorldMap, HomeScreen, ParentDashboard, App, decisionEngine, learningOS, sessionComposer, storage sanitizer, praiseEngine, adaptive…) — dùng `grep -rn "'english'" src` để tìm. TypeScript `Record<SubjectType, …>` sẽ báo chỗ thiếu.
3. Migration storage: dữ liệu cũ không có môn mới vẫn hợp lệ; thêm test.
4. Mở ô "Em & Cuộc sống" trên Home (T06) + đảo "Làng Cuộc Sống" trên bản đồ (T07), màu tím.

## Nội dung (≥ 12 chủ đề, ≥ 24 bài, mỗi bài ≥ 10 câu → ≥ 240 câu)
- **Tự nhiên & Xã hội lớp 1:** Gia đình em · Ngôi nhà & đồ dùng an toàn · Trường học · Cộng đồng địa phương (chợ, bệnh viện, nghề nghiệp) · Thực vật (bộ phận cây, cây rau/cây hoa/cây ăn quả) · Động vật (nơi sống, con vật nuôi/hoang dã, có ích) · Cơ thể người & 5 giác quan · Vệ sinh cá nhân, ăn uống lành mạnh · Bầu trời, thời tiết, ngày – đêm, mùa.
- **An toàn:** giao thông (đèn tín hiệu, đi bộ bên phải, đội mũ bảo hiểm, qua đường cùng người lớn) · đuối nước · điện, lửa, vật sắc nhọn · người lạ & số điện thoại 111/113/114/115 (nhận biết, không bắt bé gọi thật).
- **Đạo đức & kỹ năng sống:** lễ phép, chào hỏi · thật thà · biết nhận lỗi, xin lỗi, cảm ơn · gọn gàng, tự phục vụ · chia sẻ, giúp đỡ bạn · quản lý cảm xúc (vui, buồn, giận – hít thở 3 lần).
- **Khoa học vui:** chìm/nổi, vật sống/không sống, nam châm hút gì, nóng/lạnh, bóng đổ.

Dạng câu: tình huống tranh "Bạn nhỏ làm đúng hay sai?" (true-false), xếp thứ tự (rửa tay 6 bước), phân loại (drag-drop), nối (con vật – nơi sống). Lời giải thích luôn nhẹ nhàng, khuyến khích.

## Nghiệm thu
- Test curriculum môn mới (số lượng, schema, không từ cấm), test migration, decision engine vẫn hoạt động với 4 môn.
- Golden path: Home → Em & Cuộc sống → làm 1 bài → nhận sao.
- typecheck + test + build PASS. Cập nhật `docs/CURRICULUM_MAP.md`, `docs/PRODUCT_SPEC.md`.
