import { describe, expect, it } from 'vitest'
import {
  createInitialHandState,
  dispatch,
  getLegalActions,
  type EngineConfig,
  type TablePlayerInput,
} from '../holdemEngine'
import type { Action, Card, HandState, Rank, Suit } from '../../types'

const CONFIG: EngineConfig = {
  smallBlind: 50,
  bigBlind: 100,
  ante: 0,
}

const PLAYERS_6: TablePlayerInput[] = [
  { seat: 0, id: 'p0', name: 'P0', stack: 2000 },
  { seat: 1, id: 'p1', name: 'P1', stack: 2000 },
  { seat: 2, id: 'p2', name: 'P2', stack: 2000 },
  { seat: 3, id: 'p3', name: 'P3', stack: 2000 },
  { seat: 4, id: 'p4', name: 'P4', stack: 2000 },
  { seat: 5, id: 'p5', name: 'P5', stack: 2000 },
]

const PLAYERS_2: TablePlayerInput[] = [
  { seat: 0, id: 'h', name: 'Hero', stack: 2000 },
  { seat: 1, id: 'v', name: 'Villain', stack: 2000 },
]

const PLAYERS_REOPEN: TablePlayerInput[] = [
  { seat: 0, id: 'p0', name: 'P0', stack: 2000 },
  { seat: 1, id: 'p1', name: 'P1', stack: 650 },
  { seat: 2, id: 'p2', name: 'P2', stack: 2000 },
  { seat: 3, id: 'p3', name: 'P3', stack: 2000 },
]

const PLAYERS_REOPEN_ACCUMULATED: TablePlayerInput[] = [
  { seat: 0, id: 'p0', name: 'P0', stack: 2000 },
  { seat: 1, id: 'p1', name: 'P1', stack: 2000 },
  { seat: 2, id: 'p2', name: 'P2', stack: 2000 },
  { seat: 3, id: 'p3', name: 'P3', stack: 2000 },
  { seat: 4, id: 'p4', name: 'P4', stack: 650 },
  { seat: 5, id: 'p5', name: 'P5', stack: 900 },
]

