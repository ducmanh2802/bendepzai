import React from 'react';

export interface RulerProps {
  /** Chiều dài thước (cm), 1–100. T11C alias: `length` (mặc định 100). */
  length: number;
  /** Số cm được tô màu (độ dài đồ vật đo được). */
  objectLength?: number;
  /** Chiều rộng tối đa (px) — mặc định vừa màn hình 375px. T11C alias: `screenWidth`. */
  width?: number;
  /** T11C — chiều rộng màn hình (alias của `width`, giữ để test T11C compile). */
  screenWidth?: number;
  /** Nhãn đơn vị, mặc định "cm". */
  unit?: string;
  /** T11C — số lượng vạch chia (giữ để test T11C compile; render T11B chia theo cm nên không cần dùng). */
  ticks?: number;
}

/**
 * T11B — thước đo cm (SVG) cho môn đo độ dài.
 *
 * Vạch chia mỗi 1cm, ghi số mỗi 5cm; khi có `objectLength` thì phần thước
 * tương ứng được tô màu để bé đọc được số đo ngay trên hình.
 *
 * T11C — giữ JSX camelCase + đường thước chính; chấp nhận thêm
 * `ticks`/`screenWidth` (test T11C dùng `ticks`) nên cả hai lane đều compile.
 */
export const Ruler: React.FC<RulerProps> = ({
  length,
  objectLength,
  width = 320,
  screenWidth,
  unit = 'cm',
  ticks: _ticks,
}) => {
  void _ticks;
  const resolvedWidth = screenWidth ?? width;
  const safeLength = Math.min(100, Math.max(1, Math.round(Number(length) || 1)));
  const ratio = resolvedWidth / safeLength;
  const height = 78;

  const highlighted = Math.min(
    safeLength,
    Math.max(0, Math.round(Number(objectLength ?? 0)))
  );

  const labels = Array.from({ length: Math.floor(safeLength / 5) + 1 }, (_, i) => i * 5);

  return (
    <svg
      width={resolvedWidth}
      height={height}
      viewBox={`0 0 ${resolvedWidth} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={
        highlighted > 0
          ? `Thước ${safeLength} ${unit}, đồ vật dài ${highlighted} ${unit}`
          : `Thước dài ${safeLength} ${unit}`
      }
    >
      {/* Thân thước */}
      <rect x="0" y="34" width={resolvedWidth} height="26" rx="6" fill="#fff3d6" stroke="#e65100" strokeWidth="2" />

      {/* Phần được tô màu = độ dài đồ vật */}
      {highlighted > 0 && (
        <rect
          x="0"
          y="34"
          width={highlighted * ratio}
          height="26"
          rx="6"
          fill="#ffcc80"
          stroke="#e65100"
          strokeWidth="2"
        />
      )}

      {/* Vạch chia mỗi cm */}
      {Array.from({ length: safeLength + 1 }, (_, i) => {
        const x = i * ratio;
        const isMajor = i % 5 === 0;
        return (
          <line
            key={`cm-${i}`}
            x1={x}
            y1="34"
            x2={x}
            y2={isMajor ? 58 : 48}
            stroke="#e65100"
            strokeWidth={isMajor ? 2 : 1}
          />
        );
      })}

      {/* Số ghi trên thước */}
      {labels.map((value) => (
        <text
          key={`label-${value}`}
          x={value * ratio}
          y="26"
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill="#b34700"
        >
          {value}
        </text>
      ))}

      <text x={resolvedWidth / 2} y="72" textAnchor="middle" fontSize="12" fill="#7a6a52">
        {unit}
      </text>
    </svg>
  );
};
