import React from 'react';
import type { Color, PieceType } from './chessEngine';

interface ChessPieceSvgProps {
  type: PieceType;
  color: Color;
  className?: string;
  size?: number | string;
}

/**
 * Quân cờ vector theo dáng Staunton gỗ: trắng = phong/ngà, đen = gụ.
 * Không còn chi tiết mạ vàng vì bộ cờ gỗ thật không có kim loại màu vàng.
 */
export const ChessPieceSvg: React.FC<ChessPieceSvgProps> = ({
  type,
  color,
  className = '',
  size = '100%',
}) => {
  const isWhite = color === 'w';
  const idPrefix = `cp_${color}_${type}`;
  const body = isWhite ? `url(#${idPrefix}_w_body)` : `url(#${idPrefix}_b_body)`;
  // Đai/cổ trang trí là rãnh tiện sâu hơn thân nên tối màu một bậc, vẫn cùng khối gỗ.
  const carve = `url(#${idPrefix}_band)`;
  const outline = isWhite ? '#8a6a3f' : '#241407';
  const outlineSoft = isWhite ? '#7a5a32' : '#1c0f05';
  const inlay = isWhite ? '#5c3f22' : '#e2c79b';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`drop-shadow-sm select-none pointer-events-none transition-transform ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Trắng: gỗ phong sáng ngà, không phải sứ bóng gương */}
        <linearGradient id={`${idPrefix}_w_body`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fdf3df" />
          <stop offset="45%" stopColor="#f3e2c0" />
          <stop offset="100%" stopColor="#dcc094" />
        </linearGradient>

        <linearGradient id={`${idPrefix}_w_highlight`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fffaf0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fffaf0" stopOpacity="0.1" />
        </linearGradient>

        {/* Đen: gỗ gụ đánh vecni, ánh nâu đỏ chứ không phải xám lam */}
        <linearGradient id={`${idPrefix}_b_body`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6b4226" />
          <stop offset="40%" stopColor="#4a2c17" />
          <stop offset="100%" stopColor="#2b180c" />
        </linearGradient>

        <linearGradient id={`${idPrefix}_b_highlight`} x1="0%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#8a5a34" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#2b180c" stopOpacity="0.2" />
        </linearGradient>

        {/* Đai chạm khắc: vẫn là gỗ, chỉ tối hơn thân một bậc */}
        <linearGradient id={`${idPrefix}_band`} x1="0%" y1="0%" x2="100%" y2="100%">
          {isWhite ? (
            <>
              <stop offset="0%" stopColor="#d9bd8b" />
              <stop offset="40%" stopColor="#bd9b66" />
              <stop offset="100%" stopColor="#8a6a3f" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#5a3720" />
              <stop offset="40%" stopColor="#3b2212" />
              <stop offset="100%" stopColor="#241407" />
            </>
          )}
        </linearGradient>

        {/* Soft Drop Shadow Filter */}
        <filter id={`${idPrefix}_shadow`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter={`url(#${idPrefix}_shadow)`}>
        {type === 'p' && (
          /* Tốt */
          <g>
            {/* Pedestal Base */}
            <path
              d="M24 88 C24 83, 30 81, 36 80 L64 80 C70 81, 76 83, 76 88 L76 92 C76 93, 74 94, 72 94 L28 94 C26 94, 24 93, 24 92 Z"
              fill={body}
              stroke={outline}
              strokeWidth="1.8"
            />
            <rect x="33" y="77" width="34" height="4" rx="2" fill={carve} />
            {/* Cổ thon */}
            <path
              d="M36 77 C38 62, 42 50, 43 42 L57 42 C58 50, 62 62, 64 77 Z"
              fill={body}
              stroke={outlineSoft}
              strokeWidth="1.8"
            />
            <ellipse cx="50" cy="40" rx="14" ry="4" fill={carve} />
            <circle cx="50" cy="25" r="15" fill={body} stroke={outline} strokeWidth="2" />
            {/* Highlight đầu quân trắng */}
            <circle cx="45" cy="20" r="4" fill="#fdfaf3" fillOpacity={isWhite ? '0.75' : '0.35'} />
          </g>
        )}

        {type === 'r' && (
          /* Xe (tháp) */
          <g>
            <path
              d="M22 88 C22 83, 28 81, 34 80 L66 80 C72 81, 78 83, 78 88 L78 92 C78 93, 76 94, 74 94 L26 94 C24 94, 22 93, 22 92 Z"
              fill={body}
              stroke={outline}
              strokeWidth="1.8"
            />
            <rect x="31" y="77" width="38" height="4" rx="2" fill={carve} />
            <path
              d="M33 77 L35 38 L65 38 L67 77 Z"
              fill={body}
              stroke={outlineSoft}
              strokeWidth="1.8"
            />
            <rect x="29" y="35" width="42" height="4.5" rx="2" fill={carve} />
            {/* Lưng tháp có ngách */}
            <path
              d="M27 35 L27 19 L37 19 L37 26 L45 26 L45 19 L55 19 L55 26 L63 26 L63 19 L73 19 L73 35 Z"
              fill={body}
              stroke={outline}
              strokeWidth="2"
            />
          </g>
        )}

        {type === 'n' && (
          /* Mã (đầu ngựa) */
          <g>
            <path
              d="M22 88 C22 83, 28 81, 34 80 L66 80 C72 81, 78 83, 78 88 L78 92 C78 93, 76 94, 74 94 L26 94 C24 94, 22 93, 22 92 Z"
              fill={body}
              stroke={outline}
              strokeWidth="1.8"
            />
            <rect x="31" y="77" width="38" height="4" rx="2" fill={carve} />
            <path
              d="M34 77 C35 66, 32 58, 25 50 C23 47, 25 43, 29 44 C33 45, 37 47, 36 38 C35 30, 42 16, 48 14 C51 13, 53 17, 54 22 C58 20, 62 21, 65 24 C69 28, 73 36, 75 46 C76 56, 72 68, 66 77 Z"
              fill={body}
              stroke={outline}
              strokeWidth="2"
            />
            {/* Bờm chạm nổi */}
            <path
              d="M48 14 C54 18, 64 24, 68 36 C72 48, 72 62, 66 77 C69 66, 70 50, 66 38 C63 29, 58 22, 54 20 Z"
              fill={carve}
            />
            <circle cx="42" cy="27" r="2.8" fill={inlay} />
            <path d="M48 14 L53 8 L54 18 Z" fill={carve} />
          </g>
        )}

        {type === 'b' && (
          /* Tượng (mũ giám mục) */
          <g>
            <path
              d="M23 88 C23 83, 29 81, 35 80 L65 80 C71 81, 77 83, 77 88 L77 92 C77 93, 75 94, 73 94 L27 94 C25 94, 23 93, 23 92 Z"
              fill={body}
              stroke={outline}
              strokeWidth="1.8"
            />
            <rect x="32" y="77" width="36" height="4" rx="2" fill={carve} />
            <path
              d="M37 77 C39 65, 42 56, 44 48 L56 48 C58 56, 61 65, 63 77 Z"
              fill={body}
              stroke={outlineSoft}
              strokeWidth="1.8"
            />
            <ellipse cx="50" cy="46" rx="14" ry="4" fill={carve} />
            <path
              d="M35 46 C35 34, 43 20, 50 16 C57 20, 65 34, 65 46 C65 50, 62 52, 50 52 C38 52, 35 50, 35 46 Z"
              fill={body}
              stroke={outline}
              strokeWidth="2"
            />
            {/* Kẽ chẻ trên mũ */}
            <path d="M48 24 L56 36" stroke={inlay} strokeWidth="2.5" strokeLinecap="round" />
            {/* Bông đầu mũ: cùng khối gỗ */}
            <circle cx="50" cy="14" r="4.5" fill={body} stroke={outline} strokeWidth="1.5" />
          </g>
        )}

        {type === 'q' && (
          /* Hậu (miện rộng) */
          <g>
            <path
              d="M21 88 C21 83, 27 81, 33 80 L67 80 C73 81, 79 83, 79 88 L79 92 C79 93, 77 94, 75 94 L25 94 C23 94, 21 93, 21 92 Z"
              fill={body}
              stroke={outline}
              strokeWidth="1.8"
            />
            <rect x="30" y="77" width="40" height="4" rx="2" fill={carve} />
            <path
              d="M34 77 C37 62, 40 50, 42 42 L58 42 C60 50, 63 62, 66 77 Z"
              fill={body}
              stroke={outlineSoft}
              strokeWidth="1.8"
            />
            <ellipse cx="50" cy="42" rx="15" ry="4" fill={carve} />
            <path
              d="M27 24 L34 40 L66 40 L73 24 L60 32 L50 20 L40 32 Z"
              fill={body}
              stroke={outline}
              strokeWidth="2"
            />
            {/* 5 chốt gỗ trên miện */}
            <circle cx="27" cy="23" r="3.2" fill={body} stroke={outline} strokeWidth="1.2" />
            <circle cx="40" cy="31" r="2.8" fill={body} stroke={outline} strokeWidth="1.2" />
            <circle cx="50" cy="18" r="4.2" fill={body} stroke={outline} strokeWidth="1.2" />
            <circle cx="60" cy="31" r="2.8" fill={body} stroke={outline} strokeWidth="1.2" />
            <circle cx="73" cy="23" r="3.2" fill={body} stroke={outline} strokeWidth="1.2" />
          </g>
        )}

        {type === 'k' && (
          /* Vua (thánh giá + áo choàng) */
          <g>
            <path
              d="M20 88 C20 83, 26 81, 33 80 L67 80 C74 81, 80 83, 80 88 L80 92 C80 93, 78 94, 76 94 L24 94 C22 94, 20 93, 20 92 Z"
              fill={body}
              stroke={outline}
              strokeWidth="1.8"
            />
            <rect x="29" y="77" width="42" height="4" rx="2" fill={carve} />
            <path
              d="M33 77 C36 60, 40 48, 41 38 L59 38 C60 48, 64 60, 67 77 Z"
              fill={body}
              stroke={outlineSoft}
              strokeWidth="1.8"
            />
            <ellipse cx="50" cy="38" rx="16" ry="4" fill={carve} />
            <ellipse cx="50" cy="33" rx="14" ry="3.5" fill={carve} />
            <path
              d="M34 33 C34 22, 42 16, 50 16 C58 16, 66 22, 66 33 Z"
              fill={body}
              stroke={outline}
              strokeWidth="2"
            />
            {/* Thánh giá đỉnh: tiện bằng cùng khối gỗ */}
            <path d="M48 6 L52 6 L52 16 L48 16 Z M44 9 L56 9 L56 13 L44 13 Z" fill={carve} />
            {/* Lõm giữa miện: rãnh khoét, không phải đá quý màu */}
            <circle cx="50" cy="11" r="2.2" fill={inlay} />
          </g>
        )}
      </g>
    </svg>
  );
};
