# 📋 BÁO CÁO AUDIT — kho_bau_tri_thuc

> **Baseline toàn diện lần cuối: 17-10-2026** (sau feature persona giọng nói + P41 mojibake fix)
>
> Từ lần audit này, **KHÔNG cần audit lại toàn bộ dự án**. Chạy `npm run audit:snapshot`
> để biết chính xác file nào đã thay đổi → chỉ audit phần đó (chi tiết §8).

---

## 1. Tình trạng môi trường (verified 17-10-2026)

| Hạng mục | Trạng thái |
|---|---|
| `tsc --noEmit` | ✅ 0 lỗi |
| `vite build` | ✅ thành công, ~22s |
| `vitest run` | ✅ **870/870 pass** (58 file) |
| Git working tree | 39 file thay đổi (P41 mojibake + persona voice) — đã audit trong baseline |

## 2. P0 — CRITICAL (chưa sửa, verified bằng tay)

| # | Bug | Vị trí | By chứng |
|---|---|---|---|
| P0-1 | **Mọi câu ordering luôn chấm SAI trong lesson player** — data lưu `correctAnswer: 'a\|b\|c'` (string) nhưng checker đòi `Array.isArray(correct)` | `src/services/answerCheck.ts:18` | Question ordering type `ordering` — 46 câu trên 4 môn (toán 14, life 18, english 10, tiếng Việt 4). Lộ trình thi đấu KHÔNG dính (`CompetitionExamModal` tự `.split('\|')`) |
| P0-2 | **Fatigue không bao giờ reset** — sau ~25 câu tích lũy (không phải mỗi session), `isFatigued` kẹt true vĩnh viễn → "Hôm nay nên học gì" chỉ còn 1 lá "chơi Lật Thẻ" mãi mãi | `src/services/storage.ts:446,453-455`; `learningOS.ts:490-507` | Chỉ có `+= 1`, không có dòng nào reset về 0 |
| P0-3 | **Word Safari không thể thắng** — `buildGameActivity` đánh dấu TẤT CẢ item `isCorrect: true`; game nộp 1 item nhưng TAPS đòi chọn tất cả ⇒ mọi ván đều INCORRECT | `src/services/kidBoxActivities.ts:495-513,718-724`; `KidBoxWordSafari.tsx:29` | Bé bấm đúng vẫn bị tính sai → kỹ năng EN-VOCAB-RECOGNITION nhận tín hiệu sai |

## 3. P1 — Logic sai nghiêm trọng (chưa sửa)

| # | Bug | Vị trí |
|---|---|---|
| P1-1 | KidBox **sort no-op**: `hashSeed(\`${a.id}-${b.id}\`) - hashSeed(\`${a.id}-${b.id}\`)` luôn = 0 → đáp án đúng luôn đứng đầu | `kidBoxActivities.ts:146,268` |
| P1-2 | ORDER re-sort lời chọn của bé trước khi chấm → sắp sai vẫn "đúng" | `kidBoxActivities.ts` case ORDER ~694 |
| P1-3 | Độ sẵn sàng thi đọc NGƯỢC lịch sử: `unshift` (mới-nhất-đầu) nhưng `slice(-RECENT_WINDOW)` lấy cuối mảng = 3 bài CŨ nhất | `storage.ts:2160` ↔ `competitionEngine.ts:604` |
| P1-4 | Decision engine dùng ngày UTC (`toISOString().slice(0,10)`) — 0h–7h sáng VN mọi hoạt động bị tính "hôm qua" | `decisionEngine.ts:1455-1510`; cùng họ lỗi `Header.tsx:128-130` |
| P1-5 | `rewardsEnabled` chỉ tắt lịch sử, sao/XP/vé/sticker vẫn cộng | `storage.ts:2236` |
| P1-6 | KidBox chơi lại vòng cũ để đào evidence vô hạn (id cố attempt theo giây + remount) | `KidBoxActivityPlayer.tsx` submit() |
| P1-7 | TTS đọc lời giải thi thử trước khi bé trả lời trong game nghe phonics (`audioText = explanation`) | `gameContent.ts:149`, `ListenPickPhonicsGame.tsx:26,32` |
| P1-8 | Test assertion tautology `expect(true).toBe(true)` — rule `ng` không được test | `tests/games-all.test.ts:563` |

