/**
 * T18A — Nhiệm vụ ngày xoay vòng: pool 31 nhiệm vụ, mỗi ngày chọn
 * 3 nhiệm vụ học (ưu tiên môn bé còn yếu) + 1 nhiệm vụ vui.
 * Tất định theo ngày (`localDateKey`): cùng ngày + cùng môn yếu
 * → cùng bộ nhiệm vụ (test được, bé không bị "đổi đề" giữa chừng).
 */
import { QUEST_MAP, QUEST_POOL } from '../data/questPool';
import type { DailyQuest } from '../types';
import type { MotivationDaily, QuestEvent, QuestEventKind } from '../types/motivation';
import type { SubjectType } from '../types';

/** FNV-1a 32-bit: chuỗi ngày → seed số (tất định, không cần thư viện). */
export function hashDateKey(dateKey: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < dateKey.length; i += 1) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** PRNG mulberry32: cùng seed → cùng dãy số (test tất định). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toDailyQuest(poolId: string): DailyQuest {
  const e = QUEST_MAP.get(poolId);
  if (!e) throw new Error(`questEngine: unknown quest ${poolId}`);
  return {
    id: e.id,
    title: e.title,
    targetCount: e.targetCount,
    currentCount: 0,
    rewardStars: e.rewardStars,
    rewardXp: e.rewardXp,
    completed: false,
    type: e.type,
  };
}

/**
 * Chọn 4 nhiệm vụ cho ngày: nhiệm vụ đầu luôn nhắm môn yếu nhất của bé
 * (nếu có), 2 nhiệm vụ học tiếp theo xáo trộn có trọng số môn yếu,
 * nhiệm vụ cuối là 1 nhiệm vụ vui xoay vòng.
 */
export function selectDailyQuests(dateKey: string, weakSubjects: readonly SubjectType[] = []): DailyQuest[] {
  const rng = seededRandom(hashDateKey(`kho-bau-quests:${dateKey}`));
  const learnPool = QUEST_POOL.filter((q) => !q.isFun);
  const funPool = QUEST_POOL.filter((q) => q.isFun);
  const picked: string[] = [];

  const weakList = weakSubjects.filter((s): s is SubjectType => typeof s === 'string');

  // 1) Nhiệm vụ "chữa yếu": ưu tiên môn yếu nhất (vẫn xoay vòng theo ngày).
  if (weakList.length > 0) {
    const weakCandidates = learnPool.filter(
      (q) => q.subjects.includes(weakList[0]) && q.type.startsWith('lesson')
    );
    const source = weakCandidates.length > 0 ? weakCandidates : learnPool;
    picked.push(source[Math.floor(rng() * source.length) % source.length].id);
  }

  // 2) Hai nhiệm vụ học nữa: môn yếu được nhân đôi cơ hội.
  const weighted = learnPool.filter((q) => !picked.includes(q.id));
  const bag: string[] = [];
  for (const q of weighted) {
    const weakHits = q.subjects.filter((s) => weakList.includes(s)).length;
    const copies = weakHits > 0 ? 3 : 1;
    for (let i = 0; i < copies; i += 1) bag.push(q.id);
  }
  while (picked.length < 3 && bag.length > 0) {
    const id = bag.splice(Math.floor(rng() * bag.length) % bag.length, 1)[0];
    if (!picked.includes(id)) picked.push(id);
  }
  // Dự phòng (không bao giờ thiếu vì pool đủ lớn).
  for (const q of learnPool) {
    if (picked.length >= 3) break;
    if (!picked.includes(q.id)) picked.push(q.id);
  }

  // 3) Một nhiệm vụ vui xoay vòng theo ngày.
  if (funPool.length > 0) {
    picked.push(funPool[Math.floor(rng() * funPool.length) % funPool.length].id);
  }

  return picked.map(toDailyQuest);
}

/** Các quest type mà một sự kiện làm tăng tiến trình. */
export function questTypesForEvent(event: QuestEvent): DailyQuest['type'][] {
  const out: DailyQuest['type'][] = [];
  switch (event.kind) {
    case 'lesson': {
      if (event.subject === 'tieng-viet') out.push('lesson_viet');
      else if (event.subject === 'toan') out.push('lesson_math');
      else if (event.subject === 'english') out.push('lesson_english');
      else if (event.subject === 'cuoc-song') out.push('lesson_life');
      out.push('lesson_any');
      if (typeof event.stars === 'number' && event.stars >= 3) out.push('star_3');
      break;
    }
    case 'game':
      out.push('play_game');
      if (event.englishGame) out.push('game_english');
      break;
    case 'review':
      out.push('daily_review');
      break;
    case 'review_question':
      out.push('review_5q');
      break;
    case 'read':
      out.push('read_story');
      break;
    case 'answer':
      if (event.correct) out.push('combo_5', 'correct_5');
      break;
    case 'water':
    case 'dressup':
    case 'chest':
    case 'gacha':
      out.push('fun');
      break;
    case 'weekly':
      out.push('weekly_try');
      break;
    default:
      break;
  }
  return out;
}

/**
 * Áp 1 sự kiện vào bộ quest hôm nay. Combo/correct theo môn đọc từ
 * `daily` (đã cập nhật trước đó). Trả về id các quest vừa hoàn thành
 * để storage trao thưởng (không trao trùng).
 */
export function applyQuestEvent(
  quests: DailyQuest[],
  event: QuestEvent,
  daily: MotivationDaily
): { quests: DailyQuest[]; newlyCompleted: DailyQuest[] } {
  const types = new Set(questTypesForEvent(event));
  if (types.size === 0) return { quests, newlyCompleted: [] };
  const newlyCompleted: DailyQuest[] = [];
  const next = quests.map((q) => {
    if (q.completed || !types.has(q.type)) return q;
    let progress = q.currentCount;
    if (q.type === 'combo_5') {
      // Combo tính theo chuỗi đúng liên tiếp tốt nhất trong ngày.
      progress = Math.max(q.currentCount, Math.min(daily.comboBest, q.targetCount));
    } else if (q.type === 'correct_5' && event.subject) {
      progress = Math.max(q.currentCount, Math.min(daily.correctBySubject[event.subject] ?? 0, q.targetCount));
    } else if (q.type === 'review_5q') {
      progress = Math.max(q.currentCount, Math.min(daily.reviewQuestions, q.targetCount));
    } else {
      progress = Math.min(q.currentCount + 1, q.targetCount);
    }
    if (progress >= q.targetCount) {
      const done = { ...q, currentCount: q.targetCount, completed: true };
      newlyCompleted.push(done);
      return done;
    }
    return progress === q.currentCount ? q : { ...q, currentCount: progress };
  });
  return { quests: next, newlyCompleted };
}

export const QUEST_EVENT_KINDS: readonly QuestEventKind[] = [
  'lesson', 'game', 'review', 'review_question', 'read', 'answer',
  'water', 'dressup', 'chest', 'gacha', 'weekly',
];
