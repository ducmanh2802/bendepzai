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
  createHintMarker,
  type BoardMeshRefs,
} from './boardBuilder';
import { sound } from '../../../../services/sound';
import {
  Maximize2,
  Minimize2,
  Compass,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Focus,
  Lightbulb,
} from 'lucide-react';

interface Chess3DCanvasProps {
  board: Board;
  selected: [number, number] | null;
  legalMoves: Move[];
  lastMove: Move | null;
  hintMove?: Move | null;
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
  hintMove,
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
  const clickableObjects = useRef<THREE.Object3D[]>([]);
  const activeAnimation = useRef<PieceAnimation | null>(null);
  const previousBoard = useRef<Board | null>(null);

  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

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
  const applyCameraPreset = useCallback(
    (preset: CameraPreset) => {
      setCameraPreset(preset);
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;

      sound.playClick?.();
      const flipSign = isFlipped ? -1 : 1;

      if (preset === 'iso') {
        camera.position.set(0, 8.0, 8.0 * flipSign);
        controls.target.set(0, 0, 0);
      } else if (preset === 'pov') {
        camera.position.set(0, 5.2, 6.2 * flipSign);
        controls.target.set(0, 0.4, 0);
      } else if (preset === 'top') {
        camera.position.set(0, 11.5, 0.01 * flipSign);
        controls.target.set(0, 0, 0);
      }
      controls.update();
    },
    [isFlipped]
  );

  // Zoom In / Out handlers
  const handleZoom = (inOut: 'in' | 'out') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    sound.playClick?.();

    const factor = inOut === 'in' ? 0.82 : 1.22;
    const offset = camera.position.clone().sub(controls.target);
    offset.multiplyScalar(factor);

