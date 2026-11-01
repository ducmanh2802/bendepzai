import * as THREE from 'three';
import type { Color, PieceType } from '../chessEngine';

// Bộ Staunton gỗ thật — không có chi tiết kim loại màu vàng.
let lightWoodMat: THREE.MeshStandardMaterial | null = null; // phong/ngà (boxwood)
let darkWoodMat: THREE.MeshStandardMaterial | null = null; // gụ/óc chó (rosewood)
let lightCarveMat: THREE.MeshStandardMaterial | null = null; // rãnh khắc trên quân sáng
let darkCarveMat: THREE.MeshStandardMaterial | null = null; // rãnh khắc trên quân tối
let feltMat: THREE.MeshStandardMaterial | null = null; // nỉ đệm đáy

export function getPieceMaterials() {
  if (!lightWoodMat) {
    lightWoodMat = new THREE.MeshStandardMaterial({
      color: 0xf0dcb4,
      roughness: 0.42,
      metalness: 0.0,
    });
  }
  if (!darkWoodMat) {
    darkWoodMat = new THREE.MeshStandardMaterial({
      color: 0x54331d,
      roughness: 0.38,
      metalness: 0.0,
    });
  }
  if (!lightCarveMat) {
    lightCarveMat = new THREE.MeshStandardMaterial({
      color: 0xbfa06d,
      roughness: 0.55,
      metalness: 0.0,
    });
  }
  if (!darkCarveMat) {
    darkCarveMat = new THREE.MeshStandardMaterial({
      color: 0x2c190c,
      roughness: 0.5,
      metalness: 0.0,
    });
  }
  if (!feltMat) {
    feltMat = new THREE.MeshStandardMaterial({
      color: 0x6d1f2a, // nỉ đỏ đô như bộ cờ thi đấu có dán đáy
      roughness: 0.95,
      metalness: 0.0,
    });
  }
  return { lightWoodMat, darkWoodMat, lightCarveMat, darkCarveMat, feltMat };
}

/**
 * Kích thước quân thật của bộ vua 3.35" đặt trên bàn ô 2.25" (0.444 đơn vị mỗi
 * inch, ô cờ = 1.0). Trước khi có bảng này mọi quân cao gần bằng nhau và đế
 * rộng tới 0.68 ô nên đứng sát nhau như đồ chơi, không như bộ cờ ngoài đời.
 * Đầu mã vươn cao hơn chiều cao khai báo, nên giữ n < b để thứ hạng vẫn đúng.
 */
export const PIECE_SPECS: Record<PieceType, { height: number; baseDiameter: number }> = {
  p: { height: 0.67, baseDiameter: 0.58 },
  r: { height: 0.84, baseDiameter: 0.62 },
  n: { height: 0.86, baseDiameter: 0.62 },
  b: { height: 1.0, baseDiameter: 0.64 },
  q: { height: 1.15, baseDiameter: 0.69 },
  k: { height: 1.49, baseDiameter: 0.73 },
};

/** Điểm biên dạng: [bán kính theo tỉ lệ đế, cao độ theo tỉ lệ thân quân]. */
type ProfilePoint = [radius: number, height: number];

function latheFromProfile(
  profile: ProfilePoint[],
  baseR: number,
  height: number,
  segments = 40
): THREE.BufferGeometry {
  const pts = profile.map(
    ([r, y]) => new THREE.Vector2(Math.max(0, r * baseR), y * height)
  );
  const geom = new THREE.LatheGeometry(pts, segments);
  geom.computeVertexNormals();
  return geom;
}

/** Vòm tròn nối tiếp từ điểm cuối biên dạng (dùng cho đầu tốt, mũ tượng…). */
function dome(
  fromR: number,
  fromY: number,
  ry: number,
  steps = 10
): ProfilePoint[] {
  const out: ProfilePoint[] = [];
  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    out.push([Math.cos(a) * fromR, fromY + Math.sin(a) * ry]);
  }
  return out;
}

const BASE_PROFILE: ProfilePoint[] = [
  [0, 0],
  [1, 0],
  [1, 0.09],
  [0.9, 0.14],
  [0.72, 0.2],
];

function stem(waistR: number, waistY: number, collarR: number, collarY: number): ProfilePoint[] {
  return [
    [waistR, waistY],
    [collarR, collarY - 0.03],
    [collarR * 0.92, collarY],
    [waistR * 1.05, collarY + 0.03],
  ];
}

