import type { ActionType, Street, TableEventType, TimeoutFallback } from './common'
import type { Card } from './table'

/** 所有桌面事件的公共头部。 */
interface BaseTableEvent {
  type: TableEventType
  tableId: string
  handId: number
  version: number
  ts: number
}

/** 新一手开始。 */
export interface HandStartedEvent extends BaseTableEvent {
  type: 'HAND_STARTED'
}

/** 发底牌事件。 */
export interface CardsDealtEvent extends BaseTableEvent {
  type: 'CARDS_DEALT'
  seatNo: number
  count: number
}

/** 发公共牌事件。 */
export interface BoardDealtEvent extends BaseTableEvent {
  type: 'BOARD_DEALT'
  street: Street
  cards: Card[]
}

/** 玩家动作已被服务端确认并执行。 */
export interface ActionAppliedEvent extends BaseTableEvent {
  type: 'ACTION_APPLIED'
  seatNo: number
  action: ActionType
  amount: number
  amountTo?: number
}

/** 超时后服务端执行兜底动作。 */
export interface TurnTimeoutEvent extends BaseTableEvent {
  type: 'TURN_TIMEOUT'
  seatNo: number
  fallback: TimeoutFallback
}

/** 摊牌亮牌事件。 */
export interface ShowdownRevealEvent extends BaseTableEvent {
  type: 'SHOWDOWN_REVEAL'
  seatNo: number
  cards: Card[]
}

/** 某个池子完成派奖。 */
export interface PotAwardedEvent extends BaseTableEvent {
  type: 'POT_AWARDED'
  potId: string
  winners: number[]
  amount: number
}

/** 一手结束。 */
export interface HandFinishedEvent extends BaseTableEvent {
  type: 'HAND_FINISHED'
}

/** 牌桌事件联合类型，给动画层和状态机统一消费。 */
export type TableEvent =
  | HandStartedEvent
  | CardsDealtEvent
  | BoardDealtEvent
  | ActionAppliedEvent
  | TurnTimeoutEvent
  | ShowdownRevealEvent
  | PotAwardedEvent
  | HandFinishedEvent
