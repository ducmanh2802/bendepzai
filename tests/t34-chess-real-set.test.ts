import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { createPieceMesh } from '../src/components/learning/chess/chess3d/pieceGeometries';
import { buildChessBoard3D } from '../src/components/learning/chess/chess3d/boardBuilder';
import type { PieceType } from '../src/components/learning/chess/chessEngine';

const read = (rel: string) => fs.readFileSync(path.resolve(rel), 'utf8');
const TYPES: PieceType[] = ['p', 'r', 'n', 'b', 'q', 'k'];

/** Chiều cao thật của quân trong scene (khác chiều cao khai báo vì đầu mã vươn lên trên thân). */
function measure(type: PieceType) {
  const box = new THREE.Box3().setFromObject(createPieceMesh(type, 'w'));
  const size = new THREE.Vector3();
  box.getSize(size);
  return { height: size.y, base: Math.max(size.x, size.z) };
}

describe('T34 — bộ cờ vua trông như bộ cờ gỗ ngoài đời', () => {
  describe('quân 3D theo tỉ lệ Staunton', () => {
    it('chiều cao tăng dần đúng thứ hạng quân thật', () => {
      const h = Object.fromEntries(TYPES.map((t) => [t, measure(t).height]));
      expect(h.p).toBeLessThan(h.r);
      expect(h.r).toBeLessThan(h.n);
      expect(h.n).toBeLessThan(h.b);
      expect(h.b).toBeLessThan(h.q);
      // Vua phải cao hơn Hậu rõ rệt (bộ thật: 3.35" so với 2.6"), không chỉ hơn vài mm.
      expect(h.q).toBeLessThan(h.k * 0.88);
    });

    it('đế mọi quân nhỏ hơn một ô cờ để đứng cạnh nhau không chạm nhau', () => {
      for (const t of TYPES) expect(measure(t).base).toBeLessThan(0.8);
    });
  });

  describe('không còn chi tiết mạ vàng', () => {
    it('pieceGeometries và ChessPieceSvg bỏ hết mã màu vàng kim loại', () => {
      const gold = ['0xfde047', '0xf59e0b', '0xb45309', '0xd97706', '#fde047', '#f59e0b', '#b45309', '#d97706'];
      const geo = read('src/components/learning/chess/chess3d/pieceGeometries.ts');
      const svg = read('src/components/learning/chess/ChessPieceSvg.tsx');
      for (const hex of gold) {
        expect(geo).not.toContain(hex);
        expect(svg).not.toContain(hex);
      }
      expect(geo).not.toContain('goldMat');
      // Ngọc đỏ trên miện vua cũng là đồ nhựa màu, không phải bộ gỗ tiện.
      expect(svg).not.toContain('#ef4444');
    });

    it('vật liệu quân và bàn đều lì (metalness = 0) như gỗ đánh vecni', () => {
      const geo = read('src/components/learning/chess/chess3d/pieceGeometries.ts');
      const metalness = [...geo.matchAll(/metalness:\s*([\d.]+)/g)].map((m) => Number(m[1]));
      expect(metalness.length).toBeGreaterThan(0);
      expect(metalness.every((v) => v === 0)).toBe(true);
    });
  });

  describe('bàn 3D', () => {
    it('khắc cột a–h in thường và hàng 1–8 trên viền gỗ', () => {
      const src = read('src/components/learning/chess/chess3d/boardBuilder.ts');
      expect(src).toContain("['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']");
      expect(src).toMatch(/createCoordTexture/);
      expect(src).not.toContain("['A', 'B'");
    });

    it('64 ô có rãnh kẻ: mặt lát hẹp hơn pitch và tấm lát tối chỉ lộ trong khe', () => {
      const board = buildChessBoard3D();
      const a = new THREE.Box3().setFromObject(board.squareMeshes[0][0]);
      const b = new THREE.Box3().setFromObject(board.squareMeshes[0][1]);
      const w = a.max.x - a.min.x;
      expect(w).toBeLessThan(1); // còn khe giữa hai ô ⇒ có đường kẻ
      expect(1 - w).toBeGreaterThanOrEqual(0.1); // khe ≥ 10% ô: nhìn nghiêng vẫn thấy
      expect(w).toBeGreaterThan(0.85); // nhưng vẫn liền thành mặt bàn, không phải ô rời
      expect(Math.abs((b.max.x + b.min.x) / 2 - (a.max.x + a.min.x) / 2)).toBeCloseTo(1, 6);
      const inlay = board.boardGroup.children.find((o) => o.name === 'board_inlay');
      expect(inlay).toBeDefined();
      const ib = new THREE.Box3().setFromObject(inlay!);
      expect(ib.max.x - ib.min.x).toBeCloseTo(8, 6);
      expect(ib.max.y).toBeLessThan(a.max.y); // nằm dưới mặt ô, không che bàn
    });

    it('lưới kẻ ô phủ kín mặt bàn, nằm sát dưới đỉnh ô để nhìn nghiêng vẫn rõ nét', () => {
      const board = buildChessBoard3D();
      const grid = board.boardGroup.children.find((o) => o.name === 'board_grid_lines');
      expect(grid).toBeDefined();
      const gb = new THREE.Box3().setFromObject(grid!);
      expect(gb.max.x - gb.min.x).toBeCloseTo(8, 6);
      expect(gb.max.z - gb.min.z).toBeCloseTo(8, 6);
      const tileTop = new THREE.Box3().setFromObject(board.squareMeshes[0][0]).max.y;
      // Sát dưới mặt lát: cao hơn sẽ che quân, thấp hơn nhiều sẽ bị phối cảnh làm mờ.
      expect(gb.max.y).toBeLessThan(tileTop);
      expect(tileTop - gb.max.y).toBeLessThanOrEqual(0.002);
      // Lưới phải trong suốt ở phần ô (không che vân gỗ), chỉ đặc ở nét kẻ
      const mat = (grid as THREE.Mesh).material as THREE.MeshBasicMaterial;
      expect(mat.transparent).toBe(true);
    });

    it('ô góc a1 tối, h1 sáng và hai ô kề nhau luôn khác tông', () => {
      // Bàn thật đặt "trắng ở tay phải": ô góc bên phải người chơi phải là ô sáng.
      const board = buildChessBoard3D();
      const lum = (r: number, c: number) => {
        const m = board.squareMeshes[r][c].material as THREE.MeshStandardMaterial;
        return m.color.r * 0.299 + m.color.g * 0.587 + m.color.b * 0.114;
      };
      expect(lum(7, 0)).toBeLessThan(lum(7, 7)); // a1 tối, h1 sáng
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          // ô sáng khi (r + c) chẵn ⇒ mọi cặp kề nhau phải đổi tông
          const light = (x: number, y: number) => lum(x, y) > 0.6;
          expect(light(r, c)).toBe((r + c) % 2 === 0);
          if (c < 7) expect(light(r, c)).not.toBe(light(r, c + 1));
          if (r < 7) expect(light(r, c)).not.toBe(light(r + 1, c));
        }
      }
      // Tương phản đủ mạnh để bé phân biệt khi nhìn nghiêng
      expect(Math.abs(lum(0, 0) - lum(0, 1))).toBeGreaterThan(0.2);
    });

    it('viền chỉ ôm bốn cạnh, không có tấm gỗ nào phủ kín mặt bàn', () => {
      const board = buildChessBoard3D();
      const tileTop = new THREE.Box3()
        .setFromObject(board.squareMeshes[0][0])
        .max.y;
      const cheaters: string[] = [];
      board.boardGroup.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const box = new THREE.Box3().setFromObject(child);
        const w = box.max.x - box.min.x;
        const d = box.max.z - box.min.z;
        // Một tấm ≥ 8x8 ô nằm cao hơn mặt ô sẽ che toàn bộ bàn (lỗi đã gặp khi thay viền vàng).
        if (w >= 8 && d >= 8 && box.max.y > tileTop + 0.001) cheaters.push(child.name || child.uuid);
      });
      expect(cheaters).toEqual([]);
    });
  });

  describe('bàn 2D và thẻ quân', () => {
    it('bàn 2D dùng khung gỗ óc chó, có dải a–h và 1–8, không còn viền vàng', () => {
      const src = read('src/components/learning/chess/ChessGame.tsx');
      expect(src).toContain('border-[#3f2817]');
      expect(src).toContain("'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'");
      expect(src).toContain("'8', '7', '6', '5', '4', '3', '2', '1'");
      expect(src).not.toContain('border-amber-400 bg-amber-950');
      expect(src).not.toContain('ring-yellow-400');
    });

    it('thẻ "Quân cờ", "Minh họa" và demo nước đi vẽ quân bằng SVG, không bằng ký tự Unicode', () => {
      const screen = read('src/components/learning/chess/ChessScreen.tsx');
      const demo = read('src/components/learning/chess/ChessMoveDemo.tsx');
      for (const glyph of ['♜', '♞', '♝', '♛', '♚', '♟']) {
        expect(screen).not.toContain(glyph);
        expect(demo).not.toContain(glyph);
      }
      expect(screen).toContain('<ChessPieceSvg type={p.type}');
      expect(screen).toContain('<ChessPieceSvg type={selected.type}');
      expect(demo).toContain('<ChessPieceSvg type={d.type}');
    });

    it('ô cờ 2D hai tông tương phản mạnh và có đường kẻ giữa các ô', () => {
      const LINE = 'shadow-[inset_0_0_0_3px_rgba(36,22,9,1)]';
      const game2d = read('src/components/learning/chess/ChessGame.tsx');
      expect(game2d).toContain('bg-[#f5e6c8]');
      expect(game2d).toContain('bg-[#7b4a26]');
      expect(game2d).toContain(LINE);
      expect(game2d).not.toContain('bg-[#efd6ae]');
      const demo = read('src/components/learning/chess/ChessMoveDemo.tsx');
      expect(demo).toContain(LINE);
      expect(demo).toContain('bg-[#7b4a26]');
      const screen = read('src/components/learning/chess/ChessScreen.tsx');
      expect(screen).toContain('bg-[#f5e6c8]');
      expect(screen).toContain('gap-[3px] p-[3px] rounded-lg bg-[#241609]');
      // Đường kẻ phải đặc (không trong suốt) và không còn dùng nét 2px mờ đợt trước
      for (const src of [game2d, demo, screen]) {
        expect(src).not.toContain('inset_0_0_0_2px');
      }
    });
  });
});
