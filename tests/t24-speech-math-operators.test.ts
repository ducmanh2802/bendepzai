import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { toSpeechText } from '../src/services/speechText';
import { sound } from '../src/services/sound';

/**
 * T24 — phép tính `+ - =` phải ĐỌC ĐƯỢC bằng lời.
 *
 * Bối cảnh đo được 2026-10-30: 24/475 câu trong kho thi mang ký hiệu trong văn
 * bản đọc ("Tính: 6 + 4 = ?"), trong khi 260 câu Toán của curriculum đã có
 * `audioPrompt` viết bằng lời. Giọng tiếng Việt của nền tảng bỏ qua `+`, `−`,
 * `=` nên bé chỉ nghe "sáu bốn" và mất ngữ cảnh. Lớp `toSpeechText` nối lại
 * câu nói ngay trước khi vào utterance, không sửa chữ hiển thị.
 */

const here = dirname(fileURLToPath(import.meta.url));
const vi = 'vi-VN';

describe('toSpeechText — đọc phép tiếng Việt', () => {
  it('đổi cộng/trừ/bằng và dấu hỏi thành lời', () => {
    expect(toSpeechText('Tính: 6 + 4 = ?', vi)).toBe('Tính: 6 cộng 4 bằng mấy');
    expect(toSpeechText('Tính: 10 - 7 = ?', vi)).toBe('Tính: 10 trừ 7 bằng mấy');
    expect(toSpeechText('Kết quả của phép tính 6 + 2 là bao nhiêu?', vi)).toBe(
      'Kết quả của phép tính 6 cộng 2 là bao nhiêu?'
    );
  });

  it('dùng dấu trừ toán học U+2212 cũng đọc được', () => {
    expect(toSpeechText('Tính: 9 − 4 = ?', vi)).toBe('Tính: 9 trừ 4 bằng mấy');
  });

  it('đổi hết chuỗi phép tính, không chỉ phép đầu tiên', () => {
    expect(toSpeechText('Tính nhẩm nhanh: 12 + 3 + 2 = ?', vi)).toBe(
      'Tính nhẩm nhanh: 12 cộng 3 cộng 2 bằng mấy'
    );
  });

  it('đọc mệnh đề có kết quả số', () => {
    expect(toSpeechText('Đánh giá mệnh đề: "6 + 4 = 11."', vi)).toBe(
      'Đánh giá mệnh đề: "6 cộng 4 bằng 11."'
    );
    expect(toSpeechText('Vòng Hương 7: 2 + 3 = 5.', vi)).toBe('Vòng Hương 7: 2 cộng 3 bằng 5.');
  });

  it('chỗ chấm đứng TRƯỚC cũng đọc được dấu phép (bằng chứng thiết bị thật)', () => {
    // Probe qa/audio.mjs ngày 2026-10-30 ghi lại đúng hai chuỗi này từ đề thi thật:
    // vế trái là chỗ chấm cần điền nên không có chữ số nào bên trái dấu phép.
    expect(toSpeechText('Chung kết 4: Điền số: ... + 27 = 60', vi)).toBe(
      'Chung kết 4: Điền số: ... cộng 27 bằng 60'
    );
    expect(toSpeechText('Tìm số bị trừ: ... - 3 = 7', vi)).toBe('Tìm số bị trừ: ... trừ 3 bằng 7');
    expect(toSpeechText('Tính: … + 5 = 12', vi)).toBe('Tính: … cộng 5 bằng 12');
  });

  it('chỗ chấm cuối câu là "bằng bao nhiêu"', () => {
    expect(toSpeechText('Điền số vào chỗ chấm: 13 - 4 = ...', vi)).toBe(
      'Điền số vào chỗ chấm: 13 trừ 4 bằng bao nhiêu'
    );
  });

  it('không bịa lời cho chỗ chấm so sánh (bé phải tự chọn dấu)', () => {
    expect(toSpeechText('Chọn dấu thích hợp điền vào chỗ chấm: 8 + 2 ... 9', vi)).toBe(
      'Chọn dấu thích hợp điền vào chỗ chấm: 8 cộng 2 ... 9'
    );
  });
});

