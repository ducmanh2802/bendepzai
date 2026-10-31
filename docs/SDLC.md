# Quy trình phát triển phần mềm (SDLC) — Kho Báu Tri Thức

**Áp dụng từ:** 2026-10-29 · **Chủ process:** người giữ repo (`ducmanh2802`)
**Tài liệu này là nguồn chân lý duy nhất cho quy trình.** Khi một tài liệu khác
(`docs/MASTER_ROADMAP.md`, `.ai/CURRENT.md`) mâu thuẫn về *cách làm việc*, ở đây thắng.

---

## 0. Một câu duy nhất cần nhớ

> Không có gì vào `main` nếu `npm run verify` chưa xanh — tại máy bạn hoặc trên CI,
> nhưng phải xanh ở một trong hai nơi, và CI là nơi quyết định.

```bash
npm run hooks:install   # cài gate cục bộ (chạy 1 lần sau khi clone)
npm run verify          # typecheck + tests + build + bundle budget
npm run qa:smoke        # probe Playwright thật trên dist/ (cần npm run build trước)
```

---

## 1. Sáu giai đoạn của một thay đổi

| # | Giai đoạn | Đầu vào | Việc chính | Đầu ra | Gate để đi tiếp |
|---|---|---|---|---|---|
| 1 | **Đề bài** | Nhu cầu của bé/phụ huynh | Mở Issue theo template (`bug` / `feat` / `content`); ghi *tiêu chí hoàn thành* kiểm tra được | Issue có label + DoD | DoD viết ra được thành lệnh hoặc bước bấm |
| 2 | **Thiết kế** | Issue | Đọc code liên quan; quyết định cấu trúc; nếu đụng trò chơi → đọc mục 3 (bất biến đăng ký) và `docs/GAME_DESIGN.md` | Ghi chú thiết kế ngắn trong Issue | Không có 2 cách làm cùng hợp lệ mà chưa chốt |
| 3 | **Hiện thực** | Nhánh `main` mới nhất | Tạo `feature/<số-issue>-<slug>`, commit nhỏ theo Conventional Commits | Code + test đi kèm | `npm run verify:quick` xanh tại máy |
| 4 | **Kiểm chứng** | Code | `npm run verify`; nếu đổi UI/trò chơi: `npm run qa:smoke` hoặc probe riêng trong `qa/`, xem ảnh chụp/JSON | bằng chứng (log, JSON, screenshot) | Mọi test xanh, 0 console error ở vùng đã đổi |
| 5 | **Rà soát** | PR → `main` | Người review (hoặc agent khác lane) đọc diff theo checklist PR; CI chạy 3 job | PR được squash-merge | CI xanh + checklist PR tick đủ |
| 6 | **Phát hành & vận hành** | `main` sạch | Tag `vX.Y.Z` → workflow `4. Release` build, đóng zip, tạo GitHub Release; ghi `docs/opencode/reports/` nếu là task lớn | Release + artifact | Commit của release được nêu ở `.ai/CURRENT.md` |

Giai đoạn 1–2 có thể gộp với thay đổi nhỏ (sửa typo, đổi màu). Giai đoạn 4–5 **không bao giờ** bỏ.

---

## 2. Nhánh, commit, PR

**Mô hình: trunk-based + PR.** `main` luôn xanh và luôn phát hành được.

```
main ──●──────────────●────────●  (chỉ nhận squash merge, CI xanh)
        \            /
         feature/42-them-game-noi-so
```

- Tên nhánh: `feature/<issue>-<slug>`, `fix/<issue>-<slug>`, `chore/<slug>`, `docs/<slug>`.
- Không push thẳng vào `main`, kể cả khi vội — trừ revert: `git revert <sha>` rồi mở PR ngay.
- Một PR = một ý. Sửa vặt phát hiện tình cờ → Issue riêng, không "ăn theo" PR.

**Commit message** (bắt buộc, do `commit-msg` hook kiểm tra):

```
<type>[(scope)][!]: <mô tả ≥ 3 ký tự, không chấm câu ở cuối>
type ∈ feat | fix | docs | test | refactor | perf | chore | build | ci | revert
```

Ví dụ thật trong dự án này:

```
feat(games): thêm trò Nối Số Tô Màu
fix(cotuong): quân Pháo không được ăn khi bị cản
test(fun-games): phủ builder của connect_dots/shadow_match/pixel_mosaic
chore(ci): tách job QA thành workflow riêng
```

**PR**: dùng checklist trong `.github/pull_request_template.md`. Bắt buộc tick nhóm
"Bất biến kiến trúc" nếu PR đụng tới trò chơi — đó là chỗ hay hỏng nhất của repo này.

