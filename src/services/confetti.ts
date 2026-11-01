/**
 * Canvas particle celebration confetti.
 * Zero external dependencies.
 */

import { sound } from './sound';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  shape: 'rect' | 'circle' | 'star';
  life: number;
  maxLife: number;
}

const celebrationHistory: Array<'small' | 'medium' | 'large' | 'extreme'> = [];
const MAX_HISTORY = 3;

/**
 * tiếng "hò reo" dùng lại MỘT AudioContext. Tạo mới mỗi lần ăn mừng thì chạm
 * trần của trình duyệt (Chrome chỉ cho ~6 context/tab): sau vài lần ăn mừng lớn,
 * `new AudioContext()` ném lỗi, khối try nuốt lỗi và bé mất hẳn âm thanh chiến
 * thắng dù hình vẫn bắn. Context dùng chung cũng không cần đóng — dao động tự
 * stop() sau 0,5s.
 */
let cheerCtx: AudioContext | null = null;

function getCheerContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!cheerCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      cheerCtx = new AudioCtx();
    } catch {
      return null;
    }
  }
  if (cheerCtx.state === 'suspended') {
    cheerCtx.resume().catch(() => {});
  }
  return cheerCtx;
}

function playCheer() {
  if (sound.getMuted()) return;
  const ctx = getCheerContext();
  if (!ctx) return;
  try {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
  } catch {
    // Ignore audio error
  }
}

export function fireCelebrationSmall() {
  if (typeof document === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Reduced motion: fade effect instead of confetti
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    canvas.style.opacity = '0';
    document.body.appendChild(canvas);
    canvas.style.transition = 'opacity 0.3s ease';
    canvas.style.opacity = '0.3';
    setTimeout(() => canvas.remove(), 300);
    return;
  }

  // Prevent repeating the same type too frequently
  const lastType = celebrationHistory[ celebrationHistory.length - 1 ];
  if (lastType === 'small') {
    fireCelebrationMedium();
    return;
  }

  celebrationHistory.push('small');
  if (celebrationHistory.length > MAX_HISTORY) celebrationHistory.shift();

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();

  // Small: few particles shining around center
  const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6'];
  const particleCount = 20;
  const particles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.random() * Math.PI * 2);
    const distance = 30 + Math.random() * 50;
    particles.push({
      x: canvas.width / 2 + Math.cos(angle) * distance,
      y: canvas.height / 2 + Math.sin(angle) * distance,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: Math.cos(angle) * (0.5 + Math.random() * 1),
      vy: Math.sin(angle) * (0.5 + Math.random() * 1),
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 2,
      shape: 'circle',
      life: 0,
      maxLife: 60 + Math.random() * 30,
    });
  }

  let animationFrameId: number;

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let aliveCount = 0;

    for (const p of particles) {
      p.life++;
      if (p.life > p.maxLife) continue;
      aliveCount++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.vx *= 0.99;
      p.rotation += p.vRot;

      const alpha = 1 - p.life / p.maxLife;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (aliveCount > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }
  };

  animationFrameId = requestAnimationFrame(render);
}

export function fireCelebrationMedium() {
  if (typeof document === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Reduced motion: fade effect
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    canvas.style.opacity = '0';
    document.body.appendChild(canvas);
    canvas.style.transition = 'opacity 0.3s ease';
    canvas.style.opacity = '0.3';
    setTimeout(() => canvas.remove(), 300);
    return;
  }

  // Prevent repeating the same type too frequently
  const lastType = celebrationHistory[ celebrationHistory.length - 1 ];
  if (lastType === 'medium') {
    fireCelebrationLarge();
    return;
  }

  celebrationHistory.push('medium');
  if (celebrationHistory.length > MAX_HISTORY) celebrationHistory.shift();

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();

  const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#FBBF24'];
  const particleCount = 45;
  const particles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 180,
      y: canvas.height * 0.45 + (Math.random() - 0.5) * 80,
      size: 5 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.85) * 15,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 5,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      life: 0,
      maxLife: 80 + Math.random() * 40,
    });
  }

  let animationFrameId: number;

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let aliveCount = 0;

    for (const p of particles) {
      p.life++;
      if (p.life > p.maxLife) continue;
      aliveCount++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.vx *= 0.985;
      p.rotation += p.vRot;

      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (aliveCount > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }
  };

  animationFrameId = requestAnimationFrame(render);
}

