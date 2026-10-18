# T20A — QA toàn diện + báo cáo lỗi

**Spec gốc:** `docs/opencode/T20_qa_nghiem_thu.md` — **mục 1–5 và 7**

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Điều chỉnh so với spec gốc
- Lighthouse không cài sẵn: nếu không có thì bỏ qua (không cài toàn cục); kiểm PWA bằng test manifest/service worker.
- Kiểm thử trình duyệt best-effort theo 00_RULES.
- **Không sửa lỗi lớn** trong task này: ghi mọi lỗi tìm được vào `docs/opencode/reports/T20A_BUGS.md` theo mức P0–P3 (mô tả, cách tái hiện, file liên quan). Chỉ sửa lỗi nhỏ một dòng nếu chắc chắn.
- Xuất `docs/opencode/reports/T20_sample_questions.md` (50 câu ngẫu nhiên mỗi môn) để phụ huynh đọc soát.

## Giới hạn thời gian (bắt buộc)
- Kiểm thử trình duyệt tối đa ~30 phút: script QA nào chạy 2 lần vẫn lỗi thì ghi **SKIPPED + lý do** trong báo cáo rồi bỏ qua, không viết thêm script dò (`_probe_*`).
- Ưu tiên giao đủ 3 sản phẩm: `docs/opencode/reports/T20A_BUGS.md` (P0–P3), `docs/opencode/reports/T20_sample_questions.md`, `docs/opencode/reports/T20A_REPORT.md`. Lỗi tìm được thì **ghi lại**, để T20B sửa.
- Xoá các file tạm trước khi xong (`tests/_dbg.mjs`, `tests/_scratch.test.ts`, `qa/_probe_*.mjs`).

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T20A_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
