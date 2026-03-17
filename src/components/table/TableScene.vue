<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import TableShell from './TableShell.vue'
import PotBar from './PotBar.vue'
import BoardCards from './BoardCards.vue'
import HoleCards from './HoleCards.vue'
import SeatView from './SeatView.vue'
import ActionPanel from './ActionPanel.vue'
import ChipFlyLayer from './ChipFlyLayer.vue'
import { useTableStore } from '../../stores/tableStore'
import type { EngineError, GameEvent } from '../../game/types'

type ActionAppliedType = 'CHECK' | 'CALL' | 'FOLD' | 'BET' | 'RAISE' | 'ALL_IN'
type ChipFlight = {
  id: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  amount: number
  kind: 'to-pot' | 'to-seat'
}

const tableStore = useTableStore()
const { tableView, events, lastEngineError } = storeToRefs(tableStore)
const { heroFold, heroCallOrCheck, heroRaise, consumeEvents } = tableStore

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
const seatActionHints = ref<Record<number, string>>({})
const actionToast = ref<string | null>(null)
const boardAnimationKey = ref(0)
const potAnimationKey = ref(0)
const chipFlights = ref<ChipFlight[]>([])

const seatHintTimers = new Map<number, number>()
let actionToastTimer: number | null = null
let chipFlightSeq = 0

watch(
  () => events.value.length,
  (current) => {
    if (current <= 0) {
      return
    }

    const batch = consumeEvents()
    for (const item of batch) {
      applyEventFeedback(item)
    }
  },
)

watch(
  () => lastEngineError.value,
  (error) => {
    if (!error) {
      return
    }

    showToast(formatEngineError(error))
  },
)

onBeforeUnmount(() => {
  for (const timer of seatHintTimers.values()) {
    window.clearTimeout(timer)
  }

  if (actionToastTimer !== null) {
    window.clearTimeout(actionToastTimer)
  }

  chipFlights.value = []
})

function getSeatStyle(seat: number): Record<string, string> {
  const anchor = seatAnchors[seat] ?? { x: 0, y: 0 }

  return {
    left: `${50 + anchor.x * 42}%`,
    top: `${50 + anchor.y * 40}%`,
    transform: 'translate(-50%, -50%)',
  }
}

function applyEventFeedback(event: GameEvent): void {
  if (event.type === 'ACTION_APPLIED') {
    const label = formatActionLabel(event.action as ActionAppliedType, event.amount)
    setSeatActionHint(event.seat, label)
    showToast(`${getSeatName(event.seat)} ${label}`)

    if (event.amount > 0) {
      const from = toSeatPoint(event.seat)
      queueChipFlight({
        fromX: from.x,
        fromY: from.y,
        toX: 50,
        toY: 50,
        amount: event.amount,
        kind: 'to-pot',
      })
    }

    if (event.amount > 0 || event.action === 'BET' || event.action === 'RAISE') {
      potAnimationKey.value += 1
    }
    return
  }

  if (event.type === 'BOARD_DEALT') {
    boardAnimationKey.value += 1
    showToast(
      event.street === 'FLOP'
        ? '翻牌圈发牌'
        : event.street === 'TURN'
          ? '转牌发牌'
          : '河牌发牌',
    )
    return
  }

  if (event.type === 'POT_AWARDED') {
    potAnimationKey.value += 1
    showToast(`派奖 ${event.amount}`)

    const perWinner = Math.max(1, Math.floor(event.amount / Math.max(1, event.winners.length)))
    for (const seat of event.winners) {
      const to = toSeatPoint(seat)
      queueChipFlight({
        fromX: 50,
        fromY: 50,
        toX: to.x,
        toY: to.y,
        amount: perWinner,
        kind: 'to-seat',
      })
    }
  }
}

function setSeatActionHint(seat: number, text: string): void {
  seatActionHints.value = {
    ...seatActionHints.value,
    [seat]: text,
  }

  const existing = seatHintTimers.get(seat)
  if (existing !== undefined) {
    window.clearTimeout(existing)
  }

  const timer = window.setTimeout(() => {
    const next = { ...seatActionHints.value }
    delete next[seat]
    seatActionHints.value = next
    seatHintTimers.delete(seat)
  }, 1300)

  seatHintTimers.set(seat, timer)
}

