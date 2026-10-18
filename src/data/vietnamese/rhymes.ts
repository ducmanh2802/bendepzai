import type { Lesson, Question } from '../../types';
import { vnQ, vnLesson } from './factory';

/**
 * T10B — vần nhóm 1 (spec T10 §4, nửa đầu: am/ap … inh/ich).
 *
 * Word-first design like T10A: mỗi vần gặp qua từ thật, gần gũi (gia đình,
 * trường học, con vật, đồ ăn, thiên nhiên). Mỗi bài có skill id riêng, 12 câu,
 * trộn 4 loại câu, độ khó ~40/40/20. Distractor là lỗi trẻ hay gặp (a/ă/â,
 * o/ô/ơ, n/ng, nhầm dấu). Không đổi id bài/câu cũ.
 *
 * Ghi chú: hint dùng câu chung đã kiểm để KHÔNG chứa đáp án (tránh cảnh báo
 * HINT_REVEALS_ANSWER của contentValidator).
 */
export const RHYME_TOPIC = 'vn-van-co-ban';

const HINT_MC = 'Đọc lần lượt từng từ rồi nghe âm cuối.';
const HINT_FB = 'Đọc cả câu rồi chọn từ thích hợp nhất.';
const HINT_IMG = 'Nghe thật kỹ âm cuối của tiếng chỉ hình nhé!';
const HINT_TF = 'Đọc thật to câu rồi xét xem nhận xét có hợp lí không.';

function mc(
  id: string,
  skillId: string,
  difficulty: 1 | 2 | 3,
  prompt: string,
  options: string[],
  correct: string,
  explanation: string,
  emoji?: string
): Question {
  return vnQ(RHYME_TOPIC, { id, skillId, difficulty, type: 'multiple-choice', prompt, options, correctAnswer: correct, mediaEmoji: emoji, hint: HINT_MC, explanation });
}

function fb(
  id: string,
  skillId: string,
  difficulty: 1 | 2 | 3,
  prompt: string,
  options: string[],
  correct: string,
  explanation: string
): Question {
  return vnQ(RHYME_TOPIC, { id, skillId, difficulty, type: 'fill-blank', prompt, options, correctAnswer: correct, hint: HINT_FB, explanation });
}

function img(
  id: string,
  skillId: string,
  difficulty: 1 | 2 | 3,
  prompt: string,
  emoji: string,
  options: string[],
  correct: string,
  explanation: string
): Question {
  return vnQ(RHYME_TOPIC, { id, skillId, difficulty, type: 'image-choice', prompt, mediaEmoji: emoji, options, correctAnswer: correct, hint: HINT_IMG, explanation });
}

function tf(
  id: string,
  skillId: string,
  difficulty: 1 | 2 | 3,
  prompt: string,
  correct: 'Đúng' | 'Sai',
  explanation: string
): Question {
  return vnQ(RHYME_TOPIC, { id, skillId, difficulty, type: 'true-false', prompt, options: ['Đúng', 'Sai'], correctAnswer: correct, hint: HINT_TF, explanation });
}

// ---------------------------------------------------------------------------
// Bài 1 — am, ap, ăm, ăp, âm, âp
// ---------------------------------------------------------------------------

const s1 = 'vn_rhyme_group_am_ap';
const l1Q: Question[] = [
  mc('vn-r1-1', s1, 1, 'Từ nào dưới đây có vần “am”?', ['cam', 'đạp', 'bắp', 'cầm'], 'cam', 'Từ “cam” có vần am.', '🍊'),
  mc('vn-r1-2', s1, 1, 'Từ nào có vần “ap”?', ['đạp', 'cam', 'chăm', 'cấp'], 'đạp', 'Từ “đạp” có vần ap.', '🚲'),
  mc('vn-r1-3', s1, 1, 'Từ nào có vần “ăm”?', ['chăm', 'cam', 'đạp', 'ấm'], 'chăm', 'Từ “chăm” có vần ăm.'),
  mc('vn-r1-4', s1, 2, 'Từ nào có vần “ăp”?', ['bắp', 'chăm', 'cam', 'ấm'], 'bắp', 'Từ “bắp” có vần ăp.', '🌽'),
  mc('vn-r1-5', s1, 2, 'Từ nào có vần “âm”?' , ['cầm', 'bắp', 'cam', 'chăm'], 'cầm', 'Từ “cầm” có vần âm.', '✏️'),
  mc('vn-r1-6', s1, 3, 'Từ nào có vần “âp”?' , ['cấp', 'cầm', 'bắp', 'cam'], 'cấp', 'Từ “cấp” có vần âp.'),
  img('vn-r1-7', s1, 1, 'Hình quả cam 🍊 có vần gì?', '🍊', ['am', 'ap', 'ăm', 'âm'], 'am', 'Quả cam có vần am.'),
  fb('vn-r1-8', s1, 2, 'Điền từ còn thiếu: “Nước ... để pha trà.”', ['ấm', 'cấp', 'bắp', 'cam'], 'ấm', 'Nước ấm để pha trà.'),
  fb('vn-r1-9', s1, 2, 'Điền từ còn thiếu: “... chín có màu vàng.”', ['Cam', 'Cấp', 'Bắp', 'Chăm'], 'Cam', 'Quả cam chín có màu vàng.'),
  tf('vn-r1-10', s1, 1, 'Từ “bắp” có vần “ăp”. Đúng hay sai?', 'Đúng', 'Đúng, “bắp” có vần ăp.'),
  tf('vn-r1-11', s1, 2, 'Từ “chăm” có vần “ăm”. Đúng hay sai?', 'Đúng', 'Đúng, “chăm” có vần ăm.'),
  tf('vn-r1-12', s1, 3, 'Hai từ “tăm” và “cấp” cùng có vần “ăm”. Đúng hay sai?', 'Sai', 'Sai, “tăm” vần ăm còn “cấp” vần âp.'),
];
const l1 = vnLesson(RHYME_TOPIC, 'vn-les-r1', 'Vần am, ap, ăm, ăp, âm, âp', 'Nhận biết và đọc các vần nhóm am, ap, ăm, ăp, âm, âp qua từ quen thuộc.', 'Nghe kỹ âm cuối để phân biệt a, ă, â nhé!', l1Q);

