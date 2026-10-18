import type { Question } from '../../types';
import { vnQ } from './factory';

/**
 * T10A — "Nâng bài cũ" (spec T10 §"Bài cũ"): mỗi bài Tiếng Việt cũ được bổ
 * sung lên ≥ 10 câu, GIỮ NGUYÊN id bài và id câu cũ.
 *
 * Cách làm: mỗi bài cũ nhận thêm một kỹ năng riêng cho phần nâng cấp
 * (`vn_u*` / `vn_un*`). Nhờ vậy bộ quét gần trùng (chỉ so trong cùng
 * subject+skill) chỉ đối chiếu các câu mới với nhau, không đụng tới câu cũ —
 * mà vẫn đảm bảo không có hai đề nào trùng ý trong cùng một bài.
 *
 * File này CHỈ chứa câu hỏi thêm; việc ghép vào bài cũ diễn ra ở
 * `vietnameseCurriculum.ts` (append theo `lesson.id`).
 */

// ---------------------------------------------------------------------------
// Builders — one per question type. `topic` is the owning topic id.
// ---------------------------------------------------------------------------

type Pairs = { left: string; right: string }[];

function qmc(topic: string, id: string, skill: string, d: 1 | 2 | 3, prompt: string, options: string[], correct: string, hint: string, explanation: string): Question {
  return vnQ(topic, { id, skillId: skill, difficulty: d, type: 'multiple-choice', prompt, options, correctAnswer: correct, hint, explanation });
}
function qaudio(topic: string, id: string, skill: string, prompt: string, options: string[], correct: string, hint: string, explanation: string): Question {
  return vnQ(topic, { id, skillId: skill, difficulty: 1, type: 'audio-choice', prompt, options, correctAnswer: correct, hint, explanation });
}
function qimg(topic: string, id: string, skill: string, prompt: string, emoji: string, options: string[], correct: string, hint: string, explanation: string): Question {
  return vnQ(topic, { id, skillId: skill, difficulty: 1, type: 'image-choice', prompt, mediaEmoji: emoji, options, correctAnswer: correct, hint, explanation });
}
function qfb(topic: string, id: string, skill: string, prompt: string, options: string[], correct: string, hint: string, explanation: string): Question {
  return vnQ(topic, { id, skillId: skill, difficulty: 2, type: 'fill-blank', prompt, options, correctAnswer: correct, hint, explanation });
}
function qtf(topic: string, id: string, skill: string, prompt: string, correct: 'Đúng' | 'Sai', hint: string, explanation: string): Question {
  return vnQ(topic, { id, skillId: skill, difficulty: 2, type: 'true-false', prompt, options: ['Đúng', 'Sai'], correctAnswer: correct, hint, explanation });
}
function qmatch(topic: string, id: string, skill: string, prompt: string, pairs: Pairs, hint: string, explanation: string): Question {
  return vnQ(topic, {
    id,
    skillId: skill,
    difficulty: 2,
    type: 'matching',
    prompt,
    options: pairs.map((p) => p.right),
    correctAnswer: pairs.map((p) => `${p.left}=${p.right}`).join('|'),
    matchingPairs: pairs,
    hint,
    explanation,
  });
}
function qorder(topic: string, id: string, skill: string, prompt: string, correct: string[], hint: string, explanation: string): Question {
  return vnQ(topic, {
    id,
    skillId: skill,
    difficulty: 2,
    type: 'ordering',
    prompt,
    options: [...correct].reverse(),
    correctAnswer: correct.join('|'),
    orderingItems: correct,
    hint,
    explanation,
  });
}
function qdd(topic: string, id: string, skill: string, prompt: string, options: string[], buckets: string[], correctBucket: string, hint: string, explanation: string): Question {
  return vnQ(topic, {
    id,
    skillId: skill,
    difficulty: 2,
    type: 'drag-drop',
    prompt,
    options,
    categoryBuckets: buckets,
    correctAnswer: correctBucket,
    hint,
    explanation,
  });
}

// Topic ids (must match vietnameseCurriculum.ts).
const CHU_CAI = 'vn-chu-cai';
const DAU_THANH = 'vn-dau-thanh';
const VAN = 'vn-van-co-ban';
const GHEP_AM = 'vn-ghep-am';
const CHINH_TA = 'vn-chinh-ta';
const TU_VAT = 'vn-tu-va-vat';
const HOAT_DONG = 'vn-hoat-dong';
const XEP_CAU = 'vn-xep-cau';
const DOC_HIEU_1 = 'vn-doc-hieu-1';
const DOC_HIEU_2 = 'vn-doc-hieu-2';
const CHINH_TA_NC = 'vn-chinh-ta-nang-cao';
const KE_CHUYEN = 'vn-ke-chuyen-doc-hieu';
const DANG_BAI = 'vn-cac-dang-bai-moi';

export interface LessonUpgrade {
  /** Skill id that owns the appended questions (unique per lesson). */
  skillId: string;
  questions: Question[];
}

// ---------------------------------------------------------------------------
// vn-les-1 — Chữ A, B, C  (kỹ năng thêm: vn_u1)
// ---------------------------------------------------------------------------

const u1 = 'vn_u1';
const u1Q: Question[] = [
  qmc(CHU_CAI, 'vnu-l1-1', u1, 1, 'Từ “con bò” bắt đầu bằng chữ cái nào?', ['Chữ B', 'Chữ C', 'Chữ D', 'Chữ Đ'], 'Chữ B', 'Đọc to từ rồi nghe âm đầu tiên.', '“con bò” mở đầu bằng chữ B.'),
  qtf(CHU_CAI, 'vnu-l1-2', u1, 'Từ “cái ca” mở đầu bằng chữ C. Đúng hay sai?', 'Đúng', 'Đọc từ và nghe âm đầu.', 'Đúng, “cái ca” mở đầu bằng chữ C.'),
  qimg(CHU_CAI, 'vnu-l1-3', u1, 'Hình con bò mở đầu bằng chữ cái nào?', '🐄', ['Chữ B', 'Chữ D', 'Chữ C', 'Chữ A'], 'Chữ B', 'Gọi tên con vật rồi nghe âm đầu.', 'Con bò mở đầu bằng chữ B.'),
  qfb(CHU_CAI, 'vnu-l1-4', u1, 'Điền chữ cái đầu cho từ “…á” (con cá).', ['c', 'b', 'd', 'k'], 'c', 'Con vật bơi dưới nước.', 'Điền “c” ta được “cá”.'),
  qorder(CHU_CAI, 'vnu-l1-5', u1, 'Sắp xếp ba chữ cái theo thứ tự bảng chữ cái:', ['A', 'B', 'C'], 'Bảng chữ cái bắt đầu bằng a, b, c.', 'Thứ tự đúng: A – B – C.'),
  qaudio(CHU_CAI, 'vnu-l1-6', u1, 'Nghe và chọn chữ cái phát ra âm “bờ”:', ['B', 'C', 'D', 'Đ'], 'B', 'Bấm loa rồi nghe âm đầu.', 'Đó là chữ B.'),
  qmc(CHU_CAI, 'vnu-l1-7', u1, 1, 'Chữ in hoa của “c” là chữ nào?', ['C', 'B', 'D', 'A'], 'C', 'Chữ in hoa và chữ thường cùng tên.', 'Chữ “c” viết hoa là “C”.'),
];

// ---------------------------------------------------------------------------
// vn-les-2 — Chữ O, Ô, Ơ  (kỹ năng thêm: vn_u2)
// ---------------------------------------------------------------------------

const u2 = 'vn_u2';
const u2Q: Question[] = [
  qmc(CHU_CAI, 'vnu-l2-1', u2, 1, 'Chữ nào có dấu mũ nhỏ trên đầu?', ['Ô', 'O', 'Ơ', 'E'], 'Ô', 'Nhìn nét dấu phía trên chữ cái.', 'Chữ Ô có dấu mũ trên đầu.'),
  qtf(CHU_CAI, 'vnu-l2-2', u2, 'Chữ Ơ có thêm một chiếc râu nhỏ bên phải. Đúng hay sai?', 'Đúng', 'Quan sát nét phụ của chữ.', 'Đúng, chữ Ơ có râu nhỏ.'),
  qimg(CHU_CAI, 'vnu-l2-3', u2, 'Hình quả trứng tròn giống chữ cái nào nhất?', '🥚', ['O', 'Ô', 'Ơ', 'A'], 'O', 'Quả trứng tròn xoe.', 'Quả trứng giống chữ O.'),
  qfb(CHU_CAI, 'vnu-l2-4', u2, 'Điền chữ còn thiếu: Cái … (che mưa).', ['ô', 'o', 'ơ', 'a'], 'ô', 'Vật che mưa trên đầu.', 'Điền “ô” ta được “cái ô”.'),
  qorder(CHU_CAI, 'vnu-l2-5', u2, 'Sắp xếp các chữ O, Ô, Ơ theo thứ tự bảng chữ cái:', ['O', 'Ô', 'Ơ'], 'Ba chữ này đứng gần nhau.', 'Thứ tự đúng: O – Ô – Ơ.'),
  qmc(CHU_CAI, 'vnu-l2-6', u2, 1, 'Từ “cái ô” có chứa chữ cái nào?', ['Chữ Ô', 'Chữ O', 'Chữ Ơ', 'Chữ A'], 'Chữ Ô', 'Đọc từ rồi tìm chữ có mũ.', '“cái ô” chứa chữ Ô.'),
  qaudio(CHU_CAI, 'vnu-l2-7', u2, 'Nghe và chọn chữ cái vừa đọc:', ['Ơ', 'O', 'Ô', 'Â'], 'Ơ', 'Chữ này có râu nhỏ.', 'Đó là chữ Ơ.'),
];

