# BỘ TÀI LIỆU ĐẶC TẢ — KHO BÁU TRI THỨC LỚP 1

Bốn tài liệu ở `docs/specs/` + hai tài liệu kế hoạch ở `docs/plan/` mô tả **toàn bộ vòng đời**
của sản phẩm, từ nghiệp vụ tới từng test. Đọc theo thứ tự dưới đây nếu bạn mới vào repo.

| # | Tài liệu | Trả lời câu hỏi | Dài bao nhiêu |
|---|---|---|---|
| 1 | [`BRD.md`](BRD.md) | *Tại sao làm, làm gì, không làm gì, thành công đo thế nào?* | 6 mục tiêu BG, 8 rủi ro, Business DoD |
| 2 | [`SRS.md`](SRS.md) | *Phần mềm phải làm gì, đạt ngưỡng nào?* | 88 FR · 25 NFR · 17 DC · 11 IF |
| 3 | [`ARCHITECTURE.md`](ARCHITECTURE.md) | *Ghép như thế nào, dữ liệu đi đâu, vì sao chọn vậy?* | 17 ADR, sơ đồ tầng + luồng dữ liệu |
| 4 | [`RTM.md`](RTM.md) | *Yêu cầu nào được chứng minh ở đâu? Test nào không phục vụ gì?* | ma trận xuôi + ngược, tổng kết độ phủ |
| 5 | [`../plan/TASK_PLAN.md`](../plan/TASK_PLAN.md) | *Đã làm gì (P25→P43) và sẽ làm gì tiếp (EP-A…EP-F)?* | WBS 12 gói, 4 milestone |
| 6 | [`../plan/TEST_PLAN.md`](../plan/TEST_PLAN.md) | *Kiểm bằng lớp nào, chạy lệnh nào, khi nào xanh?* | 5 lớp, 20 probe, bảng "đổi gì → chạy gì" |

## Quy ước chung của bộ tài liệu

1. **Chỉ số liệu đo được.** Mọi con số (31 trò chơi, 475 câu thi, 994 test / 69 file,
   508.2 kB entry, 8 dependency runtime, 17 key…) đo ngày **2026-10-30** — ngay sau merge
   `origin/main` mang Firebase cloud-sync + bàn cờ vua WebGL vào — bằng `npx vitest run`,
   `npm run check:budget` hoặc `ls`. Các số mô tả nội dung học (31/475/1570 câu) giữ nguyên
   từ đợt đo 2026-10-29 vì merge không đụng `src/data/`. Dấu ✚ trong `BRD.md` nghĩa là
   "đo trực tiếp từ repo".
2. **Code là nguồn chân lý.** Khi tài liệu cũ (`PRODUCT_SPEC.md`, `MASTER_ROADMAP.md`)
   lệch với `src/`, thì `src/` đúng và tài liệu này phải sửa theo.
3. **Không có yêu cầu treo.** Một FR không còn chứng cứ phải bị xoá hoặc gắn
   "KHÔNG CÒN ĐẠT" kèm lý do — xem `SRS.md` §11 và `RTM.md` §9.
4. **Không cam kết ngày.** Kế hoạch dùng độ lớn (S/M/L/XL) + tiền lệ có thật trong
   `docs/opencode/reports/`, không dùng "2 ngày".
5. **Bằng chứng là output lệnh.** Số liệu lấy qua MCP (`mcp/`) là manh mối; muốn tuyên bố
   "xanh" phải dán output `npm run verify` hoặc `QA PASS` (`AGENTS.md` §1, `docs/SDLC.md` §10).
6. **Prompt không phải tài liệu.** Brief AI của một phase chỉ là đầu vào: chạy xong thì chứng
   cứ là báo cáo/test, không phải prompt. Ngày 2026-10-30 đã gỡ 68 prompt đã dùng
   (`docs/MASTER_ROADMAP.md` §"Cấu trúc `docs/` sau khi gỡ prompt", khôi phục bằng
   `git show "99edd29:<đường-dẫn>"`). Còn giữ: 3 master prompt module (`cotuong.md`, `covua.md`,
   `olypictienganh.md`) vì chưa có mô tả thiết kế nào khác, và `docs/opencode/queue/05_T03B…md`
   vì task chưa làm.

## Khi nào phải cập nhật

| Bạn vừa… | Phải sửa |
|---|---|
| thêm trò chơi / tính năng | `SRS.md` (FR mới) → `RTM.md` (dòng mới) → `CHANGELOG.md` |
| đổi ngưỡng nghiệp vụ | `SRS.md` §5 hoặc §6 + test trong `tests/` |
| đổi kiến trúc (chunk, schema, tầng) | `ARCHITECTURE.md` + thêm hoặc sửa ADR |
| xong một phase | `../plan/TASK_PLAN.md` §II (lịch sử, chỉ thêm không sửa) |
| phát hiện lỗi mới | `../plan/TEST_PLAN.md` §12 (danh sách hồi quy) |
| đổi tên / di chuyển một file trong bộ này | 4 điểm trỏ tới ở mục "Bộ này được trỏ tới từ" |

## Bộ này được trỏ tới từ

Bốn điểm vào (sửa cùng một commit khi đổi tên file hoặc số liệu đầu mối):

- [`../../README.md`](../../README.md) — mục "Bộ tài liệu chuẩn"
- [`../SDLC.md`](../SDLC.md) §9 — tra cứu nhanh "yêu cầu nào chưa có test / việc kế tiếp"
- [`../MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) — bảng "Tài liệu"
- [`../../CHANGELOG.md`](../../CHANGELOG.md) `[Unreleased]` — dòng Added của bộ đặc tả

## Tài liệu nền khác (không thuộc bộ đặc tả nhưng được tham chiếu nhiều)

[`../SDLC.md`](../SDLC.md) · [`../GAME_DESIGN.md`](../GAME_DESIGN.md) ·
[`../CURRICULUM_MAP.md`](../CURRICULUM_MAP.md) · [`../PARENT_MODE.md`](../PARENT_MODE.md) ·
[`../SAFETY_PRIVACY.md`](../SAFETY_PRIVACY.md) · [`../P30_RELIABILITY.md`](../P30_RELIABILITY.md) ·
[`../P31_PERFORMANCE_ACCESSIBILITY.md`](../P31_PERFORMANCE_ACCESSIBILITY.md) ·
[`../cotuong.md`](../cotuong.md) · [`../../mcp/README.md`](../../mcp/README.md) ·
[`../../AGENTS.md`](../../AGENTS.md)
