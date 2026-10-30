import * as THREE from 'three';
import type { Color, PieceType } from '../chessEngine';

// Materials cache
let whiteMat: THREE.MeshStandardMaterial | null = null;
let blackMat: THREE.MeshStandardMaterial | null = null;
let goldMat: THREE.MeshStandardMaterial | null = null;
let feltMat: THREE.MeshStandardMaterial | null = null;

export function getPieceMaterials() {
  if (!whiteMat) {
    // Polished Carrara marble / warm royal porcelain
    whiteMat = new THREE.MeshStandardMaterial({
      color: 0xfcfaf2,
      roughness: 0.18,
      metalness: 0.05,
    });
  }
  if (!blackMat) {
    // Polished African ebony / dark walnut with deep satin luster
    blackMat = new THREE.MeshStandardMaterial({
      color: 0x1c1a1e,
      roughness: 0.22,
      metalness: 0.12,
    });
  }
  if (!goldMat) {
    // Shimmering metallic gold
    goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.18,
      metalness: 0.85,
    });
  }
  if (!feltMat) {
    // Deep tournament green velvet base pad
    feltMat = new THREE.MeshStandardMaterial({
      color: 0x14532d,
      roughness: 0.9,
      metalness: 0.0,
    });
  }
  return { whiteMat, blackMat, goldMat, feltMat };
}

/**
 * Helper to build smooth lathe geometry from profile points
 */