// ---------------------------------------------------------------------------
// vn-les-2b — Ghép chữ in hoa với chữ thường  (kỹ năng thêm: vn_u2b)
// ---------------------------------------------------------------------------

const u2b = 'vn_u2b';
const u2bQ: Question[] = [
  qmc(CHU_CAI, 'vnu-l2b-1', u2b, 1, 'Chữ in hoa “A” đi cùng chữ thường nào?', ['a', 'ă', 'â', 'b'], 'a', 'Hai chữ cùng tên gọi.', 'A ghép với a.'),
  qmc(CHU_CAI, 'vnu-l2b-2', u2b, 1, 'Bé tìm chữ thường của chữ in hoa “D”:', ['d', 'đ', 'b', 'p'], 'd', 'Chú ý chữ có gạch ngang.', 'D ghép với d.'),
  qtf(CHU_CAI, 'vnu-l2b-3', u2b, 'Chữ in hoa và chữ thường của cùng một chữ cái đọc giống nhau. Đúng hay sai?', 'Đúng', 'Đọc tên chữ cái, không nhìn hình dáng.', 'Đúng, chúng cùng một chữ cái.'),
  qmatch(CHU_CAI, 'vnu-l2b-4', u2b, 'Nối chữ in hoa với chữ thường của nó:', [
    { left: 'Đ', right: 'đ' },
    { left: 'E', right: 'e' },
    { left: 'G', right: 'g' },
  ], 'Chữ in hoa và chữ thường cùng tên.', 'Đ–đ, E–e, G–g.'),
  qimg(CHU_CAI, 'vnu-l2b-5', u2b, 'Chữ in hoa trong hình là chữ gì?', '🅰️', ['A', 'B', 'D', 'E'], 'A', 'Đọc chữ in hoa trong ô vuông.', 'Đó là chữ A.'),
  qfb(CHU_CAI, 'vnu-l2b-6', u2b, 'Viết chữ thường của chữ in hoa “B”: …', ['b', 'd', 'p', 'q'], 'b', 'Chữ thường nhỏ hơn nhưng cùng tên.', 'Chữ thường của B là b.'),
  qmc(CHU_CAI, 'vnu-l2b-7', u2b, 2, 'Chữ “đ” là chữ thường của chữ in hoa nào?', ['Đ', 'D', 'B', 'P'], 'Đ', 'Tìm chữ in hoa có gạch ngang.', '“đ” là chữ thường của Đ.'),
  qtf(CHU_CAI, 'vnu-l2b-8', u2b, 'Chữ in hoa “P” ghép với chữ thường “q”. Đúng hay sai?', 'Sai', 'So sánh tên gọi hai chữ.', 'Sai, P ghép với p.'),
];

// ---------------------------------------------------------------------------
// vn-les-3 — Dấu huyền và dấu sắc  (kỹ năng thêm: vn_u3)
// ---------------------------------------------------------------------------

const u3 = 'vn_u3';
const u3Q: Question[] = [
  qmc(DAU_THANH, 'vnu-l3-1', u3, 1, 'Từ “cá” mang dấu thanh gì?', ['Dấu sắc', 'Dấu huyền', 'Dấu hỏi', 'Dấu nặng'], 'Dấu sắc', 'Dấu này là nét xiên phải.', '“cá” mang dấu sắc.'),
  qtf(DAU_THANH, 'vnu-l3-2', u3, 'Từ “gà” mang dấu huyền. Đúng hay sai?', 'Đúng', 'Đọc từ và nghe giọng xuống.', 'Đúng, “gà” mang dấu huyền.'),
  qimg(DAU_THANH, 'vnu-l3-3', u3, 'Hình con cá ứng với tiếng nào?', '🐟', ['cá', 'cà', 'cả', 'cạ'], 'cá', 'Gọi tên con vật trong hình.', 'Hình con cá ứng với “cá”.'),
  qfb(DAU_THANH, 'vnu-l3-4', u3, 'Thêm dấu sắc cho “ca” ta được tiếng: …', ['cá', 'cà', 'cả', 'cạ'], 'cá', 'Dấu thanh đặt trên chữ a.', 'ca thêm dấu sắc thành cá.'),
  qmc(DAU_THANH, 'vnu-l3-5', u3, 2, 'Tiếng nào dưới đây mang dấu huyền?', ['cà', 'cá', 'cả', 'cạ'], 'cà', 'Tìm nét xiên trái trên chữ cái.', '“cà” mang dấu huyền.'),
  qaudio(DAU_THANH, 'vnu-l3-6', u3, 'Nghe và chọn tiếng mang dấu sắc:', ['lá', 'là', 'lả', 'lạ'], 'lá', 'Nghe giọng cao và nhẹ.', '“lá” mang dấu sắc.'),
  qmc(DAU_THANH, 'vnu-l3-7', u3, 2, 'Thêm dấu huyền vào “ga” ta được tiếng nào?', ['gà', 'gá', 'gã', 'gạ'], 'gà', 'Dấu huyền là nét xiên trái.', 'ga thêm dấu huyền thành gà.'),
];

// ---------------------------------------------------------------------------
// vn-les-4 — Dấu hỏi, ngã và nặng  (kỹ năng thêm: vn_u4)
// ---------------------------------------------------------------------------

const u4 = 'vn_u4';
const u4Q: Question[] = [
  qmc(DAU_THANH, 'vnu-l4-1', u4, 1, 'Dấu thanh nào nằm dưới chân chữ cái?', ['Dấu nặng', 'Dấu hỏi', 'Dấu ngã', 'Dấu sắc'], 'Dấu nặng', 'Ví dụ: mẹ, vẹt, nụ.', 'Dấu nặng nằm dưới chân chữ.'),
  qmc(DAU_THANH, 'vnu-l4-2', u4, 1, 'Tiếng “vẽ” mang dấu thanh gì?', ['Dấu ngã', 'Dấu hỏi', 'Dấu nặng', 'Dấu huyền'], 'Dấu ngã', 'Bé dùng bút màu để làm việc này.', '“vẽ” mang dấu ngã.'),
  qtf(DAU_THANH, 'vnu-l4-3', u4, 'Tiếng “vẹt” mang dấu nặng. Đúng hay sai?', 'Đúng', 'Con chim nhỏ hay bắt chước tiếng người.', 'Đúng, “vẹt” mang dấu nặng.'),
  qfb(DAU_THANH, 'vnu-l4-4', u4, 'Thêm dấu hỏi cho “ho” ta được tiếng: …', ['hỏ', 'hõ', 'họ', 'hò'], 'hỏ', 'Nét dấu cong như lưỡi câu.', 'ho thêm dấu hỏi thành hỏ.'),
  qimg(DAU_THANH, 'vnu-l4-5', u4, 'Hình cái cờ-lê (đồ sửa chữa) đi với tiếng nào?', '🔧', ['sửa', 'sữa', 'sứa', 'sựa'], 'sửa', 'Việc làm cho đồ hỏng chạy được.', 'Đồ sửa chữa ứng với “sửa”.'),
  qtf(DAU_THANH, 'vnu-l4-6', u4, 'Tiếng “ngã” mang dấu ngã. Đúng hay sai?', 'Đúng', 'Đọc tiếng này rồi nghe giọng.', 'Đúng, “ngã” mang dấu ngã.'),
  qmc(DAU_THANH, 'vnu-l4-7', u4, 2, 'Tiếng nào mang dấu hỏi?', ['cỏ', 'có', 'cò', 'cọ'], 'cỏ', 'Dấu hỏi có nét móc nhỏ.', '“cỏ” mang dấu hỏi.'),
  qaudio(DAU_THANH, 'vnu-l4-8', u4, 'Nghe và chọn tiếng mang dấu ngã:', ['vẽ', 'vè', 'vé', 'vẹ'], 'vẽ', 'Giọng đọc xuống rồi lên.', '“vẽ” mang dấu ngã.'),
];

