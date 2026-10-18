# P42 — Nâng cấp "Kho Báu Tri Thức": hấp dẫn · đẹp · nhiều kiến thức · nhiều trò chơi

Audit 1: [`P42_AUDIT.md`](P42_AUDIT.md) · Audit 2 (sau T01–T02): [`P42_AUDIT_2.md`](P42_AUDIT_2.md) · Luật chung: [`00_RULES.md`](00_RULES.md)

## ⚡ Tự động — không cần thao tác

**Kho Báu Auto Runner** (`run-all.ps1`) chạy hàng đợi `queue/` bằng OpenCode trên máy này:

- Lần lượt từng task: tạo nhánh `p42/<ID>` → `opencode run --auto` (cùng model bạn đang dùng) → `npm run typecheck` + `npm test` + `npm run build` → lỗi thì tự giao OpenCode sửa (tối đa 2 lần) → merge vào `main` **trên máy**. Không push lên GitHub.
- Hết hàng đợi thì **chờ việc mới**: thêm file `NN_ID_mo-ta.md` vào `queue/` là tự chạy.
- Không bao giờ chạy song song với bạn: nếu bạn đang mở OpenCode và repo vừa thay đổi trong 20 phút, runner chờ.
- Sau lần chạy đầu, runner **tự bật cùng Windows** (thu nhỏ dưới thanh tác vụ).
- **Theo dõi:** `TRANG_THAI.md` · log: `logs/` · báo cáo: `reports/`.
- **Dừng sau task đang làm:** `DUNG_LAI.bat` · **Tắt hẳn** (kể cả tự bật cùng Windows): `TAT_TU_DONG.bat` · **Bật lại:** `CHAY_TU_DONG.bat`.
- **Đổi model:** ghi `provider/model` vào `state/model.txt`. Có thể ghi **nhiều dòng** (dòng đầu = ưu tiên, các dòng sau = dự phòng): nếu quá 25 phút OpenCode không in gì và không file nào thay đổi (rate limit, lỗi 504/503 lặp lại), hết giờ, hoặc kết thúc mà không làm gì, runner cho model đó nghỉ 60 phút và tự chuyển sang model kế tiếp.
- Task bị lỗi → hàng đợi dừng ở đó; sửa file task hoặc tạo `state/<ID>.retry` để chạy lại.

### Hai luồng song song (runner v3)

- **Luồng chính** chạy trong thư mục này; **luồng B** chạy trong thư mục riêng `D:\trithuc\kho_bau_luong_b` (git worktree của cùng repo), mỗi luồng một model free khác nhau để không chung giới hạn.
- Phân việc nằm trong `state/lane.txt` của từng thư mục (`Only=` / `Skip=` / `After=<task>=<task cần xong trước>`). Luồng B: nội dung Tiếng Việt, Toán, Tiếng Anh, truyện và game mới; luồng chính: giao diện, môn mới, động lực, QA.
- Merge **không bao giờ checkout `main`**: nhánh task lấy `main` mới nhất vào trước (xung đột thì OpenCode tự xử lý), kiểm tra lại typecheck/test/build, rồi mới đẩy `main` lên. Đừng mở `main` trong thư mục nào khi runner đang chạy — merge sẽ chờ.
- `.ai/CURRENT.md` merge kiểu union (giữ dòng của cả hai luồng).
- **Theo dõi luồng B:** `TRANG_THAI_LUONG_B.md` · log: `kho_bau_luong_b\docs\opencode\logs\` · **Bật luồng B:** `CHAY_LUONG_B.bat` · `DUNG_LAI.bat` / `TAT_TU_DONG.bat` dừng cả hai luồng.

## Tiến độ

| Đợt | Task | Trạng thái |
|---|---|---|
| 0. Sửa lỗi (audit 1) | T01 giao diện/ngày VN/font · T02 nội dung game + thưởng | ✅ xong (merge vào main) |
| 0b. Sửa lỗi (audit 2) | T02B game còn sót · T01B giao diện gấp · T02C hạ tầng nội dung lớn | ⏳ hàng đợi |
| 1. Nền móng | T03A tokens · T03B linh vật · T04 ngân hàng câu hỏi game · T05 lesson player | ⏳ |
| 2. Giao diện | T06 Home · T07 con đường phiêu lưu · T08 Games Hub · T09A luyện đọc · T09B đấu trường | ⏳ |
| 3. Kiến thức | T10A/B/C Tiếng Việt · T11A/B Toán · T12A/B Tiếng Anh · T13 truyện · T14A/B môn Em & Cuộc sống | ⏳ |
| 4. Game mới | T15 Việt · T16 Toán · T17A Anh · T17B Logic & Khoa học | ⏳ |
| 5. Động lực | T18A dữ liệu · T18B giao diện · T18C Shop/thành tựu/phụ huynh · T19 âm thanh & ăn mừng | ⏳ |
| 6. Nghiệm thu | T20A QA + danh sách lỗi · T20B sửa P0/P1 + chứng nhận | ⏳ |

Thứ tự chính xác = thứ tự tên file trong `queue/`. Spec gốc `T03…T20_*.md` giữ làm tham chiếu.

## Chạy tay (nếu không dùng runner)

```powershell
opencode run "Đọc docs/opencode/00_RULES.md rồi thực hiện ĐẦY ĐỦ task trong docs/opencode/queue/01_T02B_sua_loi_game_con_sot.md. Làm thật, chạy test, commit, viết báo cáo."
```

## Kết quả mong đợi sau P42

| Chỉ số | Trước P42 | Sau P42 |
|---|---|---|
| Câu hỏi bài học | 155 | **≥ 1.300** (mỗi bài ≥ 10 câu) |
| Vần tiếng Việt được dạy | 6 | **≥ 70** |
| Toán | đến 20 | **đến 100** + đo lường + thời gian + hình khối |
| Truyện đọc | 12 | **≥ 36** |
| Môn học | 3 | **4** (thêm Em & Cuộc sống) |
| Trò chơi | 18 (nhiều lỗi) | **28**, nội dung đúng, có test cho mọi game |
| Linh vật / minh hoạ | emoji | Gấu Bút Chì SVG nhiều tư thế, avatar mặc đồ |
| Hệ thưởng | sao | sao + sticker + level + nhiệm vụ xoay vòng + lịch chuỗi ngày |
| Tải trang | chunk chính 725 kB | ≤ 450 kB, offline đầy đủ |
