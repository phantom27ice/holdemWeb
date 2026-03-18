import type { TableStatus } from '../model'

/** 大厅里单个座位按钮的展示数据。 */
export interface LobbySeatViewData {
  seatNo: number
  isOccupied: boolean
  isSelectable: boolean
  nickname?: string
  avatarUrl?: string
}

/** 大厅中一张桌子卡片的展示数据。 */
export interface LobbyTableViewData {
  tableId: string
  name: string
  status: TableStatus
  blindText: string
  occupancyText: string
  seats: LobbySeatViewData[]
}
