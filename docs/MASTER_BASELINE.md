# MASTER BASELINE — KHO BÁU TRI THỨC LỚP 1

> Ngày chạy: 2026-10-05 · Node v24.12.0 · npm 11.6.2 · Windows
> Lệnh chuẩn: `npm ci` → `npm run typecheck` → `npm test` → `npm run build` → `npm run preview`

## 1. Trạng thái BASELINE khi bắt đầu (TRƯỚC khi sửa)

| Gate | Kết quả | Ghi chú |
|---|---|---|
| `npm install` | **FAIL** | `ERESOLVE`: `esbuild@^0.25` (devDep) xung đột peer `esbuild@^0.27 \|\| ^0.28` của `vite@8.3.2` |
| `npm run typecheck` | **FAIL** | `src/services/storage.ts(432,20): TS2339 Property 'recordLearningEvidence' does not exist on type 'typeof StorageService'` |
| `npm test` | **FAIL** | 3 failed / 38 total — `TypeError: StorageService.recordLearningEvidence is not a function` |
| `npm run build` | PASS (chưa dùng được) | Build xanh nhưng app **crash ngay lần trả lời đầu tiên** |
| Google AI Studio | **FAIL** | Không cài được trong môi trường sạch vì lỗi install ở trên |

### Ba lỗi P0 gốc rễ phát hiện ở baseline

1. **P0 — App sập mỗi lần trả lời câu hỏi.**
   `StorageService.recordQuestionAnswer()` gọi `StorageService.recordLearningEvidence(...)` nhưng hàm đó
   **chưa từng được định nghĩa**. Mỗi lần bé bấm "Kiểm tra" là một `TypeError`: đáp án không được ghi,
   mastery không cập nhật, evidence không sinh. Đây là lỗi chặn toàn bộ Learning Engine.

2. **P0 — Không cài được trong môi trường sạch.**
   Xung đột peer dependency `esbuild`. Ngoài ra còn 8 gói không dùng: `@google/genai`, `express`,
   `dotenv`, `motion`, `tsx`, `autoprefixer`, `esbuild`, `@types/express`.

3. **P0 — Auto-submit khi hết giờ xoá sạch đáp án.**
   `CompetitionExamModal` tạo `setInterval` trong `useEffect` với deps `[isOpen, blueprint, questions]`.
   Callback đóng trên `userAnswers` của render đầu tiên (luôn là `{}`). Khi hết giờ,
   `handleFinalSubmit(true)` chạy với **mọi câu đều chưa trả lời** → điểm 0 dù bé đã làm đúng.

## 2. Trạng thái sau khi xử lý

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| `npm ci` (clean room) | **PASS** | xoá `node_modules` + `dist`, `npm ci` → 62 packages, 32s |
| `npm run typecheck` | **PASS** | `tsc --noEmit`, 0 error |
| `npm test` | **PASS** | **241/241**, 17 file |
| `npm run build` | **PASS** | `dist/assets/index-*.js` 450.78 kB (gzip 131.09 kB) |
| `npm run preview` | **PASS** | HTTP 200, golden path 0 error |
| `npm run dev` | **PASS** | HTTP 200, persistence đo thực tế đúng |
| Google AI Studio | **PASS** | xem `docs/P32_GOOGLE_AI_STUDIO.md` |

## 3. Kiến trúc sau khi audit

```
Browser (100% client-side, local-first)
├── React 19 + Vite 8 + Tailwind 4
├── src/services/            ← DOMAIN ENGINE (nguồn sự thật)
│   ├── learningOS.ts        reduceEvidence · getNextBestActions · generateDailyPlan · explainRecommendation
│   ├── readingEngine.ts     READING FLUENCY ENGINE (mới, P27.5)
│   ├── competitionEngine.ts assemble · gradeAnswer · scoreSession · assessReadiness
│   ├── adaptive.ts          daily review + parent report + reading report
│   ├── contentValidator.ts  audit + coverage matrix (mới, P29)
│   └── storage.ts           persistence: versioned · migrated · sanitized · idempotent
├── src/config/policy.ts     ← MỌI magic number nằm ở đây, có rationale + test
├── src/data/                curriculum · competition · reading content (dữ liệu gốc, không sao chép)
└── src/components/          chỉ RENDER domain state, không tự tính điểm/mastery
```

