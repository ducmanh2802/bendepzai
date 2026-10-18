/**
 * T04 — Ngân hàng từ có cấu trúc cho game Tiếng Việt.
 * Nguồn duy nhất cho ListenPick, CatchLetters, RhymeHunter.
 * Mỗi từ: word, onset, rhyme, tone, emoji, topic.
 */

export interface WordBankEntry {
  word: string;
  onset: string;
  rhyme: string;
  tone: 'ngang' | 'sắc' | 'huyền' | 'hỏi' | 'ngã' | 'nặng';
  emoji: string;
  topic: string;
}

/**
 * Compose a syllable from onset + rhyme + tone.
 * Used by games to verify/generate words programmatically.
 */
export function composeSyllable(onset: string, rhyme: string, tone: WordBankEntry['tone']): string {
  const base = onset + rhyme;
  switch (tone) {
    case 'ngang':
      return base;
    case 'sắc':
      return addTone(base, 'sắc');
    case 'huyền':
      return addTone(base, 'huyền');
    case 'hỏi':
      return addTone(base, 'hỏi');
    case 'ngã':
      return addTone(base, 'ngã');
    case 'nặng':
      return addTone(base, 'nặng');
  }
}

/**
 * Add a tone mark to the last vowel in a string.
 * Vietnamese tone marks applied to the main vowel (nucleus).
 */
function addTone(syllable: string, tone: 'sắc' | 'huyền' | 'hỏi' | 'ngã' | 'nặng'): string {
  // Find the main vowel (last vowel in the syllable nucleus)
  const vowels = 'aeiouăâêôơưyAEIOUĂÂÊÔƠƯY';
  let lastVowelIdx = -1;
  for (let i = syllable.length - 1; i >= 0; i--) {
    if (vowels.includes(syllable[i])) {
      lastVowelIdx = i;
      break;
    }
  }
  if (lastVowelIdx === -1) return syllable;

  const baseChar = syllable[lastVowelIdx];
  let tonedChar = baseChar;

  const toneMap: Record<string, Record<string, string>> = {
    a: { sắc: 'á', huyền: 'à', hỏi: 'ả', ngã: 'ã', nặng: 'ạ' },
    A: { sắc: 'Á', huyền: 'À', hỏi: 'Ả', ngã: 'Ã', nặng: 'Ạ' },
    ă: { sắc: 'ắ', huyền: 'ằ', hỏi: 'ẳ', ngã: 'ẵ', nặng: 'ặ' },
    Ă: { sắc: 'Ắ', huyền: 'Ằ', hỏi: 'Ẳ', ngã: 'Ẵ', nặng: 'Ặ' },
    â: { sắc: 'ấ', huyền: 'ầ', hỏi: 'ẩ', ngã: 'ẫ', nặng: 'ậ' },
    Â: { sắc: 'Ấ', huyền: 'Ầ', hỏi: 'Ẩ', ngã: 'Ẫ', nặng: 'Ậ' },
    e: { sắc: 'é', huyền: 'è', hỏi: 'ẻ', ngã: 'ẽ', nặng: 'ẹ' },
    E: { sắc: 'É', huyền: 'È', hỏi: 'Ẻ', ngã: 'Ẽ', nặng: 'Ẹ' },
    ê: { sắc: 'ế', huyền: 'ề', hỏi: 'ể', ngã: 'ễ', nặng: 'ệ' },
    Ê: { sắc: 'Ế', huyền: 'Ề', hỏi: 'Ể', ngã: 'Ễ', nặng: 'Ệ' },
    i: { sắc: 'í', huyền: 'ì', hỏi: 'ỉ', ngã: 'ĩ', nặng: 'ị' },
    I: { sắc: 'Í', huyền: 'Ì', hỏi: 'Ỉ', ngã: 'Ĩ', nặng: 'Ị' },
    o: { sắc: 'ó', huyền: 'ò', hỏi: 'ỏ', ngã: 'õ', nặng: 'ọ' },
    O: { sắc: 'Ó', huyền: 'Ò', hỏi: 'Ỏ', ngã: 'Õ', nặng: 'Ọ' },
    ô: { sắc: 'ố', huyền: 'ồ', hỏi: 'ổ', ngã: 'ỗ', nặng: 'ộ' },
    Ô: { sắc: 'Ố', huyền: 'Ồ', hỏi: 'Ổ', ngã: 'Ỗ', nặng: 'Ộ' },
    ơ: { sắc: 'ớ', huyền: 'ờ', hỏi: 'ở', ngã: 'ỡ', nặng: 'ợ' },
    Ơ: { sắc: 'Ớ', huyền: 'Ờ', hỏi: 'Ở', ngã: 'Ỡ', nặng: 'Ợ' },
    u: { sắc: 'ú', huyền: 'ù', hỏi: 'ủ', ngã: 'ũ', nặng: 'ụ' },
    U: { sắc: 'Ú', huyền: 'Ù', hỏi: 'Ủ', ngã: 'Ũ', nặng: 'Ụ' },
    ư: { sắc: 'ứ', huyền: 'ừ', hỏi: 'ử', ngã: 'ữ', nặng: 'ự' },
    Ư: { sắc: 'Ứ', huyền: 'Ừ', hỏi: 'Ử', ngã: 'Ữ', nặng: 'Ự' },
    y: { sắc: 'ý', huyền: 'ỳ', hỏi: 'ỷ', ngã: 'ỹ', nặng: 'ỵ' },
    Y: { sắc: 'Ý', huyền: 'Ỳ', hỏi: 'Ỷ', ngã: 'Ỹ', nặng: 'Ỵ' },
  };

  if (toneMap[baseChar]?.[tone]) {
    tonedChar = toneMap[baseChar][tone]!;
  }

  return syllable.slice(0, lastVowelIdx) + tonedChar + syllable.slice(lastVowelIdx + 1);
}

