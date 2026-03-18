import type {
  Phase,
  Rank,
  Role,
  SeatStatus,
  Street,
  Suit,
  SupportedPlayerCount,
  TableStatus,
} from './common'
import type { LegalAction } from './action'

/** 纯牌面数据，不包含任何客户端资源路径。 */
export interface Card {
  suit: Suit
  rank: Rank
  code?: string
}

/** 牌桌基础配置，主要给大厅和进入桌面前的规则展示使用。 */
export interface TableInfo {
  tableId: string
  name: string
  maxPlayers: SupportedPlayerCount
  smallBlind: number
  bigBlind: number
  ante?: number
  buyInMin?: number
  buyInMax?: number
  turnTimeoutSec: number
  status: TableStatus
}

/**
 * 单个座位的公共状态。
 * 注意这里的 seatNo 是逻辑座位号，不是“屏幕上显示到第几个位置”。
 */
export interface SeatState {
  seatNo: number
  userId?: string
  nickname?: string
  avatarUrl?: string
  stack: number
  currentBet: number
  totalBet: number
  isSeated: boolean
  isInHand: boolean
  hasFolded: boolean
  isAllIn: boolean
  isReady?: boolean
  role: Role | null
  status: SeatStatus
  exposedCards?: Card[]
}

/** 主池或边池的简化结构，前端显示金额时直接使用。 */
export interface PotInfo {
  potId: string
  amount: number
}

/** 只发给当前玩家本人的私有状态。 */
export interface SelfState {
  seatNo: number
  holeCards: Card[]
  legalActions: LegalAction[]
}

/**
 * 牌桌快照是 Cocos 牌桌最核心的输入对象。
 * Scene / Store / Presenter 都应围绕它做同步，而不是直接依赖后端裸 JSON。
 */
export interface TableSnapshot {
  tableId: string
  handId: number
  phase: Phase
  street: Street
  dealerSeat: number
  sbSeat: number
  bbSeat: number
  toActSeat: number
  potTotal: number
  board: Card[]
  pots: PotInfo[]
  seats: SeatState[]
  actionDeadlineAt?: number
  version: number
  self?: SelfState
}