// ---------------------------------------------------------------------------
// vn-les-5 — Vần an và vần at  (kỹ năng thêm: vn_u5)
// ---------------------------------------------------------------------------

const u5 = 'vn_u5';
const u5Q: Question[] = [
  qmc(VAN, 'vnu-l5-1', u5, 1, 'Tiếng “bàn” có vần gì?', ['Vần an', 'Vần at', 'Vần am', 'Vần ap'], 'Vần an', 'Đọc tiếng rồi tách phần vần.', '“bàn” có vần an.'),
  qtf(VAN, 'vnu-l5-2', u5, 'Trong “hạt cát”, tiếng “cát” mang vần at. Đúng hay sai?', 'Đúng', 'Nghe âm cuối của tiếng.', 'Đúng, “cát” có vần at.'),
  qimg(VAN, 'vnu-l5-3', u5, 'Hình bãi biển có nhiều hạt nhỏ — chọn tiếng đúng:', '🏖️', ['cát', 'các', 'cạc', 'cạt'], 'cát', 'Hạt nhỏ vàng ở bãi biển.', 'Đó là “cát”.'),
  qfb(VAN, 'vnu-l5-4', u5, 'Chọn vần đúng cho “b…”: cái bàn.', ['an', 'at', 'am', 'ap'], 'an', 'Vần này có a đứng trước, n đứng sau.', 'Điền “an” ta được “bàn”.'),
  qmc(VAN, 'vnu-l5-5', u5, 2, 'Từ nào chứa vần “at”?', ['bãi cát', 'cái bàn', 'quả cam', 'xe đạp'], 'bãi cát', 'Tìm tiếng có âm cuối t.', '“bãi cát” chứa vần at.'),
  qorder(VAN, 'vnu-l5-6', u5, 'Sắp xếp hai tiếng thành từ “bàn ăn”:', ['bàn', 'ăn'], 'Từ chỉ nơi ăn cơm.', 'Thứ tự đúng: bàn ăn.'),
  qaudio(VAN, 'vnu-l5-7', u5, 'Nghe và chọn tiếng có vần an:', ['lan', 'lát', 'lam', 'lạp'], 'lan', 'Nghe âm cuối của tiếng.', '“lan” có vần an.'),
];

// ---------------------------------------------------------------------------
// vn-les-6 — Vần on và vần ot  (kỹ năng thêm: vn_u6)
// ---------------------------------------------------------------------------

const u6 = 'vn_u6';
const u6Q: Question[] = [
  qmc(VAN, 'vnu-l6-1', u6, 1, 'Tiếng “con” có vần gì?', ['Vần on', 'Vần ot', 'Vần an', 'Vần at'], 'Vần on', 'Đọc tiếng rồi tách vần.', '“con” có vần on.'),
  qtf(VAN, 'vnu-l6-2', u6, 'Từ “quả ngọt” có tiếng “ngọt” mang vần ot. Đúng hay sai?', 'Đúng', 'Nghe âm cuối của tiếng.', 'Đúng, “ngọt” có vần ot.'),
  qfb(VAN, 'vnu-l6-3', u6, 'Chọn vần cho “ng…”: quả ngọt.', ['ọt', 'on', 'an', 'at'], 'ọt', 'Vần có o trước, t sau, thêm dấu nặng.', 'Điền “ọt” ta được “ngọt”.'),
  qimg(VAN, 'vnu-l6-4', u6, 'Hình quả táo ngọt — chọn tiếng có vần ot:', '🍎', ['ngọt', 'ngon', 'ngan', 'ngat'], 'ngọt', 'Vị của quả táo chín.', 'Đó là “ngọt”.'),
  qmc(VAN, 'vnu-l6-5', u6, 2, 'Từ nào chứa vần “on”?', ['ngọn cỏ', 'quả ngọt', 'bãi cát', 'cái bàn'], 'ngọn cỏ', 'Tìm tiếng có âm cuối n.', '“ngọn cỏ” có tiếng “ngọn” vần on.'),
  qaudio(VAN, 'vnu-l6-6', u6, 'Nghe và chọn tiếng có vần ot:', ['hót', 'hon', 'han', 'hat'], 'hót', 'Âm cuối của tiếng là t.', '“hót” có vần ot.'),
  qmc(VAN, 'vnu-l6-7', u6, 2, 'Tiếng “tròn” có vần gì?', ['Vần on', 'Vần ot', 'Vần ôn', 'Vần ôt'], 'Vần on', 'Tách phần vần của tiếng.', '“tròn” có vần on.'),
  qorder(VAN, 'vnu-l6-8', u6, 'Sắp xếp hai tiếng thành từ “con ong”:', ['con', 'ong'], 'Con vật nhỏ bay hút mật.', 'Thứ tự đúng: con ong.'),
];

// ---------------------------------------------------------------------------
// vn-les-6b — Vần am và vần ap  (kỹ năng thêm: vn_u6b)
// ---------------------------------------------------------------------------

const u6b = 'vn_u6b';
const u6bQ: Question[] = [
  qmc(VAN, 'vnu-l6b-1', u6b, 1, 'Tiếng “cam” có vần gì?', ['Vần am', 'Vần ap', 'Vần an', 'Vần at'], 'Vần am', 'Tách phần vần của tiếng.', '“cam” có vần am.'),
  qtf(VAN, 'vnu-l6b-2', u6b, 'Trong “xe đạp”, tiếng “đạp” mang vần ap. Đúng hay sai?', 'Đúng', 'Nghe âm cuối của tiếng.', 'Đúng, “đạp” có vần ap.'),
  qfb(VAN, 'vnu-l6b-3', u6b, 'Chọn vần cho “c…”: quả cam.', ['am', 'ap', 'an', 'at'], 'am', 'Vần có a trước, m sau.', 'Điền “am” ta được “cam”.'),
  qimg(VAN, 'vnu-l6b-4', u6b, 'Hình xe đạp — chọn tiếng có vần ap:', '🚲', ['đạp', 'đam', 'đan', 'đat'], 'đạp', 'Xe hai bánh chạy bằng sức chân.', 'Đó là “đạp”.'),
  qmc(VAN, 'vnu-l6b-5', u6b, 2, 'Từ nào chứa vần “ap”?', ['xe đạp', 'quả cam', 'cái bàn', 'bãi cát'], 'xe đạp', 'Tìm tiếng có âm cuối p.', '“xe đạp” chứa vần ap.'),
  qaudio(VAN, 'vnu-l6b-6', u6b, 'Nghe và chọn tiếng có vần am:', ['gam', 'gap', 'gan', 'gat'], 'gam', 'Âm cuối của tiếng là m.', '“gam” có vần am.'),
  qmc(VAN, 'vnu-l6b-7', u6b, 2, 'Tiếng “nắp” có vần gì?', ['Vần ap', 'Vần am', 'Vần ăp', 'Vần ăm'], 'Vần ap', 'Tách phần vần của tiếng.', '“nắp” có vần ap.'),
  qorder(VAN, 'vnu-l6b-8', u6b, 'Sắp xếp hai tiếng thành từ “quả cam”:', ['quả', 'cam'], 'Loại quả tròn màu cam.', 'Thứ tự đúng: quả cam.'),
];

// ---------------------------------------------------------------------------
// vn-les-7 — Ghép âm thành tiếng  (kỹ năng thêm: vn_u7)
// ---------------------------------------------------------------------------

const u7 = 'vn_u7';
const u7Q: Question[] = [
  qmc(GHEP_AM, 'vnu-l7-1', u7, 1, 'Ghép “c” với “o” ta được tiếng gì?', ['co', 'ca', 'cu', 'cơ'], 'co', 'Đọc lần lượt từng âm rồi ghép lại.', 'c + o = co.'),
  qmc(GHEP_AM, 'vnu-l7-2', u7, 1, 'Ghép “d” với “e” ta được tiếng gì?', ['de', 'da', 'do', 'dê'], 'de', 'Đọc lần lượt từng âm rồi ghép lại.', 'd + e = de.'),
  qtf(GHEP_AM, 'vnu-l7-3', u7, 'Ghép “b” với “à” ta được tiếng “bà”. Đúng hay sai?', 'Đúng', 'Ghép phụ âm với nguyên âm.', 'Đúng, b + à = bà.'),
  qfb(GHEP_AM, 'vnu-l7-4', u7, 'Ghép “m” + “e” + dấu nặng ta được tiếng: …', ['mẹ', 'me', 'mè', 'mé'], 'mẹ', 'Tiếng chỉ người sinh ra em.', 'm + e + nặng = mẹ.'),
  qimg(GHEP_AM, 'vnu-l7-5', u7, 'Hình người mẹ ứng với tiếng nào?', '👩', ['mẹ', 'me', 'mè', 'mẽ'], 'mẹ', 'Người chăm sóc và yêu em nhất.', 'Đó là “mẹ”.'),
  qmc(GHEP_AM, 'vnu-l7-6', u7, 2, 'Ghép “b” + “a” + dấu huyền ta được tiếng nào?', ['bà', 'ba', 'bá', 'bạ'], 'bà', 'Thêm dấu huyền sau khi ghép âm.', 'b + a + huyền = bà.'),
  qaudio(GHEP_AM, 'vnu-l7-7', u7, 'Nghe và chọn tiếng vừa ghép từ “c” và “a”:', ['ca', 'co', 'cu', 'cơ'], 'ca', 'Bấm loa rồi nghe tiếng.', 'c + a = ca.'),
  qorder(GHEP_AM, 'vnu-l7-8', u7, 'Sắp xếp hai âm thành tiếng “ba”:', ['b', 'a'], 'Phụ âm đứng trước nguyên âm.', 'Thứ tự đúng: b – a.'),
];