// ---------------------------------------------------------------------------
// Bài 2 — om, op, ôm, ôp, ơm, ơp
// ---------------------------------------------------------------------------

const s2 = 'vn_rhyme_group_om_op';
const l2Q: Question[] = [
  mc('vn-r2-1', s2, 1, 'Từ nào dưới đây có vần “om”?', ['xóm', 'cọp', 'tôm', 'cơm'], 'xóm', 'Từ “xóm” có vần om.', '🏘️'),
  mc('vn-r2-2', s2, 1, 'Từ nào có vần “op”?', ['cọp', 'xóm', 'hộp', 'lớp'], 'cọp', 'Từ “cọp” có vần op.', '🐅'),
  mc('vn-r2-3', s2, 1, 'Từ nào có vần “ôm”?', ['tôm', 'cơm', 'cọp', 'xóm'], 'tôm', 'Từ “tôm” có vần ôm.', '🦐'),
  mc('vn-r2-4', s2, 2, 'Từ nào có vần “ôp”?', ['hộp', 'lớp', 'tôm', 'cọp'], 'hộp', 'Từ “hộp” có vần ôp.', '📦'),
  mc('vn-r2-5', s2, 2, 'Từ nào có vần “ơm”?', ['cơm', 'tôm', 'hộp', 'xóm'], 'cơm', 'Từ “cơm” có vần ơm.', '🍚'),
  mc('vn-r2-6', s2, 3, 'Từ nào có vần “ơp”?', ['lớp', 'hộp', 'cơm', 'tôm'], 'lớp', 'Từ “lớp” có vần ơp.', '🏫'),
  img('vn-r2-7', s2, 1, 'Hình con tôm 🦐 có vần gì?', '🦐', ['ôm', 'om', 'ơm', 'op'], 'ôm', 'Con tôm có vần ôm.'),
  fb('vn-r2-8', s2, 2, 'Điền từ còn thiếu: “Mẹ để quà trong ... giấy.”', ['hộp', 'lớp', 'cơm', 'cọp'], 'hộp', 'Quà được đựng trong hộp giấy.'),
  fb('vn-r2-9', s2, 2, 'Điền từ còn thiếu: “Bữa tối có ... và canh.”', ['cơm', 'hộp', 'tôm', 'xóm'], 'cơm', 'Bữa tối có cơm và canh.'),
  tf('vn-r2-10', s2, 1, 'Từ “cọp” có vần “op”. Đúng hay sai?', 'Đúng', 'Đúng, “cọp” có vần op.'),
  tf('vn-r2-11', s2, 2, 'Từ “tôm” có vần “ơm”. Đúng hay sai?', 'Sai', 'Sai, “tôm” có vần ôm.'),
  tf('vn-r2-12', s2, 3, 'Hai từ “lớp” và “cơm” cùng có vần “ơp”. Đúng hay sai?', 'Sai', 'Sai, “lớp” vần ơp còn “cơm” vần ơm.'),
];
const l2 = vnLesson(RHYME_TOPIC, 'vn-les-r2', 'Vần om, op, ôm, ôp, ơm, ơp', 'Nhận biết và đọc các vần nhóm om, op, ôm, ôp, ơm, ơp qua từ quen thuộc.', 'Phân biệt o, ô, ơ khi đọc vần nhé!', l2Q);

// ---------------------------------------------------------------------------
// Bài 3 — em, ep, êm, êp
// ---------------------------------------------------------------------------

