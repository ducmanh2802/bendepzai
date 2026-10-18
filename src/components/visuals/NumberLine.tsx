import React from 'react';

export interface NumberLineProps {
  /** Số bắt đầu. */
  start: number;
  /** Số kết thúc. */
  end: number;
  /** Số được đánh dấu. */
  current?: number;
  /** Vị trí ô trống cần điền (hiển thị dấu ?). */
  missing?: number;
  /** Bước nhảy (mặc định 1). */
  step?: number;
  /** Chiều rộng (px). */
  width?: number;
}

/**
 * T11A/T11B — tia số: ghi số tại mỗi vạch, đánh dấu số đang xét hoặc ô trống.
 * T11C — giữ JSX camelCase (`strokeWidth`), đường tia số + nhãn start/end/current.
 */
export const NumberLine: React.FC<NumberLineProps> = ({
  start,
  end,
  current,
  missing,
  step = 1,
  width = 320,
}) => {
  const safeStep = Math.max(1, Math.round(Number(step) || 1));
  const safeStart = Math.round(Number(start) || 0);
  const safeEnd = Math.max(safeStart + safeStep, Math.round(Number(end) || safeStart + safeStep));
  const span = safeEnd - safeStart;
  const ticks = Math.floor(span / safeStep) + 1;
  const xOf = (value: number) => ((value - safeStart) / span) * (width - 24) + 12;
  const y = 54;

  const highlight = Number.isFinite(current as number) ? Number(current) : undefined;
  const gap = Number.isFinite(missing as number) ? Number(missing) : undefined;

  return (
    <svg
      width={width}
      height="96"
      viewBox={`0 0 ${width} 96`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={
        gap !== undefined
          ? `Tia số từ ${safeStart} đến ${safeEnd}, thiếu số thứ ${gap}`
          : `Tia số từ ${safeStart} đến ${safeEnd}, đánh dấu số ${highlight ?? ''}`
      }
    >
      <defs>
        <marker id="number-line-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#e65100" />
        </marker>
      </defs>
      <line
        x1="4"
        y1={y}
        x2={width - 4}
        y2={y}
        stroke="#e65100"
        strokeWidth="2"
        markerEnd="url(#number-line-arrow)"
      />

      {Array.from({ length: ticks }, (_, i) => {
        const value = safeStart + i * safeStep;
        const x = xOf(value);
        const showLabel = ticks <= 12 || value % 5 === 0 || value === safeStart || value === safeEnd;
        const isGap = gap === value;
        return (
          <g key={`tick-${value}`}>
            <line x1={x} y1={y - 7} x2={x} y2={y + 7} stroke="#e65100" strokeWidth="2" />
            {isGap ? (
              <>
                <rect x={x - 13} y={y - 30} width="26" height="22" rx="5" fill="#ffe0b2" stroke="#e65100" strokeWidth="2" />
                <text x={x} y={y - 15} textAnchor="middle" fontSize="13" fontWeight="700" fill="#b34700">
                  ?
                </text>
              </>
            ) : showLabel ? (
              <text
                x={x}
                y={y - 12}
                textAnchor="middle"
                fontSize="12"
                fontWeight={highlight === value ? '700' : '500'}
                fill="#7a6a52"
              >
                {value}
              </text>
            ) : null}
            {highlight === value && (
              <>
                <circle cx={x} cy={y} r="8" fill="#f08c00" stroke="#e65100" strokeWidth="2" />
                <text x={x} y={y + 26} textAnchor="middle" fontSize="13" fontWeight="700" fill="#b34700">
                  {value}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};
