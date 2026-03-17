import type { Card } from '../types'

export type HandCategory =
  | 'ROYAL_FLUSH'
  | 'STRAIGHT_FLUSH'
  | 'FOUR_OF_A_KIND'
  | 'FULL_HOUSE'
  | 'FLUSH'
  | 'STRAIGHT'
  | 'THREE_OF_A_KIND'
  | 'TWO_PAIR'
  | 'ONE_PAIR'
  | 'HIGH_CARD'

export interface HandRank {
  category: HandCategory
  strength: number
  tiebreakers: number[]
}

export interface EvaluatedHand {
  rank: HandRank
  cards: Card[]
}

const CATEGORY_STRENGTH: Record<HandCategory, number> = {
  HIGH_CARD: 1,
  ONE_PAIR: 2,
  TWO_PAIR: 3,
  THREE_OF_A_KIND: 4,
  STRAIGHT: 5,
  FLUSH: 6,
  FULL_HOUSE: 7,
  FOUR_OF_A_KIND: 8,
  STRAIGHT_FLUSH: 9,
  ROYAL_FLUSH: 10,
}

export function evaluate7(cards: Card[]): EvaluatedHand {
  if (cards.length !== 7) {
    throw new Error(`evaluate7 expects exactly 7 cards, got ${cards.length}`)
  }

  const combinations = pickFiveFromSeven(cards)
  let best = evaluate5(combinations[0])
  let bestCards = combinations[0]

  for (let index = 1; index < combinations.length; index += 1) {
    const candidateCards = combinations[index]
    const candidateRank = evaluate5(candidateCards)
    if (compareRank(candidateRank, best) > 0) {
      best = candidateRank
      bestCards = candidateCards
    }
  }

  return {
    rank: best,
    cards: bestCards,
  }
}

export function compareRank(a: HandRank, b: HandRank): number {
  if (a.strength !== b.strength) {
    return a.strength > b.strength ? 1 : -1
  }

  const max = Math.max(a.tiebreakers.length, b.tiebreakers.length)
  for (let index = 0; index < max; index += 1) {
    const av = a.tiebreakers[index] ?? 0
    const bv = b.tiebreakers[index] ?? 0
    if (av !== bv) {
      return av > bv ? 1 : -1
    }
  }

  return 0
}

function evaluate5(cards: Card[]): HandRank {
  const ranks = cards.map((card) => card.rank)
  const counts = buildRankCount(ranks)
  const rankGroups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])

  const flush = cards.every((card) => card.suit === cards[0].suit)
  const straightHigh = detectStraightHigh(ranks)
  const sortedRanks = [...ranks].sort((a, b) => b - a)

  if (flush && straightHigh) {
    const hasTen = ranks.includes(10)
    if (straightHigh === 14 && hasTen) {
      return toRank('ROYAL_FLUSH', [14])
    }

    return toRank('STRAIGHT_FLUSH', [straightHigh])
  }

  if (rankGroups[0][1] === 4) {
    const four = rankGroups[0][0]
    const kicker = rankGroups.find((group) => group[1] === 1)?.[0] ?? 0
    return toRank('FOUR_OF_A_KIND', [four, kicker])
  }

  if (rankGroups[0][1] === 3 && rankGroups[1]?.[1] === 2) {
    return toRank('FULL_HOUSE', [rankGroups[0][0], rankGroups[1][0]])
  }

  if (flush) {
    return toRank('FLUSH', sortedRanks)
  }

  if (straightHigh) {
    return toRank('STRAIGHT', [straightHigh])
  }

  if (rankGroups[0][1] === 3) {
    const trip = rankGroups[0][0]
    const kickers = rankGroups
      .filter((group) => group[1] === 1)
      .map((group) => group[0])
      .sort((a, b) => b - a)

    return toRank('THREE_OF_A_KIND', [trip, ...kickers])
  }

  if (rankGroups[0][1] === 2 && rankGroups[1]?.[1] === 2) {
    const topPair = Math.max(rankGroups[0][0], rankGroups[1][0])
    const lowPair = Math.min(rankGroups[0][0], rankGroups[1][0])
    const kicker = rankGroups.find((group) => group[1] === 1)?.[0] ?? 0
    return toRank('TWO_PAIR', [topPair, lowPair, kicker])
  }

  if (rankGroups[0][1] === 2) {
    const pair = rankGroups[0][0]
    const kickers = rankGroups
      .filter((group) => group[1] === 1)
      .map((group) => group[0])
      .sort((a, b) => b - a)

    return toRank('ONE_PAIR', [pair, ...kickers])
  }

  return toRank('HIGH_CARD', sortedRanks)
}

function toRank(category: HandCategory, tiebreakers: number[]): HandRank {
  return {
    category,
    strength: CATEGORY_STRENGTH[category],
    tiebreakers,
  }
}

function buildRankCount(ranks: number[]): Map<number, number> {
  const map = new Map<number, number>()
  for (const rank of ranks) {
    map.set(rank, (map.get(rank) ?? 0) + 1)
  }
  return map
}

function detectStraightHigh(ranks: number[]): number | null {
  const unique = [...new Set(ranks)]

  for (let high = 14; high >= 5; high -= 1) {
    if (
      unique.includes(high) &&
      unique.includes(high - 1) &&
      unique.includes(high - 2) &&
      unique.includes(high - 3) &&
      unique.includes(high - 4)
    ) {
      return high
    }
  }

  // Wheel: A-2-3-4-5
  if (
    unique.includes(14) &&
    unique.includes(2) &&
    unique.includes(3) &&
    unique.includes(4) &&
    unique.includes(5)
  ) {
    return 5
  }

  return null
}

function pickFiveFromSeven(cards: Card[]): Card[][] {
  const result: Card[][] = []

  for (let a = 0; a < cards.length - 4; a += 1) {
    for (let b = a + 1; b < cards.length - 3; b += 1) {
      for (let c = b + 1; c < cards.length - 2; c += 1) {
        for (let d = c + 1; d < cards.length - 1; d += 1) {
          for (let e = d + 1; e < cards.length; e += 1) {
            result.push([cards[a], cards[b], cards[c], cards[d], cards[e]])
          }
        }
      }
    }
  }

  return result
}
