import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import {
  createInitialHandState,
  dispatch as dispatchEngine,
  getLegalActions,
} from '../game/engine'
import type {
  Action,
  EngineError,
  GameEvent,
  HandState,
  LegalAction,
} from '../game/types'
import {
  DEFAULT_ENGINE_CONFIG,
  DEMO_PLAYERS,
  HERO_SEAT,
  toTableViewModel,
} from '../game/mock/createMockTableState'

const AI_THINK_DELAY_MIN_MS = 700
const AI_THINK_DELAY_MAX_MS = 1400
const AI_TURN_TIMEOUT_MS = 6000
const HERO_TURN_TIMEOUT_MS = 12000
const TURN_TICK_INTERVAL_MS = 100
const NEXT_HAND_DELAY_MS = 900

export interface TurnTempoState {
  actorSeat: number
  remainingMs: number
  totalMs: number
  isHeroTurn: boolean
  isRunning: boolean
}

export const useTableStore = defineStore('table', () => {
  const handState = shallowRef<HandState>(
    createInitialHandState(DEMO_PLAYERS, DEFAULT_ENGINE_CONFIG),
  )
  const events = ref<GameEvent[]>([])
  const lastEngineError = ref<EngineError | null>(null)
  const turnTempo = ref<TurnTempoState>(createIdleTurnTempo())
  let schedulerToken = 0
  let schedulerTimer: ReturnType<typeof setTimeout> | null = null
  let turnTimeoutTimer: ReturnType<typeof setTimeout> | null = null
  let turnTickTimer: ReturnType<typeof setInterval> | null = null

  const tableView = computed(() => toTableViewModel(handState.value))

  function hydrateMockState(): void {
    resetScheduler()
    handState.value = createInitialHandState(DEMO_PLAYERS, DEFAULT_ENGINE_CONFIG)
    events.value = []
    lastEngineError.value = null
    startHand()
  }

  function startHand(): void {
    applyAction({ type: 'START_HAND' })
    applyAction({ type: 'POST_FORCED_BETS' })
    applyAction({ type: 'DEAL_HOLE_CARDS' })
    scheduleEngineProgress()
  }

  function heroFold(): void {
    if (handState.value.toActSeat !== HERO_SEAT) {
      return
    }

    applyAction({ type: 'FOLD', seat: HERO_SEAT })
    scheduleEngineProgress()
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

    scheduleEngineProgress()
  }

  function heroRaise(targetAmountTo?: number): void {
    if (handState.value.toActSeat !== HERO_SEAT) {
      return
    }

    const legalActions = getLegalActions(handState.value, HERO_SEAT)
    const raiseAction = legalActions.find((item) => item.type === 'RAISE')
    const betAction = legalActions.find((item) => item.type === 'BET')

    if (raiseAction?.minAmountTo) {
      const amountTo = clampAmountTo(
        targetAmountTo,
        raiseAction.minAmountTo,
        raiseAction.maxAmountTo ?? raiseAction.minAmountTo,
      )
      applyAction({
        type: 'RAISE',
        seat: HERO_SEAT,
        amountTo,
      })
      scheduleEngineProgress()
      return
    }

    if (betAction?.minAmountTo) {
      const amountTo = clampAmountTo(
        targetAmountTo,
        betAction.minAmountTo,
        betAction.maxAmountTo ?? betAction.minAmountTo,
      )
      applyAction({
        type: 'BET',
        seat: HERO_SEAT,
        amountTo,
      })
      scheduleEngineProgress()
    }
  }

  function heroAllIn(): void {
    if (handState.value.toActSeat !== HERO_SEAT) {
      return
    }

    const legalActions = getLegalActions(handState.value, HERO_SEAT)
    if (!legalActions.some((item) => item.type === 'ALL_IN')) {
      return
    }

    applyAction({
      type: 'ALL_IN',
      seat: HERO_SEAT,
    })
    scheduleEngineProgress()
  }

  function scheduleEngineProgress(): void {
    schedulerToken += 1
    const token = schedulerToken
    clearSchedulerTimers()
    stopTurnTempo()

    const snapshot = handState.value

    if (snapshot.phase === 'PAYOUT') {
      schedulerTimer = setTimeout(() => {
        if (token !== schedulerToken) {
          return
        }

        if (handState.value.phase !== 'PAYOUT') {
          scheduleEngineProgress()
          return
        }

        const started = startNextHandIfPossible()
        if (started) {
          scheduleEngineProgress()
        }
      }, NEXT_HAND_DELAY_MS)
      return
    }

    if (!isHandRunning(snapshot.phase)) {
      return
    }

    const seat = snapshot.toActSeat
    if (seat < 0) {
      return
    }

    const legalActions = getLegalActions(snapshot, seat)
    if (legalActions.length === 0) {
      return
    }

    const heroTurn = seat === HERO_SEAT
    const turnTimeoutMs = heroTurn ? HERO_TURN_TIMEOUT_MS : AI_TURN_TIMEOUT_MS
    startTurnTempo(seat, turnTimeoutMs)

    turnTimeoutTimer = setTimeout(() => {
      if (token !== schedulerToken) {
        return
      }

      const latest = handState.value
      if (!isHandRunning(latest.phase)) {
        scheduleEngineProgress()
        return
      }

      const latestSeat = latest.toActSeat
      if (latestSeat !== seat || latestSeat < 0) {
        scheduleEngineProgress()
        return
      }

      const latestLegalActions = getLegalActions(latest, latestSeat)
      const action = pickTimeoutAction(latestSeat, latestLegalActions)
      if (!action) {
        scheduleEngineProgress()
        return
      }

      const fallback = action.type
      applyAction(action)
      events.value.push({
        type: 'TURN_TIMEOUT',
        seat: latestSeat,
        fallback,
      })
      scheduleEngineProgress()
    }, turnTimeoutMs)

    if (heroTurn) {
      return
    }

    schedulerTimer = setTimeout(() => {
      if (token !== schedulerToken) {
        return
      }

      const latest = handState.value
      if (!isHandRunning(latest.phase)) {
        scheduleEngineProgress()
        return
      }

      const latestSeat = latest.toActSeat
      if (latestSeat !== seat || latestSeat < 0) {
        scheduleEngineProgress()
        return
      }

      const latestLegalActions = getLegalActions(latest, latestSeat)
      const action = pickAiAction(latestSeat, latestLegalActions)
      if (!action) {
        scheduleEngineProgress()
        return
      }

      applyAction(action)
      scheduleEngineProgress()
    }, randomAiDelayMs())
  }

  function resetScheduler(): void {
    clearSchedulerTimers()
    stopTurnTempo()
    schedulerToken += 1
  }

  function clearSchedulerTimers(): void {
    if (schedulerTimer === null) {
      // no-op
    } else {
      clearTimeout(schedulerTimer)
      schedulerTimer = null
    }

    if (turnTimeoutTimer === null) {
      // no-op
    } else {
      clearTimeout(turnTimeoutTimer)
      turnTimeoutTimer = null
    }

    if (turnTickTimer === null) {
      return
    }

    clearInterval(turnTickTimer)
    turnTickTimer = null
  }

  function startTurnTempo(actorSeat: number, totalMs: number): void {
    const startedAt = Date.now()

    turnTempo.value = {
      actorSeat,
      remainingMs: totalMs,
      totalMs,
      isHeroTurn: actorSeat === HERO_SEAT,
      isRunning: true,
    }

    turnTickTimer = setInterval(() => {
      const elapsed = Date.now() - startedAt
      turnTempo.value = {
        ...turnTempo.value,
        remainingMs: Math.max(0, totalMs - elapsed),
      }
    }, TURN_TICK_INTERVAL_MS)
  }

  function stopTurnTempo(): void {
    turnTempo.value = createIdleTurnTempo()
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
    turnTempo,
    tableView,
    hydrateMockState,
    startHand,
    heroFold,
    heroCallOrCheck,
    heroRaise,
    heroAllIn,
    consumeEvents,
  }
})