// ---------------------------------------------------------------------------
// vn-les-7b — Ghép ba âm thành tiếng  (kỹ năng thêm: vn_u7b)
// ---------------------------------------------------------------------------

const u7b = 'vn_u7b';
const u7bQ: Question[] = [
  qmc(GHEP_AM, 'vnu-l7b-1', u7b, 2, 'Ghép “m” + “a” + “i” ta được tiếng gì?', ['mai', 'mái', 'mại', 'man'], 'mai', 'Ghép lần lượt ba âm rồi đọc.', 'm + a + i = mai.'),
  qmc(GHEP_AM, 'vnu-l7b-2', u7b, 2, 'Ghép “h” + “o” + “a” ta được tiếng gì?', ['hoa', 'hoà', 'hoá', 'hoả'], 'hoa', 'Ghép lần lượt ba âm rồi đọc.', 'h + o + a = hoa.'),
  qtf(GHEP_AM, 'vnu-l7b-3', u7b, 'Ghép “c” với “a” ta được tiếng “ca”. Đúng hay sai?', 'Đúng', 'Ghép phụ âm với nguyên âm.', 'Đúng, c + a = ca.'),
  qfb(GHEP_AM, 'vnu-l7b-4', u7b, 'Ghép “l” + “a” + “n” ta được tiếng: …', ['lan', 'làn', 'lạn', 'lãn'], 'lan', 'Tên một bạn gái trong lớp.', 'l + a + n = lan.'),
  qimg(GHEP_AM, 'vnu-l7b-5', u7b, 'Hình con gà — ghép “g” + “a” + huyền ta được tiếng nào?', '🐔', ['gà', 'ga', 'gá', 'gạ'], 'gà', 'Con vật gáy ò ó o buổi sáng.', 'g + a + huyền = gà.'),
  qmc(GHEP_AM, 'vnu-l7b-6', u7b, 2, 'Ghép “t” + “a” + “o” ta được tiếng nào?', ['tao', 'táo', 'tào', 'tạo'], 'tao', 'Ghép ba âm rồi đọc liền.', 't + a + o = tao.'),
  qaudio(GHEP_AM, 'vnu-l7b-7', u7b, 'Nghe và chọn tiếng vừa ghép từ “h” và “oa”:', ['hoa', 'hoà', 'hoá', 'hoả'], 'hoa', 'Bấm loa rồi nghe tiếng.', 'h + oa = hoa.'),
  qorder(GHEP_AM, 'vnu-l7b-8', u7b, 'Sắp xếp ba âm thành tiếng “bàn”:', ['b', 'à', 'n'], 'Phụ âm đầu, vần, rồi âm cuối.', 'Thứ tự đúng: b – à – n.'),
];

// ---------------------------------------------------------------------------
// vn-les-8 — Phân biệt c và k  (kỹ năng thêm: vn_u8)
// ---------------------------------------------------------------------------

const u8 = 'vn_u8';
const u8Q: Question[] = [
  qmc(CHINH_TA, 'vnu-l8-1', u8, 2, 'Trước âm “i”, ta viết chữ nào?', ['k', 'c', 'q', 'g'], 'k', 'Nhớ bạn thân của e, ê, i.', 'Trước i ta viết k (ví dụ: kiến).'),
  qtf(CHINH_TA, 'vnu-l8-2', u8, 'Trước âm “a”, ta viết chữ c. Đúng hay sai?', 'Đúng', 'Nhớ quy tắc c đứng trước a, o, ô, u, ư.', 'Đúng, trước a ta viết c (ví dụ: cá).'),
  qfb(CHINH_TA, 'vnu-l8-3', u8, 'Điền c hay k: Cái …éo (đồ cắt giấy).', ['k', 'c', 'q', 'g'], 'k', 'Trước âm e ta viết chữ nào?', 'Điền “k” ta được “cái kéo”.'),
  qimg(CHINH_TA, 'vnu-l8-4', u8, 'Hình đôi kéo cắt giấy — chọn từ viết đúng:', '✂️', ['cái kéo', 'cái céo', 'kái kéo', 'kái céo'], 'cái kéo', 'Chỉ một cách viết đúng.', 'Đúng rồi: “cái kéo”.'),
  qmc(CHINH_TA, 'vnu-l8-5', u8, 2, 'Từ nào viết đúng chính tả?', ['cái ca', 'cái ka', 'kái ca', 'kái ka'], 'cái ca', 'Trước a dùng c.', '“cái ca” viết đúng.'),
  qtf(CHINH_TA, 'vnu-l8-6', u8, 'Từ “kiến” được viết bằng chữ k. Đúng hay sai?', 'Đúng', 'Trước i dùng k.', 'Đúng, “kiến” viết bằng k.'),
  qtf(CHINH_TA, 'vnu-l8-7', u8, 'Trước âm “o”, ta viết chữ k. Đúng hay sai?', 'Sai', 'Nhớ nhóm âm đi với c.', 'Sai, trước o ta viết c (ví dụ: con).'),
];

// ---------------------------------------------------------------------------
// vn-les-8b — ng/ngh và g/gh  (kỹ năng thêm: vn_u8b)
// ---------------------------------------------------------------------------

const u8b = 'vn_u8b';
const u8bQ: Question[] = [
  qmc(CHINH_TA, 'vnu-l8b-1', u8b, 2, 'Trước âm “i”, ta viết chữ ghép nào?', ['ngh', 'ng', 'g', 'nh'], 'ngh', 'Bạn thân của e, ê, i.', 'Trước i ta viết ngh (ví dụ: nghỉ).'),
  qtf(CHINH_TA, 'vnu-l8b-2', u8b, 'Trước âm “a”, ta viết g. Đúng hay sai?', 'Đúng', 'Nhóm âm đi với g.', 'Đúng, trước a ta viết g (ví dụ: gà).'),
  qfb(CHINH_TA, 'vnu-l8b-3', u8b, 'Điền ng hay ngh: Con …ỗng.', ['ng', 'ngh', 'nh', 'g'], 'ng', 'Trước âm ô ta viết chữ nào?', 'Điền “ng” ta được “con ngỗng”.'),
  qimg(CHINH_TA, 'vnu-l8b-4', u8b, 'Hình con gà — chọn từ viết đúng:', '🐔', ['con gà', 'con ghà', 'con ngà', 'con nhà'], 'con gà', 'Chỉ một cách viết đúng.', 'Đúng rồi: “con gà”.'),
  qmc(CHINH_TA, 'vnu-l8b-5', u8b, 2, 'Từ nào viết đúng chính tả?', ['cái ghế', 'cái gế', 'cái nghế', 'cái ngế'], 'cái ghế', 'Trước ê dùng gh.', '“cái ghế” viết đúng.'),
  qtf(CHINH_TA, 'vnu-l8b-6', u8b, 'Từ “ngỗng” được viết bằng chữ ghép “ngh”. Đúng hay sai?', 'Sai', 'Nghe âm đầu của từ.', 'Sai, “ngỗng” viết bằng ng.'),
  qmc(CHINH_TA, 'vnu-l8b-7', u8b, 2, 'Trước âm “ê”, ta viết chữ nào?', ['gh', 'g', 'ng', 'nh'], 'gh', 'Nhóm âm e, ê, i.', 'Trước ê ta viết gh (ví dụ: ghế).'),
];

// ---------------------------------------------------------------------------
// vn-les-9 — Đồ dùng học tập & từ chỉ người  (kỹ năng thêm: vn_u9)
// ---------------------------------------------------------------------------

