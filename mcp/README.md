# MCP cho Kho Báu Tri Thức (`mcp/`)

Năm MCP server **zero-dependency** (chỉ dùng Node built-in, tự viết stdio JSON-RPC)
để agent làm việc với repo mà không phải đoán. Đăng ký trong Qoder → Settings →
MCP Connectors, hoặc thêm thủ công vào `mcp.json`:

```json
{
  "mcpServers": {
    "kbt-quality-gates": { "command": "node", "args": ["D:/trithuc/kho-bau-tri-thuc/mcp/quality-gates.mjs"] },
    "kbt-curriculum":    { "command": "node", "args": ["D:/trithuc/kho-bau-tri-thuc/mcp/curriculum.mjs"] },
    "kbt-game-scaffold": { "command": "node", "args": ["D:/trithuc/kho-bau-tri-thuc/mcp/scaffold.mjs"] },
    "kbt-progress":      { "command": "node", "args": ["D:/trithuc/kho-bau-tri-thuc/mcp/progress.mjs"] },
    "kbt-docs":          { "command": "node", "args": ["D:/trithuc/kho-bau-tri-thuc/mcp/docs.mjs"] }
  }
}
```

> Path phải là **tuyệt đối**; Qoder khởi động server bằng `node <đường-dẫn>`, không
> qua npm. Sau khi thêm, bật connector và mở phiên mới (server mới đăng ký giữa
> chừng phiên thường chưa gắn vào phiên hiện tại).

| Server | Tool | Dùng khi nào |
|---|---|---|
| `kbt-quality-gates` | `run_gate` | Chạy `verify` / `verify:quick` / `typecheck` / `test:ci` / `build` / `check:budget`, output đã cắt gọn + `exitCode` + `timedOut` |
| | `list_qa_probes`, `run_qa_probe` | Liệt kê probe trong `qa/`, chạy probe trên bản build thật (tự build nếu thiếu `dist/`) |
| | `bundle_report` | Size main chunk so với ngân sách 600 kB / mục tiêu 450 kB |
| | `workspace_status`, `audit_state` | Nhánh hiện tại, hook đã bật chưa, file đang thay đổi, dấu audit tăng dần |
| `kbt-curriculum` | `list_games`, `get_game` | Danh mục 31 trò chơi, metadata + data pack của một trò |
| | `check_game_registration` | **Bất biến 4 danh sách** (docs/SDLC.md §3.1) có khớp không |
| | `curriculum_overview`, `list_skills` | Số chủ đề / bài / câu từng môn; kỹ năng đã có id |
| | `search_content` | Tìm câu chữ trong nội dung học (`src/data`), literal hoặc regex |
| | `content_rules`, `game_conventions` | Ràng buộc nội dung cho trẻ 6 tuổi + quy ước viết game |
| `kbt-game-scaffold` | `plan_game` | Phương án 6 bậc + input cần có, chưa ghi file |
| | `scaffold_game` | Sinh data pack + component + test; **dry-run mặc định**, `write:true` mới tạo file, `apply_registration:true` vá cả 4 danh sách (có backup trong `.scaffold-backup/`) |
| | `validate_game` | Registration parity + typecheck + test của game đó |
| `kbt-progress` | `storage_key_catalog` | 15+ key `kho_bau_*` và mục đích từng key, schema version hiện hành |
| | `export_instructions` | Cách lấy export (nút “Xuất file (.json)” trong Chế độ Phụ huynh hoặc snippet DevTools) |
| | `read_progress` | Tóm tắt XP/sao/streak, bài đã xong, kết quả thi, luyện đọc, động lực |
| | `find_skill_gaps` | Kỹ năng mastery thấp nhất → nên ôn gì trước |
| `kbt-docs` | `list_docs`, `search_docs`, `read_doc` | Mục lục file Markdown (quét lúc chạy, không hardcode số), tìm theo từ khoá/regex, đọc theo khoảng dòng |
| | `docs_for_topic` | “Chủ đề này nằm ở tài liệu nào?” — xếp theo số lần nhắc |
| | `project_state` | `.ai/CURRENT.md` + `[Unreleased]` của CHANGELOG + audit gần nhất |
| | `rules_digest` | Rule bắt buộc từ `AGENTS.md`, `docs/SDLC.md`, `CONTRIBUTING.md`, `docs/opencode/00_RULES.md` |

## Kiểm tra nhanh không cần client MCP

```bash
node mcp/devclient.mjs mcp/curriculum.mjs check_game_registration:'{"game_id":"shadow_match"}'
node mcp/devclient.mjs mcp/progress.mjs read_progress:'{}'
node mcp/devclient.mjs mcp/docs.mjs docs_for_topic:'{"topic":"luyện đọc"}'
```

`mcp/devclient.mjs` là client stdio tối giản, chỉ để smoke-test.

## Biên an toàn

* Không secret, không mạng, không đọc ngoài repo: mọi đường dẫn đi qua
  `resolveInsideRepo()`; `kbt-progress` cần env `KBT_PROGRESS_DIR` nếu muốn đọc ngoài repo.
* `kbt-progress` **che PII mặc định** (tên, id, email, avatar) và in cờ
  `isDemoData` thật to — số liệu mẫu không được trình bày như kết quả thật của bé.
  File export thật để trong `progress/` (đã `.gitignore`), không commit, không dán vào chat.
* `mcp/sample-export.json` là dữ liệu **giả định** để thử tool; shape theo đúng `src/types`.
* Chỉ `scaffold_game` và `run_gate`/`run_qa_probe` thay đổi hoặc chạy lệnh: scaffold ghi
  file mới + backup trước khi vá; gate chỉ chạy npm script có tên trong whitelist.

## Ý tưởng server có thể thêm sau

* **Content authoring validator** — chạy `contentValidator` + `BANNED_WORDS` trên một
  JSON bài học chưa đăng ký, in WARNING theo từng câu (hiện mới kiểm được nội dung đã nằm trong repo).
* **Orthography lint** — soát dấu tiếng Việt/NFC của văn bản mới viết trước khi nhập liệu.
* **Visual QA** — server screenshot theo breakpoint 390/768/1280 px cho một màn hình cụ thể.
* **Release helper** — mở `CHANGELOG` mục `[Unreleased]`, tạo tag, dựng release note
  (hiện `04-release.yml` đã làm phần đó trên CI).
