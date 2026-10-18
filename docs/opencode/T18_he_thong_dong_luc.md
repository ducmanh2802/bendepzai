# T18 — Hệ thống động lực: Sticker, Level bé, Nhiệm vụ xoay vòng, Lịch chuỗi ngày, Shop

**Phụ thuộc:** T17. **Nhánh:** `p42/T18`
Mọi thay đổi lưu trữ: migration + sanitizer + test trong `storage.ts`. Không làm mất sao/vé/đồ đã có.

## 1. Album Sticker (sưu tập)
- ≥ 60 sticker SVG/emoji-ghép chia 6 bộ (Con vật Việt Nam, Đồ ăn Tết, Phương tiện, Vũ trụ, Khủng long, Nghề nghiệp). Độ hiếm: thường/hiếm/siêu hiếm.
- Nhận từ: rương cuối chặng (T07), rương nhiệm vụ ngày, lên level, hoàn thành bộ 3★ một cấp game, **dùng vé** quay "Máy gắp sticker" (1 vé/lượt, không trùng tới khi đủ bộ — không có yếu tố may rủi mua bằng tiền thật).
- Màn Album: trang lật, ô trống in bóng; đủ bộ → huy hiệu + Gấu ăn mừng.

## 2. Level của bé
- XP → Level 1–50, đường cong nhẹ (level đầu nhanh). Thanh XP trong Header. Lên level: màn chúc mừng + phần thưởng (sao/sticker/món đồ Shop mở bán).
- Danh hiệu theo mốc: Thám Hiểm Nhí → Thợ Săn Chữ → Nhà Toán Học Nhí → … → Trạng Nguyên Nhí.

## 3. Nhiệm vụ ngày xoay vòng
- Pool ≥ 30 nhiệm vụ (học 1 bài Toán, đọc 1 truyện, chơi game Tiếng Anh, đạt combo x5, ôn 5 câu, làm 1 bài Em & Cuộc sống…). Mỗi ngày chọn 3 dựa trên `decisionEngine` (ưu tiên kỹ năng yếu) + 1 nhiệm vụ vui. Tất định theo ngày (dùng `localDateKey`).
- Rương ngày thưởng ngẫu nhiên có kiểm soát: sao + 30% sticker.

## 4. Chuỗi ngày (streak)
- Lịch tháng hiển thị ngày đã học (dấu chân Gấu). Mốc 3/7/14/30 ngày có quà.
- "Khiên giữ chuỗi": 1 khiên/tuần tự động, bảo vệ 1 ngày nghỉ (trẻ con không bị phạt vì bố mẹ bận).

## 5. Shop & tiền tệ
- Shop ≥ 40 món: mũ, kính, áo, balo, thú cưng nhỏ đi theo Gấu, nền trang chủ, khung avatar. Hiển thị **mặc lên** `Mascot` (T03). Món mở theo level.
- Vé dùng cho máy gắp sticker; sao dùng cho Shop. Bỏ gems nếu không dùng (hoặc ẩn), giữ dữ liệu.

## 6. Thành tựu
- Nâng lên ≥ 30 thành tựu (học, đọc, game, chuỗi ngày, sưu tập, môn mới), mỗi cái có rule mở khoá kiểm thử được.

## 7. Phụ huynh
- Cài đặt: giới hạn số lượt máy gắp/ngày, tắt/bật phần thưởng, xem lịch sử phần thưởng.

## Nghiệm thu
- Test: XP→level, chọn nhiệm vụ tất định, khiên streak, máy gắp không trùng, migration, mọi rule thành tựu.
- typecheck + test + build PASS; ảnh Album, Level-up, Lịch chuỗi, Shop.
