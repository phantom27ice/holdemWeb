<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import TableShell from "./TableShell.vue";
import PotBar from "./PotBar.vue";
import BoardCards from "./BoardCards.vue";
import HoleCards from "./HoleCards.vue";
import SeatView from "./SeatView.vue";
import ActionPanel from "./ActionPanel.vue";
import ChipFlyLayer from "./ChipFlyLayer.vue";
import DealCardLayer from "./DealCardLayer.vue";
import { useTableStore } from "../../stores/tableStore";
import {
  resolvePokerBack,
  resolvePokerCard,
} from "../../game/assets/resourceResolver";
import type { Card, EngineError, GameEvent, Street } from "../../game/types";

type ActionAppliedType = "CHECK" | "CALL" | "FOLD" | "BET" | "RAISE" | "ALL_IN";
type ChipFlight = {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  amount: number;
  kind: "to-pot" | "to-seat";
};
type DealFlight = {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delayMs: number;
  durationMs: number;
  rotateDeg: number;
  kind: "hole" | "board" | "burn";
  backUrl: string;
  frontUrl?: string;
  flipAtEnd?: boolean;
};

const DEAL_DECK_POINT = { x: 50, y: 50 };
const DEAL_HOLE_GAP_MS = 80;
const DEAL_HOLE_DURATION_MS = 260;
const DEAL_BURN_DURATION_MS = 170;
const DEAL_BOARD_GAP_MS = 70;
const DEAL_BOARD_DURATION_MS = 250;
const DEAL_LAYOUT_WAIT_MAX_FRAMES = 12;

const tableStore = useTableStore();
const { handState, tableView, turnTempo, events, lastEngineError } =
  storeToRefs(tableStore);
const { heroFold, heroCallOrCheck, heroRaise, heroAllIn, consumeEvents } =
  tableStore;

onMounted(() => {
  actionToast.value = "点击任意位置开始游戏";
  window.addEventListener("pointerdown", bootstrapFromInteraction, {
    once: true,
  });
  window.addEventListener("keydown", bootstrapFromInteraction, { once: true });
});

const seatAnchors: Record<number, { x: number; y: number }> = {
  0: { x: 0.0, y: 0.79 },
  1: { x: -0.9, y: 0.46 },
  2: { x: -0.9, y: -0.42 },
  3: { x: 0.0, y: -0.8 },
  4: { x: 0.9, y: -0.42 },
  5: { x: 0.9, y: 0.46 },
};

const heroSeat = computed(() =>
  tableView.value.seats.find((seat) => seat.isHero),
);
const opponents = computed(() =>
  tableView.value.seats.filter((seat) => !seat.isHero),
);
const seatActionHints = ref<Record<number, string>>({});
const actionToast = ref<string | null>(null);
const boardAnimationKey = ref(0);
const potAnimationKey = ref(0);
const chipFlights = ref<ChipFlight[]>([]);
const dealFlights = ref<DealFlight[]>([]);
const holeCardsLocked = ref(true);
const activeHoleDealCount = ref(0);
const pendingBoardDeals = ref<Array<{ street: Street; cards: Card[] }>>([]);
const animationLocked = computed(
  () => dealFlights.value.length > 0 || chipFlights.value.length > 0,
);
const isHeroTurn = computed(() => {
  const hero = heroSeat.value;
  if (!hero) {
    return false;
  }

  const tempo = turnTempo.value;
  return tempo.isRunning && tempo.actorSeat === hero.seat;
});
const actionLocked = computed(() => animationLocked.value || !isHeroTurn.value);
const turnPromptText = computed(() => {
  const tempo = turnTempo.value;
  if (!tempo.isRunning || tempo.actorSeat < 0) {
    return null;
  }

  const seconds = Math.max(0, Math.ceil(tempo.remainingMs / 1000));
  const seatName = getSeatName(tempo.actorSeat);
  const suffix =
    tempo.actorSeat === tableView.value.heroSeat ? "请你行动" : "行动中";
  return `轮到 ${seatName}${suffix} · ${seconds}s`;
});

