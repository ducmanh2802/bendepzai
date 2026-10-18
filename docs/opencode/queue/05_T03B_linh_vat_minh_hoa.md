# T03B — Linh vật Gấu Bút Chì (SVG) + avatar mặc đồ + minh hoạ

**Spec gốc:** `docs/opencode/T03_design_system_linh_vat.md` — **chỉ phần B**

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Phạm vi
- Làm phần B của spec gốc: component `Mascot` (SVG inline tự vẽ, có các pose, accessory, bong bóng thoại, chạm để nói), animation tôn trọng reduced-motion, trang dev `?dev=mascot`.
- **Quyết định đã chốt**: linh vật hướng dẫn ở mọi nơi là **Gấu Bút Chì**. Avatar của bé trong Shop giữ 4 lựa chọn hiện có (gấu/cáo/thỏ/cú): vẽ SVG cho cả 4 con với **cùng bộ điểm neo phụ kiện** (đầu, mắt, thân, tay) để đồ mua trong Shop **mặc lên** được.
- Thay emoji 🐻 ở Header, hero Home, phản hồi đúng/sai trong bài học, màn kết quả, trạng thái trống, Shop.
- Minh hoạ SVG cho 4 môn + 6 vùng bản đồ trong `src/components/illustrations/`.
- Test: render (renderToString) mọi pose × mọi con vật × có/không accessory.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T03B_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
