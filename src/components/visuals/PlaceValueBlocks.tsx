import React from 'react';

export interface PlaceValueBlocksProps {
  /** Chục (0–9). */
  chuc: number;
  /** Đơn vị (0–9). */
  donVi: number;
  /** T11C — màu nền cho chục (tùy chọn, mặc định cam). */
  chucColor?: string;
  /** T11C — màu nền cho đơn vị (tùy chọn, mặc định vàng). */
  donViColor?: string;
}

/**
 * T11A/T11B — khối chục – đơn vị: mỗi thanh dài là một chục (chia làm 10 ô
 * nhỏ), mỗi ô vuông là một đơn vị. Bé đếm được số bằng cách nhóm và đếm mười.
 *
 * T11C — chấp nhận thêm `chucColor`/`donViColor` (màu tùy chọn cho hai cột);
 * màu tùy chọn đổi màu tô của thanh chục / ô đơn vị nhưng không đổi bố cục.
 */
export const PlaceValueBlocks: React.FC<PlaceValueBlocksProps> = ({
  chuc,
  donVi,
  chucColor = '#f08c00',
  donViColor = '#ffd166',
}) => {
  const safeChuc = Math.min(9, Math.max(0, Math.round(Number(chuc) || 0)));
  const safeDonVi = Math.min(9, Math.max(0, Math.round(Number(donVi) || 0)));

  const rodWidth = 16;
  const rodHeight = 22;
  const unit = 11;
  const gap = 4;
  const columns = Math.max(safeChuc + 1, 5);
  const width = columns * (rodWidth + gap) + gap;
  const height = rodHeight + unit + gap * 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Khối chục đơn vị: ${safeChuc} chục và ${safeDonVi} đơn vị`}
    >
      {/* Các thanh "mười" */}
      {Array.from({ length: safeChuc }, (_, i) => (
        <g key={`rod-${i}`}>
          <rect
            x={gap + i * (rodWidth + gap)}
            y={gap}
            width={rodWidth}
            height={rodHeight}
            rx="2"
            fill={chucColor}
            stroke="#e65100"
            strokeWidth="1"
          />
          {Array.from({ length: 9 }, (_, k) => (
            <line
              key={`seg-${k}`}
              x1={gap + i * (rodWidth + gap)}
              y1={gap + ((k + 1) * rodHeight) / 10}
              x2={gap + i * (rodWidth + gap) + rodWidth}
              y2={gap + ((k + 1) * rodHeight) / 10}
              stroke="#fff3d6"
              strokeWidth="0.8"
            />
          ))}
        </g>
      ))}

      {/* Các ô "một" */}
      {Array.from({ length: safeDonVi }, (_, i) => (
        <rect
          key={`unit-${i}`}
          x={gap + i * (unit + gap / 2)}
          y={gap + rodHeight + gap}
          width={unit}
          height={unit}
          rx="2"
          fill={donViColor}
          stroke="#e65100"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
};
