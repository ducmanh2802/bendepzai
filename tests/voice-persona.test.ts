import { afterEach, describe, expect, it } from 'vitest';
import {
  PRAISE_PERSONA_ROTATION,
  VOICE_PERSONAS,
} from '../src/services/sound';
import {
  listPraisePersonas,
  pickPraisePersona,
  resetPraisePersonasForTests,
} from '../src/services/praiseEngine';

afterEach(() => {
  resetPraisePersonasForTests();
});

describe('voice persona catalogue', () => {
  it('khen ngợi luân phiên cả người lớn và trẻ em', () => {
    expect(PRAISE_PERSONA_ROTATION.some((id) => VOICE_PERSONAS[id].isChild)).toBe(true);
    expect(PRAISE_PERSONA_ROTATION.some((id) => !VOICE_PERSONAS[id].isChild)).toBe(true);
  });

  it('mỗi persona có "hồ sơ giọng" riêng (không trùng pitch:rate)', () => {
    const profiles = Object.values(VOICE_PERSONAS).map((p) => `${p.pitch}:${p.rate}`);
    expect(new Set(profiles).size).toBe(profiles.length);
  });

  it('pitch/rate nằm trong khoảng hợp lệ của Web Speech', () => {
    for (const p of Object.values(VOICE_PERSONAS)) {
      expect(p.pitch).toBeGreaterThanOrEqual(0);
      expect(p.pitch).toBeLessThanOrEqual(2);
      expect(p.rate).toBeGreaterThan(0);
      expect(p.rate).toBeLessThanOrEqual(2);
    }
    expect(VOICE_PERSONAS.narrator.pitch).toBeCloseTo(1.1, 5);
  });

  it('listPraisePersonas trả đủ rotation và không âm thầm đổi nội dung', () => {
    const listed = listPraisePersonas();
    expect(listed.map((p) => p.id)).toEqual(PRAISE_PERSONA_ROTATION);
    expect(listed.every((p) => p.label.trim().length > 0)).toBe(true);
  });
});

describe('pickPraisePersona', () => {
  it('cùng seed → cùng persona (deterministic)', () => {
    expect(pickPraisePersona('T01')).toBe(pickPraisePersona('T01'));
    expect(pickPraisePersona('T01')).toBe(pickPraisePersona('T01'));
  });

  it('không lặp persona trong 2 lần khen gần nhất', () => {
    resetPraisePersonasForTests();
    const seq: string[] = [];
    for (let i = 0; i < 40; i++) seq.push(pickPraisePersona());
    for (let i = 2; i < seq.length; i++) {
      expect(seq[i]).not.toBe(seq[i - 1]);
      expect(seq[i]).not.toBe(seq[i - 2]);
    }
  });

  it('sau nhiều lượt, cả 5 persona đều đã lên sân khấu', () => {
    resetPraisePersonasForTests();
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) seen.add(pickPraisePersona());
    expect(seen.size).toBe(PRAISE_PERSONA_ROTATION.length);
  });

  it('reset trả hệ về trạng thái ban đầu', () => {
    pickPraisePersona();
    resetPraisePersonasForTests();
    const seq = [pickPraisePersona(), pickPraisePersona(), pickPraisePersona()];
    for (let i = 1; i < seq.length; i++) {
      expect(seq[i]).not.toBe(seq[i - 1]);
    }
  });
});
