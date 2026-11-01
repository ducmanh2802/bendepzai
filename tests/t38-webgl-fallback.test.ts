import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { probeWebGL } from '../src/components/learning/chess/chess3d/webglSupport';

const read = (rel: string) => fs.readFileSync(path.resolve(rel), 'utf8');

interface FakeGl {
  RENDERER?: number;
  getParameter: (p: number) => unknown;
  getExtension: (name: string) => unknown;
}

/**
 * Canvas giả theo đúng luật của trình duyệt: một canvas chỉ gắn được MỘT loại
 * context, webgl2 thử trước rồi mới tới webgl1.
 */
function fakeCanvas(opts: {
  gl2?: FakeGl | null;
  gl1?: FakeGl | null;
  throwOn?: string;
  lose?: () => void;
  calls?: string[];
}) {
  const { gl2 = null, gl1 = null, throwOn, lose, calls = [] } = opts;
  let bound: string | null = null;
  return {
    calls,
    getContext(id: string) {
      calls.push(id);
      if (throwOn === id) throw new Error('blocked by policy');
      if (bound && bound !== id) return null; // đã gắn context loại khác
      if (id === 'webgl2') {
        if (!gl2) return null;
        bound = id;
        return gl2;
      }
      if (id === 'webgl') {
        if (!gl1) return null;
        bound = id;
        return gl1;
      }
      return null;
    },
  };
}

function fakeGl(renderer: string | null, withDebugInfo = true): FakeGl {
  const exts: Record<string, unknown> = {
    WEBGL_lose_context: { loseContext: () => loseCalls.push('lose') },
  };
  if (withDebugInfo) exts.WEBGL_debug_renderer_info = { UNMASKED_RENDERER_WEBGL: 37445 };
  return {
    RENDERER: 7936,
    getParameter: () => renderer,
    getExtension: (name: string) => exts[name] ?? null,
  };
}

let loseCalls: string[] = [];

describe('T38 — bàn cờ vua 3D không bao giờ để bé gặp màn trắng', () => {
  describe('probeWebGL (module thuần, chạy được trong node)', () => {
    it('máy không có WebGL → supported = false, không ném', () => {
      loseCalls = [];
      const c = fakeCanvas({ gl2: null, gl1: null });
      expect(probeWebGL(() => c)).toEqual({ supported: false, software: false });
    });

    it('webgl2 hỏng thì vẫn thử webgl1 trên CÙNG một canvas', () => {
      loseCalls = [];
      const c = fakeCanvas({ gl2: null, gl1: fakeGl('ANGLE (Intel Iris)') });
      const r = probeWebGL(() => c);
      expect(r.supported).toBe(true);
      expect(c.calls).toEqual(['webgl2', 'webgl']); // một canvas, hai lần hỏi
    });

    it('GPU phần mềm (SwiftShader/llvmpipe) → software = true để tắt antialias', () => {
      loseCalls = [];
      for (const gpu of ['SwiftShader', 'llvmpipe (LLVM 15)', 'Google API Basic Render']) {
        const c = fakeCanvas({ gl2: fakeGl(gpu) });
        expect(probeWebGL(() => c).software).toBe(true);
      }
      const c = fakeCanvas({ gl2: fakeGl('ANGLE (NVIDIA GeForce RTX 3060)') });
      expect(probeWebGL(() => c).software).toBe(false);
    });

    it('luôn nhả context thăm dò — browser chỉ giữ ~16 context sống', () => {
      loseCalls = [];
      const c = fakeCanvas({ gl2: fakeGl('ANGLE (AMD)', false) });
      expect(probeWebGL(() => c).supported).toBe(true);
      expect(loseCalls).toEqual(['lose']);
    });

    it('getContext ném (chính sách chặn / chế độ ẩn danh) → coi như không hỗ trợ', () => {
      loseCalls = [];
      const c = fakeCanvas({ throwOn: 'webgl2' });
      expect(probeWebGL(() => c)).toEqual({ supported: false, software: true });
    });
  });

  describe('đường đi của lỗi trong Chess3DCanvas + ChessGame', () => {
    const canvas = read('src/components/learning/chess/chess3d/Chess3DCanvas.tsx');
    const game = read('src/components/learning/chess/ChessGame.tsx');

    it('thăm dò bằng probeWebGL và rút bàn 2D khi không hỗ trợ', () => {
      expect(canvas).toContain('probeWebGL(() => document.createElement(');
      expect(canvas).toContain('if (!probe.supported) {');
      expect(canvas).toContain('onUnsupported?.()');
    });

    it('bọc WebGLRenderer trong try/catch — trình duyệt báo có nhưng vẫn ném được', () => {
      expect(canvas).toMatch(/try \{\s*\n\s*renderer = new THREE\.WebGLRenderer/);
    });

    it('bắt webglcontextlost giữa ván và nhả context khi rút bàn', () => {
      expect(canvas).toContain("addEventListener('webglcontextlost', handleContextLost)");
      expect(canvas).toContain("removeEventListener('webglcontextlost', handleContextLost)");
      expect(canvas).toContain('renderer.forceContextLoss()');
    });

    it('fallback hiện bàn 2D kèm thông báo cho ba mẹ, có testid cho probe', () => {
      expect(game).toContain('data-testid="chess-3d-fallback"');
      expect(game).toContain('setGlFallback(true)');
      expect(game).toContain("setViewMode('2d')");
      expect(game).toContain('role="status"');
      // Chuỗi phải tiếng Việt có dấu, không lộ mã máy
      expect(game).toMatch(/chưa vẽ được bàn cờ 3D/);
      expect(game).not.toContain('WebGL context creation failed');
    });
  });
});