/**
 * Strip only the 5 tone marks (sắc/huyền/hỏi/ngã/nặng).
 * Preserves diacritics on vowels (ă, â, ê, ô, ơ, ư, đ).
 * Used for rhyme matching in RhymeHunter.
 */
export function stripTonesOnly(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300\u0301\u0303\u0309\u0323]/g, '')
    .normalize('NFC');
}

/**
 * WORD BANK —structured Vietnamese words for Grade 1.
 * Organized by topic and rhyme family.
 * Each entry: word, onset, rhyme, tone, emoji, topic.
 */
export const WORD_BANK: WordBankEntry[] = [
  // Topic: con vật (animals)
  { word: 'con mèo', onset: 'm', rhyme: 'èo', tone: 'ngang', emoji: '🐱', topic: 'con vật' },
  { word: 'con cá', onset: 'c', rhyme: 'á', tone: 'sắc', emoji: '🐟', topic: 'con vật' },
  { word: 'con chó', onset: 'ch', rhyme: 'ó', tone: 'sắc', emoji: '🐶', topic: 'con vật' },
  { word: 'con gà', onset: 'g', rhyme: 'à', tone: 'huyền', emoji: '🐓', topic: 'con vật' },
  { word: 'con vịt', onset: 'v', rhyme: 'it', tone: 'nặng', emoji: '🦆', topic: 'con vật' },
  { word: 'con thỏ', onset: 'th', rhyme: 'ỏ', tone: 'hỏi', emoji: '🐰', topic: 'con vật' },
  { word: 'con bò', onset: 'b', rhyme: 'ò', tone: 'huyền', emoji: '🐄', topic: 'con vật' },
  { word: 'con heo', onset: 'h', rhyme: 'eo', tone: 'ngang', emoji: '🐷', topic: 'con vật' },
  { word: 'con ngựa', onset: 'ng', rhyme: 'ựa', tone: 'nặng', emoji: '🐎', topic: 'con vật' },
  { word: 'con dê', onset: 'd', rhyme: 'ê', tone: 'ngang', emoji: '🐐', topic: 'con vật' },
  { word: 'con cua', onset: 'c', rhyme: 'ua', tone: 'ngang', emoji: '🦀', topic: 'con vật' },
  { word: 'con rùa', onset: 'r', rhyme: 'ùa', tone: 'ngang', emoji: '🐢', topic: 'con vật' },

  // Topic: quả cây (fruits)
  { word: 'quả cam', onset: 'c', rhyme: 'am', tone: 'ngang', emoji: '🍊', topic: 'quả cây' },
  { word: 'quả chuối', onset: 'ch', rhyme: 'uối', tone: 'ngang', emoji: '🍌', topic: 'quả cây' },
  { word: 'quả táo', onset: 't', rhyme: 'áo', tone: 'sắc', emoji: '🍎', topic: 'quả cây' },
  { word: 'quả dưa', onset: 'd', rhyme: 'ưa', tone: 'ngang', emoji: '🍉', topic: 'quả cây' },
  { word: 'quả nho', onset: 'nh', rhyme: 'o', tone: 'ngang', emoji: '🍇', topic: 'quả cây' },
  { word: 'quả lê', onset: 'l', rhyme: 'ê', tone: 'ngang', emoji: '🍐', topic: 'quả cây' },
  { word: 'quả mít', onset: 'm', rhyme: 'ít', tone: 'sắc', emoji: '🍈', topic: 'quả cây' },
  { word: 'quả xoài', onset: 'x', rhyme: 'oài', tone: 'ngang', emoji: '🥭', topic: 'quả cây' },
  { word: 'quả vải', onset: 'v', rhyme: 'ải', tone: 'hỏi', emoji: '🍒', topic: 'quả cây' },
  { word: 'quả mận', onset: 'm', rhyme: 'ận', tone: 'nặng', emoji: '🍑', topic: 'quả cây' },

  // Topic: đồ dùng học tập (school supplies)
  { word: 'quyển sách', onset: 's', rhyme: 'ách', tone: 'sắc', emoji: '📖', topic: 'đồ dùng học tập' },
  { word: 'cây bút', onset: 'b', rhyme: 'út', tone: 'nặng', emoji: '✏️', topic: 'đồ dùng học tập' },
  { word: 'cái cặp', onset: 'c', rhyme: 'ặp', tone: 'nặng', emoji: '🎒', topic: 'đồ dùng học tập' },
  { word: 'thước kẻ', onset: 'k', rhyme: 'ẻ', tone: 'hỏi', emoji: '📏', topic: 'đồ dùng học tập' },
  { word: 'cái bảng', onset: 'b', rhyme: 'ăng', tone: 'ngang', emoji: '📋', topic: 'đồ dùng học tập' },
  { word: 'hộp màu', onset: 'm', rhyme: 'àu', tone: 'ngang', emoji: '🖍️', topic: 'đồ dùng học tập' },
  { word: 'cục tẩy', onset: 't', rhyme: 'ẩy', tone: 'sắc', emoji: '🧽', topic: 'đồ dùng học tập' },
  { word: 'băng keo', onset: 'k', rhyme: 'eo', tone: 'ngang', emoji: '📦', topic: 'đồ dùng học tập' },
  { word: 'con dấu', onset: 'd', rhyme: 'ấu', tone: 'nặng', emoji: '🔖', topic: 'đồ dùng học tập' },
  { word: 'cái compa', onset: 'c', rhyme: 'ompa', tone: 'ngang', emoji: '📐', topic: 'đồ dùng học tập' },

  // Topic: thiên nhiên (nature)
  { word: 'mặt trời', onset: 'tr', rhyme: 'ời', tone: 'ngang', emoji: '☀️', topic: 'thiên nhiên' },
  { word: 'mặt trăng', onset: 'tr', rhyme: 'ăng', tone: 'ngang', emoji: '🌙', topic: 'thiên nhiên' },
  { word: 'ngôi sao', onset: 's', rhyme: 'ao', tone: 'ngang', emoji: '⭐', topic: 'thiên nhiên' },
  { word: 'đám mây', onset: 'm', rhyme: 'ây', tone: 'ngang', emoji: '☁️', topic: 'thiên nhiên' },
  { word: 'cầu vồng', onset: 'v', rhyme: 'ổng', tone: 'ngang', emoji: '🌈', topic: 'thiên nhiên' },
  { word: 'ngọn gió', onset: 'g', rhyme: 'ió', tone: 'sắc', emoji: '🌬️', topic: 'thiên nhiên' },
  { word: 'cây cỏ', onset: 'c', rhyme: 'ỏ', tone: 'hỏi', emoji: '🌿', topic: 'thiên nhiên' },
  { word: 'con sông', onset: 's', rhyme: 'ông', tone: 'ngang', emoji: '🏞️', topic: 'thiên nhiên' },
  { word: 'bãi biển', onset: 'b', rhyme: 'iển', tone: 'sắc', emoji: '🏖️', topic: 'thiên nhiên' },
  { word: 'núi cao', onset: 'c', rhyme: 'ao', tone: 'ngang', emoji: '⛰️', topic: 'thiên nhiên' },

  // Topic: đồ vật gia đình (household items)
  { word: 'chiếc ghế', onset: 'gh', rhyme: 'ế', tone: 'sắc', emoji: '🪑', topic: 'đồ vật gia đình' },
  { word: 'cái quạt', onset: 'qu', rhyme: 'ạt', tone: 'nặng', emoji: '🌀', topic: 'đồ vật gia đình' },
  { word: 'chiếc đèn', onset: 'đ', rhyme: 'èn', tone: 'ngang', emoji: '💡', topic: 'đồ vật gia đình' },
  { word: 'cái nồi', onset: 'n', rhyme: 'ồi', tone: 'ngang', emoji: '🍲', topic: 'đồ vật gia đình' },
  { word: 'cái chổi', onset: 'ch', rhyme: 'ổi', tone: 'sắc', emoji: '🧹', topic: 'đồ vật gia đình' },
  { word: 'cái tủ', onset: 't', rhyme: 'ủ', tone: 'hỏi', emoji: '🗄️', topic: 'đồ vật gia đình' },
  { word: 'cái giường', onset: 'gi', rhyme: 'ường', tone: 'ngang', emoji: '🛏️', topic: 'đồ vật gia đình' },
  { word: 'cái bàn', onset: 'b', rhyme: 'àn', tone: 'huyền', emoji: '🪑', topic: 'đồ vật gia đình' },
  { word: 'chiếc kệ', onset: 'k', rhyme: 'ệ', tone: 'nặng', emoji: '📚', topic: 'đồ vật gia đình' },
  { word: 'cái gương', onset: 'g', rhyme: 'ương', tone: 'ngang', emoji: '🖼️', topic: 'đồ vật gia đình' },

  // Topic: đồ ăn (food)
  { word: 'bánh mì', onset: 'm', rhyme: 'ì', tone: 'huyền', emoji: '🍞', topic: 'đồ ăn' },
  { word: 'quả trứng', onset: 'tr', rhyme: 'ứng', tone: 'ngang', emoji: '🥚', topic: 'đồ ăn' },
  { word: 'cốc sữa', onset: 's', rhyme: 'ữa', tone: 'ngang', emoji: '🥛', topic: 'đồ ăn' },
  { word: 'đĩa cơm', onset: 'c', rhyme: 'ơm', tone: 'ngang', emoji: '🍚', topic: 'đồ ăn' },
  { word: 'cốc nước', onset: 'n', rhyme: 'ước', tone: 'sắc', emoji: '🥤', topic: 'đồ ăn' },
  { word: 'củ cà rốt', onset: 'c', rhyme: 'à', tone: 'huyền', emoji: '🥕', topic: 'đồ ăn' },
  { word: 'bát phở', onset: 'ph', rhyme: 'ở', tone: 'hỏi', emoji: '🍜', topic: 'đồ ăn' },
  { word: 'dĩa bún', onset: 'b', rhyme: 'ún', tone: 'sắc', emoji: '🍜', topic: 'đồ ăn' },
  { word: 'quả ổi', onset: 'ǒi', rhyme: 'ới', tone: 'sắc', emoji: '🍐', topic: 'đồ ăn' },
  { word: 'cái bánh', onset: 'b', rhyme: 'ánh', tone: 'sắc', emoji: '🎂', topic: 'đồ ăn' },

  // Vần an / at / am / ap
  { word: 'cái bàn', onset: 'b', rhyme: 'àn', tone: 'huyền', emoji: '🪑', topic: 'vần an' },
  { word: 'bạn Lan', onset: 'L', rhyme: 'an', tone: 'ngang', emoji: '👧', topic: 'vần an' },
  { word: 'cái can', onset: 'c', rhyme: 'an', tone: 'ngang', emoji: '🌱', topic: 'vần an' },
  { word: 'con ngan', onset: 'ng', rhyme: 'an', tone: 'ngang', emoji: '🐟', topic: 'vần an' },
  { word: 'hạt cát', onset: 'c', rhyme: 'át', tone: 'sắc', emoji: '🏖️', topic: 'vần at' },
  { word: 'ca hát', onset: 'h', rhyme: 'át', tone: 'sắc', emoji: '🎤', topic: 'vần at' },
  { word: 'bát ngát', onset: 'b', rhyme: 'át', tone: 'sắc', emoji: '🥣', topic: 'vần at' },
  { word: 'mát mẻ', onset: 'm', rhyme: 'át', tone: 'sắc', emoji: '❄️', topic: 'vần at' },
  { word: 'quả cam', onset: 'c', rhyme: 'am', tone: 'ngang', emoji: '🍊', topic: 'vần am' },
  { word: 'cái đầm', onset: 'đ', rhyme: 'àm', tone: 'huyền', emoji: '👗', topic: 'vần am' },
  { word: 'bàn ghế', onset: 'gh', rhyme: 'ế', tone: 'sắc', emoji: '🪑', topic: 'vần am' },
  { word: 'cái râm', onset: 'r', rhyme: 'âm', tone: 'ngang', emoji: '🌳', topic: 'vần am' },
  { word: 'xe đạp', onset: 'đ', rhyme: 'ạp', tone: 'nặng', emoji: '🚲', topic: 'vần ap' },
  { word: 'cái nắp', onset: 'n', rhyme: 'ắp', tone: 'sắc', emoji: '🥫', topic: 'vần ap' },
  { word: 'băng keo', onset: 'k', rhyme: 'eo', tone: 'ngang', emoji: '📦', topic: 'vần ap' },
  { word: 'cái bếp', onset: 'b', rhyme: 'ếp', tone: 'nặng', emoji: '🍳', topic: 'vần ap' },

  // Vần on / ot / ong / oc
  { word: 'chú thỏ con', onset: 'c', rhyme: 'on', tone: 'ngang', emoji: '🐰', topic: 'vần on' },
  { word: 'lon ton', onset: 'l', rhyme: 'on', tone: 'ngang', emoji: '🥫', topic: 'vần on' },
  { word: 'cỏ non', onset: 'n', rhyme: 'on', tone: 'ngang', emoji: '🌿', topic: 'vần on' },
  { word: 'kẹo ngon', onset: 'ng', rhyme: 'on', tone: 'ngang', emoji: '🍬', topic: 'vần on' },
  { word: 'món ngon', onset: 'ng', rhyme: 'on', tone: 'ngang', emoji: '🍲', topic: 'vần on' },
  { word: 'con ong', onset: 'ng', rhyme: 'ong', tone: 'ngang', emoji: '🐝', topic: 'vần ong' },
  { word: 'cái bóng', onset: 'b', rhyme: 'óng', tone: 'sắc', emoji: '⚽', topic: 'vần ong' },
  { word: 'đồng hồ', onset: 'đ', rhyme: 'ồng', tone: 'ngang', emoji: '⏰', topic: 'vần ong' },
  { word: 'cây tre', onset: 'tr', rhyme: 'e', tone: 'ngang', emoji: '🎋', topic: 'vần oc' },
  { word: 'cái kẹp', onset: 'k', rhyme: 'ẹp', tone: 'nặng', emoji: '📎', topic: 'vần oc' },
  { word: 'cái bọc', onset: 'b', rhyme: 'ọc', tone: 'sắc', emoji: '📦', topic: 'vần oc' },
  { word: 'con sóc', onset: 's', rhyme: 'óc', tone: 'sắc', emoji: '🐿️', topic: 'vần oc' },

  // Vần ach / anh / ay
  { word: 'quyển sách', onset: 's', rhyme: 'ách', tone: 'sắc', emoji: '📖', topic: 'vần ach' },
  { word: 'tách trà', onset: 't', rhyme: 'ách', tone: 'sắc', emoji: '🍵', topic: 'vần ach' },
  { word: 'vá rách', onset: 'r', rhyme: 'ách', tone: 'sắc', emoji: '🧵', topic: 'vần ach' },
  { word: 'viên gạch', onset: 'g', rhyme: 'ách', tone: 'sắc', emoji: '🧱', topic: 'vần ach' },
  { word: 'cây xanh', onset: 'x', rhyme: 'anh', tone: 'ngang', emoji: '🌳', topic: 'vần anh' },
  { word: 'anh trai', onset: '', rhyme: 'anh', tone: 'ngang', emoji: '👦', topic: 'vần anh' },
  { word: 'bức tranh', onset: 'tr', rhyme: 'anh', tone: 'ngang', emoji: '🖼️', topic: 'vần anh' },
  { word: 'cành chanh', onset: 'ch', rhyme: 'anh', tone: 'ngang', emoji: '🍋', topic: 'vần anh' },
  { word: 'máy bay', onset: 'b', rhyme: 'ay', tone: 'ngang', emoji: '✈️', topic: 'vần ay' },
  { word: 'đôi tay', onset: 't', rhyme: 'ay', tone: 'ngang', emoji: '🤲', topic: 'vần ay' },
  { word: 'cỏ may', onset: 'm', rhyme: 'ay', tone: 'ngang', emoji: '🌿', topic: 'vần ay' },
  { word: 'bàn tay', onset: 'b', rhyme: 'ay', tone: 'ngang', emoji: '🖐️', topic: 'vần ay' },
];

/**
 * Get words by topic.
 */
export function getWordsByTopic(topic: string): WordBankEntry[] {
  return WORD_BANK.filter((w) => w.topic === topic);
}

/**
 * Get words by rhyme family.
 */
export function getWordsByRhyme(rhyme: string): WordBankEntry[] {
  return WORD_BANK.filter((w) => w.rhyme === rhyme);
}

/**
 * Get distinct topics available.
 */
export function getAllTopics(): string[] {
  return [...new Set(WORD_BANK.map((w) => w.topic))];
}

/**
 * Get distinct rhymes available.
 */
export function getAllRhymes(): string[] {
  return [...new Set(WORD_BANK.map((w) => w.rhyme))];
}