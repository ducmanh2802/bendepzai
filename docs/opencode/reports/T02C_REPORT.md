# T02C_REPORT — Hạ tầng cho nội dung lớn (dung lượng, offline, validator)

- Nhánh: `p42/T02C` (giữ nguyên, không tạo/chuyển/merge/push)
- Ngày: 2026-10-14 · Chạy UNATTENDED (auto-runner), mọi quyết định do agent tự đưa ra.
- Task: `docs/opencode/queue/03_T02C_ha_tang_noi_dung_lon.md` (bản chính thức, không có spec gốc riêng).

## 1. Đã làm gì (6/6 mục phạm vi)

1. **Tách import nặng khỏi đường khởi động**
   - `src/services/storage.ts`: xoá import tĩnh `CompetitionEngine`, `ReadingEngine`,
     `getBlueprintById`. `getReadingProfile()`/sanitizer dùng `createEmptyReadingProfile()`
     từ module mới `src/services/readingDefaults.ts` (không import data/engine).
   - `seedDemoProfile()` chuyển nguyên vẹn sang `src/services/demoSeed.ts`
     (giữ seed `20250101`, giữ logic CompetitionEngine thật). API đồng bộ giữ nguyên
     chữ ký; 2 test + `ParentDashboardModal` (đã là lazy chunk) chuyển sang import mới.
   - `src/data/readingTaxonomy.ts` mới: tách `READING_SKILLS` + `getReadingSkillById`
     khỏi `readingContent.ts` (~38 kB); `readingContent.ts` re-export để code cũ/test cũ
     không vỡ; `adaptive.ts` (dùng bởi `DailyReviewScreen` ở chunk chính) chỉ import taxonomy.
   - `NextBestActionCard` (Home): `DecisionEngine` chuyển sang `import()` động sau first paint,
     có skeleton `data-testid="decision-engine-loading"`, lỗi load thì ẩn lặng
     (thẻ gợi ý, không bao giờ chặn bé học). Mọi `data-testid` QA giữ nguyên.
2. **Chia chunk**: `vite.config.ts` → `build.rolldownOptions.output.manualChunks`
   nhóm `react-vendor`. Thêm `npm run check:budget` (`scripts/check-bundle-budget.mjs`):
   FAIL khi chunk chính > 600 kB.
3. **Service worker**: `public/sw.js` dùng một cache `kho-bau-v3`, placeholder
   `__PRECACHE_MANIFEST__` được plugin build (`closeBundle`) thay bằng danh sách thật
   qua `scripts/sw-precache.mjs` (mọi JS/CSS chunk + fonts + icons + shell).
   Giữ nguyên: network-first navigation, SWR assets, xoá cache cũ khi activate,
   guard `controller` T01B/7, broadcast `SW_UPDATED`, không chạm localStorage.
4. **Validator** (`src/services/contentValidator.ts`): tokenize mỗi prompt đúng 1 lần;
   chỉ so trong cùng `subject::skillId`; **giữ dấu tiếng Việt** (`má ≠ mà`, `ăn ≠ ân`,
   NFC + lowercase + gộp khoảng trắng); giữ nguyên ngưỡng ERROR 0,9 / WARNING 0,75.
   Thêm chỉ mục nghịch đảo + chặn trên tỉ lệ độ dài; xuất hàm `findNearDuplicates`,
   `tokenizeForDuplicateCheck`, `jaccardSimilaritySets` để test trực tiếp.
5. **Test đếm cứng** → `toBeGreaterThanOrEqual`: `vietnamese-curriculum.test.ts` (12),
   `english-curriculum.test.ts` (11). Đồng thời sửa 2 test mà task bắt phải sửa:
   `content-quality.test.ts` (giữ dấu thay vì strip dấu — audit 2 xác nhận strip dấu là bug),
   `pwa.test.ts` (precache manifest build-generated thay vì “không precache bundle”).
6. **`docs/CONTENT_GUIDE.md`**: quy ước unit-file/index, id `vn-/math-/eng-/life-`,
   trường `calc: { a, op, b }` cho câu số học, chống trùng đề, `contentSafety.ts`,
   NFC + British English + Kid's Box 1, lệnh kiểm tra, checklist PR.

## 2. File thay đổi

- Sửa: `package.json` (+script `check:budget`), `vite.config.ts`, `public/sw.js`,
  `src/services/storage.ts`, `src/services/contentValidator.ts`,
  `src/services/readingEngine.ts` (uỷ quyền `emptyProfile`/`gateForStage`),
  `src/services/adaptive.ts`, `src/data/readingContent.ts`,
  `src/components/learning/NextBestActionCard.tsx`,
  `src/components/parent/ParentDashboardModal.tsx`,
  `tests/content-quality.test.ts`, `tests/pwa.test.ts`,
  `tests/vietnamese-curriculum.test.ts`, `tests/english-curriculum.test.ts`,
  `tests/competition-readiness.test.ts`, `tests/parent-and-demo.test.ts`.
