import type { Card, Rank, Suit } from '../types'

const SUITS: Suit[] = ['Spade', 'Heart', 'Diamond', 'Club']
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

export function createDeck(): Card[] {
  const deck: Card[] = []

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank })
    }
  }

  return deck
}
