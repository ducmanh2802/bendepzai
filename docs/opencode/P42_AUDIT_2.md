# P42 AUDIT 2 — sau khi xong T01 + T02 (14/10/2026)

## 1. Tình trạng

| Hạng mục | Kết quả |
|---|---|
| `main` | `f7fcaf0` (đã merge p42/T01, p42/T02) |
| typecheck / test / build | PASS — **435/435 test** (trước P42: 401) — build còn cảnh báo chunk > 500 kB |
| T01 (giao diện, ngày VN, font) | Phần lớn đạt; còn lỗi ở mục 3 |
| T02 (nội dung game, thưởng) | Các lỗi trong audit 1 đã sửa, **nhưng 13/18 game vẫn còn lỗi** (mục 2) |
| Auto-runner v1 | Đã khởi động lúc 19:16 nhưng dừng ở 19:18 (cửa sổ bị đóng) → thay bằng **runner v2 dạng hàng đợi** |

## 2. Game — lỗi còn lại (kiểm bằng cách chạy mọi tier, nhiều lượt chơi)

- **Ghép tiếng sai** (SyllableBuilder): 14/72 từ tách âm đầu/vần sai (đa, che, hề, mê, thề, thuê, bố, dỗ, đô, đồ, đổ, đỗ, tô, lúa) → game chấm đúng cho cách ghép sai.
- **Có nhớ/mượn** (vượt lớp 1) ở OceanFishing, WordStory, ClockMoney, MathSpeedRacing, NumberTower.
- **Lộ đáp án**: SentenceScramble hiện từ theo thứ tự ngược (bấm từ phải sang trái là đúng) và không bao giờ trừ điểm; AnimalSafari/ListenPick luôn đặt đáp án ở vị trí đầu; ClockMoney luôn hiện gợi ý chứa đáp án.
- **Sai kiến thức**: RhymeHunter coi "khăn", "đất" là vần an/at; PhonicsPop có phương án cùng âm với đáp án (PHONE/F…); SpellingDuel có câu 2 đáp án đúng và nghĩa gợi ý sai; GRAY (Mỹ) thay vì GREY (Anh); còn "số chẵn"; emoji sai hình ở ShapeSorting.
- **Logic thưởng**: MemoryCards đếm lỗi theo cặp thay vì theo thẻ; ColoringCanvas tính cả hình mẫu là "đã tô" → luôn 3★; reset của phụ huynh không xoá tiến độ game; danh sách từ cấm không bắt được cụm 2 từ.
- **Test** chỉ phủ 10/18 game; nhiều kiểm tra yếu (dùng chính hàm lỗi để kiểm).

## 3. Giao diện — lỗi còn lại

1. **Điện thoại 360–375px: không thấy nút đóng game** (header cần 428px) → bé không thoát game được.
2. Bài học 375×667: nút "Kiểm tra"/"Câu tiếp theo" bị khuất, phải cuộn.
3. Desktop 1024–1440: thanh menu tràn, mất nút "Ba Mẹ", tắt tiếng, Shop.
4. Đổi màn không cuộn về đầu trang.
5. Font Nunito không được áp dụng (bị `font-sans` ghi đè).
6. Chữ trắng trên banner Home tương phản 2,1–2,7:1 (cần ≥ 4,5:1).
7. Banner "Có bản mới…" hiện sai ở lần mở đầu tiên, che thanh điều hướng.
8. Hai icon loa giống nhau trong game; nhiều nút < 44px; Home vẫn dài ~6 màn hình.

## 4. Kế hoạch còn lại — vấn đề của spec T03–T20

- 17/18 spec cần sửa hoặc tách nhỏ (T10 cần 3 phiên, T11/T12/T14/T17/T20 cần 2 phiên, T18 cần 3 phiên).
- Một số luật/test hiện có sẽ làm runner dừng giữa chừng: test đếm cứng số chủ đề, validator so trùng bỏ dấu (má = mà), từ cấm khớp nhầm (đánh răng, đánh vần), mặc định tự đọc câu hỏi mâu thuẫn với luật.
- Dung lượng: chunk chính 725 kB (react-dom 202 kB, nội dung ~280 kB); thêm ~1.300 câu sẽ lên ~1,4 MB; service worker chưa cache các chunk lazy → hỏng offline.

## 5. Quyết định

Hàng đợi mới `docs/opencode/queue/` gồm **32 task** theo thứ tự:
1. Sửa lỗi gấp: **T02B** (game), **T01B** (giao diện), **T02C** (hạ tầng nội dung lớn, offline, validator).
2. Kế hoạch P42 còn lại, đã sửa theo code hiện tại và tách nhỏ: T03A → T20B.

Spec gốc `docs/opencode/T03…T20_*.md` giữ làm tài liệu tham chiếu; file trong `queue/` là bản chính thức.
