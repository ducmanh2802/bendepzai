/**
 * Đoán Bóng Hình (Shadow match) data. Pure TypeScript.
 *
 * Mỗi vòng: một hình đen (bóng) + 4 lựa chọn emoji, bé chọn đúng hình đã
 * tạo ra bóng. Màn cao xoay/lật bóng để khó hơn nhưng vẫn công bằng.
 */

import { defaultRoundsPerTier, seededRng, shuffleSeeded } from '../gameLevels';

export interface ShadowItem {
  id: string;
  label: string;
  emoji: string;
}

export const SHADOW_POOL: ShadowItem[] = [
  { id: 'elephant', label: 'Con voi', emoji: '🐘' },
  { id: 'rabbit', label: 'Con thỏ', emoji: '🐰' },
  { id: 'giraffe', label: 'Hươu cao cổ', emoji: '🦒' },
  { id: 'zebra', label: 'Ngựa vằn', emoji: '🦓' },
  { id: 'hedgehog', label: 'Con nhím', emoji: '🦔' },
  { id: 'turtle', label: 'Con rùa', emoji: '🐢' },
  { id: 'octopus', label: 'Bạch tuộc', emoji: '🐙' },
  { id: 'butterfly', label: 'Con bướm', emoji: '🦋' },
  { id: 'penguin', label: 'Chim cánh cụt', emoji: '🐧' },
  { id: 'owl', label: 'Cú mèo', emoji: '🦉' },
  { id: 'fish', label: 'Con cá', emoji: '🐟' },
  { id: 'horse', label: 'Con ngựa', emoji: '🐴' },
  { id: 'tree', label: 'Cái cây', emoji: '🌳' },
  { id: 'bicycle', label: 'Xe đạp', emoji: '🚲' },
  { id: 'car', label: 'Ô tô', emoji: '🚗' },
  { id: 'boat', label: 'Con thuyền', emoji: '⛵' },
  { id: 'plane', label: 'Máy bay', emoji: '✈️' },
  { id: 'house', label: 'Ngôi nhà', emoji: '🏠' },
  { id: 'umbrella', label: 'Cái ô', emoji: '☂️' },
  { id: 'apple', label: 'Quả táo', emoji: '🍎' },
  { id: 'carrot', label: 'Củ cà rốt', emoji: '🥕' },
  { id: 'guitar', label: 'Đàn ghi-ta', emoji: '🎸' },
  { id: 'key', label: 'Chìa khóa', emoji: '🔑' },
  { id: 'drum', label: 'Cái trống', emoji: '🥁' },
];

export interface ShadowRound {
  id: string;
  answer: ShadowItem;
  /** 4 lựa chọn (gồm đáp án), đã xáo trộn. */
  options: ShadowItem[];
  /** Góc xoay của bóng (độ) — 0 ở màn dễ. */
  tilt: number;
  /** Lật ngang bóng — chỉ xuất hiện từ màn 5. */
  flip: boolean;
}

const OPTION_COUNT = 4;

export function buildShadowRounds(tier: number, seed = 0): ShadowRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const count = defaultRoundsPerTier()[safeTier - 1];
  const rng = seededRng(8200 + safeTier * 131 + Math.max(0, Math.round(seed)) * 1009);

  const deck = shuffleSeeded(SHADOW_POOL, rng);
  const rounds: ShadowRound[] = [];

  for (let i = 0; i < count; i++) {
    const answer = deck[i % deck.length];
    const distractors = shuffleSeeded(
      SHADOW_POOL.filter((item) => item.id !== answer.id),
      rng
    ).slice(0, OPTION_COUNT - 1);
    const options = shuffleSeeded([answer, ...distractors], rng);

    const rawTilt = Math.round((rng() * 40 - 20) * 10) / 10;
    const tilt = safeTier >= 3 ? rawTilt : 0;
    const flip = safeTier >= 5 ? rng() < 0.5 : false;

    rounds.push({
      id: `shadow-${safeTier}-${i}`,
      answer,
      options,
      tilt,
      flip,
    });
  }

  return rounds;
}
