/**
 * T02B/B3+A — Safari Tiếng Anh (AnimalSafari) data. Pure TypeScript.
 */

import { defaultRoundsPerTier, pickDistinct, seededRng, shuffleSeeded } from '../gameLevels';

export interface AnimalSafariItem {
  englishName: string;
  vietnameseMeaning: string;
  emoji: string;
  soundCue: string;
}

export interface AnimalRound {
  target: AnimalSafariItem;
  options: AnimalSafariItem[];
}

export const SAFARI_ANIMALS: AnimalSafariItem[] = [
  { englishName: 'Dog', vietnameseMeaning: 'Con chó', emoji: '🐶', soundCue: 'Woof woof! Find the Dog!' },
  { englishName: 'Cat', vietnameseMeaning: 'Con mèo', emoji: '🐱', soundCue: 'Meow meow! Find the Cat!' },
  { englishName: 'Duck', vietnameseMeaning: 'Con vịt', emoji: '🦆', soundCue: 'Quack quack! Find the Duck!' },
  { englishName: 'Lion', vietnameseMeaning: 'Sư tử', emoji: '🦁', soundCue: 'Roar! Find the Lion!' },
  { englishName: 'Monkey', vietnameseMeaning: 'Con khỉ', emoji: '🐵', soundCue: 'Ooh ooh aah aah! Find the Monkey!' },
  { englishName: 'Elephant', vietnameseMeaning: 'Con voi', emoji: '🐘', soundCue: 'Paaah! Find the Elephant!' },
  { englishName: 'Giraffe', vietnameseMeaning: 'Hươu cao cổ', emoji: '🦒', soundCue: 'Munch! Find the Giraffe!' },
  { englishName: 'Zebra', vietnameseMeaning: 'Ngựa vằn', emoji: '🦓', soundCue: 'Bray! Find the Zebra!' },
  { englishName: 'Fox', vietnameseMeaning: 'Con cáo', emoji: '🦊', soundCue: 'Yip yip! Find the Fox!' },
  { englishName: 'Bear', vietnameseMeaning: 'Con gấu', emoji: '🐻', soundCue: 'Growl! Find the Bear!' },
  { englishName: 'Frog', vietnameseMeaning: 'Con ếch', emoji: '🐸', soundCue: 'Ribbit! Find the Frog!' },
  { englishName: 'Tiger', vietnameseMeaning: 'Con hổ', emoji: '🐯', soundCue: 'Grrr! Find the Tiger!' },
];

/**
 * T02B/B3+A — the target is picked FIRST, then options are shuffled, so the
 * answer position is uniformly distributed (never pinned to index 0).
 * `seed` mixes the play nonce (component passes stage.nonce).
 */
export function buildAnimalRounds(tier: number, seed = 0): AnimalRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const roundsPerTier = defaultRoundsPerTier();
  const count = roundsPerTier[safeTier - 1];
  const poolSize = safeTier <= 1 ? 4 : safeTier === 2 ? 5 : safeTier === 3 ? 6 : safeTier === 4 ? 8 : safeTier === 5 ? 10 : SAFARI_ANIMALS.length;
  const pool = SAFARI_ANIMALS.slice(0, poolSize);
  const rounds: AnimalRound[] = [];
  for (let i = 0; i < count; i++) {
    const rngI = seededRng(9100 + safeTier * 59 + seed * 1009 + i * 271);
    const picked = pickDistinct(pool, 4, rngI);
    // Pick the target before shuffling so its final slot is random.
    const target = picked[Math.floor(rngI() * picked.length)];
    const shuffled = shuffleSeeded(picked, seededRng(9100 + safeTier * 59 + seed * 1009 + i * 853));
    rounds.push({ target, options: shuffled });
  }
  return rounds;
}

export function buildRounds(tier: number, seed = 0): AnimalRound[] {
  return buildAnimalRounds(tier, seed);
}
