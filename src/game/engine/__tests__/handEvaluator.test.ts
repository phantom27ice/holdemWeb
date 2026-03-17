import { describe, expect, it } from 'vitest'
import { compareRank, evaluate7 } from '../handEvaluator'
import type { Card, Rank, Suit } from '../../types'

describe('handEvaluator', () => {
  it('detects all ten hand categories from 7 cards', () => {
    expect(
      evaluate7([
        c('Spade', 14),
        c('Spade', 13),
        c('Spade', 12),
        c('Spade', 11),
        c('Spade', 10),
        c('Heart', 2),
        c('Club', 3),
      ]).rank.category,
    ).toBe('ROYAL_FLUSH')

    expect(
      evaluate7([
        c('Heart', 9),
        c('Heart', 8),
        c('Heart', 7),
        c('Heart', 6),
        c('Heart', 5),
        c('Spade', 2),
        c('Club', 14),
      ]).rank.category,
    ).toBe('STRAIGHT_FLUSH')

    expect(
      evaluate7([
        c('Spade', 9),
        c('Heart', 9),
        c('Diamond', 9),
        c('Club', 9),
        c('Heart', 14),
        c('Spade', 13),
        c('Club', 2),
      ]).rank.category,
    ).toBe('FOUR_OF_A_KIND')

    expect(
      evaluate7([
        c('Spade', 8),
        c('Heart', 8),
        c('Diamond', 8),
        c('Club', 13),
        c('Heart', 13),
        c('Spade', 2),
        c('Club', 4),
      ]).rank.category,
    ).toBe('FULL_HOUSE')

    expect(
      evaluate7([
        c('Heart', 14),
        c('Heart', 12),
        c('Heart', 9),
        c('Heart', 6),
        c('Heart', 3),
        c('Spade', 13),
        c('Club', 2),
      ]).rank.category,
    ).toBe('FLUSH')

    expect(
      evaluate7([
        c('Spade', 14),
        c('Heart', 2),
        c('Diamond', 3),
        c('Club', 4),
        c('Spade', 5),
        c('Heart', 9),
        c('Diamond', 13),
      ]).rank.category,
    ).toBe('STRAIGHT')

    expect(
      evaluate7([
        c('Spade', 7),
        c('Heart', 7),
        c('Diamond', 7),
        c('Club', 14),
        c('Spade', 13),
        c('Heart', 4),
        c('Diamond', 2),
      ]).rank.category,
    ).toBe('THREE_OF_A_KIND')

    expect(
      evaluate7([
        c('Spade', 14),
        c('Heart', 14),
        c('Diamond', 13),
        c('Club', 13),
        c('Spade', 12),
        c('Heart', 9),
        c('Diamond', 3),
      ]).rank.category,
    ).toBe('TWO_PAIR')

    expect(
      evaluate7([
        c('Spade', 11),
        c('Heart', 11),
        c('Diamond', 14),
        c('Club', 13),
        c('Spade', 9),
        c('Heart', 6),
        c('Diamond', 2),
      ]).rank.category,
    ).toBe('ONE_PAIR')

    expect(
      evaluate7([
        c('Spade', 14),
        c('Heart', 13),
        c('Diamond', 10),
        c('Club', 8),
        c('Spade', 6),
        c('Heart', 4),
        c('Diamond', 2),
      ]).rank.category,
    ).toBe('HIGH_CARD')
  })

  it('compares same category hands by kicker correctly', () => {
    const handA = evaluate7([
      c('Spade', 14),
      c('Heart', 14),
      c('Diamond', 13),
      c('Club', 11),
      c('Spade', 9),
      c('Heart', 5),
      c('Diamond', 2),
    ])

    const handB = evaluate7([
      c('Spade', 14),
      c('Heart', 14),
      c('Diamond', 12),
      c('Club', 11),
      c('Spade', 9),
      c('Heart', 5),
      c('Diamond', 2),
    ])

    expect(compareRank(handA.rank, handB.rank)).toBe(1)
    expect(compareRank(handB.rank, handA.rank)).toBe(-1)
  })
})

function c(suit: Suit, rank: Rank): Card {
  return { suit, rank }
}
