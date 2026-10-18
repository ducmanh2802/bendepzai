import { CompetitionQuestion } from '../types/competition';

/**
 * COMPETITION BANK — TOURNAMENT EXPANSION (Trạng Nguyên 4 vòng)
 *
 * Original exam-like items modelled on the *structure* of Vietnamese
 * primary-school competitions (30 câu / 20 phút, 4 vòng Hương → Huyện →
 * Tỉnh → Quốc gia). All items are ORIGINAL — no copied official questions.
 *
 * Safety: matching / ordering keys are COMPUTED, choice positions are
 * deterministically rotated round-robin so the bank stays balanced.
 */

type Pair = [string, string];
/** Separate round-robin counters per question type so MC and fill-blank each stay balanced. */
const mcCounters: Record<number, number> = {};
const fillCounters: Record<number, number> = {};

function placeWith(counter: Record<number, number>, options: string[], answer: string): string[] {
  const n = options.length;
  const current = options.indexOf(answer);
  if (current < 0 || n < 2) return [...options];
  const target = (counter[n] ?? 0) % n;
  counter[n] = (counter[n] ?? 0) + 1;
  const shift = (current - target + n) % n;
  return options.map((_, i) => options[(i + shift) % n]);
}

function placeAnswer(options: string[], answer: string): string[] {
  return placeWith(mcCounters, options, answer);
}

function placeFillAnswer(options: string[], answer: string): string[] {
  return placeWith(fillCounters, options, answer);
}

function mc(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  topic: CompetitionQuestion['topic'],
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  options: string[],
  answer: string,
  explanation: string,
  estimatedSeconds: number,
  mediaEmoji?: string,
): CompetitionQuestion {
  return {
    id, subject, skillId, topic, difficulty, prompt,
    mediaEmoji, options: placeAnswer(options, answer),
    correctAnswer: answer, explanation, estimatedSeconds, version: 1,
    questionType: 'multiple-choice',
  };
}

function tf(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  topic: CompetitionQuestion['topic'],
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  verdict: 'Đúng' | 'Sai',
  explanation: string,
  estimatedSeconds: number,
  mediaEmoji?: string,
): CompetitionQuestion {
  return {
    id, subject, skillId, topic, difficulty, prompt,
    mediaEmoji, options: ['Đúng', 'Sai'],
    correctAnswer: verdict, explanation, estimatedSeconds, version: 1,
    questionType: 'true-false',
  };
}

function fill(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  topic: CompetitionQuestion['topic'],
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  options: string[],
  answer: string,
  explanation: string,
  estimatedSeconds: number,
  mediaEmoji?: string,
): CompetitionQuestion {
  return {
    id, subject, skillId, topic, difficulty, prompt,
    mediaEmoji, options: placeFillAnswer(options, answer),
    correctAnswer: answer, explanation, estimatedSeconds, version: 1,
    questionType: 'fill-blank',
  };
}

function matching(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  topic: CompetitionQuestion['topic'],
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  pairs: Pair[],
  rightOptions: string[],
  explanation: string,
  estimatedSeconds: number,
  mediaEmoji?: string,
): CompetitionQuestion {
  return {
    id, subject, skillId, topic, difficulty, prompt,
    mediaEmoji, options: rightOptions,
    matchingPairs: pairs.map(([left, right]) => ({ left, right })),
    correctAnswer: pairs.map(([l, r]) => `${l}=${r}`).join('|'),
    explanation, estimatedSeconds, version: 1,
    questionType: 'matching',
  };
}

function ordering(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  topic: CompetitionQuestion['topic'],
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  sequence: string[],
  explanation: string,
  estimatedSeconds: number,
  mediaEmoji?: string,
): CompetitionQuestion {
  const rngState = sequence.length * 7 + 3;
  const shuffled = [...sequence].sort((a, b) =>
    (a.charCodeAt(0) * 31 + rngState) % 7 - ((b.charCodeAt(0) * 31 + rngState) % 7));
  const opts = shuffled.join('') === sequence.join('') ? [...shuffled].reverse() : shuffled;
  return {
    id, subject, skillId, topic, difficulty, prompt,
    mediaEmoji, options: opts,
    orderingItems: [...sequence],
    correctAnswer: sequence.join('|'),
    explanation, estimatedSeconds, version: 1,
    questionType: 'ordering',
  };
}

