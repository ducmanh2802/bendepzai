/**
 * speechText — lớp phát âm trước khi đưa văn bản vào SpeechSynthesis.
 *
 * Vì sao cần: đề Toán viết ký hiệu ("Tính: 6 + 4 = ?") nhưng giọng nói tiếng Việt
 * của nền tảng không đọc được `+`, `−`, `=` — bé chỉ nghe "sáu bốn" và mất về
 * mất ngữ cảnh nên không làm được phép tính. Đo 2026-10-30: 24/475 câu trong kho
 * thi (môn Toán + các vòng Đấu trường) có ký hiệu trong văn bản đọc; 260 câu
 * trong curriculum thì đã có `audioPrompt` viết bằng lời nên không bị.
 *
 * Nguyên tắc:
 *   - Chỉ sửa **văn bản đi vào utterance**, không sửa chữ hiển thị trên màn hình
 *     và không đụng tới contract routing trong `questionAudio.ts` (assert vẫn so
 *     sánh canonical text gốc, `data-last-spoken` vẫn ghi nguyên văn đề).
 *   - Chỉ đổi khi ký hiệu nằm **giữa hai chữ số**, để không đọc nhầm dấu gạch
 *     trong dãy số, khoảng giá trị, ngày tháng hay tên file.
 *   - Giữ nguyên mọi thứ trong `[...]`: ở đó dấu gạch là phân cách dãy
 *     ("[1 - 3 - 5]"), không phải phép trừ.
 */

const DIGIT_GAP = String.raw`\s*`;

/** Từ nối theo ngôn ngữ; tiếng Việt là mặc định vì app chủ yếu là vi-VN. */
const CONNECTORS = {
  vi: { plus: 'cộng', minus: 'trừ', equals: 'bằng', ask: 'bằng mấy', askBlank: 'bằng bao nhiêu' },
  en: { plus: 'plus', minus: 'minus', equals: 'equals', ask: 'equals what', askBlank: 'equals what' },
} as const;

function connectorsFor(lang: string) {
  return lang.startsWith('en') ? CONNECTORS.en : CONNECTORS.vi;
}

function normalizeSegment(text: string, lang: string): string {
  const c = connectorsFor(lang);
  let out = text;

  // Dấu bằng: ưu tiên dạng có ngôi sao / chỗ trống trước, rồi tới dạng số = số.
  out = out.replace(/=\s*\?/g, c.ask);
  out = out.replace(/=\s*(?:\.\.\.|…)/g, c.askBlank);
  out = out.replace(new RegExp(`(\\d)${DIGIT_GAP}=${DIGIT_GAP}(?=\\d)`, 'g'), `$1 ${c.equals} `);

  // "6 + 4" và "... + 27" → "cộng". Dấu `+` đứng trước chữ số trong nội dung lớp 1
  // chỉ có thể là phép cộng nên không cần điều kiện bên trái (bằng chứng thiết bị
  // thật 2026-10-30: "Chung kết 4: Điền số: ... + 27 = 60" vẫn còn ký hiệu +).
  out = out.replace(new RegExp(`\\+${DIGIT_GAP}(?=\\d)`, 'g'), `${c.plus} `);
  // "10 - 7", "10 − 7" (U+2212 dấu trừ toán học). KHÔNG đổi en dash "1–3"
  // vì đó là khoảng, không phải phép trừ.
  out = out.replace(new RegExp(`(\\d)${DIGIT_GAP}[-\\u2212]${DIGIT_GAP}(?=\\d)`, 'g'), `$1 ${c.minus} `);
  // "… - 3 = 7": vế trái là chỗ trống cần điền, dấu gạch vẫn là phép trừ.
  out = out.replace(new RegExp(`(\\.\\.\\.|…)${DIGIT_GAP}[-\\u2212]${DIGIT_GAP}(?=\\d)`, 'g'), `$1 ${c.minus} `);

  return out;
}

/**
 * Biến văn bản hiển thị thành văn bản thân thiện với TTS tiếng Việt/tiếng Anh.
 * Hàm thuần, idempotent (đọc lại lần hai không đổi thêm).
 */
export function toSpeechText(text: string, lang: string): string {
  if (!text) return text;
  // Tách theo đoạn trong [] và giữ nguyên đoạn đó.
  return text
    .split(/(\[[^\]]*\])/)
    .map((part) => (part.startsWith('[') ? part : normalizeSegment(part, lang)))
    .join('');
}
