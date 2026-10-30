import { useEffect, useRef, useState } from 'react';
import { GAME_LEVEL_POLICY } from '../config/policy';
import { clampTier, getTierMeta, type GameTierMeta } from '../data/gameLevels';
import { StorageService } from '../services/storage';

export type GameStagePhase = 'playing' | 'tierComplete' | 'allComplete';

export interface UseGameStageOptions {
  gameId: string;
  /** Objectives/rounds inside each tier (index 0 = tier 1). Length = tier count. */
  roundsPerTier: number[];
  /** Pause between a correct answer and the next objective (ms). */
  advanceDelayMs?: number;
  /** Force the starting tier instead of the highest unlocked one. */
  startTier?: number;
}

export interface GameStage {
  tier: number;
  tierMeta: GameTierMeta;
  tierCount: number;
  roundIdx: number;
  roundNumber: number;
  roundTotal: number;
  score: number;
  mistakesInTier: number;
  isLastTier: boolean;
  phase: GameStagePhase;
  isGameOver: boolean;
  locked: boolean;
  starsEarned: number;
  xpEarned: number;
  /** Best stars BEFORE the current tier completion (T02/B2 replay delta). */
  prevBestStars: number;
  /** Play count for the current tier (T02/B5 replay shuffling). */
  nonce: number;
  submitCorrect: (starsOverride?: number) => void;
  submitWrong: () => void;
  startNextTier: () => void;
  restartGame: () => void;
  jumpToTier: (targetTier: number) => void;
}

/** T02/B1 — stars from real performance (single source of truth). */
export function computeStars(mistakes: number): number {
  if (mistakes <= GAME_LEVEL_POLICY.STAR_THREE_MAX_MISTAKES) return 3;
  if (mistakes <= GAME_LEVEL_POLICY.STAR_TWO_MAX_MISTAKES) return 2;
  return 1;
}

/**
 * Level state machine shared by every arcade game. Handles the tier ladder
 * (easy -> super hard, unlock the next on finish), per-tier stars, XP rewards
 * and persistence through StorageService.
 */
export function useGameStage(options: UseGameStageOptions): GameStage {
  const { gameId, roundsPerTier, advanceDelayMs = 1100 } = options;
  const tierCount = roundsPerTier.length;

  const [tier, setTier] = useState(() =>
    clampTier(options.startTier ?? StorageService.getGameProgress(gameId).unlockedTier)
  );
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  // T02B/B16 — score inside the CURRENT tier only (best score is stored
  // per tier; the cumulative `score` above stays for HUD display).
  const [tierScore, setTierScore] = useState(0);
  const [mistakesInTier, setMistakesInTier] = useState(0);
  const [locked, setLocked] = useState(false);
  const [phase, setPhase] = useState<GameStagePhase>('playing');
  const [starsEarned, setStarsEarned] = useState(0);
  const [prevBestStars, setPrevBestStars] = useState(0);
  const [nonce, setNonce] = useState(0);
  const timerRef = useRef<number | null>(null);

  // T01/B10 — never leave a pending advance timer running after unmount
  // (closing the game modal mid-delay previously leaked the timeout).
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const tierSafe = clampTier(tier);
  const roundTotal = roundsPerTier[Math.min(tierSafe - 1, roundsPerTier.length - 1)] ?? 1;
  const tierMeta = getTierMeta(tierSafe);
  const isLastTier = tierSafe >= Math.max(tierCount, 1);
  const xpEarned = GAME_LEVEL_POLICY.XP_PER_TIER[Math.min(tierSafe - 1, GAME_LEVEL_POLICY.XP_PER_TIER.length - 1)];

  // T02/B5 — every (re)play of a tier bumps its nonce so builders reshuffle.
  // Runs on mount and whenever the tier changes (startNextTier / restart).
  useEffect(() => {
    try {
      setNonce(StorageService.bumpPlayNonce(gameId, tierSafe));
    } catch {
      setNonce((n) => n + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tierSafe]);

  const submitCorrect = (starsOverride?: number) => {
    if (locked || phase !== 'playing') return;
    setScore((s) => s + 1);
    setTierScore((s) => s + 1);
    setLocked(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setLocked(false);
      if (roundIdx + 1 < roundTotal) {
        setRoundIdx((i) => i + 1);
      } else {
        // T02B/B13 — explicit stars (e.g. ColoringCanvas coverage) win;
        // otherwise stars come from real mistakes in THIS tier.
        const stars =
          typeof starsOverride === 'number'
            ? Math.min(Math.max(Math.round(starsOverride), 1), 3)
            : computeStars(mistakesInTier);
        // T02/B2 — capture best BEFORE persisting so the reward receipt
        // can pay only the delta on replays.
        try {
          setPrevBestStars(StorageService.getGameProgress(gameId).starsByTier[tierSafe] ?? 0);
        } catch {
          setPrevBestStars(0);
        }
        // T02B/B16 — persist the PER-TIER score, never the cumulative total.
        StorageService.completeGameTier(gameId, tierSafe, stars, tierScore + 1);
        setStarsEarned(stars);
        setPhase(isLastTier ? 'allComplete' : 'tierComplete');
      }
    }, advanceDelayMs);
  };

  const submitWrong = () => {
    if (locked || phase !== 'playing') return;
    setMistakesInTier((m) => m + 1);
  };

  const startNextTier = () => {
    if (phase !== 'tierComplete') return;
    setTier((t) => clampTier(t + 1));
    setRoundIdx(0);
    setTierScore(0);
    setMistakesInTier(0);
    setLocked(false);
    setPhase('playing');
    setStarsEarned(0);
    setPrevBestStars(0);
  };

  const restartGame = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    const resumeTier = clampTier(StorageService.getGameProgress(gameId).unlockedTier);
    setTier(resumeTier);
    setRoundIdx(0);
    setScore(0);
    setTierScore(0);
    setMistakesInTier(0);
    setLocked(false);
    setPhase('playing');
    setStarsEarned(0);
    setPrevBestStars(0);
    // T02/B5 — replaying the same tier counts as a new play for shuffling.
    try {
      setNonce(StorageService.bumpPlayNonce(gameId, resumeTier));
    } catch {
      setNonce((n) => n + 1);
    }
  };

  const jumpToTier = (targetTier: number) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    const safeTarget = clampTier(targetTier);
    setTier(safeTarget);
    setRoundIdx(0);
    setScore(0);
    setTierScore(0);
    setMistakesInTier(0);
    setLocked(false);
    setPhase('playing');
    setStarsEarned(0);
    setPrevBestStars(0);
    try {
      setNonce(StorageService.bumpPlayNonce(gameId, safeTarget));
    } catch {
      setNonce((n) => n + 1);
    }
  };

  return {
    tier: tierSafe,
    tierMeta,
    tierCount,
    roundIdx,
    roundNumber: roundIdx + 1,
    roundTotal,
    score,
    mistakesInTier,
    isLastTier,
    phase,
    isGameOver: phase === 'allComplete',
    locked,
    starsEarned,
    xpEarned,
    prevBestStars,
    nonce,
    submitCorrect,
    submitWrong,
    startNextTier,
    restartGame,
    jumpToTier,
  };
}