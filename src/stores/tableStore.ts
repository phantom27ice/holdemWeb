import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { HandState } from '../game/types'
import { createMockHandState, toTableViewModel } from '../game/mock/createMockTableState'

export const useTableStore = defineStore('table', () => {
  const handState = ref<HandState>(createMockHandState())

  const tableView = computed(() => toTableViewModel(handState.value))

  function hydrateMockState(): void {
    handState.value = createMockHandState()
  }

  return {
    handState,
    tableView,
    hydrateMockState,
  }
})
