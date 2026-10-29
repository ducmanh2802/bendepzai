import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Board, Move } from '../chessEngine';
import { createPieceMesh } from './pieceGeometries';
import {
  buildChessBoard3D,
  createMoveMarker,
  createSelectedMarker,
  createLastMoveMarker,
  createCheckMarker,
  type BoardMeshRefs,
} from './boardBuilder';
import { sound } from '../../../../services/sound';
import { Maximize2, Compass, Eye, RotateCcw } from 'lucide-react';

interface Chess3DCanvasProps {
  board: Board;
  selected: [number, number] | null;
  legalMoves: Move[];
  lastMove: Move | null;
  turn: 'w' | 'b';
  status: string;
  isThinking: boolean;
  onSquareClick: (r: number, c: number) => void;
  className?: string;
}

export type CameraPreset = 'iso' | 'pov' | 'top';

interface PieceAnimation {
  mesh: THREE.Group;
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  progress: number;
  duration: number; // in seconds
  onComplete?: () => void;
}

export const Chess3DCanvas: React.FC<Chess3DCanvasProps> = ({
  board,
  selected,
  legalMoves,
  lastMove,
  turn,
  status,
  isThinking,
  onSquareClick,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const boardRefs = useRef<BoardMeshRefs | null>(null);
  const pieceMeshes = useRef<Map<string, THREE.Group>>(new Map());
  const activeAnimation = useRef<PieceAnimation | null>(null);
  const previousBoard = useRef<Board | null>(null);

  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Detect software WebGL safely
  const isSoftwareGl = useRef<boolean>(false);
  useEffect(() => {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        isSoftwareGl.current = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      }
    } catch {
      isSoftwareGl.current = true;
    }
  }, []);

  // Raycaster for mouse / touch clicks
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());
  const pointerDownPos = useRef({ x: 0, y: 0 });

  // Camera preset transitions
  const applyCameraPreset = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    sound.playClick?.();
    if (preset === 'iso') {
      camera.position.set(0, 7.5, 7.5);
      controls.target.set(0, 0, 0);
    } else if (preset === 'pov') {
      camera.position.set(0, 5.2, 6.2);
      controls.target.set(0, 0.4, 0);
    } else if (preset === 'top') {
      camera.position.set(0, 10.5, 0.01);
      controls.target.set(0, 0, 0);
    }
    controls.update();
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x1e293b); // deep slate luxury room

    // Subtle atmospheric ambient fog
    scene.fog = new THREE.FogExp2(0x1e293b, 0.025);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 7.5, 7.5);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl.current,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl.current ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    if (!isSoftwareGl.current) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent viewing underneath the table
    controls.minDistance = 4.0;
    controls.maxDistance = 15.0;
    controls.target.set(0, 0, 0);
    controls.update();

    // 5. Lighting Setup
    // Warm key ambient
    const ambientLight = new THREE.AmbientLight(0xfff6ea, 0.75);
    scene.add(ambientLight);

    // Main spotlight from top-right with soft shadows
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(5, 12, 6);
    keyLight.castShadow = !isSoftwareGl.current;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 25;
      keyLight.shadow.camera.left = -6;
      keyLight.shadow.camera.right = 6;
      keyLight.shadow.camera.top = 6;
      keyLight.shadow.camera.bottom = -6;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    // Soft blue rim light for silhouette separation
    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.45);
    rimLight.position.set(-6, 8, -6);
    scene.add(rimLight);

    // Warm underside bounce light
    const bounceLight = new THREE.DirectionalLight(0xfef08a, 0.25);
    bounceLight.position.set(0, -5, 0);
    scene.add(bounceLight);

    // 6. Build Board
    const boardData = buildChessBoard3D();
    boardRefs.current = boardData;
    scene.add(boardData.boardGroup);

    // 7. Decorative Ambient Floor below table
    const floorGeom = new THREE.PlaneGeometry(30, 30);
    floorGeom.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = -0.41;
    floor.receiveShadow = true;
    scene.add(floor);

    // 8. Animation & Render Loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      controls.update();

      // Handle piece hop/slide animation
      if (activeAnimation.current) {
        const anim = activeAnimation.current;
        anim.progress += delta / anim.duration;

        if (anim.progress >= 1.0) {
          anim.mesh.position.copy(anim.toPos);
          if (anim.onComplete) anim.onComplete();
          activeAnimation.current = null;
        } else {
          // Quadratic arc curve: smooth ease + hop arc
          const t = anim.progress;
          const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          anim.mesh.position.lerpVectors(anim.fromPos, anim.toPos, ease);
          // Arch height in middle of jump
          const arcHeight = Math.sin(t * Math.PI) * 0.45;
          anim.mesh.position.y = anim.fromPos.y + arcHeight;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Sync 3D Pieces with Board State
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const tileSize = 1.0;
    const tileY = 0.06;

    // Detect if this is an update move to animate
    let movedPieceId: string | null = null;
    let fromCoord: [number, number] | null = null;
    let toCoord: [number, number] | null = null;

    if (lastMove && previousBoard.current) {
      fromCoord = lastMove.from;
      toCoord = lastMove.to;
      movedPieceId = `p_${toCoord[0]}_${toCoord[1]}`;
    }

    // Clean up previous piece meshes
    pieceMeshes.current.forEach((mesh) => {
      scene.remove(mesh);
    });
    pieceMeshes.current.clear();

    // Place pieces from board matrix
    board.forEach((row, r) => {
      row.forEach((piece, c) => {
        if (!piece) return;

        const pieceMesh = createPieceMesh(piece.type, piece.color);
        const targetX = (c - 3.5) * tileSize;
        const targetZ = (r - 3.5) * tileSize;

        // Is this the currently selected piece?
        const isSelected = selected && selected[0] === r && selected[1] === c;
        const currentY = tileY + (isSelected ? 0.35 : 0);

        // Check if animating from previous position
        if (lastMove && r === lastMove.to[0] && c === lastMove.to[1]) {
          const fromX = (lastMove.from[1] - 3.5) * tileSize;
          const fromZ = (lastMove.from[0] - 3.5) * tileSize;
          const fromVec = new THREE.Vector3(fromX, tileY, fromZ);
          const toVec = new THREE.Vector3(targetX, tileY, targetZ);

          pieceMesh.position.copy(fromVec);
          activeAnimation.current = {
            mesh: pieceMesh,
            fromPos: fromVec,
            toPos: toVec,
            progress: 0,
            duration: 0.32,
          };
        } else {
          pieceMesh.position.set(targetX, currentY, targetZ);
        }

        scene.add(pieceMesh);
        pieceMeshes.current.set(`p_${r}_${c}`, pieceMesh);
      });
    });

    previousBoard.current = board.map((row) => [...row]);
  }, [board, selected, lastMove]);

  // Update Board Highlights (selected, legal moves, check, last move)
  useEffect(() => {
    const refs = boardRefs.current;
    if (!refs) return;

    const { highlightGroup } = refs;

    // Remove old highlights
    while (highlightGroup.children.length > 0) {
      highlightGroup.remove(highlightGroup.children[0]);
    }

    const tileSize = 1.0;

    // 1. Last Move Highlight (from & to)
    if (lastMove) {
      const fromMarker = createLastMoveMarker();
      fromMarker.position.set((lastMove.from[1] - 3.5) * tileSize, 0, (lastMove.from[0] - 3.5) * tileSize);
      highlightGroup.add(fromMarker);

      const toMarker = createLastMoveMarker();
      toMarker.position.set((lastMove.to[1] - 3.5) * tileSize, 0, (lastMove.to[0] - 3.5) * tileSize);
      highlightGroup.add(toMarker);
    }

    // 2. Selected Piece Indicator (glowing ring)
    if (selected) {
      const selMarker = createSelectedMarker();
      selMarker.position.set((selected[1] - 3.5) * tileSize, 0.005, (selected[0] - 3.5) * tileSize);
      highlightGroup.add(selMarker);
    }

    // 3. Legal Move Target Markers
    legalMoves.forEach((move) => {
      const [tr, tc] = move.to;
      const isCapture = Boolean(board[tr][tc]);
      const marker = createMoveMarker(isCapture);
      marker.position.set((tc - 3.5) * tileSize, 0.01, (tr - 3.5) * tileSize);
      highlightGroup.add(marker);
    });

    // 4. Check Indicator for King
    if (status.includes('Chiếu')) {
      const kingColor = turn;
      let kingPos: [number, number] | null = null;
      board.forEach((row, r) => {
        row.forEach((p, c) => {
          if (p && p.type === 'k' && p.color === kingColor) {
            kingPos = [r, c];
          }
        });
      });

      if (kingPos) {
        const checkMarker = createCheckMarker();
        checkMarker.position.set((kingPos[1] - 3.5) * tileSize, 0.008, (kingPos[0] - 3.5) * tileSize);
        highlightGroup.add(checkMarker);
      }
    }
  }, [board, selected, legalMoves, lastMove, turn, status]);

  // Pointer event handlers for clicking squares
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const dx = Math.abs(e.clientX - pointerDownPos.current.x);
    const dy = Math.abs(e.clientY - pointerDownPos.current.y);

    // If dragged more than 6px, treat as OrbitControls rotation, not square click
    if (dx > 6 || dy > 6) return;

    const container = containerRef.current;
    const camera = cameraRef.current;
    const refs = boardRefs.current;
    if (!container || !camera || !refs) return;

    const rect = container.getBoundingClientRect();
    pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(pointer.current, camera);
    const intersects = raycaster.current.intersectObjects(refs.squareHitBoxes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const { row, col } = hit.userData;
      if (typeof row === 'number' && typeof col === 'number') {
        onSquareClick(row, col);
      }
    }
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border-4 border-amber-300 shadow-2xl bg-slate-900 select-none ${
        isFullscreen ? 'fixed inset-4 z-50' : 'w-full aspect-[4/3] sm:aspect-[16/10] max-h-[560px]'
      } ${className}`}
    >
      {/* 3D WebGL Canvas Mount */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Floating 3D Controls Bar */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-slate-700 shadow-lg text-white">
        <button
          onClick={() => applyCameraPreset('iso')}
          title="Góc nhìn 3D bé (Mặc định)"
          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
            cameraPreset === 'iso' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-300 hover:text-white'
          }`}
        >
          3D
        </button>
        <button
          onClick={() => applyCameraPreset('pov')}
          title="Góc nhìn người chơi"
          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
            cameraPreset === 'pov' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-300 hover:text-white'
          }`}
        >
          Người chơi
        </button>
        <button
          onClick={() => applyCameraPreset('top')}
          title="Góc nhìn từ trên xuống"
          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
            cameraPreset === 'top' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-300 hover:text-white'
          }`}
        >
          Từ trên
        </button>
        <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Thu nhỏ' : 'Mở rộng'}
          className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Helper Hint */}
      <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none">
        <span className="px-3 py-1 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full text-[11px] sm:text-xs font-semibold text-amber-200 shadow-sm flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
          <span>Vuốt để xoay góc nhìn 360° · Cuộn để phóng to</span>
        </span>
      </div>

      {/* Thinking Overlay Banner */}
      {isThinking && (
        <div className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur-md px-3 py-1.5 rounded-2xl text-xs font-black text-white shadow-lg flex items-center gap-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>Máy đang tính nước đi...</span>
        </div>
      )}
    </div>
  );
};
