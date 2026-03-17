<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'

interface QuickRaiseOption {
  key: string
  label: string
  requestedTo: number
  amountTo: number
  wasAdjusted: boolean
}

const emit = defineEmits<{
  fold: []
  callCheck: []
  raise: [amountTo: number]
  allIn: []
  hint: [message: string]
}>()

const props = withDefaults(
  defineProps<{
    canFold: boolean
    canCheck: boolean
    canCall: boolean
    callAmount: number
    canRaise: boolean
    minRaiseTo: number
    maxRaiseTo: number
    canAllIn: boolean
    allInTo: number
    potAmount: number
    heroStreetCommit: number
    locked?: boolean
  }>(),
  {
    locked: false,
  },
)

const raiseTo = shallowRef(0)

const canAdjustRaise = computed(
  () =>
    props.canRaise &&
    props.minRaiseTo > 0 &&
    props.maxRaiseTo >= props.minRaiseTo,
)
const raiseLabel = computed(() => (canAdjustRaise.value ? String(raiseTo.value) : '--'))
const allInLabel = computed(() =>
  props.allInTo > 0 ? `全下 ${props.allInTo}` : '全下',
)
const quickRaiseOptions = computed<QuickRaiseOption[]>(() => {
  if (!canAdjustRaise.value) {
    return []
  }

  const draft: Array<{ key: string; label: string; desiredTo: number }> = [
    { key: 'min', label: '最小', desiredTo: props.minRaiseTo },
    { key: 'half-pot', label: '1/2池', desiredTo: toPotBasedRaiseTo(0.5) },
    { key: 'two-third-pot', label: '2/3池', desiredTo: toPotBasedRaiseTo(2 / 3) },
    { key: 'pot', label: '底池', desiredTo: toPotBasedRaiseTo(1) },
    { key: 'all-in', label: '全下', desiredTo: props.allInTo || props.maxRaiseTo },
  ]

  return draft.map((item) => {
    const amountTo = clampRaiseTo(item.desiredTo)
    return {
      key: item.key,
      label: item.label,
      requestedTo: Math.trunc(item.desiredTo),
      amountTo,
      wasAdjusted: amountTo !== Math.trunc(item.desiredTo),
    }
  })
})

watch(
  () => [props.canRaise, props.minRaiseTo, props.maxRaiseTo],
  () => {
    if (!canAdjustRaise.value) {
      raiseTo.value = 0
      return
    }

    const preferred = raiseTo.value > 0 ? raiseTo.value : props.minRaiseTo
    raiseTo.value = clampRaiseTo(preferred)
  },
  { immediate: true },
)

function onRaiseRangeInput(event: Event): void {
  const target = event.target as HTMLInputElement
  raiseTo.value = clampRaiseTo(Number(target.value))
}

function onRaiseNumberInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const raw = Number(target.value)
  const clamped = clampRaiseTo(raw)
  raiseTo.value = clamped
  if (Number.isFinite(raw) && Math.trunc(raw) !== clamped) {
    emitClampHint(Math.trunc(raw), clamped)
  }
}

function onRaiseClick(): void {
  if (props.locked || !canAdjustRaise.value) {
    return
  }

  emit('raise', raiseTo.value)
}

function onQuickRaise(option: QuickRaiseOption): void {
  raiseTo.value = option.amountTo
  if (option.wasAdjusted) {
    emitClampHint(option.requestedTo, option.amountTo)
  }
}

function emitClampHint(fromAmount: number, toAmount: number): void {
  const fromText = Number.isFinite(fromAmount) ? `${fromAmount}` : '输入值'
  emit(
    'hint',
    `加注金额已从 ${fromText} 调整为 ${toAmount}（范围 ${props.minRaiseTo}-${props.maxRaiseTo}）`,
  )
}

function toPotBasedRaiseTo(ratio: number): number {
  const desiredAdditional = props.callAmount + Math.round(props.potAmount * ratio)
  return props.heroStreetCommit + desiredAdditional
}

function clampRaiseTo(value: number): number {
  const parsed = Number.isFinite(value) ? Math.trunc(value) : props.minRaiseTo
  if (parsed < props.minRaiseTo) {
    return props.minRaiseTo
  }

  if (parsed > props.maxRaiseTo) {
    return props.maxRaiseTo
  }

  return parsed
}
</script>

<template>
  <div class="action-panel">
    <div class="primary-row">
      <button class="action fold" :disabled="props.locked || !props.canFold" @click="emit('fold')">
        弃牌
      </button>
      <button
        class="action call"
        :disabled="props.locked || !(props.canCheck || props.canCall)"
        @click="emit('callCheck')"
      >
        {{ props.canCheck ? '过牌' : `跟注 ${props.callAmount}` }}
      </button>
      <button class="action raise" :disabled="props.locked || !canAdjustRaise" @click="onRaiseClick">
        加注到 {{ raiseLabel }}
      </button>
      <button class="action allin" :disabled="props.locked || !props.canAllIn" @click="emit('allIn')">
        {{ allInLabel }}
      </button>
    </div>

    <div v-if="canAdjustRaise" class="raise-controls">
      <input
        class="raise-slider"
        type="range"
        :min="props.minRaiseTo"
        :max="props.maxRaiseTo"
        :value="raiseTo"
        :disabled="props.locked"
        @input="onRaiseRangeInput"
      />
      <input
        class="raise-input"
        type="number"
        :min="props.minRaiseTo"
        :max="props.maxRaiseTo"
        :value="raiseTo"
        :disabled="props.locked"
        @input="onRaiseNumberInput"
      />
    </div>

    <div v-if="canAdjustRaise" class="quick-raise-row">
      <button
        v-for="option in quickRaiseOptions"
        :key="option.key"
        class="quick-raise-btn"
        :disabled="props.locked"
        @click="onQuickRaise(option)"
      >
        {{ option.label }} {{ option.amountTo }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.action-panel {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: min(560px, 100%);
}

.primary-row {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.raise-controls {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.quick-raise-row {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.action {
  border: 0;
  border-radius: 0.35rem;
  padding: 0.52rem 0.88rem;
  min-width: 90px;
  font-weight: 800;
  letter-spacing: 0.03em;
  font-size: 0.82rem;
  color: #1b150d;
  background: linear-gradient(180deg, #ffe8ac 0%, #c8a252 100%);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.28);
}

.action.fold {
  background: linear-gradient(180deg, #2a2a2a 0%, #0d0d0d 100%);
  color: #f6dd9f;
}

.action.allin {
  background: linear-gradient(180deg, #ffcf8e 0%, #c8702f 100%);
  color: #231207;
}

.action:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.raise-slider {
  flex: 1;
  min-width: 180px;
  accent-color: #c8a252;
}

.raise-input {
  width: 110px;
  border-radius: 0.35rem;
  border: 1px solid rgba(230, 201, 124, 0.68);
  background: rgba(11, 11, 15, 0.78);
  color: #f6dd9f;
  padding: 0.4rem 0.45rem;
  font-weight: 700;
}

.raise-input:disabled,
.raise-slider:disabled {
  opacity: 0.55;
}

.quick-raise-btn {
  border: 1px solid rgba(230, 201, 124, 0.58);
  border-radius: 0.35rem;
  background: rgba(13, 13, 18, 0.82);
  color: #f3dca4;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.24rem 0.42rem;
}

.quick-raise-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}
</style>
