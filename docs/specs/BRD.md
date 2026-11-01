# BRD — Tài liệu Yêu cầu Nghiệp vụ
## Kho Báu Tri Thức — Lớp 1

**ID tài liệu:** KBT-BRD-1.1 · **Ngày:** 2026-10-29, đo lại 2026-10-30 sau merge `origin/main` · **Trạng thái:** Draft để phụ huynh/kỹ sư rà soát
**Tài liệu liên quan:** [SRS](SRS.md) · [ARCHITECTURE](ARCHITECTURE.md) · [RTM](RTM.md) ·
[plan/TASK_PLAN](../plan/TASK_PLAN.md) · [plan/TEST_PLAN](../plan/TEST_PLAN.md) ·
[`docs/PRODUCT_SPEC.md`](../PRODUCT_SPEC.md) (nguyên bản, đã cũ ở phần đếm trò chơi) ·
[`docs/MASTER_ROADMAP.md`](../MASTER_ROADMAP.md)

> Quy ước: số liệu có dấu ✚ là **đo trực tiếp từ repo** (đợt đo gần nhất 2026-10-30, xem phụ lục A).
> Tài liệu này mô tả *nghĩa vụ nghiệp vụ*, không mô tả cài đặt. Cài đặt ở SRS/ARCHITECTURE.

---

## 1. Vấn đề nghiệp vụ

Gia đình có con lớp 1 (6–7 tuổi) ở Việt Nam cần một công cụ để:

