#!/usr/bin/env node
/**
 * MCP server: đọc tiến độ của bé từ BẢN EXPORT cục bộ.
 *
 * Vì sao không đọc thẳng Firebase? `src/services/firebase.ts` là placeholder —
 * signInWithGoogle() chủ động throw, mọi tiến độ thật đang nằm trong
 * localStorage của máy. Server này vì vậy không cần secret và không mạng:
 * bạn xuất localStorage ra một file JSON rồi đưa đường dẫn cho tool.
 *
 * Mặc định che tên/mã hồ sơ (dữ liệu cá nhân của trẻ). include_names=true là
 * lựa chọn rõ ràng, không phải mặc định.
 */
import fs from 'node:fs';
import path from 'node:path';
import { startServer, obj, str, num, bool, en, arr } from './lib/server.mjs';
import { ROOT, readSource, clip } from './lib/repo.mjs';

const PII_FIELDS = ['name', 'id', 'displayName', 'email', 'photoURL', 'uid'];

const KEY_PURPOSE = {
  kho_bau_child_profile: 'Hồ sơ bé: XP, sao, streak, bài đã hoàn thành, sao từng bài',
  kho_bau_analytics: 'Đếm lượt chơi và số liệu vận hành',
  kho_bau_game_progress: 'Tiến độ từng trò chơi (bậc cao nhất, sao cao nhất)',
  kho_bau_competition_history: 'Kết quả đề thi đã làm + phân tích sai',
  kho_bau_reading_store: 'Phiên luyện đọc: WPM, độ chính xác, điểm phụ huynh chấm',
  kho_bau_learning_os_store: 'Learning OS: mastery/level theo từng kỹ năng, phiên luyện tập đang dở',
  kho_bau_english_mastery_store: 'Mastery riêng của môn Tiếng Anh',
  kho_bau_motivation: 'Sticker, khiên, cửa hàng, số liệu ngày',
  kho_bau_daily_quests: 'Nhiệm vụ trong ngày',
  kho_bau_achievements: 'Huy hiệu/đành đã mở khoá',
  kho_bau_kidbox_store: 'Trạng thái course Kid\'s Box Companion',
  kho_bau_ioe_store: 'Tiến độ luyện thi IOE tiếng Anh',
  kho_bau_review_days: 'Ngày lặp lại (spaced review)',
  kho_bau_tree_water: 'Ngày tưới cây gần nhất',
  kho_bau_game_first_seen: 'Ngày bé thấy mỗi trò chơi lần đầu',
  kho_bau_parent_settings: 'Cài đặt Chế độ Phụ huynh',
  kho_bau_game_nonce: 'Nonce xáo đề của từng trò chơi',
};

/** Không phải key lưu trữ — xuất hiện khi grep `kho_bau_` trong src. */
const NOT_STORAGE_KEYS = {
  kho_bau_storage_change: 'Tên CustomEvent phát khi localStorage thay đổi, không phải key',
  kho_bau_tri_thuc_report_: 'Tiền tố tên file JSON báo cáo mà Chế độ Phụ huynh tải xuống',
};

function parseExport(file) {
  const abs = path.isAbsolute(file) ? file : path.resolve(ROOT, file);
  if (!fs.existsSync(abs)) {
    throw new Error(
      `Không đọc được file: ${file}. Export tiến độ thật → progress/export.json, hoặc dùng thử mcp/sample-export.json (dữ liệu giả định).`
    );
  }
  if (!abs.startsWith(ROOT + path.sep) && !process.env.KBT_PROGRESS_DIR) {
    throw new Error('Ngoài repo thì phải set env KBT_PROGRESS_DIR trước khi chạy server này.');
  }
  const raw = JSON.parse(fs.readFileSync(abs, 'utf8'));
  // hai dạng file đều được chấp nhận:
  //  a) export thủ công từ DevTools — map phẳng {"kho_bau_xxx": "<json string>"}
  //  b) nút "Xuất file (.json)" trong Chế độ Phụ huynh — {profile, analytics, competitionHistory}
  const fromAppReport =
    raw && !Object.keys(raw).some((k) => k.startsWith('kho_bau_')) && (raw.profile || raw.analytics || raw.competitionHistory)
      ? {
          kho_bau_child_profile: raw.profile,
          kho_bau_analytics: raw.analytics,
          kho_bau_competition_history: raw.competitionHistory,
        }
      : raw;
  const store = {};
  for (const [key, value] of Object.entries(fromAppReport ?? {})) {
    if (key.startsWith('_')) continue; // ghi chú trong fixture
    if (typeof value === 'string') {
      try {
        store[key] = JSON.parse(value);
      } catch {
        // không phải JSON nhúng — giữ nguyên chuỗi
        store[key] = value;
      }
    } else {
      store[key] = value;
    }
  }
  return { abs, store, sourceKeys: Object.keys(fromAppReport ?? {}), fromAppReport: fromAppReport !== raw };
}

