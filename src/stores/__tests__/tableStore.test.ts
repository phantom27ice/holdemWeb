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
})