const seatHintTimers = new Map<number, number>();
const pendingHoleDeals = new Map<number, number>();
let actionToastTimer: number | null = null;
let chipFlightSeq = 0;
let dealFlightSeq = 0;
let dealBusyUntilMs = 0;
let dealAudioCtx: AudioContext | null = null;
let audioUnlocked = false;
let holeDealRafId: number | null = null;
let boardDealRafId: number | null = null;
let hasBootstrapped = false;

watch(
  () => events.value.length,
  (current) => {
    if (current <= 0) {
      return;
    }

    const batch = consumeEvents();
    for (const item of batch) {
      applyEventFeedback(item);
    }

    schedulePendingDealFlush();
  },
);

watch(
  () => lastEngineError.value,
  (error) => {
    if (!error) {
      return;
    }

    showToast(formatEngineError(error));
  },
);

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", bootstrapFromInteraction);
  window.removeEventListener("keydown", bootstrapFromInteraction);

  for (const timer of seatHintTimers.values()) {
    window.clearTimeout(timer);
  }

  if (actionToastTimer !== null) {
    window.clearTimeout(actionToastTimer);
  }

  chipFlights.value = [];
  dealFlights.value = [];
  pendingHoleDeals.clear();
  pendingBoardDeals.value = [];
  dealBusyUntilMs = 0;
  activeHoleDealCount.value = 0;
  holeCardsLocked.value = false;
  clearPendingDealRaf();

  if (dealAudioCtx) {
    void dealAudioCtx.close();
    dealAudioCtx = null;
  }
  audioUnlocked = false;
  hasBootstrapped = false;
});

function getSeatStyle(seat: number): Record<string, string> {
  const anchor = seatAnchors[seat] ?? { x: 0, y: 0 };

  return {
    left: `${50 + anchor.x * 42}%`,
    top: `${50 + anchor.y * 40}%`,
    transform: "translate(-50%, -50%)",
  };
}

function getSeatTurnSeconds(seat: number): number | null {
  const tempo = turnTempo.value;
  if (!tempo.isRunning || tempo.actorSeat !== seat) {
    return null;
  }

  return Math.max(0, Math.ceil(tempo.remainingMs / 1000));
}

function getSeatTurnLabel(seat: number): string | null {
  const tempo = turnTempo.value;
  if (!tempo.isRunning || tempo.actorSeat !== seat) {
    return null;
  }

  return "行动中";
}

function applyEventFeedback(event: GameEvent): void {
  if (event.type === "HAND_STARTED") {
    pendingHoleDeals.clear();
    pendingBoardDeals.value = [];
    dealFlights.value = [];
    dealBusyUntilMs = 0;
    activeHoleDealCount.value = 0;
    holeCardsLocked.value = true;
    clearPendingDealRaf();
    return;
  }

  if (event.type === "CARDS_DEALT") {
    pendingHoleDeals.set(event.seat, event.count);
    return;
  }

  if (event.type === "ACTION_APPLIED") {
    const label = formatActionLabel(
      event.action as ActionAppliedType,
      event.amount,
    );
    setSeatActionHint(event.seat, label);
    showToast(`${getSeatName(event.seat)} ${label}`);

    if (event.amount > 0) {
      const from = toSeatPoint(event.seat);
      queueChipFlight({
        fromX: from.x,
        fromY: from.y,
        toX: 50,
        toY: 50,
        amount: event.amount,
        kind: "to-pot",
      });
    }

    if (
      event.amount > 0 ||
      event.action === "BET" ||
      event.action === "RAISE"
    ) {
      potAnimationKey.value += 1;
    }
    return;
  }

  if (event.type === "TURN_TIMEOUT") {
    const actionText = event.fallback === "CHECK" ? "过牌" : "弃牌";
    showToast(`${getSeatName(event.seat)} 超时自动${actionText}`);
    return;
  }

  if (event.type === "BOARD_DEALT") {
    pendingBoardDeals.value.push({
      street: event.street,
      cards: [...event.cards],
    });
    boardAnimationKey.value += 1;
    showToast(
      event.street === "FLOP"
        ? "翻牌圈发牌"
        : event.street === "TURN"
          ? "转牌发牌"
          : "河牌发牌",
    );
    return;
  }

  if (event.type === "POT_AWARDED") {
    potAnimationKey.value += 1;
    showToast(`派奖 ${event.amount}`);

    const perWinner = Math.max(
      1,
      Math.floor(event.amount / Math.max(1, event.winners.length)),
    );
    for (const seat of event.winners) {
      const to = toSeatPoint(seat);
      queueChipFlight({
        fromX: 50,
        fromY: 50,
        toX: to.x,
        toY: to.y,
        amount: perWinner,
        kind: "to-seat",
      });
    }
  }
}

