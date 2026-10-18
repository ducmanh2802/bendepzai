# T18A — Hệ thống động lực, phần dữ liệu & logic (REPORT)

**Nhánh:** `p42/T18A` · **Ngày:** 2026-10-15 · **Chế độ:** auto-runner không giám sát (mọi quyết định dưới đây do OpenCode tự đưa ra).

## 1. Đã làm gì

Triển khai đầy đủ mục 1–6 spec T18 ở tầng **dữ liệu + engine + storage**, chưa làm giao diện lớn (để T18B/T18C):

| Hạng mục (spec) | Trước | Sau |
|---|---|---|
| Sticker (§1) | không có | **60 sticker / 6 bộ × 10** (Con Vật Quanh Em, Món Ngon Ngày Tết, Xe Cộ Vui Nhộn, Vũ Trụ Diệu Kỳ, Khủng Long, Nghề Nghiệp), hiếm 6/3/1 mỗi bộ; máy gắp 1 vé/lượt, **không trùng tới khi đủ bộ** |
| Level bé (§2) | không có | **XP → level 1–50** (đường cong nhẹ, level 2 ≈ 40 XP), **10 danh hiệu** Thám Hiểm Nhí → Trạng Nguyên Nhí, quà mỗi level (sao + vé + lượt gắp), nhận 1 lần |
| Nhiệm vụ ngày (§3) | 5 quest cố định | **pool 31 quest**, mỗi ngày **3 học (ưu tiên môn yếu, tất định theo `localDateKey`) + 1 vui**; rương ngày giữ nguyên thưởng |
| Chuỗi ngày (§4) | streak số đơn | lịch `streakDays` + **`shieldedDays` + 1 khiên/tuần tự động** (tối đa 2), nghỉ đúng 1 ngày thì khiên vỡ thay bé |
| Shop (§5) | 12 món, 5 loại | **43 món, 7 loại** (thêm nền trang chủ, khung avatar), **món mở theo level** (1–20); sao mua Shop, vé gắp sticker; giữ nguyên 12 món cũ (id/giá) |
| Thành tựu (§6) | 8 cái | **35 cái, mỗi cái có rule `{stat, atLeast}`** chấm trên ảnh chụp số liệu thật, test trực tiếp được |
| Storage | schema P42-v1 | **schema P42-v2** + key riêng `kho_bau_motivation` + sanitizer cho mọi field mới; **không mất sao/vé/đồ/cày cũ** |

## 2. File thay đổi

**Mới (data):**
- `src/types/motivation.ts` — `Sticker(Set/Rarity)`, `ShopItem(+minLevel)`, `QuestPoolEntry`, `DailyQuestType` (15 loại), `QuestEvent(Kind)`, `MotivationState/Daily`, `MotivationStats`, `AchievementRule`.
- `src/data/stickers.ts` — 60 sticker + 6 bộ (độ hiếm 6/3/1).
- `src/data/shopCatalog.ts` — 43 món (giữ nguyên 12 món cũ).
- `src/data/questPool.ts` — 31 quest (giữ nguyên 5 id cũ để tiến trình đã lưu không mất).
- `src/data/achievementCatalog.ts` — 35 thành tựu (giữ nguyên 8 cũ: id/tiêu đề/thưởng).

**Mới (engine, thuần hàm số, không chạm localStorage):**
- `src/services/levelEngine.ts` — `xpForLevel/xpToLevel/levelTitle/levelProgress/rewardForLevel/pendingLevels`.
- `src/services/stickerEngine.ts` — `drawSticker` (rng truyền vào, test tất định), đếm bộ/hoàn thành bộ.
- `src/services/questEngine.ts` — `selectDailyQuests` (FNV-1a + mulberry32, tất định), `applyQuestEvent`, `questTypesForEvent`.
- `src/services/streakEngine.ts` — `touchStreakDay/countStreak/weekKeyOf` (khiên lấp ngày nghỉ, chuỗi đếm ngày HỌC).
- `src/services/achievementEngine.ts` — `evaluateNewAchievements/xpForUnlocks`.
- `src/services/shopEngine.ts` — `canBuyShopItem/visibleShopItems`.

**Sửa:**
- `src/types/index.ts` — `DailyQuest.type` dùng `DailyQuestType`; `AvatarItem.type` dùng `ShopItemType` + `minLevel?`; `equipped` thêm `background/frame`; re-export `motivation`.
- `src/services/storage.ts` — schema **P42-v2** (+migration no-op cho Learning OS store vì kho động lực ở key riêng); `AVATAR_SHOP_ITEMS`/`INITIAL_ACHIEVEMENTS` lấy từ catalog; quest ngày chọn qua engine (giữ tiến trình đã lưu trong ngày, loại quest lạ); `getAchievements` merge (trạng thái cũ theo id + thành tựu mới ở dạng khoá); streak tích hợp khiên (nghỉ đúng 1 ngày + còn khiên → chuỗi +1); `recordQuestEvent` trung tâm + đấu nối vào `completeLesson/recordTierReward/recordGamePlayed/recordQuestionAnswer/recordDailyReviewCompleted/recordWeeklyChallengeCompleted/saveReadingMetrics/setTreeWateredDate/claimTopicChest`; API mới `drawGacha/claimLevelRewards/buyShopItem/claimDailyChest/recordReviewQuestions/recordDressUp/getLevelInfo/getMotivationState/buildMotivationStats`; `resetProgress` xoá thêm key động lực.
- `src/components/review/DailyReviewScreen.tsx` — bỏ khối tự cộng quest trùng (giờ `recordDailyReviewCompleted` + `recordReviewQuestions` làm qua engine).
- `src/components/home/HomeScreen.tsx` — rương ngày qua `claimDailyChest` (thưởng y hệt +10 sao/+50 XP, thêm đếm rương + quest vui).
- `tests/game-rewards.test.ts` — **chỉ thêm setup ghim quest** (`quest_game` legacy) trong `beforeEach` khối T02/B2; mọi assertion giữ nguyên (xem §4 quyết định 3).
- `tests/t18a-motivation.test.ts` — **28 test mới** (catalog, NFC + từ cấm, level, quest tất định/ưu tiên yếu, khiên, gacha không trùng, rule thành tựu, migration, sanitizer thù địch, API mua/nhận/gắp).

