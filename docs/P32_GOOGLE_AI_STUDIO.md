# P32 — GOOGLE AI STUDIO COMPATIBILITY

> Đây là **release blocker** theo §1.4. Trạng thái: **PASS**, kiểm chứng bằng môi trường sạch.

## 1. Định hình ứng dụng

| Hạng mục | Giá trị |
|---|---|
| Loại | Vite SPA, 100% client-side |
| Framework | React 19 + Vite 8 + Tailwind 4 |
| Package manager | npm (`package-lock.json`) |
| Node | `>= 20.19.0` (khai báo trong `engines`) |
| Môi trường đo | Node v24.12.0, npm 11.6.2, Windows |
| Server / API | **Không có** |
| Biến môi trường bắt buộc | **Không có** |
| Lệ�i gọi mạng | **0** (`grep -rn "fetch(\|axios\|XMLHttpRequest" src` → 0 kết quả) |

## 2. `package.json` sau khi chuẩn hoá

```json
"dependencies":    { "lucide-react", "react", "react-dom" }
"devDependencies": { "@tailwindcss/vite", "@types/node", "@types/react",
                     "@types/react-dom", "@vitejs/plugin-react",
                     "tailwindcss", "typescript", "vite", "vitest" }
```

### Đã gỡ 8 gói không dùng

| Gói đã gỡ | Lý do |
|---|---|
| `esbuild@^0.25` | **gây ERESOLVE** — peer của Vite 8 là `^0.27 \|\| ^0.28` |
| `@google/genai` | app không dùng AI |
| `express` + `@types/express` | không có server |
| `dotenv` | không có biến môi trường |
| `motion` | không import ở đâu |
| `tsx` | không có script nào dùng |
| `autoprefixer` | Tailwind 4 tự xử lý |

Hệ quả: `npm install` **từ FAIL → PASS**, bundle nhỏ hơn, bề mặt phụ thuộc nhỏ hơn nhiều.

### Đã sửa script

```diff
- "clean": "rm -rf dist server.js"                    // lệnh Unix, hỏng trên Windows
+ "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\""
+ "engines": { "node": ">=20.19.0" }
```

## 3. `vite.config.ts`

```diff
- '@': path.resolve(__dirname, '.'),        // Vite cảnh báo: __dirname không hợp lệ với configLoader 'native'
+ '@': path.resolve(import.meta.dirname, '.'),
```

Khối `server.hmr` / `server.watch` theo `DISABLE_HMR` được giữ nguyên vì đó là quy ước
của AI Studio (có chú thích giải thích trong file).

## 4. `metadata.json` — gỡ khai báo sai

```diff
- "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
+ "majorCapabilities": []
```

Ứng dụng **không** có server và **không** gọi Gemini. Khai báo năng lực không tồn tại là
thông tin sai đối với nền tảng và với người dùng.

## 5. `.env.example` — nói thật

File cũ ghi `GEMINI_API_KEY="MY_GEMINI_API_KEY"` và gọi là "Required". Điều này sai.
 Nay ghi rõ ứng dụng **không cần** biến môi trường hay API key nào để chạy, vì toàn bộ
chấm điểm / mastery / readiness / lưu trữ đều chạy cục bộ.

## 6. Fresh environment test (§28) — môi trường sạch

Không dựa vào `node_modules` cũ, cache, `.env`, hay localStorage của trình duyệt:

```bash
rm -rf node_modules dist
npm ci          → added 62 packages in 32s
npm run typecheck → PASS (0 error)
npm test          → 131/131
npm run build     → PASS
npm run preview   → HTTP 200
npm run dev       → HTTP 200
```

| Bước | Kết quả |
|---|---|
| `npm ci` | **PASS** |
| `npm run typecheck` | **PASS** |
| `npm test` | **PASS 131/131** |
| `npm run build` | **PASS** |
| `npm run preview` + golden path | **PASS, 0 error** |
| `npm run dev` + persistence | **PASS** |

