# P43 — Session state (lưu trữ để mất phiên không mất thông tin)

**Nhánh:** `p42/P43` (tạo từ HEAD p42/T20B + baseline P41)
**Bắt đầu:** 2026-10-17 10:45

## Việc đã xong (có bằng chứng)

### 3 bug P0 (từ docs/AUDIT_REPORT.md) — ĐÃ SỬA
| ID | Nguyên nhân | Sửa | Test |
|---|---|---|---|
| P0-1 ordering luôn chấm sai | `answerCheck.ts` đòi `Array.isArray(correct)` nhưng data lưu `'a\|b\|c'` | nhận cả chuỗi pipe cho đáp án chuẩn + đáp án người dùng (helper `toPipeText`) | +4 test trong `tests/answerCheck.test.ts` |
| P0-2 fatigue kẹt vĩnh viễn | chỉ có `+= 1`, không reset | `resetStaleFatigue()` (hàm thuần, learningOS.ts) + hằng `FATIGUE_SESSION_GAP_MS = 30p`; reset khi: load store, và trước mỗi evidence mới; reset theo gap VN-time HOẶC đổi ngày | `tests/fatigue-reset.test.ts` 7/7 |
| P0-3 Word Safari không thể thắng | `buildGameActivity` đánh dấu TẤT CẢ item `isCorrect:true` → TAPS bắt bắt cả lưới | đúng 1 target isCorrect, vị trí target xác định nhưng không cố định (hashSeed) | cập nhật test `kidbox-learning-os.test.ts` (khẳng định 1 đáp án + decoy) |

**Verify 2026-10-17 10:52:** `npm run typecheck` PASS · `npm test` 59 files / **881 PASS** · `npm run build` PASS (main chunk 446 kB ≤ 450 kB).

## 3 tính năng = mục tiêu 1-2-3 trong docs/p41.md (đã chốt với người dùng)

1. **Font & ký hiệu Toán học** — rà soát toàn bộ data/màn Toán: dấu trừ phải là `−`(U+2212) không phải ASCII `-`; không mojibake; nhất quán; grading chấp nhận cả 2 dạng; regression test.
2. **Chính tả khớp hình/đáp án/âm-vần** — validator tái dùng được: câu hỏi vần/âm-đầu phải khớp đáp án; correctAnswer ∈ options; thiếu orderingItems/matchingPairs/mediaEmoji → báo; chạy trên toàn bộ ngân hàng rồi sửa mục sai thật.
3. **Rà soát toàn app** — gate test vĩnh viễn `tests/p41-content-gates.test.ts`: 0 mojibake, ID không trùng, ký hiệu Toán, font chain; chạy full suite + (best-effort) probe trình duyệt 375×667.

## Trạng thái file

- Đã sửa: `src/services/answerCheck.ts`, `src/services/learningOS.ts`, `src/services/storage.ts`, `src/services/kidBoxActivities.ts`
- Test: `tests/answerCheck.test.ts`, `tests/kidbox-learning-os.test.ts`, `tests/fatigue-reset.test.ts` (mới)
- Chưa commit (chờ xong 3 tính năng rồi commit 1 lần, chỉ add file của P43)
- Cẩn thận: cây có sẵn thay đứng của lane khác (P41 persona/mojibake baseline) — KHÔNG đụng, KHÔNE commit chung.