const s3 = 'vn_rhyme_group_em_ep';
const l3Q: Question[] = [
  mc('vn-r3-1', s3, 1, 'Từ nào dưới đây có vần “em”?', ['kem', 'vẹt', 'nến', 'bếp'], 'kem', 'Từ “kem” có vần em.', '🍦'),
  mc('vn-r3-2', s3, 1, 'Từ nào có vần “ep”?', ['dép', 'kem', 'nến', 'bếp'], 'dép', 'Từ “dép” có vần ep.', '👡'),
  mc('vn-r3-3', s3, 1, 'Từ nào có vần “êm”?', ['đêm', 'kem', 'dép', 'bếp'], 'đêm', 'Từ “đêm” có vần êm.', '🌙'),
  mc('vn-r3-4', s3, 1, 'Từ nào có vần “êp”?', ['bếp', 'đêm', 'dép', 'kem'], 'bếp', 'Từ “bếp” có vần êp.', '🔥'),
  mc('vn-r3-5', s3, 2, 'Từ “xem” có vần nào?', ['em', 'ep', 'êm', 'êp'], 'em', 'Từ “xem” có vần em.'),
  mc('vn-r3-6', s3, 2, 'Từ “đẹp” có vần nào?', ['ep', 'em', 'êp', 'êm'], 'ep', 'Từ “đẹp” có vần ep.'),
  mc('vn-r3-7', s3, 3, 'Từ “thêm” có vần nào?', ['êm', 'em', 'ep', 'êp'], 'êm', 'Từ “thêm” có vần êm.'),
  img('vn-r3-8', s3, 1, 'Hình ngọn bếp lửa 🔥 có vần gì?', '🔥', ['êp', 'ep', 'êm', 'em'], 'êp', 'Bếp có vần êp.'),
  fb('vn-r3-9', s3, 2, 'Điền từ còn thiếu: “Bé ăn ... mát lạnh.”', ['kem', 'dép', 'bếp', 'đêm'], 'kem', 'Bé ăn kem mát lạnh.'),
  fb('vn-r3-10', s3, 2, 'Điền từ còn thiếu: “Bé mang ... ở chân.”', ['dép', 'kem', 'bếp', 'đêm'], 'dép', 'Bé mang dép ở chân.'),
  tf('vn-r3-11', s3, 1, 'Từ “đêm” có vần “êm”. Đúng hay sai?', 'Đúng', 'Đúng, “đêm” có vần êm.'),
  tf('vn-r3-12', s3, 3, 'Hai từ “kem” và “xem” cùng có vần “em”. Đúng hay sai?', 'Đúng', 'Đúng, cả hai từ đều có vần em.'),
];
const l3 = vnLesson(RHYME_TOPIC, 'vn-les-r3', 'Vần em, ep, êm, êp', 'Nhận biết và đọc các vần nhóm em, ep, êm, êp qua từ quen thuộc.', 'Phân biệt e và ê khi đọc vần nhé!', l3Q);

// ---------------------------------------------------------------------------
// Bài 4 — im, ip, um, up
// ---------------------------------------------------------------------------

const s4 = 'vn_rhyme_group_im_ip';
const l4Q: Question[] = [
  mc('vn-r4-1', s4, 1, 'Từ nào dưới đây có vần “im”?', ['chim', 'nhịp', 'bùn', 'búp'], 'chim', 'Từ “chim” có vần im.', '🐦'),
  mc('vn-r4-2', s4, 1, 'Từ nào có vần “ip”?', ['nhịp', 'chim', 'bùn', 'búp'], 'nhịp', 'Từ “nhịp” có vần ip.'),
  mc('vn-r4-3', s4, 1, 'Từ nào có vần “um”?', ['bùn', 'chim', 'nhịp', 'búp'], 'bùn', 'Từ “bùn” có vần um.'),
  mc('vn-r4-4', s4, 1, 'Từ nào có vần “up”?', ['búp', 'bùn', 'chim', 'nhịp'], 'búp', 'Từ “búp” có vần up.', '🌱'),
  mc('vn-r4-5', s4, 2, 'Từ “tim” có vần nào?', ['im', 'ip', 'um', 'up'], 'im', 'Từ “tim” có vần im.', '❤️'),
  mc('vn-r4-6', s4, 2, 'Từ “cúp” có vần nào?', ['up', 'im', 'ip', 'um'], 'up', 'Từ “cúp” có vần up.', '🏆'),
  mc('vn-r4-7', s4, 3, 'Từ “chùm” có vần nào?', ['um', 'im', 'ip', 'up'], 'um', 'Từ “chùm” có vần um.', '🍇'),
  img('vn-r4-8', s4, 1, 'Hình con chim 🐦 có vần gì?', '🐦', ['im', 'ip', 'um', 'up'], 'im', 'Con chim có vần im.'),
  fb('vn-r4-9', s4, 2, 'Điền từ còn thiếu: “Đàn ... bay trên trời.”', ['chim', 'bùn', 'búp', 'nhịp'], 'chim', 'Đàn chim bay trên trời.'),
  fb('vn-r4-10', s4, 2, 'Điền từ còn thiếu: “... hoa chưa nở.”', ['búp', 'bùn', 'chim', 'nhịp'], 'búp', 'Búp hoa chưa nở.'),
  tf('vn-r4-11', s4, 1, 'Từ “bùn” có vần “um”. Đúng hay sai?', 'Đúng', 'Đúng, “bùn” có vần um.'),
  tf('vn-r4-12', s4, 3, 'Từ “nhịp” có vần “im”. Đúng hay sai?', 'Sai', 'Sai, “nhịp” có vần ip.'),
];
const l4 = vnLesson(RHYME_TOPIC, 'vn-les-r4', 'Vần im, ip, um, up', 'Nhận biết và đọc các vần nhóm im, ip, um, up qua từ quen thuộc.', 'Phân biệt i và u khi đọc vần nhé!', l4Q);

