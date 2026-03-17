import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTableStore } from '../tableStore'
import { HERO_SEAT } from '../../game/mock/createMockTableState'

describe('tableStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('consumeEvents drains buffered events', () => {
    const store = useTableStore()
    store.hydrateMockState()

    expect(store.events.length).toBeGreaterThan(0)

    const batch = store.consumeEvents()
    expect(batch.length).toBeGreaterThan(0)
    expect(store.events.length).toBe(0)

    const emptyBatch = store.consumeEvents()
    expect(emptyBatch).toHaveLength(0)
  })

  it('schedules AI actions one by one instead of resolving instantly', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const store = useTableStore()
    store.hydrateMockState()

    store.consumeEvents()
    expect(store.events).toHaveLength(0)
    expect(store.handState.toActSeat).not.toBe(HERO_SEAT)

    vi.advanceTimersByTime(699)
    expect(store.events).toHaveLength(0)

    vi.advanceTimersByTime(1)
    const firstStep = store.consumeEvents()
    expect(firstStep.filter((event) => event.type === 'ACTION_APPLIED')).toHaveLength(1)

    vi.advanceTimersByTime(699)
    expect(store.events).toHaveLength(0)

    vi.advanceTimersByTime(1)
    const secondStep = store.consumeEvents()
    expect(secondStep.filter((event) => event.type === 'ACTION_APPLIED')).toHaveLength(1)
  })

  it('auto-applies timeout fallback for hero turn', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const store = useTableStore()
    store.hydrateMockState()
    store.consumeEvents()

    let guard = 0
    while (store.handState.toActSeat !== HERO_SEAT && guard < 8) {
      guard += 1
      vi.advanceTimersByTime(700)
      store.consumeEvents()
    }

    expect(store.handState.toActSeat).toBe(HERO_SEAT)

    vi.advanceTimersByTime(11999)
    expect(store.events).toHaveLength(0)

    vi.advanceTimersByTime(1)
    const timeoutBatch = store.consumeEvents()
    const timeoutEvent = timeoutBatch.find((event) => event.type === 'TURN_TIMEOUT')
    const heroApplied = timeoutBatch.find(
      (event) => event.type === 'ACTION_APPLIED' && event.seat === HERO_SEAT,
    )

    expect(timeoutEvent).toBeTruthy()
    expect(heroApplied).toBeTruthy()

    if (timeoutEvent?.type === 'TURN_TIMEOUT' && heroApplied?.type === 'ACTION_APPLIED') {
      expect(heroApplied.action).toBe(timeoutEvent.fallback)
    }
  })

  it('auto-applies timeout fallback for AI turn when think delay exceeds timeout', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(999)

    const store = useTableStore()
    store.hydrateMockState()

    store.consumeEvents()
    expect(store.handState.toActSeat).not.toBe(HERO_SEAT)

    vi.advanceTimersByTime(5999)
    expect(store.events).toHaveLength(0)

    vi.advanceTimersByTime(1)
    const timeoutBatch = store.consumeEvents()
    const timeoutEvent = timeoutBatch.find((event) => event.type === 'TURN_TIMEOUT')
    const aiApplied = timeoutBatch.find(
      (event) =>
        event.type === 'ACTION_APPLIED' &&
        event.seat !== HERO_SEAT &&
        (event.action === 'CHECK' || event.action === 'FOLD'),
    )

    expect(timeoutEvent).toBeTruthy()
    expect(aiApplied).toBeTruthy()

    if (timeoutEvent?.type === 'TURN_TIMEOUT' && aiApplied?.type === 'ACTION_APPLIED') {
      expect(aiApplied.seat).toBe(timeoutEvent.seat)
      expect(aiApplied.action).toBe(timeoutEvent.fallback)
    }
  })

  it('resolves hero timeout exactly once when countdown reaches zero', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const store = useTableStore()
    store.hydrateMockState()
    store.consumeEvents()

    let guard = 0
    while (store.handState.toActSeat !== HERO_SEAT && guard < 8) {
      guard += 1
      vi.advanceTimersByTime(700)
      store.consumeEvents()
    }

    expect(store.handState.toActSeat).toBe(HERO_SEAT)

    vi.advanceTimersByTime(12000)
    const firstBatch = store.consumeEvents()
    const heroTimeoutEvents = firstBatch.filter(
      (event) => event.type === 'TURN_TIMEOUT' && event.seat === HERO_SEAT,
    )
    const heroAppliedEvents = firstBatch.filter(
      (event) => event.type === 'ACTION_APPLIED' && event.seat === HERO_SEAT,
    )

    expect(heroTimeoutEvents).toHaveLength(1)
    expect(heroAppliedEvents).toHaveLength(1)

    vi.advanceTimersByTime(5000)
    const laterBatch = store.consumeEvents()
    const duplicatedHeroTimeouts = laterBatch.filter(
      (event) => event.type === 'TURN_TIMEOUT' && event.seat === HERO_SEAT,
    )

    expect(duplicatedHeroTimeouts).toHaveLength(0)
  })

  it('clamps hero raise amountTo into legal range', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const store = useTableStore()
    store.hydrateMockState()
    store.consumeEvents()

    let guard = 0
    while (store.handState.toActSeat !== HERO_SEAT && guard < 8) {
      guard += 1
      vi.advanceTimersByTime(700)
      store.consumeEvents()
    }

    expect(store.handState.toActSeat).toBe(HERO_SEAT)
    expect(store.tableView.legalActions.canRaise).toBe(true)

    const minRaiseTo = store.tableView.legalActions.minRaiseTo
    const maxRaiseTo = store.tableView.legalActions.maxRaiseTo
    expect(maxRaiseTo).toBeGreaterThanOrEqual(minRaiseTo)

    store.heroRaise(maxRaiseTo + 5000)

    const hero = store.handState.players.find((player) => player.seat === HERO_SEAT)
    expect(hero?.streetCommit).toBe(maxRaiseTo)

    const batch = store.consumeEvents()
    const heroRaiseEvent = batch.find(
      (event) => event.type === 'ACTION_APPLIED' && event.seat === HERO_SEAT,
    )
    expect(heroRaiseEvent).toBeTruthy()

    if (heroRaiseEvent?.type === 'ACTION_APPLIED') {
      expect(['BET', 'RAISE']).toContain(heroRaiseEvent.action)
    }
  })

  it('clamps hero raise amountTo to minimum when input is too small', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const store = useTableStore()
    store.hydrateMockState()
    store.consumeEvents()

    let guard = 0
    while (store.handState.toActSeat !== HERO_SEAT && guard < 8) {
      guard += 1
      vi.advanceTimersByTime(700)
      store.consumeEvents()
    }

    expect(store.handState.toActSeat).toBe(HERO_SEAT)
    expect(store.tableView.legalActions.canRaise).toBe(true)

    const minRaiseTo = store.tableView.legalActions.minRaiseTo

    store.heroRaise(minRaiseTo - 5000)

    const hero = store.handState.players.find((player) => player.seat === HERO_SEAT)
    expect(hero?.streetCommit).toBe(minRaiseTo)
  })

  it('applies hero all-in when legal', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const store = useTableStore()
    store.hydrateMockState()
    store.consumeEvents()

    let guard = 0
    while (store.handState.toActSeat !== HERO_SEAT && guard < 8) {
      guard += 1
      vi.advanceTimersByTime(700)
      store.consumeEvents()
    }

    expect(store.handState.toActSeat).toBe(HERO_SEAT)
    expect(store.tableView.legalActions.canAllIn).toBe(true)

    const heroBefore = store.handState.players.find((player) => player.seat === HERO_SEAT)
    const allInTo = store.tableView.legalActions.allInTo

    store.heroAllIn()

    const heroAfter = store.handState.players.find((player) => player.seat === HERO_SEAT)
    expect(heroBefore).toBeTruthy()
    expect(heroAfter).toBeTruthy()
    expect(heroAfter?.streetCommit).toBe(allInTo)
    expect(heroAfter?.stack).toBe(0)

    const batch = store.consumeEvents()
    const allInEvent = batch.find(
      (event) =>
        event.type === 'ACTION_APPLIED' &&
        event.seat === HERO_SEAT &&
        event.action === 'ALL_IN',
    )
    expect(allInEvent).toBeTruthy()
  })

  it('ignores hero all-in when it is not hero turn', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const store = useTableStore()
    store.hydrateMockState()
    store.consumeEvents()

    expect(store.handState.toActSeat).not.toBe(HERO_SEAT)
    const before = structuredClone(store.handState)

    store.heroAllIn()

    expect(store.handState).toEqual(before)
    expect(store.events).toHaveLength(0)
  })
})
