<script setup lang="ts">
import { computed } from 'vue'
import { resolveSeatMarker } from '../../game/assets/resourceResolver'
import type { TableSeatViewModel } from '../../game/mock/createMockTableState'

const props = defineProps<{
  seat: TableSeatViewModel
}>()

const markerIcon = computed(() => {
  if (!props.seat.role) {
    return null
  }

  return resolveSeatMarker(props.seat.role)
})
</script>

<template>
  <article
    class="seat-view"
    :class="{
      'is-active': seat.isActive,
      'is-folded': seat.isFolded,
      'is-hero': seat.isHero,
      'is-allin': seat.isAllIn,
    }"
  >
    <div class="avatar-wrap">
      <img :src="seat.avatar" :alt="seat.name" class="avatar" />
      <img v-if="markerIcon" class="role" :src="markerIcon" :alt="seat.role ?? ''" />
    </div>

    <div class="meta">
      <p class="name">{{ seat.name }}</p>
      <p class="stack">{{ seat.stack }}</p>
      <p v-if="seat.bet > 0" class="bet">下注 {{ seat.bet }}</p>
    </div>

    <div class="cards" :class="{ hidden: seat.cardsFaceUp }">
      <img v-for="(card, index) in seat.cards" :key="index" :src="card" alt="card" />
    </div>
  </article>
</template>

<style scoped>
.seat-view {
  position: relative;
  width: clamp(80px, 9vw, 104px);
  transition: filter 0.2s ease;
}

.seat-view.is-active .avatar-wrap {
  box-shadow: 0 0 0 2px #efcf6e, 0 0 18px rgba(247, 209, 100, 0.55);
}

.seat-view.is-folded {
  filter: grayscale(1);
  opacity: 0.7;
}

.seat-view.is-allin .avatar-wrap {
  box-shadow: 0 0 0 2px #ff8559, 0 0 18px rgba(255, 85, 85, 0.6);
}

.avatar-wrap {
  position: relative;
  border-radius: 0.52rem;
  overflow: hidden;
  border: 1px solid rgba(255, 227, 143, 0.85);
  background: linear-gradient(180deg, #1d140c 0%, #080503 100%);
}

.avatar {
  width: 100%;
  display: block;
  aspect-ratio: 74 / 111;
  object-fit: cover;
}

.role {
  position: absolute;
  left: -0.28rem;
  top: -0.28rem;
  width: 1.25rem;
  height: 1.25rem;
}

.meta {
  margin-top: 0.22rem;
  background: linear-gradient(180deg, #fae6af 0%, #cfab59 100%);
  border-radius: 0.35rem;
  padding: 0.18rem 0.35rem;
  color: #281c0f;
  font-size: 0.68rem;
  text-align: center;
}

.name,
.stack,
.bet {
  margin: 0;
  line-height: 1.15;
}

.stack {
  font-weight: 700;
}

.bet {
  color: #852216;
}

.cards {
  position: absolute;
  top: 0.8rem;
  left: calc(100% + 0.35rem);
  display: flex;
  gap: 0.12rem;
}

.cards img {
  width: 20px;
  aspect-ratio: 159 / 224;
  border-radius: 0.18rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.cards.hidden {
  display: none;
}
</style>
