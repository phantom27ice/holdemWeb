<script setup lang="ts">
interface ShowdownRevealItem {
  seat: number
  name: string
  cards: string[]
  handLabel: string
}

interface ShowdownPotItem {
  id: string
  potIdLabel: string
  amount: number
  winnerNames: string
}

const props = withDefaults(
  defineProps<{
    visible?: boolean
    reveals: ShowdownRevealItem[]
    pots: ShowdownPotItem[]
    winnerSummary: string
  }>(),
  {
    visible: false,
  },
)
</script>

<template>
  <section v-if="props.visible" class="showdown-panel">
    <p class="title">摊牌结果</p>

    <p v-if="props.winnerSummary" class="winner-summary">
      {{ props.winnerSummary }}
    </p>

    <div v-if="props.reveals.length > 0" class="reveal-list">
      <article v-for="item in props.reveals" :key="item.seat" class="reveal-row">
        <p class="reveal-name">{{ item.name }}</p>
        <div class="reveal-cards">
          <img v-for="(card, index) in item.cards" :key="index" :src="card" alt="hole card" />
        </div>
        <p class="reveal-rank">{{ item.handLabel }}</p>
      </article>
    </div>

    <div v-if="props.pots.length > 0" class="pot-list">
      <p v-for="item in props.pots" :key="item.id" class="pot-row">
        {{ item.potIdLabel }}: {{ item.winnerNames }} +{{ item.amount }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.showdown-panel {
  width: min(430px, 82vw);
  border-radius: 0.72rem;
  border: 1px solid rgba(230, 201, 124, 0.56);
  background: rgba(6, 10, 18, 0.9);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
  color: #f7ddb0;
  padding: 0.82rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  backdrop-filter: blur(2px);
}

.title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 800;
  color: #ffe7ba;
  letter-spacing: 0.01em;
}

.winner-summary {
  margin: 0;
  font-size: 0.86rem;
  color: #8ff5cc;
  line-height: 1.28;
}

.reveal-list {
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
}

.reveal-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.42rem;
}

.reveal-name,
.reveal-rank,
.pot-row {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.22;
}

.reveal-name {
  color: #f8e7c2;
}

.reveal-rank {
  color: #9bf6d2;
  font-weight: 700;
  white-space: nowrap;
}

.reveal-cards {
  display: flex;
  gap: 0.2rem;
}

.reveal-cards img {
  width: 26px;
  aspect-ratio: 159 / 224;
  border-radius: 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.34);
}

.pot-list {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding-top: 0.3rem;
  border-top: 1px dashed rgba(225, 192, 114, 0.35);
}

.pot-row {
  color: #f2d299;
}

@media (max-width: 768px) {
  .showdown-panel {
    width: min(382px, 88vw);
    padding: 0.74rem 0.78rem;
    gap: 0.42rem;
  }

  .title {
    font-size: 0.92rem;
  }

  .winner-summary {
    font-size: 0.79rem;
  }

  .reveal-name,
  .reveal-rank,
  .pot-row {
    font-size: 0.74rem;
  }

  .reveal-cards img {
    width: 23px;
  }
}

@media (max-width: 480px) {
  .showdown-panel {
    width: min(336px, 92vw);
    padding: 0.66rem 0.68rem;
  }

  .reveal-cards img {
    width: 21px;
  }
}
</style>
