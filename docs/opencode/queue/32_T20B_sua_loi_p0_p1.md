# T20B — Sửa lỗi P0/P1 + chứng nhận P42

**Spec gốc:** `docs/opencode/T20_qa_nghiem_thu.md` — **mục 6–7**

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Phạm vi
- Sửa các lỗi **P0 và P1** trong `docs/opencode/reports/T20A_BUGS.md` (tối đa 15 lỗi, mỗi lỗi một commit).
- Viết `docs/P42_CERTIFICATION.md`: bảng chỉ số trước/sau (theo mục "Kết quả mong đợi" trong `docs/opencode/README.md`), lỗi đã sửa, rủi ro còn lại; cập nhật `.ai/CURRENT.md`.

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T20B_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
