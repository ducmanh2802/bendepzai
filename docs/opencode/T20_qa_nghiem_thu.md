# T20 — QA toàn diện & chứng nhận P42

**Phụ thuộc:** T01–T19 đã merge vào `main`. **Nhánh:** `p42/T20`

## Việc cần làm
1. **Tự động:** `npm run typecheck`, `npm test`, `npm run build` — PASS. Ghi số test trước P42 (401) và sau.
2. **Trình duyệt thật (Playwright/Chromium)** ở 375×667, 768×1024, 1280×800, zoom 200%:
   - Golden paths: bé mới mở app → Học tiếp → xong 1 bài mỗi môn (4 môn) → nhận sao → mở rương → chơi 1 game mỗi danh mục → đọc 1 truyện → Shop mua đồ → Gấu mặc đồ → Album sticker → Phụ huynh xem báo cáo.
   - Chơi cấp 1 của **cả 28 game**.
   - Offline: tải 1 lần, ngắt mạng, reload → app + font + âm thanh vẫn chạy (`qa/offline-pwa.mjs`).
   - 0 lỗi console, 0 request lỗi, không cuộn ngang, nút ≥ 44px, chữ cho bé ≥ 14px (script đo tự động).
3. **Nội dung:** chạy validator toàn bộ: số câu mỗi bài ≥ 10, không từ cấm, Toán không nhớ & ≤ 100, đáp án ∈ options, NFC. Rút ngẫu nhiên 50 câu mỗi môn ra file `docs/opencode/reports/T20_sample_questions.md` để **phụ huynh đọc soát bằng mắt**.
4. **Dữ liệu cũ:** tạo bản localStorage giả lập trạng thái trước P42 (dùng dữ liệu mẫu từ test hiện có) → mở app mới → không mất sao/tiến độ/đồ.
5. **Hiệu năng:** bundle size trước/sau, Lighthouse (performance, accessibility, best-practices, PWA) ở mobile.
6. Sửa mọi lỗi tìm thấy (commit riêng từng lỗi).
7. Viết `docs/P42_CERTIFICATION.md`: bảng chỉ số trước/sau (theo README), ảnh chụp các màn chính, danh sách lỗi đã sửa, rủi ro còn lại; cập nhật `.ai/CURRENT.md`.

## Tiêu chí PASS
Đạt toàn bộ "Kết quả mong đợi sau P42" trong `docs/opencode/README.md`; nếu chỉ số nào không đạt phải ghi rõ lý do và task bổ sung.
