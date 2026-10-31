# ARCHITECTURE — SAD + ADR
## KHO BÁU TRI THỨC — LỚP 1 (mã tài liệu KBT-SAD-1.0)

> Tài liệu này trả lời ba câu hỏi: **ứng dụng được ghép như thế nào**, **dữ liệu đi đâu**,
> và **tại sao lại chọn như vậy** (ADR). Mỗi khẳng định có đường dẫn file thật.
> Yêu cầu chức năng/phi chức năng: xem [`SRS.md`](SRS.md). Ánh xạ FR → file → test: [`RTM.md`](RTM.md).
>
> **Ngày chốt số liệu:** 2026-10-30 (đo lại sau khi merge nhánh `origin/main` mang vào
> Firebase cloud-sync và bàn cờ vua 3D bằng three.js).

---

## 1. Bức tranh tổng thể

```
┌──────────────────────────────── trình duyệt (điện thoại / máy tính bàn) ─────────────────────┐
│                                                                                              │
│   index.html ──► src/main.tsx ──► <App/>  (state router, 17 màn hình)                        │
│        │                    │                                                                │
│        │                    ├──► src/services/pwa.ts ──► registerServiceWorker()             │
│        │                    └──► @vercel/analytics (chỉ đếm lượt dùng)                        │
│        │                                                                                      │
│   dist/sw.js  ◄── writeBundle: scripts/sw-precache.mjs thay __PRECACHE_MANIFEST__             │
│        │        bằng toàn bộ URL same-origin của build (mọi chunk, font, icon)                 │
│        ▼                                                                                      │
│   CacheStorage "kho-bau-v3"  (chứa asset, KHÔNG chứa dữ liệu bé)                               │
│                                                                                              │
│   src/services/storage.ts  ◄── MỌI trạng thái bền vững (đọc/ghi đúng cả khi chưa đăng nhập)   │
│        ▼                                                                                      │
│   window.localStorage: 17 key `kho_bau_*`  (5 MB thiết bị, nguồn thật duy nhất)                │
│        │                                                                                      │
│        └──(chỉ khi bé/bố mẹ BẬT)──► src/services/cloudSync.ts ──► firebase.ts ──► Firestore  │
│                     sự kiện `kho_bau_storage_change` + debounce 2 s ⇒ đẩy lên `users/{uid}`    │
│                     kéo về merge: `Math.max` sao/XP/chuỗi, `Set` union bài đã học              │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
     ✗ KHÔNG có backend riêng   ✗ KHÔNG secret trong repo   ✗ KHÔNG upload ảnh/audio của bé
                    ◐ cloud-sync TUỲ CHỌN — mặc định tắt, app vẫn đầy đủ chức năng khi offline
```

**Điểm cần nhớ khi đọc tiếp:** ứng dụng là **một SPA offline-first**; `localStorage` vẫn là
nguồn thật duy nhất và cloud-sync chỉ là lớp **tuỳ chọn** bật khi người dùng chủ động đăng
nhập Google (ADR-16). Mọi quyết định kiến trúc bên dưới đều xuất phát từ ràng buộc đó: tiến độ
nằm trong `localStorage`, nên schema phải có phiên bản; asset phải phục vụ lúc mất mạng, nên
build phải precache đủ; thiết bị của gia đình có thể yếu, nên chunk và node budget là gate,
không phải lời khuyên.

---

## 2. Công nghệ

| Lớp | Lựa chọn | Phiên bản (`package.json`) |
|---|---|---|
| UI | React | `react ^19.0.1`, `react-dom ^19.0.1` |
| Ngôn ngữ | TypeScript, `target ES2022`, `jsx react-jsx` | `typescript ^7.0.2` |
| Build | Vite 8 (bundler **rolldown**) | `vite ^8.3.0`, `@vitejs/plugin-react ^6.1.1` |
| Style | Tailwind v4 qua plugin Vite (không PostCSS config riêng) | `tailwindcss ^4.3.3`, `@tailwindcss/vite ^4.3.3` |
| Test | Vitest | `vitest ^5.0.3` (`testTimeout: 20000` trong `vite.config.ts`) |
| QA trình duyệt | Playwright (probe tự viết, không test runner) | `playwright ^1.64.0` |
| Icon | lucide-react | `lucide-react ^0.546.0` |
| Analytics | @vercel/analytics | `@vercel/analytics ^2.0.1` |
| Đồng bộ đám mây (tuỳ chọn) | Firebase Auth + Firestore | `firebase ^13.1.0` |
| 3D bàn cờ vua | three.js (chỉ trong chunk lazy) | `three ^0.186.1`, `@types/three ^0.186.0` |
| Runtime khác | tslib | `tslib ^2.8.1` |
| Node | bắt buộc | `engines.node >= 20.19.0` (CI dùng Node 22) |

**Dependency runtime = 8** (`npm ls --depth=0` / `package.json > dependencies`).
Đó là con số bị AGENTS.md §1.4 bảo vệ: thêm một package phải được hỏi trước và nêu ảnh
hưởng bundle. **Nợ mới từ merge:** `@types/three` là kiểu khai báo, đúng ra phải nằm ở
`devDependencies`; `npm install` báo 4 lỗ hổng severity cao — cần `npm audit` có chủ đích
trước khi phát hành tiếp.

---

## 3. Tầng và chiều phụ thuộc

