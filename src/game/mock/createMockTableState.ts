import type { Card, HandState, PlayerState } from '../types'
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

const HERO_SEAT = 0

const AVATARS = [1, 2, 3, 4, 5, 6].map((index) => resolveAvatar(index))

function createPlayers(): PlayerState[] {
  return Array.from({ length: 6 }).map((_, seat) => ({
    seat,
    id: `p-${seat}`,
    name: seat === HERO_SEAT ? 'You' : `AI ${seat}`,
    stack: seat === HERO_SEAT ? 1800 : 2000,
    holeCards:
      seat === HERO_SEAT
        ? [
            { suit: 'Heart', rank: 14 },
            { suit: 'Club', rank: 11 },
          ]
        : [
            { suit: 'Spade', rank: 8 },
            { suit: 'Diamond', rank: 4 },
          ],
    inHand: true,
    hasFolded: false,
    isAllIn: false,
    streetCommit: 0,
    handCommit: 0,
    actedThisStreet: false,
  }))
}

export function createMockHandState(): HandState {
  return {
    handId: 1,
    phase: 'BETTING_FLOP',
    street: 'FLOP',
    dealerSeat: 0,
    sbSeat: 1,
    bbSeat: 2,
    toActSeat: HERO_SEAT,
    smallBlind: 50,
    bigBlind: 100,
    ante: 0,
    board: [
      { suit: 'Spade', rank: 14 },
      { suit: 'Heart', rank: 12 },
      { suit: 'Diamond', rank: 9 },
    ],
    burn: [],
    deck: [],
    currentBet: 100,
    lastFullRaiseSize: 100,
    players: createPlayers(),
    pots: [],
    uncalledReturn: 0,
    winnerSeatIds: [],
  }
}

export function toTableViewModel(state: HandState): TableViewModel {
  return {
    pot: 0,
    board: fillBoardSlots(state.board),
    heroSeat: HERO_SEAT,
    seats: state.players.map((player) => ({
      seat: player.seat,
      name: player.name,
      stack: player.stack,
      bet: player.seat === 1 ? 50 : player.seat === 2 ? 100 : 0,
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
      cards: mapCards(player.holeCards),
      cardsFaceUp: player.seat === HERO_SEAT,
    })),
    legalActions: {
      canFold: true,
      canCheck: false,
      canCall: true,
      callAmount: 100,
      canRaise: true,
      minRaiseTo: 200,
    },
  }
}

function mapCards(cards: Card[]): string[] {
  if (cards.length === 0) {
    return [resolvePokerBack(), resolvePokerBack()]
  }

  return cards.map((card) => resolvePokerCard(card))
}

function fillBoardSlots(board: Card[]): Array<string | null> {
  const mapped = board.map((card) => resolvePokerCard(card))

  while (mapped.length < 5) {
    mapped.push(null)
  }

  return mapped.slice(0, 5)
}
