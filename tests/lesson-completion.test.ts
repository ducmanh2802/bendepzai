import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Lesson result screen ("+N Sao") — regression guard.
 *
 * T20B fixed B-05 (two dialogs at once: the lesson result + the level-up
 * celebration) by deleting the result screen, so a finished lesson closed
 * without ever showing the child what they earned. The fix keeps the result
 * screen inside the lesson dialog and tells the parent (onComplete → profile
 * refresh → level-up celebration) only when the child leaves it.
 * Browser checks: qa/golden-path.mjs and qa/lesson-types.mjs.
 */
const here = dirname(fileURLToPath(import.meta.url));
const lp = readFileSync(join(here, '..', 'src/components/learning/LessonPlayerModal.tsx'), 'utf8');
const body = (name: string) => {
  const start = lp.indexOf(`const ${name} = () => {`);
  expect(start, name).toBeGreaterThan(-1);
  return lp.slice(start, lp.indexOf('\n  };', start));
};

describe('lesson result screen', () => {
  it('is rendered inside the lesson dialog with the rewards and both actions', () => {
    expect(lp).toContain('CHÚC MỪNG BÉ HOÀN THÀNH!');
    expect(lp).toContain('+{lesson.starReward} Sao');
    expect(lp).toContain('+{lesson.xpReward} XP');
    expect(lp).toMatch(/onClick=\{handleRetryLesson\}/);
    expect(lp).toMatch(/onClick=\{handleFinishAndClose\}[\s\S]{0,300}Về bản đồ/);
    // exactly one dialog element in this component
    expect(lp.match(/role="dialog"/g)?.length).toBe(1);
  });

  it('finishing saves the rewards but does not close or notify the parent yet', () => {
    const next = body('handleNextQuestion');
    expect(next).toContain('StorageService.completeLesson(');
    expect(next).toContain('setIsFinished(true)');
    expect(next).not.toMatch(/onComplete\s*\(|onClose\s*\(/);
  });

  it('the parent is notified once, when the child leaves the result screen', () => {
    expect(body('handleFinishAndClose')).toMatch(/notifyComplete\(\);\s*onClose\(\);/);
    expect(body('notifyComplete')).toContain('completeNotifiedRef.current = true');
    // back gesture / Esc after finishing still reports completion
    expect(lp).toMatch(/useEffect\(\(\) => \(\) => notifyComplete\(\), \[\]\)/);
  });

  it('"Học lại" starts the lesson again from a clean state', () => {
    const retry = body('handleRetryLesson');
    for (const reset of ['setCurrentIdx(0)', 'setScore(0)', 'setIsAnswerChecked(false)', 'setIsFinished(false)']) {
      expect(retry, reset).toContain(reset);
    }
  });
});
