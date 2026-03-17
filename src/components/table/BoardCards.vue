<script setup lang="ts">
defineProps<{
  board: Array<string | null>
}>()
</script>

<template>
  <div class="board-cards">
    <div
      v-for="(card, index) in board"
      :key="index"
      class="board-slot"
      :class="{ 'is-empty': !card }"
    >
      <img v-if="card" :src="card" alt="board card" class="card" />
    </div>
  </div>
</template>

<style scoped>
.board-cards {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.65rem;
  width: min(45vw, 360px);
  animation: board-enter 0.2s ease-out;
}

.board-slot {
  aspect-ratio: 159 / 224;
  border-radius: 0.3rem;
  background: rgba(14, 44, 31, 0.32);
  border: 1px solid rgba(209, 238, 224, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
}

.board-slot.is-empty {
  border-style: dashed;
  opacity: 0.62;
}

.card {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@keyframes board-enter {
  from {
    opacity: 0.72;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
