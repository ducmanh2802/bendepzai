# ENGLISH KIDBOX COMPANION — PARENT MODE
### §21 CURRENT UNIT · §23 sao theo bằng chứng · §24 báo cáo tuần · §27 nạp nội dung

Vị trí: **Parent Dashboard → tab “Kid's Box”** (sau khi vượt cổng phép tính).

---

## 1. Bé đang học (§21)

| Trường | Ghi chú |
| :--- | :--- |
| Current English Course | `Kid's Box New Generation 1` (read-only) |
| Current Unit | danh sách Unit đã ánh xạ; hiện chỉ có bridge pack vì chưa có nội dung giáo trình |
| Current Lesson | tuỳ chọn, lấy từ `unit.lessons` |
| Center homework | ghi chú tuỳ chọn của trung tâm, hiện ở màn "Ôn ở nhà" |

Đổi Unit ở đây ⇒ `getCurrentUnit()` ưu tiên Unit mới cho kế hoạch hôm nay, bậc thang
§9 và gợi ý của Learning OS. Mọi thay đổi được lưu ngay và sống sót qua reload.

## 2. Kỹ năng theo bằng chứng (§23)

Sao hiển thị theo 6 nhóm, mỗi dòng là một skill:

| Sao | Cần tối thiểu | Độ chính xác tối thiểu |
| :---: | :---: | :---: |
| ★ | 1 lượt | 0 |
| ★★ | 3 lượt | 60 |
| ★★★ | 6 lượt | 70 |
| ★★★★ | 10 lượt | 78 |
| ★★★★★ | 16 lượt | 85 |

- Dưới 60% độ chính xác ⇒ 0 sao, nhãn *"Cần luyện thêm"*.
- **Chưa có lượt nào** ⇒ 0 sao và nhãn *"Chưa có dữ liệu"* (không phải "yếu").
- Dưới chân bảng luôn có câu: *"Sao chỉ hiện khi có bằng chứng luyện tập thật."*

## 3. Báo cáo tuần (§24)

Tám số liệu từ `counters.days` trong 7 ngày: từ đã luyện · buổi nghe · lượt nói ·
lượt đọc · lượt ôn · lượt phonics · lượt mẫu câu · số ngày có học. Kèm:

- **Mạnh nhất** / **Nên luyện thêm** (chỉ skill có evidence).
- Ghi chú thúc ép: thiếu nghe thì gợi ý bổ sung 3 phút/ngày; thiếu nói thì nhắc ba mẹ
  cho bé nói lại.
- Câu cố định: *"Báo cáo này chỉ so với chính bé trong những tuần trước, không so
  với bạn khác."* — không leaderboard, không xếp hạng.

## 4. Trung thực về phát âm (§14)

Panel luôn ghi: *"Nhận giọng nói chỉ ghi nhận theo phương pháp **speech recognition
match**. Ứng dụng không chấm điểm phát âm."*

- `KidBoxSpeakingAttempt.pronunciationScored` là `false` **cả khi đọc từ bộ nhớ**, để
  dữ liệu cũ cũng không thể mang giá trị sai.
- Không có màn nào hiển thị "Pronunciation = x%"; test chặn các câu phát âm bị cấm.

## 5. Nội dung nguồn còn thiếu (§27)

Panel liệt kê 7 nhóm tài liệu còn cần, kèm ô dán JSON để **kiểm tra** gói nội dung
ngay trong app. Kết quả hiển thị: số Unit nhận được, số lỗi, số cảnh báo.

> Ô này **không** tự đăng nội dung giáo trình. Việc ánh xạ do người có giấy phép thực
> hiện; app chỉ báo cáo lỗi/cảnh báo và phần còn thiếu.

## 6. Quyền riêng tư

- Cổng phụ huynh giữ nguyên cơ chế phép tính 2 chữ số của app.
- Kid's Box không gửi dữ liệu ra ngoài: mọi thứ nằm trong `localStorage` trên thiết bị.
- Nút "Đặt lại tiến độ" của app xoá luôn `kho_bau_kidbox_store`
  (test `kidbox-learning-os.test.ts` kiểm tra điều này).
- Dữ liệu demo của app được gắn cờ `isDemoData`; panel Kid's Box không tự sinh số liệu
  mẫu — số 0 là số 0 thật.
