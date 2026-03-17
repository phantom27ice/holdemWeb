<script setup lang="ts">
const emit = defineEmits<{
  fold: []
  callCheck: []
  raise: []
}>()

const props = withDefaults(
  defineProps<{
    canFold: boolean
    canCheck: boolean
    canCall: boolean
    callAmount: number
    canRaise: boolean
    minRaiseTo: number
    locked?: boolean
  }>(),
  {
    locked: false,
  },
)
</script>

<template>
  <div class="action-panel">
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
    <button class="action raise" :disabled="props.locked || !props.canRaise" @click="emit('raise')">
      加注 {{ props.minRaiseTo }}
    </button>
  </div>
</template>

<style scoped>
.action-panel {
  display: flex;
  gap: 0.45rem;
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

.action:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}
</style>
