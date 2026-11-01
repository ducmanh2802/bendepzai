import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  LevelUpCelebrationModal,
  shouldCelebrateLevelUp,
  playLevelUpCelebration,
} from '../src/components/motivation/LevelUpCelebrationModal';
import type { LevelClaimResult } from '../src/services/storage';
import { containsBannedWord } from '../src/data/contentSafety';

/**
 * T20A — regression guard for bug B-02 (Rules of Hooks crash).
 *
 * The celebration modal used to return `null` BETWEEN `useEffect` and
 * `useCallback`: opening it added a hook, React threw #310 and the whole app
 * unmounted right after a finished lesson.
 *
 * This repo ships no DOM renderer (adding one is out of scope), so the guard
 * is split in two:
 *  - `tests/t20a-hooks-order.test.ts` scans every component source and fails
 *    when a hook call follows an early `return null`;
 *  - this file pins the *behaviour* the broken code broke: the reward fanfare
 *    and the "is anything on screen" decision must agree, and the modal must
 *    render exactly the celebration (and nothing else) while a level reward is
 *    being claimed.
 */

vi.mock('../src/services/sound', () => ({
  sound: {
    playLevelUp: vi.fn(),
    playClick: vi.fn(),
    playCorrect: vi.fn(),
    playWrong: vi.fn(),
  },
}));

vi.mock('../src/services/confetti', () => ({
  fireCelebrationConfetti: vi.fn(),
}));

const { sound } = await import('../src/services/sound');
const { fireCelebrationConfetti } = await import('../src/services/confetti');

const empty: LevelClaimResult = { claimed: [], stars: 0, tickets: 0, stickerIds: [] };
const claimed: LevelClaimResult = { claimed: [2], stars: 5, tickets: 1, stickerIds: ['sticker_a'] };

function render(props: Partial<React.ComponentProps<typeof LevelUpCelebrationModal>> = {}) {
  // React 19 SSR writes `<!-- -->` separators between adjacent text nodes;
  // strip them so assertions can read the real wording.
  return renderToString(
    <LevelUpCelebrationModal
      isOpen={false}
      onClose={() => {}}
      result={empty}
      currentLevel={1}
      levelTitle="Tân binh"
      {...props}
    />
  ).replace(/<!-- -->/g, '');
}

describe('T20A — shouldCelebrateLevelUp gates sound, confetti and the modal alike (B-02)', () => {
  it('is false while the modal is closed', () => {
    expect(shouldCelebrateLevelUp(false, claimed)).toBe(false);
  });

  it('is false when no level reward was claimed', () => {
    expect(shouldCelebrateLevelUp(true, empty)).toBe(false);
    expect(shouldCelebrateLevelUp(true, { ...empty, stars: 9, tickets: 9, stickerIds: ['x'] })).toBe(false);
  });

  it('is true only when it is open AND a level was claimed', () => {
    expect(shouldCelebrateLevelUp(true, claimed)).toBe(true);
    expect(shouldCelebrateLevelUp(true, { ...claimed, stars: 0, tickets: 0, stickerIds: [] })).toBe(true);
  });

  it('plays the fanfare exactly once per call (sound + confetti, nothing else)', () => {
    vi.mocked(sound.playLevelUp).mockClear();
    vi.mocked(sound.playClick).mockClear();
    vi.mocked(fireCelebrationConfetti).mockClear();

    playLevelUpCelebration();

    expect(sound.playLevelUp).toHaveBeenCalledTimes(1);
    expect(fireCelebrationConfetti).toHaveBeenCalledTimes(1);
    expect(sound.playClick).not.toHaveBeenCalled();
  });

  it('is the very predicate the component uses for its early return', () => {
    // Closed → nothing rendered, so the fanfare must stay silent too.
    expect(render({ isOpen: false, result: claimed })).toBe('');
    // Open but nothing claimed → same.
    expect(render({ isOpen: true, result: empty })).toBe('');
    // Open with a claim → the celebration, and only then.
    const html = render({ isOpen: true, result: claimed, currentLevel: 2, levelTitle: 'Nhà thám hiểm' });
    expect(html).not.toBe('');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('Chúc Mừng');
  });

  it('shows the claimed level, the new title and every reward', () => {
    const html = render({ isOpen: true, result: claimed, currentLevel: 2, levelTitle: 'Nhà thám hiểm' });
    expect(html).toContain('Cấp độ mới');
    expect(html).toContain('Nhà thám hiểm');
    expect(html).toContain('+5 Sao Vàng');
    expect(html).toContain('+1 Vé Máy Gắp');
    expect(html).toContain('+1 Sticker');
    expect(html).toContain('Tuyệt Vời!');
  });

  it('counts every claimed level and flags the highest one', () => {
    const html = render({
      isOpen: true,
      result: { claimed: [3, 4, 5], stars: 3, tickets: 0, stickerIds: [] },
      currentLevel: 5,
      levelTitle: 'Ca thủ',
    });
    expect(html).toContain('Các Cấp Độ Vừa Nhận Thưởng');
    expect(html).toContain('Cấp 3');
    expect(html).toContain('Cấp 4');
    expect(html).toContain('Cấp 5');
    expect(html).toContain('Bé Đã Lên Cấp!');
  });

  it('keeps child-safe wording (no banned words anywhere in the celebration)', () => {
    const html = render({
      isOpen: true,
      result: { claimed: [3, 4], stars: 5, tickets: 2, stickerIds: ['a', 'b'] },
      currentLevel: 4,
      levelTitle: 'Nhà thám hiểm',
    });
    expect(containsBannedWord(html)).toBe(false);
    expect(html).toContain('Gấu Bút Chì đang ăn mừng cùng bé!');
  });
});
