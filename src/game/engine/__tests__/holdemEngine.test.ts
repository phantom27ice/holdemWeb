import { describe, expect, it } from 'vitest'
import {
  createInitialHandState,
  dispatch,
  getLegalActions,
  type EngineConfig,
  type TablePlayerInput,
} from '../holdemEngine'
import type { Action, HandState } from '../../types'

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
