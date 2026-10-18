# GOOGLE AI STUDIO RUNBOOK

> Bản này viết lại theo **code thật** sau P32. Mọi lệnh dưới đây đã được chạy và PASS.

## 1. Yêu cầu

| Hạng mục | Yêu cầu |
|---|---|
| Node.js | **≥ 20.19.0** (khai báo trong `package.json` → `engines`) |
| npm | ≥ 10 |
| API key | **KHÔNG cần** |
| Backend / server | **KHÔNG cần** |
| File `.env` | **KHÔNG cần** (xem `.env.example`) |

Kiểm tra Node:

```bash
node -v     # v20.19.0 trở lên
npm -v
```

## 2. Mở dự án

Trong Google AI Studio: **Open project** → chọn thư mục này. AI Studio tự nhận diện Vite
qua `package.json` và `index.html`.

## 3. Cài đặt

```bash
npm ci        # dùng package-lock.json — khuyến nghị cho môi trường sạch
# hoặc
npm install   # nếu chưa có lockfile
```

Kết quả thực tế: `added 62 packages`.

> **Nếu gặp `ERESOLVE`**: đừng dùng `--force` / `--legacy-peer-deps`. Lỗi đó đã được sửa
> tận gốc bằng cách gỡ `esbuild` khỏi `devDependencies` (xem `docs/P32_GOOGLE_AI_STUDIO.md`).

## 4. Chạy (dev)

```bash
npm run dev
```

Kỳ vọng:

```
VITE v8.3.2  ready in ~1100 ms
➜  Local:   http://localhost:3000/
```

Mở `http://localhost:3000/`. Trang chủ phải hiện: *"Xin chào Bé Minh!"*, thẻ **Luyện Đọc**,
thẻ **Đấu Trường**, và khối **"Bé Nên Làm Gì Tiếp Theo?"**.

## 5. Build

```bash
npm run build
```

Kỳ vọng:

```
dist/index.html                   ~1.6 kB
dist/assets/index-*.css           ~94.9 kB │ gzip: ~13.5 kB
dist/assets/index-*.js            ~450.8 kB │ gzip: ~131.1 kB
✓ built
```

Không có lỗi typecheck trong build (Vite build không chạy typecheck — hãy chạy
`npm run typecheck` riêng).

## 6. Preview

```bash
npm run preview
```

Mở địa chỉ Vite in ra. Kỳ vọng: HTTP 200, tiêu đề *"Kho Báu Tri Thức — Lớp 1"*,
0 lỗi console, 0 request thất bại.

## 7. Kiểm tra chất lượng (không bắt buộc để chạy)

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest run  → 131 test
```

## 8. Biến môi trường

**Không có biến nào bắt buộc.** Ứng dụng không có AI provider, không có server.

```bash
# KHÔNG cần làm gì cả.
```

`.env.example` chỉ tồn tại để ghi rõ điều đó.

## 9. Hành vi khi AI unavailable

Không áp dụng — app **không có** AI. Nếu mạng biến mất:

- Bài học, ôn tập, luyện đọc, đấu trường, game, phần thưởng, phụ huynh: **vẫn chạy**.
- Toàn bộ dữ liệu nằm trong `localStorage` của trình duyệt.
- Font Google không tải được → dùng font dự phòng, **không** có lỗi.

## 10. Xử lý sự cố

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| `ERESOLVE` khi `npm ci` | Sai dependency | `npm install`; nếu vẫn lỗi, xoá `node_modules` + `package-lock.json` rồi `npm install` |
| `Unsupported engine` | Node < 20.19 | Nâng cấp Node |
| `Port 3000 is in use` | Cổng bận | `npm run dev -- --port 3001` |
| `Cannot find module '@/…'` | Alias chưa nạp | Kiểm tra `vite.config.ts` có khối `resolve.alias` |
| Trang trắng, `bodyChars 0` | Thiếu dấu `/` cuối URL | Dùng `http://localhost:3000/` |
| Tiếng không phát | Trình duyệt chặn TTS | Bật quyền; app có nút bật/tắt âm |
| Mất tiến độ sau khi dọn dữ liệu trình duyệt | `localStorage` bị xoá | Đây là hành vi **đúng** — dữ liệu nằm cục bộ theo thiết kế |
| Muốn xoá hết và chơi lại | — | Header → **Ba Mẹ** → *Cài Đặt* → **Đặt lại tiến độ** |

## 11. Kiểm tra sau khi triển khai

1. Mở trang → thấy lời chào, không lỗi console.
2. Vào **Luyện Đọc** → thang 5 bậc, 4 bậc đang khoá với bé mới.
3. Làm 1 bài học → nhận sao/XP → bấm **F5** → tiến độ còn nguyên.
4. Vào **Đấu Trường** → thi 1 mini test → xem **Bảng phân tích điểm**.
5. Header → **Ba Mẹ** → trả lời phép cộng → xem báo cáo tiến độ, tab **Luyện Đọc**, tab **Đấu Trường**.
6. Thu nhỏ cửa sổ còn 360px → không tràn ngang, nút bấm đủ 44px.