**Không thêm dependency npm nào.**

## 3. Lệnh đã chạy + kết quả

- `npm run typecheck` — **PASS** (lỗi trung gian: thiếu 4 `DailyQuestType` mới + `QuestEventKind 'weekly'` + import `SHOP_CATALOG` — đã sửa hết).
- `npm test` — **PASS 679/679** (trước: 651; +28 mới). Trung gian rớt 3 test `game-rewards` (xem §4.3) rồi xanh lại sau khi ghim quest setup.
- `npm run build` — **PASS**.
- `node scripts/check-bundle-budget.mjs` — **PASS, main 430.8 kB** (ngân sách 600 kB, đạt mục tiêu 450 kB).
- `npx vitest run tests/bundle-budget.test.ts tests/sw-precache.test.ts` (dist mới) — **PASS 6/6**.
- Browser QA: `node qa/run-one.mjs qa/t02-smoke.mjs` — **SKIPPED** (timeout ở `button "Chơi ngay"`, script từ thời T02 đã lệch UI hiện tại; diff T18A không đổi label/nút nào — xem `git diff --stat` — nên không liên quan phạm vi task).

## 4. Quyết định tự đưa ra (không ai xác nhận, ghi để T18B/C và reviewer kiểm)

1. **Kho động lực ở key riêng** (`kho_bau_motivation`), không nhét vào `ChildProfile`: payload cũ không cần migration phức tạp, migration P42-v2 của Learning OS store là no-op, sanitizer dựng mặc định. Rủi ro: 2 key phải đọc cùng lúc trong `getChildProfile` (đã tránh vòng lặp: motivation store không gọi ngược quest/achievement).
2. **Chuỗi đếm NGÀY HỌC, khiên chỉ "lấp" ngày nghỉ** (không +1): test đầu viết kỳ vọng streak=3 sau khiên nhưng engine đếm 1 vì ngày nghỉ không có trong lịch — đó là **lỗi thiết kế thật**, đã sửa bằng `shieldedDays` (ngày được khiên lấp cho chuỗi đi qua nhưng không tăng số). Storage cũng lấp ngày nghỉ tương ứng.
3. **Ghim quest trong setup 3 test `game-rewards` thay vì giữ quest cố định trong production**: test cũ giả định quest luôn có `quest_game` target-1; task T18A bắt buộc xoay vòng 3+1 nên giả định đó hết hiệu lực. Mọi assertion giữ nguyên 100% — chỉ cố định ambient state để test hermetic (thực tế còn chắc hơn trước vì không còn phụ thuộc ngày chạy).
4. **Quest combo/correct/review_5q đọc từ `MotivationDaily` (gauge)**, quest còn lại +1/sự kiện: chống double-count khi sự kiện bắn nhiều lần; hoàn thành quest trao thưởng đúng 1 lần (test).
5. **Kinh tế gacha**: 1 vé/lượt, tối đa 5 lượt/ngày (`MAX_GACHA_PER_DAY`; phụ huynh chỉnh chi tiết ở T18C), trùng tới khi đủ 60 mới cho trùng, cứ 5 sticker trùng +2 sao an ủi. Không có tiền thật, offline hoàn toàn.
6. **Đường cong level** `40·(L-1)^1.55`: L2 ≈ 40 XP (~1 bài — "level đầu nhanh"), L50 ≈ 16.7k XP (mục tiêu dài hạn). Quà: sao `2+floor(L/5)`, vé mỗi level chia hết cho 5, lượt gắp mỗi level chia hết cho 3.
7. **Dữ liệu mua trước T18A không truy vết được** (`shopBoughtTotal`, `starsEarnedTotal`, `storiesReadTotal`... bắt đầu đếm từ T18A; riêng `starsEarnedTotal`/`chestsOpened` có sàn = số dư/số rương hiện tại để bé cũ không thiệt). Tab Shop UI giữ 5 loại cũ — 2 loại mới (nền/khung) mua được qua engine, UI trưng ở T18C.
8. **Chữ nội dung**: tự kiểm NFC + `containsBannedWord` trên >150 chuỗi trong test; dấu theo SGK mới (hoà/khoẻ); British English không áp dụng ở đây (toàn tiếng Việt); `questionAutoplay` không đụng.

## 5. Việc còn tồn (cho T18B/T18C)

- UI: Album sticker (trang lật), màn Level-up + thanh XP Header, lịch chuỗi ngày (dấu chân Gấu, mốc 3/7/14/30), Shop hiển thị mặc lên Mascot (nền/khung), màn ăn mừng đủ bộ sticker.
- Phụ huynh (§7 spec gốc): giới hạn lượt gắp/ngày, bật/tắt thưởng, lịch sử thưởng (engine đã nhận `maxDrawsPerDay` qua tham số, storage chờ setting).
- Rương nhiệm vụ ngày "sao + 30% sticker": engine `drawSticker` sẵn, UI T18B gọi khi mở rương.
- Browser QA script `t02-smoke` đã lệch UI (timeout nút "Chơi ngay") — T20A nên cập nhật script, ngoài phạm vi T18A.