function schedulePendingDealFlush(): void {
  if (pendingHoleDeals.size > 0 && holeDealRafId === null) {
    holeDealRafId = window.requestAnimationFrame(() => {
      holeDealRafId = null;
      flushPendingHoleDealTimeline();
    });
  }

  if (pendingBoardDeals.value.length > 0 && boardDealRafId === null) {
    boardDealRafId = window.requestAnimationFrame(() => {
      boardDealRafId = null;
      flushPendingBoardDealTimeline();
    });
  }
}

function clearPendingDealRaf(): void {
  if (holeDealRafId !== null) {
    window.cancelAnimationFrame(holeDealRafId);
    holeDealRafId = null;
  }

  if (boardDealRafId !== null) {
    window.cancelAnimationFrame(boardDealRafId);
    boardDealRafId = null;
  }
}

function flushPendingHoleDealTimeline(waitedFrames = 0): void {
  if (pendingHoleDeals.size === 0) {
    return;
  }

  if (!isTableLayoutReady() && waitedFrames < DEAL_LAYOUT_WAIT_MAX_FRAMES) {
    holeDealRafId = window.requestAnimationFrame(() => {
      holeDealRafId = null;
      flushPendingHoleDealTimeline(waitedFrames + 1);
    });
    return;
  }

  const orderedSeats = buildDealOrder([...pendingHoleDeals.keys()]);
  if (orderedSeats.length === 0) {
    pendingHoleDeals.clear();
    return;
  }

  const startDelayMs = getDealStartDelay();
  const heroSecondCard = getHeroCardFrontUrl(1);
  const backUrl = resolvePokerBack();
  let step = 0;

  for (let round = 0; round < 2; round += 1) {
    for (const seat of orderedSeats) {
      const count = pendingHoleDeals.get(seat) ?? 0;
      if (count <= round) {
        continue;
      }

      const target = toSeatCardPoint(seat, round);
      const isHeroSecondCard =
        seat === tableView.value.heroSeat && round === 1 && !!heroSecondCard;

      queueDealFlight({
        fromX: DEAL_DECK_POINT.x,
        fromY: DEAL_DECK_POINT.y,
        toX: target.x,
        toY: target.y,
        delayMs: startDelayMs + step * DEAL_HOLE_GAP_MS,
        durationMs: DEAL_HOLE_DURATION_MS,
        rotateDeg: randomDealRotation(),
        kind: "hole",
        backUrl,
        frontUrl: isHeroSecondCard ? heroSecondCard : undefined,
        flipAtEnd: isHeroSecondCard,
      });
      step += 1;
    }
  }

  if (step > 0) {
    const endMs =
      startDelayMs + (step - 1) * DEAL_HOLE_GAP_MS + DEAL_HOLE_DURATION_MS;
    activeHoleDealCount.value += step;
    holeCardsLocked.value = true;
    commitDealBusyWindow(endMs);
    showToast("发手牌");
  } else {
    holeCardsLocked.value = false;
  }

  pendingHoleDeals.clear();
}

function flushPendingBoardDealTimeline(waitedFrames = 0): void {
  if (pendingBoardDeals.value.length === 0) {
    return;
  }

  if (!isTableLayoutReady() && waitedFrames < DEAL_LAYOUT_WAIT_MAX_FRAMES) {
    boardDealRafId = window.requestAnimationFrame(() => {
      boardDealRafId = null;
      flushPendingBoardDealTimeline(waitedFrames + 1);
    });
    return;
  }

  const queued = [...pendingBoardDeals.value];
  pendingBoardDeals.value = [];

  for (const deal of queued) {
    queueBoardDealTimeline(deal.street, deal.cards);
  }
}

