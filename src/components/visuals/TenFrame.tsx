import React from 'react';

export interface TenFrameProps {
  /** T11C — số lượng chấm cần hiển thị (0–20, hỗ trợ nhiều khung 10). */
  count?: number;
  /** T11B — số chục (0–10). Dùng khi không có `count`. */
  chuc?: number;
  /** T11B — số đơn vị (0–9). Dùng khi không có `count`. */
  donVi?: number;
  /** T11C — màu chấm tô (mặc định cam). */
  fillColor?: string;
  /** T11C — màu viền khung. */
  frameColor?: string;
  /** T11C — màu nền khung. */
  bgColor?: string;
  /** T11B — kích thước một ô (px). */
  cell?: number;
  /** T11B — hiện tổng bên dưới (chỉ dùng khi không hỏi "số nào"). */
  showTotal?: boolean;
}

/**
 * T11C — khung 10 ô (2 hàng × 5 ô) tô theo số lượng `count` (0–10 một khung,
 * số lớn hơn thì nhiều khung); dùng thuộc tính JSX camelCase.
 *
 * T11A/T11B — khay 5 ô: mỗi hàng đầy là một chục (`chuc`), hàng cuối ghi số
 * đơn vị (`donVi`). Bé đếm được "mấy chục và mấy đơn vị" ngay trên hình.
 *
 * Merge: nếu có `count` thì render kiểu T11C (khung 10 ô); ngược lại render
 * kiểu T11B (khay chục–đơn vị) nên dữ liệu cả hai lane đều hiển thị đúng.
 */
export const TenFrame: React.FC<TenFrameProps> = ({
  count,
  chuc = 0,
  donVi = 0,
  fillColor = '#e65100',
  frameColor = '#e65100',
  bgColor = '#fff3e0',
  cell = 18,
  showTotal = false,
}) => {
  // T11C path — count-based multi-frame (2 hàng × 5 ô).
  if (count !== undefined) {
    const safeCount = Math.max(0, Math.round(Number(count) || 0));
    const numFrames = Math.ceil(Math.max(safeCount, 1) / 10);
    const frames = Array.from({ length: numFrames }, (_, frameIndex) => {
      const frameStart = frameIndex * 10;
      const frameCount = Math.min(safeCount - frameStart, 10);
      return (
        <g key={frameIndex} transform={`translate(${frameIndex * 220}, 0)`}>
          {/* Khung 10 ô: 2 hàng × 5 ô */}
          <rect
            x="10"
            y="10"
            width="200"
            height="80"
            rx="6"
            ry="6"
            fill={bgColor}
            stroke={frameColor}
            strokeWidth="3"
          />
          {/* Các ô - hàng trên (5 ô) */}
          {Array.from({ length: 5 }, (_, col) => (
            <rect
              key={`top-${col}`}
              x={20 + col * 38}
              y={18}
              width="30"
              height="30"
              rx="4"
              ry="4"
              fill={col < Math.min(frameCount, 5) ? fillColor : bgColor}
              stroke={frameColor}
              strokeWidth="1.5"
            />
          ))}
          {/* Các ô - hàng dưới (5 ô) */}
          {Array.from({ length: 5 }, (_, col) => (
            <rect
              key={`bottom-${col}`}
              x={20 + col * 38}
              y={54}
              width="30"
              height="30"
              rx="4"
              ry="4"
              fill={col < Math.max(0, frameCount - 5) ? fillColor : bgColor}
              stroke={frameColor}
              strokeWidth="1.5"
            />
          ))}
          {/* Số thứ tự khung */}
          <text x="110" y="105" textAnchor="middle" fontSize="12" fill="#667085">
            {numFrames > 1 ? `Khung ${frameIndex + 1}` : `Tổng: ${safeCount}`}
          </text>
        </g>
      );
    });

    const totalWidth = numFrames * 220;

    return (
      <svg
        width={totalWidth}
        height="120"
        viewBox={`0 0 ${totalWidth} 120`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`Khay mười ô biểu diễn ${safeCount}`}
      >
        {frames}
      </svg>
    );
  }

  // T11B path — chuc/donVi circles.
  const safeChuc = Math.min(10, Math.max(0, Math.round(Number(chuc) || 0)));
  const safeDonVi = Math.min(9, Math.max(0, Math.round(Number(donVi) || 0)));
  const rows = Math.max(1, safeChuc + (safeDonVi > 0 ? 1 : 0));
  const total = safeChuc * 10 + safeDonVi;
  const width = cell * 5 + cell * 0.6;
  const height = rows * cell + cell * 0.6 + (showTotal ? cell * 0.7 : 0);
  const radius = cell * 0.34;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Khay năm ô biểu diễn ${safeChuc} chục ${safeDonVi} đơn vị`}
    >
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: 5 }, (_, col) => {
          const isChuc = row < safeChuc;
          const isUnit = row === safeChuc && col < safeDonVi;
          const cx = cell * 0.3 + col * cell;
          const cy = cell * 0.3 + row * cell;
          return (
            <circle
              key={`${row}-${col}`}
              cx={cx}
              cy={cy}
              r={radius}
              fill={isChuc ? '#f08c00' : isUnit ? '#ffd166' : '#fdf3e3'}
              stroke="#e65100"
              strokeWidth="1"
            />
          );
        })
      )}
      {showTotal && (
        <text
          x={width / 2}
          y={height - cell * 0.05}
          textAnchor="middle"
          fontSize={Math.max(11, cell * 0.6)}
          fontWeight="700"
          fill="#b34700"
        >
          {total}
        </text>
      )}
    </svg>
  );
};
