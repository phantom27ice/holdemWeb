<script setup lang="ts">
import { resolveChipIcon } from '../../game/assets/resourceResolver'

interface ChipFlight {
  id: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  amount: number
  kind: 'to-pot' | 'to-seat'
}

const props = defineProps<{
  flights: ChipFlight[]
}>()

const emit = defineEmits<{
  done: [id: string]
}>()

const chipIcon = resolveChipIcon()

function toFlightStyle(flight: ChipFlight): Record<string, string> {
  return {
    '--from-x': String(flight.fromX),
    '--from-y': String(flight.fromY),
    '--to-x': String(flight.toX),
    '--to-y': String(flight.toY),
  }
}

function onAnimationEnd(id: string): void {
  emit('done', id)
}
</script>

<template>
  <div class="chip-layer">
    <div
      v-for="flight in props.flights"
      :key="flight.id"
      class="chip-flight"
      :class="flight.kind"
      :style="toFlightStyle(flight)"
      @animationend="onAnimationEnd(flight.id)"
    >
      <img class="chip" :src="chipIcon" alt="chip" />
      <span class="amount">{{ flight.amount }}</span>
    </div>
  </div>
</template>

<style scoped>
.chip-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.chip-flight {
  position: absolute;
  left: 0;
  top: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.12rem;
  padding: 0.08rem 0.2rem;
  border-radius: 999px;
  border: 1px solid rgba(241, 210, 125, 0.72);
  background: rgba(8, 12, 18, 0.88);
  color: #f3dba6;
  font-size: 0.58rem;
  line-height: 1;
  white-space: nowrap;
  transform: translate(
    calc(var(--from-x) * 1%),
    calc(var(--from-y) * 1%)
  );
  animation: chip-fly 0.56s cubic-bezier(0.24, 0.76, 0.3, 1) forwards;
}

.chip-flight.to-seat {
  animation-duration: 0.62s;
}

.chip {
  width: 0.75rem;
  height: 0.75rem;
}

.amount {
  font-weight: 700;
}

@keyframes chip-fly {
  0% {
    opacity: 0.2;
    transform: translate(
      calc(var(--from-x) * 1%),
      calc(var(--from-y) * 1%)
    ) scale(0.86);
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(
      calc(var(--to-x) * 1%),
      calc(var(--to-y) * 1%)
    ) scale(0.96);
  }
}
</style>