function classify(
  id: string,
  subject: CompetitionQuestion['subject'],
  skillId: string,
  topic: CompetitionQuestion['topic'],
  difficulty: CompetitionQuestion['difficulty'],
  prompt: string,
  buckets: string[],
  itemWord: string,
  bucket: string,
  distractors: string[],
  explanation: string,
  estimatedSeconds: number,
  mediaEmoji?: string,
): CompetitionQuestion {
  return {
    id, subject, skillId, topic, difficulty, prompt: `${prompt} Từ "${itemWord}" thuộc nhóm nào?`,
    mediaEmoji, options: [itemWord, ...distractors],
    categoryBuckets: buckets,
    correctAnswer: bucket,
    explanation, estimatedSeconds, version: 1,
    questionType: 'classify',
  };
}

export const TOURNAMENT_QUESTIONS: CompetitionQuestion[] = [
  // ================= TIẾNG VIỆT — VÒNG HƯƠNG (cơ bản, EASY) =================
  mc('cq-tn-vn01', 'tieng-viet', 'TV-PHONICS', 'Ngữ âm', 'EASY', 'Vòng Hương 1: Chữ cái đứng đầu từ "Bút chì" là chữ nào?', ['B', 'D', 'P', 'T'], 'B', 'Từ Bút bắt đầu bằng chữ B. Bé nhớ hình chữ B có hai bụng tròn nhé.', 15, '✏️'),
  mc('cq-tn-vn02', 'tieng-viet', 'TV-TONES', 'Ngữ âm', 'EASY', 'Vòng Hương 2: Tiếng "bè" mang dấu thanh nào?', ['Dấu huyền (\\)', 'Dấu sắc (/)', 'Dấu hỏi (?)', 'Thanh ngang'], 'Dấu huyền (\\)', 'Tiếng bè có dấu huyền đặt trên ê. Bé đọc kéo dài giọng xuống nhé.', 15, '⛵'),
  mc('cq-tn-vn03', 'tieng-viet', 'TV-SPELLING', 'Chính tả', 'EASY', 'Vòng Hương 3: Viết đúng từ chỉ đồ dùng học tập?', ['cái kéo', 'kái kéo', 'cái káo', 'cái xéo'], 'cái kéo', 'Trước a, o, u ta viết c. Cái kéo là đáp án đúng.', 18, '✂️'),
  mc('cq-tn-vn04', 'tieng-viet', 'TV-SPELLING', 'Chính tả', 'EASY', 'Vòng Hương 4: Viết đúng từ chỉ con vật?', ['con mèo', 'kon mèo', 'con mèok', 'con mẻo'], 'con mèo', 'Từ mèo viết bằng m, e, o. Bé nhớ mèo kêu meo meo.', 18, '🐱'),
  mc('cq-tn-vn05', 'tieng-viet', 'TV-RHYME', 'Cấu tạo từ', 'EASY', 'Vòng Hương 5: Tiếng nào có vần "an"?', ['bàn', 'bòn', 'bền', 'bủn'], 'bàn', 'Tiếng bàn có vần an. Bé thử đánh vần b-an-ban-bàn nhé.', 15, '🪑'),
  mc('cq-tn-vn06', 'tieng-viet', 'TV-WORD', 'Từ vựng', 'EASY', 'Vòng Hương 6: Từ nào chỉ hoạt động?', ['chạy', 'bàn', 'ghế', 'sách'], 'chạy', 'Chạy là hoạt động của chân. Bàn, ghế, sách là đồ vật.', 15, '🏃'),
  tf('cq-tn-vn07', 'tieng-viet', 'TV-TONES', 'Ngữ âm', 'EASY', 'Vòng Hương 7: Tiếng "ngã" mang dấu ngã (~).', 'Đúng', 'Tiếng ngã có dấu ngã đặt trên a. Bé nói ngã là té đó.', 12, '🤸'),
  tf('cq-tn-vn08', 'tieng-viet', 'TV-WORD', 'Từ vựng', 'EASY', 'Vòng Hương 8: "Quả bóng" là từ chỉ con vật.', 'Sai', 'Quả bóng là đồ chơi, không phải con vật. Bé nhớ nhé.', 12, '⚽'),
  fill('cq-tn-vn09', 'tieng-viet', 'TV-SYLLABLE', 'Cấu tạo từ', 'EASY', 'Vòng Hương 9: Điền tiếng còn thiếu: "Bé ... sữa mỗi sáng."', ['uống', 'uốn', 'úng', 'uông'], 'uống', 'Câu đúng là bé uống sữa mỗi sáng. Uống có vần uông.', 18, '🥛'),
  fill('cq-tn-vn10', 'tieng-viet', 'TV-SPELLING', 'Chính tả', 'EASY', 'Vòng Hương 10: Điền chữ còn thiếu: "...im khâu"', ['k', 'c', 'q', 'h'], 'k', 'Trước i ta viết k. Kim khâu dùng k nhé bé.', 15, '🧵'),

  // ================= TIẾNG VIỆT — VÒNG HUYỆN (MEDIUM) =================
  mc('cq-tn-vn11', 'tieng-viet', 'TV-SPELLING', 'Chính tả', 'MEDIUM', 'Vòng Huyện 1: Chọn từ viết đúng quy tắc g/gh?', ['ghế gỗ', 'gế gỗ', 'ghế gổ', 'gé gỗ'], 'ghế gỗ', 'Trước e ta viết gh. Ghế gỗ là đáp án đúng.', 20, '🪑'),
  mc('cq-tn-vn12', 'tieng-viet', 'TV-SPELLING', 'Chính tả', 'MEDIUM', 'Vòng Huyện 2: Chọn từ viết đúng quy tắc ng/ngh?', ['nghỉ hè', 'ngỉ hè', 'nghĩ hè', 'nghi hè'], 'nghỉ hè', 'Trước i ta viết ngh. Nghỉ hè là kỳ nghỉ hè vui vẻ.', 20, '☀️'),
  mc('cq-tn-vn13', 'tieng-viet', 'TV-RHYME', 'Cấu tạo từ', 'MEDIUM', 'Vòng Huyện 3: Cặp tiếng nào cùng vần "on"?', ['con — non', 'con — cân', 'non — nên', 'con — cồn'], 'con — non', 'Con và non cùng vần on. Bé đọc con-non-on nhé.', 20, '🐚'),
  mc('cq-tn-vn14', 'tieng-viet', 'TV-SENTENCE', 'Ngữ pháp', 'MEDIUM', 'Vòng Huyện 4: Câu nào viết đúng?', ['Mẹ nấu cơm thơm.', 'Mẹ cơm nấu thơm.', 'Cơm mẹ thơm nấu.', 'Nấu mẹ cơm thơm.'], 'Mẹ nấu cơm thơm.', 'Câu đúng có chủ ngữ Mẹ đứng đầu, vị ngữ nấu cơm thơm đứng sau.', 22, '🍚'),
  matching('cq-tn-vn15', 'tieng-viet', 'TV-WORD', 'Từ vựng', 'MEDIUM', 'Vòng Huyện 5: Nối mỗi con vật với tiếng kêu đúng.', [['mèo', 'meo meo'], ['chó', 'gâu gâu'], ['gà', 'cục tác']], ['meo meo', 'gâu gâu', 'cục tác'], 'Mèo kêu meo meo, chó sủa gâu gâu, gà kêu cục tác.', 40, '🔗'),
  ordering('cq-tn-vn16', 'tieng-viet', 'TV-SENTENCE', 'Ngữ pháp', 'MEDIUM', 'Vòng Huyện 6: Xếp các từ thành câu chúc Tết.', ['Chúc', 'bé', 'học', 'giỏi'], 'Câu đúng là Chúc bé học giỏi. Chủ ngữ chúc đứng đầu nhé.', 35, '🧧'),
  tf('cq-tn-vn17', 'tieng-viet', 'TV-RHYME', 'Cấu tạo từ', 'MEDIUM', 'Vòng Huyện 7: "Hoa" và "hoa" là hai tiếng cùng vần.', 'Đúng', 'Hai tiếng giống nhau thì cùng vần. Bé tinh mắt lắm.', 15, '🌸'),
  tf('cq-tn-vn18', 'tieng-viet', 'TV-SENTENCE', 'Ngữ pháp', 'MEDIUM', 'Vòng Huyện 8: "Bàn ghế" là một câu hoàn chỉnh.', 'Sai', 'Bàn ghế chỉ là cụm từ, chưa thành câu vì thiếu hoạt động.', 15, '🪑'),
  fill('cq-tn-vn19', 'tieng-viet', 'TV-TONES', 'Ngữ âm', 'MEDIUM', 'Vòng Huyện 9: Điền dấu đúng: "quả ...ào" (quả đào chín mọng)', ['đào', 'đáo', 'đạo', 'đảo'], 'đào', 'Quả đào viết với dấu huyền trên a. Đào chín ăn ngọt lắm.', 20, '🍑'),
  classify('cq-tn-vn20', 'tieng-viet', 'TV-WORD', 'Từ vựng', 'MEDIUM', 'Vòng Huyện 10: Phân loại từ.', ['con vật', 'đồ vật'], 'con cá', 'con vật', ['cái bàn', 'quyển vở', 'cây bút'], 'Con cá là con vật sống dưới nước. Bé giỏi phân loại quá.', 25, '🐟'),

  // ================= TIẾNG VIỆT — VÒNG TỈNH (HARD) =================
  mc('cq-tn-vn21', 'tieng-viet', 'TV-READING', 'Đọc hiểu', 'HARD', 'Vòng Tỉnh 1: Sáng sớm, gà trống gáy vang, bé Lan dậy đánh răng rồi đến trường. Bé Lan dậy lúc nào?', ['Sáng sớm', 'Buổi trưa', 'Buổi tối', 'Nửa đêm'], 'Sáng sớm', 'Đoạn văn nói sáng sớm gà gáy thì bé Lan dậy. Bé tìm đúng từ khóa rồi.', 25, '🌅'),
  mc('cq-tn-vn22', 'tieng-viet', 'TV-LANGUAGE-LOGIC', 'Tư duy logic', 'HARD', 'Vòng Tỉnh 2: Đố bé: "Cái gì có cổ mà không có miệng?"', ['cái áo', 'con cá', 'quả cam', 'cái bàn'], 'cái áo', 'Cái áo có cổ áo mà không có miệng. Câu đố dân gian vui đó bé.', 25, '👕'),
  mc('cq-tn-vn23', 'tieng-viet', 'TV-SPELLING', 'Chính tả', 'HARD', 'Vòng Tỉnh 3: Chọn câu viết đúng chính tả?', ['Bé đến trường học bài.', 'Bé đến chường học bài.', 'Bé đến trường họk bài.', 'Bé đến trương học bài.'], 'Bé đến trường học bài.', 'Câu đúng viết trường bằng tr và học bằng h. Bé soi lỗi giỏi quá.', 25, '🏫'),
  ordering('cq-tn-vn24', 'tieng-viet', 'TV-SENTENCE', 'Ngữ pháp', 'HARD', 'Vòng Tỉnh 4: Xếp thành câu kể về gia đình.', ['Bố', 'đưa', 'bé', 'đi học'], 'Câu đúng là Bố đưa bé đi học. Đủ ai, làm gì, với ai nhé.', 40, '👪'),
  matching('cq-tn-vn25', 'tieng-viet', 'TV-SYLLABLE', 'Cấu tạo từ', 'HARD', 'Vòng Tỉnh 5: Nối tiếng với vần đúng.', [['bàn', 'an'], ['cửa', 'ưa'], ['hoa', 'oa']], ['an', 'ưa', 'oa'], 'Bàn vần an, cửa vần ưa, hoa vần oa. Bé tách vần siêu chuẩn.', 45, '🧩'),
  classify('cq-tn-vn26', 'tieng-viet', 'TV-WORD', 'Từ vựng', 'HARD', 'Vòng Tỉnh 6: Phân loại từ chỉ hoạt động.', ['hoạt động', 'sự vật'], 'chạy nhảy', 'hoạt động', ['cái bàn', 'quả táo', 'ngôi nhà'], 'Chạy nhảy là hoạt động của cơ thể. Bàn, táo, nhà là sự vật.', 30, '🏃'),

  // ================= TIẾNG VIỆT — VÒNG QUỐC GIA (CHALLENGE) =================
  mc('cq-tn-vn27', 'tieng-viet', 'TV-LANGUAGE-LOGIC', 'Tư duy logic', 'CHALLENGE', 'Chung kết 1: "Bánh gì ăn mãi không hết?" (đố vui dân gian)', ['bánh vẽ', 'bánh mì', 'bánh chưng', 'bánh bò'], 'bánh vẽ', 'Bánh vẽ chỉ để ngắm nên ăn mãi không hết. Bé thông minh quá.', 30, '🍰'),
  mc('cq-tn-vn28', 'tieng-viet', 'TV-READING', 'Đọc hiểu', 'CHALLENGE', 'Chung kết 2: "Mưa rào ập đến, cả lớp ùa ra sân nhặt lá rụng làm thuyền." Vì sao cả lớp ra sân?', ['Nhặt lá làm thuyền', 'Đi về nhà', 'Hái hoa', 'Đá bóng'], 'Nhặt lá làm thuyền', 'Đoạn văn nói rõ cả lớp ra sân để nhặt lá rụng làm thuyền sau mưa.', 30, '🌧️'),
  ordering('cq-tn-vn29', 'tieng-viet', 'TV-SENTENCE', 'Ngữ pháp', 'CHALLENGE', 'Chung kết 3: Xếp thành lời chúc cô giáo.', ['Em', 'kính', 'chúc', 'cô'], 'Câu đúng là Em kính chúc cô. Thiếu vế sau nhưng đúng thứ tự kính trọng.', 45, '💐'),
  fill('cq-tn-vn30', 'tieng-viet', 'TV-SPELLING', 'Chính tả', 'CHALLENGE', 'Chung kết 4: Điền vần đúng: "ngh...ệ sĩ múa rất dẻo"', ['ngh', 'ng', 'nh', 'gh'], 'ngh', 'Trước ê ta viết ngh. Nghệ sĩ múa rất dẻo là đáp án đúng.', 30, '💃'),

  // ================= TOÁN — VÒNG HƯƠNG (EASY) =================
  mc('cq-tn-m01', 'toan', 'MATH-NUMBER', 'Số học', 'EASY', 'Vòng Hương 1: Đếm có mấy chú vịt? 🦆🦆🦆🦆🦆', ['5', '4', '6', '3'], '5', 'Bé đếm từng chú vịt một: 1, 2, 3, 4, 5. Có 5 chú vịt.', 15, '🦆'),
  mc('cq-tn-m02', 'toan', 'MATH-COMPARISON', 'Số học', 'EASY', 'Vòng Hương 2: Số nào lớn hơn?', ['9', '6', '5', '4'], '9', 'Số 9 lớn hơn 6, 5 và 4. Bé so sánh giỏi quá.', 15, '⚖️'),
  mc('cq-tn-m03', 'toan', 'MATH-ADDITION', 'Phép tính', 'EASY', 'Vòng Hương 3: 3 + 2 = ?', ['5', '4', '6', '3'], '5', '3 thêm 2 là 5. Bé giơ 3 ngón rồi thêm 2 ngón nhé.', 15, '➕'),
  mc('cq-tn-m04', 'toan', 'MATH-SUBTRACTION', 'Phép tính', 'EASY', 'Vòng Hương 4: 5 - 1 = ?', ['4', '5', '3', '6'], '4', '5 bớt 1 còn 4. Bé lấy 5 que tính bớt 1 nhé.', 15, '➖'),
  mc('cq-tn-m05', 'toan', 'MATH-SHAPE', 'Hình học', 'EASY', 'Vòng Hương 5: Hình nào là hình tròn?', ['⚪', '⬛', '🔺', '⭐'], '⚪', 'Hình tròn tròn như mặt trăng, không có góc nhọn.', 15, '⭕'),
  mc('cq-tn-m06', 'toan', 'MATH-SEQUENCE', 'Số học', 'EASY', 'Vòng Hương 6: Điền số tiếp theo: 1, 2, 3, ...', ['4', '5', '2', '6'], '4', 'Dãy đếm tăng dần: sau 3 là 4. Bé đếm tiếp nhé.', 15, '🔢'),
  tf('cq-tn-m07', 'toan', 'MATH-ADDITION', 'Phép tính', 'EASY', 'Vòng Hương 7: 2 + 3 = 5.', 'Đúng', '2 thêm 3 là 5. Bé tính đúng rồi.', 12, '✅'),
  tf('cq-tn-m08', 'toan', 'MATH-COMPARISON', 'Số học', 'EASY', 'Vòng Hương 8: 7 bé hơn 4.', 'Sai', '7 lớn hơn 4. Bé nhìn tia số sẽ thấy 7 đứng sau 4.', 12, '⚖️'),
  fill('cq-tn-m09', 'toan', 'MATH-ADDITION', 'Phép tính', 'EASY', 'Vòng Hương 9: Điền số: 4 + ... = 7', ['3', '2', '4', '5'], '3', '4 thêm 3 là 7. Bé thử 4 ngón rồi đếm thêm đến 7 nhé.', 18, '✏️'),
  fill('cq-tn-m10', 'toan', 'MATH-SUBTRACTION', 'Phép tính', 'EASY', 'Vòng Hương 10: Điền số: 6 - ... = 2', ['4', '3', '5', '2'], '4', '6 bớt 4 còn 2. Bé kiểm tra 6 - 4 = 2 nhé.', 18, '✏️'),

  // ================= TOÁN — VÒNG HUYỆN (MEDIUM) =================
  mc('cq-tn-m11', 'toan', 'MATH-ADDITION', 'Phép tính', 'MEDIUM', 'Vòng Huyện 1: 8 + 5 = ?', ['13', '12', '14', '11'], '13', '8 thêm 5 là 13. Bé tách 5 thành 2 và 3 cho dễ nhé.', 20, '➕'),
  mc('cq-tn-m12', 'toan', 'MATH-SUBTRACTION', 'Phép tính', 'MEDIUM', 'Vòng Huyện 2: 14 - 6 = ?', ['8', '7', '9', '10'], '8', '14 bớt 6 còn 8. Bé trừ 4 rồi trừ tiếp 2 nhé.', 20, '➖'),
  mc('cq-tn-m13', 'toan', 'MATH-SEQUENCE', 'Số học', 'MEDIUM', 'Vòng Huyện 3: Dãy số: 2, 4, 6, ... Số tiếp theo?', ['8', '7', '10', '5'], '8', 'Dãy đếm cách 2: 2, 4, 6 rồi đến 8. Bé nhảy 2 bước nhé.', 20, '🔢'),
  mc('cq-tn-m14', 'toan', 'MATH-MEASUREMENT', 'Đại lượng', 'MEDIUM', 'Vòng Huyện 4: Cái thước dài 20cm, cắt đi 5cm còn?', ['15cm', '25cm', '10cm', '20cm'], '15cm', '20 trừ 5 còn 15. Bé đo lại bằng thước nhé.', 22, '📏'),
  matching('cq-tn-m15', 'toan', 'MATH-COMPARISON', 'Số học', 'MEDIUM', 'Vòng Huyện 5: Nối phép tính với kết quả đúng.', [['3 + 4', '7'], ['9 - 5', '4'], ['5 + 1', '6']], ['7', '4', '6'], '3 + 4 = 7, 9 - 5 = 4, 5 + 1 = 6. Bé nối khéo quá.', 40, '🔗'),
  ordering('cq-tn-m16', 'toan', 'MATH-SEQUENCE', 'Số học', 'MEDIUM', 'Vòng Huyện 6: Xếp các số từ bé đến lớn.', ['3', '7', '9', '12'], 'Thứ tự từ bé đến lớn là 3, 7, 9, 12. Bé so sánh từng cặp nhé.', 35, '🔢'),
  tf('cq-tn-m17', 'toan', 'MATH-SHAPE', 'Hình học', 'MEDIUM', 'Vòng Huyện 7: Hình vuông có 4 cạnh bằng nhau.', 'Đúng', 'Hình vuông có 4 cạnh dài bằng nhau và 4 góc vuông.', 15, '⬛'),
  tf('cq-tn-m18', 'toan', 'MATH-PATTERN', 'Tư duy logic', 'MEDIUM', 'Vòng Huyện 8: Dãy 🔴🔵🔴🔵 tiếp theo là 🔴.', 'Đúng', 'Mẫu lặp đỏ-xanh: sau xanh là đỏ. Bé phát hiện quy luật giỏi.', 15, '🔴'),
  fill('cq-tn-m19', 'toan', 'MATH-WORD-PROBLEM', 'Giải toán', 'MEDIUM', 'Vòng Huyện 9: Lan có 9 kẹo, cho em 4 cái. Lan còn ... cái?', ['5', '13', '4', '6'], '5', '9 trừ 4 còn 5. Đây là bài toán bớt đi nên dùng phép trừ.', 20, '🍬'),
  classify('cq-tn-m20', 'toan', 'MATH-SHAPE', 'Hình học', 'MEDIUM', 'Vòng Huyện 10: Phân loại hình.', ['hình tròn', 'hình vuông'], 'quả bóng', 'hình tròn', ['quyển vở', 'cái hộp', 'viên gạch'], 'Quả bóng tròn như hình tròn. Vở, hộp, gạch là hình vuông hoặc chữ nhật.', 25, '⚽'),

  // ================= TOÁN — VÒNG TỈNH (HARD) =================
  mc('cq-tn-m21', 'toan', 'MATH-WORD-PROBLEM', 'Giải toán', 'HARD', 'Vòng Tỉnh 1: Lớp có 14 bạn trai và 9 bạn gái. Cả lớp có mấy bạn?', ['23', '22', '24', '21'], '23', '14 cộng 9 bằng 23. Bài toán gộp nên dùng phép cộng.', 25, '👫'),
  mc('cq-tn-m22', 'toan', 'MATH-LOGIC', 'Tư duy logic', 'HARD', 'Vòng Tỉnh 2: Tháp số: 5 ở dưới, 3 ở giữa, trên cùng là 5 + 3 = ?', ['8', '7', '9', '6'], '8', 'Đỉnh tháp bằng tổng hai viên dưới: 5 + 3 = 8.', 25, '🏰'),
  mc('cq-tn-m23', 'toan', 'MATH-MEASUREMENT', 'Đại lượng', 'HARD', 'Vòng Tỉnh 3: Mẹ đi chợ với 50 nghìn, mua rau hết 18 nghìn. Mẹ còn?', ['32 nghìn', '68 nghìn', '42 nghìn', '22 nghìn'], '32 nghìn', '50 trừ 18 còn 32. Bé trừ 10 rồi trừ tiếp 8 nhé.', 25, '🥬'),
  ordering('cq-tn-m24', 'toan', 'MATH-PATTERN', 'Tư duy logic', 'HARD', 'Vòng Tỉnh 4: Xếp quy luật nhảy: số sau hơn số trước 3.', ['6', '9', '12', '15'], 'Dãy cộng 3: 6, 9, 12, 15. Bé cộng dồn từng bước nhé.', 40, '🧩'),
  matching('cq-tn-m25', 'toan', 'MATH-MEASUREMENT', 'Đại lượng', 'HARD', 'Vòng Tỉnh 5: Nối đồ vật với đơn vị đo đúng.', [['cây bút', 'cm'], ['cánh cửa', 'm'], ['con đường', 'km']], ['cm', 'm', 'km'], 'Bút đo bằng cm, cửa đo bằng m, đường dài đo bằng km.', 45, '📏'),
  classify('cq-tn-m26', 'toan', 'MATH-LOGIC', 'Tư duy logic', 'HARD', 'Vòng Tỉnh 6: Số nào là số chẵn?', ['số chẵn', 'số lẻ'], '8', 'số chẵn', ['7', '9', '5'], 'Số 8 chia hết cho 2 nên là số chẵn. 7, 9, 5 là số lẻ.', 30, '🔢'),

  // ================= TOÁN — CHUNG KẾT (CHALLENGE) =================
  mc('cq-tn-m27', 'toan', 'MATH-WORD-PROBLEM', 'Giải toán', 'CHALLENGE', 'Chung kết 1: Trại hè có 85 bạn, thêm 47 bạn đăng ký. Có tất cả?', ['132', '131', '122', '142'], '132', '85 cộng 47 bằng 132. Bé cộng hàng đơn vị trước nhé.', 30, '⛺'),
  mc('cq-tn-m28', 'toan', 'MATH-LOGIC', 'Tư duy logic', 'CHALLENGE', 'Chung kết 2: Đố vui: 1 con vịt đi trước 2 con vịt, 1 con đi giữa 2 con. Có mấy con?', ['3', '5', '4', '2'], '3', 'Ba con xếp hàng dọc: con đầu, con giữa, con cuối. Đố mẹo vui đó bé.', 30, '🦆'),
  ordering('cq-tn-m29', 'toan', 'MATH-SEQUENCE', 'Số học', 'CHALLENGE', 'Chung kết 3: Xếp dãy giảm dần.', ['20', '15', '10', '5'], 'Dãy giảm dần 5 một: 20, 15, 10, 5. Bé trừ dần nhé.', 45, '🔢'),
  fill('cq-tn-m30', 'toan', 'MATH-ADDITION', 'Phép tính', 'CHALLENGE', 'Chung kết 4: Điền số: ... + 27 = 60', ['33', '43', '23', '37'], '33', '60 trừ 27 bằng 33. Bé tìm số hạng chưa biết bằng phép trừ.', 30, '✏️'),

  // ================= ENGLISH — TOURNAMENT =================
  mc('cq-tn-e01', 'english', 'EN-PHONICS', 'Phonics', 'EASY', 'Round 1: What is the first letter of "Apple"?', ['A', 'B', 'C', 'D'], 'A', 'Apple starts with letter A. Say a-a-apple with me.', 15, '🍎'),
  mc('cq-tn-e02', 'english', 'EN-ANIMALS', 'Vocabulary', 'EASY', 'Round 2: Which animal says "Moo"?', ['Cow', 'Cat', 'Dog', 'Bird'], 'Cow', 'The cow says moo. Great listening, little farmer.', 15, '🐄'),
  mc('cq-tn-e03', 'english', 'EN-COLORS', 'Vocabulary', 'EASY', 'Round 3: What colour is the sun? Sun is ...', ['Yellow', 'Blue', 'Green', 'Purple'], 'Yellow', 'The sun is yellow and warm. Point at something yellow.', 15, '☀️'),
  mc('cq-tn-e04', 'english', 'EN-NUMBERS', 'Vocabulary', 'MEDIUM', 'Round 4: How many fingers? ✋✋ (two hands)', ['Ten', 'Five', 'Eight', 'Two'], 'Ten', 'Two hands have ten fingers. Count with me to ten.', 18, '✋'),
  tf('cq-tn-e05', 'english', 'EN-FAMILY', 'Vocabulary', 'MEDIUM', 'Round 5: "Mother" means "Mẹ".', 'Đúng', 'Mother means mẹ in Vietnamese. Give mom a hug.', 12, '👩'),
  tf('cq-tn-e06', 'english', 'EN-BODY', 'Vocabulary', 'MEDIUM', 'Round 6: "Foot" means "Tay".', 'Sai', 'Foot means chân, hand means tay. Stomp your feet.', 12, '🦶'),
  fill('cq-tn-e07', 'english', 'EN-SCHOOL', 'Vocabulary', 'MEDIUM', 'Round 7: Fill the word: "I read a ... " (sách)', ['book', 'cook', 'look', 'took'], 'book', 'I read a book. Book rhymes with look and cook.', 20, '📖'),
  matching('cq-tn-e08', 'english', 'EN-COLORS', 'Vocabulary', 'HARD', 'Round 8: Match each colour with its picture.', [['Red', '🔴'], ['Blue', '🔵'], ['Green', '🟢']], ['🔴', '🔵', '🟢'], 'Red is red circle, blue is blue circle, green is green circle.', 40, '🎨'),
  ordering('cq-tn-e09', 'english', 'EN-NUMBERS', 'Vocabulary', 'HARD', 'Round 9: Order the numbers from small to big.', ['One', 'Two', 'Three', 'Four'], 'One, two, three, four in order. Sing the counting song.', 35, '🔢'),
  classify('cq-tn-e10', 'english', 'EN-ANIMALS', 'Vocabulary', 'HARD', 'Round 10: Which one can fly?', ['can fly', 'cannot fly'], 'bird', 'can fly', ['fish', 'dog', 'cow'], 'The bird can fly in the sky. Fish swim, dog and cow run.', 30, '🐦'),
  mc('cq-tn-e11', 'english', 'EN-SCHOOL', 'Vocabulary', 'CHALLENGE', 'Final 1: "I ... to school by bus." Choose the action.', ['go', 'eat', 'sleep', 'cry'], 'go', 'We go to school by bus. Act out going to school.', 25, '🚌'),
  mc('cq-tn-e12', 'english', 'EN-FAMILY', 'Vocabulary', 'CHALLENGE', 'Final 2: Baby brother is ... (em trai bé bỏng)', ['little', 'big', 'old', 'tall'], 'little', 'Little means bé nhỏ. Your baby brother is little and cute.', 25, '👶'),
];