    // Clamp distance between 4 and 16
    if (offset.length() >= 3.8 && offset.length() <= 16.0) {
      camera.position.copy(controls.target).add(offset);
      controls.update();
    }
  };

  // Flip board perspective 180 degrees
  const handleFlipPerspective = () => {
    sound.playClick?.();
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    camera.position.x = -camera.position.x;
    camera.position.z = -camera.position.z;
    controls.update();
  };

  // Reset Camera to standard center view
  const handleResetCamera = () => {
    sound.playClick?.();
    applyCameraPreset('iso');
  };

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 550;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x18202f); // deep slate room ambiance

    // Subtle atmospheric ambient fog
    scene.fog = new THREE.FogExp2(0x18202f, 0.02);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 8.0, 8.0);
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
    renderer.toneMappingExposure = 1.2;
    if (!isSoftwareGl.current) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.06; // Keep camera above table surface
    controls.minDistance = 3.8;
    controls.maxDistance = 16.0;
    controls.target.set(0, 0, 0);
    controls.update();

    // 5. Lighting Setup (Rich Studio lighting)
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 0.85);
    scene.add(ambientLight);

    // Main warm directional key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(6, 14, 7);
    keyLight.castShadow = !isSoftwareGl.current;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 30;
      keyLight.shadow.camera.left = -6.5;
      keyLight.shadow.camera.right = 6.5;
      keyLight.shadow.camera.top = 6.5;
      keyLight.shadow.camera.bottom = -6.5;
      keyLight.shadow.bias = -0.0004;
    }
    scene.add(keyLight);

    // Soft sky blue rim light
    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.55);
    rimLight.position.set(-7, 9, -7);
    scene.add(rimLight);

    // Soft warm floor bounce
    const bounceLight = new THREE.DirectionalLight(0xfef3c7, 0.3);
    bounceLight.position.set(0, -6, 0);
    scene.add(bounceLight);

    // 6. Build 3D Board
    const boardData = buildChessBoard3D();
    boardRefs.current = boardData;
    scene.add(boardData.boardGroup);

    // 7. Ambient Floor Plate
    const floorGeom = new THREE.PlaneGeometry(36, 36);
    floorGeom.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0b1120,
      roughness: 0.85,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = -0.42;
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
          const t = anim.progress;
          const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          anim.mesh.position.lerpVectors(anim.fromPos, anim.toPos, ease);
          // High elegant jumping arc
          const arcHeight = Math.sin(t * Math.PI) * 0.52;
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

  // Sync 3D Pieces with Board State & Attach Direct Clickable Metadata
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const tileSize = 1.0;
    const tileY = 0.06;

    // Clean up previous piece meshes
    pieceMeshes.current.forEach((mesh) => {
      scene.remove(mesh);
    });
    pieceMeshes.current.clear();

    const newClickables: THREE.Object3D[] = [];

    // Place pieces from board matrix
    board.forEach((row, r) => {
      row.forEach((piece, c) => {
        if (!piece) return;

        const pieceMesh = createPieceMesh(piece.type, piece.color);
        const targetX = (c - 3.5) * tileSize;
        const targetZ = (r - 3.5) * tileSize;

        // Attach click metadata to the group and ALL child meshes so clicking ANY PART
        // of a 3D piece (head, body, base) directly triggers the square!
        pieceMesh.userData = { row: r, col: c, isPiece: true };
        pieceMesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.userData = { row: r, col: c, isPiece: true };
            newClickables.push(child);
          }
        });

        // Elevated floating stance for selected piece
        const isSelected = selected && selected[0] === r && selected[1] === c;
        const currentY = tileY + (isSelected ? 0.45 : 0);

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
            duration: 0.35,
          };
        } else {
          pieceMesh.position.set(targetX, currentY, targetZ);
        }

        scene.add(pieceMesh);
        pieceMeshes.current.set(`p_${r}_${c}`, pieceMesh);
      });
    });

    clickableObjects.current = newClickables;
    previousBoard.current = board.map((row) => [...row]);
  }, [board, selected, lastMove]);

  // Update Board Highlights (selected, legal moves, check, last move, hint)
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
      fromMarker.position.set(
        (lastMove.from[1] - 3.5) * tileSize,
        0,
        (lastMove.from[0] - 3.5) * tileSize
      );
      highlightGroup.add(fromMarker);

      const toMarker = createLastMoveMarker();
      toMarker.position.set(
        (lastMove.to[1] - 3.5) * tileSize,
        0,
        (lastMove.to[0] - 3.5) * tileSize
      );
      highlightGroup.add(toMarker);
    }

    // 2. Selected Piece Indicator (glowing golden beacon ring)
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
      marker.traverse((child) => {
        child.userData = { row: tr, col: tc, isMoveTarget: true };
      });
      highlightGroup.add(marker);
    });

    // 4. Hint Move Marker (if child pressed Gợi ý)
    if (hintMove) {
      const hintMarker = createHintMarker();
      hintMarker.position.set(
        (hintMove.to[1] - 3.5) * tileSize,
        0.012,
        (hintMove.to[0] - 3.5) * tileSize
      );
      highlightGroup.add(hintMarker);
    }

    // 5. Check Indicator for King
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
        checkMarker.position.set(
          (kingPos[1] - 3.5) * tileSize,
          0.008,
          (kingPos[0] - 3.5) * tileSize
        );
        highlightGroup.add(checkMarker);
      }
    }
  }, [board, selected, legalMoves, lastMove, hintMove, turn, status]);

  // Pointer event handlers for clicking pieces & squares
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const dx = Math.abs(e.clientX - pointerDownPos.current.x);
    const dy = Math.abs(e.clientY - pointerDownPos.current.y);

    // If dragged more than 8px, treat as OrbitControls rotation, not click
    if (dx > 8 || dy > 8) return;

    const container = containerRef.current;
    const camera = cameraRef.current;
    const refs = boardRefs.current;
    if (!container || !camera || !refs) return;

    const rect = container.getBoundingClientRect();
    pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(pointer.current, camera);

    // Raycast against BOTH piece meshes AND floor hitboxes!
    const targets = [...clickableObjects.current, ...refs.squareHitBoxes];
    const intersects = raycaster.current.intersectObjects(targets, true);

    if (intersects.length > 0) {
      // Find the closest intersected object with valid row & col
      for (const hit of intersects) {
        const data = hit.object.userData;
        if (typeof data?.row === 'number' && typeof data?.col === 'number') {
          onSquareClick(data.row, data.col);
          break;
        }
      }
    }
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border-4 border-amber-300 shadow-2xl bg-slate-900 select-none transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-[100] w-screen h-screen rounded-none border-0'
          : 'w-full h-[60vh] min-h-[460px] md:h-[72vh] lg:h-[78vh] max-h-[820px]'
      } ${className}`}
    >
      {/* 3D WebGL Canvas Mount */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Floating 3D Controls Bar (Top Right) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-2xl border-2 border-slate-700/80 shadow-xl text-white">
        <button
          onClick={() => applyCameraPreset('iso')}
          title="Góc nhìn 3D bé (Mặc định)"
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            cameraPreset === 'iso'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          3D
        </button>
        <button
          onClick={() => applyCameraPreset('pov')}
          title="Góc nhìn trực diện"
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            cameraPreset === 'pov'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          Người chơi
        </button>
        <button
          onClick={() => applyCameraPreset('top')}
          title="Góc nhìn từ trên xuống"
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            cameraPreset === 'top'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          Từ trên
        </button>

        <div className="w-[1px] h-5 bg-slate-700 mx-0.5" />

        {/* Rotate 180° / Flip Side */}
        <button
          onClick={handleFlipPerspective}
          title="Đổi hướng xoay bàn cờ 180°"
          className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Zoom In */}
        <button
          onClick={() => handleZoom('in')}
          title="Phóng to gần hơn"
          className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => handleZoom('out')}
          title="Thu nhỏ xa hơn"
          className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Reset Camera to Center */}
        <button
          onClick={handleResetCamera}
          title="Căn giữa bàn cờ"
          className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Focus className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-700 mx-0.5" />

        {/* Fullscreen / Theater Toggle */}
        <button
          onClick={() => {
            sound.playClick?.();
            setIsFullscreen(!isFullscreen);
          }}
          title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
          className={`p-1.5 rounded-xl transition-all cursor-pointer ${
            isFullscreen
              ? 'bg-amber-500 text-white'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Interactive Helper Hint (Bottom Center) */}
      <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
        <span className="px-3.5 py-1.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-full text-xs font-bold text-amber-200 shadow-md flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <span>Chạm trực tiếp vào quân cờ để chọn · Vuốt để xoay 360°</span>
        </span>
      </div>

      {/* Top Left: Thinking & Check Alerts */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
        {isThinking && (
          <div className="bg-amber-500 px-3.5 py-1.5 rounded-2xl text-xs font-black text-white shadow-xl flex items-center gap-2 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>Máy đang tính nước đi...</span>
          </div>
        )}

        {status && (
          <div className="bg-rose-600 px-3.5 py-1.5 rounded-2xl text-xs font-black text-white shadow-xl flex items-center gap-2 animate-bounce-subtle">
            <span>⚠️ {status}</span>
          </div>
        )}
      </div>
    </div>
  );
};
