<script setup lang="ts">
interface DealFlight {
  id: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  delayMs: number
  durationMs: number
  rotateDeg: number
  kind: 'hole' | 'board' | 'burn'
  backUrl: string
  frontUrl?: string
  flipAtEnd?: boolean
}

const props = defineProps<{
  flights: DealFlight[]
}>()

const emit = defineEmits<{
  done: [id: string]
  start: [kind: DealFlight['kind']]
}>()

function toFlightStyle(flight: DealFlight): Record<string, string> {
  const midX = flight.fromX + (flight.toX - flight.fromX) * 0.52
  const midY = flight.fromY + (flight.toY - flight.fromY) * 0.5 - (flight.kind === 'burn' ? 0.8 : 1.45)
  return {
    '--from-x': `${flight.fromX}%`,
    '--from-y': `${flight.fromY}%`,
    '--mid-x': `${midX}%`,
    '--mid-y': `${midY}%`,
    '--to-x': `${flight.toX}%`,
    '--to-y': `${flight.toY}%`,
    '--delay': `${flight.delayMs}ms`,
    '--duration': `${flight.durationMs}ms`,
    '--rotate': `${flight.rotateDeg}deg`,
    '--flip-delay': `${Math.max(0, flight.delayMs + flight.durationMs - 120)}ms`,
  }
}

function onMoveEnd(id: string): void {
  emit('done', id)
}

function onMoveStart(kind: DealFlight['kind']): void {
  emit('start', kind)
}
</script>

<template>
  <div class="deal-layer">
    <div
      v-for="flight in props.flights"
      :key="flight.id"
      class="deal-flight"
      :class="`kind-${flight.kind}`"
      :style="toFlightStyle(flight)"
      @animationstart="onMoveStart(flight.kind)"
      @animationend="onMoveEnd(flight.id)"
    >
      <div v-if="flight.flipAtEnd && flight.frontUrl" class="card-flip">
        <img class="face back" :src="flight.backUrl" alt="deal card" />
        <img class="face front" :src="flight.frontUrl" alt="deal card" />
      </div>
      <img
        v-else
        class="card-face"
        :src="flight.frontUrl ?? flight.backUrl"
        alt="deal card"
      />
    </div>
  </div>
</template>

<style scoped>
.deal-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.deal-flight {
  position: absolute;
  left: var(--from-x, 50%);
  top: var(--from-y, 50%);
  width: clamp(20px, 4.1vw, 56px);
  aspect-ratio: 159 / 224;
  transform: translate(-50%, -50%) rotate(var(--rotate)) scale(0.9);
  animation: deal-move var(--duration) cubic-bezier(0.2, 0.8, 0.25, 1) var(--delay) forwards;
  transform-origin: center center;
  will-change: transform, opacity;
  opacity: 0;
}

.deal-flight.kind-burn {
  width: clamp(18px, 3.8vw, 48px);
  opacity: 0.9;
}

.card-face,
.face {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-radius: 0.26rem;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.34);
}

.card-flip {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  animation: card-flip 120ms linear var(--flip-delay) forwards;
}

.face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
}

.face.front {
  transform: rotateY(180deg);
}

@keyframes deal-move {
  0% {
    opacity: 0;
    left: var(--from-x, 50%);
    top: var(--from-y, 50%);
    transform: translate(-50%, -50%) rotate(var(--rotate)) scale(0.9);
  }
  12% {
    opacity: 1;
  }
  72% {
    opacity: 1;
    left: var(--mid-x, 50%);
    top: var(--mid-y, 49%);
    transform: translate(-50%, -50%) rotate(calc(var(--rotate) * 0.35)) scale(1.02);
  }
  88% {
    opacity: 1;
    left: var(--to-x, 50%);
    top: var(--to-y, 50%);
    transform: translate(-50%, -50%) rotate(0deg) scale(1);
  }
  100% {
    opacity: 0;
    left: var(--to-x, 50%);
    top: var(--to-y, 50%);
    transform: translate(-50%, -50%) rotate(0deg) scale(0.97);
  }
}

@keyframes card-flip {
  from {
    transform: rotateY(0deg);
  }
  to {
    transform: rotateY(180deg);
  }
}
</style>