```
src/types/     ◄─ 8 module: index, competition, learningOS, reading, decisionEngine,
                              motivation, englishMastery, kidBox
   ▲
src/config/policy.ts   ◄─ 17 export ngưỡng + rationale (693 dòng)
   ▲
src/data/      ◄─ 104 file .ts: curriculum 4 môn, bank câu thi, game packs, reading,
   │                            taxonomy, shop/quest/sticker/achievement catalog
   │                            (dữ liệu THUẦN — không import component, không DOM)
src/services/  ◄─ 39 module: chấm điểm, learning OS, decision engine, reading engine,
   │                            competition engine, storage, sound/TTS, PWA, engines…
   │                            (thuần logic, không phụ thuộc React)
src/hooks/     ◄─ 4: useGameStage, useModalHistory, useFocusTrap, useSpeak
   ▲
src/components/ ◄─ 93 .tsx trong 19 thư mục tính năng (games/, learning/, competition/,
                              reading/, parent/, motivation/, shop/, world/, home/,
                              subject/, review/, english/, achievements/, challenge/,
                              auth/, common/, ui/, visuals/, system/)
   ▲
src/App.tsx    ◄─ 436 dòng: điều hợp màn hình + state router
```

**Quy tắc chiều (vi phạm là lỗi thiết kế, không phải lỗi style):**

1. `types/` không import gì từ tầng trên.
2. `data/` và `services/` **không** import `react`, không chạm `document`/`window`
   (ngoại lệ hợp lý: `storage.ts` chạm `localStorage` và phát `kho_bau_storage_change`,
   `sound.ts`/`britishSpeech.ts`/`pwa.ts` chạm API trình duyệt, `cloudSync.ts`/`firebase.ts`
   chạm `window` + mạng — và chỉ ở đó).
3. `components/` gọi `services/`, **không** tự tính điểm/thăng cấp/độ sẵn sàng (NFR-M03).
4. `config/policy.ts` là chỗ duy nhất khai báo ngưỡng; component không hard-code con số.
5. `services/` không import `components/`. Chiều nghịch này là dấu hiệu cần tách engine.

**Vì sao tách `data` khỏi `services`:** toàn bộ nội dung là tĩnh và được import trực tiếp
vào test; khi một câu hỏi sai, test nội dung chỉ ra đúng file dữ liệu, không phải UI.

---

## 4. Luồng dữ liệu

### 4.1 Một lượt trả lời (đường cong thật, không phải mô tả lý thuyết)

```
 bé chạm đáp án
   → component câu hỏi (src/components/learning/questions/*.tsx) phát kết quả thô
   → src/services/answerCheck.ts  ⇒ ĐÚNG/SAI  (duy nhất, UI không tự quyết)
   → src/services/learningOS.ts   ⇒ reduceEvidence(LearningEvidence{id, skillId, …})
        • idempotency: processedEvidenceIds chặn tính hai lần (cap recentEvidences = 200)
   → KnowledgeState per skill (level L1…L5, counters, misconception map, retention)
   → src/services/decisionEngine.ts ⇒ Next Best Action (P39_DECISION_POLICY)
   → src/services/adaptiveDifficulty.ts + sessionComposer ⇒ câu kế tiếp
   → src/services/storage.ts      ⇒ ghi `kho_bau_learning_os_store` (mỗi bước đều persist)
   → src/components/learning/NextBestActionCard.tsx ⇒ thẻ hướng dẫn trên màn
```

Cùng luồng này nuôi `levelEngine` (XP), `streakEngine` (chuỗi ngày), `questEngine` (quest),
`achievementEngine` (thành tựu) — tất cả đọc store, **không đọc state của component**.

### 4.2 Đường vào/ra `localStorage` (5 lớp phòng thủ)

```
readJSONObject(key)            src/services/storage.ts:217
  ├─ JSON.parse trong try/catch → lỗi parse ⇒ coi như chưa có dữ liệu
  ├─ applyMigrations(payload)  : đi tuần tự MIGRATIONS theo SCHEMA_HISTORY (storage.ts:108/141)
  ├─ sanitize                  : xoá field lạ, ép kiểu, điền mặc định (không ném exception)
  └─ createDefault*Store()     : payload thiếu ⇒ store hợp lệ, không phải `undefined`
writeJSON(key, value)          src/services/storage.ts:236
  └─ luôn ghi kèm `schemaVersion`
```

Bốn lớp còn lại của idempotency (NFR-R04): `evidence.id`, `kho_bau_game_first_seen`
(thưởng lần đầu), `kho_bau_game_nonce` (xáo đề), và completion flag của bài học.

### 4.3 Đường ra khỏi máy

Hai đường, và cả hai đều do người lớn khởi động:

1. **Xuất báo cáo** (mặc định): phụ huynh bấm xuất → file `kho_bau_tri_thuc_report_*.json`
   tải xuống. Không ai nhận bản sao ở server.
2. **Đồng bộ cloud (tuỳ chọn, chỉ sau khi đăng nhập Google):** `cloudSync.ts` đẩy
   `ChildProfile` + các store đã serialize lên tài liệu Firestore `users/{uid}` của
   chính tài khoản đó. `firestore.rules` chỉ cho đọc/ghi `request.auth.uid == userId`,
   nên không có đường nào ghi vào hồ sơ người khác.

