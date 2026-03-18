import type { Card, Role, SeatStatus } from '../model'

/** 座位徽标类型，区分行为提示、回合提示和状态提示。 */
export type SeatBadgeKind = 'action' | 'turn' | 'status'

/** 给单张卡牌 UI 用的展示数据。 */
export interface CardViewData {
  card?: Card
  isFaceUp: boolean
  isPlaceholder?: boolean
}

/** 座位头顶的小气泡或徽标。 */
export interface SeatBadgeState {
  text: string
  kind: SeatBadgeKind
}

/**
 * SeatPrefab 直接消费的数据。
 * displaySeatIndex 是屏幕展示顺序，和协议里的 seatNo 不一定相同。
 */
export interface SeatViewData {
  seatNo: number
  displaySeatIndex: number
  nickname: string
  avatarUrl?: string
  stackText: string
  currentBetText?: string
  role: Role | null
  status: SeatStatus
  isOccupied: boolean
  isHero: boolean
  isActive: boolean
  isFolded: boolean
  isAllIn: boolean
  badge?: SeatBadgeState
  countdownSeconds?: number | null
  cards: CardViewData[]
}