| Nỗi đau | Hệ quả hiện tại | Sản phẩm này làm gì |
|---|---|---|
| Chương trình GDPT 2018 lớp 1 nặng về Tiếng Việt (âm–vần–thanh) và Toán (đếm, cộng trừ phạm vi 100) | Phụ huynh tự soạn đề, không biết con hổng kỹ năng nào | Ngân hàng bài học + câu hỏi theo **từng kỹ năng có ID**, có diagnostic |
| Bé chưa thạo chữ, không tự làm bài được | Bé phải có người lớn kèm từng câu | **Mọi câu hỏi đều đọc to được** (Web Speech), thao tác chạm đơn giản |
| App học trên mạng chậm, lớp 1 không nên dùng thiết bị online lâu | Trải nghiệm gián đoạn, rủi ro nội dung bên ngoài | **PWA 100% offline**, không API lúc chạy, không quảng cáo, không chat |
| Không có dấu vết tiến bộ để nói chuyện với giáo viên | Đánh giá theo cảm tính | Báo cáo chẩn đoán sư phạm + **xuất file JSON** cho phụ huynh |
| App ngoại (Kid's Box…) không khớp chương trình Anh ở trung tâm | Bé học hai luồng lệch nhau | Track **Kid's Box New Generation 1, en-GB** chạy song song |

**Ai trả tiền / ai quyết định:** phụ huynh là người quyết định dùng; không có mô hình thu
phí. Vì vậy mọi ràng buộc nghiệp vụ nghiêng về *niềm tin* (an toàn trẻ em, không dữ liệu
đi ra ngoài) thay vì *chuyển đổi tăng trưởng*.

---

## 2. Mục tiêu nghiệp vụ & thước đo

| ID | Mục tiêu | Thước đo | Ngưỡng chấp nhận | Hiện trạng (2026-10-31) |
|---|---|---|---|---|
| BG-01 | Bé tự học 15–20 phút/ngày không cần người lớn | % phiên bé hoàn thành độc lập | ≥ 70% | Chưa có số liệu thật (dữ liệu nằm `localStorage`; cloud-sync là tuỳ chọn nên vẫn không có aggregate server-side — mới có fixture + demo seed) |
| BG-02 | Chỉ rõ điểm yếu theo kỹ năng, không chỉ điểm tổng | Số kỹ năng có `mastery` đo được | ≥ 26 kỹ năng thi | ✚ 26 kỹ năng taxonomy, kho thi phủ đủ 26/26; trạng thái kỹ năng lưu ở key `kho_bau_learning_os_store` |
| BG-03 | Không gây nhầm lẫn nội dung (sai đáp án, sai dấu, sai kiến thức) | Lỗi nội dung P0/P1 còn tồn tại | = 0 | ✚ `contentValidator` + `BANNED_WORDS`; P42/T20B đã xoá 18 WARNING |
| BG-04 | Dùng được trên điện thoại gia đình, offline | Probe QA trên build thật | 0 lỗi console, 0 tràn ở 390px | ✚ 27 probe Playwright, `qa/mobile-golden.mjs` @390/@195px |
| BG-05 | Phụ huynh tin tưởng về dữ liệu của con | Dữ liệu rời máy? | Không, trừ khi phụ huynh tự xuất **hoặc tự bật sync** | ✚ Mặc định chỉ localStorage; `CloudSyncService` ở `status: 'offline'` cho tới khi người lớn đăng nhập Google ([src/services/cloudSync.ts:37](file:///D:/trithuc/kho-bau-tri-thuc/src/services/cloudSync.ts#L37), `firestore.rules` chắn chéo tài khoản) |
| BG-06 | Đổi mới nội dung không phá tiến độ cũ | Migration + sanitizer có test | 100% bước migration có test | ✚ chuỗi `MIGRATIONS` P29-v2 → P42-v3 trong `src/services/storage.ts` |

**Không phải mục tiêu:** xếp hạng giữa các bé, kiếm tiền, bắt trẻ tạo tài khoản, cloud-sync
mặc định, GPU/3D nặng ngoài màn cờ vua.

---

## 3. Người dùng & nhu cầu

| Vai trò | Nhu cầu cốt lõi | Quyền hạn | Bằng chứng trong sản phẩm |
|---|---|---|---|
| Bé 6–7 tuổi | Nút to, giọng đọc, phản hồi vui, không bị mắng | Học, chơi, nhận thưởng | `src/components/home|world|subject|learning|games|reading|competition` |
| Phụ huynh | Biết con đang ở đâu, giới hạn thời gian, sao lưu/đặt lại | Parent Gate (phép tính 2 chữ số) rồi mới vào | `src/components/parent/ParentDashboardModal.tsx`, `docs/PARENT_MODE.md` |
| Giáo viên / trung tâm (thụ động) | Nhận báo cáo, chọn unit ôn ở nhà | Xem + nhận file JSON | nút "Xuất file (.json)", gói "Ôn ở nhà" Kid's Box |
| Người vận hành / kỹ sư | Một cổng kiểm tra duy nhất, không phá sản phẩm khi sửa nội dung | Toàn quyền repo | `npm run verify`, hooks, 4 workflow CI, MCP `mcp/` |
| Agent AI (người sửa hộ) | Biết rule của repo mà không phải đoán | Theo `AGENTS.md` | `AGENTS.md`, `docs/SDLC.md`, 5 MCP server |

---

## 4. Phạm vi

### 4.1 Trong phạm vi (bản 1.x đang chạy)

- **4 môn học**: Tiếng Việt · Toán · Tiếng Anh · Em & Cuộc sống, tổ chức
  chủ đề → bài → câu hỏi, mỗi câu gắn `skillId`.
- **Luyện đọc** có bậc thang 5 tầng (ACCURACY → FLUENCY → COMPREHENSION →
  PROCESSING_SPEED → COMPETITION_SPEED) và phụ huynh chấm 😀/😐/🙁.
- **Thi thử (Competition Engine)**: blueprint có phân phối điểm số, 7 dạng câu hỏi,
  phân tích sai theo nguyên nhân, đánh giá độ sẵn sàng.
- **✚ 31 trò chơi** trong Games Hub (mỗi trò 6 bậc độ khó, deterministic theo seed):
  Tiếng Việt 9 · Toán 10 · Tiếng Anh 5 · Logic & Khoa học 2 · Giải trí trí tuệ 5.
- **Learning OS + Decision Engine**: bằng chứng từng lượt trả lời → `mastery`/level
  L1–L5 → hành động kế tiếp (Next Best Action) → kế hoạch ngày.
- **Động lực**: XP, sao, sticker, shop, quest ngày, streak + khiên giữ chuỗi, cây tri thức.
- **Praise Engine** + giọng đọc tiếng Việt/en-GB, âm thanh tổng hợp bằng WebAudio
  (không file mp3 tải ngoài → không gãy link khi offline, không rủi ro bản quyền).
- **Parent Mode**: screen time, xuất/nạp/đặt lại dữ liệu, banner dữ liệu mẫu.
- **PWA offline-first**: manifest + service worker precache toàn bộ build.
- Module **Cờ tướng** (`docs/cotuong.md`) để rèn tư duy, bàn cờ 3D bằng CSS.
- Module **Cờ vua** với bàn 3D WebGL thật (three.js) — chấp nhận từ 2026-10-30 vì nó nằm
  sau `React.lazy` trong chunk `three-vendor`, entry không phình (FR-C06, ADR-17).

### 4.2 Ngoài phạm vi (cố ý)

| Không làm | Lý do |
|---|---|
| Bắt buộc tài khoản, đồng bộ mặc định, backend riêng | App phải dùng trọn vẹn khi chưa đăng nhập. `firebase.ts`/`cloudSync.ts` chỉ là **mirror tuỳ chọn** sau khi người lớn tự đăng nhập Google (FR-Y08/Y09, ADR-16); thêm đường ra mặc định là phá cam kết offline và tăng rủi ro dữ liệu trẻ |
| Quảng cáo, IAP, loot box | `docs/SAFETY_PRIVACY.md` §1 — sao/XP/vé chỉ đến từ học thật |
| Chat, leaderboard thật, tiếp xúc người lạ | An toàn trẻ em |
| Chấm điểm phát âm | Chỉ ghi `speech recognition match` / `self-check` (`SPEECH_REPORTING_POLICY`) |
| WebGL cho mọi thứ ngoài màn cờ vua | Ngân sách bundle và thiết bị trường học yếu; 3D khác dùng CSS (`CotuongBoard3D.tsx`) |
| Bịa nội dung Kid's Box | Ô unit giáo trình đánh dấu `CONTENT_SOURCE_REQUIRED`; repo liệt kê 7 nhóm tài liệu cần người lớn cung cấp |
| Deploy provider trong CI | Pipeline dừng ở artifact + GitHub Release (`docs/SDLC.md` §8) |

---

## 5. Ràng buộc nghiệp vụ

1. **AN-01** — Không thu thập dữ liệu cá nhân nhạy cảm (SĐT, GPS, email, trường học).
2. **AN-02** — Không nhãn tiêu cực cho trẻ: không "chậm", "kém", "yếu", "thua".
3. **AN-03** — Không sai kiến thức: số phạm vi lớp 1, cộng/trừ **không nhớ**, dấu theo
   SGK hiện hành (hoà, khoẻ, thuỷ), chuẩn NFC.
4. **AN-04** — Không nói dối số liệu: dữ liệu mẫu phải mang cờ `isDemoData` và in banner.
5. **KT-01** — Không thêm dependency mà không hỏi; ưu tiên tự viết SVG/CSS.
6. **KT-02** — Mọi ngưỡng sư phạm nằm trong `src/config/policy.ts`, có rationale, có test.
7. **KT-03** — UI không được quyết định điểm/mastery/readiness.
8. **PL-01** — Không push thẳng `main`; PR squash-merge sau khi CI xanh.
9. **PY-01** — Không commit/đẩy dữ liệu tiến độ thật của bé (`progress/` đã `.gitignore`).

---

## 6. Rủi ro nghiệp vụ

| ID | Rủi ro | Xác suất | Tác động | Giảm thiểu đang có |
|---|---|---|---|---|
| R-01 | Nội dung sai nhưng test vẫn xanh (test chỉ đếm số câu) | Trung bình | Cao — mất niềm tin phụ huynh | `contentValidator` + probe `qa/p41-curriculum-quality.mjs`; **người lớn phải đọc to** (SDLC §8) |
| R-02 | App chạy offline nhưng người dùng tưởng có tài khoản/đám mây (hoặc ngược lại: tưởng không có gì rời máy trong khi đã bật sync) | Trung bình | Trung bình | Sync **không** bật mặc định (`status: 'offline'` tới khi đăng nhập); `AuthButton`/`CloudSyncBanner` hiển thị trạng thái thật; parent mode vẫn chỉ "xuất file" là đường mặc định |
| R-03 | Track Kid's Box dùng khi chưa có nguồn chuẩn | **Cao** | Cao | Đánh dấu `CONTENT_SOURCE_REQUIRED`; roadmap để "không dùng với trẻ cho tới khi audit" |
| R-04 | Probe QA flaky do timing → bỏ qua tín hiệu đỏ thật | Trung bình | Trung bình | CI `continue-on-error` cho tới khi xanh ổn định; quy tắc "chạy lại 1 lần, dán `errors[]` + `failedAt`" |
| R-05 | Main chunk phình khi thêm nội dung | Trung bình | Cao (thiết bị yếu) | `check:budget` chặn 600 kB; bank tách chunk riêng; vendor nặng (`three`, `firebase`) bị ép ra ngoài entry bằng ADR-17 |
| R-06 | Nhiều phiên/lanh sửa chung một working tree, giẫm nhau | Trung bình | Trung bình | `.ai/CURRENT.md` + quy tắc "không đụng lane khác" (AGENTS.md §1.5) |
| R-07 | Phụ huynh hiểu sai số liệu mẫu | Thấp | Cao | Cờ `isDemoData` + banner + MCP `kbt-progress` in cảnh báo |
| R-08 | Dữ liệu trẻ nằm trên Firebase project không ai quản lý chi phí/xoá; hoặc merge `Math.max` bị coi là "đồng bộ 2 chiều hoàn hảo" | Trung bình | Cao (niềm tin phụ huynh) | `firestore.rules` chỉ cho `uid` của chính mình; chưa có UI xoá dữ liệu cloud → **để mở**, phải đóng trước khi quảng bá tính năng sync (ADR-16 + nợ #9 trong [`ARCHITECTURE.md`](ARCHITECTURE.md) §13) |

---

## 7. Lợi ích dự kiến & chi phí

**Lợi ích:** bé tự học được; phụ huynh có bằng chứng thay vì cảm tính; giáo viên nhận
được file chẩn đoán; người bảo trì không sợ "sửa nội dung là sập app".

**Chi phí vận hành thực tế (đo 2026-11-01):** `npm run verify` gồm typecheck + 1111 test
trong 78 file (riêng suite test ~20 s) + build + budget; probe QA cần Chromium của
Playwright và `dist/`. Không có chi phí server **cho người dùng chưa bật sync**; từ khi có
`firebase ^13.1.0`, chi phí Firestore thuộc project Firebase của người vận hành và chưa được
đo (chưa có số liệu dùng thật, chưa thống kê hạn mức free tier).

---

## 8. Tiêu chí chấp nhận cấp nghiệp vụ (Business DoD)

Một bản được gọi là "phát hành được" khi:

1. `npm run verify` xanh **nguyên văn output** (typecheck + test + build + budget ≤ 600 kB).
2. Probe `qa/golden-path.mjs` chạy trên build thật: 0 error, `failedAt` trống.
3. Không còn ISSUE P0/P1 mở; nợ kỹ thuật được ghi vào `docs/AUDIT_REPORT.md`.
4. Người lớn đã đọc to ≥ 1 bài mỗi môn và xác nhận nội dung phù hợp trẻ 6 tuổi.
5. `CHANGELOG.md` có mục version; tag `vX.Y.Z` tạo release kèm artifact `dist/`.
6. Không có file dữ liệu cá nhân của bé nào trong repo (`git status` sạch `progress/`).

---

## Phụ lục A — Số liệu đo ngày 2026-11-01 (gồm cả đợt đo 2026-10-29 cho nội dung học)

| Chỉ số | Giá trị | Đo bằng |
|---|---|---|
| Trò chơi đăng ký đủ 4 nơi | 31 (9 Việt · 10 Toán · 5 Anh · 2 Logic · 5 Fun); `LAUNCHABLE_GAME_IDS` = 31, `GAME_REGISTRY` = 31 | `kbt-curriculum → check_game_registration` / `readRegistration()` |
| Bậc độ khó mỗi trò | 6, số câu `[5, 6, 6, 7, 8, 8]` | `defaultRoundsPerTier()` trong `src/data/gameLevels.ts` |
| Chủ đề / bài / câu nội dung học (đếm **runtime**, import array trong test tạm) | Tiếng Việt 15/58/612 · Toán 13/26/260 · Tiếng Anh 24/40/434 · Em & Cuộc sống 14/26/264 → **tổng 66 chủ đề, 150 bài, 1570 câu** | `*_TOPICS` trong `src/data/*Curriculum.ts` (đếm tĩnh bằng grep bỏ sót câu sinh qua factory) |
| Luyện đọc | 36 đoạn · 192 câu hỏi | `READING_PASSAGES`, `READING_QUESTIONS` trong `src/data/readingContent.ts` |
| Unit test | 78 file / 1111 test, xanh | `npx vitest run` (76 `.ts` + 2 `.tsx`) |
| Probe trình duyệt | 27 probe (26 `.mjs` + 1 `.cjs`, không tính `lib.mjs`, `run-one.mjs`) | `ls qa/*.mjs` |
| Main chunk | 533.8 kB (ngân sách 600, mục tiêu 450) | `npm run check:budget` |
| Chunk vendor lớn | `three-vendor` 545.4 kB · `firebase-vendor` 537.9 kB · `react-vendor` 213.6 kB — tất cả ngoài entry | `npm run check:budget` |
| Kho câu thi | **475 câu** (256 trắc nghiệm · 55 nối · 46 điền · 42 xếp thứ tự · 39 đúng/sai · 24 phân loại · 13 kéo-thả), phủ đủ 26/26 kỹ năng taxonomy; đề thi phân môn: Toán 165 · Tiếng Anh 162 · Tiếng Việt 148 | `COMPETITION_QUESTIONS` (gồm `EXAM_FORMAT_QUESTIONS` 29 · `EXPANSION_QUESTIONS` 54 · `P36_QUESTIONS` 271 · `TOURNAMENT_QUESTIONS` 72), bank version 6 |
| Blueprint đề thi | 16 preset: 6 mini-test · 2 full-mock · 2 speed-trial · 6 tournament; số câu 6→30 | `EXAM_BLUEPRINTS` trong `src/data/competitionBlueprints.ts` |
| Kid's Box (track Anh văn) | **0 unit đã map**, 7 nhóm tài liệu `CONTENT_SOURCE_REQUIRED` | `KIDBOX_MAPPED_UNITS`, `KIDBOX_REQUIRED_ARTIFACTS` — app không bịa tên unit |
| Keys lưu trữ | **17 key** `localStorage` (16 trong `STORAGE_KEYS` + `kho_bau_ioe_store` khai báo cục bộ), schema `P42-v3`, 7 phiên bản lịch sử, 6 hàm migration | `src/services/storage.ts`, `grep -o "kho_bau_[a-z0-9_]*" src/` |
| Chính sách tập trung | `src/config/policy.ts` 693 dòng, 17 khối policy xuất khẩu (`export const`) | Read |
| Dependency runtime | 8: react, react-dom, lucide-react, @vercel/analytics, tslib, **three, @types/three, firebase** (3 mục in đậm vào repo cùng merge 2026-10-30; `@types/three` lẽ ra thuộc `devDependencies` — nợ #8 ARCHITECTURE §13) | `package.json` |
| Tài liệu Markdown | **107 file** — `docs/` 100 (gốc 48 · `opencode/` 45 = 4 README/rules + 2 queue + 39 reports · `specs/` 5 · `plan/` 2) + 7 ngoài `docs/` (README, CHANGELOG, CONTRIBUTING, AGENTS, mcp/README, .github/pull_request_template, .ai/CURRENT). Đo 2026-10-30 sau khi gỡ **68 prompt** đã dùng xong (67 `.md` + `docs/opencode/UI.txt`); trước đó 174 `.md` | `find . -name '*.md' -not -path './node_modules/*' -not -path './.git/*' \| wc -l` |
| MCP cho agent | 5 server / 27 tool, zero-dependency, có test guarding | `mcp/README.md`, `tests/t23-mcp-servers.test.ts` |