function queueBoardDealTimeline(street: Street, cards: Card[]): void {
  if (cards.length === 0) {
    return;
  }

  const startDelayMs = getDealStartDelay();
  const backUrl = resolvePokerBack();
  const burnTarget = getBurnPoint();

  queueDealFlight({
    fromX: DEAL_DECK_POINT.x,
    fromY: DEAL_DECK_POINT.y,
    toX: burnTarget.x,
    toY: burnTarget.y,
    delayMs: startDelayMs,
    durationMs: DEAL_BURN_DURATION_MS,
    rotateDeg: randomDealRotation(),
    kind: "burn",
    backUrl,
  });

  const boardStartIndex = street === "FLOP" ? 0 : street === "TURN" ? 3 : 4;
  let cardStep = 0;

  for (const [offset, card] of cards.entries()) {
    const boardIndex = boardStartIndex + offset;
    const target =
      getBoardSlotPoint(boardIndex) ?? getBoardFallbackPoint(boardIndex);

    queueDealFlight({
      fromX: DEAL_DECK_POINT.x,
      fromY: DEAL_DECK_POINT.y,
      toX: target.x,
      toY: target.y,
      delayMs: startDelayMs + 110 + cardStep * DEAL_BOARD_GAP_MS,
      durationMs: DEAL_BOARD_DURATION_MS,
      rotateDeg: randomDealRotation(),
      kind: "board",
      backUrl,
      frontUrl: resolvePokerCard(card),
    });
    cardStep += 1;
  }

  const burnEnd = startDelayMs + DEAL_BURN_DURATION_MS;
  const boardEnd =
    startDelayMs +
    110 +
    Math.max(0, cardStep - 1) * DEAL_BOARD_GAP_MS +
    DEAL_BOARD_DURATION_MS;

  commitDealBusyWindow(Math.max(burnEnd, boardEnd));
}

function queueDealFlight(input: Omit<DealFlight, "id">): void {
  dealFlights.value.push({
    id: `d-${Date.now()}-${dealFlightSeq++}`,
    ...input,
  });
}

function onDealFlightDone(id: string): void {
  const matched = dealFlights.value.find((flight) => flight.id === id);
  dealFlights.value = dealFlights.value.filter((flight) => flight.id !== id);

  if (matched?.kind === "hole") {
    activeHoleDealCount.value = Math.max(0, activeHoleDealCount.value - 1);
    if (activeHoleDealCount.value === 0) {
      holeCardsLocked.value = false;
    }
  }
}

function getDealStartDelay(): number {
  return Math.max(0, dealBusyUntilMs - performance.now());
}

function commitDealBusyWindow(endAfterNowMs: number): void {
  dealBusyUntilMs = Math.max(
    dealBusyUntilMs,
    performance.now() + endAfterNowMs,
  );
}

function buildDealOrder(seats: number[]): number[] {
  const ordered = [...new Set(seats)].sort((a, b) => a - b);
  if (ordered.length === 0) {
    return [];
  }

  const dealerSeat = handState.value.dealerSeat;
  const first = ordered.find((seat) => seat > dealerSeat) ?? ordered[0];
  const startIndex = ordered.indexOf(first);

  return [...ordered.slice(startIndex), ...ordered.slice(0, startIndex)];
}

function toSeatCardPoint(
  seat: number,
  round: number,
): { x: number; y: number } {
  const anchor = seatAnchors[seat] ?? { x: 0, y: 0 };
  const seatPoint = toSeatPoint(seat);
  const heroSeatId = tableView.value.heroSeat;

  if (seat === heroSeatId) {
    return clampPoint({
      x: seatPoint.x + (round === 0 ? -2.8 : 2.8),
      y: seatPoint.y + 10.8,
    });
  }

  if (anchor.x < -0.4) {
    return clampPoint({
      x: seatPoint.x + 8 + round * 2.2,
      y: seatPoint.y - 1.8,
    });
  }

  if (anchor.x > 0.4) {
    return clampPoint({
      x: seatPoint.x - 8 - round * 2.2,
      y: seatPoint.y - 1.8,
    });
  }

  return clampPoint({
    x: seatPoint.x + 5 + round * 2.2,
    y: seatPoint.y - 2.4,
  });
}

