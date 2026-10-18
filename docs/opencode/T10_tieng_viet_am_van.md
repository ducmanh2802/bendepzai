# T10 — Tiếng Việt: âm, chữ ghép và TOÀN BỘ vần lớp 1

**Phụ thuộc:** T05. **Nhánh:** `p42/T10` · Chạy song song được với T11, T12, T13 (worktree riêng).
**File chính:** `src/data/vietnameseCurriculum.ts` (có thể tách thành `src/data/vietnamese/*.ts` rồi gộp vào `VIETNAMESE_TOPICS_RAW`).

## Hiện trạng
12 chủ đề / 20 bài / 62 câu; mỗi bài 2–6 câu. Vần chỉ có an/at, on/ot, am/ap.

## Nội dung cần thêm (theo trình tự SGK Tiếng Việt 1 – GDPT 2018)
1. **Chữ cái & âm đơn:** đủ 29 chữ cái (a ă â b c d đ e ê g h i k l m n o ô ơ p q r s t u ư v x y) theo nhóm 4–5 chữ/bài.
2. **Dấu thanh:** ngang, huyền, sắc, hỏi, ngã, nặng (nhận biết + đặt dấu đúng chữ).
3. **Chữ ghép:** ch, nh, ph, th, kh, gh, gi, ng/ngh, qu, tr + quy tắc c/k, g/gh, ng/ngh.
4. **Vần** (mỗi bài 2–3 vần, ≥ 25 bài): am ap, ăm ăp, âm âp, om op, ôm ôp, ơm ơp, em ep, êm êp, im ip, um up, an at, ăn ăt, ân ât, on ot, ôn ôt, ơn ơt, en et, ên êt, in it, un ut, ưt, ang ac, ăng ăc, âng âc, ong oc, ông ôc, ung uc, ưng ưc, anh ach, ênh êch, inh ich, ai ay ây, oi ôi ơi, ui ưi, ao eo, au âu êu, iu ưu, ia ua ưa, iêc iên iêp iêt iêu iêm, yêu yên, uôc uôn uôt uôi uông, ươc ươn ươt ươi ương ươu, oa oe, oai oay, oan oat, oăn oăt, oang oac, oanh oach, uê uy, uân uât, uyên uyêt, uych uynh.
5. **Từ – câu:** ghép tiếng thành từ, sắp xếp câu 4–6 chữ, điền từ vào câu, chọn câu đúng với tranh.
6. **Chính tả nhỏ:** c/k, g/gh, ng/ngh (lớp 1); dấu chấm, viết hoa đầu câu.

## Yêu cầu chất lượng
- **Mỗi bài ≥ 10 câu**, trộn ≥ 3 loại câu (multiple-choice, image-choice, fill-blank gõ chữ, matching, ordering, true-false, audio-choice). Độ khó 1/2/3 ≈ 40/40/20%.
- Mỗi câu có `audioPrompt` (đọc được rõ), `hint`, `explanation` ngắn bằng lời trẻ hiểu; `mediaEmoji` đúng nghĩa.
- Từ vựng gần gũi (gia đình, trường, con vật, đồ ăn, thiên nhiên). Không từ cấm (`contentSafety.ts`).
- Distractor là lỗi trẻ hay gặp (nhầm dấu, nhầm vần gần: an/ang, at/ac, n/ng).
- Bài cũ: nâng mỗi bài lên ≥ 10 câu, KHÔNG đổi `id` bài/câu cũ (giữ tiến độ).
- Cập nhật `docs/CURRICULUM_MAP.md`.

## Nghiệm thu
- Bảng số liệu: chủ đề / bài / câu / phân bố loại câu / độ khó — mục tiêu **≥ 45 bài, ≥ 450 câu**.
- Test: `tests/vietnamese-curriculum.test.ts` mở rộng (mỗi bài ≥ 10 câu, đủ danh sách vần ở mục 4, đáp án ∈ options, NFC, không trùng id, không từ cấm).
- typecheck + test + build PASS.
