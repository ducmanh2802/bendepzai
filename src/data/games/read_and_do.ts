/**
 * T15 — Đọc Câu Làm Theo (read_and_do) data. Pure TypeScript, no React imports.
 *
 * Một cảnh đơn giản (phòng, sân, vườn) với vài đồ vật. Bé đọc câu
 * ("Đặt quả bóng lên ghế.") rồi đưa vật vào đúng chỗ.
 * Cấp cao: câu 2 vế, từ chỉ vị trí (trên, dưới, cạnh, trong),
 * màu sắc + số lượng.
 */

import { pickDistinct, roundsForTier, seededRng, shuffleSeeded } from '../gameLevels';

export type PositionWord = 'trên' | 'dưới' | 'cạnh' | 'trong';

export interface ReadDoObject {
  id: string;
  /** Tên hiển thị trên thẻ vật (kèm màu / số lượng khi có). */
  label: string;
  emoji: string;
}

export interface ReadDoPlace {
  id: string;
  label: string;
  emoji: string;
}

export interface ReadDoMove {
  objectId: string;
  placeId: string;
}

export interface ReadDoRound {
  id: string;
  scene: string;
  sceneEmoji: string;
  sentence: string;
  position: PositionWord;
  objects: ReadDoObject[];
  places: ReadDoPlace[];
  moves: ReadDoMove[];
}

interface ReadDoSeed {
  sentence: string;
  position: PositionWord;
  scene: string;
  sceneEmoji: string;
  objects: ReadDoObject[];
  places: ReadDoPlace[];
  moves: ReadDoMove[];
}

/**
 * POOL_BY_TIER — mỗi pool 8 câu (số vòng tối đa mỗi cấp là 8).
 * T1: 1 vế, vị trí "trên".
 * T2: 1 vế, thêm "dưới / cạnh / trong".
 * T3: + màu sắc (vật cùng loại khác màu làm mồi).
 * T4: + số lượng (thẻ vật ghi số lượng, câu nêu số).
 * T5: câu 2 vế (2 lần đưa).
 * T6: câu 2 vế + màu sắc / số lượng.
 */
