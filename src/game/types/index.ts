export type Suit = 'Spade' | 'Heart' | 'Diamond' | 'Club'

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

export type Street = 'PRE_FLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN'

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

export interface Card {
  suit: Suit
  rank: Rank
}

export interface PlayerState {
  seat: number
  id: string
  name: string
  stack: number
  holeCards: Card[]
  inHand: boolean
  hasFolded: boolean
  isAllIn: boolean
  streetCommit: number
  handCommit: number
  actedThisStreet: boolean
  lastActionToAmountThisStreet: number | null
}

export interface Pot {
  id: string
  amount: number
  eligibleSeats: number[]
  level: number
}

export interface HandState {
  handId: number
  phase: Phase
  street: Street
  dealerSeat: number
  sbSeat: number
  bbSeat: number
  toActSeat: number
  smallBlind: number
  bigBlind: number
  ante: number
  board: Card[]
  burn: Card[]
  deck: Card[]
  currentBet: number
  lastFullRaiseSize: number
  players: PlayerState[]
  pots: Pot[]
  uncalledReturn: number
  winnerSeatIds: number[]
  seed?: number
}

export type Action =
  | { type: 'START_HAND'; seed?: number }
  | { type: 'POST_FORCED_BETS' }
  | { type: 'DEAL_HOLE_CARDS' }
  | { type: 'CHECK'; seat: number }
  | { type: 'FOLD'; seat: number }
  | { type: 'CALL'; seat: number }
  | { type: 'BET'; seat: number; amountTo: number }
  | { type: 'RAISE'; seat: number; amountTo: number }
  | { type: 'ALL_IN'; seat: number }
  | { type: 'ADVANCE_STREET' }
  | { type: 'SHOWDOWN' }
  | { type: 'PAYOUT' }

export interface LegalAction {
  type: 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN'
  minAmountTo?: number
  maxAmountTo?: number
  toCall?: number
}

export interface EngineResult {
  state: HandState
  events: GameEvent[]
  error?: EngineError
}

export type GameEvent =
  | { type: 'HAND_STARTED'; handId: number }
  | { type: 'CARDS_DEALT'; seat: number; count: number }
  | { type: 'BOARD_DEALT'; street: Street; cards: Card[] }
  | { type: 'TURN_TIMEOUT'; seat: number; fallback: 'CHECK' | 'FOLD' }
  | { type: 'ACTION_APPLIED'; seat: number; action: Action['type']; amount: number }
  | { type: 'STREET_ENDED'; street: Street }
  | { type: 'SHOWDOWN_REVEAL'; seat: number; cards: Card[] }
  | { type: 'POT_AWARDED'; potId: string; winners: number[]; amount: number }
  | { type: 'HAND_FINISHED'; handId: number }

export type EngineErrorCode =
  | 'INVALID_PHASE'
  | 'NOT_ACTOR_TURN'
  | 'ILLEGAL_ACTION'
  | 'INVALID_AMOUNT'
  | 'PLAYER_NOT_FOUND'
  | 'INVARIANT_VIOLATION'

export interface EngineError {
  code: EngineErrorCode
  action: Action['type']
  message: string
  seat?: number
}
