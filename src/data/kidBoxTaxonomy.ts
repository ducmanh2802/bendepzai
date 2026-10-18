import { KidBoxSkillDescriptor, KidBoxSkillId, KidBoxStrand } from '../types/kidBox';

/**
 * §8 ENGLISH SKILL TAXONOMY for the Kid's Box Companion track.
 *
 * These ids extend the app's existing skill resolution (`getAllSkills()` in
 * `data/curriculum.ts`) instead of creating a second, parallel taxonomy: the
 * catalogue there already accepts extra descriptors, so a Kid's Box skill is
 * indistinguishable from any other skill once evidence is recorded.
 *
 * §8 explicitly warns against a grammar-heavy Level 1 curriculum, so
 * `LANGUAGE_USE` holds only two deliberately light skills.
 */
export const KIDBOX_SKILLS: readonly KidBoxSkillDescriptor[] = [
  // ----- Vocabulary -----
  {
    skillId: 'EN-VOCAB-RECOGNITION',
    skillName: 'Nhận diện từ vựng',
    strand: 'VOCABULARY',
    sequence: 10,
    description: 'Bé nhìn hình và gọi đúng từ tiếng Anh.',
    minimumAge: 6,
  },
  {
    skillId: 'EN-VOCAB-MEANING',
    skillName: 'Hiểu nghĩa từ vựng',
    strand: 'VOCABULARY',
    sequence: 11,
    description: 'Bé biết từ tiếng Anh đó mang ý nghĩa gì.',
    minimumAge: 6,
  },
  {
    skillId: 'EN-VOCAB-LISTENING',
    skillName: 'Nghe nhận từ vựng',
    strand: 'VOCABULARY',
    sequence: 12,
    description: 'Bé nghe giọng British English và chọn đúng từ.',
    minimumAge: 6,
  },
  {
    skillId: 'EN-VOCAB-RECALL',
    skillName: 'Gọi lại từ vựng',
    strand: 'VOCABULARY',
    sequence: 13,
    description: 'Bé nhớ và nói lại từ đã học mà không nhìn hình.',
    minimumAge: 6,
  },
  {
    skillId: 'EN-VOCAB-SPELLING',
    skillName: 'Viết chính tả từ vựng',
    strand: 'VOCABULARY',
    sequence: 14,
    description: 'Bé ghép chữ cái để viết từ (chỉ khi phù hợp với lứa tuổi).',
    minimumAge: 7,
  },

  // ----- Phonics -----
  {
    skillId: 'EN-PHONICS-SOUND',
    skillName: 'Nghe âm',
    strand: 'PHONICS',
    sequence: 20,
    description: 'Bé nghe và nhận ra âm thanh trong từ.',
    minimumAge: 6,
  },
  {
    skillId: 'EN-PHONICS-DISCRIMINATION',
    skillName: 'Phân biệt âm thanh',
    strand: 'PHONICS',
    sequence: 21,
    description: 'Bé phân biệt được các từ gần giống nhau về âm (vd cat / cap).',
    minimumAge: 6,
  },
  {
    skillId: 'EN-PHONICS-INITIAL',
    skillName: 'Âm đầu của từ',
    strand: 'PHONICS',
    sequence: 22,
    description: 'Bé nghe và nhận ra âm đầu của từ.',
    minimumAge: 6,
  },
  {
    skillId: 'EN-PHONICS-BLENDING',
    skillName: 'Ghép âm',
    strand: 'PHONICS',
    sequence: 23,
    description: 'Bé ghép các âm đơn lại để đọc trọn từ.',
    minimumAge: 6,
  },

  // ----- Listening (first-class skill, §12) -----
  {
    skillId: 'EN-LISTENING-RECOGNITION',
    skillName: 'Nghe và nhận ra',
    strand: 'LISTENING',
    sequence: 30,
    description: 'Bé nghe âm thanh và nhận ra hình ảnh / từ tương ứng.',
    minimumAge: 6,
  },
  {
    skillId: 'EN-LISTENING-DETAIL',
    skillName: 'Nghe chi tiết',
    strand: 'LISTENING',
    sequence: 31,
    description: 'Bé nghe và nắm được thông tin chi tiết trong câu nói.',
    minimumAge: 7,
  },
  {
    skillId: 'EN-LISTENING-INSTRUCTION',
    skillName: 'Nghe và làm theo',
    strand: 'LISTENING',
    sequence: 32,
    description: 'Bé nghe câu lệnh và thực hiện đúng hành động.',
    minimumAge: 6,
  },

  // ----- Speaking (§13 — recognition is optional, never a hard dependency) -----
  {
    skillId: 'EN-SPEAKING-REPEAT',
    skillName: 'Nói lại từ',
    strand: 'SPEAKING',
    sequence: 40,
    description: 'Bé nghe và nói lại từ tiếng Anh.',
    minimumAge: 6,
  },
  {
    skillId: 'EN-SPEAKING-QUESTION-ANSWER',
    skillName: 'Hỏi và trả lời',
    strand: 'SPEAKING',
    sequence: 41,
    description: 'Bé trả lời một câu hỏi đơn giản bằng tiếng Anh.',
    minimumAge: 6,
  },
  {
    skillId: 'EN-SPEAKING-PATTERN',
    skillName: 'Dùng mẫu câu',
    strand: 'SPEAKING',
    sequence: 42,
    description: 'Bé dùng đúng mẫu câu đã học để nói câu của mình.',
    minimumAge: 7,
  },

  // ----- Reading (§15) -----
  {
    skillId: 'EN-READING-WORD',
    skillName: 'Đọc từ',
    strand: 'READING',
    sequence: 50,
    description: 'Bé đọc đúng một từ tiếng Anh.',
    minimumAge: 6,
  },
  {
    skillId: 'EN-READING-PHRASE',
    skillName: 'Đọc cụm từ',
    strand: 'READING',
    sequence: 51,
    description: 'Bé đọc đúng một cụm từ quen thuộc.',
    minimumAge: 7,
  },
  {
    skillId: 'EN-READING-SENTENCE',
    skillName: 'Đọc câu',
    strand: 'READING',
    sequence: 52,
    description: 'Bé đọc đúng một câu ngắn.',
    minimumAge: 7,
  },
  {
    skillId: 'EN-READING-COMPREHENSION',
    skillName: 'Đọc hiểu',
    strand: 'READING',
    sequence: 53,
    description: 'Bé hiểu nội dung câu chuyện ngắn và trả lời câu hỏi.',
    minimumAge: 7,
  },

  // ----- Language use (§8 — deliberately light at Level 1) -----
  {
    skillId: 'EN-LANGUAGE-PATTERN',
    skillName: 'Mẫu câu nghe quen',
    strand: 'LANGUAGE_USE',
    sequence: 60,
    description: 'Bé dùng một mẫu câu ngắn đã nghe nhiều lần.',
    minimumAge: 6,
  },
  {
    skillId: 'EN-GRAMMAR-IN-CONTEXT',
    skillName: 'Cấu trúc câu trong ngữ cảnh',
    strand: 'LANGUAGE_USE',
    sequence: 61,
    description: 'Bé nhận ra cách dùng đúng trong tình huống quen thuộc (không học thuật ngữ).',
    minimumAge: 7,
  },
] as const;

