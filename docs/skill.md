# VN-STOCK-AI-PRO — SKILL AUDIT & WORKFLOW OPTIMIZATION

Bạn là Senior Engineer phụ trách tối ưu workflow Claude Code điều phối và OpenCode thực thi.

## Mục tiêu
Tăng tốc phát triển VN-STOCK-AI-PRO, giảm token/context không cần thiết, giảm lỗi do agent sửa sai phạm vi và tăng tỷ lệ task hoàn thành có test evidence.

## Giai đoạn 1 — READ-ONLY AUDIT
1. Đọc `AGENTS.md`, `opencode.json`, các chỉ dẫn dự án và `.clinerules`.
2. Kiểm tra các skill thực tế trong `.agents/skills`, `.claude/skills` và các thư mục skill đang được cấu hình.
3. Với mỗi skill ứng viên, đọc metadata và nội dung để xác minh mục đích, cách gọi và mức độ phù hợp.
4. Xác định skill trùng lặp, skill quá rộng, skill không tương thích hoặc skill không được runtime hiện tại nhận diện.
5. Phân biệt rõ skill đã tồn tại với skill chỉ được đề xuất.

## Giai đoạn 2 — BUILD MINIMAL WORKFLOW
Đề xuất một workflow tối thiểu cho các nhóm:
- Bug diagnosis và regression testing.
- Market data/provider integrity.
- Trading/risk/financial correctness.
- Database và API validation.
- React/UI.
- Feature implementation theo spec.
- Claude Code → OpenCode delegation.
- Final code review và Git handoff.

Mỗi workflow chỉ chọn những skill thật sự cần thiết. Không tải mọi skill vào context cho mọi task.

## Giai đoạn 3 — SECURITY AND PERMISSIONS
- Tôn trọng toàn bộ protected paths và allowlist hiện có.
- Không sửa `AGENTS.md`, `opencode.json`, `.clinerules`, `.env`, database, trading/risk/provider code hoặc Git metadata.
- Không dùng `--auto`, không tự cài skill/plugin, không mở rộng quyền agent.
- Không chạy lệnh phá hủy hoặc thay đổi working tree.
- Chỉ dùng thao tác đọc để audit.
- Nếu thiếu quyền, báo chính xác và chờ orchestrator.

## Giai đoạn 4 — REPORT
Trả về:
1. Skill đã xác minh có sẵn.
2. Skill nên dùng thường xuyên.
3. Skill chỉ kích hoạt theo task.
4. Skill trùng lặp hoặc không cần thiết.
5. Bảng workflow theo loại task.
6. Các cải tiến có thể thực hiện mà không cài thêm gì.
7. Những thay đổi cần phê duyệt riêng.

Không tự cài đặt hoặc chỉnh sửa file. Chỉ báo cáo đề xuất và bằng chứng từ cấu hình thực tế.