// ---------------------------------------------------------------------------
// Bài 5 — an, at, ăn, ăt, ân, ât
// ---------------------------------------------------------------------------

const s5 = 'vn_rhyme_group_an_at';
const l5Q: Question[] = [
  mc('vn-r5-1', s5, 1, 'Từ nào dưới đây có vần “an”?', ['bàn', 'hạt', 'khăn', 'mắt'], 'bàn', 'Từ “bàn” có vần an.', '🪑'),
  mc('vn-r5-2', s5, 1, 'Từ nào có vần “at”?', ['hạt', 'bàn', 'khăn', 'mắt'], 'hạt', 'Từ “hạt” có vần at.', '🌾'),
  mc('vn-r5-3', s5, 1, 'Từ nào có vần “ăn”?', ['khăn', 'bàn', 'hạt', 'mắt'], 'khăn', 'Từ “khăn” có vần ăn.', '🧣'),
  mc('vn-r5-4', s5, 1, 'Từ nào có vần “ăt”?', ['mắt', 'bàn', 'hạt', 'khăn'], 'mắt', 'Từ “mắt” có vần ăt.', '👀'),
  mc('vn-r5-5', s5, 2, 'Từ nào có vần “ân”?', ['chân', 'hạt', 'đất', 'khăn'], 'chân', 'Từ “chân” có vần ân.', '🦶'),
  mc('vn-r5-6', s5, 3, 'Từ nào có vần “ât”?', ['đất', 'chân', 'hạt', 'khăn'], 'đất', 'Từ “đất” có vần ât.'),
  img('vn-r5-7', s5, 1, 'Hình đôi mắt 👀 có vần gì?', '👀', ['ăt', 'at', 'ăn', 'ân'], 'ăt', 'Đôi mắt có vần ăt.'),
  fb('vn-r5-8', s5, 2, 'Điền từ còn thiếu: “Bé ngồi trên ...”', ['bàn', 'hạt', 'khăn', 'mắt'], 'bàn', 'Bé ngồi trên bàn.'),
  fb('vn-r5-9', s5, 2, 'Điền từ còn thiếu: “Bãi biển đầy ...”', ['cát', 'hạt', 'chân', 'khăn'], 'cát', 'Bãi biển đầy cát.'),
  tf('vn-r5-10', s5, 1, 'Từ “hạt” có vần “at”. Đúng hay sai?', 'Đúng', 'Đúng, “hạt” có vần at.'),
  tf('vn-r5-11', s5, 2, 'Từ “mắt” có vần “ăt”. Đúng hay sai?', 'Đúng', 'Đúng, “mắt” có vần ăt.'),
  tf('vn-r5-12', s5, 3, 'Hai từ “khăn” và “chân” cùng có vần “ăn”. Đúng hay sai?', 'Sai', 'Sai, “khăn” vần ăn còn “chân” vần ân.'),
];
const l5 = vnLesson(RHYME_TOPIC, 'vn-les-r5', 'Vần an, at, ăn, ăt, ân, ât', 'Nhận biết và đọc các vần nhóm an, at, ăn, ăt, ân, ât qua từ quen thuộc.', 'Nghe kỹ âm cuối để phân biệt a, ă, â nhé!', l5Q);

// ---------------------------------------------------------------------------
// Bài 5b — on, ot, ôn, ôt, ơn, ơt
// ---------------------------------------------------------------------------

const s5b = 'vn_rhyme_group_on_ot';
const l5bQ: Question[] = [
  mc('vn-r5b-1', s5b, 1, 'Từ nào dưới đây có vần “on”?', ['con', 'ngọt', 'chồn', 'sơn'], 'con', 'Từ “con” có vần on.', '🐔'),
  mc('vn-r5b-2', s5b, 1, 'Từ nào có vần “ot”?', ['ngọt', 'con', 'chồn', 'sơn'], 'ngọt', 'Từ “ngọt” có vần ot.', '🍬'),
  mc('vn-r5b-3', s5b, 1, 'Từ nào có vần “ôn”?', ['chồn', 'con', 'ngọt', 'sơn'], 'chồn', 'Từ “chồn” có vần ôn.', '🦊'),
  mc('vn-r5b-4', s5b, 1, 'Từ nào có vần “ôt”?', ['một', 'chồn', 'ngọt', 'sơn'], 'một', 'Từ “một” có vần ôt.', '1️⃣'),
  mc('vn-r5b-5', s5b, 2, 'Từ nào có vần “ơn”?', ['sơn', 'con', 'ngọt', 'chồn'], 'sơn', 'Từ “sơn” có vần ơn.', '🎨'),
  mc('vn-r5b-6', s5b, 3, 'Từ nào có vần “ơt”?', ['ớt', 'sơn', 'con', 'ngọt'], 'ớt', 'Từ “ớt” có vần ơt.', '🌶️'),
  img('vn-r5b-7', s5b, 1, 'Hình quả ớt 🌶️ có vần gì?', '🌶️', ['ơt', 'ot', 'ôt', 'ơn'], 'ơt', 'Quả ớt có vần ơt.'),
  fb('vn-r5b-8', s5b, 2, 'Điền từ còn thiếu: “Mẹ ... nước cam cho bé.”', ['rót', 'con', 'ngọt', 'sơn'], 'rót', 'Mẹ rót nước cam cho bé.'),
  fb('vn-r5b-9', s5b, 2, 'Điền từ còn thiếu: “Nhà bé có năm ...”', ['con', 'rót', 'ngọt', 'sơn'], 'con', 'Nhà bé có năm con.'),
  tf('vn-r5b-10', s5b, 1, 'Từ “ngọt” có vần “ot”. Đúng hay sai?', 'Đúng', 'Đúng, “ngọt” có vần ot.'),
  tf('vn-r5b-11', s5b, 2, 'Từ “một” có vần “ôt”. Đúng hay sai?', 'Đúng', 'Đúng, “một” có vần ôt.'),
  tf('vn-r5b-12', s5b, 3, 'Hai từ “ớt” và “sơn” cùng có vần “ơn”. Đúng hay sai?', 'Sai', 'Sai, “ớt” vần ơt còn “sơn” vần ơn.'),
];
const l5b = vnLesson(RHYME_TOPIC, 'vn-les-r5b', 'Vần on, ot, ôn, ôt, ơn, ơt', 'Nhận biết và đọc các vần nhóm on, ot, ôn, ôt, ơn, ơt qua từ quen thuộc.', 'Phân biệt o, ô, ơ khi đọc vần nhé!', l5bQ);

