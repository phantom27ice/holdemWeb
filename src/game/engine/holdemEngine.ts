import type {
  Action,
  EngineResult,
  GameEvent,
  HandState,
  LegalAction,
  PlayerState,
} from '../types'
import { createDeck } from './deck'

export interface EngineConfig {
  smallBlind: number
  bigBlind: number
  ante: number
}

export interface TablePlayerInput {
  seat: number
  id: string
  name: string
  stack: number
}

export function createInitialHandState(
  players: TablePlayerInput[],
  config: EngineConfig,
): HandState {
  const sortedPlayers = [...players].sort((a, b) => a.seat - b.seat)

  return {
    handId: 0,
    phase: 'WAITING_FOR_PLAYERS',
    street: 'PRE_FLOP',
    dealerSeat: sortedPlayers[0]?.seat ?? 0,
    sbSeat: sortedPlayers[1]?.seat ?? sortedPlayers[0]?.seat ?? 0,
    bbSeat: sortedPlayers[2]?.seat ?? sortedPlayers[1]?.seat ?? sortedPlayers[0]?.seat ?? 0,
    toActSeat: sortedPlayers[0]?.seat ?? 0,
    smallBlind: config.smallBlind,
    bigBlind: config.bigBlind,
    ante: config.ante,
    board: [],
    burn: [],
    deck: createDeck(),
    currentBet: 0,
    lastFullRaiseSize: config.bigBlind,
    players: sortedPlayers.map(toPlayerState),
    pots: [],
    uncalledReturn: 0,
    winnerSeatIds: [],
  }
}

export function dispatch(state: HandState, action: Action): EngineResult {
  const working = structuredClone(state)
  const events: GameEvent[] = []

  switch (action.type) {
    case 'START_HAND': {
      working.handId += 1
      working.phase = 'POST_FORCED_BETS'
      working.street = 'PRE_FLOP'
      working.seed = action.seed
      working.board = []
      working.burn = []
      working.deck = createDeck()
      working.currentBet = 0
      working.lastFullRaiseSize = working.bigBlind
      working.pots = []
      working.uncalledReturn = 0
      working.winnerSeatIds = []

      for (const player of working.players) {
        player.holeCards = []
        player.inHand = player.stack > 0
        player.hasFolded = false
        player.isAllIn = false
        player.streetCommit = 0
        player.handCommit = 0
        player.actedThisStreet = false
      }

      events.push({ type: 'HAND_STARTED', handId: working.handId })
      break
    }

    case 'POST_FORCED_BETS': {
      working.phase = 'DEAL_HOLE_CARDS'
      break
    }

    case 'ADVANCE_STREET': {
      working.phase = nextPhase(working.phase)
      break
    }

    case 'SHOWDOWN': {
      working.phase = 'SHOWDOWN'
      break
    }

    case 'PAYOUT': {
      working.phase = 'PAYOUT'
      break
    }

    case 'CHECK':
    case 'CALL':
    case 'FOLD':
    case 'BET':
    case 'RAISE':
    case 'ALL_IN': {
      // V1 skeleton: 先记录事件，具体金额与规则在 M2 完整实现。
      const seat = action.seat
      events.push({
        type: 'ACTION_APPLIED',
        seat,
        action: action.type,
        amount: 'amountTo' in action ? action.amountTo : 0,
      })
      break
    }

    default:
      assertNever(action)
  }

  return {
    state: working,
    events,
  }
}

export function getLegalActions(state: HandState, seat: number): LegalAction[] {
  if (state.toActSeat !== seat) {
    return []
  }

  const player = state.players.find((item) => item.seat === seat)
  if (!player || player.hasFolded || player.isAllIn || !player.inHand) {
    return []
  }

  const toCall = Math.max(0, state.currentBet - player.streetCommit)
  const maxAmountTo = player.streetCommit + player.stack
  const actions: LegalAction[] = []

  if (toCall === 0) {
    actions.push({ type: 'CHECK' })
    actions.push({
      type: 'BET',
      minAmountTo: state.bigBlind,
      maxAmountTo,
    })
  } else {
    actions.push({ type: 'FOLD' })
    actions.push({ type: 'CALL', toCall })

    const minRaiseTo = state.currentBet + state.lastFullRaiseSize
    if (maxAmountTo >= minRaiseTo) {
      actions.push({
        type: 'RAISE',
        minAmountTo: minRaiseTo,
        maxAmountTo,
      })
    }
  }

  actions.push({
    type: 'ALL_IN',
    maxAmountTo,
  })

  return actions
}

function toPlayerState(input: TablePlayerInput): PlayerState {
  return {
    seat: input.seat,
    id: input.id,
    name: input.name,
    stack: input.stack,
    holeCards: [],
    inHand: input.stack > 0,
    hasFolded: false,
    isAllIn: false,
    streetCommit: 0,
    handCommit: 0,
    actedThisStreet: false,
  }
}

function nextPhase(phase: HandState['phase']): HandState['phase'] {
  const order: HandState['phase'][] = [
    'WAITING_FOR_PLAYERS',
    'POST_FORCED_BETS',
    'DEAL_HOLE_CARDS',
    'BETTING_PRE_FLOP',
    'DEAL_FLOP',
    'BETTING_FLOP',
    'DEAL_TURN',
    'BETTING_TURN',
    'DEAL_RIVER',
    'BETTING_RIVER',
    'SHOWDOWN',
    'PAYOUT',
    'HAND_FINISHED',
  ]

  const index = order.indexOf(phase)
  if (index === -1 || index === order.length - 1) {
    return phase
  }

  return order[index + 1]
}

function assertNever(value: never): never {
  throw new Error(`Unexpected action: ${JSON.stringify(value)}`)
}