## 4. P2 — Nhỏ / nội dung

- **TenFrame vẽ 5 chấm/chục thay 10** → số 24 hiển thị 14 chấm dạy sai: `TenFrame.tsx:118-137` + `numbers100.ts:133`
- 2 câu explanation còn nháp AI: `(wait: ...), Let me fix:` — `mathCurriculum.ts:1881,1897` (câu `math-new-q29,q30`)
- Ordering có kết quả bằng nhau (tie) chỉ nhận 1 thứ tự: `math-new-q8, q43, q38`
- Drag-drop chỉ chấm nhóm thả CUỐI (`answerCheck.ts:35-39`, `DragDropQuestion.tsx:36`)
- Gacha "0 = vô hạn" thực ra = 5/ngày (`storage.ts:2250`); `MAX_DAILY_DRAWS` hardcode 5 ở `GachaMachineScreen.tsx:16`
- `musicEnabled`, `difficultyScale` lưu nhưng không ai đọc (settings chết)
- `completedLessons` nhận id rác `daily-review-${Date.now()}` làm méo mở-khoá (`DailyReviewScreen.tsx:34`)
- learningOS SM-2 ladder kẹt index 2 sau 2 lần ôn; `generateDailyPlan` Pass 2 có thể vượt `MAX_DAILY_ITEMS`
- Header greeting typo: `'bé oir!'` (`Header.tsx:26`) + vài chuỗi rác
- Comfortaa heading font không preload; `bgMusic` loop chạy rAF 60fps (chưa active)
- Config cruft: dead alias `@/*` (tsconfig + vite), `experimentalDecorators`, 3 test bundle-budget bị skip silent nếu chưa build
- useSpeak clamp pitch min 0 khác sound.ts min 0.1 (không nhất quán nhỏ)

## 5. Feature MỚI đã audit-clean (persona giọng nói, 17-10-2026)

- Hệ 6 persona: `narrator` (mặc định câu hỏi), `teacher`, `uncle`, `grandma` (người lớn), `kid_girl`, `kid_boy` (trẻ em)
- Khen ngợi luân phiên 5 giọng (không lặp trong 2 lần gần nhất) — `praiseEngine.ts: pickPraisePersona()`
- Chọn voice theo giới tính khi device có nhiều voice; khác biệt pitch/rate đảm bảo nghe là người khác nói
- 15 test mới trong `tests/voice-persona.test.ts` — TẤT CẢ pass
- Evidence: `TTS_PERSONA` ghi vào `__praiseLog` + `formatPraiseEvidence`

## 6. File rác — xóa an toàn (10 file root, git tracked)

`analyze-lessons.mjs` (đã break — import export không tồn tại), `check-lessons.mjs`, `analyze-questions.mjs`, `fix_app.cjs`, `patch_app.mjs`, `fix2.py`, `fix_rhymes.py`, `apply_fixes.py` (trỏ repo cũ `kho_bau_luong_b`), `all-tests.txt`, `test-output.txt` (log cũ UTF-16)

**Giữ:** `qa/` (Playwright probes), `scripts/` (budget check + sw-precache), `.env.example`

## 7. Thứ tự khuyến nghị sửa

1. P0-1 `answerCheck` ordering — chấp nhận pipe-string (9 dòng, chỗ nào cũng dễ)
2. P0-2 reset fatigue theo ngày/session
3. P0-3 Word Safari chỉ 1 item `isCorrect` hoặc đổi TAPS
4. P1-1 comparator kidBox (1 dòng: `hashSeed(a.id) - hashSeed(b.id)`)
5. P1-3 đảo slice readiness
6. Content: explanation q29/q30, tie ordering, TenFrame

## 8. 🔁 QUY TRÌNH AUDIT TĂNG DẦN (lần sau dùng)

**"Thay đổi đã tự lưu lại"** — hoạt động thế nào:

```
npm run audit:snapshot          # so sánh tree hiện tại với docs/audit-state.json
```

- **Không đổi gì** → xuất ra "✅ Không có thay đổi… không cần audit"
- **Có đổi** → liệt kê file mới / sửa / xóa + tự động cập nhật `docs/audit-state.json`
  + tự append mục mới vào "## Nhật ký audit tăng dần" ở dưới