---

## 3. Bất biến kiến trúc (gate kiểm tra bằng test, không bằng lời nhắc)

### 3.1 Một trò chơi phải xuất hiện ở đúng 4 nơi

| Nơi | Tên | Vai trò |
|---|---|---|
| `src/data/gamesCatalog.ts` | `GAMES_CATALOG` | dữ liệu hiển thị: `id`, `title`, emoji, `skillIds`, màu |
| `src/components/games/registry.ts` | `GAME_REGISTRY` | `id` → component **lazy** |
| `src/config/policy.ts` | `LAUNCHABLE_GAME_IDS` | `id` được phép mở |
| `qa/games.mjs` | `GAME_TITLES` | `title` tiếng Việt để probe bấm thử |

Lệch một trong bốn ⇒ test hiện có (`t08-games-hub`, `t14c-logic`, `t15`, `t16`, `t17a`, `t17b`) đỏ ngay.
Đây là lý do CI bật typecheck/test trước mọi thứ khác.

### 3.2 Builder dữ liệu phải deterministic

`src/data/games/<trò>.ts` nhận `(tier, seed)` và **không** dùng `Math.random`,
`Date.now`, hay duyệt object không đảm bảo thứ tự. Dùng `seededRng` / `shuffleSeeded` /
`pickDistinct`. Lý do: mỗi lần replay chỉ đổi `nonce` để xáo lại câu hỏi, và test phải
khẳng định chạy 2 lần cho cùng kết quả.

### 3.3 Ngân sách bundle

Main chunk ≤ **600 kB** (mục tiêu ≤ 450 kB) — `npm run check:budget`, do
`tests/bundle-budget.test.ts` giữ. Muốn thêm một game nặng: lazy ở `registry.ts`,
không `import` trực tiếp từ Hub. Không kéo `three` hay thư viện 3D lớn vào;
board 3D cờ tướng hiện tại là CSS `perspective`/`preserve-3d`, không phải WebGL.

---

## 4. Bộ gate tự động

### 4.1 Cục bộ (`scripts/hooks/`, bật bằng `npm run hooks:install`)

| Hook | Chạy khi | Nội dung | Mất khoảng |
|---|---|---|---|
| `pre-commit` | mỗi commit | chặn `.env*`; `npx tsc --noEmit` nếu có file `.ts/.tsx/.json` thay đổi | ~6 s |
| `commit-msg` | mỗi commit | validate Conventional Commits | <0.2 s |
| `pre-push` | mỗi push | `npm run verify:quick` (typecheck + 1052 unit test, 73 file) | ~25 s |

Cài tự động qua `prepare` khi chạy `npm install`. Nếu bạn clone bằng tool không chạy
`prepare`, hãy tự chạy `npm run hooks:install`.

`--no-verify` chỉ dành cho trường hợp khẩn cấp và phải nói rõ trong PR.

> **Linux/macOS:** repo này thường được checkout trên Windows với `core.fileMode=false`,
> nên git không tự ghi exec bit cho các file trong `scripts/hooks/`. Sau lần commit đầu
> tiên, chạy một lần:
> `git update-index --chmod=+x scripts/hooks/pre-commit scripts/hooks/commit-msg scripts/hooks/pre-push`
> Nếu không, đồng nghiệp trên macOS sẽ thấy `hook not executable`.

### 4.2 CI (GitHub Actions, `.github/workflows/`)

| Job | Trigger | Làm gì | Chặn merge? |
|---|---|---|---|
| `1. Quality` | PR + push `main` | `npm ci` → typecheck → `test:ci` | **có** |
| `2. Build + artifact` | PR + push `main` | build → check budget → upload `dist-*` (giữ 14 ngày) | **có** |
| `3. Browser QA` | PR + push `main` | tải `dist/`, cài Chromium, chạy probe | chưa (xem dưới) |
| `4. Release` | tag `v*.*.*` | full gate → zip → GitHub Release | n/a |

Hai điểm phải hiểu để không mất thời gian debug:

- CI dùng **`test:ci`** (`vitest run`) chứ không dùng `npm test`. `npm test` có
  `posttest` chạy `scripts/audit-snapshot.mjs`, script này **ghi đè**
  `docs/audit-state.json` và **nối thêm** `docs/AUDIT_REPORT.md`. Đó là việc của máy
  dev, không phải của CI.
