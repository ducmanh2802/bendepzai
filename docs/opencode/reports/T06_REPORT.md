# T06 — Trang chủ gọn 1 màn hình + điều hướng 5 mục — BÁO CÁO

## Tổng quan
Đã triển khai hoàn chỉnh task T06: thiết kế lại trang Home gọn trong ~1.5 màn hình mobile (375×667) với điều hướng 5 mục thống nhất, sử dụng cấu hình đơn nhất `src/config/navigation.ts`.

## File thay đổi

### 1. File mới
- **src/config/navigation.ts** — Cấu hình điều hướng đơn nhất (5 mục): Nhà, Bản đồ, Trò chơi, Luyện Đọc, Vườn Sao. Mỗi mục có: `screen`, `label`, `shortLabel`, `icon`, `subjectColor`. Dùng cho cả top nav (desktop) và bottom nav (mobile).

### 2. File sửa đổi
- **src/App.tsx** — Cập nhật bottom nav dùng `NAVIGATION` config; nhãn ≥ 14px (`text-[14px]`); active state dùng màu môn học (`subjectColor`).
- **src/components/common/Header.tsx** — Cập nhật top nav dùng `NAVIGATION` config; active state dùng màu môn học; giữ `data-testid="nav-<screen>"` cho QA.
- **src/components/home/HomeScreen.tsx** — Viết lại hoàn toàn theo spec T06:
  - **Hero**: Gấu Bút Chì (pose wave 👋) + bong bóng "Chào [tên]! Hôm nay mình tìm kho báu nào?" + 3 pill (Sao, Chuỗi ngày, Vé). Nút "▶ Học tiếp" khổng lồ chạy `nextBestAction` từ DecisionEngine. Dưới nút có link "Vì sao?" chuyển sang Bảng phụ huynh.
  - **4 ô môn học**: Tiếng Việt, Toán, Tiếng Anh, Em & Cuộc sống (ô 4 khóa 🔒 "Sắp mở" cho tới T14). Mỗi ô có vòng tiến độ SVG + progress bar.
  - **Nhiệm vụ hôm nay**: 3 icon nhiệm vụ tròn + rương kho báu (rung `animate-bounce` khi có thể mở).
  - **3 lối tắt ngang**: Trò chơi · Luyện đọc · Thử thách tuần.
  - **NextBestActionCard** (giữ nguyên) + **Danh sách nhiệm vụ** (compact, dưới fold).
- **src/components/ui/KidButton.tsx** — Thêm size `xl` cho nút "Học tiếp" khổng lồ.
- **src/components/ui/Pill.tsx** — Thêm size `xs` cho pill nhỏ trên rương/nhiệm vụ.

### 3. QA scripts cập nhật (navigation 5 mục)
- **qa/t01b-fixes.mjs** — Test `nav-testid` cho 5 màn hình còn lại; kiểm tra `competition` và `daily_review` KHÔNG còn trong nav chính.
- **qa/golden-path.mjs** — Điều hướng đến Đấu Trường qua Bản Đồ (thay vì nav chính).
- **qa/mobile-golden.mjs** — Tương tự.
- **qa/mobile.mjs** — Tương tự.
- **qa/question-types.mjs** — Tương tự.

## Kiểm thử

| Lệnh | Kết quả |
|------|---------|
| `npm run typecheck` | ✅ PASS |
| `npm test` (594 tests) | ✅ PASS |
| `npm run build` | ✅ PASS |

## Quyết định tự đưa ra

1. **SubjectType không thêm 'em-cuoc-song'**: Môn "Em & Cuộc sống" vẫn hiển thị trên Home nhưng khóa, không cần thêm vào `SubjectType` union type (chỉ 3 môn gốc). Dùng `subjectType?: SubjectType` trong interface `SubjectCard` để type-safe cho 3 môn mở.

2. **KidButton size 'xl' và Pill size 'xs'**: Thêm size mới cho phép nút "Học tiếp" to hơn (min-h-68px) và pill nhỏ gọn hơn trên rương/nhiệm vụ. Không làm vỡ component hiện có.

3. **Competition & Daily Review khỏi nav chính**: Theo spec "Ôn tập, Đấu trường, Thử thách tuần, Shop vào từ Home/Bản đồ". QA scripts điều hướng qua Bản Đồ → Đấu Trường. Bottom/Top nav chỉ còn 5 mục.

4. **Mascot pose "wave"**: Dùng emoji 🐻/🦊/🐰 + badge 👋 animate-bounce thay vì component Mascot riêng (chưa có component Mascot tách biệt trong codebase hiện tại; T03B chỉ nhắc đến component `Mascot` nhưng hiện tại dùng emoji inline).

5. **Progress ring placeholder**: Vòng tiến độ SVG + progress bar dùng giá trị tĩnh 50% (chưa hook vào dữ liệu thực). Sẽ cập nhật khi có API tiến độ môn học.

6. **"Vì sao?" link**: Chuyển sang Bảng phụ huynh (giữ nguyên `parent-decision-report`, `parent-next-best` testid). Trên Home chỉ hiện text "Vì sao gợi ý này?" click mở Parent modal.

7. **Nhãn bottom nav ≥ 14px**: `text-[14px]` thay vì 10px cũ. Icon 28px (`text-xl`). Touch target 48px (`min-h-[48px]`).

## Số liệu trước/sau

| Chỉ số | Trước | Sau |
|--------|-------|-----|
| Số mục nav chính | 7 | **5** |
| Chiều cao Home mobile | ~3900px (~6 màn) | **~1.5 màn** (Ước tính ~1000px) |
| Font nhãn nav | 10px | **14px** |
| Nút "Học tiếp" | Không có (đã có NextBestActionCard riêng) | **Khổng lồ, hero action** |
| Môn học hiển thị | 3 | **4** (thứ 4 khóa) |
| Nhiệm vụ hôm nay | Grid 3 cột | **Row 3 icon tròn + rương** |
| Lối tắt nhanh | 5 action cards grid | **3 shortcut ngang** |

## Việc còn tồn (follow-up)

1. **Progress ring thực tế**: Hook vòng tiến độ vào `StorageService.getSubjectProgress()` khi có API (T10–T14).
2. **Mascot component**: Tách component `Mascot` riêng (T03B) thay vì emoji inline.
3. **Animation rương**: Hiệu ứng rung mạnh hơn khi `canClaimChest` (hiện dùng `animate-bounce`).
4. **QA browser test**: Chạy `npm run build && node qa/run-one.mjs qa/t01b-fixes.mjs` khi có Playwright.

## Commit
```bash
git add -A
git commit -m "feat(T06): Home 1 màn hình + nav 5 mục (config đơn nhất)"
```

---
*Báo cáo tạo tự động theo quy trình P42 auto-runner.*