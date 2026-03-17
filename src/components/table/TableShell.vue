<script setup lang="ts">
</script>

<template>
  <section class="table-shell">
    <div class="felt">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.table-shell {
  position: relative;
  width: min(94vw, 1200px);
  aspect-ratio: 16 / 9;
  margin: 0 auto;
  border-radius: 999px;
  padding: 1.6rem;
  background: linear-gradient(165deg, #8a5b2f 0%, #5a3618 48%, #2f1d0f 100%);
  box-shadow:
    inset 0 0 0 2px #241309,
    inset 0 0 0 7px #966735,
    0 16px 50px rgba(0, 0, 0, 0.58);
}

.felt {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background:
    radial-gradient(circle at 32% 24%, rgba(82, 187, 140, 0.34), transparent 56%),
    radial-gradient(circle at 70% 72%, rgba(32, 118, 85, 0.5), transparent 60%),
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.018) 0 2px, transparent 2px 5px),
    #20724f;
  box-shadow:
    inset 0 0 0 1px rgba(183, 247, 213, 0.3),
    inset 0 -18px 44px rgba(0, 0, 0, 0.27);
}
</style>
