import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createPieceMesh } from '../src/components/learning/chess/chess3d/pieceGeometries';
import {
  buildChessBoard3D,
  createMoveMarker,
  createSelectedMarker,
  createLastMoveMarker,
  createCheckMarker,
} from '../src/components/learning/chess/chess3d/boardBuilder';
import * as E from '../src/components/learning/chess/chessEngine';

describe('Chess 3D Component & Geometry Tests', () => {
  it('creates composite 3D meshes for all white pieces with shadows enabled', () => {
    const pieceTypes: E.PieceType[] = ['p', 'r', 'n', 'b', 'q', 'k'];
    pieceTypes.forEach((type) => {
      const mesh = createPieceMesh(type, 'w');
      expect(mesh).toBeInstanceOf(THREE.Group);
      expect(mesh.children.length).toBeGreaterThanOrEqual(3); // Base + stem/body + head/crown
      expect(mesh.name).toBe(`piece_w_${type}`);

      // Verify at least one child mesh has shadows
      let hasMeshWithShadow = false;
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.castShadow) hasMeshWithShadow = true;
        }
      });
      expect(hasMeshWithShadow).toBe(true);
    });
  });

  it('creates composite 3D meshes for all black pieces with correct orientation', () => {
    const pieceTypes: E.PieceType[] = ['p', 'r', 'n', 'b', 'q', 'k'];
    pieceTypes.forEach((type) => {
      const mesh = createPieceMesh(type, 'b');
      expect(mesh).toBeInstanceOf(THREE.Group);
      expect(mesh.children.length).toBeGreaterThanOrEqual(3);
      expect(mesh.name).toBe(`piece_b_${type}`);
    });
  });

  it('builds a 3D chess board with 64 squares and hitboxes', () => {
    const board = buildChessBoard3D();
    expect(board.boardGroup).toBeInstanceOf(THREE.Group);
    expect(board.squareHitBoxes).toHaveLength(64);
    expect(board.squareMeshes).toHaveLength(8);
    expect(board.squareMeshes[0]).toHaveLength(8);

    // Verify hitbox metadata for raycasting
    const firstHitBox = board.squareHitBoxes[0];
    expect(firstHitBox.userData).toHaveProperty('row');
    expect(firstHitBox.userData).toHaveProperty('col');
  });

  it('generates visual highlight markers for legal moves and check state', () => {
    const normalMoveMarker = createMoveMarker(false);
    expect(normalMoveMarker).toBeInstanceOf(THREE.Group);
    expect(normalMoveMarker.children.length).toBeGreaterThan(0);

    const captureMoveMarker = createMoveMarker(true);
    expect(captureMoveMarker).toBeInstanceOf(THREE.Group);
    expect(captureMoveMarker.children.length).toBeGreaterThan(0);

    const selectedMarker = createSelectedMarker();
    expect(selectedMarker).toBeInstanceOf(THREE.Group);

    const lastMoveMarker = createLastMoveMarker();
    expect(lastMoveMarker).toBeInstanceOf(THREE.Group);

    const checkMarker = createCheckMarker();
    expect(checkMarker).toBeInstanceOf(THREE.Group);
  });

  it('integrates with chess engine to validate opening moves', () => {
    const board = E.initialBoard();
    expect(board).toHaveLength(8);

    // White pawn at e2 (row 6, col 4) can move to e3 or e4
    const pawnMoves = E.legalMoves(board, [6, 4]);
    expect(pawnMoves.length).toBeGreaterThanOrEqual(2);

    // White knight at g1 (row 7, col 6) can jump to f3 or h3
    const knightMoves = E.legalMoves(board, [7, 6]);
    expect(knightMoves.length).toBe(2);

    // Apply move 1. e4
    const e4Move: E.Move = { from: [6, 4], to: [4, 4] };
    const nextBoard = E.applyMove(board, e4Move);
    expect(nextBoard[6][4]).toBeNull();
    expect(nextBoard[4][4]).toEqual({ type: 'p', color: 'w' });
  });
});