/** Khối đầu mã dựng từ biên dạng 2D ép ra — nhìn nghiêng ra rõ hình ngựa. */
const KNIGHT_HEAD_PROFILE: [number, number][] = [
  [0.42, 0.0], // gáy dưới, sát bệ
  [0.5, 0.16], // lưng cổ phồng ra sau
  [0.46, 0.36],
  [0.34, 0.56],
  [0.22, 0.76],
  [0.14, 0.9], // sau tai
  [0.06, 1.02], // đỉnh tai
  [-0.04, 0.86], // giữa hai tai và trán
  [-0.3, 0.76], // sống mũi dốc xuống
  [-0.54, 0.56], // mõm trên
  [-0.6, 0.42], // đầu mũi nhô hẳn ra ngoài ức
  [-0.44, 0.34], // lỗ mũi
  [-0.26, 0.4], // mép
  [-0.16, 0.26], // khe hàm dưới
  [-0.22, 0.14], // yết hầu
  [-0.32, 0.06], // ức
  [-0.26, 0.0],
];

function createKnightHead(baseR: number, height: number, mat: THREE.Material): THREE.Mesh {
  const shape = new THREE.Shape();
  const spreadX = baseR * 1.3;
  const startY = height * 0.34;
  const headH = height * 0.66;
  shape.moveTo(KNIGHT_HEAD_PROFILE[0][0] * spreadX, startY + KNIGHT_HEAD_PROFILE[0][1] * headH);
  for (const [x, y] of KNIGHT_HEAD_PROFILE.slice(1)) {
    shape.lineTo(x * spreadX, startY + y * headH);
  }
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    // Đủ dày để nhìn từ sau vẫn ra khối cổ ngựa; bản mỏng 1.05R trông như tấm ván.
    depth: baseR * 1.5,
    bevelEnabled: true,
    bevelThickness: baseR * 0.26,
    bevelSize: baseR * 0.26,
    bevelSegments: 4,
    curveSegments: 6,
  });
  geom.translate(0, 0, -baseR * 0.75);

  // Hẹp dần lên đỉnh: đầu ngựa thật nhỏ hơn gốc cổ, nếu không mặt sau là một
  // tấm phẳng đứng (lỗi nhìn thấy trong ảnh QA close-a).
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = THREE.MathUtils.clamp((pos.getY(i) - startY) / headH, 0, 1);
    pos.setZ(i, pos.getZ(i) * (1 - 0.42 * t));
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();

  const mesh = new THREE.Mesh(geom, mat);
  // Mũi ngựa quay về phía bàn đối diện (−z), giống hai hàng quân quay mặt vào nhau.
  mesh.rotation.y = -Math.PI / 2;
  return mesh;
}

