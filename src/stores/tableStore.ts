import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import {
  createInitialHandState,
  dispatch as dispatchEngine,
  getLegalActions,
} from '../game/engine'
import type { Action, EngineError, GameEvent, HandState } from '../game/types'
import {
  DEFAULT_ENGINE_CONFIG,
  DEMO_PLAYERS,
  HERO_SEAT,
  toTableViewModel,
} from '../game/mock/createMockTableState'

const AI_LOOP_GUARD = 256

export const useTableStore = defineStore('table', () => {
  const handState = shallowRef<HandState>(
    createInitialHandState(DEMO_PLAYERS, DEFAULT_ENGINE_CONFIG),
  )
  const events = ref<GameEvent[]>([])
  const lastEngineError = ref<EngineError | null>(null)

  const tableView = computed(() => toTableViewModel(handState.value))

  function hydrateMockState(): void {
    handState.value = createInitialHandState(DEMO_PLAYERS, DEFAULT_ENGINE_CONFIG)
    events.value = []
    lastEngineError.value = null
    startHand()
  }

  function startHand(): void {
    applyAction({ type: 'START_HAND' })
    applyAction({ type: 'POST_FORCED_BETS' })
    applyAction({ type: 'DEAL_HOLE_CARDS' })
    runAiUntilHeroTurn()
  }

  function heroFold(): void {
    if (handState.value.toActSeat !== HERO_SEAT) {
      return
    }

    applyAction({ type: 'FOLD', seat: HERO_SEAT })
    runAiUntilHeroTurn()
  }

  function heroCallOrCheck(): void {
    if (handState.value.toActSeat !== HERO_SEAT) {
      return
    }

    const legalActions = getLegalActions(handState.value, HERO_SEAT)

    if (legalActions.some((item) => item.type === 'CHECK')) {
      applyAction({ type: 'CHECK', seat: HERO_SEAT })
    } else if (legalActions.some((item) => item.type === 'CALL')) {
      applyAction({ type: 'CALL', seat: HERO_SEAT })
    }

    runAiUntilHeroTurn()
  }

  function heroRaise(): void {
    if (handState.value.toActSeat !== HERO_SEAT) {
      return
    }

    const legalActions = getLegalActions(handState.value, HERO_SEAT)
    const raiseAction = legalActions.find((item) => item.type === 'RAISE')
    const betAction = legalActions.find((item) => item.type === 'BET')

    if (raiseAction?.minAmountTo) {
      applyAction({
        type: 'RAISE',
        seat: HERO_SEAT,
        amountTo: raiseAction.minAmountTo,
      })
      runAiUntilHeroTurn()
      return
    }

    if (betAction?.minAmountTo) {
      applyAction({
        type: 'BET',
        seat: HERO_SEAT,
        amountTo: betAction.minAmountTo,
      })
      runAiUntilHeroTurn()
    }
  }

  function runAiUntilHeroTurn(): void {
    let loop = 0

    while (loop < AI_LOOP_GUARD) {
      loop += 1

      if (handState.value.phase === 'PAYOUT') {
        const started = startNextHandIfPossible()
        if (!started) {
          break
        }
        continue
      }

      if (!isHandRunning(handState.value.phase)) {
        break
      }

      const seat = handState.value.toActSeat
      if (seat === HERO_SEAT || seat < 0) {
        break
      }

      const legalActions = getLegalActions(handState.value, seat)
      if (legalActions.length === 0) {
        break
      }

      if (legalActions.some((item) => item.type === 'CHECK')) {
        applyAction({ type: 'CHECK', seat })
        continue
      }

      if (legalActions.some((item) => item.type === 'CALL')) {
        applyAction({ type: 'CALL', seat })
        continue
      }

      applyAction({ type: 'FOLD', seat })
    }
  }

  function startNextHandIfPossible(): boolean {
    const activePlayers = handState.value.players.filter((player) => player.stack > 0)
    if (activePlayers.length < 2) {
      return false
    }

    applyAction({ type: 'START_HAND' })
    applyAction({ type: 'POST_FORCED_BETS' })
    applyAction({ type: 'DEAL_HOLE_CARDS' })
    return true
  }

  function applyAction(action: Action): void {
    const result = dispatchEngine(handState.value, action)

    if (result.error) {
      lastEngineError.value = result.error
      return
    }

    lastEngineError.value = null
    handState.value = result.state
    events.value.push(...result.events)
  }

  function consumeEvents(): GameEvent[] {
    if (events.value.length === 0) {
      return []
    }

    const batch = [...events.value]
    events.value = []
    return batch
  }

  return {
    handState,
    events,
    lastEngineError,
    tableView,
    hydrateMockState,
    startHand,
    heroFold,
    heroCallOrCheck,
    heroRaise,
    consumeEvents,
  }
})

function isHandRunning(phase: HandState['phase']): boolean {
  return (
    phase === 'BETTING_PRE_FLOP' ||
    phase === 'BETTING_FLOP' ||
    phase === 'BETTING_TURN' ||
    phase === 'BETTING_RIVER'
  )
}
