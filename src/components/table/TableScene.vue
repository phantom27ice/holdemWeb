<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import TableShell from './TableShell.vue'
import PotBar from './PotBar.vue'
import BoardCards from './BoardCards.vue'
import HoleCards from './HoleCards.vue'
import SeatView from './SeatView.vue'
import ActionPanel from './ActionPanel.vue'
import { useTableStore } from '../../stores/tableStore'

const tableStore = useTableStore()
const { tableView } = storeToRefs(tableStore)
const { heroFold, heroCallOrCheck, heroRaise } = tableStore

onMounted(() => {
  tableStore.hydrateMockState()
})

const seatAnchors: Record<number, { x: number; y: number }> = {
  0: { x: 0.0, y: 0.79 },
  1: { x: -0.9, y: 0.46 },
  2: { x: -0.9, y: -0.42 },
  3: { x: 0.0, y: -0.8 },
  4: { x: 0.9, y: -0.42 },
  5: { x: 0.9, y: 0.46 },
}

const heroSeat = computed(() => tableView.value.seats.find((seat) => seat.isHero))
const opponents = computed(() => tableView.value.seats.filter((seat) => !seat.isHero))

function getSeatStyle(seat: number): Record<string, string> {
  const anchor = seatAnchors[seat] ?? { x: 0, y: 0 }

  return {
    left: `${50 + anchor.x * 42}%`,
    top: `${50 + anchor.y * 40}%`,
    transform: 'translate(-50%, -50%)',
  }
}
</script>

<template>
  <section class="scene">
    <div class="table-stage">
      <TableShell>
        <div class="pot-bar-wrap">
          <PotBar :amount="tableView.pot" />
        </div>

        <div class="board-wrap">
          <BoardCards :board="tableView.board" />
        </div>

        <div v-for="seat in opponents" :key="seat.seat" class="seat-layer" :style="getSeatStyle(seat.seat)">
          <SeatView :seat="seat" />
        </div>

        <div v-if="heroSeat" class="hero-layer" :style="getSeatStyle(heroSeat.seat)">
          <SeatView :seat="heroSeat" />
          <HoleCards :cards="heroSeat.cards" />
        </div>
      </TableShell>

      <div class="actions-wrap">
        <ActionPanel
          :can-fold="tableView.legalActions.canFold"
          :can-check="tableView.legalActions.canCheck"
          :can-call="tableView.legalActions.canCall"
          :call-amount="tableView.legalActions.callAmount"
          :can-raise="tableView.legalActions.canRaise"
          :min-raise-to="tableView.legalActions.minRaiseTo"
          @fold="heroFold"
          @call-check="heroCallOrCheck"
          @raise="heroRaise"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.scene {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 16% 18%, rgba(81, 90, 117, 0.28), transparent 44%),
    radial-gradient(circle at 80% 82%, rgba(32, 36, 52, 0.48), transparent 46%),
    linear-gradient(180deg, #181c2a 0%, #0f121d 60%, #0b0e16 100%);
  padding: 1rem;
  box-sizing: border-box;
}

.table-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pot-bar-wrap {
  position: absolute;
  top: -0.55rem;
  left: 50%;
  transform: translateX(-50%);
}

.board-wrap {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -54%);
}

.seat-layer,
.hero-layer {
  position: absolute;
}

.hero-layer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.actions-wrap {
  margin-top: 0.12rem;
}

@media (max-width: 768px) {
  .actions-wrap {
    margin-top: 0.2rem;
  }
}
</style>
