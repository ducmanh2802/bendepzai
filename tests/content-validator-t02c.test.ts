import { describe, it, expect } from 'vitest';
import {
  findNearDuplicates,
  normalizeForDuplicateCheck,
  runContentValidation,
  semanticSimilarity,
  tokenizeForDuplicateCheck,
} from '../src/services/contentValidator';
import { CONTENT_POLICY } from '../src/config/policy';

describe('T02C — diacritics-sensitive duplicate detection (má ≠ mà)', () => {
  it('normalises case/punctuation but never strips tones', () => {
    expect(normalizeForDuplicateCheck('  Tính: 6 + 4 = ? ')).toBe('tính 6 4');
    expect(normalizeForDuplicateCheck('MÁ')).toBe('má');
    expect(normalizeForDuplicateCheck('má')).not.toBe(normalizeForDuplicateCheck('mà'));
    expect(normalizeForDuplicateCheck('ăn')).not.toBe(normalizeForDuplicateCheck('ân'));
  });

  it('tokenizes each prompt into a diacritics-sensitive set', () => {
    expect(tokenizeForDuplicateCheck('Bé ăn cơm!')).toEqual(new Set(['bé', 'ăn', 'cơm']));
  });

  it('flags exact rewordings but not tone-different questions in one group', () => {
    const pairs = findNearDuplicates([
      { id: 'q1', prompt: 'Má đi chợ mua rau', group: 'tieng-viet::s1' },
      { id: 'q2', prompt: 'Má đi chợ mua rau!', group: 'tieng-viet::s1' },
      { id: 'q3', prompt: 'Mà đi chợ mua rau', group: 'tieng-viet::s1' },
    ]);
    const flagged = new Set(pairs.map((p) => `${p.aId}>${p.bId}`));
    expect(flagged.has('q1>q2')).toBe(true);
    expect(pairs.find((p) => p.bId === 'q2')?.severity).toBe('ERROR');
    // q3 differs by tone from both: no pair may reference it.
    expect([...flagged].some((k) => k.includes('q3'))).toBe(false);
  });

  it('compares only inside the same subject+skill group', () => {
    const pairs = findNearDuplicates([
      { id: 'a', prompt: 'Bé đếm năm bông hoa', group: 'toan::math_counting_10' },
      { id: 'b', prompt: 'Bé đếm năm bông hoa', group: 'toan::math_addition_10' },
      { id: 'c', prompt: 'Bé đếm năm bông hoa', group: 'tieng-viet::vn_vocab_objects' },
    ]);
    expect(pairs).toEqual([]);
  });

  it('keeps thresholds: ERROR at policy similarity, WARNING at 0.75', () => {
    expect(CONTENT_POLICY.DUPLICATE_PROMPT_SIMILARITY).toBe(0.9);
    // 6 shared of 8 union = 0.75 → WARNING, not ERROR.
    const pairs = findNearDuplicates([
      { id: 'w1', prompt: 'Bé vẽ quả bóng màu xanh đẹp', group: 'g::s' },
      { id: 'w2', prompt: 'Bé vẽ quả bóng màu vàng đẹp', group: 'g::s' },
    ]);
    expect(pairs.length).toBe(1);
    expect(pairs[0].severity).toBe('WARNING');
    expect(pairs[0].similarity).toBeCloseTo(6 / 8, 5);
    void semanticSimilarity;
  });
});

describe('T02C — validator speed: 2.000 questions run under 5 s', () => {
  it('scans 2.000 synthetic questions in well under 5 seconds', () => {
    const subjects = ['tieng-viet', 'toan', 'english'];
    const items = [];
    for (let i = 0; i < 2000; i += 1) {
      const subject = subjects[i % subjects.length];
      const skill = `skill-${i % 25}`;
      // Prompts share vocabulary (realistic bank overlap) but differ enough
      // to avoid accidental duplicates: number + object rotate independently.
      items.push({
        id: `syn-${i}`,
        prompt: `Bé đếm ${i % 97} quả ${['táo', 'cam', 'bóng', 'hoa', 'lá'][i % 5]} trong vườn`,
        group: `${subject}::${skill}`,
      });
    }
    // A few planted exact duplicates must still be caught.
    items.push({ id: 'syn-dup-a', prompt: items[7].prompt, group: items[7].group });
    items.push({ id: 'syn-dup-b', prompt: items[42].prompt, group: items[42].group });

    const started = performance.now();
    const pairs = findNearDuplicates(items);
    const elapsed = performance.now() - started;

    expect(pairs.some((p) => p.bId === 'syn-dup-a' && p.severity === 'ERROR')).toBe(true);
    expect(pairs.some((p) => p.bId === 'syn-dup-b' && p.severity === 'ERROR')).toBe(true);
    expect(elapsed).toBeLessThan(5000);
  });

  it('runs the full real-bank validation with zero errors', () => {
    const started = performance.now();
    const report = runContentValidation();
    const elapsed = performance.now() - started;
    expect(report.totals.errors).toBe(0);
    expect(elapsed).toBeLessThan(5000);
  });
});