- `3. Browser QA` đang bật `continue-on-error: true`, vì các probe từng chỉ chạy trên
  máy dev với đường dẫn Chromium hardcode. `qa/run-one.mjs` giờ đã tự fallback về
  Chromium do Playwright quản lý và in `QA PASS` / `QA FAIL — n error(s) at <step>`.
  Trên máy dev, `qa/golden-path.mjs` chạy sạch (25 bước, 0 lỗi) nhưng **thỉnh thoảng đỏ
  do timing** khi bấm chuỗi màn hình quá dài. Probe đó chỉ mang tính báo động, chưa phải
  gate cứng. **Xoá dòng `continue-on-error` khi job xanh liên tiếp vài lần trên `main`**,
  và nó trở thành gate cứng.
- Exit code của probe: `run-one.mjs` coi là **đạt** khi `errors[]` rỗng và probe không
  tự khai `ok: false` (nhiều probe cũ không đặt trường `ok`).

### 4.3 Branch protection (một lần, do người giữ repo bật)

Cài đặt → Branches → Add rule cho `main`:

- [ ] Require a pull request before merging (số review bắt buộc = 0 nếu làm một mình)
- [ ] Require status checks to pass — chọn **đúng tên job** từ list autocomplete của
      GitHub (`typecheck + tests`, `build + bundle budget`); không tự gõ tay,
      vì chuỗi phải khớp y hệt tên job trong workflow
- [ ] Do not allow force pushes
- [ ] Include administrators

Cùng một lệnh CLI, nhưng **chỉ chạy sau khi đã mở hai workflow đầu trên `main`** để
GitHub biết tên context thật, và chỉ khi bạn có quyền admin repo:

```bash
gh api -X PUT "repos/ducmanh2802/kho-bau-tri-thuc/branches/main/protection" \
  --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": [] },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null
}
JSON
```

`strict: true` buộc PR phải rebase/merge `main` mới nhất trước khi merge — giữ
`main` luôn tuyến tính và luôn xanh. `contexts: []` nghĩa là chưa chốt check bắt buộc
nào. Điền tên job vào `contexts` sau khi thấy chúng hiện đúng trong tab *Checks*,
rồi chạy lại lệnh.

---

## 5. Definition of Done

Một thay đổi chỉ *xong* khi đủ cả 6:

1. `npm run verify` xanh (typecheck, test, build, budget).
2. Test mới cho hành vi mới — behaviour của builder, của engine, hoặc của UI; không có test nghĩa là chưa xong.
3. Nếu đổi UI: chạy probe QA tương ứng, **0 console error**, và bạn đã nhìn ảnh chụp/JSON bằng mắt.
4. Bất biến §3 được giữ (đặc biệt 4 danh sách đăng ký trò chơi).
5. `CHANGELOG.md` có mục dưới `[Unreleased]`; `.ai/CURRENT.md` có dòng task nếu đây là task P42-style.
6. PR tick đủ checklist, CI xanh, không còn file rác (`qa-shots/`, script tạm, server nền).

---

## 6. Phát hành

**Semver:** `MAJOR` phá vỡ dữ liệu lưu trữ của bé (localStorage schema) · `MINOR` thêm
trò chơi/màn hình · `PATCH` sửa lỗi, sửa nội dung.

```bash
# 1. chắc chắn main đang xanh
git checkout main && git pull --ff-only

# 2. chốt version: [Unreleased] -> [X.Y.Z] - YYYY-MM-DD trong CHANGELOG.md
git add CHANGELOG.md && git commit -m "chore(release): v1.1.0"
git pull --ff-only        # PR nhỏ này cũng phải qua CI

# 3. tag -> tự chạy workflow 4. Release
git tag -a v1.1.0 -m "Kho Báu Tri Thức v1.1.0"
git push origin v1.1.0
```

Kết quả: GitHub Release `v1.1.0` kèm `kho-bau-tri-thuc-1.1.0.zip` (chính là `dist/`),
ghi chú lấy tự động từ section tương ứng của `CHANGELOG.md`.

**Rollback:** không có "deploy" riêng nên rollback = cho bé dùng release cũ.

```bash
git revert <sha-của-commit-gây-lỗi>   # mở PR, merge, tag v1.1.1
```

Không `git reset --hard` rồi force-push lên `main`.

---

## 7. Audit tăng dần (việc định kỳ, không phải việc khẩn)

`scripts/audit-snapshot.mjs` so ảnh chụp repo với `docs/audit-state.json`, ghi phát hiện
vào `docs/AUDIT_REPORT.md` và **luôn exit 0** — nó báo cáo, không chặn.

- **Khi nào chạy:** sau mỗi task lớn, hoặc khi bạn muốn biết "còn nợ gì". Nó được gắn
  vào `posttest` nên `npm test` hằng ngày cũng tự cập nhật.