function getBoardSlotPoint(index: number): { x: number; y: number } | null {
  const shellRect = getTableShellRect();
  if (!shellRect) {
    return null;
  }

  const slots = document.querySelectorAll<HTMLElement>(".board-slot");
  const slot = slots[index];
  if (!slot) {
    return null;
  }

  const slotRect = slot.getBoundingClientRect();
  return clampPoint({
    x:
      ((slotRect.left + slotRect.width / 2 - shellRect.left) /
        shellRect.width) *
      100,
    y:
      ((slotRect.top + slotRect.height / 2 - shellRect.top) /
        shellRect.height) *
      100,
  });
}

function getBoardFallbackPoint(index: number): { x: number; y: number } {
  return {
    x: 37.8 + index * 6.1,
    y: 46.1,
  };
}

function getBurnPoint(): { x: number; y: number } {
  const firstBoardPoint = getBoardSlotPoint(0) ?? getBoardFallbackPoint(0);
  return clampPoint({
    x: firstBoardPoint.x - 4.6,
    y: firstBoardPoint.y - 1.6,
  });
}

function getHeroCardFrontUrl(index: number): string | undefined {
  const hero = heroSeat.value;
  if (!hero || hero.cards.length <= index) {
    return undefined;
  }

  return hero.cards[index];
}

function getTableShellRect(): DOMRect | null {
  const shell = document.querySelector<HTMLElement>(".table-shell");
  return shell?.getBoundingClientRect() ?? null;
}

function isTableLayoutReady(): boolean {
  const shellRect = getTableShellRect();
  return !!shellRect && shellRect.width > 0 && shellRect.height > 0;
}

function clampPoint(point: { x: number; y: number }): { x: number; y: number } {
  return {
    x: Math.min(98, Math.max(2, point.x)),
    y: Math.min(98, Math.max(2, point.y)),
  };
}

function randomDealRotation(): number {
  return Math.random() * 16 - 8;
}

function bootstrapFromInteraction(): void {
  if (hasBootstrapped) {
    return;
  }

  hasBootstrapped = true;
  onAudioUnlock();
  tableStore.hydrateMockState();
}

function onAudioUnlock(): void {
  audioUnlocked = true;
  void resumeDealAudio();
}

async function resumeDealAudio(): Promise<void> {
  const context = ensureDealAudioContext();
  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      // Ignore resume errors caused by autoplay policy.
    }
  }
}

function ensureDealAudioContext(): AudioContext | null {
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtor) {
    return null;
  }

  if (!dealAudioCtx) {
    dealAudioCtx = new AudioCtor();
  }

  return dealAudioCtx;
}

function onDealFlightStart(kind: DealFlight["kind"]): void {
  playDealSound(kind);
}

function playDealSound(kind: DealFlight["kind"]): void {
  if (!audioUnlocked) {
    return;
  }

  const context = ensureDealAudioContext();
  if (!context || context.state !== "running") {
    return;
  }

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const filter = context.createBiquadFilter();

  filter.type = "highpass";
  filter.frequency.value = 240;

  oscillator.type = kind === "burn" ? "triangle" : "square";
  oscillator.frequency.value =
    kind === "burn" ? 460 : kind === "board" ? 760 : 680;

  const peak = kind === "burn" ? 0.019 : 0.027;
  const decay = kind === "burn" ? 0.06 : 0.05;

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(peak, now + 0.005);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay);

  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(now);
  oscillator.stop(now + decay + 0.01);
}