- Mới: `src/data/readingTaxonomy.ts`, `src/services/readingDefaults.ts`,
  `src/services/demoSeed.ts`, `scripts/sw-precache.mjs`,
  `scripts/check-bundle-budget.mjs`, `docs/CONTENT_GUIDE.md`,
  `tests/content-validator-t02c.test.ts`, `tests/bundle-budget.test.ts`,
  `tests/sw-precache.test.ts`, `tests/t02c-startup-split.test.ts` (guard hồi quy split).
- Không đụng: `docs/opencode/queue|state|logs`, `TRANG_THAI.md`.

## 3. Số liệu trước/sau

| Chỉ số | Trước | Sau |
|---|---|---|
| Chunk chính `index-*.js` | **727,1 kB** | **253,1 kB** (đĩa 247,1 kB; gzip 67,8 kB) — **đạt mục tiêu ≤ 450 kB** |
| `react-vendor-*.js` (mới) | — | 218,8 kB (cache riêng, tải 1 lần) |
| competition bank+engine | trong chunk chính (~123 kB) | chunk async `competitionEngine-*.js` 153,9 kB (chỉ tải khi mở Đấu Trường/demo) |
| Kid's Box/decision | trong chunk chính (~50 kB) | `kidBoxEngine` 50,9 kB + `decisionEngine` 24,9 kB async |
| Validator bank thật (155+435+48=638 câu) | **~1.679 ms**, 0 ERROR / 32 WARNING | **~35 ms**, 0 ERROR / 22 WARNING |
| Quét 2.000 câu tổng hợp | (~16–21 s theo mô hình cũ) | **~56 ms** — **đạt < 5 s** |
| Test suite | 504 pass / 31 files | **523 pass / 35 files** |
| QA offline `qa/offline-pwa.mjs` | — | **PASS, 0 errors** (SW active, 26 assets cached, render + trả lời offline OK, mất cache vẫn giữ XP) |

WARNING 32→22: 10 cảnh báo biến mất là các cặp ngoài-cùng-skill và cặp chỉ trùng khi
bỏ dấu (false positive đúng như audit 2 mô tả); gate 0-curriculum-warning (P41) vẫn xanh.

## 4. Lệnh đã chạy + kết quả

- `npm run typecheck` → PASS (sửa 1 lỗi `getReadingSkillById` sau tách file; sửa
  `manualChunks` object→function theo yêu cầu Rolldown).
- `npm test` → **35 files / 523 tests PASS** (15,0 s).
- `npm run build` → PASS, không còn cảnh báo chunk > 500 kB.
- `npm run check:budget` → PASS (247,1 kB, meets 450 kB goal).
- `node qa/run-one.mjs qa/offline-pwa.mjs` → PASS, `"errors": []`.
- Kiểm tra dist: `dist/sw.js` hết placeholder, precache 48 URLs (shell, main, vendor,
  fonts, CSS, icons).

## 5. Quyết định tự đưa ra (unattended)

1. **Không đổi API nào sang async**: `seedDemoProfile` giữ sync trong module riêng;
   `DecisionEngine.decide()` giữ sync, chỉ điểm gọi ở Home chuyển async — ít rủi ro nhất.
2. **Giữ curriculum trong chunk chính**: `SubjectScreen` cần ngay ở first paint;
   phần thắng lớn (competition/reading/KidBox) đã tách xong, mục tiêu 450 kB đạt.
3. **Test budget dùng `it.runIf(dist)`**: `npm test` chạy trước `npm run build` nên dist
   có thể cũ; gate cứng nằm ở `npm run check:budget` sau build. Ghi rõ trong GUIDE.
4. **Sửa (không xoá) 2 test mâu thuẫn task**: strip-dấu và “không precache bundle”
   là hành vi cũ mà task/audit 2 tuyên bố là bug → cập nhật assertion + ghi lý do.
5. Trường `calc` chỉ áp cho nội dung mới (T10–T14); **không retrofit** 155 câu cũ
   (test số học regex hiện tại vẫn bao phủ, tránh churn).

## 6. Việc còn tồn

- `tests/content-quality.test.ts` (“never has two semantically duplicated prompts”)
  vẫn quét toàn cục O(n²) trong test — OK ở ~435 câu, nên chuyển sang
  `findNearDuplicates` khi bank vượt ~1.500 câu.
- Curriculum (~84 kB) vẫn trong chunk chính; nếu T10–T14 đẩy bank lên ~700 kB dữ liệu,
  cân nhắc lazy `SubjectScreen` hoặc import unit theo môn.
- Trình duyệt thật chỉ kiểm offline-pwa (best-effort theo luật); các probe QA khác
  (decision-engine, games…) dành cho task QA sau.