const u9 = 'vn_u9';
const u9Q: Question[] = [
  qmc(TU_VAT, 'vnu-l9-1', u9, 1, 'Đồ vật nào dùng để viết chữ?', ['Bút chì', 'Cái ca', 'Quả cam', 'Con gà'], 'Bút chì', 'Đồ vật bé cầm trên tay để viết.', 'Bút chì dùng để viết chữ.'),
  qtf(TU_VAT, 'vnu-l9-2', u9, 'Thước kẻ dùng để đo và kẻ đường thẳng. Đúng hay sai?', 'Đúng', 'Đồ vật có các vạch chia.', 'Đúng, thước kẻ để đo và kẻ.'),
  qimg(TU_VAT, 'vnu-l9-3', u9, 'Hình cặp sách dùng để làm gì?', '🎒', ['Đựng sách vở', 'Đựng nước uống', 'Để ngồi', 'Để ăn cơm'], 'Đựng sách vở', 'Bé đeo nó trên vai tới trường.', 'Cặp sách dùng để đựng sách vở.'),
  qmc(TU_VAT, 'vnu-l9-4', u9, 1, 'Từ nào chỉ đồ dùng học tập?', ['Quyển vở', 'Con mèo', 'Cái nồi', 'Quả táo'], 'Quyển vở', 'Đồ vật dùng khi học.', 'Quyển vở là đồ dùng học tập.'),
  qfb(TU_VAT, 'vnu-l9-5', u9, 'Điền từ chỉ đồ vật: “Bé dùng … để tẩy chữ sai.”', ['cục tẩy', 'bút chì', 'thước kẻ', 'quyển vở'], 'cục tẩy', 'Đồ vật nhỏ, xóa được nét chì.', 'Điền “cục tẩy”: Bé dùng cục tẩy để tẩy chữ sai.'),
  qmc(TU_VAT, 'vnu-l9-6', u9, 1, 'Từ nào chỉ người?', ['Bác sĩ', 'Cái ghế', 'Quả cam', 'Con gà'], 'Bác sĩ', 'Từ chỉ người làm nghề chữa bệnh.', 'Bác sĩ là từ chỉ người.'),
  qtf(TU_VAT, 'vnu-l9-7', u9, 'Từ “con gà” chỉ đồ vật. Đúng hay sai?', 'Sai', 'Con gà là con vật hay đồ vật?', 'Sai, “con gà” chỉ con vật.'),
];

// ---------------------------------------------------------------------------
// vn-les-10 — Từ chỉ hoạt động  (kỹ năng thêm: vn_u10)
// ---------------------------------------------------------------------------

const u10 = 'vn_u10';
const u10Q: Question[] = [
  qmc(HOAT_DONG, 'vnu-l10-1', u10, 1, '“Đọc sách” là hoạt động như thế nào?', ['Nhìn chữ và đọc thành tiếng', 'Chạy thật nhanh', 'Nấu ăn', 'Tưới cây'], 'Nhìn chữ và đọc thành tiếng', 'Việc làm với sách.', 'Đọc sách là nhìn chữ và đọc.'),
  qtf(HOAT_DONG, 'vnu-l10-2', u10, 'Đánh răng là việc bé làm mỗi ngày để giữ sạch răng. Đúng hay sai?', 'Đúng', 'Việc làm vệ sinh buổi sáng.', 'Đúng, bé đánh răng mỗi ngày.'),
  qimg(HOAT_DONG, 'vnu-l10-3', u10, 'Hình bạn nhỏ đang chạy — đây là loại từ nào?', '🏃', ['Từ chỉ hoạt động', 'Từ chỉ đồ vật', 'Từ chỉ con vật', 'Từ chỉ cây cối'], 'Từ chỉ hoạt động', 'Chạy là một hành động.', 'Đây là từ chỉ hoạt động.'),
  qfb(HOAT_DONG, 'vnu-l10-4', u10, 'Điền từ chỉ hoạt động: “Bé … bài trước khi đi ngủ.”', ['học', 'bàn', 'cam', 'nón'], 'học', 'Việc làm với sách vở.', 'Điền “học”: Bé học bài trước khi đi ngủ.'),
  qmc(HOAT_DONG, 'vnu-l10-5', u10, 1, 'Từ nào chỉ hoạt động?', ['Nhảy dây', 'Cái bàn', 'Quả táo', 'Con cá'], 'Nhảy dây', 'Việc bé làm cho vui khỏe.', 'Nhảy dây là từ chỉ hoạt động.'),
  qaudio(HOAT_DONG, 'vnu-l10-6', u10, 'Nghe và chọn từ chỉ hoạt động:', ['uống nước', 'cái ghế', 'quả cam', 'con mèo'], 'uống nước', 'Chọn việc làm, không chọn đồ vật.', 'Uống nước là hoạt động.'),
  qtf(HOAT_DONG, 'vnu-l10-7', u10, 'Từ “múa hát” chỉ một đồ vật. Đúng hay sai?', 'Sai', 'Xem đây là việc làm hay đồ vật.', 'Sai, “múa hát” chỉ hoạt động.'),
  qmc(HOAT_DONG, 'vnu-l10-8', u10, 2, 'Bé dùng gì để rửa mặt?', ['Nước sạch', 'Cái ghế', 'Quả táo', 'Con cá'], 'Nước sạch', 'Cần chất lỏng trong lành.', 'Bé rửa mặt bằng nước sạch.'),
];

// ---------------------------------------------------------------------------
// vn-les-11 — Ghép từ thành câu  (kỹ năng thêm: vn_u11)
// ---------------------------------------------------------------------------

const u11 = 'vn_u11';
const u11Q: Question[] = [
  qorder(XEP_CAU, 'vnu-l11-1', u11, 'Sắp xếp các từ thành câu đúng:', ['Bé', 'rửa', 'tay'], 'Ai làm gì?', 'Câu đúng: Bé rửa tay.'),
  qmc(XEP_CAU, 'vnu-l11-2', u11, 2, 'Câu nào sắp xếp đúng từ: con / mèo / ngủ?', ['Con mèo ngủ.', 'Mèo con ngủ.', 'Con ngủ mèo.', 'Ngủ con mèo.'], 'Con mèo ngủ.', 'Con vật đứng trước hành động.', 'Câu đúng: Con mèo ngủ.'),
  qtf(XEP_CAU, 'vnu-l11-3', u11, 'Câu “Mẹ nấu cơm.” đã đúng thứ tự các từ. Đúng hay sai?', 'Đúng', 'Mẹ làm gì?', 'Đúng, câu đúng thứ tự.'),
  qorder(XEP_CAU, 'vnu-l11-4', u11, 'Em hãy sắp xếp bốn từ sau thành câu:', ['Em', 'thích', 'đọc', 'sách'], 'Em thích làm gì?', 'Câu đúng: Em thích đọc sách.'),
  qfb(XEP_CAU, 'vnu-l11-5', u11, 'Chọn từ thích hợp cho câu: “Bố lái … .”', ['xe', 'bàn', 'cam', 'nón'], 'xe', 'Bố đi làm bằng phương tiện này.', 'Điền “xe”: Bố lái xe.'),
  qmc(XEP_CAU, 'vnu-l11-6', u11, 2, 'Câu nào có thứ tự từ đúng?', ['Lan yêu mẹ.', 'Yêu Lan mẹ.', 'Mẹ Lan yêu.', 'Lan mẹ yêu.'], 'Lan yêu mẹ.', 'Ai yêu ai?', 'Câu đúng: Lan yêu mẹ.'),
  qimg(XEP_CAU, 'vnu-l11-7', u11, 'Hình bạn nhỏ đi học — câu nào đúng?', '🎒', ['Bé đi học.', 'Học bé đi.', 'Đi bé học.', 'Bé học đi.'], 'Bé đi học.', 'Ai làm gì?', 'Câu đúng: Bé đi học.'),
  qtf(XEP_CAU, 'vnu-l11-8', u11, 'Câu “học bài em.” đã đúng thứ tự. Đúng hay sai?', 'Sai', 'Ai học bài trước?', 'Sai, đúng phải là “Em học bài.”'),
];

// ---------------------------------------------------------------------------
// vn-les-12 — Đọc hiểu: gà trống  (kỹ năng thêm: vn_u12)
// ---------------------------------------------------------------------------