function setSeatActionHint(seat: number, text: string): void {
  seatActionHints.value = {
    ...seatActionHints.value,
    [seat]: text,
  };

  const existing = seatHintTimers.get(seat);
  if (existing !== undefined) {
    window.clearTimeout(existing);
  }

  const timer = window.setTimeout(() => {
    const next = { ...seatActionHints.value };
    delete next[seat];
    seatActionHints.value = next;
    seatHintTimers.delete(seat);
  }, 1300);

  seatHintTimers.set(seat, timer);
}

function showToast(message: string): void {
  actionToast.value = message;

  if (actionToastTimer !== null) {
    window.clearTimeout(actionToastTimer);
  }

  actionToastTimer = window.setTimeout(() => {
    actionToast.value = null;
    actionToastTimer = null;
  }, 1500);
}

function queueChipFlight(input: Omit<ChipFlight, "id">): void {
  chipFlights.value.push({
    id: `f-${Date.now()}-${chipFlightSeq++}`,
    ...input,
  });
}

function onChipFlightDone(id: string): void {
  chipFlights.value = chipFlights.value.filter((flight) => flight.id !== id);
}

function toSeatPoint(seat: number): { x: number; y: number } {
  const anchor = seatAnchors[seat] ?? { x: 0, y: 0 };
  return {
    x: 50 + anchor.x * 42,
    y: 50 + anchor.y * 40,
  };
}

function getSeatName(seat: number): string {
  return (
    tableView.value.seats.find((item) => item.seat === seat)?.name ??
    `Seat ${seat}`
  );
}

function formatActionLabel(action: ActionAppliedType, amount: number): string {
  switch (action) {
    case "FOLD":
      return "弃牌";
    case "CHECK":
      return "过牌";
    case "CALL":
      return amount > 0 ? `跟注 ${amount}` : "跟注";
    case "BET":
      return amount > 0 ? `下注 ${amount}` : "下注";
    case "RAISE":
      return amount > 0 ? `加注 ${amount}` : "加注";
    case "ALL_IN":
      return amount > 0 ? `全下 ${amount}` : "全下";
    default:
      return "行动";
  }
}

function formatEngineError(error: EngineError): string {
  switch (error.code) {
    case "NOT_ACTOR_TURN":
      return "未轮到当前玩家行动";
    case "INVALID_AMOUNT":
      return "下注金额非法";
    case "ILLEGAL_ACTION":
      return "当前动作不合法";
    case "INVALID_PHASE":
      return "当前阶段不可执行该动作";
    case "INVARIANT_VIOLATION":
      return `状态校验失败: ${error.message}`;
    default:
      return error.message;
  }
}
</script>

<template>
  <section class="scene">
    <div class="table-stage">
      <TableShell>
        <div class="pot-bar-wrap">
          <PotBar :key="potAnimationKey" :amount="tableView.pot" />
        </div>

        <div class="board-wrap">
          <BoardCards :key="boardAnimationKey" :board="tableView.board" />
        </div>

        <p v-if="turnPromptText" class="turn-prompt">
          {{ turnPromptText }}
        </p>

        <div
          v-for="seat in opponents"
          :key="seat.seat"
          class="seat-layer"
          :style="getSeatStyle(seat.seat)"
        >
          <SeatView
            :seat="seat"
            :action-label="seatActionHints[seat.seat]"
            :turn-label="getSeatTurnLabel(seat.seat)"
            :hide-cards="holeCardsLocked"
            :turn-seconds="getSeatTurnSeconds(seat.seat)"
          />
        </div>

        <div
          v-if="heroSeat"
          class="hero-layer"
          :style="getSeatStyle(heroSeat.seat)"
        >
          <SeatView
            :seat="heroSeat"
            :action-label="seatActionHints[heroSeat.seat]"
            :turn-label="getSeatTurnLabel(heroSeat.seat)"
            :turn-seconds="getSeatTurnSeconds(heroSeat.seat)"
          />
          <HoleCards :cards="heroSeat.cards" :hidden="holeCardsLocked" />
        </div>

        <div class="deal-layer-wrap">
          <DealCardLayer
            :flights="dealFlights"
            @start="onDealFlightStart"
            @done="onDealFlightDone"
          />
        </div>

        <div class="chip-layer-wrap">
          <ChipFlyLayer :flights="chipFlights" @done="onChipFlightDone" />
        </div>
      </TableShell>

      <p v-if="lastEngineError" class="error-tip">
        {{ formatEngineError(lastEngineError) }}
      </p>

      <div class="actions-wrap">
        <ActionPanel
          :can-fold="tableView.legalActions.canFold"
          :can-check="tableView.legalActions.canCheck"
          :can-call="tableView.legalActions.canCall"
          :call-amount="tableView.legalActions.callAmount"
          :can-raise="tableView.legalActions.canRaise"
          :min-raise-to="tableView.legalActions.minRaiseTo"
          :max-raise-to="tableView.legalActions.maxRaiseTo"
          :can-all-in="tableView.legalActions.canAllIn"
          :all-in-to="tableView.legalActions.allInTo"
          :pot-amount="tableView.pot"
          :hero-street-commit="heroSeat?.bet ?? 0"
          :locked="actionLocked"
          @fold="heroFold"
          @call-check="heroCallOrCheck"
          @raise="heroRaise"
          @all-in="heroAllIn"
          @hint="showToast"
        />
      </div>

      <transition name="toast-fade">
        <p v-if="actionToast" class="action-toast">{{ actionToast }}</p>
      </transition>
    </div>
  </section>