export const POOL_BY_TIER: ReadDoSeed[][] = [
  // T1 — "Đặt … lên …"
  [
    {
      sentence: 'Đặt quả bóng lên ghế.', position: 'trên', scene: 'Căn phòng nhỏ', sceneEmoji: '🏠',
      objects: [
        { id: 'bong', label: 'quả bóng', emoji: '⚽' },
        { id: 'gau', label: 'chú gấu', emoji: '🧸' },
        { id: 'sach', label: 'quyển sách', emoji: '📖' },
      ],
      places: [
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
        { id: 'giuong', label: 'giường', emoji: '🛏️' },
        { id: 'ke', label: 'kệ', emoji: '📚' },
      ],
      moves: [{ objectId: 'bong', placeId: 'ghe' }],
    },
    {
      sentence: 'Đặt chú gấu lên giường.', position: 'trên', scene: 'Căn phòng nhỏ', sceneEmoji: '🏠',
      objects: [
        { id: 'gau', label: 'chú gấu', emoji: '🧸' },
        { id: 'bong', label: 'quả bóng', emoji: '⚽' },
        { id: 'but', label: 'cây bút', emoji: '✏️' },
      ],
      places: [
        { id: 'giuong', label: 'giường', emoji: '🛏️' },
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
        { id: 'tham', label: 'thảm', emoji: '🟫' },
      ],
      moves: [{ objectId: 'gau', placeId: 'giuong' }],
    },
    {
      sentence: 'Đặt quyển sách lên kệ.', position: 'trên', scene: 'Góc học tập', sceneEmoji: '📚',
      objects: [
        { id: 'sach', label: 'quyển sách', emoji: '📖' },
        { id: 'but', label: 'cây bút', emoji: '✏️' },
        { id: 'thuoc', label: 'thước kẻ', emoji: '📏' },
      ],
      places: [
        { id: 'ke', label: 'kệ', emoji: '📚' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
      ],
      moves: [{ objectId: 'sach', placeId: 'ke' }],
    },
    {
      sentence: 'Đặt bông hoa lên bàn.', position: 'trên', scene: 'Căn phòng nhỏ', sceneEmoji: '🏠',
      objects: [
        { id: 'hoa', label: 'bông hoa', emoji: '🌸' },
        { id: 'tao', label: 'quả táo', emoji: '🍎' },
        { id: 'bong', label: 'quả bóng', emoji: '⚽' },
      ],
      places: [
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
        { id: 'tham', label: 'thảm', emoji: '🟫' },
      ],
      moves: [{ objectId: 'hoa', placeId: 'ban' }],
    },
    {
      sentence: 'Đặt quả táo lên bàn.', position: 'trên', scene: 'Góc bếp xinh', sceneEmoji: '🍳',
      objects: [
        { id: 'tao', label: 'quả táo', emoji: '🍎' },
        { id: 'cam', label: 'quả cam', emoji: '🍊' },
        { id: 'ly', label: 'cái ly', emoji: '🥛' },
      ],
      places: [
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'ro', label: 'rổ', emoji: '🧺' },
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
      ],
      moves: [{ objectId: 'tao', placeId: 'ban' }],
    },
    {
      sentence: 'Đặt cây bút lên bàn.', position: 'trên', scene: 'Góc học tập', sceneEmoji: '📚',
      objects: [
        { id: 'but', label: 'cây bút', emoji: '✏️' },
        { id: 'sach', label: 'quyển sách', emoji: '📖' },
        { id: 'gau', label: 'chú gấu', emoji: '🧸' },
      ],
      places: [
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'ke', label: 'kệ', emoji: '📚' },
        { id: 'giuong', label: 'giường', emoji: '🛏️' },
      ],
      moves: [{ objectId: 'but', placeId: 'ban' }],
    },
    {
      sentence: 'Đặt cái ly lên bàn.', position: 'trên', scene: 'Góc bếp xinh', sceneEmoji: '🍳',
      objects: [
        { id: 'ly', label: 'cái ly', emoji: '🥛' },
        { id: 'tao', label: 'quả táo', emoji: '🍎' },
        { id: 'bong', label: 'quả bóng', emoji: '⚽' },
      ],
      places: [
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
        { id: 'ro', label: 'rổ', emoji: '🧺' },
      ],
      moves: [{ objectId: 'ly', placeId: 'ban' }],
    },
    {
      sentence: 'Đặt thước kẻ lên kệ.', position: 'trên', scene: 'Góc học tập', sceneEmoji: '📚',
      objects: [
        { id: 'thuoc', label: 'thước kẻ', emoji: '📏' },
        { id: 'but', label: 'cây bút', emoji: '✏️' },
        { id: 'hoa', label: 'bông hoa', emoji: '🌸' },
      ],
      places: [
        { id: 'ke', label: 'kệ', emoji: '📚' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'tham', label: 'thảm', emoji: '🟫' },
      ],
      moves: [{ objectId: 'thuoc', placeId: 'ke' }],
    },
  ],
  // T2 — dưới / cạnh / trong
  [
    {
      sentence: 'Đặt quả bóng dưới gầm ghế.', position: 'dưới', scene: 'Căn phòng nhỏ', sceneEmoji: '🏠',
      objects: [
        { id: 'bong', label: 'quả bóng', emoji: '⚽' },
        { id: 'gau', label: 'chú gấu', emoji: '🧸' },
        { id: 'sach', label: 'quyển sách', emoji: '📖' },
      ],
      places: [
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'giuong', label: 'giường', emoji: '🛏️' },
      ],
      moves: [{ objectId: 'bong', placeId: 'ghe' }],
    },
    {
      sentence: 'Đặt chú gấu cạnh ghế.', position: 'cạnh', scene: 'Căn phòng nhỏ', sceneEmoji: '🏠',
      objects: [
        { id: 'gau', label: 'chú gấu', emoji: '🧸' },
        { id: 'bong', label: 'quả bóng', emoji: '⚽' },
        { id: 'hoa', label: 'bông hoa', emoji: '🌸' },
      ],
      places: [
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'ke', label: 'kệ', emoji: '📚' },
      ],
      moves: [{ objectId: 'gau', placeId: 'ghe' }],
    },
    {
      sentence: 'Cất quyển sách vào tủ.', position: 'trong', scene: 'Góc học tập', sceneEmoji: '📚',
      objects: [
        { id: 'sach', label: 'quyển sách', emoji: '📖' },
        { id: 'but', label: 'cây bút', emoji: '✏️' },
        { id: 'thuoc', label: 'thước kẻ', emoji: '📏' },
      ],
      places: [
        { id: 'tu', label: 'tủ', emoji: '🗄️' },
        { id: 'ke', label: 'kệ', emoji: '📚' },
        { id: 'hop', label: 'hộp', emoji: '📦' },
      ],
      moves: [{ objectId: 'sach', placeId: 'tu' }],
    },
    {
      sentence: 'Cất cây bút vào hộp.', position: 'trong', scene: 'Góc học tập', sceneEmoji: '📚',
      objects: [
        { id: 'but', label: 'cây bút', emoji: '✏️' },
        { id: 'sach', label: 'quyển sách', emoji: '📖' },
        { id: 'gau', label: 'chú gấu', emoji: '🧸' },
      ],
      places: [
        { id: 'hop', label: 'hộp', emoji: '📦' },
        { id: 'tu', label: 'tủ', emoji: '🗄️' },
        { id: 'ro', label: 'rổ', emoji: '🧺' },
      ],
      moves: [{ objectId: 'but', placeId: 'hop' }],
    },
    {
      sentence: 'Đặt cái gối cạnh giường.', position: 'cạnh', scene: 'Căn phòng nhỏ', sceneEmoji: '🏠',
      objects: [
        { id: 'goi', label: 'cái gối', emoji: '🛋️' },
        { id: 'gau', label: 'chú gấu', emoji: '🧸' },
        { id: 'bong', label: 'quả bóng', emoji: '⚽' },
      ],
      places: [
        { id: 'giuong', label: 'giường', emoji: '🛏️' },
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
        { id: 'tham', label: 'thảm', emoji: '🟫' },
      ],
      moves: [{ objectId: 'goi', placeId: 'giuong' }],
    },
    {
      sentence: 'Đặt quả cam trong rổ.', position: 'trong', scene: 'Góc bếp xinh', sceneEmoji: '🍳',
      objects: [
        { id: 'cam', label: 'quả cam', emoji: '🍊' },
        { id: 'tao', label: 'quả táo', emoji: '🍎' },
        { id: 'ly', label: 'cái ly', emoji: '🥛' },
      ],
      places: [
        { id: 'ro', label: 'rổ', emoji: '🧺' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'hop', label: 'hộp', emoji: '📦' },
      ],
      moves: [{ objectId: 'cam', placeId: 'ro' }],
    },
    {
      sentence: 'Đặt chú mèo dưới gầm bàn.', position: 'dưới', scene: 'Sân nhà mát', sceneEmoji: '🏡',
      objects: [
        { id: 'meo', label: 'chú mèo', emoji: '🐱' },
        { id: 'bong', label: 'quả bóng', emoji: '⚽' },
        { id: 'hoa', label: 'bông hoa', emoji: '🌸' },
      ],
      places: [
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
        { id: 'tham', label: 'thảm', emoji: '🟫' },
      ],
      moves: [{ objectId: 'meo', placeId: 'ban' }],
    },
    {
      sentence: 'Đặt chậu hoa cạnh cửa.', position: 'cạnh', scene: 'Sân nhà mát', sceneEmoji: '🏡',
      objects: [
        { id: 'chau', label: 'chậu hoa', emoji: '🌺' },
        { id: 'tao', label: 'quả táo', emoji: '🍎' },
        { id: 'bong', label: 'quả bóng', emoji: '⚽' },
      ],
      places: [
        { id: 'cua', label: 'cửa', emoji: '🚪' },
        { id: 'cay', label: 'gốc cây', emoji: '🌳' },
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
      ],
      moves: [{ objectId: 'chau', placeId: 'cua' }],
    },
  ],
  // T3 — màu sắc
  [
    {
      sentence: 'Đặt quả bóng đỏ lên ghế.', position: 'trên', scene: 'Căn phòng nhỏ', sceneEmoji: '🏠',
      objects: [
        { id: 'bong-do', label: 'quả bóng đỏ', emoji: '🔴' },
        { id: 'bong-xanh', label: 'quả bóng xanh', emoji: '🔵' },
        { id: 'gau', label: 'chú gấu', emoji: '🧸' },
      ],
      places: [
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'giuong', label: 'giường', emoji: '🛏️' },
      ],
      moves: [{ objectId: 'bong-do', placeId: 'ghe' }],
    },
    {
      sentence: 'Đặt bông hoa vàng vào lọ.', position: 'trong', scene: 'Căn phòng nhỏ', sceneEmoji: '🏠',
      objects: [
        { id: 'hoa-vang', label: 'bông hoa vàng', emoji: '🌼' },
        { id: 'hoa-do', label: 'bông hoa đỏ', emoji: '🌺' },
        { id: 'la', label: 'chiếc lá', emoji: '🍃' },
      ],
      places: [
        { id: 'lo', label: 'lọ', emoji: '🏺' },
        { id: 'ro', label: 'rổ', emoji: '🧺' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
      ],
      moves: [{ objectId: 'hoa-vang', placeId: 'lo' }],
    },
    {
      sentence: 'Đặt quyển sách xanh lên kệ.', position: 'trên', scene: 'Góc học tập', sceneEmoji: '📚',
      objects: [
        { id: 'sach-xanh', label: 'quyển sách xanh', emoji: '📘' },
        { id: 'sach-do', label: 'quyển sách đỏ', emoji: '📕' },
        { id: 'but', label: 'cây bút', emoji: '✏️' },
      ],
      places: [
        { id: 'ke', label: 'kệ', emoji: '📚' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'tu', label: 'tủ', emoji: '🗄️' },
      ],
      moves: [{ objectId: 'sach-xanh', placeId: 'ke' }],
    },
    {
      sentence: 'Đặt quả táo đỏ vào rổ.', position: 'trong', scene: 'Góc bếp xinh', sceneEmoji: '🍳',
      objects: [
        { id: 'tao-do', label: 'quả táo đỏ', emoji: '🍎' },
        { id: 'tao-xanh', label: 'quả táo xanh', emoji: '🍏' },
        { id: 'cam', label: 'quả cam', emoji: '🍊' },
      ],
      places: [
        { id: 'ro', label: 'rổ', emoji: '🧺' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'hop', label: 'hộp', emoji: '📦' },
      ],
      moves: [{ objectId: 'tao-do', placeId: 'ro' }],
    },
    {
      sentence: 'Đặt cái ly vàng cạnh bàn.', position: 'cạnh', scene: 'Góc bếp xinh', sceneEmoji: '🍳',
      objects: [
        { id: 'ly-vang', label: 'cái ly vàng', emoji: '🥛' },
        { id: 'ly-trang', label: 'cái ly trắng', emoji: '🥛' },
        { id: 'tao', label: 'quả táo', emoji: '🍎' },
      ],
      places: [
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
        { id: 'ke', label: 'kệ', emoji: '📚' },
      ],
      moves: [{ objectId: 'ly-vang', placeId: 'ban' }],
    },
    {
      sentence: 'Đặt chú cá vàng vào bể.', position: 'trong', scene: 'Góc thiên nhiên', sceneEmoji: '🌿',
      objects: [
        { id: 'ca-vang', label: 'chú cá vàng', emoji: '🐠' },
        { id: 'ca-xanh', label: 'chú cá xanh', emoji: '🐟' },
        { id: 'oc', label: 'con ốc', emoji: '🐚' },
      ],
      places: [
        { id: 'be', label: 'bể', emoji: '💧' },
        { id: 'song', label: 'dòng sông', emoji: '🏞️' },
        { id: 'hop', label: 'hộp', emoji: '📦' },
      ],
      moves: [{ objectId: 'ca-vang', placeId: 'be' }],
    },
    {
      sentence: 'Đặt chiếc lá xanh dưới gốc cây.', position: 'dưới', scene: 'Khu vườn xinh', sceneEmoji: '🌳',
      objects: [
        { id: 'la-xanh', label: 'chiếc lá xanh', emoji: '🍃' },
        { id: 'la-vang', label: 'chiếc lá vàng', emoji: '🍂' },
        { id: 'hoa', label: 'bông hoa', emoji: '🌸' },
      ],
      places: [
        { id: 'cay', label: 'gốc cây', emoji: '🌳' },
        { id: 'cua', label: 'cửa', emoji: '🚪' },
        { id: 'tham', label: 'thảm', emoji: '🟫' },
      ],
      moves: [{ objectId: 'la-xanh', placeId: 'cay' }],
    },
    {
      sentence: 'Đặt cái gối hồng lên giường.', position: 'trên', scene: 'Căn phòng nhỏ', sceneEmoji: '🏠',
      objects: [
        { id: 'goi-hong', label: 'cái gối hồng', emoji: '🛋️' },
        { id: 'goi-trang', label: 'cái gối trắng', emoji: '🛋️' },
        { id: 'gau', label: 'chú gấu', emoji: '🧸' },
      ],
      places: [
        { id: 'giuong', label: 'giường', emoji: '🛏️' },
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
        { id: 'tham', label: 'thảm', emoji: '🟫' },
      ],
      moves: [{ objectId: 'goi-hong', placeId: 'giuong' }],
    },
  ],
  // T4 — số lượng
  [
    {
      sentence: 'Đặt hai quả táo vào rổ.', position: 'trong', scene: 'Góc bếp xinh', sceneEmoji: '🍳',
      objects: [
        { id: 'tao-2', label: 'hai quả táo', emoji: '🍎' },
        { id: 'tao-1', label: 'một quả táo', emoji: '🍎' },
        { id: 'cam-2', label: 'hai quả cam', emoji: '🍊' },
      ],
      places: [
        { id: 'ro', label: 'rổ', emoji: '🧺' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'hop', label: 'hộp', emoji: '📦' },
      ],
      moves: [{ objectId: 'tao-2', placeId: 'ro' }],
    },
    {
      sentence: 'Đặt ba bông hoa vào lọ.', position: 'trong', scene: 'Căn phòng nhỏ', sceneEmoji: '🏠',
      objects: [
        { id: 'hoa-3', label: 'ba bông hoa', emoji: '🌸' },
        { id: 'hoa-1', label: 'một bông hoa', emoji: '🌸' },
        { id: 'la-3', label: 'ba chiếc lá', emoji: '🍃' },
      ],
      places: [
        { id: 'lo', label: 'lọ', emoji: '🏺' },
        { id: 'ro', label: 'rổ', emoji: '🧺' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
      ],
      moves: [{ objectId: 'hoa-3', placeId: 'lo' }],
    },
    {
      sentence: 'Đặt hai cây bút vào hộp.', position: 'trong', scene: 'Góc học tập', sceneEmoji: '📚',
      objects: [
        { id: 'but-2', label: 'hai cây bút', emoji: '✏️' },
        { id: 'but-1', label: 'một cây bút', emoji: '✏️' },
        { id: 'thuoc-2', label: 'hai thước kẻ', emoji: '📏' },
      ],
      places: [
        { id: 'hop', label: 'hộp', emoji: '📦' },
        { id: 'tu', label: 'tủ', emoji: '🗄️' },
        { id: 'ke', label: 'kệ', emoji: '📚' },
      ],
      moves: [{ objectId: 'but-2', placeId: 'hop' }],
    },
    {
      sentence: 'Đặt một chú cá vào bể.', position: 'trong', scene: 'Góc thiên nhiên', sceneEmoji: '🌿',
      objects: [
        { id: 'ca-1', label: 'một chú cá', emoji: '🐠' },
        { id: 'ca-2', label: 'hai chú cá', emoji: '🐠' },
        { id: 'oc-1', label: 'một con ốc', emoji: '🐚' },
      ],
      places: [
        { id: 'be', label: 'bể', emoji: '💧' },
        { id: 'song', label: 'dòng sông', emoji: '🏞️' },
        { id: 'hop', label: 'hộp', emoji: '📦' },
      ],
      moves: [{ objectId: 'ca-1', placeId: 'be' }],
    },
    {
      sentence: 'Đặt ba quả cam lên bàn.', position: 'trên', scene: 'Góc bếp xinh', sceneEmoji: '🍳',
      objects: [
        { id: 'cam-3', label: 'ba quả cam', emoji: '🍊' },
        { id: 'cam-1', label: 'một quả cam', emoji: '🍊' },
        { id: 'tao-3', label: 'ba quả táo', emoji: '🍎' },
      ],
      places: [
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'ro', label: 'rổ', emoji: '🧺' },
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
      ],
      moves: [{ objectId: 'cam-3', placeId: 'ban' }],
    },
    {
      sentence: 'Đặt hai quyển sách lên kệ.', position: 'trên', scene: 'Góc học tập', sceneEmoji: '📚',
      objects: [
        { id: 'sach-2', label: 'hai quyển sách', emoji: '📖' },
        { id: 'sach-1', label: 'một quyển sách', emoji: '📖' },
        { id: 'but-2', label: 'hai cây bút', emoji: '✏️' },
      ],
      places: [
        { id: 'ke', label: 'kệ', emoji: '📚' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'tu', label: 'tủ', emoji: '🗄️' },
      ],
      moves: [{ objectId: 'sach-2', placeId: 'ke' }],
    },
    {
      sentence: 'Đặt một chậu hoa cạnh cửa.', position: 'cạnh', scene: 'Sân nhà mát', sceneEmoji: '🏡',
      objects: [
        { id: 'chau-1', label: 'một chậu hoa', emoji: '🌺' },
        { id: 'chau-2', label: 'hai chậu hoa', emoji: '🌺' },
        { id: 'la-1', label: 'một chiếc lá', emoji: '🍃' },
      ],
      places: [
        { id: 'cua', label: 'cửa', emoji: '🚪' },
        { id: 'cay', label: 'gốc cây', emoji: '🌳' },
        { id: 'tham', label: 'thảm', emoji: '🟫' },
      ],
      moves: [{ objectId: 'chau-1', placeId: 'cua' }],
    },
    {
      sentence: 'Đặt hai cái ly lên bàn.', position: 'trên', scene: 'Góc bếp xinh', sceneEmoji: '🍳',
      objects: [
        { id: 'ly-2', label: 'hai cái ly', emoji: '🥛' },
        { id: 'ly-1', label: 'một cái ly', emoji: '🥛' },
        { id: 'tao-2', label: 'hai quả táo', emoji: '🍎' },
      ],
      places: [
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
        { id: 'ro', label: 'rổ', emoji: '🧺' },
      ],
      moves: [{ objectId: 'ly-2', placeId: 'ban' }],
    },
  ],
  // T5 — câu 2 vế
  [
    {
      sentence: 'Đặt con mèo cạnh ghế và quả bóng lên bàn.', position: 'cạnh', scene: 'Căn phòng nhỏ', sceneEmoji: '🏠',
      objects: [
        { id: 'meo', label: 'con mèo', emoji: '🐱' },
        { id: 'bong', label: 'quả bóng', emoji: '⚽' },
        { id: 'gau', label: 'chú gấu', emoji: '🧸' },
      ],
      places: [
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'giuong', label: 'giường', emoji: '🛏️' },
      ],
      moves: [
        { objectId: 'meo', placeId: 'ghe' },
        { objectId: 'bong', placeId: 'ban' },
      ],
    },
    {
      sentence: 'Cất quyển sách vào tủ và cây bút vào hộp.', position: 'trong', scene: 'Góc học tập', sceneEmoji: '📚',
      objects: [
        { id: 'sach', label: 'quyển sách', emoji: '📖' },
        { id: 'but', label: 'cây bút', emoji: '✏️' },
        { id: 'thuoc', label: 'thước kẻ', emoji: '📏' },
      ],
      places: [
        { id: 'tu', label: 'tủ', emoji: '🗄️' },
        { id: 'hop', label: 'hộp', emoji: '📦' },
        { id: 'ke', label: 'kệ', emoji: '📚' },
      ],
      moves: [
        { objectId: 'sach', placeId: 'tu' },
        { objectId: 'but', placeId: 'hop' },
      ],
    },
    {
      sentence: 'Đặt bông hoa lên bàn và quả táo vào rổ.', position: 'trên', scene: 'Góc bếp xinh', sceneEmoji: '🍳',
      objects: [
        { id: 'hoa', label: 'bông hoa', emoji: '🌸' },
        { id: 'tao', label: 'quả táo', emoji: '🍎' },
        { id: 'cam', label: 'quả cam', emoji: '🍊' },
      ],
      places: [
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'ro', label: 'rổ', emoji: '🧺' },
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
      ],
      moves: [
        { objectId: 'hoa', placeId: 'ban' },
        { objectId: 'tao', placeId: 'ro' },
      ],
    },
    {
      sentence: 'Đặt chậu hoa cạnh cửa và chiếc lá dưới gốc cây.', position: 'cạnh', scene: 'Sân nhà mát', sceneEmoji: '🏡',
      objects: [
        { id: 'chau', label: 'chậu hoa', emoji: '🌺' },
        { id: 'la', label: 'chiếc lá', emoji: '🍃' },
        { id: 'bong', label: 'quả bóng', emoji: '⚽' },
      ],
      places: [
        { id: 'cua', label: 'cửa', emoji: '🚪' },
        { id: 'cay', label: 'gốc cây', emoji: '🌳' },
        { id: 'tham', label: 'thảm', emoji: '🟫' },
      ],
      moves: [
        { objectId: 'chau', placeId: 'cua' },
        { objectId: 'la', placeId: 'cay' },
      ],
    },
    {
      sentence: 'Đặt cái gối lên giường và chú gấu cạnh ghế.', position: 'trên', scene: 'Căn phòng nhỏ', sceneEmoji: '🏠',
      objects: [
        { id: 'goi', label: 'cái gối', emoji: '🛋️' },
        { id: 'gau', label: 'chú gấu', emoji: '🧸' },
        { id: 'bong', label: 'quả bóng', emoji: '⚽' },
      ],
      places: [
        { id: 'giuong', label: 'giường', emoji: '🛏️' },
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
      ],
      moves: [
        { objectId: 'goi', placeId: 'giuong' },
        { objectId: 'gau', placeId: 'ghe' },
      ],
    },
    {
      sentence: 'Đặt quả cam trong rổ và cái ly lên bàn.', position: 'trong', scene: 'Góc bếp xinh', sceneEmoji: '🍳',
      objects: [
        { id: 'cam', label: 'quả cam', emoji: '🍊' },
        { id: 'ly', label: 'cái ly', emoji: '🥛' },
        { id: 'tao', label: 'quả táo', emoji: '🍎' },
      ],
      places: [
        { id: 'ro', label: 'rổ', emoji: '🧺' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'hop', label: 'hộp', emoji: '📦' },
      ],
      moves: [
        { objectId: 'cam', placeId: 'ro' },
        { objectId: 'ly', placeId: 'ban' },
      ],
    },
    {
      sentence: 'Đặt chú cá vào bể và con ốc cạnh bể.', position: 'trong', scene: 'Góc thiên nhiên', sceneEmoji: '🌿',
      objects: [
        { id: 'ca', label: 'chú cá', emoji: '🐠' },
        { id: 'oc', label: 'con ốc', emoji: '🐚' },
        { id: 'la', label: 'chiếc lá', emoji: '🍃' },
      ],
      places: [
        { id: 'be', label: 'bể', emoji: '💧' },
        { id: 'song', label: 'dòng sông', emoji: '🏞️' },
        { id: 'hop', label: 'hộp', emoji: '📦' },
      ],
      moves: [
        { objectId: 'ca', placeId: 'be' },
        { objectId: 'oc', placeId: 'be' },
      ],
    },
    {
      sentence: 'Đặt thước kẻ lên kệ và cây bút vào hộp.', position: 'trên', scene: 'Góc học tập', sceneEmoji: '📚',
      objects: [
        { id: 'thuoc', label: 'thước kẻ', emoji: '📏' },
        { id: 'but', label: 'cây bút', emoji: '✏️' },
        { id: 'sach', label: 'quyển sách', emoji: '📖' },
      ],
      places: [
        { id: 'ke', label: 'kệ', emoji: '📚' },
        { id: 'hop', label: 'hộp', emoji: '📦' },
        { id: 'tu', label: 'tủ', emoji: '🗄️' },
      ],
      moves: [
        { objectId: 'thuoc', placeId: 'ke' },
        { objectId: 'but', placeId: 'hop' },
      ],
    },
  ],
  // T6 — 2 vế + màu sắc / số lượng
  [
    {
      sentence: 'Đặt hai quả táo đỏ vào rổ và cái ly lên bàn.', position: 'trong', scene: 'Góc bếp xinh', sceneEmoji: '🍳',
      objects: [
        { id: 'tao-do-2', label: 'hai quả táo đỏ', emoji: '🍎' },
        { id: 'tao-xanh-2', label: 'hai quả táo xanh', emoji: '🍏' },
        { id: 'ly', label: 'cái ly', emoji: '🥛' },
      ],
      places: [
        { id: 'ro', label: 'rổ', emoji: '🧺' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'hop', label: 'hộp', emoji: '📦' },
      ],
      moves: [
        { objectId: 'tao-do-2', placeId: 'ro' },
        { objectId: 'ly', placeId: 'ban' },
      ],
    },
    {
      sentence: 'Đặt quả bóng đỏ lên ghế và quả bóng xanh dưới bàn.', position: 'trên', scene: 'Căn phòng nhỏ', sceneEmoji: '🏠',
      objects: [
        { id: 'bong-do', label: 'quả bóng đỏ', emoji: '🔴' },
        { id: 'bong-xanh', label: 'quả bóng xanh', emoji: '🔵' },
        { id: 'gau', label: 'chú gấu', emoji: '🧸' },
      ],
      places: [
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'giuong', label: 'giường', emoji: '🛏️' },
      ],
      moves: [
        { objectId: 'bong-do', placeId: 'ghe' },
        { objectId: 'bong-xanh', placeId: 'ban' },
      ],
    },
    {
      sentence: 'Đặt ba bông hoa vàng vào lọ và một chiếc lá dưới gốc cây.', position: 'trong', scene: 'Khu vườn xinh', sceneEmoji: '🌳',
      objects: [
        { id: 'hoa-vang-3', label: 'ba bông hoa vàng', emoji: '🌼' },
        { id: 'hoa-do-3', label: 'ba bông hoa đỏ', emoji: '🌺' },
        { id: 'la-1', label: 'một chiếc lá', emoji: '🍃' },
      ],
      places: [
        { id: 'lo', label: 'lọ', emoji: '🏺' },
        { id: 'cay', label: 'gốc cây', emoji: '🌳' },
        { id: 'ro', label: 'rổ', emoji: '🧺' },
      ],
      moves: [
        { objectId: 'hoa-vang-3', placeId: 'lo' },
        { objectId: 'la-1', placeId: 'cay' },
      ],
    },
    {
      sentence: 'Cất hai quyển sách xanh vào tủ và một cây bút vào hộp.', position: 'trong', scene: 'Góc học tập', sceneEmoji: '📚',
      objects: [
        { id: 'sach-xanh-2', label: 'hai quyển sách xanh', emoji: '📘' },
        { id: 'sach-do-2', label: 'hai quyển sách đỏ', emoji: '📕' },
        { id: 'but-1', label: 'một cây bút', emoji: '✏️' },
      ],
      places: [
        { id: 'tu', label: 'tủ', emoji: '🗄️' },
        { id: 'hop', label: 'hộp', emoji: '📦' },
        { id: 'ke', label: 'kệ', emoji: '📚' },
      ],
      moves: [
        { objectId: 'sach-xanh-2', placeId: 'tu' },
        { objectId: 'but-1', placeId: 'hop' },
      ],
    },
    {
      sentence: 'Đặt một chú cá vàng vào bể và hai con ốc cạnh bể.', position: 'trong', scene: 'Góc thiên nhiên', sceneEmoji: '🌿',
      objects: [
        { id: 'ca-vang-1', label: 'một chú cá vàng', emoji: '🐠' },
        { id: 'ca-xanh-1', label: 'một chú cá xanh', emoji: '🐟' },
        { id: 'oc-2', label: 'hai con ốc', emoji: '🐚' },
      ],
      places: [
        { id: 'be', label: 'bể', emoji: '💧' },
        { id: 'song', label: 'dòng sông', emoji: '🏞️' },
        { id: 'hop', label: 'hộp', emoji: '📦' },
      ],
      moves: [
        { objectId: 'ca-vang-1', placeId: 'be' },
        { objectId: 'oc-2', placeId: 'be' },
      ],
    },
    {
      sentence: 'Đặt con mèo đen cạnh ghế và hai quả cam lên bàn.', position: 'cạnh', scene: 'Căn phòng nhỏ', sceneEmoji: '🏠',
      objects: [
        { id: 'meo-den', label: 'con mèo đen', emoji: '🐈‍⬛' },
        { id: 'meo-trang', label: 'con mèo trắng', emoji: '🐱' },
        { id: 'cam-2', label: 'hai quả cam', emoji: '🍊' },
      ],
      places: [
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'giuong', label: 'giường', emoji: '🛏️' },
      ],
      moves: [
        { objectId: 'meo-den', placeId: 'ghe' },
        { objectId: 'cam-2', placeId: 'ban' },
      ],
    },
    {
      sentence: 'Đặt ba cái ly nhỏ lên bàn và một cái ly to cạnh bàn.', position: 'trên', scene: 'Góc bếp xinh', sceneEmoji: '🍳',
      objects: [
        { id: 'ly-nho-3', label: 'ba cái ly nhỏ', emoji: '🥛' },
        { id: 'ly-nho-1', label: 'một cái ly nhỏ', emoji: '🥛' },
        { id: 'ly-to-1', label: 'một cái ly to', emoji: '🥛' },
      ],
      places: [
        { id: 'ban', label: 'bàn', emoji: '🍽️' },
        { id: 'ghe', label: 'ghế', emoji: '🪑' },
        { id: 'ke', label: 'kệ', emoji: '📚' },
      ],
      moves: [
        { objectId: 'ly-nho-3', placeId: 'ban' },
        { objectId: 'ly-to-1', placeId: 'ban' },
      ],
    },
    {
      sentence: 'Đặt một chậu hoa đỏ cạnh cửa và hai chậu hoa vàng dưới gốc cây.', position: 'cạnh', scene: 'Sân nhà mát', sceneEmoji: '🏡',
      objects: [
        { id: 'chau-do-1', label: 'một chậu hoa đỏ', emoji: '🌺' },
        { id: 'chau-vang-2', label: 'hai chậu hoa vàng', emoji: '🌺' },
        { id: 'la-1', label: 'một chiếc lá', emoji: '🍃' },
      ],
      places: [
        { id: 'cua', label: 'cửa', emoji: '🚪' },
        { id: 'cay', label: 'gốc cây', emoji: '🌳' },
        { id: 'tham', label: 'thảm', emoji: '🟫' },
      ],
      moves: [
        { objectId: 'chau-do-1', placeId: 'cua' },
        { objectId: 'chau-vang-2', placeId: 'cay' },
      ],
    },
  ],
];

