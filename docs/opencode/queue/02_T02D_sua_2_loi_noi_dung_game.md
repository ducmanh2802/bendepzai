# T02D — Sửa 2 lỗi nội dung nhỏ còn sót sau T02B

**Spec gốc:** `docs/opencode/queue/01_T02B_sua_loi_game_con_sot.md` (đã xong) · Phát hiện khi kiểm tra kết quả T02B.

> Luật chung: `docs/opencode/00_RULES.md`.

## Phạm vi
1. `src/data/games/spelling_duel.ts` (tier 6): câu "Cháu chào ...ạ cụ!" (đáp án d → "Cháu chào dạ cụ!") không phải câu tiếng Việt tự nhiên. Thay bằng câu d/gi/r tự nhiên, chỉ một đáp án đúng, ví dụ "Con ...ế mèn" (d → dế mèn 🦗) hoặc "Cô giáo ...ạy em học" (d → dạy). Gợi ý không chứa đáp án.
2. `src/data/games/shape_sorting.ts`: "Nón lá" dùng emoji 👒 (mũ rộng vành tròn) nhưng xếp vào hình tam giác → bé dễ nhầm. Đổi sang vật có hình tam giác rõ ràng, ví dụ ⚠️ "Biển báo nguy hiểm" hoặc 🍕 "Miếng bánh pizza".
3. Rà nhanh toàn bộ chuỗi hiển thị cho bé trong `src/data/games/*.ts`: phải là tiếng Việt tự nhiên, đúng nghĩa, emoji khớp nghĩa. Chỉ sửa chỗ sai rõ ràng; liệt kê từng thay đổi trong báo cáo.
4. Thêm test cho 2 mục 1–2 (câu mới có đúng 1 đáp án; vật trong rổ tam giác không dùng 👒).

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T02D_REPORT.md`: đã làm gì, file thay đổi, lệnh đã chạy + kết quả.
