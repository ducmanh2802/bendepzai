import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { sound } from '../src/services/sound';
import { GOALS_PER_TIER, buildMemoryDeck } from '../src/data/games/memory_cards';

const read = (rel: string) => fs.readFileSync(path.resolve(rel), 'utf8');

/**
 * T33 — các hẹn giờ phản hồi/ân thưởng phải thuộc về lượt MỚI NHẤT.
 * Bài học từ T32: lỗi thật nằm ở timer sống lâu hơn lượt chơi, chứ không nằm
 * ở logic đúng/sai. Mỗi test dưới đây ghim một hành vi mà bé nhìn/thấy được.
 */
describe('T33 — hẹn giờ phản hồi không được xoá nội dung của lượt sau', () => {
  describe('Lật Thẻ Trí Nhớ: id thẻ trùng nhau giữa mọi màn', () => {
    it('deck mọi màn đều đánh số 1..2N nên hẹn giờ cũ úp nhầm thẻ của màn mới', () => {
      const idsByTier = GOALS_PER_TIER.map((_, i) => buildMemoryDeck(i + 1, 0).map((c) => c.id));
      const tier1 = new Set(idsByTier[0]);
      const tier6 = new Set(idsByTier[idsByTier.length - 1]);
      const overlap = [...tier1].filter((id) => tier6.has(id));
      expect(overlap.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('hẹn giờ úp lại thẻ nằm trong ref và bị cắt khi sang màn / chơi lại / đóng game', () => {
      const src = read('src/components/games/MemoryCardsGame.tsx');
      expect(src).toContain('flipBackTimerRef');
      expect(src).toContain('clearFlipBack();');
      expect(src).toContain('useEffect(() => () => clearFlipBack(), []);');
      expect(src).toMatch(/clearFlipBack\(\);\s*initGame\(\);/);
      expect(src).toMatch(/flipBackTimerRef\.current = window\.setTimeout/);
      // không còn setTimeout trần: hẹn giờ trần không ai cắt được
      expect(src).not.toMatch(/(^|[^.])setTimeout\(\s*\(\)\s*=>/);
    });
  });

  describe('GameModalWrapper: lời khen + gấu phản hồi thuộc lượt chốt gần nhất', () => {
    it('không còn setTimeout trần cho mascotReaction / praiseText', () => {
      const src = read('src/components/games/GameModalWrapper.tsx');
      expect(src).not.toMatch(/setTimeout\(\s*\(\)\s*=>\s*setMascotReaction/);
      expect(src).not.toMatch(/setTimeout\(\s*\(\)\s*=>\s*setPraiseText/);
    });

    it('showFeedback tắt hẹn giờ cũ trước khi hẹn giờ mới chạy', () => {
      const src = read('src/components/games/GameModalWrapper.tsx');
      expect(src).toMatch(/const showFeedback = useCallback\(\s*\(reaction: string, praise: string\) => \{\s*clearFeedbackTimers\(\);/);
      expect(src).toContain('reactionTimerRef.current = window.setTimeout');
      expect(src).toContain('praiseTimerRef.current = window.setTimeout');
    });

    it('đóng bảng chơi hoặc sang màn/chơi lại đều dọn hẹn giờ phản hồi', () => {
      const src = read('src/components/games/GameModalWrapper.tsx');
      expect(src).toContain('useEffect(() => () => clearFeedbackTimers(), []);');
      expect(src).toMatch(/claimedKeys\.current\.clear\(\);\s*clearFeedbackTimers\(\);/);
      // cắt tiếng khi unmount (hồi quy T32 đã ghi nhận) vẫn còn
      expect(src).toContain('React.useEffect(() => () => sound.stopSpeaking(), []);');
    });

    it('bong bóng lời khen có testid ổn định để probe không phụ thuộc câu chữ', () => {
      expect(read('src/components/games/GameModalWrapper.tsx')).toContain('data-testid="praise-toast"');
    });
  });

  describe('Luyện đọc: chuỗi highlight karaoke chỉ có một chuỗi chạy', () => {
    it('mọi timer karaoke nằm trong ref và bị cắt khi bấm lại / sang đoạn / rời màn', () => {
      const src = read('src/components/reading/ReadingFluencyScreen.tsx');
      expect(src).toContain('karaokeTimersRef');
      expect(src).toMatch(/const runKaraokeChain = \(wordCount: number\) => \{\s*clearKaraokeChain\(\);/);
      expect(src).toMatch(/const readAllSentence = \(\) => \{\s*if \(!passage\) return;[\s\S]*?clearKaraokeChain\(\);/);
      // không còn vòng lặp setTimeout trần nào rải highlight
      expect(src).not.toMatch(/forEach\(\(_, i\) => \{\s*setTimeout/);
      expect(src).not.toMatch(/(^|[^.])setTimeout\(\(\) => setKaraokeIndex/);
    });

    it('có boundary thì chuỗi tự chạy bị tắt, không hai nguồn cùng đánh sáng', () => {
      const src = read('src/components/reading/ReadingFluencyScreen.tsx');
      expect(src).toMatch(/boundarySeen = true;[\s\S]*?window\.clearTimeout\(fallback\);\s*clearKaraokeChain\(\);/);
    });

    it('rời màn luyện đọc thì cắt hẹn giờ và cắt luôn giọng đọc', () => {
      const src = read('src/components/reading/ReadingFluencyScreen.tsx');
      const unmountBlock = src.slice(src.indexOf('// Bé rời màn luyện đọc'));
      expect(unmountBlock.slice(0, 700)).toContain('window.speechSynthesis.cancel();');
      expect(unmountBlock.slice(0, 700)).toContain('karaokeTimersRef.current = [];');
      expect(src).toMatch(/setKaraokeIndex\(-1\);\s*setParentGrade/);
    });

    it('bấm "Thoát" giữa lúc đọc thì chuỗi highlight và giọng đọc tắt theo', () => {
      const src = read('src/components/reading/ReadingFluencyScreen.tsx');
      expect(src).toMatch(
        /const backToLobby = \(\) => \{[\s\S]{0,400}clearKaraokeChain\(\);[\s\S]{0,200}window\.speechSynthesis\.cancel\(\);[\s\S]{0,200}setPhase\('lobby'\)/
      );
    });
  });
});

describe('T33 — hẹn giờ highlight của phương án phải thuộc lượt vừa bấm', () => {
  const GAME_DIR = 'src/components/games';
  /** Trò chơi có highlight hết hạn bằng setTimeout trần trước đợt sửa này. */
  const FEEDBACK_GAMES = [
    'PhonicsPopGame.tsx',
    'SpellingDuelGame.tsx',
    'WordStoryGame.tsx',
    'ClockMoneyGame.tsx',
    'SyllableBuilderGame.tsx',
    'OceanFishingGame.tsx',
  ];

  it('cả 6 trò đều lấy hẹn giờ phản hồi từ useRoundFeedbackTimer', () => {
    for (const name of FEEDBACK_GAMES) {
      const src = read(`${GAME_DIR}/${name}`);
      expect(src, `${name}: thiếu import hook`).toContain('useRoundFeedbackTimer');
      expect(src, `${name}: thiếu lịch hẹn giờ qua hook`).toContain('useRoundFeedbackTimer(');
    }
  });

  it('không còn hẹn giờ trần nào xoá highlight của lượt trước', () => {
    const offenders = FEEDBACK_GAMES.map((n) => `${GAME_DIR}/${n}`).filter((f) =>
      /(^|[^.\w])(window\.)?setTimeout\(\s*\(\)\s*=>\s*set(Picked|Feedback|HookedFish)/.test(read(f))
    );
    expect(offenders).toEqual([]);
  });

  it('hook cắt hẹn giờ cũ khi đặt hẹn giờ mới, khi sang lượt/màn và khi đóng bảng chơi', () => {
    const src = read('src/hooks/useRoundFeedbackTimer.ts');
    expect(src).toMatch(
      /const schedule = useCallback\(\s*\(action: \(\) => void, ms: number\) => \{\s*cancel\(\);/
    );
    expect(src).toMatch(/useEffect\(\(\) => \{\s*cancel\(\);\s*resetRef\.current\(\);/);
    expect(src).toContain('useEffect(() => () => cancel(), [cancel]);');
    expect(src).toContain('window.clearTimeout(timerRef.current);');
  });

  it('bấm sai liên tiếp không bị hẹn giờ lượt trước xoá highlight (điểm neo cho probe)', () => {
    const src = read('src/components/games/SpellingDuelGame.tsx');
    expect(src).toMatch(/stage\.submitWrong\(\);\s*scheduleUnpick\(\(\) => setPicked\(null\), 900\);/);
    expect(src).toContain('data-testid="answer-option"');
    expect(src).toContain("'data-correct': opt === item.answer");
  });
});

describe('T33 — máy kéo sticker không nổ phần thưởng trên màn hình khác', () => {
  it('vòng quay rAF được cất vào ref và huỷ khi bé rời màn', () => {
    const src = read('src/components/motivation/GachaMachineScreen.tsx');
    expect(src).toContain('const spinFrameRef = useRef<number | null>(null);');
    expect(src).toMatch(/spinFrameRef\.current = requestAnimationFrame\(animate\);/);
    expect(src).toContain('if (spinFrameRef.current !== null) cancelAnimationFrame(spinFrameRef.current);');
    expect(src).not.toMatch(/\n\s*requestAnimationFrame\(animate\);/);
  });

  it('thông báo của bảng điều khiển Ba Mẹ dùng một hẹn giờ, bấm tiếp không xoá cảnh báo sớm', () => {
    const src = read('src/components/parent/ParentDashboardModal.tsx');
    expect(src).toMatch(
      /const showResetNotice = \(message: string, ms: number\) => \{\s*if \(resetNoticeTimerRef\.current !== null\) window\.clearTimeout/
    );
    expect(src).not.toMatch(/setTimeout\(\(\) => setResetSuccessMessage\(null\)/);
    expect(src).toContain('showResetNotice(');
  });
});

describe('T33 — âm thanh ăn mừng không đào hết AudioContext của trình duyệt', () => {
  const createdContexts: number[] = [];
  const createdOscillators: number[] = [];

  class FakeAudioContext {
    state = 'running';
    currentTime = 0;
    destination = { fake: true };
    constructor() {
      createdContexts.push(1);
    }
    resume() {
      return Promise.resolve();
    }
    createOscillator() {
      createdOscillators.push(1);
      const node = {
        type: 'sine',
        frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {},
      };
      return node;
    }
    createGain() {
      return {
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, value: 0 },
        connect: () => {},
        disconnect: () => {},
      };
    }
    close() {
      this.state = 'closed';
      return Promise.resolve();
    }
  }

  beforeEach(() => {
    createdContexts.length = 0;
    createdOscillators.length = 0;
    sound.setMuted(false);
    const canvas = {
      style: {} as Record<string, string>,
      width: 0,
      height: 0,
      getContext: () => ({
        clearRect: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        fillRect: () => {},
        globalAlpha: 1,
        fillStyle: '',
      }),
      remove: () => {},
    };
    (globalThis as unknown as { window: unknown }).window = {
      AudioContext: FakeAudioContext,
      innerWidth: 800,
      innerHeight: 600,
      matchMedia: () => ({ matches: false }),
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    };
    (globalThis as unknown as { document: unknown }).document = {
      createElement: () => canvas,
      body: { appendChild: () => {} },
    };
    // Không chạy callback: chỉ cần đếm tài nguyên audio, chuỗi hạt không cần animate.
    (globalThis as unknown as { requestAnimationFrame: unknown }).requestAnimationFrame = () => 1;
  });

  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
    delete (globalThis as unknown as { requestAnimationFrame?: unknown }).requestAnimationFrame;
    sound.setMuted(false);
  });

  it('mười lần ăn mừng lớn chỉ dùng MỘT AudioContext (trần Chrome ~6 cái/tab)', async () => {
    const { fireCelebrationLarge } = await import('../src/services/confetti');
    for (let i = 0; i < 10; i++) fireCelebrationLarge();
    expect(createdContexts.length).toBeLessThanOrEqual(1);
    expect(createdOscillators.length).toBeGreaterThan(0);
  });

  it('Ba Mẹ tắt tiếng thì ăn mừng không phát âm thanh nữa', async () => {
    const { fireCelebrationSmall } = await import('../src/services/confetti');
    fireCelebrationSmall();
    const baseline = createdOscillators.length;
    sound.setMuted(true);
    for (let i = 0; i < 6; i++) {
      const { fireCelebrationLarge } = await import('../src/services/confetti');
      fireCelebrationLarge();
    }
    expect(createdOscillators.length).toBe(baseline);
  });

  it('nguồn âm thanh của confetti đi qua đúng một context dùng chung', () => {
    const src = read('src/services/confetti.ts');
    expect(src).toContain('let cheerCtx: AudioContext | null = null;');
    expect(src).not.toMatch(/new \(window\.AudioContext/);
    expect(src).toContain('if (sound.getMuted()) return;');
  });
});

describe('T33 — nhạc nền: mỗi nốt nối tiếp nhau và vòng lặp không chạy mỗi frame', () => {
  const started: number[] = [];
  const closed: number[] = [];
  let liveContexts = 0;

  class FakeMusicContext {
    state = 'running';
    currentTime = 0;
    destination = { fake: true };
    constructor() {
      liveContexts += 1;
    }
    resume() {
      return Promise.resolve();
    }
    suspend() {
      return Promise.resolve();
    }
    createOscillator() {
      return {
        type: 'sine',
        frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {},
        start: (when?: number) => {
          started.push(when ?? 0);
        },
        stop: () => {},
      };
    }
    createGain() {
      return {
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, value: 0 },
        connect: () => {},
        disconnect: () => {},
      };
    }
    close() {
      liveContexts -= 1;
      closed.push(1);
      this.state = 'closed';
      return Promise.resolve();
    }
  }

  beforeEach(() => {
    started.length = 0;
    closed.length = 0;
    liveContexts = 0;
    vi.useFakeTimers();
    (globalThis as unknown as { window: unknown }).window = {
      AudioContext: FakeMusicContext,
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    };
  });

  afterEach(() => {
    sound.setBgMusicEnabled(false);
    vi.clearAllTimers();
    vi.useRealTimers();
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  it('sáu nốt của chuỗi G4-E5-F5-G4-C5-E5 start ở sáu thời điểm khác nhau', async () => {
    const { sound: s } = await import('../src/services/sound');
    s.setBgMusicEnabled(true);
    expect(started.length).toBe(6);
    expect(new Set(started).size).toBe(6);
    expect(started).toEqual([0, 1.5, 3, 4.5, 6.5, 8.5]);
  });

  it('vòng lặp kế tiếp hẹn đúng lúc chuỗi nốt kết thúc, không hẹn mỗi frame', async () => {
    const { sound: s } = await import('../src/services/sound');
    s.setBgMusicEnabled(true);
    started.length = 0;
    vi.advanceTimersByTime(11000);
    expect(started.length).toBe(6);
  });

  it('tắt nhạc thì context được đóng lại và hẹn giờ vòng lặp bị hủy', async () => {
    const { sound: s } = await import('../src/services/sound');
    s.setBgMusicEnabled(true);
    expect(liveContexts).toBe(1);
    s.setBgMusicEnabled(false);
    expect(closed.length).toBe(1);
    expect(liveContexts).toBe(0);
    started.length = 0;
    vi.advanceTimersByTime(30000);
    expect(started.length).toBe(0);
  });

  it('bật tắt bật không để lại context mở dồn (mỗi lần bật lại đúng một cái)', async () => {
    const { sound: s } = await import('../src/services/sound');
    s.setBgMusicEnabled(true);
    s.setBgMusicEnabled(false);
    s.setBgMusicEnabled(true);
    expect(liveContexts).toBe(1);
    expect(closed.length).toBe(1);
  });
});