- Vào môi trường dev, script cũng chạy tự động sau `npm test` (hook posttest)

**Audit lần sau chỉ duyệt các file được liệt kê** (nếu file dưới 20 dòng diff → đọc diff; nếu sửa file data lớn → dùng auto-validator P41 đã có). Khi audit xong file nào → đánh dấu trong mục này.

## Nhật ký audit tăng dần

| Thời gian | Thay đổi file | Kết quả |
|---|---|---|
| 17-10-2026 10:15 | Baseline toàn dự án: 323 file vs 3 luồng audit song song + verify 6 bug bằng tay | ✅ Sạch — mọi P0/P1/P2 đã ghi ở trên |
| 17-10-2026 10:17 | 3 file test glyph emoji (từ phiên P41 song song) + 2 file test mới chưa track | ✅ Đã audit — chỉ swap emoji vô hại (`🪿→🦢`, `🪟→🖼️`) |
| 2026-10-17 10:18 | Không có thay đổi mã nguồn | ✅ Sạch |
| 2026-10-17 10:52 | tests/fatigue-reset.test.ts, src/services/answerCheck.ts, src/services/kidBoxActivities.ts, src/services/learningOS.ts, src/services/storage.ts, tests/answerCheck.test.ts, tests/kidbox-learning-os.test.ts, qa/golden-path.mjs, … | 🟡 Cần audit phần liệt kê |
| 2026-10-17 10:52 | Không có thay đổi mã nguồn | ✅ Sạch |
| 2026-10-17 11:13 | src/components/learning/chess/ChessTutorial.tsx, scripts/normalize-math-minus.mjs, src/data/math/add-sub-10.ts, src/data/math/add-sub-100.ts, src/data/math/calcIn100.ts, src/data/math/length.ts, src/data/math/logic.ts, src/data/math/numbers-0-10.ts, … | 🟡 Cần audit phần liệt kê |
| 2026-10-17 20:10 | tests/math-typography.test.ts, src/components/learning/chess/ChessTutorial.tsx, src/config/navigation.ts, src/data/math/factory.ts, src/data/math/numbers-0-10.ts, src/data/math/numbers-11-100.ts, src/data/math/numbers100.ts, src/data/math/upgrades.ts, … | 🟡 Cần audit phần liệt kê |
| 2026-10-17 20:10 | Không có thay đổi mã nguồn | ✅ Sạch |
| 2026-10-17 20:44 | Không có thay đổi mã nguồn | ✅ Sạch |
| 2026-10-17 20:46 | src/components/learning/chess/ChessScreen.tsx, src/App.tsx, src/components/home/HomeScreen.tsx, src/types/index.ts | 🟡 Cần audit phần liệt kê |
| 2026-10-17 20:48 | tests/lesson-completion.test.ts, src/components/games/LittleScientistGame.tsx, src/components/games/TreasureCodingParts.tsx, src/components/learning/chess/ChessScreen.tsx, src/components/learning/chess/ChessTutorial.tsx, src/components/learning/LessonPlayerModal.tsx, src/config/navigation.ts, src/data/competitionBankTournament.ts, … | 🟡 Cần audit phần liệt kê |
| 2026-10-17 20:58 | src/components/learning/chess/chessEngine.ts, src/components/learning/chess/ChessGame.tsx, src/components/learning/chess/ChessScreen.tsx | 🟡 Cần audit phần liệt kê |
| 2026-10-17 20:59 | src/components/learning/chess/chessEngine.ts, src/components/learning/chess/ChessGame.tsx | 🟡 Cần audit phần liệt kê |
| 2026-10-17 21:03 | src/components/learning/chess/chessEngine.ts, src/components/learning/chess/ChessGame.tsx | 🟡 Cần audit phần liệt kê |
| 2026-10-17 21:24 | src/components/learning/chess/ChessMoveDemo.tsx, src/components/learning/chess/ChessGame.tsx, src/components/learning/chess/ChessScreen.tsx | 🟡 Cần audit phần liệt kê |
| 2026-10-17 21:44 | src/components/learning/englishIoe/EnglishIoeScreen.tsx, src/data/englishIoe/index.ts, src/App.tsx, src/components/home/HomeScreen.tsx, src/components/learning/chess/ChessMoveDemo.tsx, src/types/index.ts | 🟡 Cần audit phần liệt kê |
| 2026-10-17 21:58 | src/components/learning/cotuong/cotuongEngine.ts, src/components/learning/cotuong/CotuongGame.tsx, src/components/learning/cotuong/CotuongScreen.tsx, tests/cotuong-engine.test.ts, src/App.tsx, src/components/home/HomeScreen.tsx, src/components/learning/englishIoe/EnglishIoeScreen.tsx, src/data/englishIoe/index.ts, … | 🟡 Cần audit phần liệt kê |
| 2026-10-17 21:59 | Không có thay đổi mã nguồn | ✅ Sạch |
| 2026-10-17 22:00 | src/components/learning/cotuong/cotuongEngine.ts, src/components/learning/cotuong/CotuongGame.tsx, tests/cotuong-engine.test.ts | 🟡 Cần audit phần liệt kê |
| 2026-10-17 22:01 | Không có thay đổi mã nguồn | ✅ Sạch |
| 2026-10-17 22:33 | Không có thay đổi mã nguồn | ✅ Sạch |
| 2026-10-17 22:44 | tests/english-ioe.test.ts, tests/kidbox-bridge-practice.test.ts, tests/tmp-advisor.test.ts, tests/tmp-probe.test.ts, src/components/english/KidBoxActivityPlayer.tsx, src/components/learning/englishIoe/EnglishIoeScreen.tsx, src/data/englishIoe/index.ts, src/services/kidBoxActivities.ts | 🟡 Cần audit phần liệt kê |
| 2026-10-17 22:45 | Không có thay đổi mã nguồn | ✅ Sạch |
| 2026-10-17 22:53 | src/services/kidBoxActivities.ts, tests/kidbox-bridge-practice.test.ts | 🟡 Cần audit phần liệt kê |
| 2026-10-17 22:55 | Không có thay đổi mã nguồn | ✅ Sạch |
| 2026-10-17 22:55 | Không có thay đổi mã nguồn | ✅ Sạch |
| 2026-10-27 22:18 | src/components/auth/AccountModal.tsx, src/components/auth/AuthButton.tsx, src/data/englishSkillTaxonomy.ts, src/services/cloudSync.ts, src/services/englishAdaptiveEngine.ts, src/services/englishMasteryEngine.ts, src/services/englishMasteryStore.ts, src/services/firebase.ts, … | 🟡 Cần audit phần liệt kê |
| 2026-10-28 07:29 | src/components/learning/chess/chess3d/Chess3DCanvas.tsx, src/components/learning/chess/chess3d/boardBuilder.ts, src/components/learning/chess/chess3d/pieceGeometries.ts, tests/chess-3d.test.ts, src/App.tsx, src/components/achievements/AchievementsGardenScreen.tsx, src/components/challenge/WeeklyChallengeScreen.tsx, src/components/common/Header.tsx, … | 🟡 Cần audit phần liệt kê |
| 2026-10-28 07:41 | src/components/auth/AccountModal.tsx, src/components/auth/AuthButton.tsx, src/components/auth/CloudSyncBanner.tsx, src/services/cloudSync.ts, src/services/firebase.ts, tests/firebase-auth-sync.test.ts, src/components/common/Header.tsx, src/components/home/HomeScreen.tsx, … | 🟡 Cần audit phần liệt kê |
| 2026-10-29 10:38 | src/components/auth/AccountModal.tsx, src/components/learning/chess/ChessGame.tsx, src/components/learning/chess/chess3d/Chess3DCanvas.tsx, src/components/learning/chess/chess3d/boardBuilder.ts, tests/chess-3d.test.ts | 🟡 Cần audit phần liệt kê |
| 2026-10-29 10:46 | src/components/learning/chess/chess3d/Chess3DCanvas.tsx, src/components/learning/chess/chess3d/boardBuilder.ts, src/components/learning/chess/chess3d/pieceGeometries.ts, src/services/cloudSync.ts, tests/firebase-auth-sync.test.ts | 🟡 Cần audit phần liệt kê |
| 2026-10-29 10:50 | src/components/auth/AccountModal.tsx, src/components/learning/chess/chess3d/pieceGeometries.ts | 🟡 Cần audit phần liệt kê |
