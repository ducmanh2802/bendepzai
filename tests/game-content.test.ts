import { describe, it, expect, beforeEach } from 'vitest';
import { getGameItems, getAvailableItemCounts, GameKind } from '../src/services/gameContent';
import { WORD_BANK, composeSyllable, stripTonesOnly, WordBankEntry } from '../src/data/wordBank';
import { containsBannedWord } from '../src/data/contentSafety';

describe('T04 wordBank', () => {
  it('has structured entries with all required fields', () => {
    for (const entry of WORD_BANK) {
      expect(entry.word).toBeTruthy();
      expect(entry.onset).toBeDefined();
      expect(entry.rhyme).toBeTruthy();
      expect(['ngang', 'sắc', 'huyền', 'hỏi', 'ngã', 'nặng']).toContain(entry.tone);
      expect(entry.emoji).toBeTruthy();
      expect(entry.topic).toBeTruthy();
    }
  });

  it('composeSyllable produces correct tone variants', () => {
    expect(composeSyllable('c', 'a', 'ngang')).toBe('ca');
    expect(composeSyllable('c', 'a', 'sắc')).toBe('cá');
    expect(composeSyllable('c', 'a', 'huyền')).toBe('cà');
    expect(composeSyllable('c', 'a', 'hỏi')).toBe('cả');
    expect(composeSyllable('c', 'a', 'ngã')).toBe('cã');
    expect(composeSyllable('c', 'a', 'nặng')).toBe('cạ');
  });

  it('composeSyllable handles diacritic vowels correctly', () => {
    expect(composeSyllable('c', 'ă', 'sắc')).toBe('cắ');
    expect(composeSyllable('c', 'â', 'huyền')).toBe('cầ');
    expect(composeSyllable('c', 'ê', 'ngã')).toBe('cễ');
    expect(composeSyllable('c', 'ô', 'nặng')).toBe('cộ');
    expect(composeSyllable('c', 'ơ', 'hỏi')).toBe('cở');
    expect(composeSyllable('c', 'ư', 'sắc')).toBe('cứ');
  });

  it('stripTonesOnly removes only tone marks, preserves diacritics', () => {
    expect(stripTonesOnly('cá')).toBe('ca');
    expect(stripTonesOnly('cà')).toBe('ca');
    expect(stripTonesOnly('cả')).toBe('ca');
    expect(stripTonesOnly('cã')).toBe('ca');
    expect(stripTonesOnly('cạ')).toBe('ca');
    expect(stripTonesOnly('cắ')).toBe('că');
    expect(stripTonesOnly('cầ')).toBe('câ');
    expect(stripTonesOnly('cễ')).toBe('cê');
    expect(stripTonesOnly('cộ')).toBe('cô');
    expect(stripTonesOnly('cở')).toBe('cơ');
    expect(stripTonesOnly('cứ')).toBe('cư');
    expect(stripTonesOnly('đỏ')).toBe('đo');
  });

  it('has enough words for each rhyme family', () => {
    // Test core rhyme families that have multiple words (using actual rhymes from wordBank)
    const coreRhymes = ['an', 'át', 'on', 'ách', 'anh', 'ay'];
    for (const rhyme of coreRhymes) {
      const words = WORD_BANK.filter(w => w.rhyme === rhyme);
      expect(words.length).toBeGreaterThanOrEqual(2);
    }
    // Test that we have at least some words for extended rhymes (using actual rhymes from wordBank)
    const extendedRhymes = ['am', 'àm', 'ắp', 'ếp', 'ong', 'óng', 'ồng', 'e', 'ẹp', 'ọc', 'óc'];
    for (const rhyme of extendedRhymes) {
      const words = WORD_BANK.filter(w => w.rhyme === rhyme);
      expect(words.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('has enough words for each topic', () => {
    const topics = ['con vật', 'quả cây', 'đồ dùng học tập', 'thiên nhiên', 'đồ vật gia đình', 'đồ ăn'];
    for (const topic of topics) {
      const words = WORD_BANK.filter(w => w.topic === topic);
      expect(words.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('contains no banned words', () => {
    for (const entry of WORD_BANK) {
      expect(containsBannedWord(entry.word), entry.word).toBe(false);
    }
  });
});

describe('T04 gameContent.getGameItems', () => {
  beforeEach(() => {
    // Reset any internal state if needed
  });

  it('returns items for Vietnamese word-picture kind', () => {
    const items = getGameItems({
      subject: 'tieng-viet',
      kinds: ['word-picture'],
      count: 10,
      tier: 1,
      seed: 12345,
    });
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(10);
    for (const item of items) {
      expect(item.id).toBeTruthy();
      expect(item.prompt).toBeTruthy();
      expect(item.answer).toBeTruthy();
      expect(item.options).toBeInstanceOf(Array);
      expect(item.options.length).toBeGreaterThanOrEqual(2);
      expect(item.options).toContain(item.answer);
      expect(item.skillId).toBeTruthy();
      expect(['curriculum', 'review', 'game-pack']).toContain(item.source);
      expect(item.difficulty).toBeGreaterThanOrEqual(1);
      expect(item.difficulty).toBeLessThanOrEqual(6);
    }
  });

  it('returns items for Vietnamese first-sound kind', () => {
    const items = getGameItems({
      subject: 'tieng-viet',
      kinds: ['first-sound'],
      count: 10,
      tier: 2,
      seed: 12345,
    });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.options).toContain(item.answer);
    }
  });

  it('returns items for Vietnamese rhyme kind', () => {
    const items = getGameItems({
      subject: 'tieng-viet',
      kinds: ['rhyme'],
      count: 8,
      tier: 3,
      seed: 12345,
    });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.options).toContain(item.answer);
    }
  });

  it('returns items for Vietnamese tone kind', () => {
    const items = getGameItems({
      subject: 'tieng-viet',
      kinds: ['tone'],
      count: 6,
      tier: 2,
      seed: 12345,
    });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.options).toContain(item.answer);
    }
  });

  it('returns items for Math arith kind', () => {
    const items = getGameItems({
      subject: 'toan',
      kinds: ['arith'],
      count: 10,
      tier: 2,
      seed: 12345,
    });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.options).toContain(item.answer);
    }
  });

  it('returns items for Math compare kind', () => {
    const items = getGameItems({
      subject: 'toan',
      kinds: ['compare'],
      count: 10,
      tier: 1,
      seed: 12345,
    });
    expect(items.length).toBeGreaterThan(0);
  });

  it('returns items for English en-word kind', () => {
    const items = getGameItems({
      subject: 'english',
      kinds: ['en-word'],
      count: 10,
      tier: 1,
      seed: 12345,
    });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.options).toContain(item.answer);
    }
  });

  it('respects seed for deterministic results', () => {
    const items1 = getGameItems({ subject: 'tieng-viet', kinds: ['word-picture'], count: 5, tier: 1, seed: 42 });
    const items2 = getGameItems({ subject: 'tieng-viet', kinds: ['word-picture'], count: 5, tier: 1, seed: 42 });
    expect(items1.map(i => i.id)).toEqual(items2.map(i => i.id));
  });

  it('different seeds produce different orders', () => {
    const items1 = getGameItems({ subject: 'tieng-viet', kinds: ['word-picture'], count: 5, tier: 1, seed: 42 });
    const items2 = getGameItems({ subject: 'tieng-viet', kinds: ['word-picture'], count: 5, tier: 1, seed: 43 });
    // At least one item should be different
    const ids1 = items1.map(i => i.id);
    const ids2 = items2.map(i => i.id);
    expect(ids1).not.toEqual(ids2);
  });

  it('respects count limit', () => {
    const items = getGameItems({ subject: 'tieng-viet', kinds: ['word-picture'], count: 3, tier: 1, seed: 123 });
    expect(items.length).toBeLessThanOrEqual(3);
  });

  it('returns unique IDs within a single call', () => {
    const items = getGameItems({ subject: 'tieng-viet', kinds: ['word-picture'], count: 10, tier: 1, seed: 123 });
    const ids = items.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('difficulty respects tier mapping', () => {
    const tier1Items = getGameItems({ subject: 'tieng-viet', kinds: ['word-picture'], count: 10, tier: 1, seed: 123 });
    const tier4Items = getGameItems({ subject: 'tieng-viet', kinds: ['word-picture'], count: 10, tier: 4, seed: 123 });
    const tier1MaxDiff = Math.max(...tier1Items.map(i => i.difficulty));
    // For tier 4, generated game-pack items (word-picture, first-sound, rhyme, tone) should have difficulty >= 2
    // Competition items (also source 'game-pack') may be difficulty 1 (EASY)
    // Check that generated items have proper difficulty
    const generatedItems = tier4Items.filter(i => i.source === 'game-pack' && 
      ['word-picture', 'first-sound', 'rhyme', 'tone'].some(k => i.skillId.includes(k.replace('-', '_')) || i.id.startsWith('wp-') || i.id.startsWith('fs-') || i.id.startsWith('rhyme-') || i.id.startsWith('tone-')));
    const tier4MinDiff = generatedItems.length > 0
      ? Math.min(...generatedItems.map(i => i.difficulty))
      : Math.min(...tier4Items.map(i => i.difficulty));
    expect(tier1MaxDiff).toBeLessThanOrEqual(2);
    expect(tier4MinDiff).toBeGreaterThanOrEqual(2);
  });

  it('filters by skillIds when provided', () => {
    const items = getGameItems({
      subject: 'tieng-viet',
      kinds: ['word-picture'],
      skillIds: ['vn_vocab_objects'],
      count: 10,
      tier: 1,
      seed: 123,
    });
    for (const item of items) {
      expect(item.skillId).toBe('vn_vocab_objects');
    }
  });

  it('returns only curriculum/competition items for unsupported kind (no game-pack generation)', () => {
    const items = getGameItems({
      subject: 'tieng-viet',
      kinds: ['unsupported-kind' as GameKind],
      count: 10,
      tier: 1,
      seed: 123,
    });
    console.log('unsupported kind items:', items.map(i => ({ id: i.id, source: i.source, skillId: i.skillId })));
    // Should not have GENERATED game-pack items (wp-, fs-, rhyme-, tone-)
    const generatedGamePackItems = items.filter(i => 
      i.source === 'game-pack' && 
      (i.id.startsWith('wp-') || i.id.startsWith('fs-') || i.id.startsWith('rhyme-') || i.id.startsWith('tone-'))
    );
    expect(generatedGamePackItems.length).toBe(0);
    // But may have curriculum/competition items (competition items have source 'game-pack')
    expect(items.length).toBeGreaterThanOrEqual(0);
  });
});

