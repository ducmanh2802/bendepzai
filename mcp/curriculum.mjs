#!/usr/bin/env node
/**
 * MCP server: nội dung & chương trình của Kho Báu Tri Thức.
 *
 * Đọc cấu trúc bằng static scan, không import TypeScript: các module dữ liệu
 * dùng import không phần mở rộng (`from '../types'`) nên Node ESM không nạp được,
 * và thêm bundler chỉ để hỏi "có bao nhiêu câu hỏi" là không đáng. Vì vậy mọi
 * con số trả về đều kèm `method: 'static-scan'` và breakdown theo file — đủ để
 * ra quyết định, không giả vờ là số runtime.
 *
 * Riêng any shape liên quan đến đăng ký trò chơi thì khớp 100% với test trong
 * tests/t08-games-hub.test.ts và t14c-logic.test.ts (cùng một bất biến).
 */
import { startServer, obj, str, num, bool, en } from './lib/server.mjs';
import { readRegistration, diffLists, readSource, grepRepo, listFiles, clip } from './lib/repo.mjs';

const CURRICULUM_FILES = {
  'src/data/vietnameseCurriculum.ts': 'Tiếng Việt',
  'src/data/mathCurriculum.ts': 'Toán',
  'src/data/englishCurriculum.ts': 'Tiếng Anh',
  'src/data/lifeCurriculum.ts': 'Em & Cuộc sống',
  'src/data/readingContent.ts': 'Luyện đọc',
};

const SUB_PACKS = ['src/data/vietnamese', 'src/data/math', 'src/data/english'];

const QUESTION_TYPES = [
  'multiple-choice', 'true-false', 'fill-blank', 'image-choice', 'ordering',
  'drag-drop', 'matching', 'audio-choice', 'math-expression', 'reading-aloud',
  'dictation', 'word-build',
];

function tallyBy(file, regex) {
  const { text } = readSource(file, 900000);
  const counts = {};
  for (const m of text.matchAll(new RegExp(regex, 'g'))) counts[m[1]] = (counts[m[1]] || 0) + 1;
  return counts;
}

function countOf(file, regex) {
  const { text } = readSource(file, 900000);
  return (text.match(new RegExp(regex, 'g')) || []).length;
}

function registrationStatus(reg, id) {
  return {
    inCatalog: reg.catalog.ids.includes(id),
    inRegistry: reg.registry.ids.includes(id),
    inLaunchable: reg.policy.ids.includes(id),
    inQaTitles: !!reg.catalog.titles[id] && reg.qa.titles.includes(reg.catalog.titles[id]),
  };
}

