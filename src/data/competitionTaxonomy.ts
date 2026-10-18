import { SkillDefinition } from '../types/competition';

export const COMPETITION_SKILLS: SkillDefinition[] = [
  // --- TIẾNG VIỆT ---
  {
    skillId: 'TV-PHONICS',
    skillName: 'Nhận diện Chữ Cái & Âm Đầu',
    subject: 'tieng-viet',
    category: 'Ngữ âm',
    description: 'Nhận diện 29 chữ cái, phân biệt âm đầu và chữ cái tương ứng.',
  },
  {
    skillId: 'TV-TONES',
    skillName: 'Dấu Thanh Tiếng Việt',
    subject: 'tieng-viet',
    category: 'Ngữ âm',
    description: 'Phân biệt 6 thanh điệu: ngang, huyền, sắc, hỏi, ngã, nặng.',
  },
  {
    skillId: 'TV-SYLLABLE',
    skillName: 'Cấu Tạo Tiếng & Ghép Âm',
    subject: 'tieng-viet',
    category: 'Cấu tạo từ',
    description: 'Ghép âm đầu, âm đệm, âm chính, âm cuối và dấu thanh thành tiếng có nghĩa.',
  },
  {
    skillId: 'TV-RHYME',
    skillName: 'Vần & Tiếng Bắt Vần',
    subject: 'tieng-viet',
    category: 'Cấu tạo từ',
    description: 'Nhận diện vần cơ bản và phát hiện các tiếng cùng vần trong câu ca dao, đồng dao.',
  },
  {
    skillId: 'TV-SPELLING',
    skillName: 'Quy Tắc Chính Tả (c/k, g/gh, ng/ngh)',
    subject: 'tieng-viet',
    category: 'Chính tả',
    description: 'Áp dụng quy tắc chính tả khi đi kèm với nguyên âm e, ê, i.',
  },
  {
    skillId: 'TV-WORD',
    skillName: 'Vốn Từ & Phân Loại Từ',
    subject: 'tieng-viet',
    category: 'Từ vựng',
    description: 'Từ chỉ sự vật, người, con vật, cây cối, hoạt động và đặc điểm gần gũi.',
  },
  {
    skillId: 'TV-SENTENCE',
    skillName: 'Sắp Xếp & Hoàn Thiện Câu',
    subject: 'tieng-viet',
    category: 'Ngữ pháp',
    description: 'Sắp xếp các từ thành câu đúng trật tự ngữ pháp, hiểu câu hỏi và câu kể.',
  },
  {
    skillId: 'TV-READING',
    skillName: 'Đọc Hiểu Đoạn Văn Ngắn',
    subject: 'tieng-viet',
    category: 'Đọc hiểu',
    description: 'Đọc đoạn văn 2-4 câu và trả lời câu hỏi tìm thông tin trực tiếp.',
  },
  {
    skillId: 'TV-LANGUAGE-LOGIC',
    skillName: 'Câu Đố & Tư Duy Ngôn Ngữ',
    subject: 'tieng-viet',
    category: 'Tư duy logic',
    description: 'Giải câu đố dân gian lớp 1, nhận diện từ đồng âm hoặc chơi chữ dí dỏm.',
  },

  // --- TOÁN HỌC ---
  {
    skillId: 'MATH-NUMBER',
    skillName: 'Đếm & Nhận Diện Số 0 - 20',
    subject: 'toan',
    category: 'Số học',
    description: 'Đếm đồ vật, liên kết lượng với chữ số và nhận biết số chục, số đơn vị.',
  },
  {
    skillId: 'MATH-COMPARISON',
    skillName: 'So Sánh & Thứ Tự Số',
    subject: 'toan',
    category: 'Số học',
    description: 'Sử dụng dấu >, <, = để so sánh hai số hoặc hai biểu thức số học.',
  },
  {
    skillId: 'MATH-ADDITION',
    skillName: 'Phép Cộng Phạm Vi 10 & 20',
    subject: 'toan',
    category: 'Phép tính',
    description: 'Tính nhẩm phép cộng, tách gộp số và tìm thành phần chưa biết.',
  },
  {
    skillId: 'MATH-SUBTRACTION',
    skillName: 'Phép Trừ Phạm Vi 10 & 20',
    subject: 'toan',
    category: 'Phép tính',
    description: 'Tính nhẩm phép trừ (bớt đi), mối quan hệ thuận nghịch giữa cộng và trừ.',
  },
  {
    skillId: 'MATH-SEQUENCE',
    skillName: 'Dãy Số & Thứ Tự',
    subject: 'toan',
    category: 'Số học',
    description: 'Điền số tiếp theo vào dãy số tăng dần, giảm dần hoặc dãy đếm cách.',
  },
  {
    skillId: 'MATH-PATTERN',
    skillName: 'Quy Luật Hình & Số',
    subject: 'toan',
    category: 'Tư duy logic',
    description: 'Phát hiện chu kỳ lặp lại của chuỗi hình dạng, màu sắc hoặc bước nhảy số.',
  },
  {
    skillId: 'MATH-SHAPE',
    skillName: 'Hình Học Trực Quan',
    subject: 'toan',
    category: 'Hình học',
    description: 'Nhận diện hình vuông, tròn, tam giác, chữ nhật, khối lập phương, hộp chữ nhật.',
  },
  {
    skillId: 'MATH-MEASUREMENT',
    skillName: 'Đo Lường, Thời Gian & So Sánh',
    subject: 'toan',
    category: 'Đại lượng',
    description: 'So sánh dài - ngắn, cao - thấp, nặng - nhẹ và đọc giờ đúng trên đồng hồ.',
  },
  {
    skillId: 'MATH-WORD-PROBLEM',
    skillName: 'Toán Có Lời Văn Lớp 1',
    subject: 'toan',
    category: 'Giải toán',
    description: 'Phân tích đề bài có "thêm vào" hoặc "bớt đi", chọn phép tính và câu trả lời.',
  },
  {
    skillId: 'MATH-LOGIC',
    skillName: 'Suy Luận Logic & Cân Bằng',
    subject: 'toan',
    category: 'Tư duy logic',
    description: 'Bài toán suy luận 2 bước đơn giản, tháp số và câu đố hình học.',
  },

  // --- ENGLISH ---
  {
    skillId: 'EN-PHONICS',
    skillName: 'Phonics & Alphabet Sounds',
    subject: 'english',
    category: 'Phonics',
    description: 'Letter sound recognition and initial phoneme matching.',
  },
  {
    skillId: 'EN-NUMBERS',
    skillName: 'Numbers 1 - 10',
    subject: 'english',
    category: 'Vocabulary',
    description: 'Counting items and matching with English number words.',
  },
  {
    skillId: 'EN-COLORS',
    skillName: 'Colors & Sights',
    subject: 'english',
    category: 'Vocabulary',
    description: 'Identifying red, blue, green, yellow, pink, purple, orange.',
  },
  {
    skillId: 'EN-ANIMALS',
    skillName: 'Animals & Pets',
    subject: 'english',
    category: 'Vocabulary',
    description: 'Common animals: cat, dog, bird, duck, fish, elephant, monkey.',
  },
  {
    skillId: 'EN-FAMILY',
    skillName: 'Family Members',
    subject: 'english',
    category: 'Vocabulary',
    description: 'Mom, dad, brother, sister, baby, grandpa, grandma.',
  },
  {
    skillId: 'EN-SCHOOL',
    skillName: 'School Supplies',
    subject: 'english',
    category: 'Vocabulary',
    description: 'Book, pencil, bag, ruler, pen, desk, chair.',
  },
  {
    skillId: 'EN-BODY',
    skillName: 'Body Parts',
    subject: 'english',
    category: 'Vocabulary',
    description: 'Eye, ear, nose, mouth, hand, arm, leg, foot.',
  },
];

export function getSkillById(id: string): SkillDefinition | undefined {
  return COMPETITION_SKILLS.find((s) => s.skillId === id);
}

export function getSkillsBySubject(subject: string): SkillDefinition[] {
  return COMPETITION_SKILLS.filter((s) => s.subject === subject);
}