`@vercel/analytics` không nhận payload bài học/tên bé (FR-Y07). Không có upload ảnh/audio.

---

## 5. Điều hướng và vòng đời màn hình

- **Không router.** `ActiveScreen` (17 giá trị) + `useState` trong `src/App.tsx`;
  vào/ra màn hình là chuyển state. Lý do: PWA offline + không deep link cần chia sẻ,
  nên một URL là đủ và không có chi phí router.
- **Modal = một lớp history.** `src/hooks/useModalHistory.ts:20` push
  `{ kbModal: true }` khi mở; nút Back hoặc ESC pop về và đóng modal trước khi thoát app
  (`FR-S02`). Đây là lý do bé bấm Back trên Android không mất phiên học.
- **Focus là tài nguyên.** `useFocusTrap.ts` cấp trap cho mọi dialog; khi đóng, focus
  phải quay về phần tử mở ra (`qa/focus.mjs`, `qa/kidbox-focus.mjs`, `qa/decision-engine-a11y.mjs`).
- **Parent Gate chắn trước dữ liệu.** Phép cộng hai số ≥ 10 (FR-S07); không có đường nào
  vào dashboard phụ huynh mà không qua gate — kể cả từ URL hay phím tắt.

---

## 6. Module hoá, chunk và ngân sách

`vite.config.ts` dùng **hàm** `manualChunks` (rolldown chỉ nhận dạng hàm):

| Chunk | Nội dung | Lý do |
|---|---|---|
| `react-vendor` | `react`, `react-dom` | nhân framework tách khỏi entry để entry không phình theo nội dung |
| `three-vendor` | `node_modules/three` | bàn cờ vua 3D WebGL **nạp lười**; 545.4 kB không được nằm trên đường tải tiên phong (ADR-17) |
| `firebase-vendor` | `firebase`/`@firebase` | 537.9 kB, chỉ dùng cho cloud-sync tuỳ chọn; tách để entry không phải mang SDK |
| `math-bank` | `src/data/math/` + `mathCurriculum` | ngân sách sống sót sau khi kho Toán phình |
| `english-bank` | `src/data/english/` + `englishCurriculum` | tương tự cho kho Anh |
| entry `index-*.js` | App + services + phần còn lại | **≤ 600 kB (cứng), mục tiêu ≤ 450 kB** — hiện **533.5 kB** |

- Gate: `npm run check:budget` → `scripts/check-bundle-budget.mjs` đọc `dist/index.html`
  để tìm đúng file entry (bảo đảm không cộng nhầm chunk), exit 1 nếu vượt.
  `tests/bundle-budget.test.ts` dùng lại **cùng** hàm `getBudgetReport()` — gate và test
  không thể lệch nhau.