// ---------------------------------------------------------------------------
// Bài 6 — en, et, ên, êt
// ---------------------------------------------------------------------------

const s6 = 'vn_rhyme_group_en_et';
const l6Q: Question[] = [
  mc('vn-r6-1', s6, 1, 'Từ nào dưới đây có vần “en”?', ['kèn', 'vẹt', 'nến', 'Tết'], 'kèn', 'Từ “kèn” có vần en.', '🎺'),
  mc('vn-r6-2', s6, 1, 'Từ nào có vần “et”?', ['vẹt', 'kèn', 'nến', 'Tết'], 'vẹt', 'Từ “vẹt” có vần et.', '🦜'),
  mc('vn-r6-3', s6, 1, 'Từ nào có vần “ên”?', ['nến', 'kèn', 'vẹt', 'Tết'], 'nến', 'Từ “nến” có vần ên.', '🕯️'),
  mc('vn-r6-4', s6, 1, 'Từ nào có vần “êt”?', ['Tết', 'nến', 'kèn', 'vẹt'], 'Tết', 'Từ “Tết” có vần êt.', '🎉'),
  mc('vn-r6-5', s6, 2, 'Từ “sen” có vần nào?', ['en', 'et', 'ên', 'êt'], 'en', 'Từ “sen” có vần en.', '💮'),
  mc('vn-r6-6', s6, 2, 'Từ “trên” có vần nào?', ['ên', 'en', 'et', 'êt'], 'ên', 'Từ “trên” có vần ên.'),
  mc('vn-r6-7', s6, 3, 'Từ “hết” có vần nào?', ['êt', 'ên', 'en', 'et'], 'êt', 'Từ “hết” có vần êt.'),
  img('vn-r6-8', s6, 1, 'Hình con vẹt 🦜 có vần gì?', '🦜', ['et', 'en', 'êt', 'ên'], 'et', 'Con vẹt có vần et.'),
  fb('vn-r6-9', s6, 2, 'Điền từ còn thiếu: “Mẹ thắp ... cho sáng.”', ['nến', 'kèn', 'vẹt', 'sen'], 'nến', 'Mẹ thắp nến cho sáng.'),
  fb('vn-r6-10', s6, 2, 'Điền từ còn thiếu: “Hoa ... nở trong đầm.”', ['sen', 'nến', 'vẹt', 'kèn'], 'sen', 'Hoa sen nở trong đầm.'),
  tf('vn-r6-11', s6, 1, 'Từ “đen” có vần “en”. Đúng hay sai?', 'Đúng', 'Đúng, “đen” có vần en.'),
  tf('vn-r6-12', s6, 3, 'Hai từ “Tết” và “nến” cùng có vần “ên”. Đúng hay sai?', 'Sai', 'Sai, “Tết” vần êt còn “nến” vần ên.'),
];
const l6 = vnLesson(RHYME_TOPIC, 'vn-les-r6', 'Vần en, et, ên, êt', 'Nhận biết và đọc các vần nhóm en, et, ên, êt qua từ quen thuộc.', 'Phân biệt e và ê khi đọc vần nhé!', l6Q);

// ---------------------------------------------------------------------------
// Bài 7 — in, it, un, ut, ưt
// ---------------------------------------------------------------------------

