import type { SupportedPlayerCount, TableStatus } from './common'
import type { TableSnapshot } from './table'

/** 大厅中的单个座位预览，只展示占用情况和玩家摘要。 */
export interface LobbySeatPreview {
  seatNo: number
  isOccupied: boolean
  userId?: string
  nickname?: string
  avatarUrl?: string
}

/** 大厅牌桌摘要，直接对应大厅列表中的一张桌子。 */
export interface LobbyTableSummary {
  tableId: string
  name: string
  maxPlayers: SupportedPlayerCount
  playerCount: number
  smallBlind: number
  bigBlind: number
  status: TableStatus
  seats: LobbySeatPreview[]
}

/**
 * 大厅点击空位后的入桌请求。
 * 这里的 seatNo 一旦服务端确认成功，进入牌桌后仍然沿用，不重新分座。
 */
export interface JoinTableRequest {
  tableId: string
  seatNo: number
  buyIn?: number
}

/** 入桌成功后的返回值，seatNo 为服务端确认后的真实逻辑座位号。 */
export interface JoinTableResponse {
  tableId: string
  seatNo: number
  wsUrl: string
  snapshot?: TableSnapshot
}
