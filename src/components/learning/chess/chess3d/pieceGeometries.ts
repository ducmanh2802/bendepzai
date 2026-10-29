import * as THREE from 'three';
import type { Color, PieceType } from '../chessEngine';

// Materials cache
let whiteMat: THREE.MeshStandardMaterial | null = null;
let blackMat: THREE.MeshStandardMaterial | null = null;
let goldMat: THREE.MeshStandardMaterial | null = null;
let darkWoodMat: THREE.MeshStandardMaterial | null = null;

export function getPieceMaterials() {
  if (!whiteMat) {
    whiteMat = new THREE.MeshStandardMaterial({
      color: 0xfbf8ee,
      roughness: 0.22,
      metalness: 0.08,
      bumpScale: 0.05,
    });
  }
  if (!blackMat) {
    blackMat = new THREE.MeshStandardMaterial({
      color: 0x262322,
      roughness: 0.25,
      metalness: 0.15,
    });
  }
  if (!goldMat) {
    goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.18,
      metalness: 0.75,
    });
  }
  if (!darkWoodMat) {
    darkWoodMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.45,
      metalness: 0.05,
    });
  }
  return { whiteMat, blackMat, goldMat, darkWoodMat };
}

/**
 * Creates a composite 3D piece mesh group
 */
export function createPieceMesh(type: PieceType, color: Color): THREE.Group {
  const { whiteMat, blackMat, goldMat } = getPieceMaterials();
  const mat = color === 'w' ? whiteMat : blackMat;
  const group = new THREE.Group();
  group.name = `piece_${color}_${type}`;

  // Shared base pedestal
  const baseBottomGeom = new THREE.CylinderGeometry(0.38, 0.42, 0.08, 24);
  const baseBottom = new THREE.Mesh(baseBottomGeom, mat);
  baseBottom.position.y = 0.04;
  baseBottom.castShadow = true;
  baseBottom.receiveShadow = true;
  group.add(baseBottom);

  const baseRingGeom = new THREE.CylinderGeometry(0.34, 0.38, 0.06, 24);
  const baseRing = new THREE.Mesh(baseRingGeom, mat);
  baseRing.position.y = 0.11;
  baseRing.castShadow = true;
  group.add(baseRing);

  const baseSlopeGeom = new THREE.CylinderGeometry(0.24, 0.34, 0.12, 24);
  const baseSlope = new THREE.Mesh(baseSlopeGeom, mat);
  baseSlope.position.y = 0.2;
  baseSlope.castShadow = true;
  group.add(baseSlope);

  switch (type) {
    case 'p': {
      // PAWN
      // Stem
      const stemGeom = new THREE.CylinderGeometry(0.14, 0.22, 0.35, 20);
      const stem = new THREE.Mesh(stemGeom, mat);
      stem.position.y = 0.435;
      stem.castShadow = true;
      group.add(stem);

      // Collar
      const collarGeom = new THREE.TorusGeometry(0.18, 0.035, 12, 20);
      const collar = new THREE.Mesh(collarGeom, mat);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 0.62;
      collar.castShadow = true;
      group.add(collar);

      // Head sphere
      const headGeom = new THREE.SphereGeometry(0.18, 20, 20);
      const head = new THREE.Mesh(headGeom, mat);
      head.position.y = 0.77;
      head.castShadow = true;
      group.add(head);
      break;
    }

    case 'r': {
      // ROOK (Castle)
      // Main tower body
      const towerGeom = new THREE.CylinderGeometry(0.25, 0.28, 0.55, 24);
      const tower = new THREE.Mesh(towerGeom, mat);
      tower.position.y = 0.53;
      tower.castShadow = true;
      group.add(tower);

      // Upper rim
      const rimGeom = new THREE.CylinderGeometry(0.32, 0.26, 0.15, 24);
      const rim = new THREE.Mesh(rimGeom, mat);
      rim.position.y = 0.88;
      rim.castShadow = true;
      group.add(rim);

      // 4 Castle battlements (parapets)
      const battlementCount = 4;
      for (let i = 0; i < battlementCount; i++) {
        const angle = (i * Math.PI * 2) / battlementCount + Math.PI / 4;
        const bGeom = new THREE.BoxGeometry(0.14, 0.12, 0.1);
        const bMesh = new THREE.Mesh(bGeom, mat);
        bMesh.position.set(Math.cos(angle) * 0.22, 0.98, Math.sin(angle) * 0.22);
        bMesh.rotation.y = -angle;
        bMesh.castShadow = true;
        group.add(bMesh);
      }
      break;
    }

    case 'n': {
      // KNIGHT (Horse)
      // Lower neck
      const neckLowerGeom = new THREE.CylinderGeometry(0.2, 0.25, 0.3, 20);
      const neckLower = new THREE.Mesh(neckLowerGeom, mat);
      neckLower.position.set(0, 0.41, 0);
      neckLower.castShadow = true;
      group.add(neckLower);

      // Angled neck / chest
      const neckGeom = new THREE.BoxGeometry(0.22, 0.42, 0.32);
      const neck = new THREE.Mesh(neckGeom, mat);
      neck.position.set(0, 0.65, -0.05);
      neck.rotation.x = 0.25;
      neck.castShadow = true;
      group.add(neck);

      // Muzzle / snout
      const muzzleGeom = new THREE.BoxGeometry(0.18, 0.18, 0.28);
      const muzzle = new THREE.Mesh(muzzleGeom, mat);
      muzzle.position.set(0, 0.78, 0.15);
      muzzle.rotation.x = -0.15;
      muzzle.castShadow = true;
      group.add(muzzle);

      // Ears (2 pointed ears)
      const earLeftGeom = new THREE.ConeGeometry(0.04, 0.14, 8);
      const earLeft = new THREE.Mesh(earLeftGeom, mat);
      earLeft.position.set(-0.07, 0.95, -0.05);
      earLeft.rotation.z = -0.15;
      earLeft.castShadow = true;
      group.add(earLeft);

      const earRightGeom = new THREE.ConeGeometry(0.04, 0.14, 8);
      const earRight = new THREE.Mesh(earRightGeom, mat);
      earRight.position.set(0.07, 0.95, -0.05);
      earRight.rotation.z = 0.15;
      earRight.castShadow = true;
      group.add(earRight);

      // Mane back ridges
      const maneGeom = new THREE.BoxGeometry(0.06, 0.35, 0.14);
      const mane = new THREE.Mesh(maneGeom, goldMat);
      mane.position.set(0, 0.72, -0.2);
      mane.rotation.x = 0.3;
      mane.castShadow = true;
      group.add(mane);

      // Face toward player or opponent
      if (color === 'b') {
        group.rotation.y = Math.PI;
      }
      break;
    }

    case 'b': {
      // BISHOP
      // Tapered body
      const bodyGeom = new THREE.CylinderGeometry(0.18, 0.26, 0.55, 24);
      const body = new THREE.Mesh(bodyGeom, mat);
      body.position.y = 0.53;
      body.castShadow = true;
      group.add(body);

      // Collar
      const collarGeom = new THREE.TorusGeometry(0.2, 0.035, 12, 24);
      const collar = new THREE.Mesh(collarGeom, goldMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 0.81;
      collar.castShadow = true;
      group.add(collar);

      // Mitre egg/pointed head
      const mitreGeom = new THREE.SphereGeometry(0.2, 20, 20);
      mitreGeom.scale(0.85, 1.4, 0.85);
      const mitre = new THREE.Mesh(mitreGeom, mat);
      mitre.position.y = 1.05;
      mitre.castShadow = true;
      group.add(mitre);

      // Finial top ball
      const topBallGeom = new THREE.SphereGeometry(0.06, 16, 16);
      const topBall = new THREE.Mesh(topBallGeom, goldMat);
      topBall.position.y = 1.34;
      topBall.castShadow = true;
      group.add(topBall);
      break;
    }

    case 'q': {
      // QUEEN
      // Flared gown body
      const bodyGeom = new THREE.CylinderGeometry(0.22, 0.3, 0.7, 24);
      const body = new THREE.Mesh(bodyGeom, mat);
      body.position.y = 0.6;
      body.castShadow = true;
      group.add(body);

      // Upper torso collar
      const collarGeom = new THREE.TorusGeometry(0.24, 0.04, 12, 24);
      const collar = new THREE.Mesh(collarGeom, goldMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 0.96;
      collar.castShadow = true;
      group.add(collar);

      // Crown bowl
      const crownBowlGeom = new THREE.CylinderGeometry(0.28, 0.18, 0.25, 24);
      const crownBowl = new THREE.Mesh(crownBowlGeom, mat);
      crownBowl.position.y = 1.1;
      crownBowl.castShadow = true;
      group.add(crownBowl);

      // Crown spikes (8 little jewels around crown rim)
      const spikeCount = 8;
      for (let i = 0; i < spikeCount; i++) {
        const angle = (i * Math.PI * 2) / spikeCount;
        const spikeGeom = new THREE.SphereGeometry(0.04, 10, 10);
        const spike = new THREE.Mesh(spikeGeom, goldMat);
        spike.position.set(Math.cos(angle) * 0.27, 1.22, Math.sin(angle) * 0.27);
        spike.castShadow = true;
        group.add(spike);
      }

      // Royal center pearl
      const pearlGeom = new THREE.SphereGeometry(0.09, 18, 18);
      const pearl = new THREE.Mesh(pearlGeom, goldMat);
      pearl.position.y = 1.32;
      pearl.castShadow = true;
      group.add(pearl);
      break;
    }

    case 'k': {
      // KING
      // Majestic tall body
      const bodyGeom = new THREE.CylinderGeometry(0.24, 0.32, 0.8, 24);
      const body = new THREE.Mesh(bodyGeom, mat);
      body.position.y = 0.65;
      body.castShadow = true;
      group.add(body);

      // Golden regal collar
      const collarGeom = new THREE.TorusGeometry(0.26, 0.045, 12, 24);
      const collar = new THREE.Mesh(collarGeom, goldMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 1.06;
      collar.castShadow = true;
      group.add(collar);

      // King's crown dome
      const crownGeom = new THREE.CylinderGeometry(0.3, 0.22, 0.28, 24);
      const crown = new THREE.Mesh(crownGeom, mat);
      crown.position.y = 1.21;
      crown.castShadow = true;
      group.add(crown);

      // Royal cross on top (vertical + horizontal bar)
      const crossVertGeom = new THREE.BoxGeometry(0.05, 0.22, 0.05);
      const crossVert = new THREE.Mesh(crossVertGeom, goldMat);
      crossVert.position.y = 1.45;
      crossVert.castShadow = true;
      group.add(crossVert);

      const crossHorizGeom = new THREE.BoxGeometry(0.16, 0.05, 0.05);
      const crossHoriz = new THREE.Mesh(crossHorizGeom, goldMat);
      crossHoriz.position.y = 1.48;
      crossHoriz.castShadow = true;
      group.add(crossHoriz);
      break;
    }
  }

  // Shadow settings on all child meshes
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}