startServer({
  name: 'kbt-curriculum',
  version: '1.0.0',
  instructions:
    'Tra cứu nội dung học: 31 trò chơi (catalog/registry/policy/QA), 4 môn, ngân hàng câu hỏi, skill taxonomy, quy tắc nội dung. ' +
    'Trước khi thêm trò chơi hãy gọi check_game_registration và game_conventions.',
  tools: [
    {
      name: 'list_games',
      description: 'Danh sách trò chơi trong GAMES_CATALOG, lọc theo category hoặc từ khóa.',
      inputSchema: obj({
        category: en('Nhóm trò chơi', ['viet', 'math', 'english', 'logic', 'fun', 'all']),
        search: str('Tìm trong title / id / skillId (không phân biệt hoa thường)'),
        limit: num('Số kết quả tối đa, mặc định 40', 40),
      }),
      handler({ category = 'all', search, limit = 40 }) {
        const reg = readRegistration();
        let rows = reg.catalog.entries;
        if (category && category !== 'all') rows = rows.filter((g) => g.category === category);
        if (search) {
          const q = String(search).toLowerCase();
          rows = rows.filter(
            (g) =>
              g.id.includes(q) ||
              (g.title || '').toLowerCase().includes(q) ||
              g.skillIds.some((s) => s.includes(q))
          );
        }
        return {
          total: reg.catalog.ids.length,
          returned: Math.min(rows.length, limit),
          method: 'static-scan',
          games: rows.slice(0, limit).map((g) => ({ ...g, ...registrationStatus(reg, g.id) })),
        };
      },
    },

    {
      name: 'get_game',
      description: 'Mọi thứ về một trò chơi: mục catalog, file data pack, component, trạng thái đăng ký 4 nơi.',
      inputSchema: obj({ game_id: str('Id trò chơi, vd "connect_dots"') }, ['game_id']),
      handler({ game_id }) {
        const reg = readRegistration();
        const entry = reg.catalog.entries.find((g) => g.id === game_id);
        const dataPack = `src/data/games/${game_id}.ts`;
        const componentCandidates = listFiles('src/components/games', { extension: '.tsx', limit: 200 });
        return {
          game_id,
          found: !!entry,
          catalogEntry: entry || null,
          registration: registrationStatus(reg, game_id),
          dataPack: {
            exists: listFiles('src/data/games', { extension: '.ts', limit: 200 }).includes(dataPack),
            path: dataPack,
            synopsis: listFiles('src/data/games', { extension: '.ts', limit: 200 }).includes(dataPack)
              ? clip(readSource(dataPack, 4000).text.split('\n').slice(0, 12).join('\n'), 700)
              : null,
          },
          component: componentCandidates.filter((f) => f.toLowerCase().includes(game_id.replace(/_(\w)/g, (_, c) => c.toUpperCase()))),
        };
      },
    },

    {
      name: 'check_game_registration',
      description:
        'Kiểm tra bất biến 4 danh sách đăng ký trò chơi (docs/SDLC.md §3.1). Không truyền game_id → soát toàn bộ và báo cáo lệch.',
      inputSchema: obj({ game_id: str('Id cụ thể cần kiểm tra (tuỳ chọn)') }),
      handler({ game_id }) {
        const reg = readRegistration();
        const counts = {
          catalog: reg.catalog.ids.length,
          registry: reg.registry.ids.length,
          launchable: reg.policy.ids.length,
          qaTitles: reg.qa.titles.length,
        };
        const catalogVsRegistry = diffLists(reg.catalog.ids, reg.registry.ids);
        const catalogVsPolicy = diffLists(reg.catalog.ids, reg.policy.ids);
        const titleProblems = reg.catalog.entries
          .filter((g) => !reg.qa.titles.includes(g.title))
          .map((g) => `${g.id}: title "${g.title}" không có trong qa/games.mjs GAME_TITLES`);

        const ok =
          catalogVsRegistry.onlyInA.length === 0 &&
          catalogVsRegistry.onlyInB.length === 0 &&
          catalogVsPolicy.onlyInA.length === 0 &&
          catalogVsPolicy.onlyInB.length === 0 &&
          titleProblems.length === 0 &&
          reg.problems.length === 0;

        return {
          ok,
          counts,
          parseProblems: reg.problems,
          catalogOnly_vs_registry: catalogVsRegistry,
          catalogOnly_vs_launchable: catalogVsPolicy,
          qaTitleProblems: titleProblems,
          single: game_id ? { game_id, ...registrationStatus(reg, game_id) } : undefined,
        };
      },
    },

    {
      name: 'curriculum_overview',
      description: 'Đếm chủ đề/bài/câu hỏi theo từng file curriculum (static scan, có breakdown theo loại câu hỏi và độ khó).',
      inputSchema: obj({ include_types: bool('Kèm biểu đồ loại câu hỏi + độ khó', true) }),
      handler({ include_types = true }) {
        const perFile = {};
        for (const [file, subject] of Object.entries(CURRICULUM_FILES)) {
          try {
            perFile[subject] = {
              file,
              topics: countOf(file, /\biconEmoji:/g),
              lessons: countOf(file, /\bxpReward:/g),
              questions: countOf(file, /\bskillId:\s*'/g),
            };
          } catch (e) {
            perFile[subject] = { file, error: e.message };
          }
        }
        const subPacks = {};
        for (const dir of SUB_PACKS) {
          subPacks[dir] = listFiles(dir, { extension: '.ts', limit: 60 }).map((f) => ({
            file: f,
            questions: countOf(f, /\bskillId:\s*'/g),
          }));
        }
        const types = include_types
          ? Object.fromEntries(
              Object.entries(tallyBy('src/data/vietnameseCurriculum.ts', "type: '([a-z-]+)'")).map(([k, v]) => [k, v])
            )
          : undefined;
        return {
          method: 'static-scan',
          note:
            'iconEmoji: ≈ 1 chủ đề, xpReward: ≈ 1 bài, skillId: ≈ 1 câu hỏi. Không phải số runtime; muốn chắc thì chạy unit test. ' +
            'File sub-pack báo 0 thường là câu hỏi sinh bằng factory (không literal trong nguồn).',
          perFile,
          subPacks,
          questionTypesSample: types,
        };
      },
    },

    {
      name: 'list_skills',
      description: 'Skill id được trò chơi dùng, kèm số lượt xuất hiện trong curriculum để biết skill nào đang mỏng.',
      inputSchema: obj({ limit: num('Số skill tối đa, mặc định 60', 60) }),
      handler({ limit = 60 }) {
        const reg = readRegistration();
        const byGame = {};
        for (const g of reg.catalog.entries) for (const s of g.skillIds) (byGame[s] ||= []).push(g.id);

        let curriculumCounts = {};
        for (const file of Object.keys(CURRICULUM_FILES)) {
          try {
            const t = tallyBy(file, "skillId: '([a-zA-Z0-9_]+)'");
            for (const [k, v] of Object.entries(t)) curriculumCounts[k] = (curriculumCounts[k] || 0) + v;
          } catch {
            /* file không đọc được thì bỏ qua, vẫn trả phần trò chơi */
          }
        }
        const skills = Object.keys(byGame)
          .map((s) => ({ skill: s, games: byGame[s], curriculumQuestions: curriculumCounts[s] ?? 0 }))
          .sort((a, b) => a.curriculumQuestions - b.curriculumQuestions);

        return {
          method: 'static-scan',
          distinctSkills: skills.length,
          thinnestFirst: skills.slice(0, limit),
        };
      },
    },

    {
      name: 'search_content',
      description:
        'Tìm chuỗi trong nội dung học (prompt, tên bài, tiêu đề). Trả file:line + dòng chứa kết quả — dùng để soát trùng câu, soát từ cấm.',
      inputSchema: obj({
        query: str('Chuỗi hoặc regex, ví dụ "con cá" hoặc "Chữ cái nào"'),
        dir: str('Thư mục giới hạn tìm, mặc định "src/data"', 'src/data'),
        regex: bool('Coi query là regular expression (mặc định: escape toàn bộ)', false),
        limit: num('Số kết quả tối đa, mặc định 25', 25),
      }, ['query']),
      handler({ query, dir = 'src/data', regex = false, limit = 25 }) {
        if (!query) throw new Error('Thiếu query');
        const pattern = regex ? String(query) : String(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const { hits, truncated } = grepRepo(pattern, { dir, limit, flags: 'gi' });
        return { query, dir, matches: hits.length, truncated, hits };
      },
    },

    {
      name: 'content_rules',
      description: 'Quy tắc viết nội dung: phần đầu docs/CONTENT_GUIDE.md + danh sách từ cấm trong src/data/contentSafety.ts.',
      inputSchema: obj({ guide_lines: num('Số dòng CONTENT_GUIDE.md lấy ở đầu file, mặc định 60', 60) }),
      async handler({ guide_lines = 60 }) {
        let guide = '';
        try {
          guide = clip(readSource('docs/CONTENT_GUIDE.md', 60000).text.split('\n').slice(0, guide_lines).join('\n'), 5000);
        } catch (e) {
          guide = '(không đọc được docs/CONTENT_GUIDE.md: ' + e.message + ')';
        }
        let safety = null;
        try {
          const { BANNED_WORDS, ALLOWED_PHRASES } = await import('../src/data/contentSafety.ts');
          safety = {
            bannedWords: BANNED_WORDS,
            allowedPhraseCount: Array.isArray(ALLOWED_PHRASES) ? ALLOWED_PHRASES.length : null,
            method: 'imported',
          };
        } catch (e) {
          safety = { method: 'static-scan', error: String(e.message).split('\n')[0] };
        }
        return { contentGuideHead: guide, contentSafety: safety };
      },
    },

    {
      name: 'game_conventions',
      description:
        'Khuôn mẫu khi thêm trò chơi: chính sách 6 bậc (GAME_LEVEL_POLICY), số vòng mỗi bậc, bất biến đăng ký, ví dụ builder deterministic.',
      inputSchema: obj({}),
      handler() {
        const { text: levels } = readSource('src/data/gameLevels.ts');
        const tiersBlock = levels.match(/TIERS:\s*\[[\s\S]*?\n {2}\]/);
        const rounds = levels.match(/ROUNDS_PER_TIER[^\n]*/g) || [];
        return {
          registrationInvariant: [
            'src/data/gamesCatalog.ts → GAMES_CATALOG (chỉ dữ liệu, không import component)',
            'src/components/games/registry.ts → GAME_REGISTRY (lazy, .then(m => ({default: m.XGame})))',
            'src/config/policy.ts → LAUNCHABLE_GAME_IDS',
            'qa/games.mjs → GAME_TITLES (khớp chính xác trường title)',
          ],
          builderRules: [
            'Chữ ký: buildXRounds(tier: number, seed = 0) → Round[]',
            'Deterministic: seededRng(KHÁI_QUÁT + tier*P + seed*Q), shuffleSeeded, pickDistinct — cấm Math.random/Date.now',
            'clampTier để chặn tier ngoài 1..6; số vòng lấy từ defaultRoundsPerTier()',
          ],
          componentRules: [
            'useGameStage({ gameId, ... }) + <GameModalWrapper> bọc stage; keyed by round.id để reset state mỗi vòng',
            'Báo điểm qua useGameFeedback: reportCorrect/reportWrong + wrongAttempts + showCorrectAnswer',
            'Nút bấm có data-testid để probe QA bấm được; text ≥ font lớn, chạm 1 bước',
          ],
          tierPolicy: clip(tiersBlock ? tiersBlock[0] : '(không parse được TIERS)', 3000),
          roundsPerTier: rounds.slice(0, 6),
          exampleFiles: ['src/data/games/shadow_match.ts', 'src/components/games/ShadowMatchGame.tsx', 'tests/t21-fun-games.test.ts'],
        };
      },
    },
  ],
});
