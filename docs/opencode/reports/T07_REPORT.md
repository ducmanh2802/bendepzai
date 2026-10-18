# T07 â€” MĂ n mĂ´n há»c thĂ nh "Con Ä‘Æ°á»ng phiĂªu lÆ°u" + báº£n Ä‘á»“ tháº¿ giá»›i â€” BĂO CĂO

## Tá»•ng quan
ÄĂ£ triá»ƒn khai task T07: `SubjectScreen` thĂ nh con Ä‘Æ°á»ng phiĂªu lÆ°u vá»›i nĂºt bĂ i há»c 72px trĂªn SVG path zig-zag, tráº¡ng thĂ¡i Ä‘Ă£ xong/Ä‘ang há»c/khoĂ¡, popup bĂ i há»c, rÆ°Æ¡ng kho bĂ¡u cuá»‘i cháº·ng, tá»± cuá»™n Ä‘áº¿n bĂ i Ä‘ang há»c; `WorldMapScreen` thĂ nh báº£n Ä‘á»“ cuá»™n ngang vá»›i Ä‘Æ°á»ng cháº¥m ná»‘i cĂ¡c Ä‘áº£o, Gáº¥u Ä‘á»©ng á»Ÿ vĂ¹ng gáº§n nháº¥t, huy hiá»‡u % hoĂ n thĂ nh. Storage thĂªm `lessonStars`, `chestState`, `unlockAllLessons` + sanitizer/migration + test. QA scripts Ä‘Ă£ migrate tá»« nĂºt "VĂ o há»c" sang lesson-button + "Báº¯t Ä‘áº§u".

## File thay Ä‘á»•i

### 1. File sá»­a Ä‘á»•i
- **src/components/subject/SubjectScreen.tsx** â€” Adventure path: SVG zig-zag, nĂºt bĂ i 72px, tráº¡ng thĂ¡i sao/khoĂ¡/Ä‘ang há»c, popup (tĂªn bĂ i, sá»‘ cĂ¢u, thÆ°á»Ÿng, loa, Báº¯t Ä‘áº§u), rÆ°Æ¡ng theo chá»§ Ä‘á», tá»± cuá»™n, Kid's Box entry giá»¯ nguyĂªn.
- **src/components/world/WorldMapScreen.tsx** â€” Báº£n Ä‘á»“ kĂ©o/vuá»‘t (scroll-snap), Ä‘Æ°á»ng cháº¥m ná»‘i cĂ¡c Ä‘áº£o, 6 vĂ¹ng Ä‘áº£o, huy hiá»‡u % hoĂ n thĂ nh, Gáº¥u Ä‘á»©ng táº¡i vĂ¹ng gáº§n nháº¥t.
- **src/services/storage.ts** â€” ThĂªm `lessonStars`, `chestState`, `unlockAllLessons`; sanitizer/migration; `completeLesson` ghi sao; `claimTopicChest`.
- **src/types/index.ts** â€” ThĂªm field vĂ o `ChildProfile`.
- **src/services/demoSeed.ts** â€” Seed dá»¯ liá»‡u demo sĂ¡t thá»±c cho cĂ¡c field má»›i.
- **src/components/parent/ParentDashboardModal.tsx** â€” Toggle phá»¥ huynh "Má»Ÿ khoĂ¡ táº¥t cáº£ bĂ i há»c".
- **qa/*.mjs** â€” Migrate click "VĂ o há»c" sang `lesson-button-*` + "Báº¯t Ä‘áº§u"; Ä‘áº¿m lesson theo data-testid.

### 2. File má»›i
- **tests/t07-subject-path.test.ts** â€” 5 test migration/sanitizer/stars/chest/unlock.

## Kiá»ƒm thá»­
| Lá»‡nh | Káº¿t quáº£ |
|------|---------|
| `npm run typecheck` | âœ… PASS |
| `npm test` (599 tests) | âœ… PASS |
| `npm run build` | âœ… PASS |

## Quyáº¿t Ä‘á»‹nh tá»± Ä‘Æ°a ra
1. Unlock all lessons lÆ°u trong `ChildProfile.unlockAllLessons`, expose toggle trong Parent dashboard.
2. RÆ°Æ¡ng thÆ°á»Ÿng 3 sao (sticker hook cho T18).
3. WorldMap % hoĂ n thĂ nh cho mĂ´n chĂ­nh + game; cĂ¡c vĂ¹ng tiá»‡n Ă­ch hiá»ƒn thá»‹ badge 0%.
4. QA script focus dialog dĂ¹ng popup thay cho LessonPlayerModal.

## Viá»‡c cĂ²n tá»“n
1. Tinh chá»‰nh responsive/overflow thá»±c táº¿ trĂªn trĂ¬nh duyá»‡t khi QA Ä‘Æ°á»£c cháº¡y.
2. Sticker/economy hook T18.

## Commit
```bash
git add -A
git commit -m "feat(T07): con Ä‘Æ°á»ng phiĂªu lÆ°u + báº£n Ä‘á»“ tháº¿ giá»›i + storage"
```

---
*BĂ¡o cĂ¡o táº¡o tá»± Ä‘á»™ng theo quy trĂ¬nh P42 auto-runner.*
