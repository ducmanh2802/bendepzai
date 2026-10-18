# Hàng đợi task cho OpenCode (Kho Báu Auto Runner)

- Runner (`docs/opencode/run-all.ps1`) chạy **lần lượt** mọi file `NN_ID_mo-ta.md` trong thư mục này theo thứ tự tên file, mỗi task một phiên OpenCode mới, trên nhánh `p42/ID`, rồi kiểm tra typecheck/test/build, tự sửa tối đa 2 lần và merge vào `main` trên máy.
- Xong hết thì runner **tiếp tục chờ**: thêm file mới vào đây là runner tự nhận việc (không cần bấm gì).
- Task lỗi → hàng đợi dừng ở task đó. Sửa file task (hoặc tạo `docs/opencode/state/ID.retry`) để chạy lại.
- Trạng thái: `docs/opencode/TRANG_THAI.md`. Báo cáo: `docs/opencode/reports/ID_REPORT.md`.
- File này (00_README.md) không phải task.
