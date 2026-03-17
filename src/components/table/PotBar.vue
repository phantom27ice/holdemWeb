<script setup lang="ts">
import { resolveChipIcon } from '../../game/assets/resourceResolver'

defineProps<{
  amount: number
}>()

const chipIcon = resolveChipIcon()
</script>

<template>
  <div class="pot-bar">
    <img class="chip-icon" :src="chipIcon" alt="pot" />
    <span class="pot-value">{{ amount }}</span>
  </div>
</template>

<style scoped>
.pot-bar {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 96px;
  justify-content: center;
  padding: 0.28rem 0.7rem;
  border: 1px solid #9f772e;
  border-radius: 0.35rem;
  background: linear-gradient(180deg, #18140f 0%, #060403 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.chip-icon {
  width: 1.4rem;
  height: 1.4rem;
}

.pot-value {
  color: #ecd48b;
  font-weight: 700;
  font-size: 1rem;
  line-height: 1;
}
</style>
