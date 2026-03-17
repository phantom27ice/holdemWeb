import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTableStore } from '../tableStore'

describe('tableStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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
})