const u12 = 'vn_u12';
const u12Q: Question[] = [
  qmc(DOC_HIEU_1, 'vnu-l12-1', u12, 2, 'Đọc: “Sáng sớm, gà trống nhảy lên đống rơm gáy ò ó o.” Gà trống gáy vào lúc nào?', ['Sáng sớm', 'Buổi trưa', 'Buổi tối', 'Đêm khuya'], 'Sáng sớm', 'Tìm từ chỉ thời gian trong câu.', 'Gà trống gáy vào sáng sớm.'),
  qmc(DOC_HIEU_1, 'vnu-l12-2', u12, 2, 'Gà trống gáy để gọi ai thức giấc?', ['Mặt trời', 'Con mèo', 'Con cá', 'Bác nông dân'], 'Mặt trời', 'Tìm từ chỉ vật trên cao.', 'Gà gáy gọi mặt trời thức giấc.'),
  qtf(DOC_HIEU_1, 'vnu-l12-3', u12, 'Gà trống trong bài gáy “ò ó o”. Đúng hay sai?', 'Đúng', 'Nhớ tiếng gáy trong bài đọc.', 'Đúng, gà gáy ò ó o.'),
  qmc(DOC_HIEU_1, 'vnu-l12-4', u12, 2, 'Chú gà nhảy lên đâu để gáy?', ['Đống rơm', 'Cành cây', 'Mái nhà', 'Bờ ao'], 'Đống rơm', 'Tìm nơi chú gà đứng.', 'Chú gà nhảy lên đống rơm.'),
  qfb(DOC_HIEU_1, 'vnu-l12-5', u12, 'Điền từ: “Gà trống gáy … ó o.”', ['ò', 'o', 'ô', 'ơ'], 'ò', 'Tiếng gáy bắt đầu bằng chữ o có dấu huyền.', 'Điền “ò”: Gà trống gáy ò ó o.'),
  qimg(DOC_HIEU_1, 'vnu-l12-6', u12, 'Hình đống rơm — gà nhảy lên đây để làm gì?', '🌾', ['Gáy gọi người', 'Bơi lội', 'Nấu ăn', 'Ngủ'], 'Gáy gọi người', 'Nơi cao để gà gáy.', 'Gà nhảy lên đống rơm để gáy.'),
  qmc(DOC_HIEU_1, 'vnu-l12-7', u12, 2, 'Tiếng gáy của gà trống nghe thế nào?', ['Ò ó o', 'Meo meo', 'Gâu gâu', 'Cục tác'], 'Ò ó o', 'Nhớ câu đầu của bài đọc.', 'Tiếng gáy là “ò ó o”.'),
  qtf(DOC_HIEU_1, 'vnu-l12-8', u12, 'Buổi sáng gà trống ngủ nướng, không gáy. Đúng hay sai?', 'Sai', 'Gà trống chăm chỉ gáy sáng.', 'Sai, gà trống gáy sáng sớm.'),
];

// ---------------------------------------------------------------------------
// vn-les-13 — Đọc hiểu: Mèo Mướp  (kỹ năng thêm: vn_u13)
// ---------------------------------------------------------------------------

const u13 = 'vn_u13';
const u13Q: Question[] = [
  qmc(DOC_HIEU_2, 'vnu-l13-1', u13, 2, 'Đọc: “Buổi trưa mèo nằm sưởi nắng bên thềm.” Mèo nằm ở đâu?', ['Bên thềm', 'Trên mái nhà', 'Dưới ao', 'Trong lớp'], 'Bên thềm', 'Tìm từ chỉ nơi chốn.', 'Mèo nằm bên thềm.'),
  qtf(DOC_HIEU_2, 'vnu-l13-2', u13, 'Mèo mướp trong bài có bộ lông xám tro. Đúng hay sai?', 'Đúng', 'Nhớ màu lông mèo trong bài.', 'Đúng, mèo có lông xám tro.'),
  qmc(DOC_HIEU_2, 'vnu-l13-3', u13, 2, 'Mèo thích làm gì vào buổi trưa?', ['Sưởi nắng', 'Bơi lội', 'Bay lượn', 'Tưới cây'], 'Sưởi nắng', 'Việc làm khi trời nắng ấm.', 'Mèo thích sưởi nắng buổi trưa.'),
  qimg(DOC_HIEU_2, 'vnu-l13-4', u13, 'Hình con mèo thường kêu thế nào?', '🐈', ['Meo meo', 'Gâu gâu', 'Ò ó o', 'Cục tác'], 'Meo meo', 'Tiếng kêu quen thuộc của mèo.', 'Mèo kêu “meo meo”.'),
  qfb(DOC_HIEU_2, 'vnu-l13-5', u13, 'Điền từ: “Mèo giỏi … chuột ngoài vườn.”', ['bắt', 'nuôi', 'trồng', 'tưới'], 'bắt', 'Việc mèo giỏi làm ngoài vườn.', 'Điền “bắt”: Mèo giỏi bắt chuột.'),
  qmc(DOC_HIEU_2, 'vnu-l13-6', u13, 2, 'Khi trời mưa, mèo nằm ở đâu?', ['Bên bếp lửa', 'Ngoài vườn', 'Trên cây', 'Dưới ao'], 'Bên bếp lửa', 'Tìm nơi ấm áp trong bài.', 'Trời mưa mèo nằm bên bếp lửa.'),
  qtf(DOC_HIEU_2, 'vnu-l13-7', u13, 'Con mèo là con vật. Đúng hay sai?', 'Đúng', 'Mèo là người hay con vật?', 'Đúng, mèo là con vật.'),
];

// ---------------------------------------------------------------------------
// vn-les-14 — Đại chiến c/k, g/gh, ng/ngh  (kỹ năng thêm: vn_u14)
// ---------------------------------------------------------------------------

const u14 = 'vn_u14';
const u14Q: Question[] = [
  qmc(CHINH_TA_NC, 'vnu-l14-1', u14, 1, 'Chọn từ viết đúng cho đồ dùng để viết chữ ✏️:', ['cái bút', 'cái búc', 'kái bút', 'cái búk'], 'cái bút', 'Trước u ta viết c.', '“cái bút” viết đúng.'),
  qtf(CHINH_TA_NC, 'vnu-l14-2', u14, 'Từ “ghế” được viết bằng g và h. Đúng hay sai?', 'Đúng', 'Trước ê ta viết gh.', 'Đúng, “ghế” viết bằng gh.'),
  qfb(CHINH_TA_NC, 'vnu-l14-3', u14, 'Điền ng hay ngh: …ỉ hè.', ['ngh', 'ng', 'g', 'nh'], 'ngh', 'Trước âm i ta viết chữ nào?', 'Điền “ngh” ta được “nghỉ hè”.'),
  qmc(CHINH_TA_NC, 'vnu-l14-4', u14, 2, 'Chọn từ viết đúng cho người dạy học 👩‍🏫:', ['cô giáo', 'cô dáo', 'cô ráo', 'cô giào'], 'cô giáo', 'Viết bằng gi.', '“cô giáo” viết đúng.'),
  qtf(CHINH_TA_NC, 'vnu-l14-5', u14, 'Từ “nghỉ” được viết bằng ba chữ n, g, h. Đúng hay sai?', 'Đúng', 'Trước i ta viết ngh.', 'Đúng, “nghỉ” viết bằng ngh.'),
  qmc(CHINH_TA_NC, 'vnu-l14-6', u14, 2, 'Trước âm “e”, ta viết chữ nào?', ['gh', 'g', 'ng', 'ngh'], 'gh', 'Nhóm âm e, ê, i.', 'Trước e ta viết gh (ví dụ: ghẹ).'),
];

// ---------------------------------------------------------------------------
// vn-les-15 — ch/tr, s/x, d/gi/r  (kỹ năng thêm: vn_u15)
// ---------------------------------------------------------------------------

const u15 = 'vn_u15';
const u15Q: Question[] = [
  qmc(CHINH_TA_NC, 'vnu-l15-1', u15, 2, 'Chọn từ viết đúng cho buổi sáng ☀️:', ['buổi sáng', 'buổi xáng', 'buổi sán', 'buổi sắng'], 'buổi sáng', 'Sáng viết bằng s.', '“buổi sáng” viết đúng.'),
  qtf(CHINH_TA_NC, 'vnu-l15-2', u15, 'Từ “chim” được viết bằng ch, không phải tr. Đúng hay sai?', 'Đúng', 'Nghe âm đầu của từ.', 'Đúng, “chim” viết bằng ch.'),
  qfb(CHINH_TA_NC, 'vnu-l15-3', u15, 'Điền s hay x: Dòng …uối.', ['s', 'x', 'd', 'gi'], 's', 'Dòng nước chảy trong rừng.', 'Điền “s” ta được “dòng suối”.'),
  qmc(CHINH_TA_NC, 'vnu-l15-4', u15, 2, 'Chọn từ viết đúng cho bông hoa 🌸:', ['bông hoa', 'bông hoà', 'bông khoa', 'bông ghoa'], 'bông hoa', 'Hoa viết bằng h.', '“bông hoa” viết đúng.'),
  qtf(CHINH_TA_NC, 'vnu-l15-5', u15, 'Từ “sách” được viết bằng x. Đúng hay sai?', 'Sai', 'Nghe âm đầu của từ.', 'Sai, “sách” viết bằng s.'),
  qmc(CHINH_TA_NC, 'vnu-l15-6', u15, 2, 'Chọn từ viết đúng cho loại quả có hạt 🍉:', ['quả dưa', 'quả giưa', 'quả rưa', 'quả dứa'], 'quả dưa', 'Dưa viết bằng d.', '“quả dưa” viết đúng.'),
];

