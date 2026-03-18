import type { Card, Phase, Street } from '../model'
import type { SeatViewData } from './seat-view'

/** 公牌区单张卡牌的展示数据。 */
export interface BoardCardViewData {
  card?: Card
  isFaceUp: boolean
  isPlaceholder: boolean
}

/** 底池展示数据，给主池/边池 UI 使用。 */
export interface PotViewData {
  potId: string
  amountText: string
  isMain: boolean
}

/** TableScene 或 TablePresenter 直接消费的整桌展示数据。 */
export interface TableViewData {
  tableId: string
  phase: Phase
  street: Street
  version: number
  totalPotText: string
  board: BoardCardViewData[]
  pots: PotViewData[]
  seats: SeatViewData[]
  heroSeatNo?: number
  actionDeadlineAt?: number
}