const SKILL_INDEX: Record<string, KidBoxSkillDescriptor> = Object.fromEntries(
  KIDBOX_SKILLS.map((s) => [s.skillId, s])
);

export function getKidBoxSkill(skillId: string): KidBoxSkillDescriptor | undefined {
  return SKILL_INDEX[skillId];
}

export function isKidBoxSkillId(skillId: string): skillId is KidBoxSkillId {
  return Object.prototype.hasOwnProperty.call(SKILL_INDEX, skillId);
}

export function getKidBoxSkillName(skillId: string): string {
  return SKILL_INDEX[skillId]?.skillName ?? skillId;
}

export function getKidBoxStrand(skillId: string): KidBoxStrand {
  return SKILL_INDEX[skillId]?.strand ?? 'VOCABULARY';
}

/** All skills belonging to a strand, in stable display order. */
export function getSkillsForStrand(strand: KidBoxStrand): KidBoxSkillDescriptor[] {
  return KIDBOX_SKILLS.filter((s) => s.strand === strand).sort((a, b) => a.sequence - b.sequence);
}

/** Extra skill descriptors injected into the app-wide skill catalogue (§1). */
export function getKidBoxSkillCatalogue(): { skillId: string; skillName: string; subject: 'english' }[] {
  return KIDBOX_SKILLS.map((s) => ({ skillId: s.skillId, skillName: s.skillName, subject: 'english' as const }));
}
