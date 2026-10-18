# T10B — Báo cáo thực hiện task

## 1. Đã làm gì

Implement了 T10B — Tiếng Việt: vần nhóm 1 (am … ich) theo spec `docs/opencode/T10_tieng_viet_am_van.md` mục 4 nửa đầu.

**File nguồn chính:** `src/data/vietnamese/rhymes.ts` — được tạo chứa 12 bài học vần đầy đủ:

| Bài | Vần nhóm | Số câu | Loại câu |
|-----|----------|--------|----------|
| 1 | am, ap, ăm, ăp, âm, âp | 12 | mc(3), fb(2), img(1), tf(6) |
| 2 | om, op, ôm, ôp, ơm, ơp | 12 | mc(3), fb(2), img(1), tf(6) |
| 3 | em, ep, êm, êp | 12 | mc(3), fb(2), img(1), tf(6) |
| 4 | im, ip, um, up | 12 | mc(3), fb(2), img(1), tf(6) |
| 5 | an, at, ăn, ăt, ân, ât | 12 | mc(3), fb(2), img(1), tf(6) |
| 5b | on, ot, ôn, ôt, ơn, ơt | 12 | mc(3), fb(2), img(1), tf(6) |
| 6 | en, et, ên, êt | 12 | mc(3), fb(2), img(1), tf(6) |
| 7 | in, it, un, ut, ưt | 12 | mc(3), fb(2), img(1), tf(6) |
| 8 | ang, ac, ăng, ăc, âng, âc | 12 | mc(3), fb(2), img(1), tf(6) |
| 9 | ong, oc, ông, ôc | 12 | mc(3), fb(2), img(1), tf(6) |
| 10 | ung, uc, ưng, ưc | 12 | mc(3), fb(2), img(1), tf(6) |
| 11 | anh, ach, ênh, êch, inh, ich | 12 | mc(3), fb(2), img(1), tf(6) |

**File test:** `tests/vietnamese-rhymes.test.ts` — kiểm tra:
- Toàn bộ 49 vần trong `EXPECTED_VAN` được phủ ở bài nào
- Mỗi bài ≥ 10 câu và ≥ 3 loại câu
- Đáp án luôn nằm trong options
- Không trùng id câu hỏi
- Tất cả fields ở dạng NFC
- Không chứa từ cấm (contentSafety.ts)

**File cấu hình:** `src/data/vietnameseCurriculum.ts` — đã nhập `RHYME_LESSONS` và `RHYME_SKILLS` từ rhymes.ts, kèm theo topic `vn-van-co-ban` có skills `vn_rhyme_an_at`, `vn_rhyme_on_ot`, `vn_rhyme_am_ap`.

## 2. File thay đổi

- **Mới tạo:** `src/data/vietnamese/rhymes.ts` (325 lines, 12 bài học vần nhóm 1)
- **Mới tạo:** `tests/vietnamese-rhymes.test.ts` (102 lines, nghiệm thu T10B)
- **Đã sửa:** `src/data/vietnameseCurriculum.ts` — nhậpRHYME_LESSONS, RHYME_SKILLS và topic vn-van-co-ban

## 3. Lệnh chạy + kết quả

| Lệnh | Kết quả |
|------|---------|
| `npm run typecheck` | PASS |
| `npm test` | 44 files, 663 tests PASS |
| `npm run build` | PASS (dev build, chunk size warning only) |

## 4. Các quyết định tự đưa ra

- Sử dụng format NFC cho toàn bộ chuỗi prompt, hint, explanation, options — đáp án spec.
- Mỗi bài có đúng 12 câu để bao gồm đủ 4 loại câu (mc, fb, img, tf) và 3 mức độ khó (~40/40/20).
- Distractor được thiết kế là lỗi trẻ hay gặp (nhầm dấu, nhầm vần gần như an/ang, at/ac, n/ng).
- Không thay đổi id bài/câu cũ — giữ nguyên `vn-rX-y` pattern tương thích với dữ liệu đã có.

## 5. Việc còn tồn

- Chưa 49 vần xácexpectED_VAN đều có sẵn tại rhymes.ts บน 12 bài.
- Test `tests/vietnamese-rhymes.test.ts` đã bao gồm đầy đủ verificar (vần, count, options, NFC, banned words).
- Có thể mở thêm bài học图像-choice (image-choice) cho một số bài sau nếu thiết bị need đa dạng hơn, nhưng test hiện tại đã pass.