- **Không commit `docs/audit-state.json` bừa từ CI**: state phản ánh *máy vừa chạy audit*.
- **Nợ chỉ được đóng bằng test**: mỗi WARNING nên biến thành một `test()` hoặc một probe.

**Nhịp đề xuất:** mỗi tuần một lần `npm test && git status docs/` — đọc diff của
`AUDIT_REPORT.md`, chọn 1 mục, biến nó thành Issue có nhãn `content` hoặc `bug`.

---

## 8. Việc con người, không phải máy

- **Hai agent / hai lane dùng chung một working tree**: đã từng xảy ra ở repo này
  (xem lưu ý "Tree hygiene" trong `.ai/CURRENT.md`). Quy tắc: một lane = một worktree
  riêng, hoặc thỏa thuận file nào thuộc lane nào trước khi sửa. Không "quét" file của
  lane khác vào commit của mình.
- **Review nội dung học**: người lớn đọc to câu hỏi và đáp án. Máy không phát hiện được
  một câu hỏi đúng ngữ pháp nhưng sai với trẻ 6 tuổi.
- **Phạm vi có chủ đích:** repo này **không** tích hợp deploy provider (Vercel/Firebase
  hosting) trong CI và **không** có secret nào trong pipeline. Việc phát hành dừng ở
  artifact + GitHub Release cho tới khi có nhu cầu thật.

---

## 9. Tra cứu nhanh

| Tôi muốn… | Chạy |
|---|---|
| kiểm tra nhanh trước khi commit | `npm run typecheck` |
| kiểm tra trước khi push | `npm run verify:quick` |
| cổng đầy đủ như CI | `npm run verify` |
| xem app thật trên build | `npm run build && npm run preview -- --port 4173` |
| probe QA một màn chơi | `npm run build && npm run qa:smoke` |
| probe 31 trò chơi | `npm run build && npm run qa:games` |
| một probe cụ thể | `npm run build && node qa/run-one.mjs qa/<probe>.mjs` |
| cài lại hooks sau khi clone | `npm run hooks:install` |
| chỉ số bundle | `npm run check:budget` |
| audit nợ kỹ thuật | `npm test` |
| đọc tài liệu dự án mà không mở 20 file | MCP `kbt-docs` → `docs_for_topic` / `search_docs` |
| yêu cầu nào chưa có test | `docs/specs/RTM.md` (87 FR × test/probe) |
| vì sao kiến trúc lại như này | `docs/specs/ARCHITECTURE.md` §11 (ADR-01…ADR-15) |
| việc kế tiếp nên làm gì | `docs/plan/TASK_PLAN.md` §3 (backlog EP-A…EP-F) |
| đổi X thì phải chạy gì | `docs/plan/TEST_PLAN.md` §3 |

---

## 10. MCP cho agent (`mcp/`)

Năm server stdio **zero-dependency**, đăng ký trong Qoder → Settings → MCP Connectors
(chi tiết và bảng tool: [`mcp/README.md`](../mcp/README.md)). Chúng không thay thế
gate — chúng bọc gate để agent gọi được một lần thay vì đoán lệnh:

| Server | Vai trò trong quy trình |
|---|---|
| `kbt-quality-gates` | chạy §4 (`run_gate`), probe QA, báo cáo bundle §3.3, trạng thái workspace |
| `kbt-curriculum` | kiểm bất biến §3.1 (`check_game_registration`), số liệu chương trình, ràng buộc nội dung |
| `kbt-game-scaffold` | sinh khung trò chơi mới theo §3.2, mặc định dry-run, vá 4 danh sách khi được cho phép |
| `kbt-progress` | đọc tiến độ từ file export **cục bộ**, che PII, không secret không mạng |
| `kbt-docs` | tra toàn bộ file tài liệu Markdown (đếm lúc chạy), trạng thái hiện tại ở `.ai/CURRENT.md` |

Nguyên tắc:

* Số liệu từ MCP là **manh mối**, không phải bằng chứng. Trước khi nói “xong”, vẫn
  phải có output thật của `npm run verify` (§5).
* `kbt-progress` chỉ đọc file export do chính người dùng đặt vào `progress/`
  (đã `.gitignore`). Không commit, không dán dữ liệu của trẻ vào chat/Issue.
* `scaffold_game` là tool duy nhất ghi file; luôn xem diff nó báo trước khi chấp nhận.
* Server thêm mới phải zero-dependency và nằm trong `mcp/` — không thêm package npm
  chỉ để làm MCP.
