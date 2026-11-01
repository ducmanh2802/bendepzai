import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { sound } from '../src/services/sound';
import { buildRounds as buildReadDoRounds } from '../src/data/games/read_and_do';
import { buildRounds as buildClockRounds } from '../src/data/games/clock_builder';

const read = (rel: string) => fs.readFileSync(path.resolve(rel), 'utf8');

const GAME_DIR = 'src/components/games';

function gameFiles() {
  return fs
    .readdirSync(path.resolve(GAME_DIR))
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => path.join(GAME_DIR, f));
}

describe('T32 — vòng chơi reset đúng khi chơi lại, phần thưởng không mất, tiếng không vọng', () => {
  describe('mỗi vòng chơi reset theo nonce chứ không chỉ theo id', () => {
    it('không còn effect nào chỉ dựa vào current.id', () => {
      const bad = gameFiles().filter((f) => /\}, \[current\.id\]\);/.test(read(f)));
      expect(bad).toEqual([]);
    });

    it('không còn stage component nào mount bằng key={current.id} trần', () => {
      const bad = gameFiles().filter((f) => /key=\{current\.id\}/.test(read(f)));
      expect(bad).toEqual([]);
    });

    it('đủ 13 trò chơi có trạng thái theo vòng đã ghim stage.nonce', () => {
      const keyed = gameFiles().filter((f) => {
        const src = read(f);
        return /\}, \[current\.id, stage\.nonce\]\);/.test(src) || /key=\{`\$\{current\.id\}-\$\{stage\.nonce\}`\}/.test(src);
      });
      expect(keyed.length).toBeGreaterThanOrEqual(13);
      for (const name of [
        'SimonSaysGame.tsx',
        'ReadAndDoGame.tsx',
        'ClockBuilderGame.tsx',
        'TenFrameMarketGame.tsx',
        'TreasureCodingGame.tsx',
        'ConnectDotsGame.tsx',
        'ShadowMatchGame.tsx',
        'PixelMosaicGame.tsx',
      ]) {
        expect(keyed.some((f) => f.endsWith(name)), name).toBe(true);
      }
    });
  });

  describe('id vòng do builder sinh ra không đủ để nhận diện một lượt chơi', () => {
    it('read_and_do: vòng cùng vị trí trùng id nhưng khác câu giữa hai lượt', () => {
      const first = buildReadDoRounds(1, 0);
      const second = buildReadDoRounds(1, 1);
      const collided = first.filter((r, i) => r.id === second[i].id && r.sentence !== second[i].sentence);
      expect(collided.length).toBeGreaterThan(0);
      expect(collided.every((r) => /^rd-t1-\d+-\d+$/.test(r.id))).toBe(true);
    });

    it('clock_builder: id chỉ chứa giờ nên cũng trùng giữa hai lượt', () => {
      const first = buildClockRounds(1, 0);
      const second = buildClockRounds(1, 1);
      expect(first.filter((r, i) => r.id === second[i].id).length).toBeGreaterThan(0);
    });
  });

  describe('chọn màn lại được hứa thưởng thật, không bị dấu vết lượt trước chặn', () => {
    const wrapper = read('src/components/games/GameModalWrapper.tsx');

    it('có một hàm dọn trạng thái thưởng dùng chung cho chơi lại và chọn màn', () => {
      expect(wrapper).toMatch(/const resetRewardState = \(\) => \{\s*claimedKeys\.current\.clear\(\);/);
      expect(wrapper.match(/resetRewardState\(\);/g)?.length).toBeGreaterThanOrEqual(2);
    });

    it('handleSelectTier dọn dấu vết trước khi đổi màn', () => {
      const block = wrapper.slice(
        wrapper.indexOf('const handleSelectTier'),
        wrapper.indexOf('const isLevelGame')
      );
      expect(block).toContain('resetRewardState();');
    });
  });

  describe('đồng hồ Đường Đua không đếm khi bảng chọn màn che bảng chơi', () => {
    const racing = read('src/components/games/MathSpeedRacingGame.tsx');

    it('wrapper báo hiệu lớp phủ đang mở', () => {
      expect(wrapperProp()).toContain('onOverlayOpenChange?: (open: boolean) => void;');
      expect(wrapperProp()).toContain('onOverlayOpenChange?.(showTierModal);');
    });

    it('game dừng tick khi bảng chọn mở', () => {
      expect(racing).toContain('onOverlayOpenChange={setPickerOpen}');
      expect(racing).toMatch(/stage\.phase !== 'playing' \|\| pickerOpen/);
      expect(racing).toMatch(/\[budgetMs, stage\.roundIdx, stage\.locked, stage\.phase, pickerOpen\]/);
    });

    function wrapperProp() {
      return read('src/components/games/GameModalWrapper.tsx');
    }
  });

  describe('Đọc Và Làm tôn trọng thứ tự hành động của câu', () => {
    const src = read('src/components/games/ReadAndDoGame.tsx');

    it('chỉ chấp nhận bước kế tiếp thay vì mọi bước còn lại', () => {
      expect(src).toMatch(/const isCorrectDrop = \(objectId: string, placeId: string\) =>\s*!!pendingMove &&/);
      expect(src).not.toContain('idx >= doneMoves');
    });
  });

  describe('Bắt Chữ Cái không đổi chữ đích theo pool cũ', () => {
    const src = read('src/components/games/CatchFallingLettersGame.tsx');

    it('nạp pool và đặt chữ đích trong cùng một effect', () => {
      const effect = src.slice(src.indexOf('const items = getGameItems'), src.indexOf('const pickNewTarget'));
      expect(effect).toContain('setTargetPool(pool);');
      expect(effect).toContain('setTargetChar(pool[0] ?? config.pool[0]);');
      expect(effect).toContain('setBubbles([]);');
      expect(effect).toContain('[stage.tier, stage.nonce, roundsPerTier]');
    });

    it('không còn effect chỉ theo stage.tier gọi pickNewTarget', () => {
      expect(src).not.toMatch(/setBubbles\(\[\]\);\s*pickNewTarget\(\);\s*\}, \[stage\.tier\]\);/);
    });
  });

  describe('lời khen hẹn giờ cắt được khi đóng trò chơi', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // SoundService nói chuyện với window; test chạy ở môi trường node nên
      // cần cửa sổ giả tối thiểu (không có speechSynthesis -> speak tự bỏ qua).
      (globalThis as unknown as { window: unknown }).window = {
        setTimeout: globalThis.setTimeout,
        clearTimeout: globalThis.clearTimeout,
      };
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
      delete (globalThis as unknown as { window?: unknown }).window;
    });

    it('speakLater đọc đúng sau độ trễ', () => {
      const speak = vi.spyOn(sound, 'speak');
      sound.speakLater('Bé giỏi lắm!', 'vi-VN', 350);
      expect(speak).not.toHaveBeenCalled();
      vi.advanceTimersByTime(400);
      expect(speak).toHaveBeenCalledTimes(1);
      expect(speak).toHaveBeenCalledWith('Bé giỏi lắm!', 'vi-VN');
      speak.mockRestore();
    });

    it('stopSpeaking huỷ lời còn đang chờ để không vang ở màn hình khác', () => {
      const speak = vi.spyOn(sound, 'speak');
      sound.speakLater('Great job!', 'en-GB', 350);
      sound.speakLater('Còn một việc nữa!', 'vi-VN', 100);
      sound.stopSpeaking();
      vi.advanceTimersByTime(1000);
      expect(speak).not.toHaveBeenCalled();
      speak.mockRestore();
    });

    it('không còn setTimeout gọi thẳng sound.speak mà không giao cho timer để tự huỷ', () => {
      const hits: string[] = [];
      const walk = (d: string) => {
        for (const e of fs.readdirSync(path.resolve(d), { withFileTypes: true })) {
          const p = path.join(d, e.name);
          if (e.isDirectory()) walk(p);
          else if (e.name.endsWith('.tsx')) {
            const src = read(p);
            const re = /setTimeout\(\s*\(\)\s*=>\s*\{?\s*sound\.speak\(/g;
            let m: RegExpExecArray | null;
            while ((m = re.exec(src))) {
              const before = (src.slice(0, m.index).split('\n').pop() ?? '').trimEnd();
              if (before.endsWith('=')) continue;
              hits.push(`${p}:${src.slice(0, m.index).split('\n').length}`);
            }
          }
        }
      };
      walk('src/components');
      expect(hits).toEqual([]);
    });

    it('GameModalWrapper cắt tiếng khi unmount', () => {
      expect(read('src/components/games/GameModalWrapper.tsx')).toContain(
        'React.useEffect(() => () => sound.stopSpeaking(), []);'
      );
    });
  });

  describe('nút icon-only phải có tên để bàn phím và screen reader dùng được', () => {
    it('nút đóng Bảng Phụ Huynh, Kết Quả Bài Thi, Bảng Chọn Màn đều có aria-label', () => {
      expect(read('src/components/parent/ParentDashboardModal.tsx')).toContain(
        'aria-label="Đóng bảng điều khiển phụ huynh"'
      );
      expect(read('src/components/competition/CompetitionResultModal.tsx')).toContain(
        'aria-label="Đóng bảng kết quả bài thi"'
      );
      expect(read('src/components/games/GameModalWrapper.tsx')).toContain('aria-label="Đóng bảng chọn màn"');
    });

    it('mọi <X> trong hai modal đó là ảnh trang trí (aria-hidden)', () => {
      for (const f of [
        'src/components/parent/ParentDashboardModal.tsx',
        'src/components/competition/CompetitionResultModal.tsx',
      ]) {
        const src = read(f);
        const icons = src.match(/<X className="w-5 h-5"[^>]*>/g) ?? [];
        expect(icons.length).toBeGreaterThan(0);
        for (const icon of icons) expect(icon).toContain('aria-hidden');
      }
    });
  });

  describe('chữ trên màn là tiếng Việt có dấu', () => {
    it('thẻ trang chủ Luyện Đọc bỏ tiếng Anh lẻ loi', () => {
      const home = read('src/components/home/HomeScreen.tsx');
      expect(home).not.toContain('Đọc fluently');
      expect(home).toContain("desc: 'Đọc trôi chảy'");
    });

    it('hộp mừng lên cấp dùng chữ "Cấp độ" trong text nhìn thấy', () => {
      const modal = read('src/components/motivation/LevelUpCelebrationModal.tsx');
      expect(modal).toContain('Cấp độ mới');
      expect(modal).toContain('Các Cấp Độ Vừa Nhận Thưởng');
      const visibleEnglish = [...modal.matchAll(/>([^<>{}]*)</g)]
        .map((m) => m[1])
        .filter((t) => /\bLevel\b/i.test(t));
      expect(visibleEnglish).toEqual([]);
    });
  });
});
