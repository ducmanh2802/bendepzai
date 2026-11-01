import * as THREE from 'three';

export interface BoardMeshRefs {
  boardGroup: THREE.Group;
  squareHitBoxes: THREE.Mesh[]; // 64 meshes with userData: { row, col }
  squareMeshes: THREE.Mesh[][]; // 8x8 visual tile meshes
  highlightGroup: THREE.Group;
}

// Generate canvas texture for rank & file notations (a-h, 1-8)
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
    ctx.fillStyle = '#f6ead2'; // chữ khắc lát bằng ngà trên viền gỗ tối
    ctx.font = 'bold 72px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Đường kẻ ô vẽ thẳng lên mặt bàn thay vì chỉ dựa vào khe gỗ. Khe thật thì bị
 * phối cảnh làm mảnh gần mất hút khi bé nhìn nghiêng; tấm lưới này nằm sát mặt
 * ô nên nhìn từ góc nào cũng còn nguyên nét kẻ.
 */
function createGridTexture(cellSize: number, lineSize: number, lineColor: string): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 1024, 1024);
    ctx.fillStyle = lineColor;
    const cellPx = 1024 / 8;
    const linePx = Math.round(lineSize / cellSize * cellPx);
    for (let i = 0; i <= 8; i++) {
      const p = i * cellPx - linePx / 2;
      ctx.fillRect(p, 0, linePx, 1024);
      ctx.fillRect(0, p, 1024, linePx);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Vân gỗ procedural. Không dùng Math.random: cùng `variant` phải ra cùng một
 * tấm gỗ, nếu không mỗi lần dựng bàn là một hoa văn khác và ảnh QA không so
 * được với nhau.
 */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function createWoodTexture(base: string, streak: string, variant: number): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  const rnd = lcg(variant * 7919 + 13);
  ctx.strokeStyle = streak;
  for (let i = 0; i < 26; i++) {
    const y = rnd() * 256;
    const amp = 4 + rnd() * 12;
    ctx.globalAlpha = 0.06 + rnd() * 0.16;
    ctx.lineWidth = 0.8 + rnd() * 2.4;
    ctx.beginPath();
    ctx.moveTo(-10, y);
    ctx.bezierCurveTo(70, y + amp, 170, y - amp, 266, y + amp * 0.4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function woodMaterial(base: string, streak: string, variant: number, roughness: number) {
  const map = createWoodTexture(base, streak, variant);
  return new THREE.MeshStandardMaterial({
    ...(map ? { map } : { color: new THREE.Color(base) }),
    roughness,
    metalness: 0.0,
  });
}

export function buildChessBoard3D(): BoardMeshRefs {
  const boardGroup = new THREE.Group();
  boardGroup.name = 'chess_board_group';

  const squareHitBoxes: THREE.Mesh[] = [];
  const squareMeshes: THREE.Mesh[][] = Array.from({ length: 8 }, () => []);

  // Vật liệu: bàn cờ gỗ thật — ô sáng gỗ phong, ô tối gụ đậm (tương phản đủ để bé
  // lớp 1 nhận ra ô nào sáng ô nào tối khi nhìn nghiêng), viền óc chó.
  const lightTileMats = [0, 1, 2, 3].map((v) =>
    woodMaterial('#f5e6c8', '#c9a877', v, 0.5)
  );
  const darkTileMats = [0, 1, 2, 3].map((v) =>
    woodMaterial('#7b4a26', '#54301a', 10 + v, 0.5)
  );

  const woodFrameMat = woodMaterial('#6b4226', '#432714', 40, 0.45);
  const bezelMat = woodMaterial('#8a5a34', '#5d3a1f', 60, 0.4);
  const inlayMat = new THREE.MeshStandardMaterial({ color: 0x2f1d10, roughness: 0.7, metalness: 0.0 });

  // 1. Wooden Base Table
  const tableBaseGeom = new THREE.BoxGeometry(10.2, 0.4, 10.2);
  const tableBase = new THREE.Mesh(tableBaseGeom, woodFrameMat);
  tableBase.position.y = -0.2;
  tableBase.receiveShadow = true;
  boardGroup.add(tableBase);

  // 2. Viền gỗ 4 thanh — một khối đặc 9.2x9.2 sẽ phủ kín 64 ô bên dưới.
  const bezelH = 0.09;
  const bezelW = 0.6;
  const outer = 8 + bezelW * 2;
  const bezelPieces: [number, number, number, number][] = [
    [outer, bezelW, 0, -(4 + bezelW / 2)],
    [outer, bezelW, 0, 4 + bezelW / 2],
    [bezelW, 8, -(4 + bezelW / 2), 0],
    [bezelW, 8, 4 + bezelW / 2, 0],
  ];
  for (const [sx, sz, px, pz] of bezelPieces) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(sx, bezelH, sz), bezelMat);
    bar.position.set(px, bezelH / 2, pz);
    bar.receiveShadow = true;
    boardGroup.add(bar);
  }

  // 3. 64 Squares (8x8) — pitch 1.0 nhưng mặt lát nhỏ hơn một chút để rãnh tối
  // bên dưới lộ ra thành đường kẻ, như bàn cờ ghép từ 64 miếng gỗ thật.
  const pitch = 1.0;
  const tileSize = 0.9;
  const tileHeight = 0.06;
  const tileGeom = new THREE.BoxGeometry(tileSize, tileHeight, tileSize);

  const inlay = new THREE.Mesh(new THREE.BoxGeometry(8, 0.05, 8), inlayMat);
  inlay.position.y = 0.027; // mặt trên 0.052, thấp hơn đỉnh ô 0.008 → lòng rãnh
  inlay.receiveShadow = true;
  inlay.name = 'board_inlay';
  boardGroup.add(inlay);

  // Lưới kẻ ô vẽ ngay sát mặt lát (thấp hơn 0.001 để lún vào khe, không che quân).
  const gridTex = createGridTexture(pitch, 0.14, '#241609');
  const gridPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshBasicMaterial({
      ...(gridTex ? { map: gridTex } : {}),
      transparent: true,
      depthWrite: false,
    })
  );
  gridPlane.rotation.x = -Math.PI / 2;
  gridPlane.position.y = tileHeight - 0.001;
  gridPlane.name = 'board_grid_lines';
  boardGroup.add(gridPlane);

  // Invisible hitbox plane for raycasting
  const hitGeom = new THREE.PlaneGeometry(pitch, pitch);
  hitGeom.rotateX(-Math.PI / 2);

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isDark = (r + c) % 2 === 1;
      const x = (c - 3.5) * pitch;
      const z = (r - 3.5) * pitch;

      // Visual tile — 4 biến thể vân gỗ để mặt bàn không lặp một hoa văn
      const tile = new THREE.Mesh(
        tileGeom,
        (isDark ? darkTileMats : lightTileMats)[(r * 8 + c) % 4]
      );
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

  // 4. Coordinate Notation Labels along border (a-h, 1-8 — bàn thật ghi chữ thường)
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const labelY = 0.095;

  const labelGeom = new THREE.PlaneGeometry(0.4, 0.4);
  labelGeom.rotateX(-Math.PI / 2);

  // Files along bottom (z = 4.45) & top (z = -4.45)
  files.forEach((char, c) => {
    const x = (c - 3.5) * pitch;
    const tex = createCoordTexture(char);
    const labelMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.9,
    });

    // Bottom
    const bottomMesh = new THREE.Mesh(labelGeom, labelMat);
    bottomMesh.position.set(x, labelY, 4.45);
    boardGroup.add(bottomMesh);

    // Top
    const topMesh = new THREE.Mesh(labelGeom, labelMat);
    topMesh.position.set(x, labelY, -4.45);
    topMesh.rotation.y = Math.PI;
    boardGroup.add(topMesh);
  });

  // Ranks along left (x = -4.45) & right (x = 4.45)
  ranks.forEach((num, r) => {
    const z = (r - 3.5) * pitch;
    const tex = createCoordTexture(num);
    const labelMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.9,
    });

    // Left
    const leftMesh = new THREE.Mesh(labelGeom, labelMat);
    leftMesh.position.set(-4.45, labelY, z);
    leftMesh.rotation.y = Math.PI / 2;
    boardGroup.add(leftMesh);

    // Right
    const rightMesh = new THREE.Mesh(labelGeom, labelMat);
    rightMesh.position.set(4.45, labelY, z);
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
 * Tạo vòng báo quân đang được chọn (xanh da trời, đồng bộ với ô chọn trên bàn 2D)
 */
