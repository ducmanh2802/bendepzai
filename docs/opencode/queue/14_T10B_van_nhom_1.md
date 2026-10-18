# T10B — Tiếng Việt: vần nhóm 1 (am … ich)

**Spec gốc:** `docs/opencode/T10_tieng_viet_am_van.md` — **mục 4, nửa đầu**

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Phạm vi
Các vần: am ap, ăm ăp, âm âp, om op, ôm ôp, ơm ơp, em ep, êm êp, im ip, um up, an at, ăn ăt, ân ât, on ot, ôn ôt, ơn ơt, en et, ên êt, in it, un ut, ưt, ang ac, ăng ăc, âng âc, ong oc, ông ôc, ung uc, ưng ưc, anh ach, ênh êch, inh ich.
- Mỗi bài 2–3 vần, ≥ 10 câu, ≥ 3 loại câu; độ khó 1/2/3 ≈ 40/40/20%.
- Theo `docs/CONTENT_GUIDE.md`; giữ id bài/câu cũ; tiền tố `vn-`; kiểu đặt dấu như T10A.
- Distractor là lỗi trẻ hay gặp (an/ang, at/ac, n/ng, nhầm dấu).

## Nghiệm thu riêng
- Test: đủ danh sách vần ở trên; mỗi bài ≥ 10 câu; đáp án ∈ options; NFC; không trùng id; không từ cấm.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T10B_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
