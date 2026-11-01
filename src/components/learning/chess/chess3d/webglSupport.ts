/**
 * Thăm dò WebGL cho bàn cờ vua 3D.
 *
 * Tách ra module thuần (không import `three`, không đụng `document`) vì hai lý do:
 * 1. `three` nặng — màn fallback 2D không được trả giá tải `three-vendor`.
 * 2. Logic này quyết định bé có được thấy bàn cờ hay một màn trắng, phải test
 *    được bằng canvas giả trong node (repo chạy Vitest môi trường node, không jsdom).
 */

/** Trình duyệt vẽ WebGL bằng CPU — chấp nhận được nhưng phải tắt antialias/shadow. */
const SOFTWARE_GPU = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i;

export interface WebGLProbeResult {
  supported: boolean;
  software: boolean;
}

interface GlLike {
  RENDERER?: number;
  getParameter?: (p: number) => unknown;
  getExtension?: (name: string) => unknown;
}

/**
 * Chỉ đúng phần canvas mà phép thăm dò cần. `HTMLCanvasElement` của DOM lib khai
 * `getContext` theo chuỗi literal ("2d", "webgl", …) nên không gán trực tiếp vào
 * kiểu này được — nơi gọi cast một lần, đổi lại hàm test được bằng canvas giả.
 */
export interface WebGLProbeCanvas {
  getContext?: (id: 'webgl2' | 'webgl', attrs?: unknown) => GlLike | null;
}

/**
 * Tạo context trên MỘT canvas rồi nhả ngay bằng `WEBGL_lose_context`.
 *
 * Trình duyệt chỉ giữ khoảng 16 context WebGL sống cùng lúc. Trước đây màn cờ
 * tạo hai canvas thăm dò (một để đọc tên GPU, một để kiểm tra hỗ trợ) và không
 * bao giờ nhả, nên sau vài lần vào/ra là `new WebGLRenderer()` ném — đúng lúc
 * bé cần chơi nhất.
 */
export function probeWebGL(makeCanvas: () => WebGLProbeCanvas): WebGLProbeResult {
  let gl: GlLike | null = null;
  try {
    const canvas = makeCanvas();
    // Cùng một canvas: webgl2 không tạo được thì mới xin webgl1.
    gl = canvas.getContext?.('webgl2') ?? canvas.getContext?.('webgl') ?? null;
    if (!gl) return { supported: false, software: false };
    const ext = (gl.getExtension?.('WEBGL_debug_renderer_info') ?? null) as
      | { UNMASKED_RENDERER_WEBGL?: number }
      | null;
    const param = ext && ext.UNMASKED_RENDERER_WEBGL != null ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter?.(param as number) ?? '');
    return { supported: true, software: SOFTWARE_GPU.test(gpu) };
  } catch {
    // Chế độ ẩn danh / chính sách chặn WebGL: coi như không hỗ trợ, về bàn 2D.
    return { supported: false, software: true };
  } finally {
    try {
      (gl?.getExtension?.('WEBGL_lose_context') as { loseContext?: () => void } | null)?.loseContext?.();
    } catch {
      // Nhả context thất bại thì mặc kệ — đã có fallback.
    }
  }
}