- Trò chơi nạp lười qua `src/components/games/registry.ts` (`GAME_REGISTRY`, đủ **31** lời gọi `lazy(...)`); 31 trò = 31 chunk nhỏ, không trò nào nằm trong entry.
- Cờ vua 3D cũng nạp lười: [src/App.tsx:18](file:///D:/trithuc/kho-bau-tri-thuc/src/App.tsx#L18) `lazy(() => import('./components/learning/chess/ChessScreen'))`
  ⇒ `three-vendor` (545.4 kB) và `ChessScreen` (43.5 kB) chỉ tải khi bé mở bàn cờ; chưa từng mở thì không trả giá.
- Ảnh: emoji + SVG + CSS, không thư viện ảnh. Font tự chứa (không CDN — FR-Y06).

---

## 7. Persistence

- `STORAGE_SCHEMA_VERSION = 'P42-v3'` [src/services/storage.ts:99](file:///D:/trithuc/kho-bau-tri-thuc/src/services/storage.ts#L99)
- `SCHEMA_HISTORY` 7 phiên bản: `P28-v1, P29-v2, P30-v1, P41-v1, P42-v1, P42-v2, P42-v3`
  ([src/services/storage.ts:141](file:///D:/trithuc/kho-bau-tri-thuc/src/services/storage.ts#L141))
- `MIGRATIONS` 6 hàm ([src/services/storage.ts:108](file:///D:/trithuc/kho-bau-tri-thuc/src/services/storage.ts#L108));
  nguyên tắc: migration chỉ **backfill**, không tính lại mastery lịch sử (một số hàm là
  `{...raw}` có chủ đích vì store mới nằm ở key riêng).
- 17 key `localStorage` (Bảng DC trong SRS). **Nợ:** `kho_bau_ioe_store` khai báo cục bộ ở
  [src/components/learning/englishIoe/EnglishIoeScreen.tsx:6](file:///D:/trithuc/kho-bau-tri-thuc/src/components/learning/englishIoe/EnglishIoeScreen.tsx#L6)
  thay vì trong `STORAGE_KEYS` → key này thoát khỏi kiểm kê tự động và khỏi pipeline
  `readJSONObject`/`writeJSON`. Hướng xử lý: đưa về `STORAGE_KEYS.IOE_STORE` + đọc qua
  `readJSONObject`, có test đếm đủ 17 key (xem `docs/plan/TASK_PLAN.md` EP-B3).
- Cache trình duyệt chứa **asset**, không chứa dữ liệu bé ⇒ xoá cache không mất tiến độ
  (`qa/offline-pwa.mjs` chứng minh).
- **Lớp mirror tuỳ chọn (không thay thế các mục trên):** `src/services/cloudSync.ts` (224 dòng)
  singleton `CloudSyncService` ([src/services/cloudSync.ts:224](file:///D:/trithuc/kho-bau-tri-thuc/src/services/cloudSync.ts#L224))
  — constructor đăng ký `onAuthChange` và nghe `kho_bau_storage_change` (phát tại
  [src/services/storage.ts:241](file:///D:/trithuc/kho-bau-tri-thuc/src/services/storage.ts#L241))
  ⇒ `scheduleAutoSync()` debounce 2000 ms, **chỉ khi đã đăng nhập**;
  `pullAndMergeCloudData(uid)` (cloudSync.ts:114) hợp nhất sao/XP/chuỗi/vé bằng `Math.max`
  và `completedLessons` bằng `Set` union, rồi ghi trả `localStorage`.
  Không đăng nhập ⇒ trạng thái `offline` ⇒ app hoạt động y hệt bản không server.

---

## 8. PWA / offline

`public/sw.js` + `src/services/pwa.ts`:

| Loại request | Chiến lược | Lý do (an toàn là ưu tiên 1) |
|---|---|---|
| Navigation | **network-first**, fallback shell cache | HTML cũ có thể trỏ hash asset đã biến mất ⇒ phục vụ HTML cache là tự làm sập app |
| Asset hashed (`/assets/index-*.js`, font, icon) | **stale-while-revalidate**, match với `ignoreVary` | tên mang hash nội dung ⇒ hit trong cache không thể sai cho build hiện tại; `ignoreVary` vì server có thể trả `Vary: Origin` (xem dưới) |
| Cross-origin | stale-while-revalidate, lỗi chịu được | app không chết vì CDN ngoài |
| Không phải GET / không http(s) | bỏ qua | không có gì để cache |

- Một cache versioned `kho-bau-v3`; deploy mới purge cache cũ; placeholder
  `__PRECACHE_MANIFEST__` không được thay (dev server) ⇒ danh sách rỗng, worker vẫn sống.
- Manifest đo trên `dist/sw.js` bản build 2026-10-30: **98 URL** = 86 file trong
  `/assets` (85 `.js` + 1 `.css`) + 4 font + 8 mục gốc (`index.html`,
  `manifest.webmanifest`, 4 icon PNG, `icon-maskable-*`, `apple-touch-icon.png`,
  `favicon.svg`). Precache vào đủ 98/98 — kiểm chứng bằng `caches.keys()` trong
  `qa/offline-pwa.mjs` (`assetCount: 86`).
- **Bẫy `Vary: Origin` (đã sửa 2026-10-30):** `vite preview` trả asset kèm
  `vary: Origin`. Khoản precache được lưu theo request *không* có header `Origin`,
  còn request script thật của trang *có* (`Origin: http://localhost:4173`) ⇒
  `cache.match()` mặc định trượt, chunk lazy chết `net::ERR_FAILED` khi tắt mạng
  dù đã precache đủ. vì thế nhánh same-origin trong `sw.js` match với
  `{ ignoreVary: true }` (tên file đã hash nội dung nên bỏ qua Vary là an toàn);
  fallback navigation cũng dùng `ignoreSearch + ignoreVary`. Nhánh cross-origin
  vẫn tôn trọng Vary. Hợp đồng này có test chốt trong `tests/pwa.test.ts`.
- Tiêm manifest chạy ở `writeBundle`, **không phải** `closeBundle` — `closeBundle` được gọi
  hai lần và chạy *trước khi* chunk được emit, nên tạo manifest thiếu `/assets/*`
  (ADR-07).
- Icon: `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`,
  `apple-touch-icon.png` + `manifest.webmanifest`; máy sinh ảnh zero-dependency, đã decode thật.
- `three-vendor` / `firebase-vendor` là chunk same-origin có hash ⇒ được precache như mọi
  chunk khác; mất mạng vẫn mở được bàn cờ vua 3D nếu đã tải một lần.
- Mất mạng **không** làm hỏng app vì cloud-sync: mọi request Firestore/Google đi qua
  `fetch` bị từ chối ⇒ `CloudSyncService.syncNow()` (cloudSync.ts:177) bắt lỗi, đặt
  `CloudSyncStatus = 'error'` và báo trên banner ([src/components/auth/CloudSyncBanner.tsx](file:///D:/trithuc/kho-bau-tri-thuc/src/components/auth/CloudSyncBanner.tsx));
  `localStorage` vẫn là bản đầy đủ. **Rủi ro còn lại:** chiến lược stale-while-revalidate cho
  cross-origin (sw.js:185) về nguyên tắc cũng áp dụng cho GET ngoài `firestore.googleapis.com`;
  chưa có test nào chứng minh điều đó không trả dữ liệu cũ — xem nợ #9 ở §13.

---

## 9. Âm thanh, giọng đọc, media

- `src/services/sound.ts`: tổng hợp bằng **WebAudio** (oscillator), 0 file mp3, 0 URL ngoài
  ⇒ không gãy link offline, không rủi ro bản quyền (ADR-10).
- `useSpeak.ts` + `britishSpeech.ts`: `SpeechSynthesis`, chống hai utterance chồng nhau,
  fallback en-GB có kiểm soát và **nhãn trung thực** khi máy không có giọng en-GB.
- `questionAudio.ts`/`readingAdapter.ts`: âm thanh theo câu hỏi/đoạn đọc.
- `speechText.ts` (`toSpeechText`): **lớp phát âm cuối đường** — ký hiệu `+ − =` trong đề
  ("Tính: 6 + 4 = ?", "Điền số: ... + 27 = 60") được nối thành "cộng / trừ / bằng mấy /
  bằng bao nhiêu" ngay trước `SpeechSynthesisUtterance` vì giọng nền tảng bỏ qua ký hiệu.
  Đặt SAU assert của `questionAudio.ts` nên contract routing (§21 SRS FR-M09) không đổi, chữ
  hiển thị và `data-last-spoken` vẫn là nguyên văn đề. Chỉ đổi khi ký hiệu nằm cạnh chữ số,
  giữ `[1 - 3 - 5]` (phân cách dãy), `1–3` (en dash), `add-sub-10`, `-5 độ`.
- Không chấm điểm phát âm; nhận giọng (SpeechRecognition) là **tuỳ chọn**, thiếu vẫn
  nghe–lặp lại–tự đối chiếu (`SPEECH_REPORTING_POLICY` [src/config/policy.ts:445](file:///D:/trithuc/kho-bau-tri-thuc/src/config/policy.ts#L445)).
- **Hai đường 3D cùng tồn tại (ADR-11 + ADR-17):**
  - Cờ **tướng**: CSS 3D (`perspective`, `rotateX`, `transform-style: preserve-3d`) trong
    `src/components/learning/cotuong/CotuongBoard3D.tsx`; quân cờ mang `id` ổn định để trượt,
    không remount. Không thêm dependency nào.
  - Cờ **vua**: WebGL thật bằng three.js — `src/components/learning/chess/chess3d/Chess3DCanvas.tsx`
    (682 dòng: `WebGLRenderer` :200, `Raycaster` :99 cho picking, `Scene` :185), gắn vào
    `ChessGame.tsx:326`, `three-vendor` tách chunk và chỉ tải qua `React.lazy`.

---

## 10. Kiến trúc chất lượng (quality architecture)

```
git hook (scripts/hooks/)            CI (.github/workflows/)
  pre-commit : typecheck + chặn .env*  01-quality      : npm ci → typecheck → test:ci
  commit-msg : Conventional Commits     02-build-artifact: build → check:budget → upload dist/
  pre-push   : verify:quick             03-qa-browser    : download dist/ → playwright chromium
  prepare    : cài hooks                    → node qa/run-one.mjs <probe>
                                        04-release       : tag vX.Y.Z → verify → release notes → zip
npm run verify = typecheck + test:ci + build + check:budget
```

- CI **không** dùng `npm test`: `posttest` gọi `scripts/audit-snapshot.mjs` ghi
  `docs/audit-state.json` và **nối vào** `docs/AUDIT_REPORT.md` ⇒ ghi đè tài liệu audit,
làm bẩn diff của PR (ADR-12).
- Probe QA chạy trên `dist/` thật, không chạy trên dev server; `qa/run-one.mjs` ưu tiên
  `PW_CHROME` → cache máy dev → Chromium của Playwright, exit 1 chỉ khi probe có lỗi thật.
- **MCP cho agent** (`mcp/`, 5 server / 27 tool, zero-dependency): số liệu MCP là *manh mối*,
  bằng chứng vẫn phải là output lệnh thật (docs/SDLC.md §10).

---

## 11. Architecture Decision Records

Khuôn mẫu: **Bối cảnh → Lựa chọn → Quyết định → Hệ quả (cả mặt tốt lẫn nợ).**

### ADR-01 — Không backend riêng; `localStorage` là nguồn thật, cloud-sync chỉ là mirror tuỳ chọn
- **Bối cảnh:** sản phẩm cho trẻ 6 tuổi, phụ huynh lo dữ liệu của con, nhóm không có hạ tầng
  tự vận hành. Nhánh `origin/main` (2026-10-30) mang vào Firebase Auth + Firestore theo mẫu
  Google AI Studio.
- **Lựa chọn:** (a) Firebase thành nơi lưu tiến độ chính; (b) từ chối, giữ localStorage-only
  và xoá `firebase.ts`; (c) **chấp nhận Firebase như lớp mirror opt-in**, `localStorage` vẫn
  là nguồn thật duy nhất.
- **Quyết định:** **(c)**. `src/services/firebase.ts` (85 dòng) khởi tạo app + `getAuth` +
  `getFirestore` và `signInWithGoogle()` (:50) **không còn ném lỗi** như bản placeholder
  trước; `src/services/cloudSync.ts` chỉ hành động khi có user đã đăng nhập, mặc định
  `status = 'offline'`. `firestore.rules` chắn `request.auth.uid == userId`.
- **Hệ quả:** đồng bộ được giữa máy khi gia đình chủ động bật; không ép trẻ/em nhỏ tạo tài
  khoản; app vẫn chạy 100% offline. **Nợ mới:** chi phí Firestore thuộc project Firebase đã
  cấu hình ở `firebase-applet-config.json` (khống chế bằng rules, chưa từng được test với
  project thật — xem §13 nợ #8); BG-01 vẫn **không** đo được nếu người dùng không bật sync;
  PII của bé giờ có thể nằm trên cloud nên phải có đường xoá (chưa có UI xoá dữ liệu).

### ADR-02 — Schema versioned + migration chain + sanitizer
- **Quyết định:** mỗi store mang `schemaVersion`; bump version ⇒ thêm hàm migrate;
  đọc qua `readJSONObject` luôn parse-safe → migrate → sanitize → default.
- **Hệ quả:** đổi nội dung không phá tiến độ cũ (BG-06); test khoá hành vi
  (`tests/exam-fidelity.test.ts`, `tests/t18a-motivation.test.ts`). **Nợ:** một số migration
  là `{...raw}` (no-op) — cần ghi chú *vì sao* no-op, đã có comment trong source.

### ADR-03 — Engine chấm điểm, UI chỉ trình bày
- **Quyết định:** `answerCheck`, `competitionEngine`, `readingEngine`, `learningOS`,
  `decisionEngine` là chỗ duy nhất quyết định đúng/sai/mastery/readiness; component gọi
  và vẽ kết quả.
- **Hệ quả:** test chạy trong Node, không cần DOM; probe browser không bao giờ là nơi
  phát hiện logic sai. Đây là nguyên tắc #1 của `AGENTS.md`.

### ADR-04 — Không dùng AI để chấm điểm hay tính mastery
- **Quyết định:** mọi quyết định học tập là hàm thuần theo policy; AI chỉ có thể *viết nội
  dung* để con người duyệt, không được *chấm*.
- **Hệ quả:** hành vi giải thích được, không phụ thuộc mạng; **nợ:** sinh nội dung vẫn
  phải qua `contentValidator` + người đọc to.

### ADR-05 — Nội dung là code (TypeScript tĩnh), không phải JSON runtime
- **Quyết định:** `src/data/*.ts` (104 file) được import thẳng, có type, được test
  (`contentValidator`, `competitionQuality`).
- **Hệ quả:** sai một đáp án là đỏ test; nhưng mỗi lần mở rộng kho là một lần build,
  và kho lớn phải tách chunk (`math-bank`, `english-bank`).

### ADR-06 — Deterministic theo `(tier, seed)`, cấm `Math.random` trong data builder
- **Quyết định:** `seededRng`, `shuffleSeeded`, `pickDistinct`; `SEED_POLICY`
  [src/config/policy.ts:297](file:///D:/trithuc/kho-bau-tri-thuc/src/config/policy.ts#L297); xáo đề bằng `nonce`.
- **Hệ quả:** cùng seed ⇒ cùng đề ⇒ test/probe tái lập được, screenshot ổn định.
  Nút "chơi lại" không thành "đề mới vô hạn" ngoài ý muốn.

### ADR-07 — Tiêm precache manifest tại `writeBundle`
- **Bối cảnh:** `closeBundle` được gọi hai lần *trước khi* chunk được emit.
- **Quyết định:** `swPrecachePlugin().writeBundle` + cờ `injected`.
- **Hệ quả:** manifest precache đủ `/assets/*`; dev server (placeholder chưa thay) vẫn chạy.

### ADR-08 — Ngân sách bundle là gate, không là lời khuyên
- **Quyết định:** entry ≤ 600 kB chặn `verify`; 450 kB chỉ báo cáo. Script và test dùng
  chung `getBudgetReport()`.
- **Hệ quả:** áp lực phình entry bị nhìn thấy ngay. **Nợ:** đang 533.5 kB, cách mục tiêu
  ~84 kB; mọi bổ sung lớn vào entry phải kèm lý do.

### ADR-09 — Bất biến đăng ký trò chơi 4 nơi, khoá bằng test
- **Quyết định:** `GAMES_CATALOG` (dữ liệu thuần) + `GAME_REGISTRY` (lazy) +
  `LAUNCHABLE_GAME_IDS` + `qa/games.mjs → GAME_TITLES`; tên tiếng Việt khớp nhau.
- **Hệ quả:** không tồn tại "game trong catalog nhưng không mở được" hay ngược lại;
  thêm game là 4 thay đổi có chủ đích, có `kbt-scaffold` hỗ trợ (dry-run mặc định).

### ADR-10 — Âm thanh tổng hợp, không file media
- **Quyết định:** WebAudio + SpeechSynthesis; repo không chứa audio binary.
- **Hệ quả:** bundle nhẹ, offline chắc, không rủi ro bản quyền; **nợ:** chất lượng giọng
  phụ thuộc thiết bị (A-01), không "nhạc nền bản quyền" được.

### ADR-11 — 3D bằng CSS làm mặc định; WebGL chỉ được chấp nhận khi tách chunk lazy
- **Quyết định (sửa 2026-10-30):** mặc định vẫn là `perspective`/`preserve-3d` —
  `CotuongBoard3D.tsx` dùng CSS, không thêm dependency. Cờ vua 3D *được* dùng three.js
  (`Chess3DCanvas.tsx`, 652 dòng) vì cần picking bằng tia và hình khối thật, **với điều kiện**
  ở ADR-17: nằm sau `React.lazy` và trong chunk `three-vendor` riêng.
- **Hệ quả:** thiết bị yếu vẫn mở cờ tướng mượt; cờ vua 3D là trải nghiệm nặng hơn có chủ
  đích, trả giá 545.4 kB chỉ khi bé mở màn đó. **Nợ:** chưa có fallback 2D khi
  `requestAnimationFrame`/WebGL; nếu máy không tạo được context (tablet cũ, chế độ tiết kiệm
  pin) `Chess3DCanvas` gọi `onUnsupported` để `ChessGame` tự chuyển sang bàn 2D (T31).

### ADR-16 — Cloud sync là tuỳ chọn, không phải đường mặc định của dữ liệu
- **Bối cảnh:** Firebase vào repo từ một lane khác; nếu mặc định bật, mọi tiến độ của trẻ
  thành dữ liệu trên cloud mà phụ huynh không ra quyết định.
- **Lựa chọn:** (a) bật tự động cho mọi người dùng; (b) tắt hoàn toàn; (c) bật khi và chỉ khi
  người dùng đăng nhập Google qua `src/components/auth/AuthButton.tsx`.
- **Quyết định:** **(c)**. `CloudSyncManager` khởi tạo `status: 'offline'`, `user: null`;
  listener `kho_bau_storage_change` có `if (this.state.user)` trước khi hẹn giờ sync
  ([src/services/cloudSync.ts:37](file:///D:/trithuc/kho-bau-tri-thuc/src/services/cloudSync.ts#L37)).
  Hợp nhất kéo-về dùng `Math.max` cho sao/XP/chuỗi/vé và `Set` union cho bài đã học — chọn
  cực đại vì tiến độ học không bao giờ nên *giảm* do máy khác đồng bộ tới.
- **Hệ quả:** giữ được lời hứa "không có backend cũng dùng trọn vẹn" (QA offline vẫn xanh);
  có đường thoát cho ai lo ngại về quyền riêng tư. **Nợ:** `firebase-applet-config.json` nằm trong repo — API key
  web là public theo thiết kế của Firebase và `firestore.rules` là chỗ chặn, nhưng repo **không
  được** nhận thêm secret nào khác; chưa có test end-to-end với project Firebase thật
  (`tests/firebase-auth-sync.test.ts` dùng mock); chưa có UI xoá dữ liệu trên cloud.

### ADR-17 — Mọi dependency >200 kB phải nằm trong chunk lazy, không nằm trên đường tải tiên phong
- **Quyết định:** `vite.config.ts` `manualChunks` trả `three-vendor` cho `node_modules/three`
  và `firebase-vendor` cho `firebase`/`@firebase`; màn dùng chúng luôn được `React.lazy`
  (`App.tsx:18` cho ChessScreen). Gate `check:budget` chỉ đo **entry**, nên nếu ai đó import
  thẳng three.js vào `App.tsx`, entry nhảy ~1.0 MB và gate đỏ ngay.
- **Hệ quả:** entry giữ 533.6 kB (< 600 kB) dù tổng build có thêm ~1.08 MB vendor mới;
  người mở cờ vua/đăng nhập trả chi phí tải thêm, người không mở thì không. **Nợ:** ngân sách
  chỉ áp dụng cho entry — chưa có ngưỡng tổng cho từng vendor chunk, và `sw-precache` giờ
  precache cả `three-vendor` (tăng dung lượng cache trên thiết bị yếu).

### ADR-12 — `test:ci` thay `npm test` trong tự động hoá
- **Bối cảnh:** `posttest` → `scripts/audit-snapshot.mjs` ghi `docs/audit-state.json`
  và nối `docs/AUDIT_REPORT.md`.
- **Quyết định:** CI/hook dùng `test:ci` (`vitest run` thuần).
- **Hệ quả:** diff sạch, CI không vô tình nối báo cáo audit; muốn cập nhật audit thì chạy `npm test` một cách có ý thức.

### ADR-13 — Trunk-based + PR + squash + tag `vX.Y.Z`, không deploy provider
- **Quyết định:** `feature/<issue>-<slug>` → PR → CI xanh → squash merge; release là
  artifact `dist/` zip, người dùng tự phục vụ.
- **Hệ quả:** không secret, không credential trong CI (ADR theo đúng phạm vi đã chốt).
  Ngoại lệ duy nhất: `firebase-applet-config.json` (API key web Firebase — public theo thiết
  kế, được `firestore.rules` khống chế); **không** thêm service account / key server nào vào
  repo hay vào workflow. **Nợ:** chưa có URL công khai để QA trên môi trường thật.

### ADR-14 — MCP zero-dependency, tự viết stdio JSON-RPC
- **Quyết định:** `mcp/lib/server.mjs` tự triển khai newline-delimited JSON-RPC 2.0
  (versions 2025-06-18 / 2025-03-26 / 2024-11-05); stdout giữ sạch bằng cách chuyển
  log sang stderr; 5 server / 27 tool.
- **Hệ quả:** không thêm package, không lockfile churn; `kbt-progress` chỉ đọc
  `progress/` (gitignored) và mặc định che PII. **Nợ:** không có client kiểm thử protocol
  ngoài `mcp/devclient.mjs`.

### ADR-15 — Kid's Box: không bịa nội dung giáo trình
- **Quyết định:** `KIDBOX_MAPPED_UNITS = []` + `KIDBOX_REQUIRED_ARTIFACTS` 7 nhóm; UI liệt
  kê đúng những gì cần bổ sung (`CONTENT_SOURCE_REQUIRED`).
- **Hệ quả:** track Anh vẫn chạy được (voice, hoạt động tổng hợp, cầu nối) mà không
  giả danh giáo trình; **nợ:** tính năng chưa hoàn chỉnh cho tới khi có nguồn đã xác minh.

---

## 12. Kiểm kê kiến trúc (đo 2026-10-31, sau vòng sửa bug T26/T27, audit UI T28, làm mượt luồng học T29, độ dày quân cờ T30 và vòng soát bug T31)

| Hạng | Số | Nguồn |
|---|---|---|
| Component `.tsx` | 95 trong 19 thư mục tính năng | `find src/components -name '*.tsx' \| wc -l` |
| Service module | 39 | `ls src/services/*.ts \| wc -l` |
| File dữ liệu | 104 | `find src/data -name '*.ts' \| wc -l` |
| Module type | 8 | `ls src/types/*.ts \| wc -l` |
| Hook | 4 | `ls src/hooks/*.ts \| wc -l` |
| Màn hình (`ActiveScreen`) | 17 | `src/types/index.ts:254` |
| Trò chơi (đủ 4 nơi) | 31 | `GAMES_CATALOG` = `GAME_REGISTRY` = `LAUNCHABLE_GAME_IDS` = `GAME_TITLES` |
| Export policy | 17 (693 dòng) | `src/config/policy.ts` |
| Key `localStorage` | 17 | `STORAGE_KEYS` (16) + key cục bộ IOE (1) |
| Dependency runtime | 8 | `package.json` → `dependencies` |
| Test file / test | 77 / 1091 | `npx vitest run` (75 `.ts` + 2 `.tsx`) |
| Probe QA | 26 (25 `.mjs` + 1 `.cjs`) | `ls qa/*.mjs qa/*.cjs` (trừ `lib.mjs`, `run-one.mjs`) |
| Workflow CI | 4 | `.github/workflows/` |
| MCP server / tool | 5 / 27 | `mcp/` |
| Main chunk | 533.5 kB | `npm run check:budget` |
| Vendor chunk lớn nhất | `three-vendor` 545.4 kB · `firebase-vendor` 537.9 kB · `react-vendor` 213.6 kB | `npm run check:budget` |
| `App.tsx` / `storage.ts` / `learningOS.ts` / `competitionEngine.ts` / `readingEngine.ts` / `cloudSync.ts` / `firebase.ts` | 436 / 2426 / 842 / 747 / 647 / 224 / 85 dòng | `wc -l` |

---

## 13. Nợ kỹ thuật đã ghi nhận (không chặn phát hành)

| # | Nợ | Ảnh hưởng | Hướng xử lý |
|---|---|---|---|
| 1 | `kho_bau_ioe_store` ngoài `STORAGE_KEYS`, đọc/ghi trực tiếp `localStorage` | thoát khỏi pipeline sanitize; dễ lệch kiểm kê | đưa về registry + `readJSONObject`, thêm test đếm đủ 17 key |
| 2 | Entry chunk 533.5 kB so với mục tiêu 450 kB | thiết bị yếu tải chậm hơn mức mong muốn | đo lại sau mỗi mở rộng kho; cân nhắc tách bank Tiếng Việt |
| 3 | Kid's Box units = 0 | track Anh chưa dùng được như giáo trình | cần nguồn đã xác minh (FR-N04, ADR-15) |
| 4 | Chưa audit riêng track Kid's Box với trẻ thật | rủi ro trải nghiệm | audit người dùng thật trước khi quảng bá track |
| 5 | `bun.lock` còn trong repo trong khi npm là nguồn thật | gây nhầm package manager | giữ nguyên + ghi chú (quyết định đã chốt) |
| 6 | Probe deep-flow thỉnh thoảng đỏ do timing | nhiễu tín hiệu QA | chạy lại 1 lần, dán `errors[]` + `failedAt` (AGENTS.md §1.3) |
| 8 | `@types/three` nằm trong `dependencies` thay vì `devDependencies` | lệch kiểm kê "8 dependency runtime", dễ bị hiểu là package runtime | chuyển sang `devDependencies` (một dòng `package.json` + `package-lock.json`); phát sinh từ commit của lane khác, cần người duyệt vì đụng dependency |
| 9 | Cloud sync mới test bằng mock (`tests/firebase-auth-sync.test.ts`); GET cross-origin đi qua stale-while-revalidate của `public/sw.js:185` | chưa chứng minh hành xử với project Firebase thật và lúc offline; nguy cơ nhận response cũ từ `firestore.googleapis.com` | smoke test có tài khoản thật + cân nhắc loại `firestore.googleapis.com`/`*.googleapis.com` khỏi nhánh cache cross-origin |
| 10 | `npm install` báo 4 lỗ hổng severity cao | rủi ro chuỗi cung ứng ở dev/vendor deps | `npm audit` có chủ đích, đọc từng advisory trước khi nâng cấp (không tự ý downgrade) |

---

## 14. Đọc tiếp

- Yêu cầu: [`SRS.md`](SRS.md) · Nghiệp vụ: [`BRD.md`](BRD.md) · Truy vết: [`RTM.md`](RTM.md)
- Kế hoạch task: [`../plan/TASK_PLAN.md`](../plan/TASK_PLAN.md) · Kế hoạch test: [`../plan/TEST_PLAN.md`](../plan/TEST_PLAN.md)
- Quy trình: [`../SDLC.md`](../SDLC.md) · MCP: [`../../mcp/README.md`](../../mcp/README.md)
