import { ReadingSkillDefinition } from '../types/reading';

/**
 * READING FLUENCY SKILL TAXONOMY (§6.1)
 *
 * Speed is tracked, but never used as a proxy for ability. Accuracy and
 * comprehension are the primary signals; fluency and speed are modifiers that
 * only become visible once accuracy is established.
 *
 * T02C — this taxonomy lives in its own module (no question/passage payload)
 * so the startup path (`DailyReviewScreen` → `adaptive.ts`) can reference
 * skill metadata without pulling the whole `readingContent` bank (~38 kB)
 * into the first-load chunk. `readingContent.ts` re-exports it for compat.
 */
export const READING_SKILLS: ReadingSkillDefinition[] = [
  {
    skillId: 'RF-WORD-RECOGNITION',
    skillName: 'Nhận Diện Từ',
    category: 'ACCURACY',
    stage: 'ACCURACY',
    description: 'Đọc và nhận ra đúng từ đơn, kể cả từ có dấu thanh.',
  },
  {
    skillId: 'RF-SYLLABLE-FLUENCY',
    skillName: 'Ghép Âm Đều Nhịp',
    category: 'ACCURACY',
    stage: 'ACCURACY',
    description: 'Đọc đúng tiếng theo từng âm tiết một cách rõ ràng.',
  },
  {
    skillId: 'RF-READ-ALOUD-ACCURACY',
    skillName: 'Đọc To Chính Xác',
    category: 'ACCURACY',
    stage: 'ACCURACY',
    description: 'Đọc to câu văn đúng từng chữ, không bỏ sót, không thêm tiếng.',
  },
  {
    skillId: 'RF-PHRASE-FLUENCY',
    skillName: 'Đọc Cụm Từ',
    category: 'FLUENCY',
    stage: 'FLUENCY',
    description: 'Đọc liền mạch các cụm từ quen thuộc trong một nhịp thở.',
  },
  {
    skillId: 'RF-SENTENCE-FLUENCY',
    skillName: 'Đọc Câu Mạch Lạc',
    category: 'FLUENCY',
    stage: 'FLUENCY',
    description: 'Đọc trọn câu có chủ ngữ và vị ngữ rõ ràng, không ngập ngừng giữa chừng.',
  },
  {
    skillId: 'RF-PUNCTUATION-PAUSE',
    skillName: 'Ngắt Hơi Theo Dấu Câu',
    category: 'FLUENCY',
    stage: 'FLUENCY',
    description: 'Biết dừng lại đúng chỗ khi gặp dấu chấm, phẩy, chấm hỏi.',
  },
  {
    skillId: 'RF-READ-ALOUD-SPEED',
    skillName: 'Đọc Nhanh Mà Rõ',
    category: 'FLUENCY',
    stage: 'PROCESSING_SPEED',
    description: 'Tăng tốc độ đọc mà vẫn giữ độ chính xác cao.',
  },
  {
    skillId: 'RF-READING-COMPREHENSION',
    skillName: 'Hiểu Nội Dung Đoạn Đọc',
    category: 'COMPREHENSION',
    stage: 'COMPREHENSION',
    description: 'Hiểu ai làm gì, ở đâu, khi nào, vì sao và như thế nào trong đoạn văn.',
  },
  {
    skillId: 'RF-KEYWORD-FINDING',
    skillName: 'Tìm Từ Khóa',
    category: 'COMPREHENSION',
    stage: 'COMPREHENSION',
    description: 'Tìm nhanh từ trong đoạn văn chứa thông tin cần thiết.',
  },
  {
    skillId: 'RF-QUESTION-UNDERSTANDING',
    skillName: 'Hiểu Câu Hỏi',
    category: 'PROCESSING_SPEED',
    stage: 'PROCESSING_SPEED',
    description: 'Đọc câu hỏi và xác định đúng thông tin cần tìm trước khi chọn đáp án.',
  },
  {
    skillId: 'RF-ANSWER-SELECTION-SPEED',
    skillName: 'Chọn Đáp Án Nhanh',
    category: 'PROCESSING_SPEED',
    stage: 'COMPETITION_SPEED',
    description: 'Chọn đáp án đúng nhanh chóng sau khi đã hiểu câu hỏi.',
  },
];

export function getReadingSkillById(id: string): ReadingSkillDefinition | undefined {
  return READING_SKILLS.find((s) => s.skillId === id);
}
