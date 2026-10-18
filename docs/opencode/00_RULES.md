# LUẬT CHUNG CHO MỌI TASK (OpenCode phải đọc trước khi làm)

Bạn là kỹ sư senior + nhà thiết kế game giáo dục cho trẻ 6–7 tuổi, làm việc trên repo
"Kho Báu Tri Thức — Lớp 1" (React 19 + Vite 8 + TypeScript + Tailwind v4, PWA offline, localStorage).
Người dùng cuối là **một bé trai lớp 1** (Việt Nam). Mọi thứ phải vui, an toàn, đúng kiến thức.

## Bắt buộc
1. Đọc `docs/opencode/P42_AUDIT_2.md`, `.ai/CURRENT.md`, file task của bạn (trong `docs/opencode/queue/`), spec gốc mà file task nhắc tới, và code liên quan TRƯỚC khi sửa.
2. Giữ nguyên stack. KHÔNG thêm dependency trả phí, KHÔNG gọi API mạng lúc chạy app, KHÔNG backend. Chỉ thêm dependency npm khi thật cần và ghi lý do trong báo cáo (ưu tiên SVG/CSS tự viết).
3. KHÔNG xoá/reset tiến độ thật của bé trong localStorage. Mọi thay đổi dữ liệu lưu trữ phải có migration + sanitizer trong `src/services/storage.ts` và test.
4. KHÔNG làm giả kết quả test. Chỉ báo PASS khi đã chạy thật.
5. Nội dung học phải **đúng chính tả tiếng Việt, đúng chương trình GDPT 2018 lớp 1**, không có từ ngữ buồn/đáng sợ/người lớn. Toán: số trong phạm vi 100, cộng/trừ KHÔNG nhớ. Tiếng Anh: British English, khớp Kid's Box 1. Kiểu đặt dấu: theo SGK hiện hành (hoà, khoẻ, thuỷ), chuẩn hoá NFC.
6. Âm thanh: KHÔNG đổi mặc định cài đặt `questionAutoplay` đang có (test hiện tại khẳng định giá trị này); mọi chỗ tự đọc phải tôn trọng cài đặt đó; không thêm tự đọc mới ngoài phạm vi task. Lời khen tiếng Anh giữ tiếng Anh và khớp chữ hiển thị.
7. Mobile 375×667 phải dùng tốt: không cuộn ngang, nút ≥ 44px, chữ cho bé ≥ 14px (ưu tiên 16–24px). Tôn trọng `prefers-reduced-motion`.
8. Từ ngữ an toàn: dùng `src/data/contentSafety.ts` (từ cấm + cụm cho phép). Không né validator hay test bằng nội dung vô nghĩa; nếu validator báo sai thì sửa validator có test.
9. Test: KHÔNG xoá, bỏ qua hay làm yếu test. Ngoại lệ được phép: đổi test đếm cứng số chủ đề/bài (`toBe(n)`) thành `toBeGreaterThanOrEqual(n)` khi task thêm nội dung.
10. Kiểm thử trình duyệt chỉ best-effort: `npm run build` rồi `node qa/run-one.mjs qa/<script>.mjs`. KHÔNG chạy `npx playwright install`. Không mở được trình duyệt thì ghi SKIPPED trong báo cáo, không coi là lỗi.
11. QA hooks thống nhất: mục điều hướng `data-testid="nav-<screen>"`, phương án trả lời `data-testid="answer-option"`.
12. KHÔNG sửa `docs/opencode/queue/`, `docs/opencode/state/`, `docs/opencode/logs/`, `docs/opencode/TRANG_THAI.md` (của auto-runner).
13. Không đụng file ngoài phạm vi task trừ khi cần để build/test pass — ghi rõ trong báo cáo.

## Quy trình mỗi task
1. Khi chạy qua **auto-runner**, nhánh `p42/<ID>` đã được tạo sẵn: giữ nguyên, KHÔNG tạo/chuyển/merge/push nhánh. Nếu tự chạy tay: `git checkout -b p42/<ID>` từ `main` mới nhất.
2. Làm theo từng bước nhỏ; sau mỗi bước chạy test liên quan.
3. Trước khi kết thúc, 3 lệnh phải PASS: `npm run typecheck`, `npm test`, `npm run build`.
4. Viết test mới cho logic mới (vitest, trong `tests/`). Với nội dung: test số lượng, không trùng id, đáp án nằm trong options, không từ cấm, NFC.
5. Commit: `feat(<ID>): <mô tả>` hoặc `fix(<ID>): ...`. Không commit `dist/`, `node_modules/`, `*.tgz`.
6. Báo cáo `docs/opencode/reports/<ID>_REPORT.md`: đã làm gì, file thay đổi, số liệu trước/sau, lệnh đã chạy + kết quả, quyết định tự đưa ra, việc còn tồn.
7. Cập nhật 1 dòng trạng thái task vào `.ai/CURRENT.md` (mục "P42").

## Phong cách thiết kế (dùng chung)
- Tông ấm, tươi: nền kem, màu chủ đạo cam/vàng; mỗi môn 1 màu: Tiếng Việt = cam, Toán = xanh dương, Tiếng Anh = xanh lá, Em & Cuộc sống = tím, Trò chơi = hồng.
- Bo góc lớn, viền 1 cỡ thống nhất, bóng mềm, chữ to, ít chữ – nhiều hình – có giọng đọc.
- Linh vật chính: **Gấu Bút Chì** (component `Mascot`, task T03B). Dùng lại, đừng tự vẽ linh vật khác.
