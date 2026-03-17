<script setup lang="ts">
defineProps<{
  cards: string[]
}>()
</script>

<template>
  <div class="hole-cards">
    <img v-for="(card, index) in cards" :key="index" :src="card" alt="hole card" class="card" />
  </div>
</template>

<style scoped>
.hole-cards {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.card {
  width: min(10vw, 62px);
  aspect-ratio: 159 / 224;
  border-radius: 0.3rem;
  box-shadow: 0 10px 16px rgba(0, 0, 0, 0.35);
}
</style>
