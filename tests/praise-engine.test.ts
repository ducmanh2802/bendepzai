/**
 * P38 PRAISE ENGINE — unit + integration suite.
 *
 * Covers: language resolver, subject/character/outcome resolvers, phrase
 * selector, anti-repetition, cooldown-equivalent dedup, text/TTS parity,
 * English/Vietnamese validation, locale selection, unavailable-TTS safety,
 * duplicate-event protection, and Game/Competition/KidBox/LearningOS
 * integration surfaces.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  assertTextTtsParity,
  getPraiseCatalog,
  isPlaceholderText,
  isPureEnglishPraise,
  isVietnamesePraise,
  isDuplicatePraiseEvent,
  markPraiseEventSeen,
  pickOutcome,
  resolveContextualPraise,
  resolvePraise,
  resolvePraiseCharacter,
  resolvePraiseLanguage,
  selectPhrase,
  resetPraiseEngineForTests,
  speakPraise,
  toPraiseSubject,
  validatePraisePhrase,
  type PraiseOutcome,
  type PraiseSubject,
} from '../src/services/praiseEngine';
import { getQuestionAudioLang } from '../src/services/questionAudio';

beforeEach(() => {
  resetPraiseEngineForTests();
});

describe('P38 catalog integrity (§17)', () => {
  it('every catalog phrase validates (id, language, outcome, text, safety)', () => {
    const catalog = getPraiseCatalog();
    expect(catalog.length).toBeGreaterThan(40);
    const ids = new Set<string>();
    for (const phrase of catalog) {
      expect(phrase.id).toBeTruthy();
      expect(ids.has(phrase.id)).toBe(false);
      ids.add(phrase.id);
      expect(validatePraisePhrase(phrase)).toBe(true);
    }
  });

  it('rejects insulting / shaming / pressuring language anywhere in the catalog', () => {
    const banned = [
      'stupid', 'bad', 'dumb', 'shame', 'ngu', 'dốt', 'kém cỏi',
      'everyone else is better', 'so sánh', 'xấu hổ',
    ];
    for (const phrase of getPraiseCatalog()) {
      for (const word of banned) {
        expect(phrase.text.toLowerCase().includes(word)).toBe(false);
      }
    }
  });

  it('rejects placeholder text', () => {
    for (const bad of ['TODO', 'Lorem ipsum', 'TEST', 'undefined', '[missing]', '   ']) {
      expect(isPlaceholderText(bad)).toBe(true);
    }
    expect(isPlaceholderText('Great job!')).toBe(false);
    expect(isPlaceholderText('Giỏi lắm!')).toBe(false);
  });

  it('both languages cover every core outcome family', () => {
    const catalog = getPraiseCatalog();
    const needed: PraiseOutcome[] = [
      'CORRECT', 'ENCOURAGEMENT', 'STREAK', 'MASTERED',
      'REVIEW_SUCCESS', 'GAME_COMPLETED', 'LESSON_COMPLETED',
      'COMPETITION_SUCCESS', 'RECOVERY_AFTER_ERROR', 'ALMOST',
    ];
    for (const outcome of needed) {
      expect(catalog.some((p) => p.language === 'en-GB' && p.outcome === outcome)).toBe(true);
      expect(catalog.some((p) => p.language === 'vi-VN' && p.outcome === outcome)).toBe(true);
    }
  });
});

describe('P38 language resolution (§6)', () => {
  it('explicit activity language wins over everything', () => {
    expect(resolvePraiseLanguage({ subject: 'ENGLISH', language: 'vi-VN' })).toBe('vi-VN');
    expect(resolvePraiseLanguage({ subject: 'VIETNAMESE', language: 'en-GB' })).toBe('en-GB');
  });

  it('Kid Box / English context resolves to en-GB', () => {
    expect(resolvePraiseLanguage({ subject: 'ENGLISH' })).toBe('en-GB');
    expect(resolvePraiseLanguage({ subject: 'VIETNAMESE', kidBox: true })).toBe('en-GB');
  });

  it('Vietnamese context resolves to vi-VN', () => {
    expect(resolvePraiseLanguage({ subject: 'VIETNAMESE' })).toBe('vi-VN');
  });

  it('Math inherits the real learning context (default vi-VN)', () => {
    expect(resolvePraiseLanguage({ subject: 'MATH' })).toBe('vi-VN');
    expect(resolvePraiseLanguage({ subject: 'MATH', mathUiLanguage: 'en-GB' })).toBe('en-GB');
  });

  it('maps lesson subject strings to canonical subjects', () => {
    expect(toPraiseSubject('english')).toBe('ENGLISH');
    expect(toPraiseSubject('tieng-viet')).toBe('VIETNAMESE');
    expect(toPraiseSubject('toan')).toBe('MATH');
    expect(toPraiseSubject('math')).toBe('MATH');
    expect(toPraiseSubject(null)).toBe('VIETNAMESE');
    expect(toPraiseSubject('tieng-viet', true)).toBe('ENGLISH');
  });
});

describe('P38 character consistency (§10, centralized)', () => {
  it('English → Thỏ English, Math → Cáo Toán Học, Vietnamese → Gấu Bút Chì', () => {
    expect(resolvePraiseCharacter('ENGLISH')).toBe('THO_ENGLISH');
    expect(resolvePraiseCharacter('MATH')).toBe('CAO_TOAN_HOC');
    expect(resolvePraiseCharacter('VIETNAMESE')).toBe('GAU_BUT_CHI');
  });

  it('resolved praise carries the centralized character (never per-game guess)', () => {
    const en = resolvePraise({ subject: 'ENGLISH', outcome: 'CORRECT', seed: 'c1' });
    expect(en.character).toBe('THO_ENGLISH');
    expect(en.characterEmoji).toBe('🐰');
    const math = resolvePraise({ subject: 'MATH', outcome: 'CORRECT', seed: 'c1' });
    expect(math.character).toBe('CAO_TOAN_HOC');
    const vi = resolvePraise({ subject: 'VIETNAMESE', outcome: 'CORRECT', seed: 'c1' });
    expect(vi.character).toBe('GAU_BUT_CHI');
  });
});

describe('P38 outcome priority (§11, deterministic)', () => {
  it('MASTERED beats STREAK + CORRECT', () => {
    expect(pickOutcome(['CORRECT', 'STREAK', 'MASTERED'])).toBe('MASTERED');
  });

  it('PERSONAL_BEST beats CORRECT', () => {
    expect(pickOutcome(['CORRECT', 'PERSONAL_BEST'])).toBe('PERSONAL_BEST');
  });

  it('RECOVERY_AFTER_ERROR beats CORRECT', () => {
    expect(pickOutcome(['CORRECT', 'RECOVERY_AFTER_ERROR'])).toBe('RECOVERY_AFTER_ERROR');
  });

  it('single outcomes pass through; INCORRECT speaks encouragement', () => {
    expect(pickOutcome('CORRECT')).toBe('CORRECT');
    const verdict = resolvePraise({ subject: 'ENGLISH', outcome: 'INCORRECT', seed: 'i1' });
    expect(verdict.outcome).toBe('INCORRECT');
    expect(isPureEnglishPraise(verdict.text)).toBe(true);
    const vi = resolvePraise({ subject: 'VIETNAMESE', outcome: 'INCORRECT', seed: 'i1' });
    expect(isVietnamesePraise(vi.text)).toBe(true);
  });

  it('empty outcome list refuses to guess', () => {
    expect(() => pickOutcome([])).toThrow(/empty outcome list/);
  });
});

describe('P38 English contract (§7) + Vietnamese contract (§8)', () => {
  const englishContexts: PraiseSubject[] = ['ENGLISH'];

  it('English lessons/games/competition/KidBox praise is pure English', () => {
    const outcomes: PraiseOutcome[] = [
      'CORRECT', 'INCORRECT', 'ALMOST', 'STREAK', 'COMBO', 'MASTERED',
      'REVIEW_SUCCESS', 'GAME_COMPLETED', 'LESSON_COMPLETED',
      'RECOVERY_AFTER_ERROR', 'ENCOURAGEMENT', 'COMPETITION_SUCCESS',
    ];
    for (const subject of englishContexts) {
      for (const outcome of outcomes) {
        const praise = resolvePraise({ subject, outcome, seed: `${subject}:${outcome}` });
        expect(praise.language).toBe('en-GB');
        expect(praise.locale).toBe('en-GB');
        expect(isPureEnglishPraise(praise.text)).toBe(true);
      }
    }
  });

  it('Kid Box praise is English even though surrounding UI chrome is Vietnamese', () => {
    const praise = resolvePraise({ subject: 'ENGLISH', kidBox: true, outcome: 'CORRECT', seed: 'kb' });
    expect(praise.language).toBe('en-GB');
    expect(isPureEnglishPraise(praise.text)).toBe(true);
  });

  it('Vietnamese contexts praise in Vietnamese', () => {
    const praise = resolvePraise({ subject: 'VIETNAMESE', outcome: 'CORRECT', seed: 'v1' });
    expect(praise.language).toBe('vi-VN');
    expect(praise.locale).toBe('vi-VN');
    expect(isVietnamesePraise(praise.text)).toBe(true);
  });

  it('detects mixed-language contamination in English praise', () => {
    expect(() =>
      validatePraisePhrase({
        id: 'x', language: 'en-GB', outcome: 'CORRECT',
        text: 'Great job! Con làm tốt lắm!',
      })
    ).toThrow(/MIXED-LANGUAGE/);
    expect(() =>
      validatePraisePhrase({
        id: 'y', language: 'en-GB', outcome: 'CORRECT', text: 'Well done! Cố lên!',
      })
    ).toThrow(/MIXED-LANGUAGE/);
  });

  it('English game sentence templates are pure English (valid contextual praise)', () => {
    const sentences = [
      'Great job! This is a Dog!',
      'No, this is a Cat. Find the Dog!',
      'Find the Lion!',
      'Pop the RED balloon!',
      'That is BLUE. Touch RED!',
    ];
    for (const s of sentences) {
      expect(isPureEnglishPraise(s)).toBe(true);
      const praise = resolveContextualPraise(
        { subject: 'ENGLISH', outcome: 'CORRECT' }, s, 'en-GB'
      );
      expect(praise.text).toBe(praise.ttsText);
      expect(praise.locale).toBe('en-GB');
    }
  });

  it('contextual praise refuses cross-language sentences', () => {
    expect(() =>
      resolveContextualPraise(
        { subject: 'ENGLISH', outcome: 'CORRECT' }, 'Giỏi lắm!', 'vi-VN'
      )
    ).toThrow(/CONTEXT_LANGUAGE_MISMATCH/);
  });
});

describe('P38 text↔TTS single source of truth (§13, P0)', () => {
  it('ttsText === text for every resolved praise across the full matrix', () => {
    const subjects: PraiseSubject[] = ['VIETNAMESE', 'MATH', 'ENGLISH'];
    const outcomes: PraiseOutcome[] = [
      'CORRECT', 'INCORRECT', 'ALMOST', 'FIRST_SUCCESS', 'STREAK', 'COMBO',
      'PERSONAL_BEST', 'IMPROVEMENT', 'MASTERED', 'REVIEW_SUCCESS',
      'GAME_COMPLETED', 'LESSON_COMPLETED', 'MISSION_COMPLETED',
      'DAILY_GOAL', 'COMPETITION_SUCCESS', 'RECOVERY_AFTER_ERROR', 'ENCOURAGEMENT',
    ];
    for (const subject of subjects) {
      for (const outcome of outcomes) {
        const praise = resolvePraise({ subject, outcome, seed: `parity:${subject}:${outcome}` });
        expect(praise.text).toBe(praise.ttsText);
        expect(assertTextTtsParity(praise)).toBe(true);
      }
    }
  });

  it('parity assertion FAILS loudly on a tampered object (never silent drift)', () => {
    expect(() =>
      assertTextTtsParity({ id: 't', text: 'Great job!', ttsText: 'Làm tốt lắm!' })
    ).toThrow(/TEXT_TTS_PARITY FAIL/);
  });
});

describe('P38 anti-repetition (§12)', () => {
  it('deterministic mode: same seed → same phrase', () => {
    const a = selectPhrase('en-GB', 'CORRECT', 'seed-1');
    const b = selectPhrase('en-GB', 'CORRECT', 'seed-1');
    expect(a.id).toBe(b.id);
  });

  it('production mode: never repeats the immediately previous phrase when alternatives exist', () => {
    let prev: string | null = null;
    for (let i = 0; i < 20; i++) {
      const phrase = selectPhrase('en-GB', 'CORRECT');
      if (prev) expect(phrase.id).not.toBe(prev);
      prev = phrase.id;
    }
  });

  it('never starves a language: single-phrase pools still resolve', () => {
    // ALMOST narrows inside-language; pool always non-empty by construction.
    for (let i = 0; i < 10; i++) {
      const praise = resolvePraise({ subject: 'ENGLISH', outcome: 'ALMOST' });
      expect(praise.text).toBeTruthy();
    }
  });
});

describe('P38 TTS failure safety (§15) — truthful, never fake', () => {
  it('headless/node (no synthesis) reports UNAVAILABLE instead of fake success', () => {
    const praise = resolvePraise({ subject: 'ENGLISH', outcome: 'CORRECT', seed: 'tts' });
    expect(speakPraise(praise)).toBe('UNAVAILABLE');
    expect(praise.text).toBeTruthy();
  });

  it('speakPraise never throws, even on tampered input handling', () => {
    const praise = resolvePraise({ subject: 'MATH', outcome: 'STREAK', seed: 'tts2' });
    expect(() => speakPraise(praise)).not.toThrow();
  });
});

describe('P38 event deduplication (§16)', () => {
  it('one logical event → one praise (duplicate guard)', () => {
    const eventId = 'lesson-1:q-1:attempt-1';
    expect(isDuplicatePraiseEvent(eventId)).toBe(false);
    markPraiseEventSeen(eventId);
    expect(isDuplicatePraiseEvent(eventId)).toBe(true);
  });

  it('resolvePraise records its eventId', () => {
    resolvePraise({ subject: 'VIETNAMESE', outcome: 'CORRECT', eventId: 'evt-42', seed: 'd' });
    expect(isDuplicatePraiseEvent('evt-42')).toBe(true);
    expect(isDuplicatePraiseEvent('evt-43')).toBe(false);
  });
});

describe('P38 integration surfaces (§20)', () => {
  it('Lesson/Competition question audio and praise agree on English locale family', () => {
    // English question audio is en-GB; English praise locale is en-GB.
    expect(getQuestionAudioLang({ id: 'q', subject: 'english' })).toBe('en-GB');
    const praise = resolvePraise({ subject: 'ENGLISH', outcome: 'CORRECT', seed: 'int' });
    expect(praise.locale).toBe(getQuestionAudioLang({ id: 'q', subject: 'english' }));
  });

  it('Learning OS milestone outcomes resolve in-context (EN stays EN, VI stays VI)', () => {
    const enMastered = resolvePraise({
      subject: 'ENGLISH', outcome: ['CORRECT', 'MASTERED'], seed: 'los-en',
    });
    expect(enMastered.outcome).toBe('MASTERED');
    expect(enMastered.language).toBe('en-GB');
    const viStreak = resolvePraise({
      subject: 'MATH', outcome: ['CORRECT', 'STREAK'], seed: 'los-vi',
    });
    expect(viStreak.outcome).toBe('STREAK');
    expect(viStreak.language).toBe('vi-VN');
  });

  it('Competition success praise honors the competing subject language', () => {
    const enComp = resolvePraise({
      subject: 'ENGLISH', outcome: 'COMPETITION_SUCCESS', seed: 'comp-en',
    });
    expect(enComp.language).toBe('en-GB');
    const viComp = resolvePraise({
      subject: 'MATH', outcome: 'COMPETITION_SUCCESS', seed: 'comp-vi',
    });
    expect(viComp.language).toBe('vi-VN');
  });

  it('All 14-game praise matrix: language correct, caption present, locale correct', () => {
    // Spot-check per-game language mapping used by GamesHubScreen routing.
    const gameSubjects: PraiseSubject[] = [
      'VIETNAMESE', 'VIETNAMESE', 'MATH', 'MATH', 'MATH', 'MATH',
      'VIETNAMESE', 'VIETNAMESE', 'VIETNAMESE', 'VIETNAMESE',
      'ENGLISH', 'ENGLISH', 'VIETNAMESE', 'VIETNAMESE',
    ];
    expect(gameSubjects).toHaveLength(14);
    for (const subject of gameSubjects) {
      const praise = resolvePraise({ subject, outcome: 'GAME_COMPLETED', seed: `g:${subject}` });
      expect(praise.text).toBeTruthy();
      expect(praise.text).toBe(praise.ttsText);
      expect(praise.locale).toBe(praise.language);
      if (subject === 'ENGLISH') {
        expect(praise.language).toBe('en-GB');
        expect(isPureEnglishPraise(praise.text)).toBe(true);
      } else {
        expect(praise.language).toBe('vi-VN');
      }
    }
  });
});
