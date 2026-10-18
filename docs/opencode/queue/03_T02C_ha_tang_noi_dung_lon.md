# T02C — Hạ tầng cho nội dung lớn: dung lượng tải, offline, validator

**Spec gốc:** — (task mới từ audit 2) · Audit: `docs/opencode/P42_AUDIT_2.md` mục 4

> File này là bản chính thức. Chỗ nào khác spec gốc thì làm theo file này. Luật chung: `docs/opencode/00_RULES.md`.

## Vì sao
Chunk chính `index-*.js` 725 kB (react-dom ~202 kB, nội dung ~280 kB: competition bank 123, curriculum 84, Kid's Box 50, reading 30). Các task T10–T14 sẽ thêm ~1.300 câu (~700 kB). Validator so trùng mọi cặp câu, bỏ dấu (má = mà) và chạy ~21 s ở 1.500 câu. Service worker chỉ cache shell + font → chunk lazy chưa từng mở khi online sẽ hỏng khi offline.

## Phạm vi
1. **Tách import nặng khỏi đường khởi động**: `storage.ts` đang import tĩnh `CompetitionEngine` (chỉ dùng seed demo) và `ReadingEngine`; Home → `NextBestActionCard` → `decisionEngine` kéo theo competition/Kid's Box/curriculum. Tách seed demo và readiness sang module riêng; nạp động (dynamic import) dữ liệu competition/reading/Kid's Box ở màn cần dùng. Nếu buộc phải đổi API sang async thì cập nhật mọi nơi gọi + test, không để vỡ chức năng.
2. Chia chunk: nhóm `react-vendor`; mục tiêu chunk chính ≤ 450 kB (không đạt thì ghi rõ lý do và con số). Thêm script/test kiểm ngân sách kích thước sau build (báo lỗi nếu chunk chính > 600 kB).
3. **Service worker**: danh sách precache sinh tự động từ output build (mọi JS/CSS/font/icon), cache `kho-bau-v3`, xoá cache cũ khi kích hoạt. Kiểm offline best-effort (`qa/offline-pwa.mjs`).
4. **Validator** (`src/services/contentValidator.ts`): tokenize mỗi câu 1 lần; chỉ so trong cùng môn + kỹ năng; **giữ dấu tiếng Việt** khi so (má ≠ mà, ăn ≠ ân); giữ nguyên ngưỡng ERROR/WARNING; 2.000 câu chạy < 5 s (đo và ghi báo cáo).
5. Đổi test đếm cứng số chủ đề (`toBe(12)` trong `tests/vietnamese-curriculum.test.ts`, `toBe(11)` trong `tests/english-curriculum.test.ts`) thành `toBeGreaterThanOrEqual` — được phép theo 00_RULES.
6. Viết `docs/CONTENT_GUIDE.md` — quy ước cho mọi task thêm nội dung (T10–T14): mỗi unit một file `src/data/<môn>/<unit>.ts`, gộp qua file index; id ổn định với tiền tố `vn-`/`math-`/`eng-`/`life-`; câu số học có trường `calc: { a, op, b }` để test tính lại; không trùng đề; dùng `contentSafety.ts` (từ cấm + cụm cho phép); cách chạy validator và test.

## Nghiệm thu riêng
- Bảng kích thước chunk trước/sau; thời gian validator trước/sau; kết quả kiểm offline (hoặc SKIPPED).

## Nghiệm thu chung
- `npm run typecheck`, `npm test`, `npm run build` đều PASS (runner sẽ tự kiểm lại).
- Báo cáo `docs/opencode/reports/T02C_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, các quyết định bạn tự đưa ra, việc còn tồn.
