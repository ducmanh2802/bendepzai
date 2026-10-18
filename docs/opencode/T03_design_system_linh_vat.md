# T03 — Design system + linh vật Gấu Bút Chì (SVG)

**Đọc trước:** `00_RULES.md` (mục Phong cách). **Nhánh:** `p42/T03`

## A. Design tokens (`src/index.css` – `@theme` của Tailwind v4)
1. Khai báo token: màu nền, chữ, viền; màu theo môn (`--color-subject-viet`, `-math`, `-english`, `-life`, `-games`) mỗi màu có 3 sắc (50/500/700); bo góc (`--radius-card`, `--radius-pill`), bóng (`--shadow-soft`, `--shadow-pop`), cỡ chữ cho bé (`--text-kid-sm 16px`, `-md 20px`, `-lg 28px`, `-xl 40px`), 1 độ dày viền chuẩn (3px).
2. Tạo các component dùng chung trong `src/components/ui/`: `KidButton` (primary/secondary/subject, size md/lg, min-h 52px, hiệu ứng nhấn lún), `KidCard`, `Pill` (sao/streak/vé), `SpeakButton` (nút loa thống nhất – gộp các nút loa đang lặp), `ProgressStars`, `SectionTitle`.
3. Thay dần class lặp ở `Header`, `HomeScreen`, `GamesHubScreen`, `SubjectScreen` bằng component mới (không đổi bố cục – bố cục làm ở T06–T09).
4. Chế độ "Ban đêm" dịu mắt (tuỳ chọn trong Cài đặt phụ huynh): token cho `[data-theme="night"]`.

## B. Linh vật Gấu Bút Chì — `src/components/mascot/Mascot.tsx`
1. Vẽ bằng **SVG inline tự viết** (không ảnh ngoài): gấu nâu tròn trịn, má hồng, cầm bút chì vàng, đội mũ thám hiểm nhỏ (chủ đề kho báu).
2. Props: `pose: 'idle' | 'happy' | 'cheer' | 'think' | 'sad-soft' | 'sleep' | 'wave' | 'read'`, `size`, `accessory?` (id món đồ từ Shop — mũ/kính/áo vẽ chồng lên đúng vị trí), `speech?` (bong bóng thoại), `onTap?` (gấu nói câu ngẫu nhiên qua `useSpeak`).
3. Animation CSS: thở nhẹ (idle), nhảy (cheer), nghiêng đầu (think), vẫy tay (wave), chớp mắt ngẫu nhiên. Tắt theo reduced-motion.
4. Thay emoji 🐻 ở: Header, Home hero, LessonPlayer (khi đúng → `happy`, sai → `think` + "Mình thử lại nhé!"), màn kết quả, trạng thái trống, Shop (đồ mặc **lên người** gấu, thay vì đặt cạnh).
5. Bộ minh hoạ nhỏ SVG cho 4 môn + 6 vùng bản đồ (`src/components/illustrations/`), phong cách phẳng, cùng bảng màu.

## Nghiệm thu
- Trang demo nội bộ `?dev=mascot` hiển thị tất cả pose + accessory (ẩn với bé).
- Ảnh chụp trước/sau Home, Shop, Lesson lưu vào `docs/opencode/reports/img/`.
- Test render `Mascot` với mọi pose (vitest + react-dom/server `renderToString`). typecheck + test + build PASS.