/** Tạo một quân composite theo tỉ lệ bộ cờ gỗ Staunton. */
export function createPieceMesh(type: PieceType, color: Color): THREE.Group {
  const { lightWoodMat, darkWoodMat, lightCarveMat, darkCarveMat, feltMat } = getPieceMaterials();
  const wood = color === 'w' ? lightWoodMat : darkWoodMat;
  const carve = color === 'w' ? lightCarveMat : darkCarveMat;
  const { height: H, baseDiameter: D } = PIECE_SPECS[type];
  const R = D / 2;

  const group = new THREE.Group();
  group.name = `piece_${color}_${type}`;

  // Đệm nỉ dưới đáy — chi tiết chỉ thấy khi xoay bàn thấp, nhưng là dấu hiệu
  // của bộ cờ thật (quân nhựa rẻ tiền không có).
  const felt = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.96, R * 0.96, H * 0.02, 28), feltMat);
  felt.position.y = H * 0.01;
  group.add(felt);

  if (type !== 'p') {
    // Vòng đế tối màu mô phỏng rãnh tiện, thay cho vòng kim loại vàng bản cũ.
    const baseRing = new THREE.Mesh(
      new THREE.TorusGeometry(R * 0.86, D * 0.022, 10, 32),
      carve
    );
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = H * 0.075;
    group.add(baseRing);
  }

  switch (type) {
    case 'p': {
      const body = new THREE.Mesh(
        latheFromProfile(
          [...BASE_PROFILE, ...stem(0.34, 0.42, 0.5, 0.6), ...dome(0.357, 0.63, 0.15, 8)],
          R,
          H
        ),
        wood
      );
      group.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(R * 0.42, 24, 18), wood);
      head.position.y = H * 0.79;
      head.scale.y = 1.05;
      group.add(head);
      break;
    }

    case 'r': {
      const body = new THREE.Mesh(
        latheFromProfile(
          [
            ...BASE_PROFILE,
            [0.62, 0.28],
            [0.56, 0.5],
            [0.6, 0.66],
            [0.74, 0.72],
            [0.7, 0.76],
            [0.78, 0.84],
            [0.72, 0.86],
            [0.56, 0.86],
            [0.54, 0.78],
            [0, 0.78],
          ],
          R,
          H
        ),
        wood
      );
      group.add(body);
      // 4 lỗ châu thành: khối hộp đặt TIẾP TUYẾN trên miệng tháp. Bản đầu quay
      // trục dài theo bán kính nên nhìn như cánh quạt (ảnh QA close-a).
      const crenelH = H * 0.18;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        const crenel = new THREE.Mesh(
          new THREE.BoxGeometry(R * 0.44, crenelH, R * 0.3),
          wood
        );
        crenel.position.set(Math.cos(a) * R * 0.64, H * 0.86 + crenelH / 2, Math.sin(a) * R * 0.64);
        crenel.rotation.y = Math.PI / 2 - a;
        group.add(crenel);
      }
      break;
    }

    case 'n': {
      const plinth = new THREE.Mesh(
        latheFromProfile([...BASE_PROFILE, ...stem(0.5, 0.28, 0.62, 0.36)], R, H),
        wood
      );
      group.add(plinth);
      group.add(createKnightHead(R, H, wood));
      break;
    }

    case 'b': {
      const body = new THREE.Mesh(
        latheFromProfile(
          [
            ...BASE_PROFILE,
            ...stem(0.34, 0.4, 0.5, 0.52),
            [0.44, 0.58],
            [0.62, 0.72],
            [0.6, 0.82],
            ...dome(0.6, 0.82, 0.14),
          ],
          R,
          H
        ),
        wood
      );
      group.add(body);
      const finial = new THREE.Mesh(new THREE.SphereGeometry(R * 0.18, 18, 14), wood);
      finial.position.y = H * 0.99;
      group.add(finial);
      // Rãnh chéo trên mũ giám mục — dấu hiệu nhận dạng của tượng.
      const slit = new THREE.Mesh(new THREE.BoxGeometry(R * 0.1, R * 0.62, R * 1.15), carve);
      slit.position.set(R * 0.18, H * 0.8, 0);
      slit.rotation.z = -0.5;
      group.add(slit);
      break;
    }

    case 'q': {
      const body = new THREE.Mesh(
        latheFromProfile(
          [
            ...BASE_PROFILE,
            [0.44, 0.3],
            [0.36, 0.52],
            [0.44, 0.66],
            [0.6, 0.72],
            [0.52, 0.76],
            [0.66, 0.86],
            [0.72, 0.94],
            [0.62, 0.95],
            [0.4, 0.9],
            [0.34, 0.82],
            [0, 0.82],
          ],
          R,
          H
        ),
        wood
      );
      group.add(body);
      // 8 viên bi trên miệng miện hoàng hậu, cùng màu gỗ.
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const ball = new THREE.Mesh(new THREE.SphereGeometry(R * 0.15, 16, 12), wood);
        ball.position.set(Math.cos(a) * R * 0.68, H * 0.95, Math.sin(a) * R * 0.68);
        group.add(ball);
      }
      const crown = new THREE.Mesh(new THREE.SphereGeometry(R * 0.17, 18, 14), wood);
      crown.position.y = H * 1.0;
      group.add(crown);
      break;
    }

    case 'k': {
      const body = new THREE.Mesh(
        latheFromProfile(
          [
            ...BASE_PROFILE,
            [0.46, 0.28],
            [0.38, 0.5],
            [0.44, 0.62],
            [0.6, 0.66],
            [0.54, 0.7],
            [0.58, 0.76],
            [0.5, 0.79],
            [0.54, 0.86],
            [0.46, 0.92],
            [0.3, 0.94],
            [0.16, 0.92],
            [0, 0.93],
          ],
          R,
          H
        ),
        wood
      );
      group.add(body);
      // Thập tự trên mũ vua — tiện bằng gỗ cùng màu, không mạ vàng.
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(R * 0.16, H * 0.16, R * 0.16), wood);
      crossV.position.y = H * 0.96;
      group.add(crossV);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(R * 0.46, R * 0.16, R * 0.16), wood);
      crossH.position.y = H * 0.99;
      group.add(crossH);
      break;
    }
  }

  // Quân đen quay mặt về phía quân trắng, đúng thế hai hàng đối diện nhau.
  if (color === 'b') group.rotation.y = Math.PI;

  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}