const s7 = 'vn_rhyme_group_in_it';
const l7Q: Question[] = [
  mc('vn-r7-1', s7, 1, 'Từ nào dưới đây có vần “in”?', ['pin', 'mít', 'cún', 'bút'], 'pin', 'Từ “pin” có vần in.', '🔋'),
  mc('vn-r7-2', s7, 1, 'Từ nào có vần “it”?', ['mít', 'pin', 'cún', 'bút'], 'mít', 'Từ “mít” có vần it.', '🍈'),
  mc('vn-r7-3', s7, 1, 'Từ nào có vần “un”?', ['cún', 'pin', 'mít', 'bút'], 'cún', 'Từ “cún” có vần un.', '🐶'),
  mc('vn-r7-4', s7, 1, 'Từ nào có vần “ut”?', ['bút', 'cún', 'pin', 'mít'], 'bút', 'Từ “bút” có vần ut.', '✏️'),
  mc('vn-r7-5', s7, 2, 'Từ nào có vần “ưt”?', ['mứt', 'bút', 'cún', 'pin'], 'mứt', 'Từ “mứt” có vần ưt.', '🍯'),
  mc('vn-r7-6', s7, 2, 'Từ “thịt” có vần nào?', ['it', 'in', 'ut', 'ưt'], 'it', 'Từ “thịt” có vần it.'),
  mc('vn-r7-7', s7, 3, 'Từ “vứt” có vần nào?', ['ưt', 'ut', 'in', 'it'], 'ưt', 'Từ “vứt” có vần ưt.', '🗑️'),
  img('vn-r7-8', s7, 1, 'Hình con cún 🐶 có vần gì?', '🐶', ['un', 'ut', 'ưt', 'in'], 'un', 'Con cún có vần un.'),
  fb('vn-r7-9', s7, 2, 'Điền từ còn thiếu: “Bé cầm ... để viết chữ.”', ['bút', 'mít', 'cún', 'mứt'], 'bút', 'Bé cầm bút để viết chữ.'),
  fb('vn-r7-10', s7, 2, 'Điền từ còn thiếu: “Hộp ... ăn ngày Tết.”', ['mứt', 'bút', 'mít', 'cún'], 'mứt', 'Hộp mứt ăn ngày Tết.'),
  tf('vn-r7-11', s7, 1, 'Từ “mít” có vần “it”. Đúng hay sai?', 'Đúng', 'Đúng, “mít” có vần it.'),
  tf('vn-r7-12', s7, 3, 'Hai từ “bùn” và “cún” cùng có vần “un”. Đúng hay sai?', 'Đúng', 'Đúng, cả hai từ đều có vần un.'),
];
const l7 = vnLesson(RHYME_TOPIC, 'vn-les-r7', 'Vần in, it, un, ut, ưt', 'Nhận biết và đọc các vần nhóm in, it, un, ut, ưt qua từ quen thuộc.', 'Phân biệt i và u khi đọc vần nhé!', l7Q);

// ---------------------------------------------------------------------------
// Bài 8 — ang, ac, ăng, ăc, âng, âc
// ---------------------------------------------------------------------------

const s8 = 'vn_rhyme_group_ang_ac';
const l8Q: Question[] = [
  mc('vn-r8-1', s8, 1, 'Từ nào dưới đây có vần “ang”?', ['làng', 'hạc', 'trăng', 'mắc'], 'làng', 'Từ “làng” có vần ang.', '🏘️'),
  mc('vn-r8-2', s8, 1, 'Từ nào có vần “ac”?', ['hạc', 'làng', 'trăng', 'mắc'], 'hạc', 'Từ “hạc” có vần ac.', '🐦'),
  mc('vn-r8-3', s8, 1, 'Từ nào có vần “ăng”?', ['trăng', 'làng', 'hạc', 'mắc'], 'trăng', 'Từ “trăng” có vần ăng.', '🌕'),
  mc('vn-r8-4', s8, 1, 'Từ nào có vần “ăc”?', ['mắc', 'làng', 'hạc', 'trăng'], 'mắc', 'Từ “mắc” có vần ăc.'),
  mc('vn-r8-5', s8, 2, 'Từ nào có vần “âng”?', ['vâng', 'làng', 'mắc', 'hạc'], 'vâng', 'Từ “vâng” có vần âng.'),
  mc('vn-r8-6', s8, 3, 'Từ nào có vần “âc”?', ['bậc', 'vâng', 'làng', 'mắc'], 'bậc', 'Từ “bậc” có vần âc.'),
  img('vn-r8-7', s8, 1, 'Hình vầng trăng 🌕 có vần gì?', '🌕', ['ăng', 'ang', 'ăc', 'âc'], 'ăng', 'Vầng trăng có vần ăng.'),
  fb('vn-r8-8', s8, 2, 'Điền từ còn thiếu: “Ánh ... vàng trải khắp sân.”', ['nắng', 'làng', 'mắc', 'hạc'], 'nắng', 'Ánh nắng vàng trải khắp sân.'),
  fb('vn-r8-9', s8, 2, 'Điền từ còn thiếu: “Bé treo áo lên ...”', ['mắc', 'làng', 'trăng', 'hạc'], 'mắc', 'Bé treo áo lên mắc.'),
  tf('vn-r8-10', s8, 1, 'Từ “trăng” có vần “ăng”. Đúng hay sai?', 'Đúng', 'Đúng, “trăng” có vần ăng.'),
  tf('vn-r8-11', s8, 2, 'Từ “hạc” có vần “ac”. Đúng hay sai?', 'Đúng', 'Đúng, “hạc” có vần ac.'),
  tf('vn-r8-12', s8, 3, 'Hai từ “vâng” và “bậc” cùng có vần “âng”. Đúng hay sai?', 'Sai', 'Sai, “vâng” vần âng còn “bậc” vần âc.'),
];
const l8 = vnLesson(RHYME_TOPIC, 'vn-les-r8', 'Vần ang, ac, ăng, ăc, âng, âc', 'Nhận biết và đọc các vần nhóm ang, ac, ăng, ăc, âng, âc qua từ quen thuộc.', 'Phân biệt a, ă, â khi đọc vần nhé!', l8Q);

