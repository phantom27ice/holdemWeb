<script setup lang="ts">
defineProps<{
  canFold: boolean
  canCheck: boolean
  canCall: boolean
  callAmount: number
  canRaise: boolean
  minRaiseTo: number
}>()
</script>

<template>
  <div class="action-panel">
    <button class="action fold" :disabled="!canFold">FOLD</button>
    <button class="action call" :disabled="!(canCheck || canCall)">
      {{ canCheck ? 'CHECK' : `CALL ${callAmount}` }}
    </button>
    <button class="action raise" :disabled="!canRaise">RAISE {{ minRaiseTo }}</button>
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
