import { CompetitionExamResult } from '../types/competition';

export interface TournamentBot {
  name: string;
  emoji: string;
  /** Deterministic skill: average score /10 */
  skill: number;
  taunt: string;
}

export const TOURNAMENT_BOTS: TournamentBot[] = [
  { name: 'Cáo Tinh Nhanh', emoji: '🦊', skill: 9.2, taunt: 'Tớ chạy nhanh như chớp!' },
  { name: 'Cú Thông Thái', emoji: '🦉', skill: 8.6, taunt: 'Học chắc từng dấu thanh nhé!' },
  { name: 'Thỏ Trắng', emoji: '🐰', skill: 7.8, taunt: 'Tớ vừa ăn cà rốt vừa học!' },
  { name: 'Gấu Bút Chì', emoji: '🐻', skill: 7.0, taunt: 'Tớ viết cẩn thận lắm!' },
  { name: 'Chim Sẻ Nhí', emoji: '🐦', skill: 6.2, taunt: 'Tớ mới tập thi, cố lên!' },
  { name: 'Rùa Chăm Chỉ', emoji: '🐢', skill: 5.4, taunt: 'Chậm mà chắc nhé bạn!' },
];

export const TOURNAMENT_ORDER = [
  'bp-tn-huong',
  'bp-tn-huyen',
  'bp-tn-tinh',
  'bp-tn-quocgia',
] as const;

export const TOURNAMENT_NAMES: Record<string, string> = {
  'bp-tn-huong': 'Vòng Hương',
  'bp-tn-huyen': 'Vòng Huyện',
  'bp-tn-tinh': 'Vòng Tỉnh',
  'bp-tn-quocgia': 'Chung kết Quốc gia',
};

/** Vòng sau mở khi vòng trước đạt >= 5 điểm. Vòng Hương luôn mở. */
export function isTournamentUnlocked(blueprintId: string, results: CompetitionExamResult[]): boolean {
  if (blueprintId === 'bp-tn-huong') return true;
  const idx = TOURNAMENT_ORDER.indexOf(blueprintId as (typeof TOURNAMENT_ORDER)[number]);
  if (idx <= 0) return true; // toán / anh luôn mở
  const prevId = TOURNAMENT_ORDER[idx - 1];
  const prevBest = Math.max(0, ...results.filter((r) => r.blueprintId === prevId).map((r) => r.score));
  return prevBest >= 5;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface LeaderboardRow {
  rank: number;
  name: string;
  emoji: string;
  score: number;
  accuracy: number;
  isMe: boolean;
  note: string;
}

/** Bảng xếp hạng địa phương: bé + 6 bạn bot có điểm ổn định theo seed. */
export function buildTournamentLeaderboard(
  blueprintId: string,
  myBest: CompetitionExamResult | null,
): LeaderboardRow[] {
  const rows: Omit<LeaderboardRow, 'rank'>[] = TOURNAMENT_BOTS.map((bot) => {
    const jitter = ((hashStr(`${blueprintId}:${bot.name}`) % 21) - 10) / 10; // -1..+1
    const score = Math.max(3, Math.min(10, Math.round((bot.skill + jitter) * 10) / 10));
    return {
      name: bot.name,
      emoji: bot.emoji,
      score,
      accuracy: Math.min(100, Math.round(score * 10)),
      isMe: false,
      note: bot.taunt,
    };
  });
  rows.push({
    name: myBest ? 'Bé' : 'Bé (chưa thi)',
    emoji: '🌟',
    score: myBest ? myBest.score : 0,
    accuracy: myBest ? myBest.accuracy : 0,
    isMe: true,
    note: myBest ? `Tốt nhất: ${myBest.score}/10` : 'Thi vòng này để lên bảng!',
  });
  const sorted = rows.sort((a, b) => b.score - a.score || b.accuracy - a.accuracy);
  return sorted.map((r, idx) => ({ ...r, rank: idx + 1 }));
}