### Audit lỗi thường gặp (§29)

| Loại lỗi | Kết quả |
|---|---|
| Phụ thuộc đường dẫn máy (`C:\`, `D:\`) | Không có |
| `__dirname` trong config | Đã gỡ |
| `process.env` trong code client | Không có |
| Import phụ thuộc server vào client | Không có |
| `window`/`document` lúc module scope | Chỉ trong hàm, có guard SSR |
| Sai phiên bản dependency | Đã sửa (`esbuild`) |
| Giả định SSR | Không — `createRoot` thuần client |
| Lỗi đường dẫn static asset | Không — Vite xử lý hash |
| Dynamic import thất bại | Không — đã kiểm chunk lazy qua preview |
| Giả định CORS | Không có request chéo origin |
| Phụ thuộc khởi động API | Không có backend |
| Giả định cổng | `dev` cố định 3000, `preview` tự tìm cổng trống |

## 7. Chạy thật trên dev server

```
VITE v8.3.2  ready in 1134 ms
➜  Local:   http://localhost:3000/
➜  Network: http://192.168.1.6:3000/
```

Đo persistence trực tiếp trên dev server:

| Mốc | XP | Bài đã học |
|---|---|---|
| Sau `localStorage.clear()` | 0 | 0 |
| Sau khi hoàn thành 1 bài | **110** | **1** (`vn-les-1`) |
| Sau F5 | **110** | **1** |

## 8. Offline / PWA

| Hạng mục | Kết quả |
|---|---|
| Service worker | `public/sw.js` — cache có phiên bản `kho-bau-v1` |
| Đăng ký | Chỉ ở **production**, qua `src/services/pwa.ts`, **không bao giờ throw** |
| Chiến lược navigation | **network-first**, fallback về shell đã cache |
| Chiến lược asset | stale-while-revalidate (tên file có hash nên cache hit không bao giờ sai) |
| Dev mode | **không** đăng ký (tránh đánh nhau với Vite HMR) |
| Kiểm chứng | `qa/offline-pwa.mjs`: tắt mạng → app vẫn hiện và **vẫn trả lời câu hỏi được** |

Đây là thiết kế **phòng thủ**: navigation dùng network-first vì phục vụ một HTML cũ có
thể trỏ tới hash asset không còn tồn tại, gây hỏng app. Network-first đảm bảo bản cập
nhật luôn tới và HTML cũ không bao giờ được phục vụ khi còn mạng.

```
rm -rf node_modules dist && npm ci   # 62 packages
npm run typecheck                    # PASS
npm test                             # 208/208
npm run build                        # PASS → dist/sw.js, dist/favicon.svg, dist/manifest.webmanifest
npm run preview -- --port 4200      # HTTP 200
```

## 9. Core flow chạy khi AI unavailable

Vì **không có AI nào**, yêu cầu "không phụ thuộc external AI để chấm điểm / tính mastery /
tính readiness" được thoả mã bằng cách mạnh hơn: không tồn tại đường gọi mạng nào.
Tắt mạng hoàn toàn thì ứng dụng không đổi một byte hành vi nào.

## 10. Hạn chế đã biết

| Hạn chế | Mức độ | Ghi chú |
|---|---|---|
| Cần Node ≥ 20.19 | P2 | Khớp peer dependency của Vite 8; AI Studio đã cấp Node ≥ 20 |
| Font Google (`fonts.googleapis.com`) | P2 | Nếu offline, font dự phòng `cursive/sans-serif` vẫn hiển thị; **không** có lỗi chặn |
| Manifest chỉ có icon SVG, chưa có PNG 192/512 | P2 | Một số trình duyệt chưa báo "installable"; vẫn chạy và cài được như shortcut |

## 11. Kết luận

Không có blocker Google AI Studio. Ứng dụng cài, build, chạy, preview và kiểm chứng
golden-path được trong môi trường sạch, không cần secret, không cần backend.
