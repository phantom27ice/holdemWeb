import type { SupportedPlayerCount } from '../model'

/** 当前项目允许的最少人数。 */
export const MIN_PLAYER_COUNT: SupportedPlayerCount = 2
/** 当前项目允许的最多人数。 */
export const MAX_PLAYER_COUNT: SupportedPlayerCount = 10

/** 用于校验和下拉选项的支持人数列表。 */
export const SUPPORTED_PLAYER_COUNTS: SupportedPlayerCount[] = [
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
]

/** 下面这些是默认桌子配置，主要用于本地调试和建桌初始值。 */
export const DEFAULT_SMALL_BLIND = 50
export const DEFAULT_BIG_BLIND = 100
export const DEFAULT_ANTE = 0
export const DEFAULT_TURN_TIMEOUT_SEC = 12
export const DEFAULT_BUY_IN_MIN = 2000
export const DEFAULT_BUY_IN_MAX = 20000
export const DEFAULT_TABLE_NAME = '德州扑克练习桌'

/** 判断一个 number 是否属于支持的玩家人数。 */
export function isSupportedPlayerCount(value: number): value is SupportedPlayerCount {
  return SUPPORTED_PLAYER_COUNTS.includes(value as SupportedPlayerCount)
}
