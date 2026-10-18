import type { ReadingPassage, ReadingQuestion, ReadingTheme } from '../../types/reading';
import { T13_GIA_DINH_PASSAGES, T13_GIA_DINH_QUESTIONS } from './t13-gia-dinh';
import { T13_TRUONG_LOP_PASSAGES, T13_TRUONG_LOP_QUESTIONS } from './t13-truong-lop';
import { T13_CON_VAT_PASSAGES, T13_CON_VAT_QUESTIONS } from './t13-con-vat';
import { T13_THIEN_NHIEN_PASSAGES, T13_THIEN_NHIEN_QUESTIONS } from './t13-thien-nhien';
import { T13_QUE_HUONG_PASSAGES, T13_QUE_HUONG_QUESTIONS } from './t13-que-huong';
import { T13_TINH_BAN_PASSAGES, T13_TINH_BAN_QUESTIONS } from './t13-tinh-ban';

/**
 * T13 — 24 truyện luyện đọc mới (6 chủ đề x 4).
 * Mỗi file `t13-<chủ đề>.ts` là một unit độc lập; file này chỉ gộp lại để
 * `readingContent.ts` (lazy chunk) nạp một lần duy nhất.
 */
export const T13_PASSAGES: ReadingPassage[] = [
  ...T13_GIA_DINH_PASSAGES,
  ...T13_TRUONG_LOP_PASSAGES,
  ...T13_CON_VAT_PASSAGES,
  ...T13_THIEN_NHIEN_PASSAGES,
  ...T13_QUE_HUONG_PASSAGES,
  ...T13_TINH_BAN_PASSAGES,
];

export const T13_QUESTIONS: ReadingQuestion[] = [
  ...T13_GIA_DINH_QUESTIONS,
  ...T13_TRUONG_LOP_QUESTIONS,
  ...T13_CON_VAT_QUESTIONS,
  ...T13_THIEN_NHIEN_QUESTIONS,
  ...T13_QUE_HUONG_QUESTIONS,
  ...T13_TINH_BAN_QUESTIONS,
];

/** Ids của 24 truyện T13 (để test phân biệt truyện mới/cũ). */
export const T13_PASSAGE_IDS: string[] = T13_PASSAGES.map((p) => p.id);

/** Ids của 144 câu hỏi T13. */
export const T13_QUESTION_IDS: string[] = T13_QUESTIONS.map((q) => q.id);

/** 6 chủ đề T13 theo thứ tự trong spec. */
export const T13_THEMES: ReadingTheme[] = [
  'gia-dinh',
  'truong-lop',
  'con-vat',
  'thien-nhien',
  'que-huong',
  'tinh-ban',
];

/**
 * Mở khoá theo cấp (spec cho phép "theo tiến độ vần ở T10 hoặc theo cấp"):
 * truyện level N mở khi bé đã mở tới cấp N. Không chạm storage nên không
 * cần migration; engine stage-gating (ACCURACY→FLUENCY→…) vẫn giữ nhịp.
 */
export function isT13PassageUnlockedByLevel(passage: ReadingPassage, maxLevel: 1 | 2 | 3): boolean {
  return passage.level <= maxLevel;
}