describe('holdemEngine M1 flow', () => {
  it('keeps BB option when everyone limps to BB', () => {
    let state = bootstrapPreflop(PLAYERS_6)

    // UTG -> BTN -> SB all call
    for (const seat of [3, 4, 5, 0, 1]) {
      state = apply(state, { type: 'CALL', seat })
    }

    expect(state.toActSeat).toBe(2)

    const legal = getLegalActions(state, 2)
    expect(legal.some((item) => item.type === 'CHECK')).toBe(true)
    expect(legal.some((item) => item.type === 'RAISE')).toBe(true)
  })

  it('enforces preflop minimum raise boundary', () => {
    let state = bootstrapPreflop(PLAYERS_6)

    // UTG seat = 3
    const legal = getLegalActions(state, 3)
    const raise = legal.find((item) => item.type === 'RAISE')

    expect(raise?.minAmountTo).toBe(200)

    state = apply(state, { type: 'RAISE', seat: 3, amountTo: 199 })

    // Invalid raise should not move action.
    expect(state.currentBet).toBe(100)
    expect(state.toActSeat).toBe(3)

    state = apply(state, { type: 'RAISE', seat: 3, amountTo: 200 })

    expect(state.currentBet).toBe(200)
    expect(state.lastFullRaiseSize).toBe(100)
    expect(state.toActSeat).toBe(4)

    const nextLegal = getLegalActions(state, 4)
    const nextRaise = nextLegal.find((item) => item.type === 'RAISE')
    expect(nextRaise?.minAmountTo).toBe(300)
  })

  it('moves from preflop to flop after round is complete', () => {
    let state = bootstrapPreflop(PLAYERS_6)

    for (const seat of [3, 4, 5, 0, 1]) {
      state = apply(state, { type: 'CALL', seat })
    }

    state = apply(state, { type: 'CHECK', seat: 2 })

    expect(state.phase).toBe('BETTING_FLOP')
    expect(state.street).toBe('FLOP')
    expect(state.board).toHaveLength(3)
  })

  it('goes directly to payout when only one player remains', () => {
    let state = bootstrapPreflop(PLAYERS_2)

    // Heads-up preflop: dealer/sb (seat 0) acts first.
    expect(state.toActSeat).toBe(0)

    state = apply(state, { type: 'FOLD', seat: 0 })

    expect(state.phase).toBe('PAYOUT')
    expect(state.winnerSeatIds).toEqual([1])
    expect(state.players.find((player) => player.seat === 1)?.stack).toBe(2050)
  })

  it('returns explicit NOT_ACTOR_TURN error for out-of-turn action', () => {
    const state = bootstrapPreflop(PLAYERS_6)

    const result = dispatch(state, { type: 'CHECK', seat: 0 })

    expect(result.error?.code).toBe('NOT_ACTOR_TURN')
    expect(result.state).toEqual(state)
  })

  it('returns explicit INVALID_AMOUNT error for out-of-range raise', () => {
    const state = bootstrapPreflop(PLAYERS_6)

    const result = dispatch(state, {
      type: 'RAISE',
      seat: state.toActSeat,
      amountTo: 199,
    })

    expect(result.error?.code).toBe('INVALID_AMOUNT')
    expect(result.state).toEqual(state)
  })

  it('fails fast on invariant violation input state', () => {
    const state = bootstrapPreflop(PLAYERS_6)
    const broken = structuredClone(state)
    broken.currentBet = -1

    const result = dispatch(broken, { type: 'CHECK', seat: broken.toActSeat })

    expect(result.error?.code).toBe('INVARIANT_VIOLATION')
    expect(result.state).toEqual(broken)
  })

  it('settles a single-pot showdown and restores chips to player stacks', () => {
    let state = bootstrapPreflop(PLAYERS_2)

    state = apply(state, { type: 'CALL', seat: 0 })
    state = apply(state, { type: 'CHECK', seat: 1 })

    // Flop checks
    state = apply(state, { type: 'CHECK', seat: 1 })
    state = apply(state, { type: 'CHECK', seat: 0 })

    // Turn checks
    state = apply(state, { type: 'CHECK', seat: 1 })
    state = apply(state, { type: 'CHECK', seat: 0 })

    // River checks -> showdown
    state = apply(state, { type: 'CHECK', seat: 1 })
    state = apply(state, { type: 'CHECK', seat: 0 })

    expect(state.phase).toBe('PAYOUT')
    expect(state.winnerSeatIds.length).toBeGreaterThan(0)
    expect(state.players.reduce((sum, player) => sum + player.stack, 0)).toBe(4000)
  })

  it('runs 50 consecutive hands without state corruption', () => {
    let state = createInitialHandState(PLAYERS_6, CONFIG)
    const totalChips = PLAYERS_6.reduce((sum, player) => sum + player.stack, 0)

    for (let hand = 0; hand < 50; hand += 1) {
      state = applyStrict(state, { type: 'START_HAND', seed: 1000 + hand })
      if (state.phase === 'WAITING_FOR_PLAYERS') {
        break
      }

      state = applyStrict(state, { type: 'POST_FORCED_BETS' })
      state = applyStrict(state, { type: 'DEAL_HOLE_CARDS' })

      let steps = 0
      while (state.phase !== 'PAYOUT' && steps < 400) {
        if (!isBettingPhaseLike(state.phase)) {
          break
        }

        const seat = state.toActSeat
        expect(seat).toBeGreaterThanOrEqual(0)

        const legal = getLegalActions(state, seat)
        expect(legal.length).toBeGreaterThan(0)

        state = applyStrict(state, pickPassiveAction(legal, seat))
        steps += 1
      }

      expect(state.phase).toBe('PAYOUT')
      expect(steps).toBeLessThan(400)
      expect(state.players.reduce((sum, player) => sum + player.stack, 0)).toBe(totalChips)
      expect(state.players.some((player) => player.stack < 0)).toBe(false)
    }
  })

  it('does not reopen raise after a single short all-in', () => {
    let state = bootstrapPreflop(PLAYERS_REOPEN)

    // seat3 opens to 500
    state = apply(state, { type: 'RAISE', seat: 3, amountTo: 500 })
    state = apply(state, { type: 'FOLD', seat: 0 })
    state = apply(state, { type: 'ALL_IN', seat: 1 }) // to 650
    state = apply(state, { type: 'FOLD', seat: 2 })

    expect(state.toActSeat).toBe(3)

    const legal = getLegalActions(state, 3)
    expect(legal.some((item) => item.type === 'RAISE')).toBe(false)
    expect(legal.some((item) => item.type === 'CALL')).toBe(true)
  })

  it('reopens raise after accumulated short all-ins reach a full raise', () => {
    let state = bootstrapPreflop(PLAYERS_REOPEN_ACCUMULATED)

    // seat3 opens to 500 (full raise size = 400 over BB=100)
    state = apply(state, { type: 'RAISE', seat: 3, amountTo: 500 })
    state = apply(state, { type: 'ALL_IN', seat: 4 }) // to 650, +150
    state = apply(state, { type: 'ALL_IN', seat: 5 }) // to 900, +250 cumulative +400
    state = apply(state, { type: 'FOLD', seat: 0 })
    state = apply(state, { type: 'FOLD', seat: 1 })
    state = apply(state, { type: 'FOLD', seat: 2 })

    expect(state.toActSeat).toBe(3)

    const legal = getLegalActions(state, 3)
    expect(legal.some((item) => item.type === 'RAISE')).toBe(true)
  })

  it('builds side pots and settles them in showdown', () => {
    let state = createInitialHandState(
      [
        { seat: 0, id: 'a', name: 'A', stack: 1000 },
        { seat: 1, id: 'b', name: 'B', stack: 600 },
        { seat: 2, id: 'c', name: 'C', stack: 300 },
      ],
      CONFIG,
    )

    state = apply(state, { type: 'START_HAND', seed: 7 })
    state.phase = 'SHOWDOWN'
    state.street = 'SHOWDOWN'
    state.toActSeat = -1
    state.currentBet = 0
    state.lastFullRaiseSize = 100
    state.board = [
      c('Spade', 2),
      c('Spade', 7),
      c('Spade', 9),
      c('Diamond', 11),
      c('Diamond', 12),
    ]
    state.players.forEach((player) => {
      player.inHand = true
      player.hasFolded = false
      player.isAllIn = true
      player.streetCommit = 0
      player.actedThisStreet = true
      player.lastActionToAmountThisStreet = null
      player.stack = 0
    })
    // A (seat0): weakest
    state.players[0].holeCards = [c('Heart', 14), c('Club', 4)]
    state.players[0].handCommit = 1000
    // B (seat1): middle
    state.players[1].holeCards = [c('Club', 13), c('Club', 10)]
    state.players[1].handCommit = 600
    // C (seat2): strongest
    state.players[2].holeCards = [c('Spade', 14), c('Spade', 3)]
    state.players[2].handCommit = 300

    expect(state.players.map((player) => [player.seat, player.stack, player.isAllIn])).toEqual([
      [0, 0, true],
      [1, 0, true],
      [2, 0, true],
    ])

    const payout = dispatch(state, { type: 'PAYOUT' })
    expect(payout.error).toBeUndefined()
    state = payout.state

    expect(state.phase).toBe('PAYOUT')
    expect(state.uncalledReturn).toBe(400)
    expect(state.pots.map((pot) => pot.amount)).toEqual([900, 600])
    expect(state.players.find((player) => player.seat === 0)?.stack).toBe(400)
    expect(state.players.find((player) => player.seat === 1)?.stack).toBe(600)
    expect(state.players.find((player) => player.seat === 2)?.stack).toBe(900)
    expect(state.players.reduce((sum, player) => sum + player.stack, 0)).toBe(1900)
  })
})

