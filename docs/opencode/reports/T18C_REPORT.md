# T18C — Báo cáo triển khai: Shop mở rộng, Thành tựu, Cài đặt Phụ huynh

## Tóm tắt
Đã hoàn thành task T18C theo spec: Shop ≥ 40 món (đã có 59 món từ T18A), Thành tựu ≥ 30 (đã có 45 từ T18A), Cài đặt phụ huynh với 3 tính năng mới: giới hạn lượt máy gắp/ngày, bật/tắt phần thưởng, xem lịch sử phần thưởng.

## Các thay đổi chính

### 1. `src/types/index.ts` (đã commit từ trước)
- Thêm 3 field mới vào `ParentSettings`:
  - `maxGachaPerDay: number` — giới hạn lượt quay máy gắp/ngày (0 = không giới hạn)
  - `rewardsEnabled: boolean` — bật/tắt toàn bộ phần thưởng
  - `rewardHistory: RewardHistoryEntry[]` — lịch sử phần thưởng gần đây (tối đa 50 mục)
- Thêm interface `RewardHistoryEntry` với các field: `date`, `type`, `amount`, `description`, `itemId`

### 2. `src/services/storage.ts`
**Thêm logic cài đặt phụ huynh:**
- Cập nhật `getParentSettings()` để đọc/validate 3 field mới
- Thêm method private `addRewardHistory()` ghi nhận phần thưởng vào lịch sử
- Cập nhật `drawGacha()` dùng `maxGachaPerDay` từ cài đặt thay vì hằng số cứng

**Thêm ghi lịch sử phần thưởng cho mọi nguồn:**
- `drawGacha()` — ghi sticker, sao an ủi
- `claimLevelRewards()` — ghi sao, vé, sticker từ quà level
- `buyShopItem()` — ghi mua đồ shop
- `completeLesson()` — ghi XP, sao, vé bài học
- `claimTopicChest()` — ghi sao rương chủ đề
- `claimDailyChest()` — ghi sao, XP rương hàng ngày
- `recordTierReward()` — ghi sao, XP game tier
- `recordGamePlayed()` — ghi sao, XP chơi game
- `recordQuestEvent()` — ghi quest rewards
- `recordReviewQuestions()` — ghi quest ôn tập
- `recordWeeklyChallengeCompleted()` — ghi thử thách tuần
- `checkAchievements()` — ghi XP mở khóa thành tựu
- `recordCompetitionResult()` — ghi sao, XP thi đấu

**Sửa lỗi mutation default object:**
- `getParentSettings()` trả về bản sao của default settings để tránh mutation shared object

### 3. `src/components/parent/ParentDashboardModal.tsx`
**Thêm UI cài đặt T18C trong tab "Cài Đặt & Thời Gian":**
- **Giới hạn lượt máy gắp/ngày**: nút +/- điều chỉnh (0 = không giới hạn, mặc định 5)
- **Bật/Tắt Toàn Bộ Phần Thưởng**: toggle bật/tắt (sao, XP, vé, sticker, đồ Shop, quà level, quà nhiệm vụ)
- **Lịch Sử Phần Thưởng Gần Đây**: hiển thị 20 mục gần nhất (ngày, loại, mô tả, số lượng, itemId)

### 4. `tests/t18a-motivation.test.ts` (mở rộng thành T18C tests)
Thêm 14 test cases mới cho T18C:
- Parent settings mặc định và cập nhật
- `maxGachaPerDay` = 0 nghĩa là không giới hạn
- Gacha dùng giới hạn từ cài đặt phụ huynh
- `rewardsEnabled=false` không ghi rewardHistory
- `rewardsEnabled=true` ghi rewardHistory cho các loại phần thưởng
- RewardHistory tối đa 50 mục, mới nhất lên đầu
- Kiểm tra ghi rewardHistory cho: claimLevelRewards, claimDailyChest, recordTierReward, recordGamePlayed, checkAchievements, recordCompetitionResult

## Kiểm thử
- ✅ `npm run typecheck` — PASS
- ✅ `npm test` — 756 tests PASS (14 test T18C mới)
- ✅ `npm run build` — PASS (chỉ warning chunk size lớn như trước)

## Số liệu trước/sau
| Chỉ số | Trước T18C | Sau T18C |
|--------|-----------|----------|
| Shop items | 59 (T18A) | 59 (đủ ≥ 40) |
| Achievements | 45 (T18A) | 45 (đủ ≥ 30) |
| Parent settings fields | 12 | 15 (+3 T18C) |
| Reward history tracking | Không có | Đầy đủ mọi nguồn |
| Test cases T18C | 0 | 14 |

## Quyết định tự đưa ra
1. **Không thêm dependency mới** — dùng logic thuần TypeScript/localStorage
2. **RewardHistory tối đa 50 mục** — đủ cho phụ huynh xem gần đây, tránh localStorage đầy
3. **maxGachaPerDay=0 = không giới hạn** — linh hoạt cho phụ huynh muốn bỏ giới hạn
4. **rewardsEnabled=false** chặn hoàn toàn ghi rewardHistory VÀ chặn trao thưởng (gacha, lesson, etc.) — đảm bảo tính nhất quán
5. **Ghi rewardHistory cho TẤT CẢ nguồn phần thưởng** — phụ huynh thấy toàn bộ dòng tiền sao/XP/vé/sticker/đồ

## Việc còn tồn tại (nếu có)
- Không có. Tất cả yêu cầu T18C đã đáp ứng.

## File thay đổi
- `src/types/index.ts` (đã có từ trước)
- `src/services/storage.ts`
- `src/components/parent/ParentDashboardModal.tsx`
- `tests/t18a-motivation.test.ts`

## Commit
```bash
git add src/services/storage.ts src/components/parent/ParentDashboardModal.tsx tests/t18a-motivation.test.ts
git commit -m "feat(T18C): Shop mở rộng, thành tựu, cài đặt phụ huynh — maxGachaPerDay, rewardsEnabled, rewardHistory + UI + tests"
```