function pickAiAction(seat: number, legalActions: LegalAction[]): Action | null {
  if (legalActions.some((item) => item.type === 'CHECK')) {
    return { type: 'CHECK', seat }
  }

  if (legalActions.some((item) => item.type === 'CALL')) {
    return { type: 'CALL', seat }
  }

  if (legalActions.some((item) => item.type === 'FOLD')) {
    return { type: 'FOLD', seat }
  }

  return null
}

function pickTimeoutAction(seat: number, legalActions: LegalAction[]): Action | null {
  if (legalActions.some((item) => item.type === 'CHECK')) {
    return { type: 'CHECK', seat }
  }

  if (legalActions.some((item) => item.type === 'FOLD')) {
    return { type: 'FOLD', seat }
  }

  return null
}

function randomAiDelayMs(): number {
  const spread = AI_THINK_DELAY_MAX_MS - AI_THINK_DELAY_MIN_MS
  return AI_THINK_DELAY_MIN_MS + Math.floor(Math.random() * (spread + 1))
}

function clampAmountTo(targetAmountTo: number | undefined, minAmountTo: number, maxAmountTo: number): number {
  const normalized =
    typeof targetAmountTo === 'number' && Number.isFinite(targetAmountTo)
      ? Math.trunc(targetAmountTo)
      : minAmountTo

  if (normalized < minAmountTo) {
    return minAmountTo
  }

  if (normalized > maxAmountTo) {
    return maxAmountTo
  }

  return normalized
}

function createIdleTurnTempo(): TurnTempoState {
  return {
    actorSeat: -1,
    remainingMs: 0,
    totalMs: 0,
    isHeroTurn: false,
    isRunning: false,
  }
}

function isHandRunning(phase: HandState['phase']): boolean {
  return (
    phase === 'BETTING_PRE_FLOP' ||
    phase === 'BETTING_FLOP' ||
    phase === 'BETTING_TURN' ||
    phase === 'BETTING_RIVER'
  )
}