// ---------------------------------------------------------------------------
// Bài 9 — ong, oc, ông, ôc
// ---------------------------------------------------------------------------

const s9 = 'vn_rhyme_group_ong_oc';
const l9Q: Question[] = [
  mc('vn-r9-1', s9, 1, 'Từ nào dưới đây có vần “ong”?', ['ong', 'sóc', 'sông', 'ốc'], 'ong', 'Từ “ong” có vần ong.', '🐝'),
  mc('vn-r9-2', s9, 1, 'Từ nào có vần “oc”?', ['sóc', 'ong', 'sông', 'ốc'], 'sóc', 'Từ “sóc” có vần oc.', '🐿️'),
  mc('vn-r9-3', s9, 1, 'Từ nào có vần “ông”?', ['sông', 'ong', 'sóc', 'ốc'], 'sông', 'Từ “sông” có vần ông.', '🏞️'),
  mc('vn-r9-4', s9, 1, 'Từ nào có vần “ôc”?', ['ốc', 'ong', 'sóc', 'sông'], 'ốc', 'Từ “ốc” có vần ôc.', '🐌'),
  mc('vn-r9-5', s9, 2, 'Từ “tóc” có vần nào?', ['oc', 'ong', 'ông', 'ôc'], 'oc', 'Từ “tóc” có vần oc.'),
  mc('vn-r9-6', s9, 2, 'Từ “cốc” có vần nào?', ['ôc', 'oc', 'ong', 'ông'], 'ôc', 'Từ “cốc” có vần ôc.', '🥤'),
  mc('vn-r9-7', s9, 3, 'Từ “hồng” có vần nào?', ['ông', 'ong', 'oc', 'ôc'], 'ông', 'Từ “hồng” có vần ông.', '🌹'),
  img('vn-r9-8', s9, 1, 'Hình con ong 🐝 có vần gì?', '🐝', ['ong', 'oc', 'ông', 'ôc'], 'ong', 'Con ong có vần ong.'),
  fb('vn-r9-9', s9, 2, 'Điền từ còn thiếu: “Đàn ... bay đi tìm mật.”', ['ong', 'sóc', 'sông', 'ốc'], 'ong', 'Đàn ong bay đi tìm mật.'),
  fb('vn-r9-10', s9, 2, 'Điền từ còn thiếu: “Con ... chuyền cành hái hạt.”', ['sóc', 'ong', 'sông', 'ốc'], 'sóc', 'Con sóc chuyền cành hái hạt.'),
  tf('vn-r9-11', s9, 1, 'Từ “sóc” có vần “oc”. Đúng hay sai?', 'Đúng', 'Đúng, “sóc” có vần oc.'),
  tf('vn-r9-12', s9, 3, 'Hai từ “sông” và “ốc” cùng có vần “ông”. Đúng hay sai?', 'Sai', 'Sai, “sông” vần ông còn “ốc” vần ôc.'),
];
const l9 = vnLesson(RHYME_TOPIC, 'vn-les-r9', 'Vần ong, oc, ông, ôc', 'Nhận biết và đọc các vần nhóm ong, oc, ông, ôc qua từ quen thuộc.', 'Phân biệt o, ô khi đọc vần nhé!', l9Q);

// ---------------------------------------------------------------------------
// Bài 10 — ung, uc, ưng, ưc
// ---------------------------------------------------------------------------

