import type { SupportedPlayerCount } from '../model'

/** 单个座位锚点，使用相对桌面的归一化坐标。 */
export interface SeatAnchor {
  x: number
  y: number
}

/** 一种人数下的整桌座位布局配置。 */
export interface SeatLayoutConfig {
  seatCount: SupportedPlayerCount
  anchors: SeatAnchor[]
}

/**
 * 生成椭圆形座位布局。
 * 这是默认布局算法，后续如果美术需要，也可以对具体人数做手工覆盖。
 */
function createOvalLayout(
  seatCount: SupportedPlayerCount,
  radiusX = 0.88,
  radiusY = 0.72,
  startAngleDeg = -90,
): SeatLayoutConfig {
  const anchors: SeatAnchor[] = []

  for (let index = 0; index < seatCount; index += 1) {
    const angleDeg = startAngleDeg + (360 / seatCount) * index
    const angle = (angleDeg * Math.PI) / 180
    anchors.push({
      x: Number((Math.cos(angle) * radiusX).toFixed(3)),
      y: Number((Math.sin(angle) * radiusY).toFixed(3)),
    })
  }

  return {
    seatCount,
    anchors,
  }
}

/** 按人数提供默认牌桌座位布局。 */
export const TABLE_LAYOUT_BY_PLAYER_COUNT: Record<SupportedPlayerCount, SeatLayoutConfig> = {
  2: {
    seatCount: 2,
    anchors: [
      { x: 0, y: 0.72 },
      { x: 0, y: -0.72 },
    ],
  },
  3: createOvalLayout(3),
  4: createOvalLayout(4),
  5: createOvalLayout(5),
  6: createOvalLayout(6),
  7: createOvalLayout(7),
  8: createOvalLayout(8),
  9: createOvalLayout(9),
  10: createOvalLayout(10),
}

/** 根据人数和逻辑 seatNo 查找对应锚点。 */
export function getSeatAnchor(
  playerCount: SupportedPlayerCount,
  seatNo: number,
): SeatAnchor | null {
  const layout = TABLE_LAYOUT_BY_PLAYER_COUNT[playerCount]
  return layout.anchors[seatNo] ?? null
}
