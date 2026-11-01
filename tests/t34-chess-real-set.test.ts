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

    it('ô cờ 2D hai tông phong/gụ giống mặt bàn 3D', () => {
      const game2d = read('src/components/learning/chess/ChessGame.tsx');
      expect(game2d).toContain('bg-[#efd6ae]');
      expect(game2d).toContain('bg-[#9c6a40]');
    });
  });
});
