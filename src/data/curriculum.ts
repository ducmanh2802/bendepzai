import { VIETNAMESE_TOPICS } from './vietnameseCurriculum';
import { MATH_TOPICS } from './mathCurriculum';
import { ENGLISH_TOPICS } from './englishCurriculum';
import { LIFE_TOPICS } from './lifeCurriculum';
import { getKidBoxSkillCatalogue } from './kidBoxTaxonomy';
import { Lesson, Question, SubjectType, Topic } from '../types';

export const ALL_TOPICS: Record<SubjectType, Topic[]> = {
  'tieng-viet': VIETNAMESE_TOPICS,
  'toan': MATH_TOPICS,
  'english': ENGLISH_TOPICS,
  'cuoc-song': LIFE_TOPICS,
};

export function getTopicsBySubject(subject: SubjectType): Topic[] {
  return ALL_TOPICS[subject] || [];
}

export function findLessonById(lessonId: string): Lesson | null {
  for (const subject of Object.values(ALL_TOPICS)) {
    for (const topic of subject) {
      const found = topic.lessons.find((l) => l.id === lessonId);
      if (found) return found;
    }
  }
  return null;
}

export function getAllQuestions(): Question[] {
  const list: Question[] = [];
  for (const subject of Object.values(ALL_TOPICS)) {
    for (const topic of subject) {
      for (const lesson of topic.lessons) {
        list.push(...lesson.questions);
      }
    }
  }
  return list;
}

export function getAllSkills(): { skillId: string; skillName: string; subject: SubjectType }[] {
  const map = new Map<string, { skillId: string; skillName: string; subject: SubjectType }>();

  for (const [subjectKey, topics] of Object.entries(ALL_TOPICS) as [SubjectType, Topic[]][]) {
    for (const topic of topics) {
      for (const skill of topic.skills) {
        if (!map.has(skill)) {
          // Human-friendly skill label
          const cleanName = skill
            .replace(/^(vn_|math_|eng_|life_)/, '')
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

          map.set(skill, {
            skillId: skill,
            skillName: `${topic.title}: ${cleanName}`,
            subject: subjectKey,
          });
        }
      }
    }
  }

  // The Kid's Box Companion track (§8) extends this same catalogue instead of
  // creating a second taxonomy: its skills are English skills, resolved by the
  // very same `getAllSkills()` lookup that names every piece of evidence.
  for (const skill of getKidBoxSkillCatalogue()) {
    if (!map.has(skill.skillId)) {
      map.set(skill.skillId, {
        skillId: skill.skillId,
        skillName: `Kid's Box Companion: ${skill.skillName}`,
        subject: skill.subject,
      });
    }
  }

  return Array.from(map.values());
}