const s10 = 'vn_rhyme_group_ung_uc';
const l10Q: Question[] = [
  mc('vn-r10-1', s10, 1, 'Từ nào dưới đây có vần “ung”?', ['tung', 'cúc', 'rừng', 'mực'], 'tung', 'Từ “tung” có vần ung.'),
  mc('vn-r10-2', s10, 1, 'Từ nào có vần “uc”?', ['cúc', 'tung', 'rừng', 'mực'], 'cúc', 'Từ “cúc” có vần uc.', '🌼'),
  mc('vn-r10-3', s10, 1, 'Từ nào có vần “ưng”?', ['rừng', 'tung', 'cúc', 'mực'], 'rừng', 'Từ “rừng” có vần ưng.', '🌲'),
  mc('vn-r10-4', s10, 1, 'Từ nào có vần “ưc”?', ['mực', 'rừng', 'tung', 'cúc'], 'mực', 'Từ “mực” có vần ưc.', '🦑'),
  mc('vn-r10-5', s10, 2, 'Từ “lúc” có vần nào?', ['uc', 'ung', 'ưng', 'ưc'], 'uc', 'Từ “lúc” có vần uc.'),
  mc('vn-r10-6', s10, 2, 'Từ “mừng” có vần nào?', ['ưng', 'ung', 'uc', 'ưc'], 'ưng', 'Từ “mừng” có vần ưng.'),
  mc('vn-r10-7', s10, 3, 'Từ “thức” có vần nào?', ['ưc', 'ưng', 'ung', 'uc'], 'ưc', 'Từ “thức” có vần ưc.'),
  img('vn-r10-8', s10, 1, 'Hình con mực 🦑 có vần gì?', '🦑', ['ưc', 'uc', 'ung', 'ưng'], 'ưc', 'Con mực có vần ưc.'),
  fb('vn-r10-9', s10, 2, 'Điền từ còn thiếu: “Mùa xuân hoa ... nở vàng.”', ['cúc', 'mực', 'rừng', 'tung'], 'cúc', 'Mùa xuân hoa cúc nở vàng.'),
  fb('vn-r10-10', s10, 2, 'Điền từ còn thiếu: “Trâu ... nhau trên đồng cỏ.”', ['húc', 'cúc', 'mực', 'rừng'], 'húc', 'Trâu húc nhau trên đồng cỏ.'),
  tf('vn-r10-11', s10, 1, 'Từ “rừng” có vần “ưng”. Đúng hay sai?', 'Đúng', 'Đúng, “rừng” có vần ưng.'),
  tf('vn-r10-12', s10, 3, 'Từ “mực” có vần “uc”. Đúng hay sai?', 'Sai', 'Sai, “mực” có vần ưc.'),
];
const l10 = vnLesson(RHYME_TOPIC, 'vn-les-r10', 'Vần ung, uc, ưng, ưc', 'Nhận biết và đọc các vần nhóm ung, uc, ưng, ưc qua từ quen thuộc.', 'Phân biệt u và ư khi đọc vần nhé!', l10Q);

// ---------------------------------------------------------------------------
// Bài 11 — anh, ach, ênh, êch, inh, ich
// ---------------------------------------------------------------------------

const s11 = 'vn_rhyme_group_anh_ach';
const l11Q: Question[] = [
  mc('vn-r11-1', s11, 1, 'Từ nào dưới đây có vần “anh”?', ['bánh', 'sách', 'kênh', 'ếch'], 'bánh', 'Từ “bánh” có vần anh.', '🥖'),
  mc('vn-r11-2', s11, 1, 'Từ nào có vần “ach”?', ['sách', 'bánh', 'kính', 'lịch'], 'sách', 'Từ “sách” có vần ach.', '📚'),
  mc('vn-r11-3', s11, 1, 'Từ nào có vần “ênh”?', ['kênh', 'bánh', 'sách', 'lịch'], 'kênh', 'Từ “kênh” có vần ênh.', '🌊'),
  mc('vn-r11-4', s11, 1, 'Từ nào có vần “êch”?', ['ếch', 'kênh', 'bánh', 'sách'], 'ếch', 'Từ “ếch” có vần êch.', '🐸'),
  mc('vn-r11-5', s11, 1, 'Từ nào có vần “inh”?', ['kính', 'ếch', 'kênh', 'bánh'], 'kính', 'Từ “kính” có vần inh.', '👓'),
  mc('vn-r11-6', s11, 1, 'Từ nào có vần “ich”?', ['lịch', 'kính', 'ếch', 'kênh'], 'lịch', 'Từ “lịch” có vần ich.', '📅'),
  mc('vn-r11-7', s11, 2, 'Từ “xinh” có vần nào?', ['inh', 'ich', 'anh', 'ach'], 'inh', 'Từ “xinh” có vần inh.'),
  img('vn-r11-8', s11, 1, 'Hình con ếch 🐸 có vần gì?', '🐸', ['êch', 'ênh', 'inh', 'ich'], 'êch', 'Con ếch có vần êch.'),
  fb('vn-r11-9', s11, 2, 'Điền từ còn thiếu: “Mẹ mua một quyển ...”', ['sách', 'bánh', 'kính', 'lịch'], 'sách', 'Mẹ mua một quyển sách.'),
  fb('vn-r11-10', s11, 2, 'Điền từ còn thiếu: “Bé đeo ... để đọc chữ.”', ['kính', 'sách', 'bánh', 'lịch'], 'kính', 'Bé đeo kính để đọc chữ.'),
  tf('vn-r11-11', s11, 1, 'Từ “bánh” có vần “anh”. Đúng hay sai?', 'Đúng', 'Đúng, “bánh” có vần anh.'),
  tf('vn-r11-12', s11, 3, 'Hai từ “kênh” và “ếch” cùng có vần “ênh”. Đúng hay sai?', 'Sai', 'Sai, “kênh” vần ênh còn “ếch” vần êch.'),
];
const l11 = vnLesson(RHYME_TOPIC, 'vn-les-r11', 'Vần anh, ach, ênh, êch, inh, ich', 'Nhận biết và đọc các vần nhóm anh, ach, ênh, êch, inh, ich qua từ quen thuộc.', 'Phân biệt anh và ach, inh và ich khi đọc vần nhé!', l11Q);

export const RHYME_LESSONS: Lesson[] = [l1, l2, l3, l4, l5, l5b, l6, l7, l8, l9, l10, l11];

export const RHYME_SKILLS: string[] = [s1, s2, s3, s4, s5, s5b, s6, s7, s8, s9, s10, s11];