/**
 * Dựng các vòng chơi cho 1 cấp: đủ vòng, câu không trùng,
 * mọi nước đi trỏ tới vật/chỗ có thật, NFC.
 */
export function buildReadRounds(tier: number, seedOrNonce = 0): ReadDoRound[] {
  const safeTier = Math.min(Math.max(Math.round(tier), 1), 6);
  const pool = POOL_BY_TIER[safeTier - 1];
  const count = roundsForTier(safeTier);
  const rng = seededRng(2300 + safeTier * 307 + seedOrNonce * 1009);
  const picks = pickDistinct(pool, count, rng);
  return picks.map((s, i) => {
    const r = seededRng(2300 + safeTier * 307 + seedOrNonce * 1009 + i * 61 + 17);
    return {
      id: `rd-t${safeTier}-${i}-${s.sentence.length}`,
      scene: s.scene,
      sceneEmoji: s.sceneEmoji,
      sentence: s.sentence.normalize('NFC'),
      position: s.position,
      objects: shuffleSeeded(
        s.objects.map((o) => ({ ...o, label: o.label.normalize('NFC') })),
        r,
      ),
      places: shuffleSeeded(
        s.places.map((p) => ({ ...p, label: p.label.normalize('NFC') })),
        seededRng(2300 + safeTier * 307 + seedOrNonce * 1009 + i * 61 + 18),
      ),
      moves: s.moves.map((m) => ({ ...m })),
    };
  });
}

export function buildRounds(tier: number, seed = 0): ReadDoRound[] {
  return buildReadRounds(tier, seed);
}