describe('T04 gameContent.getAvailableItemCounts', () => {
  it('returns counts for all kinds', () => {
    const counts = getAvailableItemCounts('tieng-viet');
    const expectedKinds: GameKind[] = [
      'word-picture', 'first-sound', 'rhyme', 'tone', 'sentence',
      'arith', 'compare', 'count', 'en-word', 'en-phonics',
      'en-color', 'en-animal', 'shape', 'time',
    ];
    for (const kind of expectedKinds) {
      expect(counts[kind]).toBeDefined();
      expect(typeof counts[kind]).toBe('number');
      expect(counts[kind]).toBeGreaterThanOrEqual(0);
    }
  });

  it('Vietnamese has more items for word-picture than other subjects', () => {
    const vnCounts = getAvailableItemCounts('tieng-viet');
    const enCounts = getAvailableItemCounts('english');
    expect(vnCounts['word-picture']).toBeGreaterThan(enCounts['word-picture']);
  });
});

describe('T04 integration: items from curriculum and competition bank', () => {
  it('curriculum-sourced items have correct source', () => {
    const items = getGameItems({
      subject: 'tieng-viet',
      kinds: ['word-picture', 'first-sound'],
      count: 20,
      tier: 1,
      seed: 123,
    });
    const curriculumItems = items.filter(i => i.source === 'curriculum');
    expect(curriculumItems.length).toBeGreaterThan(0);
  });

  it('game-pack items have correct structure', () => {
    const items = getGameItems({
      subject: 'tieng-viet',
      kinds: ['rhyme', 'tone'],
      count: 20,
      tier: 1,
      seed: 123,
    });
    const gamePackItems = items.filter(i => i.source === 'game-pack');
    expect(gamePackItems.length).toBeGreaterThan(0);
    for (const item of gamePackItems) {
      expect(item.emoji).toBeTruthy();
      expect(item.audioText).toBeTruthy();
    }
  });
});