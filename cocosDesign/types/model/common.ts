/**
 * 当前项目支持的牌桌人数。
 * 这里显式限制为 2-10，避免后续把座位数写成任意 number。
 */
export type SupportedPlayerCount = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

/** 用户在线状态，主要用于大厅和座位状态显示。 */
export type UserStatus = 'ONLINE' | 'OFFLINE' | 'IN_GAME'

/** 牌桌状态，给大厅列表和桌面入口使用。 */
export type TableStatus = 'WAITING' | 'PLAYING' | 'CLOSED'

/** 牌面花色，与当前 Web 引擎保持一致。 */
export type Suit = 'Spade' | 'Heart' | 'Diamond' | 'Club'

/** A 在当前项目里用 14 表示，便于和现有 handEvaluator 对齐。 */
export type Rank =
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14

/** 手牌所在街道。 */
export type Street = 'PRE_FLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN'

/** 对局阶段，基本沿用当前 Vue 项目的引擎阶段定义。 */
export type Phase =
  | 'WAITING_FOR_PLAYERS'
  | 'POST_FORCED_BETS'
  | 'DEAL_HOLE_CARDS'
  | 'BETTING_PRE_FLOP'
  | 'DEAL_FLOP'
  | 'BETTING_FLOP'
  | 'DEAL_TURN'
  | 'BETTING_TURN'
  | 'DEAL_RIVER'
  | 'BETTING_RIVER'
  | 'SHOWDOWN'
  | 'PAYOUT'
  | 'HAND_FINISHED'

/** 庄位标记。2 人桌时 BTN 同时也是 SB，这是规则层要处理的事。 */
export type Role = 'BTN' | 'SB' | 'BB'

/** 座位状态，给大厅和牌桌的展示层使用。 */
export type SeatStatus = 'IDLE' | 'WAITING' | 'ACTING' | 'OFFLINE'

/** 客户端可提交的动作类型。 */
export type ActionType = 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN'

/** 超时后的服务端兜底动作。 */
export type TimeoutFallback = 'CHECK' | 'FOLD'

/** 事件类型，供动画层和状态同步层消费。 */
export type TableEventType =
  | 'HAND_STARTED'
  | 'CARDS_DEALT'
  | 'BOARD_DEALT'
  | 'ACTION_APPLIED'
  | 'TURN_TIMEOUT'
  | 'SHOWDOWN_REVEAL'
  | 'POT_AWARDED'
  | 'HAND_FINISHED'
