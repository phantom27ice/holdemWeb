import { describe, expect, it } from 'vitest'
import {
  createInitialHandState,
  dispatch,
  type EngineConfig,
  type TablePlayerInput,
} from '../holdemEngine'
import type { Card, HandState, Rank, Suit } from '../../types'

const CONFIG: EngineConfig = {
  smallBlind: 50,
  bigBlind: 100,
  ante: 0,
}

describe('regression matrix', () => {
  it('awards odd chip to first winner left of button', () => {
    const players: TablePlayerInput[] = [
      { seat: 0, id: 'p0', name: 'P0', stack: 1000 },
      { seat: 1, id: 'p1', name: 'P1', stack: 1000 },
      { seat: 2, id: 'p2', name: 'P2', stack: 1000 },
    ]

    let state = createInitialHandState(players, CONFIG)
    state = dispatch(state, { type: 'START_HAND', seed: 99 }).state

    state.phase = 'SHOWDOWN'
    state.street = 'SHOWDOWN'
    state.toActSeat = -1
    state.currentBet = 0
    state.board = [c('Spade', 14), c('Heart', 13), c('Club', 12), c('Diamond', 11), c('Spade', 10)]

    // Seat 0 folded but contributes to pot.
    state.players[0].inHand = true
    state.players[0].hasFolded = true
    state.players[0].isAllIn = false
    state.players[0].handCommit = 101
    state.players[0].stack = 899
    state.players[0].holeCards = [c('Heart', 2), c('Club', 3)]

    // Seat 1 and 2 tie by playing the board.
    state.players[1].inHand = true
    state.players[1].hasFolded = false
    state.players[1].isAllIn = false
    state.players[1].handCommit = 101
    state.players[1].stack = 899
    state.players[1].holeCards = [c('Heart', 4), c('Club', 5)]

    state.players[2].inHand = true
    state.players[2].hasFolded = false
    state.players[2].isAllIn = false
    state.players[2].handCommit = 101
    state.players[2].stack = 899
    state.players[2].holeCards = [c('Heart', 6), c('Club', 7)]

    const result = dispatch(state, { type: 'PAYOUT' })

    expect(result.error).toBeUndefined()
    expect(result.state.players.find((player) => player.seat === 1)?.stack).toBe(1051)
    expect(result.state.players.find((player) => player.seat === 2)?.stack).toBe(1050)
    expect(result.state.players.reduce((sum, player) => sum + player.stack, 0)).toBe(3000)
  })

  it('settles side pot before main pot in payout events', () => {
    const state = buildSidePotShowdownState()
    const result = dispatch(state, { type: 'PAYOUT' })

    expect(result.error).toBeUndefined()
    const potEvents = result.events.filter((event) => event.type === 'POT_AWARDED')

    expect(potEvents).toHaveLength(2)
    expect(potEvents[0].potId).toBe('side-1')
    expect(potEvents[1].potId).toBe('main')
    expect(potEvents[0].winners).toEqual([1])
    expect(potEvents[1].winners).toEqual([2])
  })
})

function buildSidePotShowdownState(): HandState {
  let state = createInitialHandState(
    [
      { seat: 0, id: 'a', name: 'A', stack: 1000 },
      { seat: 1, id: 'b', name: 'B', stack: 600 },
      { seat: 2, id: 'c', name: 'C', stack: 300 },
    ],
    CONFIG,
  )

  state = dispatch(state, { type: 'START_HAND', seed: 7 }).state
  state.phase = 'SHOWDOWN'
  state.street = 'SHOWDOWN'
  state.toActSeat = -1
  state.currentBet = 0
  state.lastFullRaiseSize = 100
  state.board = [c('Spade', 2), c('Spade', 7), c('Spade', 9), c('Diamond', 11), c('Diamond', 12)]

  state.players.forEach((player) => {
    player.inHand = true
    player.hasFolded = false
    player.isAllIn = true
    player.streetCommit = 0
    player.actedThisStreet = true
    player.lastActionToAmountThisStreet = null
    player.stack = 0
  })

  state.players[0].holeCards = [c('Heart', 14), c('Club', 4)]
  state.players[0].handCommit = 1000

  state.players[1].holeCards = [c('Club', 13), c('Club', 10)]
  state.players[1].handCommit = 600

  state.players[2].holeCards = [c('Spade', 14), c('Spade', 3)]
  state.players[2].handCommit = 300

  return state
}

function c(suit: Suit, rank: Rank): Card {
  return { suit, rank }
}
