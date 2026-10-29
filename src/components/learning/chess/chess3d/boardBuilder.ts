import * as THREE from 'three';

export interface BoardMeshRefs {
  boardGroup: THREE.Group;
  squareHitBoxes: THREE.Mesh[]; // 64 meshes with userData: { row, col }
  squareMeshes: THREE.Mesh[][]; // 8x8 visual tile meshes
  highlightGroup: THREE.Group;
}

// Generate canvas texture for rank & file notations (A-H, 1-8)
function createCoordTexture(text: string): THREE.Texture {
  if (typeof document === 'undefined') {
    return new THREE.Texture();
  }
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = '#fef3c7'; // warm amber gold text
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildChessBoard3D(): BoardMeshRefs {
  const boardGroup = new THREE.Group();
  boardGroup.name = 'chess_board_group';

  const squareHitBoxes: THREE.Mesh[] = [];
  const squareMeshes: THREE.Mesh[][] = Array.from({ length: 8 }, () => []);

  // Materials
  const lightTileMat = new THREE.MeshStandardMaterial({
    color: 0xf5eedb, // light cream wood
    roughness: 0.35,
    metalness: 0.05,
  });

  const darkTileMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b, // warm rich walnut
    roughness: 0.4,
    metalness: 0.08,
  });

  const woodFrameMat = new THREE.MeshStandardMaterial({
    color: 0x3d2314, // deep mahogany border
    roughness: 0.3,
    metalness: 0.12,
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // subtle gold accent rim
    roughness: 0.25,
    metalness: 0.6,
  });

  // 1. Wooden Base Table
  const tableBaseGeom = new THREE.BoxGeometry(10.2, 0.4, 10.2);
  const tableBase = new THREE.Mesh(tableBaseGeom, woodFrameMat);
  tableBase.position.y = -0.2;
  tableBase.receiveShadow = true;
  boardGroup.add(tableBase);

  // 2. Beveled Gold Accent Trim
  const trimGeom = new THREE.BoxGeometry(8.5, 0.04, 8.5);
  const trim = new THREE.Mesh(trimGeom, goldTrimMat);
  trim.position.y = 0.01;
  trim.receiveShadow = true;
  boardGroup.add(trim);

  // 3. 64 Squares (8x8)
  const tileSize = 1.0;
  const tileHeight = 0.06;
  const tileGeom = new THREE.BoxGeometry(tileSize * 0.98, tileHeight, tileSize * 0.98);

  // Invisible hitbox plane for raycasting
  const hitGeom = new THREE.PlaneGeometry(tileSize, tileSize);
  hitGeom.rotateX(-Math.PI / 2);

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isDark = (r + c) % 2 === 1;
      const x = (c - 3.5) * tileSize;
      const z = (r - 3.5) * tileSize;

      // Visual tile
      const tile = new THREE.Mesh(tileGeom, isDark ? darkTileMat : lightTileMat);
      tile.position.set(x, tileHeight / 2, z);
      tile.receiveShadow = true;
      tile.name = `tile_${r}_${c}`;
      boardGroup.add(tile);
      squareMeshes[r][c] = tile;

      // Hitbox for raycaster
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeom, hitMat);
      hitMesh.position.set(x, tileHeight + 0.01, z);
      hitMesh.userData = { row: r, col: c };
      boardGroup.add(hitMesh);
      squareHitBoxes.push(hitMesh);
    }
  }

  // 4. Coordinate Notation Labels along border (A-H, 1-8)
  const files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const labelGeom = new THREE.PlaneGeometry(0.4, 0.4);
  labelGeom.rotateX(-Math.PI / 2);

  // Files along bottom (z = 4.45) & top (z = -4.45)
  files.forEach((char, c) => {
    const x = (c - 3.5) * tileSize;
    const tex = createCoordTexture(char);
    const labelMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.9,
    });

    // Bottom
    const bottomMesh = new THREE.Mesh(labelGeom, labelMat);
    bottomMesh.position.set(x, 0.02, 4.45);
    boardGroup.add(bottomMesh);

    // Top
    const topMesh = new THREE.Mesh(labelGeom, labelMat);
    topMesh.position.set(x, 0.02, -4.45);
    topMesh.rotation.y = Math.PI;
    boardGroup.add(topMesh);
  });

  // Ranks along left (x = -4.45) & right (x = 4.45)
  ranks.forEach((num, r) => {
    const z = (r - 3.5) * tileSize;
    const tex = createCoordTexture(num);
    const labelMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.9,
    });

    // Left
    const leftMesh = new THREE.Mesh(labelGeom, labelMat);
    leftMesh.position.set(-4.45, 0.02, z);
    leftMesh.rotation.y = Math.PI / 2;
    boardGroup.add(leftMesh);

    // Right
    const rightMesh = new THREE.Mesh(labelGeom, labelMat);
    rightMesh.position.set(4.45, 0.02, z);
    rightMesh.rotation.y = -Math.PI / 2;
    boardGroup.add(rightMesh);
  });

  // 5. Highlight group (for selected, legal moves, last move, check)
  const highlightGroup = new THREE.Group();
  highlightGroup.name = 'highlight_group';
  highlightGroup.position.y = tileHeight + 0.015;
  boardGroup.add(highlightGroup);

  return {
    boardGroup,
    squareHitBoxes,
    squareMeshes,
    highlightGroup,
  };
}

/**
 * Creates a glowing circle marker for legal moves
 */
export function createMoveMarker(isCapture: boolean): THREE.Group {
  const group = new THREE.Group();

  if (isCapture) {
    // Red/coral ring for captures
    const ringGeom = new THREE.RingGeometry(0.32, 0.44, 32);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    group.add(ring);
  } else {
    // Glowing emerald dot + subtle outer ring
    const dotGeom = new THREE.CircleGeometry(0.18, 24);
    dotGeom.rotateX(-Math.PI / 2);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const dot = new THREE.Mesh(dotGeom, dotMat);
    group.add(dot);

    const outerRingGeom = new THREE.RingGeometry(0.36, 0.42, 28);
    outerRingGeom.rotateX(-Math.PI / 2);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const outerRing = new THREE.Mesh(outerRingGeom, outerRingMat);
    group.add(outerRing);
  }

  return group;
}

/**
 * Creates selected piece indicator (golden glowing pedestal ring)
 */
export function createSelectedMarker(): THREE.Group {
  const group = new THREE.Group();
  const ringGeom = new THREE.RingGeometry(0.34, 0.46, 32);
  ringGeom.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  group.add(ring);
  return group;
}

/**
 * Creates last move marker (soft warm amber tile outline)
 */
export function createLastMoveMarker(): THREE.Group {
  const group = new THREE.Group();
  const fillGeom = new THREE.PlaneGeometry(0.96, 0.96);
  fillGeom.rotateX(-Math.PI / 2);
  const fillMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });
  const fill = new THREE.Mesh(fillGeom, fillMat);
  group.add(fill);
  return group;
}

/**
 * Creates check warning marker for the King (pulsing red aura)
 */
export function createCheckMarker(): THREE.Group {
  const group = new THREE.Group();
  const fillGeom = new THREE.CircleGeometry(0.48, 32);
  fillGeom.rotateX(-Math.PI / 2);
  const fillMat = new THREE.MeshBasicMaterial({
    color: 0xdc2626,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
  });
  const fill = new THREE.Mesh(fillGeom, fillMat);
  group.add(fill);
  return group;
}