export function createSelectedMarker(): THREE.Group {
  const group = new THREE.Group();
  const ringGeom = new THREE.RingGeometry(0.34, 0.46, 32);
  ringGeom.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x0ea5e9,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  group.add(ring);
  return group;
}

/**
 * Tạo ô đánh dấu nước vừa đi (xanh rêu nhạt như miếng vải đánh dấu, đồng bộ bàn 2D)
 */
export function createLastMoveMarker(): THREE.Group {
  const group = new THREE.Group();
  // Hẹp hơn mặt lát (0.9) để mảng xanh không tràn qua đường kẻ ô.
  const fillGeom = new THREE.PlaneGeometry(0.86, 0.86);
  fillGeom.rotateX(-Math.PI / 2);
  const fillMat = new THREE.MeshBasicMaterial({
    color: 0x7fb069,
    transparent: true,
    opacity: 0.55,
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

/**
 * Tạo cột sáng báo nước gợi ý (xanh da trời)
 */
export function createHintMarker(): THREE.Group {
  const group = new THREE.Group();

  // Ground glowing disk
  const diskGeom = new THREE.RingGeometry(0.2, 0.46, 32);
  diskGeom.rotateX(-Math.PI / 2);
  const diskMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const disk = new THREE.Mesh(diskGeom, diskMat);
  group.add(disk);

  // Subtle transparent light beam pointing up
  const beamGeom = new THREE.CylinderGeometry(0.15, 0.35, 1.2, 24, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
  });
  const beam = new THREE.Mesh(beamGeom, beamMat);
  beam.position.y = 0.6;
  group.add(beam);

  return group;
}
