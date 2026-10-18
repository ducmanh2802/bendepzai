import { READING_POLICY } from '../config/policy';
import type { ReadingProfile, ReadingStage, ReadingStageState } from '../types/reading';

/**
 * T02C — lightweight factory for the pristine reading ladder profile.
 *
 * This module intentionally imports NOTHING from `readingEngine` or
 * `readingContent`: `storage.ts` (first-load chunk) needs the default profile
 * shape without paying for the whole reading bank (~38 kB) and engine.
 * `ReadingEngine.emptyProfile()` delegates here so there is exactly one
 * source of truth for the default shape.
 */
export function gateForReadingStage(stage: ReadingStage): number {
  switch (stage) {
    case 'ACCURACY':
      return READING_POLICY.ACCURACY_GATE;
    case 'FLUENCY':
      return READING_POLICY.ACCURACY_GATE;
    case 'COMPREHENSION':
      return READING_POLICY.COMPREHENSION_GATE;
    case 'PROCESSING_SPEED':
      return READING_POLICY.COMPREHENSION_ACCURACY_GATE;
    case 'COMPETITION_SPEED':
      return READING_POLICY.COMPREHENSION_ACCURACY_GATE;
    default:
      return READING_POLICY.ACCURACY_GATE;
  }
}

export function createEmptyReadingProfile(): ReadingProfile {
  const stageStates = {} as Record<ReadingStage, ReadingStageState>;
  const order: readonly ReadingStage[] = READING_POLICY.STAGES;
  order.forEach((stage, index) => {
    stageStates[stage] = {
      stage,
      accuracy: 0,
      accuracyGate: gateForReadingStage(stage),
      // Only the first stage starts unlocked; the rest open as gates are met.
      isUnlocked: index === 0,
      isCompleted: false,
      attempts: 0,
    };
  });

  return {
    currentStage: 'ACCURACY',
    stageStates,
    skillStates: {},
    readingIndex: 0,
    accuracyIndex: 0,
    fluencyIndex: 0,
    comprehensionIndex: 0,
    headline: 'Mình bắt đầu luyện đọc chắc nhé!',
    encouragement: 'Bé cứ đọc từ từ, mình luôn ở đây đồng hành cùng bé!',
  };
}
