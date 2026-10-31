import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatElapsed,
  lessonRatingLabel,
  lessonStarRating,
} from '../src/components/learning/lessonEngagement';

const here = dirname(fileURLToPath(import.meta.url));
const lp = readFileSync(join(here, '..', 'src/components/learning/LessonPlayerModal.tsx'), 'utf8');

describe('T27 đồng hồ bài học', () => {
  it('hiển thị phút:giây, số âm hoặc rác quy về 0:00', () => {
    expect(formatElapsed(0)).toBe('0:00');
    expect(formatElapsed(5)).toBe('0:05');
    expect(formatElapsed(65)).toBe('1:05');
    expect(formatElapsed(600)).toBe('10:00');
    expect(formatElapsed(-9)).toBe('0:00');
    expect(formatElapsed(Number.NaN)).toBe('0:00');
    expect(formatElapsed(Number.POSITIVE_INFINITY)).toBe('0:00');
  });
});

describe('T27 xếp hạng 3 sao', () => {
  it('3 sao từ 80% câu đúng, 2 sao từ 50%, còn lại 1 sao', () => {
    expect(lessonStarRating(5, 5)).toBe(3);
    expect(lessonStarRating(4, 5)).toBe(3);
    expect(lessonStarRating(3, 4)).toBe(2);
    expect(lessonStarRating(2, 4)).toBe(2);
    expect(lessonStarRating(2, 5)).toBe(1);
    expect(lessonStarRating(0, 5)).toBe(1);
  });

  it('bài không có câu nào vẫn tặng 1 sao, không chia cho 0', () => {
    expect(lessonStarRating(0, 0)).toBe(1);
    expect(lessonStarRating(3, Number.NaN)).toBe(1);
  });

  it('mỗi mức sao có lời khen riêng bằng tiếng Việt', () => {
    const labels = [lessonRatingLabel(3), lessonRatingLabel(2), lessonRatingLabel(1)];
    expect(new Set(labels).size).toBe(3);
    for (const label of labels) expect(label).toMatch(/[àáảãạâầấẩẫậăằắẳẵặêềếểễệôồốổỗộơờớởỡợưừứửữựđ]/i);
  });
});

describe('T27 combo, đồng hồ và ôn câu sai trong LessonPlayerModal', () => {
  it('combo hiện thành dải riêng, đổi âm thanh và ăn mừng ở mốc 3/5', () => {
    expect(lp).toContain('data-testid="lesson-combo"');
    expect(lp).toContain('sound.playCombo()');
    expect(lp).toMatch(/nextCombo === 3 \|\| nextCombo === 5/);
    expect(lp).toMatch(/fireCelebrationConfetti\(\)/);
    // Sai một câu là đứt chuỗi.
    expect(lp).toMatch(/setCombo\(0\)/);
  });

  it('đồng hồ chạy trong bài và dừng ở màn kết quả', () => {
    expect(lp).toContain('data-testid="lesson-timer"');
    expect(lp).toContain('formatElapsed(elapsedSec)');
    expect(lp).toMatch(/if \(isFinished\) return;\s*if \(startedAtRef\.current === null\)/);
  });

  it('màn kết quả có 3 sao, lời khen, danh sách câu sai và nút ôn lại', () => {
    expect(lp).toContain('data-testid="lesson-stars"');
    expect(lp).toContain('data-testid="lesson-rating-label"');
    expect(lp).toContain('lessonRatingLabel(starRating)');
    expect(lp).toContain('data-stars={starRating}');
    expect(lp).toContain('data-testid="lesson-missed-list"');
    expect(lp).toContain('data-testid="lesson-review-missed"');
    expect(lp).toMatch(/onClick=\{handleReviewMissed\}/);
    // Không đổi phần thưởng thật của bài (test cũ vẫn phải xanh).
    expect(lp).toContain('+{lesson.starReward} Sao');
  });

  it('ghi lại câu sai kèm đáp án đúng, xoá khỏi danh sách khi bé sửa đúng', () => {
    expect(lp).toContain('prompt: question.prompt, answer: correctAnswerStr');
    expect(lp).toMatch(/setMissed\(\(list\) => list\.filter\(\(m\) => m\.id !== question\.id\)\)/);
  });

  it('nút ôn lại chỉ giữ câu sai và reset sạch trạng thái', () => {
    const start = lp.indexOf('const handleReviewMissed = () => {');
    expect(start).toBeGreaterThan(-1);
    const fn = lp.slice(start, lp.indexOf('\n  };', start));
    expect(fn).toContain('startRun(difficultyMode, missed.map((m) => m.id))');
    expect(lp).toMatch(/const onlyMissed = base\.filter\(\(q\) => reviewSet\.has\(q\.id\)\)/);
  });

  it('mọi lượt mới (đổi độ khó, học lại, ôn câu sai) đều reset đủ trạng thái', () => {
    const start = lp.indexOf('const startRun = (');
    expect(start).toBeGreaterThan(-1);
    const fn = lp.slice(start, lp.indexOf('\n  };', start));
    for (const reset of [
      'setReviewIds(review)',
      'setCurrentIdx(0)',
      'setScore(0)',
      'setIsFinished(false)',
      'setBestCombo(0)',
      'setMissed([])',
      'setElapsedSec(0)',
    ]) {
      expect(fn, reset).toContain(reset);
    }
    // Hai nút độ khó phải đi qua startRun, nếu không bé bấm ở màn kết quả sẽ
    // thấy "0 / N" ngay trên màn kết quả thay vì bắt đầu lượt mới.
    expect(lp).toContain("startRun('standard')");
    expect(lp).toContain("startRun('challenge')");
    expect(lp).toContain('startRun(difficultyMode);');
  });

  it('lượt ôn chỉ báo 5 XP luyện lại, không hứa lại Sao/Vé', () => {
    expect(lp).toContain('data-testid="lesson-review-reward"');
    expect(lp).toContain('Ôn tập xong! +5 XP luyện lại');
    const rewardStart = lp.indexOf('data-testid="lesson-review-reward"');
    const rewardEnd = lp.indexOf(') : (', rewardStart);
    expect(rewardStart).toBeGreaterThan(-1);
    expect(rewardEnd).toBeGreaterThan(rewardStart);
    const reviewBlock = lp.slice(rewardStart, rewardEnd);
    expect(reviewBlock).not.toContain('lesson.starReward');
    expect(reviewBlock).not.toContain('Vé Chơi');
  });
});