function showToast(message: string): void {
  actionToast.value = message

  if (actionToastTimer !== null) {
    window.clearTimeout(actionToastTimer)
  }

  actionToastTimer = window.setTimeout(() => {
    actionToast.value = null
    actionToastTimer = null
  }, 1500)
}

function queueChipFlight(input: Omit<ChipFlight, 'id'>): void {
  chipFlights.value.push({
    id: `f-${Date.now()}-${chipFlightSeq++}`,
    ...input,
  })
}

function onChipFlightDone(id: string): void {
  chipFlights.value = chipFlights.value.filter((flight) => flight.id !== id)
}

function toSeatPoint(seat: number): { x: number; y: number } {
  const anchor = seatAnchors[seat] ?? { x: 0, y: 0 }
  return {
    x: 50 + anchor.x * 42,
    y: 50 + anchor.y * 40,
  }
}

function getSeatName(seat: number): string {
  return tableView.value.seats.find((item) => item.seat === seat)?.name ?? `Seat ${seat}`
}

function formatActionLabel(action: ActionAppliedType, amount: number): string {
  switch (action) {
    case 'FOLD':
      return '弃牌'
    case 'CHECK':
      return '过牌'
    case 'CALL':
      return amount > 0 ? `跟注 ${amount}` : '跟注'
    case 'BET':
      return amount > 0 ? `下注 ${amount}` : '下注'
    case 'RAISE':
      return amount > 0 ? `加注 ${amount}` : '加注'
    case 'ALL_IN':
      return amount > 0 ? `全下 ${amount}` : '全下'
    default:
      return '行动'
  }
}

function formatEngineError(error: EngineError): string {
  switch (error.code) {
    case 'NOT_ACTOR_TURN':
      return '未轮到当前玩家行动'
    case 'INVALID_AMOUNT':
      return '下注金额非法'
    case 'ILLEGAL_ACTION':
      return '当前动作不合法'
    case 'INVALID_PHASE':
      return '当前阶段不可执行该动作'
    case 'INVARIANT_VIOLATION':
      return `状态校验失败: ${error.message}`
    default:
      return error.message
  }
}
</script>

<template>
  <section class="scene">
    <div class="table-stage">
      <TableShell>
        <div class="pot-bar-wrap">
          <PotBar :key="potAnimationKey" :amount="tableView.pot" />
        </div>

        <div class="board-wrap">
          <BoardCards :key="boardAnimationKey" :board="tableView.board" />
        </div>

        <div v-for="seat in opponents" :key="seat.seat" class="seat-layer" :style="getSeatStyle(seat.seat)">
          <SeatView :seat="seat" :action-label="seatActionHints[seat.seat]" />
        </div>

        <div v-if="heroSeat" class="hero-layer" :style="getSeatStyle(heroSeat.seat)">
          <SeatView :seat="heroSeat" :action-label="seatActionHints[heroSeat.seat]" />
          <HoleCards :cards="heroSeat.cards" />
        </div>

        <div class="chip-layer-wrap">
          <ChipFlyLayer :flights="chipFlights" @done="onChipFlightDone" />
        </div>
      </TableShell>

      <p v-if="lastEngineError" class="error-tip">{{ formatEngineError(lastEngineError) }}</p>

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

      <transition name="toast-fade">
        <p v-if="actionToast" class="action-toast">{{ actionToast }}</p>
      </transition>
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
  position: relative;
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

.chip-layer-wrap {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 30;
}

.error-tip {
  margin: 0.2rem 0 0;
  color: #ffd8a8;
  background: rgba(71, 24, 13, 0.8);
  border: 1px solid rgba(235, 145, 113, 0.7);
  border-radius: 0.3rem;
  padding: 0.22rem 0.52rem;
  font-size: 0.72rem;
  line-height: 1.2;
}

.action-toast {
  position: absolute;
  top: 0.55rem;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 0.26rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(233, 203, 124, 0.74);
  background: rgba(5, 8, 14, 0.88);
  color: #f6ddad;
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  z-index: 40;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.16s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .actions-wrap {
    margin-top: 0.2rem;
  }

  .action-toast {
    top: 0.4rem;
    font-size: 0.68rem;
  }
}
</style>