export function fireCelebrationLarge() {
  if (typeof document === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Reduced motion: simple fade
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    canvas.style.opacity = '0';
    document.body.appendChild(canvas);
    canvas.style.transition = 'opacity 0.3s ease';
    canvas.style.opacity = '0.3';
    setTimeout(() => canvas.remove(), 300);
    return;
  }

  // Prevent repeating the same type too frequently
  const lastType = celebrationHistory[ celebrationHistory.length - 1 ];
  if (lastType === 'large') {
    fireCelebrationExtreme();
    return;
  }

  celebrationHistory.push('large');
  if (celebrationHistory.length > MAX_HISTORY) celebrationHistory.shift();

  // Play cheer sound effect
  playCheer();

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();

  const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#FBBF24'];
  const particleCount = 90;
  const particles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 240,
      y: canvas.height * 0.45 + (Math.random() - 0.5) * 100,
      size: 6 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.85) * 18,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
      life: 0,
      maxLife: 100 + Math.random() * 50,
    });
  }

  let animationFrameId: number;

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let aliveCount = 0;

    for (const p of particles) {
      p.life++;
      if (p.life > p.maxLife) continue;
      aliveCount++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.vx *= 0.985;
      p.rotation += p.vRot;

      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (aliveCount > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }
  };

  animationFrameId = requestAnimationFrame(render);
}

export function fireCelebrationExtreme() {
  if (typeof document === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Reduced motion: full-screen flash fade
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '99999';
    overlay.style.background = 'linear-gradient(135deg, #fcd34d 0%, #f87171 100%)';
    overlay.style.opacity = '0';
    document.body.appendChild(overlay);
    overlay.style.transition = 'opacity 0.5s ease';
    overlay.style.opacity = '0.5';
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 500);
    }, 10);
    return;
  }

  // Prevent repeating the same type too frequently
  const lastType = celebrationHistory[ celebrationHistory.length - 1 ];
  if (lastType === 'extreme') {
    fireCelebrationLarge();
    return;
  }

  celebrationHistory.push('extreme');
  if (celebrationHistory.length > MAX_HISTORY) celebrationHistory.shift();

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();

  // Star colors for extreme celebration
  const colors = ['#FCD34D', '#F87171', '#EAB308', '#84CC16', '#3B82F6', '#A855F7', '#F472B6', '#EC4899'];
  const particleCount = 200;
  const particles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 1,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 2,
      shape: 'star',
      life: 0,
      maxLife: 120 + Math.random() * 60,
    });
  }

  let animationFrameId: number;

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let aliveCount = 0;

    for (const p of particles) {
      p.life++;
      if (p.life > p.maxLife) continue;
      aliveCount++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.vx *= 0.99;
      p.rotation += p.vRot;

      const alpha = 1 - p.life / p.maxLife;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      // Draw star shape
      ctx.beginPath();
      const innerRadius = p.size / 2;
      const outerRadius = p.size;
      for (let i = 0; i < 5; i++) {
        const angle1 = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const angle2 = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
        ctx.arc(0, 0, outerRadius, angle1, angle1 + 0);
        ctx.arc(0, 0, innerRadius, angle1 + 0, angle2 + 0);
      }
      ctx.fill();
      ctx.restore();
    }

    if (aliveCount > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }
  };

  animationFrameId = requestAnimationFrame(render);
}

/** @deprecated Use fireCelebrationMedium() instead. */
export function fireCelebrationConfetti(): void {
  fireCelebrationMedium();
}