import {
  KIDBOX_LOCALE,
  KidBoxCourse,
  KidBoxLevelId,
  KidBoxRequiredArtifact,
  KidBoxUnit,
} from '../types/kidBox';
import { BRIDGE_UNIT, KIDBOX_BRIDGE_UNIT_ID } from './kidBoxBridgePack';

/**
 * KID'S BOX NEW GENERATION 1 — BRITISH ENGLISH COMPANION TRACK
 * Course registry (§4 SOURCE-OF-TRUTH MODEL, §27 CONTENT INGESTION, §39 RULE).
 *
 * CONTENT SOURCE STATUS: **REQUIRED**
 *
 * The repository holds no verified copy of the Kid's Box New Generation 1
 * syllabus, table of contents, word lists, phonics chart or teacher's notes.
 * §39 is therefore binding: no unit title, vocabulary list or phonics chart is
 * invented here. Instead:
 *   1. the course shell, level and level-1 mapping layer exist;
 *   2. `requiredArtifacts` states exactly which source content is still needed;
 *   3. `data/kidBoxIngest.ts` turns supplied material into mapped units without
 *      any redesign of the engines;
 *   4. the only unit that ships is the clearly-labelled bridge pack, whose
 *      source is this app's own English curriculum.
 */

export const KIDBOX_COURSE_ID = 'kids-box-new-generation-1';
export const KIDBOX_LEVEL_ID: KidBoxLevelId = 'LEVEL_1';
export const KIDBOX_SCHEMA_VERSION = 'kidbox-content-v1';

export { KIDBOX_BRIDGE_UNIT_ID };

/**
 * §27 — the exact list of source content still missing. The parent panel and
 * the docs render this verbatim so nobody has to guess what to hand over.
 */
export const KIDBOX_REQUIRED_ARTIFACTS: KidBoxRequiredArtifact[] = [
  {
    artifactId: 'table-of-contents',
    label: 'Mục lục (table of contents) của Kid\u2019s Box New Generation 1 Level 1',
    unlocks: 'Danh sách Unit thật kèm tiêu đề và thứ tự, thay cho các ô trống CONTENT_SOURCE_REQUIRED.',
    satisfied: false,
  },
  {
    artifactId: 'unit-word-lists',
    label: 'Danh sách từ vựng theo từng Unit (word – picture – nghĩa tiếng Việt)',
    unlocks: 'Hoạt động nhìn – nghe – hiểu – lặp lại và các bài luyện từ vựng.',
    satisfied: false,
  },
  {
    artifactId: 'phonics-chart',
    label: 'Bảng âm / phonics chart của từng Unit',
    unlocks: 'Hoạt động nghe âm, phân biệt âm, âm đầu và ghép âm.',
    satisfied: false,
  },
  {
    artifactId: 'language-patterns',
    label: 'Các mẫu câu (language patterns) được dạy trong từng Unit',
    unlocks: 'Hoạt động “dùng” — ghép câu và hỏi đáp bằng tiếng Anh.',
    satisfied: false,
  },
  {
    artifactId: 'listening-and-speaking-tasks',
    label: 'Mô tả bài nghe và bài nói của từng bài (không cần transcript bản quyền)',
    unlocks: 'Dựng hoạt động nghe và nói đúng theo bài giảng, thay vì hoạt động chung.',
    satisfied: false,
  },
  {
    artifactId: 'reading-texts',
    label: 'Gợi ý bài đọc của từng Unit (tự viết lại bằng văn phong lớp 1)',
    unlocks: 'Hoạt động đọc từ → cụm từ → câu → đoạn ngắn và đọc hiểu.',
    satisfied: false,
  },
  {
    artifactId: 'homework-log',
    label: 'Danh sách bài tập về nhà theo tuần của trung tâm',
    unlocks: 'Gói “Ôn ở nhà” theo Unit hoặc theo tuần cho phụ huynh.',
    satisfied: false,
  },
];

/**
 * Units with real, verified Kid's Box content. Intentionally empty until the
 * artifacts above are supplied and mapped.
 */
export const KIDBOX_MAPPED_UNITS: KidBoxUnit[] = [];

function createCourse(): KidBoxCourse {
  return {
    courseId: KIDBOX_COURSE_ID,
    title: "Kid's Box New Generation 1",
    textbookSeries: "Kid's Box New Generation 1",
    publisher: 'Cambridge University Press',
    variant: 'BRITISH_ENGLISH',
    locale: KIDBOX_LOCALE,
    schemaVersion: KIDBOX_SCHEMA_VERSION,
    levels: [
      {
        levelId: 'LEVEL_1',
        label: "Kid's Box New Generation 1 — Level 1",
        ageMin: 6,
        ageMax: 7,
      },
    ],
    units: [...KIDBOX_MAPPED_UNITS, BRIDGE_UNIT],
    requiredArtifacts: KIDBOX_REQUIRED_ARTIFACTS.map((a) => ({ ...a })),
  };
}

let cachedCourse: KidBoxCourse | null = null;

/** The course shell. Stable object identity so memoised UI stays correct. */
export function getKidBoxCourse(): KidBoxCourse {
  if (!cachedCourse) cachedCourse = createCourse();
  return cachedCourse;
}

/** Units that a teacher has actually mapped (excludes the bridge pack). */
export function getMappedKidBoxUnits(): KidBoxUnit[] {
  return getKidBoxCourse().units.filter((u) => u.sourceType !== 'APP_BRIDGE');
}

export function findKidBoxUnit(unitId: string): KidBoxUnit | undefined {
  return getKidBoxCourse().units.find((u) => u.id === unitId);
}

/** §22 UNIT LOCKING — nothing is ever blocked, but the current unit leads. */
export function getKidBoxUnitLabel(unit: KidBoxUnit | undefined): string {
  if (!unit) return 'Chưa chọn Unit';
  if (unit.sourceType === 'APP_BRIDGE') return unit.title ?? 'Luyện tập nền';
  if (!unit.title) return `Unit ${unit.index} (chưa có nội dung nguồn)`;
  return `Unit ${unit.index} — ${unit.title}`;
}

/** Overall content readiness, surfaced in the parent panel and the docs. */
export function getKidBoxContentReadiness(): {
  status: 'READY' | 'PARTIAL' | 'CONTENT_SOURCE_REQUIRED';
  mappedUnits: number;
  bridgeUnits: number;
  missingArtifacts: KidBoxRequiredArtifact[];
} {
  const course = getKidBoxCourse();
  const mapped = getMappedKidBoxUnits().filter((u) => u.contentStatus !== 'CONTENT_SOURCE_REQUIRED');
  const missingArtifacts = course.requiredArtifacts.filter((a) => !a.satisfied);
  if (missingArtifacts.length === 0 && mapped.length > 0) {
    return { status: 'READY', mappedUnits: mapped.length, bridgeUnits: 0, missingArtifacts };
  }
  return {
    status: 'CONTENT_SOURCE_REQUIRED',
    mappedUnits: mapped.length,
    bridgeUnits: course.units.length - mapped.length,
    missingArtifacts,
  };
}