function bootstrapPreflop(players: TablePlayerInput[]): HandState {
  let state = createInitialHandState(players, CONFIG)
  state = apply(state, { type: 'START_HAND', seed: 20260318 })
  state = apply(state, { type: 'POST_FORCED_BETS' })
  state = apply(state, { type: 'DEAL_HOLE_CARDS' })
  return state
}

function apply(state: HandState, action: Action): HandState {
  return dispatch(state, action).state
}

function applyStrict(state: HandState, action: Action): HandState {
  const result = dispatch(state, action)
  expect(result.error).toBeUndefined()
  return result.state
}

function pickPassiveAction(legal: ReturnType<typeof getLegalActions>, seat: number): Action {
  if (legal.some((item) => item.type === 'CHECK')) {
    return { type: 'CHECK', seat }
  }

  if (legal.some((item) => item.type === 'CALL')) {
    return { type: 'CALL', seat }
  }

  if (legal.some((item) => item.type === 'FOLD')) {
    return { type: 'FOLD', seat }
  }

  return { type: 'ALL_IN', seat }
}

function isBettingPhaseLike(phase: HandState['phase']): boolean {
  return (
    phase === 'BETTING_PRE_FLOP' ||
    phase === 'BETTING_FLOP' ||
    phase === 'BETTING_TURN' ||
    phase === 'BETTING_RIVER'
  )
}

function c(suit: Suit, rank: Rank): Card {
  return { suit, rank }
}
