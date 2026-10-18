# T08 — Games Hub đẹp + khung game chuẩn mobile + registry

## Đã làm

- Tạo `src/components/games/registry.ts`: `GAME_REGISTRY` với `lazy()` cho 18 game; alias `GAME_COMPONENTS`/`GAMES_REGISTRY`, hàm `getGameComponent`, `REALTIME_GAME_IDS`.
- `src/data/gamesCatalog.ts`: chỉ dữ liệu; thêm `skillIds` + `isRealtime` vào `GameInfo`; bỏ 4 cờ `isNew: true` ghi cứng.
- `GamesHubScreen.tsx`: import registry lazy; tabs cố định 5 cột; khu "🔥 Gợi ý cho bé" (3 game ít sao nhất); nhãn "MỚI" theo ngày bé thấy game lưu storage; chữ nhỏ được nâng về ≥ 14px; render game qua Suspense.
- `storage.ts`: key `kho_bau_game_first_seen`, baseline 18 game hiện có > 7 ngày; các hàm `getGameFirstSeen`, `markGameSeen`, `isGameNew`/alias sanitizer.
- `policy.ts`: `LAUNCHABLE_GAME_IDS` đồng bộ 18 game Games Hub; `decisionEngine.ts` vẫn cho phép `kidbox_word_safari`.
- `GameModalWrapper.tsx`: chỉ game real-time có nút tạm dừng.
- `qa/games.mjs`: danh sách 18 game hiện hành.
- Test `tests/t08-games-hub.test.ts`: catalog = registry = LAUNCHABLE.

## Số liệu trước/sau

- Game trong catalog/registry: 18; test: 599 → 601, vẫn PASS.
- typecheck/test/build: PASS.

## Lệnh chạy + kết quả

- `npm run typecheck`: PASS
- `npm test`: PASS (601 tests)
- `npm run build`: PASS

## Quyết định tự đưa ra

- `kidbox_word_safari` không đưa vào Games Hub/policy launchable vì là mini-game trong Kid's Box; decision engine vẫn available như cũ.
- Nhãn "MỚI" seed baseline cho 18 game hiện có là đã thấy nên không_NEW ngay; game mới chưa từng thấy sẽ_NEW 7 ngày đầu.

## Việc còn tồn

- Nút tạm dừng hiện là UI toggle, chưa truyền trạng thái paused vào từng game real-time; cần game engine hỗ trợ khi có thời gian.
- Chưa chạy QA browser (best-effort, SKIPPED nếu không mở được).