describe('toSpeechText — không đọc nhầm dấu gạch không phải phép tính', () => {
  it('giữ nguyên dãy số trong ngoặc vuông (dấu gạch là phân cách)', () => {
    const src = 'Quy luật số: [1 - 3 - 5], [2 - 4 - 6], [3 - 5 - ?]. Số cần điền là số nào?';
    expect(toSpeechText(src, vi)).toBe(src);
  });

  it('giữ en dash trong khoảng giá trị', () => {
    const src = 'Recognize numbers (1–3) with digits';
    expect(toSpeechText(src, 'en-GB')).toBe(src);
  });

  it('không đụng dấu gạch trong tên file / số âm đứng một mình', () => {
    expect(toSpeechText('mở file add-sub-10 nhé', vi)).toBe('mở file add-sub-10 nhé');
    expect(toSpeechText('Nhiệt độ -5 độ', vi)).toBe('Nhiệt độ -5 độ');
  });

  it('GIỚI HẠN ĐÃ BIẾT: ngày viết kiểu 30-10 sẽ đọc thành "30 trừ 10"', () => {
    // Toàn bộ văn bản đọc của app (260 câu Toán + 475 câu thi, đo 2026-10-30) không
    // có dạng ngày kiểu này; ghi lại thành test để nếu sau này thêm ngày/tháng vào
    // đề, hành vi này là thứ bị đỏ chứ không âm thầm đọc sai cho bé.
    expect(toSpeechText('sinh ngày 30-10', vi)).toBe('sinh ngày 30 trừ 10');
  });

  it('văn bản đã viết bằng lời thì giữ nguyên', () => {
    const src = 'Ba cộng hai bằng mấy?';
    expect(toSpeechText(src, vi)).toBe(src);
  });

  it('idempotent — đọc lại lần hai không đổi thêm', () => {
    for (const src of [
      'Tính: 6 + 4 = ?',
      '12 + 3 + 2 = ?',
      '[1 - 3 - 5]',
      'Add the numbers: 6 + 4 = ...',
      'Chung kết 4: Điền số: ... + 27 = 60',
      'Tìm số bị trừ: ... - 3 = 7',
    ]) {
      const once = toSpeechText(src, vi);
      expect(toSpeechText(once, vi)).toBe(once);
    }
  });
});

describe('toSpeechText — tiếng Anh dùng từ tiếng Anh', () => {
  it('plus / minus / equals cho đề song ngữ', () => {
    expect(toSpeechText('Add the numbers: 6 + 4 = ...', 'en-GB')).toBe(
      'Add the numbers: 6 plus 4 equals what'
    );
    expect(toSpeechText('Tính: 6 + 4 = ?', 'en-US')).toBe('Tính: 6 plus 4 equals what');
  });
});

describe('âm thanh thật nhận văn bản đã nối lời', () => {
  const savedWindow = (globalThis as Record<string, unknown>).window;
  const savedUtterance = (globalThis as Record<string, unknown>).SpeechSynthesisUtterance;

  afterEach(() => {
    if (savedWindow === undefined) delete (globalThis as Record<string, unknown>).window;
    else (globalThis as Record<string, unknown>).window = savedWindow;
    if (savedUtterance === undefined) delete (globalThis as Record<string, unknown>).SpeechSynthesisUtterance;
    else (globalThis as Record<string, unknown>).SpeechSynthesisUtterance = savedUtterance;
  });

  it('sound.speak đưa "6 cộng 4 bằng mấy" vào SpeechSynthesisUtterance', () => {
    const handed: string[] = [];
    class FakeUtterance {
      text: string;
      lang = '';
      rate = 1;
      pitch = 1;
      voice: unknown = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    (globalThis as Record<string, unknown>).SpeechSynthesisUtterance = FakeUtterance;
    (globalThis as Record<string, unknown>).window = {
      speechSynthesis: {
        paused: false,
        cancel: () => {},
        speak: (u: FakeUtterance) => handed.push(u.text),
        getVoices: () => [],
      },
    };

    sound.speak('Tính: 6 + 4 = ?', 'vi-VN');
    sound.speak('Add the numbers: 6 + 4 = ...', 'en-GB');

    expect(handed).toEqual(['Tính: 6 cộng 4 bằng mấy', 'Add the numbers: 6 plus 4 equals what']);
  });
});

describe('cả hai đường đọc tiếng nói đều qua lớp nối lời', () => {
  it('sound.speak dùng toSpeechText', () => {
    const src = readFileSync(join(here, '..', 'src', 'services', 'sound.ts'), 'utf8');
    expect(src).toContain("new SpeechSynthesisUtterance(toSpeechText(text, lang))");
  });

  it('useSpeak (nút "Đọc câu hỏi" của bài học/đấu trường) dùng toSpeechText', () => {
    const src = readFileSync(join(here, '..', 'src', 'hooks', 'useSpeak.ts'), 'utf8');
    expect(src).toContain("new SpeechSynthesisUtterance(toSpeechText(text, lang))");
  });

  it('toSpeechText không phải hàm xoá dấu: text hiển thị vẫn nguyên văn đề', () => {
    // questionAudio.ts assert so sánh text nói với canonical text; lớp nối lời đặt
    // SAU assert nên contract routing (§21) không đổi.
    const audio = readFileSync(join(here, '..', 'src', 'services', 'questionAudio.ts'), 'utf8');
    expect(audio).not.toContain('toSpeechText');
  });
});
