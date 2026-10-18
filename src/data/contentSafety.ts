/**
 * T02B/B15 — Content safety for Grade-1 game content.
 *
 * - Matches multi-word banned phrases ("cô đơn", "ly dị", "vũ khí"...)
 *   via boundary-aware substring search (not single-token exact match).
 * - `ALLOWED_PHRASES` exempts legitimate content that contains a banned
 *   token as a substring ("đánh răng", "đánh vần", "đánh giá"...), so the
 *   validator no longer false-positives on healthy material.
 * - All matching is tone-sensitive, case-insensitive, NFC-normalised.
 */

export const BANNED_WORDS: readonly string[] = [
  // Audit B5 — unsuitable for 6-year-olds
  'mả',
  'mộ',
  'thù',
  'thê',
  'gả',
  'thạ',
  'mụ',
  // Sad / scary / adult (00_RULES §5)
  'ma',
  'quỷ',
  'chết',
  'giết',
  'đánh',
  'đấm',
  'sợ',
  'khóc',
  'buồn',
  'cô đơn',
  'mồ',
  'hận',
  'ly dị',
  'vũ khí',
];

/**
 * T02B/B15 — legitimate phrases that contain a banned token but are fine
 * for children. Checked FIRST: any occurrence of these phrases is masked
 * out before the banned-word scan, so "đánh răng" never trips "đánh".
 */
export const ALLOWED_PHRASES: readonly string[] = [
  'đánh răng',
  'đánh vần',
  'đánh giá',
  'đánh thức',
  'đánh đàn',
  'đánh trống',
  'đánh dấu',
  'đánh cá',
];

/** Split text into lowercase word tokens (tone-sensitive, keeps Vietnamese). */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-zà-ỹđêôơưăâî]+/u)
    .filter(Boolean);
}

function normalizeLower(text: string): string {
  return ` ${text.normalize('NFC').toLowerCase()} `;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Mask every allowed phrase with spaces (keeps string length stable enough
 * for boundary checks) so banned tokens inside them are not flagged.
 */
function maskAllowed(text: string): string {
  let out = normalizeLower(text);
  for (const phrase of ALLOWED_PHRASES) {
    const needle = ` ${phrase.normalize('NFC').toLowerCase()} `;
    // Replace all non-overlapping occurrences.
    while (out.includes(needle)) {
      out = out.replace(needle, ` ${' '.repeat(needle.length - 2)} `);
    }
  }
  return out;
}

/**
 * True when the text contains any banned word/phrase (exact, tone-sensitive),
 * ignoring occurrences inside `ALLOWED_PHRASES`.
 */
export function containsBannedWord(text: string): boolean {
  const masked = maskAllowed(text);
  return BANNED_WORDS.some((w) => {
    const needle = ` ${w.normalize('NFC').toLowerCase()} `;
    if (masked.includes(needle)) return true;
    // Fallback: boundary-aware regex for punctuation-adjacent matches.
    try {
      const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(w.normalize('NFC').toLowerCase())}([^\\p{L}\\p{N}]|$)`, 'u');
      return re.test(masked.trim());
    } catch {
      return false;
    }
  });
}

/** All banned tokens found in the text (for reporting). */
export function findBannedWords(text: string): string[] {
  const masked = maskAllowed(text);
  return BANNED_WORDS.filter((w) => {
    const needle = ` ${w.normalize('NFC').toLowerCase()} `;
    return masked.includes(needle);
  });
}