function createLathe(points: THREE.Vector2[], segments = 32): THREE.BufferGeometry {
  const geom = new THREE.LatheGeometry(points, segments);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates a composite 3D piece mesh group with authentic luxury Staunton contours
 */
export function createPieceMesh(type: PieceType, color: Color): THREE.Group {
  const { whiteMat, blackMat, goldMat, feltMat } = getPieceMaterials();
  const mat = color === 'w' ? whiteMat : blackMat;
  const group = new THREE.Group();
  group.name = `piece_${color}_${type}`;

  // 1. Velvet felt pad beneath piece base
  const feltGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.015, 32);
  const felt = new THREE.Mesh(feltGeom, feltMat);
  felt.position.y = 0.008;
  group.add(felt);

  // 2. Base Pedestal Ring (metallic gold accent ring for luxury feel)
  const goldRingGeom = new THREE.TorusGeometry(0.32, 0.018, 16, 32);
  const goldRing = new THREE.Mesh(goldRingGeom, goldMat);
  goldRing.rotation.x = Math.PI / 2;
  goldRing.position.y = 0.06;
  group.add(goldRing);

  switch (type) {
    case 'p': {
      // PAWN (Clean, slender, graceful lathe profile with ivory head)
      const p: THREE.Vector2[] = [];
      p.push(new THREE.Vector2(0, 0.01));
      p.push(new THREE.Vector2(0.34, 0.01));
      p.push(new THREE.Vector2(0.34, 0.04));
      p.push(new THREE.Vector2(0.30, 0.08));
      p.push(new THREE.Vector2(0.24, 0.13));
      p.push(new THREE.Vector2(0.18, 0.20));
      // Slender concave stem
      p.push(new THREE.Vector2(0.12, 0.32));
      p.push(new THREE.Vector2(0.11, 0.44));
      p.push(new THREE.Vector2(0.13, 0.54));
      // Collar
      p.push(new THREE.Vector2(0.17, 0.58));
      p.push(new THREE.Vector2(0.15, 0.61));
      p.push(new THREE.Vector2(0.11, 0.63));
      // Spherical Pearl head
      for (let a = -Math.PI / 2; a <= Math.PI / 2; a += Math.PI / 12) {
        const r = 0.17;
        p.push(new THREE.Vector2(Math.max(0, Math.cos(a) * r), 0.80 + Math.sin(a) * r));
      }
      p.push(new THREE.Vector2(0, 0.97));

      const pawnGeom = createLathe(p);
      const pawnMesh = new THREE.Mesh(pawnGeom, mat);
      group.add(pawnMesh);

      // Gold bead neck ring
      const neckRingGeom = new THREE.TorusGeometry(0.14, 0.018, 14, 28);
      const neckRing = new THREE.Mesh(neckRingGeom, goldMat);
      neckRing.rotation.x = Math.PI / 2;
      neckRing.position.y = 0.60;
      group.add(neckRing);
      break;
    }

    case 'r': {
      // ROOK (Sleek tapered castle tower with 4 clean beveled crenels)
      const p: THREE.Vector2[] = [];
      p.push(new THREE.Vector2(0, 0.01));
      p.push(new THREE.Vector2(0.35, 0.01));
      p.push(new THREE.Vector2(0.35, 0.05));
      p.push(new THREE.Vector2(0.31, 0.09));
      p.push(new THREE.Vector2(0.25, 0.14));
      p.push(new THREE.Vector2(0.23, 0.20));
      // Tower shaft with subtle inward taper
      p.push(new THREE.Vector2(0.22, 0.35));
      p.push(new THREE.Vector2(0.20, 0.58));
      p.push(new THREE.Vector2(0.21, 0.72));
      // Capital ring
      p.push(new THREE.Vector2(0.26, 0.77));
      p.push(new THREE.Vector2(0.25, 0.80));
      // Parapet bowl
      p.push(new THREE.Vector2(0.29, 0.88));
      p.push(new THREE.Vector2(0.27, 0.93));
      p.push(new THREE.Vector2(0.20, 0.93));
      p.push(new THREE.Vector2(0.18, 0.86));
      p.push(new THREE.Vector2(0, 0.86));

      const rookGeom = createLathe(p);
      const rookMesh = new THREE.Mesh(rookGeom, mat);
      group.add(rookMesh);

      // Gold capital ring
      const capRingGeom = new THREE.TorusGeometry(0.24, 0.02, 16, 32);
      const capRing = new THREE.Mesh(capRingGeom, goldMat);
      capRing.rotation.x = Math.PI / 2;
      capRing.position.y = 0.78;
      group.add(capRing);

      // 4 Clean Castle Battlements
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const bGeom = new THREE.BoxGeometry(0.11, 0.12, 0.08);
        const bMesh = new THREE.Mesh(bGeom, mat);
        bMesh.position.set(Math.cos(angle) * 0.22, 0.99, Math.sin(angle) * 0.22);
        bMesh.rotation.y = -angle;
        group.add(bMesh);
      }
      break;
    }

    case 'n': {
      // KNIGHT (Graceful equestrian silhouette atop matching lathe plinth)
      const p: THREE.Vector2[] = [];
      p.push(new THREE.Vector2(0, 0.01));
      p.push(new THREE.Vector2(0.35, 0.01));
      p.push(new THREE.Vector2(0.35, 0.05));
      p.push(new THREE.Vector2(0.31, 0.09));
      p.push(new THREE.Vector2(0.25, 0.14));
      p.push(new THREE.Vector2(0.21, 0.22));
      p.push(new THREE.Vector2(0.20, 0.32));
      p.push(new THREE.Vector2(0.22, 0.35));
      p.push(new THREE.Vector2(0, 0.35));

      const plinthGeom = createLathe(p);
      const plinth = new THREE.Mesh(plinthGeom, mat);
      group.add(plinth);

      // Sculpted horse body (slender, curved neck and breastplate)
      const neckGeom = new THREE.CylinderGeometry(0.15, 0.19, 0.45, 24);
      const neck = new THREE.Mesh(neckGeom, mat);
      neck.position.set(0, 0.52, -0.03);
      neck.rotation.x = 0.22;
      group.add(neck);

      // Head & snout
      const headGeom = new THREE.BoxGeometry(0.18, 0.22, 0.30);
      const head = new THREE.Mesh(headGeom, mat);
      head.position.set(0, 0.78, 0.10);
      head.rotation.x = -0.28;
      group.add(head);

      // Ears (2 pointed alert ears)
      const earGeom = new THREE.ConeGeometry(0.04, 0.14, 12);
      const leftEar = new THREE.Mesh(earGeom, mat);
      leftEar.position.set(-0.065, 0.96, -0.02);
      leftEar.rotation.z = -0.15;
      group.add(leftEar);

      const rightEar = new THREE.Mesh(earGeom, mat);
      rightEar.position.set(0.065, 0.96, -0.02);
      rightEar.rotation.z = 0.15;
      group.add(rightEar);

      // Golden mane crest line
      const maneGeom = new THREE.BoxGeometry(0.05, 0.38, 0.12);
      const mane = new THREE.Mesh(maneGeom, goldMat);
      mane.position.set(0, 0.65, -0.16);
      mane.rotation.x = 0.24;
      group.add(mane);

      if (color === 'b') {
        group.rotation.y = Math.PI;
      }
      break;
    }

    case 'b': {
      // BISHOP (Streamlined mitre with gold collar & finial ball)
      const p: THREE.Vector2[] = [];
      p.push(new THREE.Vector2(0, 0.01));
      p.push(new THREE.Vector2(0.35, 0.01));
      p.push(new THREE.Vector2(0.35, 0.05));
      p.push(new THREE.Vector2(0.30, 0.09));
      p.push(new THREE.Vector2(0.24, 0.14));
      p.push(new THREE.Vector2(0.18, 0.22));
      // Slender waist
      p.push(new THREE.Vector2(0.13, 0.36));
      p.push(new THREE.Vector2(0.12, 0.52));
      p.push(new THREE.Vector2(0.14, 0.66));
      // Collar
      p.push(new THREE.Vector2(0.19, 0.72));
      p.push(new THREE.Vector2(0.17, 0.76));
      p.push(new THREE.Vector2(0.13, 0.78));
      // Mitre teardrop oval
      for (let a = -Math.PI / 2; a <= Math.PI / 2; a += Math.PI / 14) {
        const rx = 0.18;
        const ry = 0.28;
        p.push(new THREE.Vector2(Math.max(0, Math.cos(a) * rx), 1.06 + Math.sin(a) * ry));
      }
      p.push(new THREE.Vector2(0, 1.34));

      const bishopGeom = createLathe(p);
      const bishopMesh = new THREE.Mesh(bishopGeom, mat);
      group.add(bishopMesh);

      // Gold collar ring
      const collarRingGeom = new THREE.TorusGeometry(0.16, 0.022, 16, 28);
      const collarRing = new THREE.Mesh(collarRingGeom, goldMat);
      collarRing.rotation.x = Math.PI / 2;
      collarRing.position.y = 0.74;
      group.add(collarRing);

      // Golden finial ball
      const finialGeom = new THREE.SphereGeometry(0.065, 20, 20);
      const finial = new THREE.Mesh(finialGeom, goldMat);
      finial.position.y = 1.38;
      group.add(finial);
      break;
    }

    case 'q': {
      // QUEEN (Hourglass waist, royal fluted coronet with gold jewel)
      const p: THREE.Vector2[] = [];
      p.push(new THREE.Vector2(0, 0.01));
      p.push(new THREE.Vector2(0.36, 0.01));
      p.push(new THREE.Vector2(0.36, 0.05));
      p.push(new THREE.Vector2(0.31, 0.09));
      p.push(new THREE.Vector2(0.25, 0.14));
      p.push(new THREE.Vector2(0.19, 0.22));
      // Royal gown waist
      p.push(new THREE.Vector2(0.14, 0.40));
      p.push(new THREE.Vector2(0.13, 0.60));
      p.push(new THREE.Vector2(0.16, 0.78));
      // Golden sash collar
      p.push(new THREE.Vector2(0.22, 0.85));
      p.push(new THREE.Vector2(0.20, 0.89));
      p.push(new THREE.Vector2(0.15, 0.91));
      // Flared imperial coronet
      p.push(new THREE.Vector2(0.24, 1.08));
      p.push(new THREE.Vector2(0.26, 1.22));
      p.push(new THREE.Vector2(0.22, 1.25));
      p.push(new THREE.Vector2(0.14, 1.20));
      p.push(new THREE.Vector2(0, 1.20));

      const queenGeom = createLathe(p);
      const queenMesh = new THREE.Mesh(queenGeom, mat);
      group.add(queenMesh);

      // Gold waist sash
      const sashRingGeom = new THREE.TorusGeometry(0.19, 0.024, 16, 32);
      const sashRing = new THREE.Mesh(sashRingGeom, goldMat);
      sashRing.rotation.x = Math.PI / 2;
      sashRing.position.y = 0.87;
      group.add(sashRing);

      // Queen's top gold jewel
      const jewelGeom = new THREE.SphereGeometry(0.08, 22, 22);
      const jewel = new THREE.Mesh(jewelGeom, goldMat);
      jewel.position.y = 1.30;
      group.add(jewel);
      break;
    }

    case 'k': {
      // KING (Imperial stature, double gold collar, royal crown dome and cross)
      const p: THREE.Vector2[] = [];
      p.push(new THREE.Vector2(0, 0.01));
      p.push(new THREE.Vector2(0.37, 0.01));
      p.push(new THREE.Vector2(0.37, 0.05));
      p.push(new THREE.Vector2(0.32, 0.09));
      p.push(new THREE.Vector2(0.26, 0.15));
      p.push(new THREE.Vector2(0.20, 0.24));
      // Imperial robe waist
      p.push(new THREE.Vector2(0.15, 0.44));
      p.push(new THREE.Vector2(0.14, 0.68));
      p.push(new THREE.Vector2(0.17, 0.88));
      // Lower collar
      p.push(new THREE.Vector2(0.24, 0.95));
      p.push(new THREE.Vector2(0.21, 0.99));
      // Upper crown collar
      p.push(new THREE.Vector2(0.25, 1.06));
      p.push(new THREE.Vector2(0.22, 1.10));
      // Crown dome
      p.push(new THREE.Vector2(0.26, 1.24));
      p.push(new THREE.Vector2(0.22, 1.36));
      p.push(new THREE.Vector2(0.15, 1.40));
      p.push(new THREE.Vector2(0, 1.40));

      const kingGeom = createLathe(p);
      const kingMesh = new THREE.Mesh(kingGeom, mat);
      group.add(kingMesh);

      // Gold collar ring
      const kingRingGeom = new THREE.TorusGeometry(0.22, 0.024, 16, 32);
      const kingRing = new THREE.Mesh(kingRingGeom, goldMat);
      kingRing.rotation.x = Math.PI / 2;
      kingRing.position.y = 0.97;
      group.add(kingRing);

      // Royal Gold Cross (clean, beveled, elegant)
      const crossVertGeom = new THREE.BoxGeometry(0.055, 0.22, 0.055);
      const crossVert = new THREE.Mesh(crossVertGeom, goldMat);
      crossVert.position.y = 1.50;
      group.add(crossVert);

      const crossHorizGeom = new THREE.BoxGeometry(0.16, 0.055, 0.055);
      const crossHoriz = new THREE.Mesh(crossHorizGeom, goldMat);
      crossHoriz.position.y = 1.53;
      group.add(crossHoriz);
      break;
    }
  }

  // Enable cast & receive shadows cleanly on all sub-meshes
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}