/** File mặc định: export thật nếu có, nếu không thì fixture demo để tool luôn chạy được. */
function resolveExportArg(file) {
  if (typeof file === 'string' && file.trim()) return file;
  return fs.existsSync(path.resolve(ROOT, 'progress/export.json'))
    ? 'progress/export.json'
    : 'mcp/sample-export.json';
}

function mask(value, includeNames) {
  if (includeNames || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => mask(v, includeNames));
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = PII_FIELDS.includes(k) ? '•••che•••' : mask(v, includeNames);
  return out;
}

function shapeOf(value, depth = 0) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return `array(${value.length})`;
  if (typeof value === 'object') {
    if (depth >= 2) return `object{${Object.keys(value).slice(0, 6).join(', ')}}`;
    const entries = {};
    for (const [k, v] of Object.entries(value).slice(0, 24)) entries[k] = shapeOf(v, depth + 1);
    return entries;
  }
  return typeof value;
}

const countBy = (arr, pick) =>
  arr.reduce((acc, item) => {
    const k = pick(item);
    if (k === undefined || k === null) return acc;
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

const nums = (list) => (Array.isArray(list) ? list : []).filter((n) => typeof n === 'number' && !Number.isNaN(n));
const avg = (list) => {
  const v = nums(list);
  return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : null;
};

startServer({
  name: 'kbt-progress',
  version: '1.0.0',
  instructions:
    'Đọc TIẾN ĐỘ CỤC BỘ của bé từ file export localStorage (không secret, không mạng). ' +
    'Mặc định che tên/mã hồ sơ. Luôn kiểm tra cờ isDemoData trước khi diễn giải con số — số liệu demo là số bịa, không được trình bày với phụ huynh như kết quả thật.',
  tools: [
    {
      name: 'storage_key_catalog',
      description: 'Liệt kê mọi key localStorage của app kèm mục đích và schema version hiện hành.',
      inputSchema: obj({}),
      handler() {
        let schemaVersion = null;
        try {
          const { text } = readSource('src/services/storage.ts', 100000);
          schemaVersion = (text.match(/STORAGE_SCHEMA_VERSION\s*=\s*'([^']+)'/) || [])[1] ?? null;
        } catch {
          /* bỏ qua, vẫn trả danh mục key */
        }
        return {
          schemaVersion,
          keys: Object.entries(KEY_PURPOSE).map(([key, purpose]) => ({ key, purpose })),
          notStorageKeys: NOT_STORAGE_KEYS,
        };
      },
    },

    {
      name: 'export_instructions',
      description: 'Hướng dẫn lấy file export tiến độ từ trình duyệt (DevTools snippet) và nơi đặt file để tool đọc được.',
      inputSchema: obj({}),
      handler() {
        return {
          snippet:
            "copy(Object.fromEntries(Object.entries(localStorage).filter(([k]) => k.startsWith('kho_bau_'))))",
          steps: [
            '1. Mở app (npm run dev hoặc bản đã dùng thật) trong trình duyệt.',
            '2a. Cách nhanh: Chế độ Phụ huynh → tab "Quản Lý Dữ Liệu" → "Xuất file (.json)" (file chứa profile + analytics + competitionHistory, tool này tự nhận dạng).',
            '2b. Cách đầy đủ: F12 → Console, chạy snippet ở trên (kết quả copy vào clipboard) — lấy trọn mọi key kể cả Learning OS/mastery.',
            '3. Lưu thành progress/export.json trong repo (thêm progress/ vào .gitignore trước nếu có dữ liệu thật).',
            '4. Gọi read_progress với file="progress/export.json".',
          ],
          warning:
            'File export chứa dữ liệu cá nhân của trẻ. Đừng commit, đừng dán vào chat/issue. ' +
            'Cân nhắc thêm dòng "progress/" vào .gitignore trước khi xuất.',
          alternative: 'Nếu chỉ muốn số liệu mẫu để thử tool: npm run dev rồi bật demo seed trong Parent Mode (profile sẽ mang cờ isDemoData=true).',
        };
      },
    },

    {
      name: 'read_progress',
      description:
        'Tóm tắt tiến độ từ file export: XP/sao/streak, bài đã xong, kết quả thi, luyện đọc, trò chơi, và cờ dữ liệu mẫu.',
      inputSchema: obj({
        file: str('File export JSON (tương đối repo hoặc tuyệt đối). Bỏ trống = progress/export.json, nếu chưa có thì dùng mcp/sample-export.json'),
        include_names: bool('Giữ nguyên tên/mã hồ sơ (mặc định false = che PII)', false),
        sections: arr('Mục muốn lấy; mặc định tất cả', { type: 'string' }),
      }),
      handler({ file, include_names = false, sections }) {
        const want = Array.isArray(sections) && sections.length ? new Set(sections) : null;
        const has = (s) => !want || want.has(s);
        const resolved = resolveExportArg(file);
        const { store } = parseExport(resolved);
        const profile = store.kho_bau_child_profile ?? null;
        const report = { file: resolved, generatedAt: new Date().toISOString().slice(0, 10) };

        report.demoFlag = profile?.isDemoData
          ? '⚠ isDemoData=true — toàn bộ số liệu dưới đây là MẪU BẰNG TAY, không phải kết quả học thật của bé.'
          : 'Không có cờ demo (có vẻ là dữ liệu thật).';

        if (has('profile') && profile) {
          report.profile = {
            grade: profile.grade,
            xp: profile.xp ?? 0,
            stars: profile.stars ?? 0,
            gems: profile.gems ?? 0,
            tickets: profile.tickets ?? 0,
            streak: profile.streak ?? 0,
            lastActiveDate: profile.lastActiveDate ?? null,
            lessonsCompleted: (profile.completedLessons ?? []).length,
            weeklyChallenges: (profile.completedWeeklyChallenges ?? []).length,
            lessonStarHistogram: countBy(Object.values(profile.lessonStars ?? {}), (s) => s),
            chestsOpened: Object.values(profile.chestState ?? {}).filter(Boolean).length,
            unlockAllLessons: !!profile.unlockAllLessons,
            identity: mask(
              { id: profile.id, name: profile.name, avatarBase: profile.avatarBase, equipped: profile.equipped },
              include_names
            ),
          };
        }

        if (has('games')) {
          // GameProgressStore = { version, games: Record<gameId, GameLevelProgress>, updatedAt }
          const gp = store.kho_bau_game_progress ?? {};
          const games = gp.games ?? gp;
          const rows = Object.entries(games).map(([gameId, v]) => {
            const starsByTier = v?.starsByTier ?? {};
            const tiers = Object.keys(starsByTier).map(Number).filter((n) => !Number.isNaN(n));
            const totalStars = tiers.reduce((a, t) => a + (starsByTier[t] ?? 0), 0);
            return {
              gameId,
              unlockedTier: v?.unlockedTier ?? null,
              highestTierPlayed: tiers.length ? Math.max(...tiers) : null,
              totalStars,
              bestScoreByTier: v?.bestScoreByTier ?? null,
              updatedAt: v?.updatedAt ?? null,
            };
          });
          report.games = {
            tracked: rows.length,
            byStars: rows.sort((a, b) => b.totalStars - a.totalStars).slice(0, 20),
          };
          const analytics = store.kho_bau_analytics ?? {};
          const mastery = analytics.skillMastery ?? {};
          report.analytics = {
            gamesPlayedCount: analytics.gamesPlayedCount ?? null,
            skillsTracked: Object.keys(mastery).length,
            bySubject: countBy(Object.values(mastery), (m) => m?.subject ?? null),
            shape: shapeOf(analytics),
          };
        }

        if (has('exams')) {
          // CompetitionHistoryStore = { examResults: CompetitionExamResult[], practicedSkills, remediationPlans }
          const comp = store.kho_bau_competition_history ?? {};
          const results = Array.isArray(comp.examResults) ? comp.examResults : [];
          const scores = nums(results.map((r) => r.score));
          const accuracies = nums(results.map((r) => r.accuracy));
          report.exams = {
            count: results.length,
            averageScore: scores.length ? avg(scores) : null,
            averageAccuracy: accuracies.length ? avg(accuracies) : null,
            bySubject: countBy(results, (r) => r.subject),
            recent: results.slice(-3).map((r) => ({
              at: r.timestamp ?? null,
              title: r.examTitle ?? null,
              subject: r.subject ?? null,
              correctOfTotal: `${r.correctCount ?? '?'}/${r.totalQuestions ?? '?'}`,
              score: r.score ?? null,
              speedLabel: r.speedLabel ?? null,
            })),
            errorCategories: countBy(
              results.flatMap((r) => (Array.isArray(r.errorAnalysis) ? r.errorAnalysis : [])),
              (e) => e?.category ?? null
            ),
            weakSkills: countBy(results.flatMap((r) => (Array.isArray(r.weakSkills) ? r.weakSkills : [])), (s) => s),
            speedTrialsCompleted: comp.speedTrialsCompleted ?? null,
          };
        }

        if (has('reading')) {
          // { schemaVersion, metrics: ReadingMetrics[], profile: ReadingProfile }
          const rs = store.kho_bau_reading_store ?? {};
          const metrics = Array.isArray(rs.metrics) ? rs.metrics : [];
          const wpms = nums(metrics.map((m) => m.wordsPerMinute));
          report.reading = {
            sessions: metrics.length,
            averageWpm: wpms.length ? avg(wpms) : null,
            bestWpm: wpms.length ? Math.max(...wpms) : null,
            accuracyAvg: avg(nums(metrics.map((m) => m.accuracy))),
            comprehensionAvg: avg(nums(metrics.map((m) => m.comprehensionAccuracy))),
            hesitationTotal: metrics.reduce((a, m) => a + (m.hesitationCount ?? 0), 0),
            byStage: countBy(metrics, (m) => m.stage),
            bySubject: countBy(metrics, (m) => m.subject),
            passagesRated: Object.keys(rs.profile?.parentRatings ?? {}).length,
          };
        }

        if (has('motivation')) {
          // MotivationState: stickers là Record<stickerId, số lượng>
          const mot = store.kho_bau_motivation ?? {};
          report.motivation = {
            stickerKinds: Object.keys(mot.stickers ?? {}).length,
            stickerTotal: Object.values(mot.stickers ?? {}).reduce((a, n) => a + (Number(n) || 0), 0),
            shields: mot.shields ?? null,
            shieldsUsedTotal: mot.shieldsUsedTotal ?? null,
            streakDaysLogged: (mot.streakDays ?? []).length,
            claimedLevelRewards: (mot.claimedLevelRewards ?? []).length,
            shape: shapeOf(mot),
          };
          report.quests = { shape: shapeOf(store.kho_bau_daily_quests ?? {}) };
          report.reviewDays = {
            logged: Array.isArray(store.kho_bau_review_days)
              ? store.kho_bau_review_days.length
              : Object.keys(store.kho_bau_review_days ?? {}).length,
          };
          report.treeWateredOn = store.kho_bau_tree_water ?? null;
        }

        if (has('raw')) {
          report.keyShapes = Object.fromEntries(
            Object.entries(store).map(([k, v]) => [k, include_names ? shapeOf(v) : shapeOf(mask(v, false))])
          );
        }

        report.present = Object.keys(store).filter((k) => k.startsWith('kho_bau_'));
        report.absent = Object.keys(KEY_PURPOSE).filter((k) => !report.present.includes(k));
        return report;
      },
    },

    {
      name: 'find_skill_gaps',
      description:
        'Kỹ năng yếu nhất của bé từ Learning OS (mastery 0-100, level L1-L5) — xếp từ thấp lên cao để biết nên ôn gì trước.',
      inputSchema: obj({
        file: str('File export JSON. Bỏ trống = progress/export.json rồi fallback sang fixture demo.'),
        limit: num('Số kỹ năng trả về, mặc định 15', 15),
        store: en('Đọc kho mastery nào', ['learning_os', 'english_mastery']),
      }),
      handler({ file, limit = 15, store = 'learning_os' }) {
        const { store: data } = parseExport(resolveExportArg(file));
        const src =
          store === 'english_mastery'
            ? data.kho_bau_english_mastery_store ?? {}
            : data.kho_bau_learning_os_store ?? {};

        const flat = [];
        const walk = (node, trail) => {
          if (!node || typeof node !== 'object') return;
          if (typeof node.mastery === 'number') {
            flat.push({
              skill: node.skillName ?? trail[trail.length - 1] ?? null,
              path: trail.join('.'),
              mastery: node.mastery,
              level: node.currentLevel ?? node.level ?? null,
              attempts:
                node.attemptCount !== undefined || node.correctCount !== undefined
                  ? `${node.correctCount ?? 0}✓/${node.attemptCount ?? 0} lượt`
                  : null,
            });
            return;
          }
          for (const [k, v] of Object.entries(node)) {
            if (v && typeof v === 'object') walk(v, [...trail, k]);
          }
        };
        walk(src, []);

        const gaps = flat.sort((a, b) => a.mastery - b.mastery).slice(0, limit);
        return {
          store,
          skillsFound: flat.length,
          note:
            flat.length === 0
              ? 'Không tìm thấy field mastery — có thể file export thiếu kho learning OS, hoặc schema đã đổi. Kiểm tra read_progress với sections=["raw"].'
              : undefined,
          weakestFirst: gaps,
          averageMastery: flat.length ? +(flat.reduce((a, s) => a + s.mastery, 0) / flat.length).toFixed(1) : null,
        };
      },
    },
  ],
});