// ---------------------------------------------------------------------------
// vn-les-16 — Đọc hiểu: vườn trường  (kỹ năng thêm: vn_u16)
// ---------------------------------------------------------------------------

const u16 = 'vn_u16';
const u16Q: Question[] = [
  qmc(KE_CHUYEN, 'vnu-l16-1', u16, 2, 'Đọc: “Bé Lan tưới cà chua mỗi sáng.” Bé Lan tưới cây gì?', ['Cà chua', 'Cây bàng', 'Hoa hồng', 'Cây chuối'], 'Cà chua', 'Tìm tên cây trong câu.', 'Bé Lan tưới cà chua.'),
  qtf(KE_CHUYEN, 'vnu-l16-2', u16, 'Vườn rau nằm ở góc sân trường. Đúng hay sai?', 'Đúng', 'Nhớ nơi có vườn rau.', 'Đúng, vườn rau ở góc sân trường.'),
  qmc(KE_CHUYEN, 'vnu-l16-3', u16, 2, 'Lớp Một chăm sóc vườn rau vào lúc nào?', ['Mỗi sáng', 'Mỗi đêm', 'Giữa trưa', 'Buổi tối'], 'Mỗi sáng', 'Tìm từ chỉ thời gian trong bài.', 'Lớp Một chăm vườn rau mỗi sáng.'),
  qfb(KE_CHUYEN, 'vnu-l16-4', u16, 'Điền từ: “Lớp Một hái cà chua … mọng.”', ['đỏ', 'xanh', 'vàng', 'tím'], 'đỏ', 'Màu của quả cà chua chín.', 'Điền “đỏ”: cà chua đỏ mọng.'),
  qimg(KE_CHUYEN, 'vnu-l16-5', u16, 'Hình quả cà chua — khi chín có màu gì?', '🍅', ['Đỏ', 'Xanh', 'Vàng', 'Tím'], 'Đỏ', 'Màu quen thuộc của cà chua chín.', 'Cà chua chín có màu đỏ.'),
  qtf(KE_CHUYEN, 'vnu-l16-6', u16, 'Cà chua được trồng trong vườn rau. Đúng hay sai?', 'Đúng', 'Xem cà chua mọc ở đâu.', 'Đúng, cà chua trồng trong vườn rau.'),
];

// ---------------------------------------------------------------------------
// vn-les-new-1 — Dạng bài nối  (kỹ năng thêm: vn_un1)
// ---------------------------------------------------------------------------

const un1 = 'vn_un1';
const un1Q: Question[] = [
  qmatch(DANG_BAI, 'vnu-ln1-1', un1, 'Nối mỗi con vật với tên gọi đúng:', [
    { left: 'Mèo', right: '🐱 Con mèo' },
    { left: 'Chó', right: '🐶 Con chó' },
    { left: 'Cá', right: '🐟 Con cá' },
  ], 'Nhìn hình rồi chọn tên đúng.', 'Mèo–Con mèo, Chó–Con chó, Cá–Con cá.'),
  qmatch(DANG_BAI, 'vnu-ln1-2', un1, 'Nối mỗi chữ cái với tên chữ:', [
    { left: 'A', right: 'Chữ a' },
    { left: 'B', right: 'Chữ b' },
    { left: 'C', right: 'Chữ c' },
  ], 'Chữ in hoa nối với tên chữ thường.', 'A–Chữ a, B–Chữ b, C–Chữ c.'),
  qmc(DANG_BAI, 'vnu-ln1-3', un1, 1, 'Nối từ với hình giúp bé điều gì?', ['Nhớ nghĩa của từ', 'Đếm số', 'Tô màu', 'Hát'], 'Nhớ nghĩa của từ', 'Nối từ với hình giúp hiểu nghĩa.', 'Nối từ với hình giúp nhớ nghĩa từ.'),
  qtf(DANG_BAI, 'vnu-ln1-4', un1, 'Khi nối từ với hình, bé cần nhìn kỹ hình. Đúng hay sai?', 'Đúng', 'Nhìn hình để chọn từ phù hợp.', 'Đúng, cần nhìn kỹ hình.'),
  qmc(DANG_BAI, 'vnu-ln1-5', un1, 1, 'Từ “con voi” nối với hình con gì?', ['Con voi', 'Con mèo', 'Con cá', 'Con gà'], 'Con voi', 'Đọc từ rồi tìm hình tương ứng.', '“con voi” nối với hình con voi.'),
  qimg(DANG_BAI, 'vnu-ln1-6', un1, 'Hình con voi — chọn từ đúng:', '🐘', ['con voi', 'con mèo', 'con cá', 'con gà'], 'con voi', 'Con vật to lớn có vòi dài.', 'Đó là “con voi”.'),
  qmatch(DANG_BAI, 'vnu-ln1-7', un1, 'Nối mỗi việc với hình minh họa:', [
    { left: 'Ăn', right: '🍚 Ăn cơm' },
    { left: 'Uống', right: '🥤 Uống nước' },
    { left: 'Ngủ', right: '😴 Ngủ ngon' },
  ], 'Đọc việc làm rồi chọn hình đúng.', 'Ăn–Ăn cơm, Uống–Uống nước, Ngủ–Ngủ ngon.'),
  qmc(DANG_BAI, 'vnu-ln1-8', un1, 1, 'Từ nào chỉ con vật để nối với hình?', ['Con gà', 'Cái ghế', 'Quả cam', 'Bông hoa'], 'Con gà', 'Từ chỉ con vật.', 'Con gà là từ chỉ con vật.'),
];

// ---------------------------------------------------------------------------
// vn-les-new-2 — Dạng bài đúng/sai  (kỹ năng thêm: vn_un2)
// ---------------------------------------------------------------------------

const un2 = 'vn_un2';
const un2Q: Question[] = [
  qtf(DANG_BAI, 'vnu-ln2-1', un2, 'Chữ “o” tròn như quả trứng. Đúng hay sai?', 'Đúng', 'Nhớ hình dáng chữ o.', 'Đúng, chữ o tròn như quả trứng.'),
  qtf(DANG_BAI, 'vnu-ln2-2', un2, 'Từ “quả cam” chứa vần “an”. Đúng hay sai?', 'Sai', 'Nghe vần cuối của tiếng “cam”.', 'Sai, “cam” có vần am.'),
  qtf(DANG_BAI, 'vnu-ln2-3', un2, 'Dấu sắc là một nét xiên phải. Đúng hay sai?', 'Đúng', 'Nhớ hình dáng dấu sắc.', 'Đúng, dấu sắc là nét xiên phải.'),
  qtf(DANG_BAI, 'vnu-ln2-4', un2, 'Tiếng “mẹ” mang dấu sắc. Đúng hay sai?', 'Sai', 'Đọc tiếng “mẹ” và nghe giọng.', 'Sai, “mẹ” mang dấu nặng.'),
  qmc(DANG_BAI, 'vnu-ln2-5', un2, 2, 'Câu nào là câu hỏi?', ['Bạn tên gì?', 'Bạn tên gì.', 'bạn tên gì?', 'Bạn tên gì!'], 'Bạn tên gì?', 'Câu hỏi có dấu hỏi cuối câu.', 'Câu hỏi: “Bạn tên gì?”'),
  qimg(DANG_BAI, 'vnu-ln2-6', un2, 'Hình vòng tròn giống chữ cái nào?', '🔵', ['O', 'A', 'B', 'C'], 'O', 'Vòng tròn tròn xoe.', 'Vòng tròn giống chữ O.'),
  qfb(DANG_BAI, 'vnu-ln2-7', un2, 'Điền từ: “Bé rửa … bằng xà phòng.”', ['tay', 'chân', 'tóc', 'mắt'], 'tay', 'Bộ phận dùng để cầm nắm.', 'Điền “tay”: Bé rửa tay bằng xà phòng.'),
  qtf(DANG_BAI, 'vnu-ln2-8', un2, 'Từ “cái ghế” chỉ đồ vật. Đúng hay sai?', 'Đúng', 'Ghế là đồ vật hay con vật?', 'Đúng, “cái ghế” chỉ đồ vật.'),
];

// ---------------------------------------------------------------------------
// vn-les-new-3 — Dạng bài kéo thả  (kỹ năng thêm: vn_un3)
// ---------------------------------------------------------------------------