**Nguyên tắc bất di bất dịch (§1.3):** UI không bao giờ tự quyết định correctness/score/mastery.
`CompetitionEngine.gradeAnswer()` và `LearningOS.reduceEvidence()` là nơi duy nhất ra phán quyết.

## 4. Bundle

| Mốc | Main chunk | gzip |
|---|---|---|
| Trước P31 | 629.60 kB | 169.20 kB |
| Sau code splitting | 450.78 kB | 131.09 kB |

Các màn hình nặng (games, competition, reading, parent, shop) được `React.lazy` tách riêng,
tải khi trẻ thực sự mở tới.

## 5. Ma trận test (241 test)

| File | Test | Phạm vi |
|---|---|---|
| `reading-fluency.test.ts` | 22 | Taxonomy, ladder gating, fairness, metrics, persistence |
| `exam-fidelity.test.ts` | 36 | Seeded determinism, 7 dạng bài, scoring, idempotency, migration |
| `personas-and-learning-os.test.ts` | 19 | Persona A–F, Learning OS, adaptive review |
| `content-quality.test.ts` | 16 | Validator 0 error, coverage matrix, blueprint |
| `learning-engine.test.ts` | 9 | Persistence, reward idempotency, parent report |
| `competition-engine.test.ts` | 6 | Assembly, speed fairness, error analysis |
| `competition-readiness.test.ts` | 5 | Readiness, exam idempotency, reset |
| `competition-bank.test.ts` | 8 | Bank + blueprint quality gate, **mọi answer key phải chấm đúng qua engine thật** |
| `math-curriculum.test.ts` | 4 | Tính đúng của phép tính |
| `vietnamese-curriculum.test.ts` | 4 | Dấu thanh, chính tả, thứ tự câu |
| `english-curriculum.test.ts` | 3 | Audio prompt, phonics |
| `parent-and-demo.test.ts` | 4 | Parent mode, demo data, avatar shop |
| `pwa.test.ts` | 20 | Ma trận hỗ trợ PWA, hợp đồng SW, icon PNG, broadcast SW_UPDATED |
| `question-audio-routing.test.ts` | 22 | Canonical question text, chống leak đáp án |
| `parent-and-demo.test.ts` | 5 | Parent mode, demo data, avatar shop, migration questionAutoplay |

## 6. QA trình duyệt thật (`qa/`)

| Script | Kết quả |
|---|---|
| `qa/golden-path.mjs` | **0 error** trên production build (chạy 2 lần) |
| `qa/responsive-a11y.mjs` | **0 error** ở cả 6 viewport |
| `qa/games.mjs` | **0 error** — 14/14 game |
| `qa/focus.mjs` | **0 error** — 3 hộp thoại |
| `qa/offline-pwa.mjs` | **0 error** — tắt mạng vẫn học được |

Xem `docs/P33_FINAL_CERTIFICATION.md` để biết chi tiết từng bước đã kiểm chứng.

## 7. Ghi chú về môi trường

- **Không cần API key.** Ứng dụng không có AI provider, không có server. `metadata.json`
  khai báo `majorCapabilities: []` và `.env.example` ghi rõ không có biến bắt buộc.
- **Không phụ thuộc đường dẫn máy.** Đã loại bỏ `__dirname` trong `vite.config.ts`
  (thay bằng `import.meta.dirname`) và script `clean` không dùng `rm -rf` của Unix.
- **Node >= 20.19** khai báo trong `engines` (khớp peer của Vite 8).
