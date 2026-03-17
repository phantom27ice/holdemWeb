import type { HandState, LegalAction } from '../types'
import type { EngineConfig, TablePlayerInput } from '../engine'
import { getLegalActions } from '../engine'
import {
  resolveAvatar,
  resolvePokerBack,
  resolvePokerCard,
} from '../assets/resourceResolver'

export interface TableSeatViewModel {
  seat: number
  name: string
  stack: number
  bet: number
  avatar: string
  role: 'BTN' | 'SB' | 'BB' | null
  isHero: boolean
  isActive: boolean
  isFolded: boolean
  isAllIn: boolean
  cards: string[]
  cardsFaceUp: boolean
}

export interface TableViewModel {
  phase: HandState['phase']
  pot: number
  board: Array<string | null>
  seats: TableSeatViewModel[]
  heroSeat: number
  legalActions: {
    canFold: boolean
    canCheck: boolean
    canCall: boolean
    callAmount: number
    canRaise: boolean
    minRaiseTo: number
  }
}

export const HERO_SEAT = 0

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  smallBlind: 50,
  bigBlind: 100,
  ante: 0,
}

export const DEMO_PLAYERS: TablePlayerInput[] = [
  { seat: 0, id: 'p-0', name: 'You', stack: 2000 },
  { seat: 1, id: 'p-1', name: 'AI 1', stack: 2000 },
  { seat: 2, id: 'p-2', name: 'AI 2', stack: 2000 },
  { seat: 3, id: 'p-3', name: 'AI 3', stack: 2000 },
  { seat: 4, id: 'p-4', name: 'AI 4', stack: 2000 },
  { seat: 5, id: 'p-5', name: 'AI 5', stack: 2000 },
]

const AVATARS = [1, 2, 3, 4, 5, 6].map((index) => resolveAvatar(index))

export function toTableViewModel(state: HandState): TableViewModel {
  const legal = getLegalActions(state, HERO_SEAT)
  const callAction = findAction(legal, 'CALL')
  const checkAction = findAction(legal, 'CHECK')
  const raiseAction = findAction(legal, 'RAISE') ?? findAction(legal, 'BET')

  return {
    phase: state.phase,
    pot: state.players.reduce((sum, player) => sum + player.handCommit, 0),
    board: fillBoardSlots(state),
    heroSeat: HERO_SEAT,
    seats: state.players
      .map((player) => ({
        seat: player.seat,
        name: player.name,
        stack: player.stack,
        bet: player.streetCommit,
        avatar: AVATARS[player.seat] ?? AVATARS[0],
        role:
          player.seat === state.dealerSeat
            ? 'BTN'
            : player.seat === state.sbSeat
              ? 'SB'
              : player.seat === state.bbSeat
                ? 'BB'
                : null,
        isHero: player.seat === HERO_SEAT,
        isActive: player.seat === state.toActSeat,
        isFolded: player.hasFolded,
        isAllIn: player.isAllIn,
        cards: mapSeatCards(player),
        cardsFaceUp: player.seat === HERO_SEAT,
      }))
      .sort((a, b) => a.seat - b.seat),
    legalActions: {
      canFold: Boolean(findAction(legal, 'FOLD')),
      canCheck: Boolean(checkAction),
      canCall: Boolean(callAction),
      callAmount: callAction?.toCall ?? 0,
      canRaise: Boolean(raiseAction),
      minRaiseTo: raiseAction?.minAmountTo ?? 0,
    },
  }
}

function mapSeatCards(player: HandState['players'][number]): string[] {
  if (player.seat !== HERO_SEAT) {
    return [resolvePokerBack(), resolvePokerBack()]
  }

  if (player.holeCards.length === 0) {
    return [resolvePokerBack(), resolvePokerBack()]
  }

  return player.holeCards.map((card) => resolvePokerCard(card))
}

function fillBoardSlots(state: HandState): Array<string | null> {
  const mapped = state.board.map((card) => resolvePokerCard(card))

  while (mapped.length < 5) {
    mapped.push(null)
  }

  return mapped.slice(0, 5)
}

function findAction(
  actions: LegalAction[],
  type: LegalAction['type'],
): LegalAction | undefined {
  return actions.find((item) => item.type === type)
}
