#!/usr/bin/env node
/**
 * MCP server: dựng bộ file cho một trò chơi mới theo khuôn mẫu đã kiểm chứng.
 *
 * Khuôn lấy từ shadow_match (data pack deterministic + component dùng
 * useGameStage/GameModalWrapper + test parity) vì bộ đó đang xanh trên main.
 *
 * An toàn: mặc định dry-run. Ghi file chỉ khi write=true, chỉ tạo file mới,
 * không ghi đè, và chuỗi người dùng đưa vào bị từ chối nếu có ký tự phá mã nguồn
 * (' \\ ` ${) — tool sinh code thì không được phép biến input thành code.
 */
import fs from 'node:fs';
import path from 'node:path';
import { startServer, obj, str, num, bool, en, arr } from './lib/server.mjs';
import { run, npmRun, readRegistration, listFiles, clip, stripAnsi, resolveInsideRepo } from './lib/repo.mjs';

const ID_RE = /^[a-z][a-z0-9_]{2,40}$/;
const UNSAFE_RE = /['"`\\]|\$\{/;

const toPascal = (id) => id.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
const toUpperConst = (id) => id.toUpperCase();
const toKebab = (id) => id.replace(/_/g, '-');

function assertSafeText(value, label) {
  const s = String(value ?? '');
  if (!s.trim()) throw new Error(`${label} không được rỗng`);
  if (UNSAFE_RE.test(s)) {
    throw new Error(`${label} chứa ký tự không an toàn cho code sinh ra (', ", \`, \\, \${). Hãy viết thuần: "${s.replace(UNSAFE_RE, '')}"`);
  }
  return s.trim();
}

function normalisePool(items) {
  if (!Array.isArray(items) || items.length < 6) {
    throw new Error('Cần pool ít nhất 6 mặt (id, label, emoji) để còn 3 phương án gây nhiễu.');
  }
  const seen = new Set();
  return items.map((raw, i) => {
    const id = assertSafeText(raw?.id || `item-${i + 1}`, `pool[${i}].id`).replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
    if (seen.has(id)) throw new Error(`pool[${i}].id trùng: ${id}`);
    seen.add(id);
    return {
      id,
      label: assertSafeText(raw?.label, `pool[${i}].label`),
      emoji: assertSafeText(raw?.emoji || '⭐', `pool[${i}].emoji`),
    };
  });
}

function nextTestNumber() {
  const nums = listFiles('tests', { extension: '.test.ts', limit: 300 })
    .map((f) => (f.match(/\/t(\d+)/) || [])[1])
    .filter(Boolean)
    .map(Number);
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

/* ---------------- templates ---------------- */

function dataPackSource({ gameId, title, pool, promptTemplate, seedBase }) {
  const P = toPascal(gameId);
  const C = toUpperConst(gameId);
  return `/**
 * ${title} — dữ liệu trò chơi, TypeScript thuần, deterministic.
 *
 * Mỗi vòng: một câu hỏi sinh từ pool + 4 phương án (có đáp án).
 * Cùng (tier, seed) phải cho ra đúng một bộ vòng — xem docs/SDLC.md §3.2.
 */

import { defaultRoundsPerTier, seededRng, shuffleSeeded } from '../gameLevels';

export interface ${P}Item {
  id: string;
  label: string;
  emoji: string;
}

export const ${C}_POOL: ${P}Item[] = [
${pool.map((p) => `  { id: '${p.id}', label: '${p.label}', emoji: '${p.emoji}' },`).join('\n')}
];

export interface ${P}Round {
  id: string;
  prompt: string;
  answer: ${P}Item;
  /** 4 phương án đã xáo, luôn chứa đáp án. */
  options: ${P}Item[];
}

const OPTION_COUNT = 4;
const PROMPT_TEMPLATE = '${promptTemplate}';

export function ${P}PromptFor(item: ${P}Item): string {
  return PROMPT_TEMPLATE.replace('{label}', item.label);
}

export function build${P}Rounds(tier: number, seed = 0): ${P}Round[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const count = defaultRoundsPerTier()[safeTier - 1];
  const rng = seededRng(${seedBase} + safeTier * 131 + Math.max(0, Math.round(seed)) * 1009);

  const deck = shuffleSeeded(${C}_POOL, rng);
  const rounds: ${P}Round[] = [];

  for (let i = 0; i < count; i++) {
    const answer = deck[i % deck.length];
    const distractors = shuffleSeeded(
      ${C}_POOL.filter((item) => item.id !== answer.id),
      rng
    ).slice(0, OPTION_COUNT - 1);

    rounds.push({
      id: '${gameId}-' + safeTier + '-' + i,
      prompt: ${P}PromptFor(answer),
      answer,
      options: shuffleSeeded([answer, ...distractors], rng),
    });
  }

  return rounds;
}
`;
}

function componentSource({ gameId, title, subtitle, description, emoji, praiseSubject }) {
  const P = toPascal(gameId);
  return `import React, { useMemo, useState } from 'react';
import { GameModalWrapper, useGameFeedback } from './GameModalWrapper';
import { sound } from '../../services/sound';
import { useGameStage, type GameStage } from '../../hooks/useGameStage';
import { defaultRoundsPerTier, getTierMeta } from '../../data/gameLevels';
import { build${P}Rounds, type ${P}Round } from '../../data/games/${gameId}';

const ROUNDS_PER_TIER = defaultRoundsPerTier();

export const ${P}Game: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const stage = useGameStage({ gameId: '${gameId}', roundsPerTier: ROUNDS_PER_TIER, advanceDelayMs: 1100 });
  const rounds = useMemo(() => build${P}Rounds(stage.tier, stage.nonce), [stage.tier, stage.nonce]);
  const current = rounds[stage.roundIdx];

  return (
    <GameModalWrapper
      gameId="${gameId}"
      title="${title}"
      subtitle="${subtitle}"
      mascotEmoji="${emoji}"
      score={stage.score}
      isGameOver={stage.isGameOver}
      phase={stage.phase}
      tier={stage.tier}
      tierMeta={stage.tierMeta}
      tierCount={stage.tierCount}
      roundNumber={stage.roundNumber}
      roundTotal={stage.roundTotal}
      starsEarned={stage.starsEarned}
      nextTierMeta={stage.tier + 1 <= stage.tierCount ? getTierMeta(stage.tier + 1) : undefined}
      onNextTier={stage.startNextTier}
      earnedXp={stage.xpEarned}
      earnedStars={stage.starsEarned}
      prevBestStars={stage.prevBestStars}
      onRestart={stage.restartGame}
      onExit={onExit}
      instructions="${description}"
      audioInstruction="${description}"
      praiseSubject="${praiseSubject}"
    >
      {current && <${P}Stage key={current.id} stage={stage} round={current} />}
    </GameModalWrapper>
  );
};

const ${P}Stage: React.FC<{ stage: GameStage; round: ${P}Round }> = ({ stage, round }) => {
  const { reportCorrect, reportWrong, showCorrectAnswer } = useGameFeedback();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const solved = pickedId === round.answer.id;

  const handlePick = (id: string) => {
    if (stage.locked || solved) return;
    const item = round.options.find((opt) => opt.id === id);
    if (!item) return;

    if (id === round.answer.id) {
      setPickedId(id);
      sound.playCorrect();
      window.setTimeout(() => sound.speak(\`Chính xác! \${item.label}!\`, 'vi-VN'), 250);
      reportCorrect(item.label);
      stage.submitCorrect();
    } else {
      sound.playWrong();
      setShakeKey((k) => k + 1);
      reportWrong(item.label, round.answer.label);
      stage.submitWrong();
    }
  };

  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-3 select-none">
      <div className="rounded-3xl bg-gradient-to-br from-sky-100 to-cyan-200 border-4 border-sky-300 px-5 py-4 text-center">
        <p className="text-lg md:text-2xl font-black text-slate-800">{round.prompt}</p>
      </div>

      <div key={shakeKey} className={\`grid grid-cols-2 gap-2 md:gap-3 w-full max-w-[440px] \${shakeKey > 0 ? 'animate-shake' : ''}\`}>
        {round.options.map((opt) => {
          const highlight = solved && opt.id === round.answer.id;
          const reveal = showCorrectAnswer && opt.id === round.answer.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handlePick(opt.id)}
              disabled={stage.locked}
              data-testid="${gameId}-option"
              aria-label={opt.label}
              className={\`min-h-[64px] md:min-h-[74px] rounded-2xl border-2 font-black text-base md:text-lg flex items-center justify-center gap-2 transition-all active:scale-95 \${
                highlight || reveal
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 text-emerald-900'
                  : 'bg-white border-sky-300 hover:border-sky-500 hover:scale-[1.03] text-slate-800 shadow-md'
              }\`}
            >
              <span className="text-3xl md:text-4xl" aria-hidden="true">{opt.emoji}</span>
              <span className="truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs md:text-sm font-bold text-slate-500 text-center">
        ${emoji} Màn {stage.tier}/6 · Câu {stage.roundNumber}/{stage.roundTotal}
      </p>
    </div>
  );
};
`;
}

function testSource({ gameId, title, poolSize }) {
  const P = toPascal(gameId);
  const C = toUpperConst(gameId);
  return `import { describe, it, expect } from 'vitest';
import { defaultRoundsPerTier } from '../src/data/gameLevels';
import { ${C}_POOL, build${P}Rounds } from '../src/data/games/${gameId}';
import { GAMES_CATALOG } from '../src/data/gamesCatalog';
import { GAME_REGISTRY } from '../src/components/games/registry';
import { LAUNCHABLE_GAME_IDS } from '../src/config/policy';

const TIERS = [1, 2, 3, 4, 5, 6];

describe('${title} — data', () => {
  it('pool có id và nhãn duy nhất', () => {
    const ids = ${C}_POOL.map((i) => i.id);
    expect(ids.length).toBeGreaterThanOrEqual(${poolSize});
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of ${C}_POOL) {
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(item.emoji.trim().length).toBeGreaterThan(0);
    }
  });

  it('mỗi vòng có 4 phương án duy nhất và chứa đáp án', () => {
    for (const tier of TIERS) {
      for (const round of build${P}Rounds(tier, 0)) {
        expect(round.options).toHaveLength(4);
        expect(new Set(round.options.map((o) => o.id)).size).toBe(4);
        expect(round.options.map((o) => o.id)).toContain(round.answer.id);
        expect(round.prompt).toContain(round.answer.label);
      }
    }
  });

  it('deterministic theo (tier, seed) và xáo lại khi đổi seed', () => {
    const a = build${P}Rounds(3, 1).map((r) => r.options.map((o) => o.id).join('')).join('|');
    const b = build${P}Rounds(3, 1).map((r) => r.options.map((o) => o.id).join('')).join('|');
    expect(a).toBe(b);

    let differs = false;
    for (let seed = 2; seed < 12 && !differs; seed++) {
      const c = build${P}Rounds(3, seed).map((r) => r.options.map((o) => o.id).join('')).join('|');
      if (c !== a) differs = true;
    }
    expect(differs).toBe(true);
  });

  it('số vòng mỗi bậc khớp defaultRoundsPerTier', () => {
    const expected = defaultRoundsPerTier();
    TIERS.forEach((tier, i) => expect(build${P}Rounds(tier, 0).length).toBe(expected[i]));
  });

  it('đăng ký đủ 4 nơi', () => {
    const entry = GAMES_CATALOG.find((g) => g.id === '${gameId}');
    expect(entry).toBeTruthy();
    expect(GAME_REGISTRY['${gameId}']).toBeTruthy();
    expect(LAUNCHABLE_GAME_IDS).toContain('${gameId}');
    expect(entry!.title).toBeTruthy();
  });
});
`;
}

function catalogEntrySource({ gameId, title, category, categoryLabel, emoji, mascot, description, skillTag, color, skillIds }) {
  return `  {
    id: '${gameId}',
    title: '${title}',
    category: '${category}',
    categoryLabel: '${categoryLabel}',
    emoji: '${emoji}',
    mascot: '${mascot}',
    description: '${description}',
    skillTag: '${skillTag}',
    color: '${color}',
    skillIds: [${skillIds.map((s) => `'${s}'`).join(', ')}],
    isNew: true,
  },
`;
}

/* ---------------- registration patching ---------------- */

function patchInPlace(file, mutator, { marker, markerLabel }) {
  const abs = resolveInsideRepo(file);
  const before = fs.readFileSync(abs, 'utf8');
  if (marker && before.includes(marker)) return { file, changed: false, reason: `đã có ${markerLabel}` };
  const after = mutator(before);
  if (after === null) return { file, changed: false, reason: 'không tìm thấy khối chèn an toàn — sửa tay' };
  if (after === before) return { file, changed: false, reason: 'không có gì thay đổi' };
  fs.writeFileSync(abs, after, 'utf8');
  return { file, changed: true };
}

startServer({
  name: 'kbt-game-scaffold',
  version: '1.0.0',
  instructions:
    'Sinh bộ file trò chơi mới theo khuôn shadow_match. LUÔN gọi plan_game trước để chốt thiết kế với người dùng, ' +
    'rồi scaffold_game (dry-run) cho xem code, rồi mới write=true. Sau đó bắt buộc validate_game + npm run verify.',
  tools: [
    {
      name: 'plan_game',
      description: 'Bản thiết kế trò chơi mới theo khuôn dự án: file sẽ tạo, cơ chế 6 bậc, test cần viết, checklist đăng ký. Không ghi file nào.',
      inputSchema: obj({
        idea: str('Mô tả ý tưởng bằng 1-2 câu, vd "bé nghe âm và chọn con vật"'),
        category: en('Nhóm trong Hub', ['viet', 'math', 'english', 'logic', 'fun']),
        skill_ids: arr('Skill id gắn cho trò chơi', { type: 'string' }),
      }, ['idea']),
      handler({ idea, category = 'fun', skill_ids = [] }) {
        const reg = readRegistration();
        const freeSlots = reg.catalog.entries.filter((g) => g.category === category).length;
        return {
          idea,
          suggestedFiles: {
            dataPack: 'src/data/games/<game_id>.ts',
            component: 'src/components/games/<PascalCase>Game.tsx',
            test: `tests/t${nextTestNumber()}-<slug>.test.ts`,
          },
          mechanism: [
            'Pool ≥ 6 mặt (id, label, emoji) → mỗi vòng 1 đáp án + 3 gây nhiễu',
            `Số vòng theo bậc: dùng defaultRoundsPerTier() = [5,6,6,7,8,8], clampTier 1..6`,
            'Seed formula: seededRng(<số nguyên riêng> + tier*131 + nonce*1009) — đừng trùng hằng số với game khác',
            'Tăng độ khó bằng cách thêm biến thể trên round (xoay/lật/ẩn nhãn) thay vì đổi luật',
          ],
          testsRequired: [
            'pool id/label duy nhất',
            '4 phương án duy nhất và chứa đáp án, prompt chứa label đáp án',
            'deterministic theo (tier, seed) + đổi seed là đổi đề',
            'số vòng mỗi bậc khớp defaultRoundsPerTier()',
            'parity đăng ký: catalog + registry + LAUNCHABLE_GAME_IDS',
          ],
          registrationChecklist: [
            'GAMES_CATALOG (title tiếng Việt ngắn, có emoji/mascot/color/skillIds)',
            'GAME_REGISTRY: lazy import, .then(m => ({ default: m.XGame }))',
            'LAUNCHABLE_GAME_IDS trong src/config/policy.ts',
            `GAME_TITLES trong qa/games.mjs — chính xác bằng title (${freeSlots} trò đang thuộc category "${category}")`,
          ],
          currentGameCount: reg.catalog.ids.length,
          nextStep: 'Gọi scaffold_game với game_id + pool để xem code (dry-run, chưa ghi file).',
        };
      },
    },

    {
      name: 'scaffold_game',
      description:
        'Sinh (và tuỳ chọn ghi) bộ file trò chơi mới: data pack + component + test. Mặc định dry-run, trả nguyên văn nội dung file.',
      inputSchema: obj({
        game_id: str('Id viết thường, snake_case, 3-40 ký tự, vd "animal_sound"'),
        title: str('Title tiếng Việt hiển thị trong Hub, vd "Nghe Tiếng Gì Đó"'),
        subtitle: str('Một dòng gợi ý ngắn dưới title'),
        description: str('Câu hướng dẫn cho bé (cũng dùng làm audio instruction)'),
        emoji: str('Emoji của thẻ trò chơi', '🎧'),
        mascot: str('Mascot, vd "🦊 Cáo Tinh Nhanh"', '🦊 Cáo Tinh Nhanh'),
        category: en('Nhóm trò chơi', ['viet', 'math', 'english', 'logic', 'fun']),
        category_label: str('Nhãn nhóm hiển thị, vd "Giải Trí"', 'Giải Trí'),
        color: str('Tailwind gradient, vd "from-sky-400 to-cyan-600"', 'from-sky-400 to-cyan-600'),
        skill_tag: str('Kỹ năng tóm tắt, vd "Lắng nghe & Quan sát"', 'Lắng nghe & Quan sát'),
        praise_subject: en('Ngôn ngữ lời khen của Gấu (PraiseSubject)', ['VIETNAMESE', 'MATH', 'ENGLISH']),
        skill_ids: arr('Skill id gắn cho trò chơi', { type: 'string' }),
        prompt_template: str('Câu hỏi mỗi vòng, {label} = nhãn đáp án', 'Con nào có tiếng kêu này?'),
        seed_base: num('Hằng số riêng của trò chơi trong seed formula (phải khác các game khác)', 17000),
        pool: arr('Mặt trong pool: {id,label,emoji} — cần ≥ 6', {
          type: 'object',
          properties: { id: { type: 'string' }, label: { type: 'string' }, emoji: { type: 'string' } },
          required: ['label', 'emoji'],
          additionalProperties: false,
        }),
        write: bool('GHI file vào repo (chỉ file mới, không ghi đè). Mặc định false = dry-run.', false),
        apply_registration: bool('Chèn luôn vào 4 danh sách đăng ký (cần write=true). Mặc định false.', false),
      }, ['game_id', 'title', 'pool']),
      handler({
        game_id, title, subtitle, description, emoji, mascot, category, category_label, color,
        skill_tag, praise_subject, skill_ids, prompt_template, seed_base, pool, write = false, apply_registration = false,
      }) {
        if (!ID_RE.test(String(game_id))) throw new Error('game_id phải khớp ^[a-z][a-z0-9_]{2,40}$');
        const reg = readRegistration();
        if (reg.catalog.ids.includes(game_id)) throw new Error(`game_id "${game_id}" đã tồn tại trong GAMES_CATALOG — hãy đặt tên khác.`);

        const testNumber = nextTestNumber();
        const testPath = `tests/t${testNumber}-${toKebab(game_id)}.test.ts`;

        const spec = {
          gameId: game_id,
          title: assertSafeText(title, 'title'),
          subtitle: assertSafeText(subtitle || description || title, 'subtitle'),
          description: assertSafeText(description || subtitle || title, 'description'),
          emoji: assertSafeText(emoji || '⭐', 'emoji'),
          mascot: assertSafeText(mascot || '🦊 Cáo Tinh Nhanh', 'mascot'),
          category: category || 'fun',
          categoryLabel: assertSafeText(category_label || 'Giải Trí', 'category_label'),
          color: assertSafeText(color || 'from-sky-400 to-cyan-600', 'color'),
          skillTag: assertSafeText(skill_tag || 'Tập trung', 'skill_tag'),
          praiseSubject: praise_subject || 'MATH',
          skillIds: (Array.isArray(skill_ids) && skill_ids.length ? skill_ids : ['visual_discrimination', 'memory']).map(
            (s) => assertSafeText(s, 'skill_id').replace(/[^a-z0-9_]/g, '')
          ),
          promptTemplate: assertSafeText(prompt_template || 'Chọn đáp án đúng: {label}', 'prompt_template'),
          seedBase: Math.round(Number(seed_base) || 17000),
          pool: normalisePool(pool),
        };

        const P = toPascal(spec.gameId);
        const files = {
          [`src/data/games/${spec.gameId}.ts`]: dataPackSource(spec),
          [`src/components/games/${P}Game.tsx`]: componentSource(spec),
          [testPath]: testSource({
            ...spec,
            poolSize: spec.pool.length,
          }),
        };

        const result = { dryRun: !write, files: {}, created: [], skipped: [], registrationPatches: [] };

        for (const [rel, content] of Object.entries(files)) {
          if (!write) {
            result.files[rel] = content;
            continue;
          }
          const abs = resolveInsideRepo(rel);
          if (fs.existsSync(abs)) {
            result.skipped.push({ file: rel, reason: 'file đã tồn tại — không ghi đè' });
            continue;
          }
          fs.mkdirSync(path.dirname(abs), { recursive: true });
          fs.writeFileSync(abs, content, 'utf8');
          result.created.push(rel);
        }

        if (write && apply_registration) {
          const entry = catalogEntrySource(spec);
          const registryLine = `  ${spec.gameId}: lazy(() => import('./${P}Game').then((m) => ({ default: m.${P}Game }))),`;

          result.registrationPatches.push(
            patchInPlace('src/data/gamesCatalog.ts', (src) => {
              const idx = src.lastIndexOf('\n];');
              if (idx === -1) return null;
              return src.slice(0, idx + 1) + entry + src.slice(idx + 1);
            }, { marker: `id: '${spec.gameId}'`, markerLabel: 'id trong GAMES_CATALOG' }),

            patchInPlace('src/components/games/registry.ts', (src) => {
              const idx = src.lastIndexOf('\n};');
              if (idx === -1) return null;
              return src.slice(0, idx + 1) + registryLine + '\n' + src.slice(idx + 1);
            }, { marker: `${spec.gameId}: lazy(`, markerLabel: 'GAME_REGISTRY' }),

            patchInPlace('src/config/policy.ts', (src) => {
              const re = /(LAUNCHABLE_GAME_IDS\s*=\s*\[[\s\S]*?)(\n\]\s*as const;)/;
              return re.test(src) ? src.replace(re, `$1\n  '${spec.gameId}',$2`) : null;
            }, { marker: `'${spec.gameId}'`, markerLabel: 'LAUNCHABLE_GAME_IDS' }),

            patchInPlace('qa/games.mjs', (src) => {
              const re = /(GAME_TITLES\s*=\s*\[[\s\S]*?)(\n\];)/;
              return re.test(src) ? src.replace(re, `$1  '${spec.title}',$2`) : null;
            }, { marker: `'${spec.title}'`, markerLabel: 'GAME_TITLES' })
          );
        } else if (write) {
          result.registrationPatches.push({
            note: 'Chưa đụng 4 danh sách đăng ký. Gọi lại với apply_registration=true, hoặc sửa tay theo plan_game.',
          });
        }

        // Nếu file test bị bỏ qua vì đã tồn tại thì chỉ đúng đường dẫn thật.
        const existingTest = listFiles('tests', { extension: '.test.ts', limit: 300 }).find((f) =>
          f.includes(toKebab(spec.gameId))
        );
        const activeTestPath = result.created.includes(testPath) ? testPath : existingTest || testPath;

        result.nextSteps = write
          ? [
              'npm run typecheck',
              `npx vitest run ${activeTestPath}`,
              'npm run verify',
              `npm run build && node qa/run-one.mjs qa/games.mjs  (title "${spec.title}" phải có trong GAME_TITLES)`,
              'Thêm mục [Unreleased] vào CHANGELOG.md',
            ]
          : ['Xem kỹ nội dung file, chỉnh pool/luật cho đúng ý bé, rồi gọi lại với write=true.'];
        return result;
      },
    },

    {
      name: 'validate_game',
      description:
        'Kiểm tra một trò chơi vừa thêm: bất biến đăng ký 4 nơi, typecheck, và test liên quan (hub + logic + test của game).',
      inputSchema: obj({
        game_id: str('Id trò chơi cần kiểm'),
        run_typecheck: bool('Chạy tsc --noEmit (~6s)', true),
        timeout_seconds: num('Trần thời gian cho mỗi lệnh, mặc định 240', 240),
      }, ['game_id']),
      async handler({ game_id, run_typecheck = true, timeout_seconds = 240 }) {
        const out = { game_id, registration: null, typecheck: null, tests: null };
        const reg = readRegistration();
        out.registration = {
          inCatalog: reg.catalog.ids.includes(game_id),
          inRegistry: reg.registry.ids.includes(game_id),
          inLaunchable: reg.policy.ids.includes(game_id),
          title: reg.catalog.titles[game_id] || null,
          inQaTitles: !!reg.catalog.titles[game_id] && reg.qa.titles.includes(reg.catalog.titles[game_id]),
          ok:
            reg.catalog.ids.includes(game_id) &&
            reg.registry.ids.includes(game_id) &&
            reg.policy.ids.includes(game_id) &&
            !!reg.catalog.titles[game_id] &&
            reg.qa.titles.includes(reg.catalog.titles[game_id]),
        };

        if (run_typecheck) {
          const t = await npmRun('typecheck', { timeoutMs: timeout_seconds * 1000 });
          out.typecheck = { ok: t.code === 0, exitCode: t.code, output: clip((t.err || t.out).trim(), 1500) };
        }

        const gameTest = listFiles('tests', { extension: '.test.ts', limit: 200 }).find((f) =>
          f.includes(toKebab(game_id))
        );
        const targets = ['tests/t08-games-hub.test.ts', 'tests/t14c-logic.test.ts'];
        if (gameTest) targets.push(gameTest);
        const v = await run(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', ...targets], {
          timeoutMs: timeout_seconds * 1000,
        });
        const lines = stripAnsi(v.out + '\n' + v.err).split('\n');
        out.tests = {
          ok: v.code === 0,
          exitCode: v.code,
          files: targets,
          summary: (lines.find((l) => /Tests\s+\d+/.test(l)) || '').trim() || null,
          output: clip(lines.filter((l) => /✓|✗|×|failed|Test Files|Tests\s/.test(l)).join('\n'), 2500),
        };
        out.allGreen = !!(out.registration.ok && (!run_typecheck || out.typecheck?.ok) && out.tests.ok);
        return out;
      },
    },
  ],
});
