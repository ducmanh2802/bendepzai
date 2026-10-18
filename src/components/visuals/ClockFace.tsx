import React from 'react';

export interface ClockFaceProps {
  /** Giờ 1–12. */
  gio: number;
  /** Phút 0–59 (giờ đúng = 0). */
  phut: number;
  /** Vietnamese clocks are 12-hour with sáng/chiều. Định dạng 12 giờ (T11C). */
  amPm: 'sáng' | 'chiều';
  /** Cạnh hình vuông (px). */
  size?: number;
}

/** Position on the dial: 0° = 12 o'clock, clockwise positive. */
function polar(cx: number, cy: number, radius: number, degFrom12: number) {
  const rad = ((degFrom12 - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

/**
 * T11B — mặt đồng hồ SVG đọc giờ đúng (không dùng emoji).
 *
 * 12 số hiển thị đúng vị trí (12 ở đỉnh, 3 bên phải...), kim ngắn chỉ giờ,
 * kim dài chỉ phút. `gio`/`phut` được kẹp về khoảng hợp lệ nên dữ liệu sai
 * không bao giờ vẽ ra hình vô nghĩa cho bé.
 *
 * T11C — giữ thuộc tính JSX dạng camelCase ở mọi component visuals;
 * mặt đồng hồ 12 giờ với nhãn sáng/chiều.
 */
export const ClockFace: React.FC<ClockFaceProps> = ({ gio, phut, amPm, size = 200 }) => {
  const safeGio = Math.min(12, Math.max(1, Math.round(Number(gio) || 0)));
  const safePhut = Math.min(59, Math.max(0, Math.round(Number(phut) || 0)));
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const hourDeg = (safeGio % 12) * 30 + safePhut * 0.5;
  const minuteDeg = safePhut * 6;
  const hourTip = polar(cx, cy, r * 0.55, hourDeg);
  const minuteTip = polar(cx, cy, r * 0.78, minuteDeg);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Đồng hồ chỉ ${safeGio} giờ ${safePhut} phút ${amPm}`}
    >
      <circle cx={cx} cy={cy} r={r} fill="#fff8ec" stroke="#e65100" strokeWidth={Math.max(2, size * 0.03)} />

      {/* Vạch phút (60 vạch) */}
      {Array.from({ length: 60 }, (_, i) => {
        const deg = i * 6;
        const isHour = deg % 30 === 0;
        const p1 = polar(cx, cy, isHour ? r * 0.86 : r * 0.92, deg);
        const p2 = polar(cx, cy, r * 0.97, deg);
        return (
          <line
            key={`tick-${i}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={isHour ? '#e65100' : '#d7c6ab'}
            strokeWidth={isHour ? Math.max(1.5, size * 0.012) : Math.max(0.6, size * 0.005)}
          />
        );
      })}

      {/* 12 số đúng vị trí */}
      {Array.from({ length: 12 }, (_, i) => {
        const num = i + 1;
        const p = polar(cx, cy, r * 0.72, num * 30);
        return (
          <text
            key={`num-${num}`}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={Math.max(10, size * 0.1)}
            fontWeight="700"
            fill="#b34700"
          >
            {num}
          </text>
        );
      })}

      {/* Kim ngắn (giờ) */}
      <line
        x1={cx}
        y1={cy}
        x2={hourTip.x}
        y2={hourTip.y}
        stroke="#e65100"
        strokeWidth={Math.max(3, size * 0.035)}
        strokeLinecap="round"
      />
      {/* Kim dài (phút) */}
      <line
        x1={cx}
        y1={cy}
        x2={minuteTip.x}
        y2={minuteTip.y}
        stroke="#8d5524"
        strokeWidth={Math.max(2, size * 0.022)}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={Math.max(3, size * 0.03)} fill="#8d5524" />

      <text
        x={cx}
        y={size - Math.max(2, size * 0.03)}
        textAnchor="middle"
        fontSize={Math.max(10, size * 0.075)}
        fontWeight="700"
        fill="#7a6a52"
      >
        {amPm}
      </text>
    </svg>
  );
};