</template>

<style scoped>
.scene {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background:
    radial-gradient(
      circle at 16% 18%,
      rgba(81, 90, 117, 0.28),
      transparent 44%
    ),
    radial-gradient(circle at 80% 82%, rgba(32, 36, 52, 0.48), transparent 46%),
    linear-gradient(180deg, #181c2a 0%, #0f121d 60%, #0b0e16 100%);
  padding: 1rem;
  box-sizing: border-box;
}

.table-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pot-bar-wrap {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -260%);
  z-index: 26;
}

.board-wrap {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -54%);
}

.turn-prompt {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -150%);
  margin: 0;
  padding: 0.18rem 0.56rem;
  border-radius: 999px;
  border: 1px solid rgba(126, 211, 171, 0.78);
  background: rgba(5, 11, 14, 0.88);
  color: #8ef3cb;
  font-size: 0.7rem;
  letter-spacing: 0.01em;
  white-space: nowrap;
  z-index: 28;
}

.seat-layer,
.hero-layer {
  position: absolute;
}

.hero-layer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.actions-wrap {
  margin-top: 0.35rem;
}

.hero-layer :deep(.hole-cards) {
  transform: translateY(-0.2rem);
}

.deal-layer-wrap {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 32;
}

.chip-layer-wrap {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 30;
}

.error-tip {
  margin: 0.2rem 0 0;
  color: #ffd8a8;
  background: rgba(71, 24, 13, 0.8);
  border: 1px solid rgba(235, 145, 113, 0.7);
  border-radius: 0.3rem;
  padding: 0.22rem 0.52rem;
  font-size: 0.72rem;
  line-height: 1.2;
}

.action-toast {
  position: absolute;
  top: 0.55rem;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 0.26rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(233, 203, 124, 0.74);
  background: rgba(5, 8, 14, 0.88);
  color: #f6ddad;
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  z-index: 40;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.16s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .pot-bar-wrap {
    transform: translate(-50%, -230%);
  }

  .hero-layer {
    gap: 0.24rem;
  }

  .hero-layer :deep(.hole-cards) {
    transform: translateY(-0.95rem);
  }

  .actions-wrap {
    margin-top: 1.45rem;
  }

  .action-toast {
    top: 0.4rem;
    font-size: 0.68rem;
  }

  .turn-prompt {
    transform: translate(-50%, -142%);
    font-size: 0.66rem;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .pot-bar-wrap {
    transform: translate(-50%, -245%);
  }

  .hero-layer {
    gap: 0.3rem;
  }

  .hero-layer :deep(.hole-cards) {
    transform: translateY(-0.55rem);
  }

  .actions-wrap {
    margin-top: 1rem;
  }
}

@media (max-width: 480px) {
  .actions-wrap {
    margin-top: 1.85rem;
  }
}
</style>