const un3 = 'vn_un3';
const un3Q: Question[] = [
  qdd(DANG_BAI, 'vnu-ln3-1', un3, 'Kéo các từ vào nhóm: Con vật hoặc Đồ vật', ['Con gà', 'Cái nón', 'Con cá', 'Quả cam', 'Con mèo', 'Cái ca'], ['Con vật', 'Đồ vật'], 'Con vật', 'Nhóm nào biết di chuyển?', 'Con vật: gà, cá, mèo. Đồ vật: nón, cam, ca.'),
  qdd(DANG_BAI, 'vnu-ln3-2', un3, 'Kéo các từ vào nhóm: Vần am hoặc Vần ap', ['cam', 'đạp', 'gam', 'nạp'], ['Vần am', 'Vần ap'], 'Vần am', 'Nghe âm cuối của từng tiếng.', 'Vần am: cam, gam. Vần ap: đạp, nạp.'),
  qmc(DANG_BAI, 'vnu-ln3-3', un3, 1, 'Kéo thả từ vào nhóm giúp bé phân loại điều gì?', ['Nhóm của từ', 'Màu sắc', 'Số lượng', 'Hình dáng'], 'Nhóm của từ', 'Mỗi từ thuộc một nhóm.', 'Kéo thả giúp phân loại nhóm của từ.'),
  qtf(DANG_BAI, 'vnu-ln3-4', un3, 'Khi kéo thả, bé cần đọc kỹ từ rồi chọn nhóm. Đúng hay sai?', 'Đúng', 'Đọc từ giúp bé chọn nhóm thích hợp.', 'Đúng, cần đọc kỹ từ.'),
  qdd(DANG_BAI, 'vnu-ln3-5', un3, 'Kéo các từ vào nhóm: Đồ ăn hoặc Đồ dùng', ['Quả táo', 'Cái bát', 'Bánh mì', 'Cái thìa', 'Bắp ngô', 'Cái ca'], ['Đồ ăn', 'Đồ dùng'], 'Đồ ăn', 'Nhóm nào dùng để ăn?', 'Đồ ăn: táo, bánh mì, ngô. Đồ dùng: bát, thìa, ca.'),
  qmc(DANG_BAI, 'vnu-ln3-6', un3, 1, 'Từ “con mèo” thuộc nhóm nào?', ['Con vật', 'Đồ vật', 'Đồ ăn', 'Cây cối'], 'Con vật', 'Mèo biết kêu và di chuyển.', '“con mèo” thuộc nhóm con vật.'),
  qimg(DANG_BAI, 'vnu-ln3-7', un3, 'Hình bát cơm — từ “cơm” thuộc nhóm nào?', '🍚', ['Đồ ăn', 'Con vật', 'Đồ dùng', 'Cây cối'], 'Đồ ăn', 'Cơm dùng để ăn.', '“cơm” thuộc nhóm đồ ăn.'),
  qmc(DANG_BAI, 'vnu-ln3-8', un3, 1, 'Từ “cái ghế” thuộc nhóm nào?', ['Đồ vật', 'Con vật', 'Đồ ăn', 'Hoa quả'], 'Đồ vật', 'Ghế là đồ để ngồi.', '“cái ghế” thuộc nhóm đồ vật.'),
];

// ---------------------------------------------------------------------------
// vn-les-new-4 — Dạng bài sắp xếp  (kỹ năng thêm: vn_un4)
// ---------------------------------------------------------------------------

const un4 = 'vn_un4';
const un4Q: Question[] = [
  qorder(DANG_BAI, 'vnu-ln4-1', un4, 'Sắp xếp các từ thành câu: “Mẹ nấu cơm.”', ['Mẹ', 'nấu', 'cơm'], 'Ai làm gì?', 'Câu đúng: Mẹ nấu cơm.'),
  qorder(DANG_BAI, 'vnu-ln4-2', un4, 'Sắp xếp các từ thành câu: “Bé tô màu.”', ['Bé', 'tô', 'màu'], 'Ai làm gì?', 'Câu đúng: Bé tô màu.'),
  qmc(DANG_BAI, 'vnu-ln4-3', un4, 2, 'Câu nào đúng thứ tự các từ?', ['Lan quét nhà.', 'Quét Lan nhà.', 'Nhà Lan quét.', 'Lan nhà quét.'], 'Lan quét nhà.', 'Ai làm gì?', 'Câu đúng: Lan quét nhà.'),
  qtf(DANG_BAI, 'vnu-ln4-4', un4, 'Khi sắp xếp câu, từ chỉ người thường đứng đầu. Đúng hay sai?', 'Đúng', 'Ai làm gì là thứ tự quen thuộc.', 'Đúng, từ chỉ người thường đứng đầu câu.'),
  qfb(DANG_BAI, 'vnu-ln4-5', un4, 'Chọn từ thích hợp: “Bé … sách.”', ['đọc', 'bàn', 'cam', 'nón'], 'đọc', 'Việc làm với sách.', 'Điền “đọc”: Bé đọc sách.'),
  qorder(DANG_BAI, 'vnu-ln4-6', un4, 'Sắp xếp các từ thành câu: “Chú mèo ngủ.”', ['Chú', 'mèo', 'ngủ'], 'Ai làm gì?', 'Câu đúng: Chú mèo ngủ.'),
  qimg(DANG_BAI, 'vnu-ln4-7', un4, 'Hình con cá — câu nào đúng?', '🐟', ['Cá bơi dưới nước.', 'Bơi cá dưới nước.', 'Nước bơi cá dưới.', 'Cá dưới bơi nước.'], 'Cá bơi dưới nước.', 'Con gì làm gì?', 'Câu đúng: Cá bơi dưới nước.'),
  qmc(DANG_BAI, 'vnu-ln4-8', un4, 2, 'Sắp xếp “học / em / bài” thành câu đúng:', ['Em học bài.', 'Học em bài.', 'Bài học em.', 'Em bài học.'], 'Em học bài.', 'Ai làm gì?', 'Câu đúng: Em học bài.'),
];

// ---------------------------------------------------------------------------
// Registry — keyed by the OLD lesson id (never change old ids).
// ---------------------------------------------------------------------------

export const UPGRADE_QUESTIONS_BY_LESSON: Record<string, LessonUpgrade> = {
  'vn-les-1': { skillId: u1, questions: u1Q },
  'vn-les-2': { skillId: u2, questions: u2Q },
  'vn-les-2b': { skillId: u2b, questions: u2bQ },
  'vn-les-3': { skillId: u3, questions: u3Q },
  'vn-les-4': { skillId: u4, questions: u4Q },
  'vn-les-5': { skillId: u5, questions: u5Q },
  'vn-les-6': { skillId: u6, questions: u6Q },
  'vn-les-6b': { skillId: u6b, questions: u6bQ },
  'vn-les-7': { skillId: u7, questions: u7Q },
  'vn-les-7b': { skillId: u7b, questions: u7bQ },
  'vn-les-8': { skillId: u8, questions: u8Q },
  'vn-les-8b': { skillId: u8b, questions: u8bQ },
  'vn-les-9': { skillId: u9, questions: u9Q },
  'vn-les-10': { skillId: u10, questions: u10Q },
  'vn-les-11': { skillId: u11, questions: u11Q },
  'vn-les-12': { skillId: u12, questions: u12Q },
  'vn-les-13': { skillId: u13, questions: u13Q },
  'vn-les-14': { skillId: u14, questions: u14Q },
  'vn-les-15': { skillId: u15, questions: u15Q },
  'vn-les-16': { skillId: u16, questions: u16Q },
  'vn-les-new-1': { skillId: un1, questions: un1Q },
  'vn-les-new-2': { skillId: un2, questions: un2Q },
  'vn-les-new-3': { skillId: un3, questions: un3Q },
  'vn-les-new-4': { skillId: un4, questions: un4Q },
};

/** New skills to declare on each existing topic (so the skill-depth gate sees them). */
export const UPGRADE_SKILLS_BY_TOPIC: Record<string, string[]> = {
  'vn-chu-cai': [u1, u2, u2b],
  'vn-dau-thanh': [u3, u4],
  'vn-van-co-ban': [u5, u6, u6b],
  'vn-ghep-am': [u7, u7b],
  'vn-chinh-ta': [u8, u8b],
  'vn-tu-va-vat': [u9],
  'vn-hoat-dong': [u10],
  'vn-xep-cau': [u11],
  'vn-doc-hieu-1': [u12],
  'vn-doc-hieu-2': [u13],
  'vn-chinh-ta-nang-cao': [u14, u15],
  'vn-ke-chuyen-doc-hieu': [u16],
  'vn-cac-dang-bai-moi': [un1, un2, un3, un4],
};
