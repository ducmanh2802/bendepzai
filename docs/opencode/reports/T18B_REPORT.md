# T18B — Hệ thống động lực: Album Sticker, Máy Gắp, Lên Level, Lịch Chuỗi Ngày

## Tóm tắt
Đã triển khai đầy đủ giao diện cho 4 thành phần chính của hệ thống động lực (theo T18A engine):

1. **Album Sticker** (`sticker_album`) — Trang lật 6 bộ, ô trống in bóng, hoàn thành bộ → huy hiệu + Gấu ăn mừng
2. **Máy Gắp Sticker** (`gacha_machine`) — 1 vé/lượt, không trùng tới khi đủ 60, tối đa 5 lượt/ngày, sticker trùng 5 cái tặng 2 sao an ủi
3. **Màn chúc mừng lên Level** (`LevelUpCelebrationModal`) — Tự động hiện khi có level pending, hiển thị sao/vé/sticker thưởng, Gấu Bút Chì ăn mừng
4. **Lịch Chuỗi Ngày** (`streak_calendar`) — Lịch tháng hiển thị dấu chân Gấu, khiên giữ chuỗi, mốc 3/7/14/30 ngày có quà

## File thay đổi / tạo mới

### Tạo mới
| File | Mô tả |
|------|-------|
| `src/components/motivation/StickerAlbumScreen.tsx` | Màn Album 6 bộ × 10 sticker, flip trang, progress bar, modal hoàn thành bộ |
| `src/components/motivation/GachaMachineScreen.tsx` | Máy gắp trực quan, claw animation, lịch sử 10 lượt gần, modal kết quả |
| `src/components/motivation/LevelUpCelebrationModal.tsx` | Modal ăn mừng level up, hiển thị danh hiệu mới, phần thưởng, Gấu bounce |
| `src/components/motivation/StreakCalendarScreen.tsx` | Lịch tháng Việt Nam, dấu chân 🐾, khiên 🛡️, mốc thưởng, legend |

### Sửa đổi
| File | Thay đổi |
|------|----------|
| `src/types/index.ts` | Thêm `'sticker_album' \| 'gacha_machine' \| 'streak_calendar'` vào `ActiveScreen` |
| `src/App.tsx` | Lazy-load 4 component mới, hook `LevelUpCelebrationModal` tự check `pendingLevels` khi `profile.xp` thay đổi |
| `src/components/home/HomeScreen.tsx` | Thêm section "Hệ Thống Động Lực" 3 nút: Album 📚, Máy Gắp 🎰, Lịch Chuỗi 📅 |

## Kiểm thử

| Lệnh | Kết quả |
|------|---------|
| `npm run typecheck` | ✅ PASS (0 errors) |
| `npm test` | ✅ 735 tests passed (46 files) |
| `npm run build` | ✅ Built in 1.65s, chunks lazy-loaded đúng |

Kích thước chunk mới (gzipped):
- `StickerAlbumScreen`: 2.86 kB
- `GachaMachineScreen`: 3.29 kB
- `StreakCalendarScreen`: 4.09 kB
- `LevelUpCelebrationModal`: 1.78 kB

## Quyết định tự đưa ra

1. **Không thêm dependency mới** — Dùng Tailwind CSS + Lucide React + engine T18A sẵn có.
2. **Navigation** — 3 màn mới KHÔNG thêm vào bottom/top nav (giữ 5 tab theo T06). Truy cập từ HomeScreen section "Hệ Thống Động Lực" — phù hợp trẻ 6-7 tuổi, ít chuyển màn.
3. **LevelUpCelebrationModal** — Dùng `useEffect` watch `profile.xp` trong `App.tsx`, gọi `StorageService.claimLevelRewards()` rồi mở modal. Tránh duplicate claim nhờ `pendingLevels` engine.
4. **Responsive** — Grid `grid-cols-2 md:grid-cols-5` cho Album, `grid-cols-3` cho shortcuts Home, Calendar `grid-cols-7` cố định. Nút ≥ 44px, chữ ≥ 14px.
5. **Accessibility** — `aria-label` đầy đủ, `role="dialog"` cho modal, `data-testid` không cần thêm (chỉ dùng cho nav per quy tắc).
6. **Âm thanh** — Tôn trọng `questionAutoplay`: chỉ `sound.playClick()`/`playLevelUp()` khi user click, không auto-speak nội dung mới.
7. **Sticker trùng an ủi** — Logic đã có trong `StorageService.drawGacha()` (mỗi 5 trùng +2 sao), UI hiển thị rõ trong modal kết quả.
8. **Khiên giữ chuỗi** — UI hiển thị số khiên còn lại, đã dùng, tối đa 2/tuần. Calendar dùng 🛡️ cho ngày khiên, 🐾 cho ngày học.
9. **NFC & Content Safety** — Tất cả text hardcode trong component đã chuẩn NFC, không từ cấm (đã qua test `t18a-motivation.test.ts` catalog check).

## Việc còn tồn / Follow-up (T18C)
- Shop mua đồ bằng sao (mũ, kính, áo, balo, pet, nền, khung) — hiển thị mặc lên Mascot
- Thành tựu ≥ 30 (vườn sao) — UI đã có `AchievementsGardenScreen` từ T08, chỉ cần data T18A
- Phụ huynh: giới hạn lượt gắp/ngày, bật/tắt thưởng, xem lịch sử
- Migration test cho `kho_bau_motivation` key (đã có sanitizer trong `storage.ts`)

## Ghi chú kỹ thuật
- `StickerAlbumScreen`: Dùng `STICKER_SETS` + `getStickersBySet` từ `data/stickers.ts`, state local `currentSetIndex` cho flip trang.
- `GachaMachineScreen`: `requestAnimationFrame` cho animation claw, `StorageService.drawGacha()` cho RNG server-side logic.
- `StreakCalendarScreen`: `parseDateKey`/`localDateKey` từ `dateUtils.ts`, tư duy `isCurrentMonthDay`/`isFuture` boolean để disable button tương lai.
- `LevelUpCelebrationModal`: Lazy-loaded, chỉ render khi `isOpen=true`, nhận `LevelClaimResult` từ storage.

## Commit
```
feat(T18B): Album sticker, máy gắp, level-up modal, lịch chuỗi ngày
```