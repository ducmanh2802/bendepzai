/**
 * T36 — Chuỗi hiển thị cho bé/ba mẹ phải là tiếng Việt.
 * Nội dung bài học tiếng Anh (từ vựng, mẫu câu, lời thoại en-GB) cố ý giữ nguyên,
 * nên test chỉ kiểm tra lớp nhãn (title/label/skillName/mô tả) — nơi sót dịch hay lộ ra.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = (rel: string) => readFileSync(join(here, '..', rel), 'utf-8');

import { GAMES_CATALOG } from '../src/data/gamesCatalog';
import { ACHIEVEMENT_CATALOG } from '../src/data/achievementCatalog';
import { COMPETITION_SKILLS } from '../src/data/competitionTaxonomy';
import { CANONICAL_ENGLISH_SKILLS } from '../src/data/englishSkillTaxonomy';
import { ENGLISH_TOPICS } from '../src/data/englishCurriculum';

const CO_DAU = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i;
/**
 * Từ Anh thông dụng đã có từ tiếng Việt tương đương — không được xuất hiện trong nhãn.
 * Tên riêng/product name (Kid's Box, Simon Says, IOE, Safari, Phonics, Sticker) nằm ngoài danh sách.
 */
const TU_CAM = /\b(English|Animals?|Album|Shop|Level|Colors?|Numbers|Family|School|Body Parts|Champion|Explorer|Superstar|Homework|Current)\b/;

const coCauTiengViet = (s: string) => CO_DAU.test(s) && !TU_CAM.test(s);

describe('T36 — nhãn hiển thị phải là tiếng Việt', () => {
  it('GAMES_CATALOG: tiêu đề, mô tả, skillTag, categoryLabel, mascot đều là tiếng Việt', () => {
    expect(GAMES_CATALOG.length).toBeGreaterThan(20);
    for (const g of GAMES_CATALOG) {
      for (const [field, value] of [
        ['title', g.title],
        ['description', g.description],
        ['skillTag', g.skillTag],
        ['categoryLabel', g.categoryLabel],
        ['mascot', g.mascot],
      ] as const) {
        expect(coCauTiengViet(value), `${g.id}.${field} = ${value}`).toBe(true);
      }
    }
  });

  it('GAMES_CATALOG: không có tên trò chơi trùng nhau sau khi đổi nhãn', () => {
    const titles = GAMES_CATALOG.map((g) => g.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('ACHIEVEMENT_CATALOG: nhãn + mô tả tiếng Việt, không còn "Album"/"Shop"', () => {
    for (const a of ACHIEVEMENT_CATALOG) {
      expect(coCauTiengViet(a.title), `${a.id}.title = ${a.title}`).toBe(true);
      expect(coCauTiengViet(a.description), `${a.id}.description = ${a.description}`).toBe(true);
    }
  });

  it('COMPETITION_SKILLS: skillName tiếng Việt vì nó nằm trong câu tiếng Việt', () => {
    for (const s of COMPETITION_SKILLS) {
      expect(CO_DAU.test(s.skillName), `${s.skillId}.skillName = ${s.skillName}`).toBe(true);
      expect(CO_DAU.test(s.description), `${s.skillId}.description = ${s.description}`).toBe(true);
    }
  });

  it('CANONICAL_ENGLISH_SKILLS: skillName tiếng Việt (bảng kỹ năng cho ba mẹ)', () => {
    for (const s of CANONICAL_ENGLISH_SKILLS) {
      expect(CO_DAU.test(s.skillName), `${s.skillId}.skillName = ${s.skillName}`).toBe(true);
    }
  });

  it('Nhóm của khu trò chơi dùng chung một tên tiếng Việt', () => {
    const hub = src('src/components/games/GamesHubScreen.tsx');
    expect(hub).toContain("label: 'Tư Duy & Khoa Học'");
    for (const g of GAMES_CATALOG.filter((x) => x.category === 'logic')) {
      expect(g.categoryLabel).toBe('Tư Duy & Khoa Học');
    }
  });

  it('Không còn chuỗi "English" trong nhãn hiện trên màn hình của bé', () => {
    const files = [
      'src/components/subject/SubjectScreen.tsx',
      'src/components/world/WorldMapScreen.tsx',
      'src/components/home/HomeScreen.tsx',
      'src/components/english/KidBoxCompanionScreen.tsx',
      'src/components/competition/CompetitionHubScreen.tsx',
      'src/components/games/EnglishAnimalSoundGame.tsx',
      'src/components/games/EnglishColorBalloonGame.tsx',
      'src/services/praiseEngine.ts',
      'src/services/decisionEngine.ts',
      'src/services/kidBoxEngine.ts',
      'src/data/gamesCatalog.ts',
      'src/data/achievementCatalog.ts',
      'src/data/questPool.ts',
    ];
    for (const f of files) {
      // Bỏ comment trước: chỉ bắt chuỗi/JSX thật sự hiển thị ra màn hình.
      const noi = src(f)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '');
      const chuoiHienThi = [
        ...noi.matchAll(/'([^'\n]*English[^'\n]*)'/g),
        ...noi.matchAll(/>([^<>\n]*English[^<>\n]*)</g),
      ].map((m) => m[1].trim());
      // Bỏ chuỗi kỹ thuật (tên khoá, đường dẫn import) — chỉ xét câu hiển thị có dấu cách.
      const conSot = chuoiHienThi.filter(
        (s) => /\s/.test(s) && !/Kid's Box|British English|English \(|en-GB/.test(s)
      );
      expect(conSot.length, `${f}: ${conSot.join(' | ')}`).toBe(0);
    }
  });

  it('Nhãn đảo trên bản đồ (topic.title + lesson.title) là tiếng Việt', () => {
    // Topic kết thúc "-units" là tên bài trong sách Kid's Box — giữ nguyên tiếng Anh có chủ đích.
    const dao = ENGLISH_TOPICS.filter((t) => !t.id.endsWith('-units'));
    expect(dao.length).toBe(12);
    for (const t of dao) {
      expect(coCauTiengViet(t.title), `${t.id}.title = ${t.title}`).toBe(true);
      for (const l of t.lessons) {
        expect(coCauTiengViet(l.title), `${l.id}.title = ${l.title}`).toBe(true);
      }
    }
    // Tên sách giáo khoa vẫn còn trên đảo để ba mẹ đối chiếu được với vở của bé.
    const sach = ENGLISH_TOPICS.filter((t) => t.id.endsWith('-units'));
    expect(sach.length).toBe(12);
    expect(sach[0].title).toMatch(/^Unit \d+ · /);
  });

  it('ChessTutorial: đủ 6 quân cờ vua, không còn tên cờ tướng', () => {
    const file = src('src/components/learning/chess/ChessTutorial.tsx');
    for (const ten of ['Tốt', 'Xe', 'Tượng', 'Mã', 'Hậu', 'Vua']) {
      expect(file, `thiếu quân ${ten}`).toContain(`name: '${ten}'`);
    }
    for (const sai of ['Pháo', 'Sĩ', 'Tốt phát', 'Vua đối', 'L-shaped', 'rules cờ vua', 'Nhất', 'Phủ']) {
      expect(file, `còn sót "${sai}"`).not.toContain(sai);
    }
  });
});
