import { describe, expect, it } from 'vitest'
import { formatHandCategoryZh, formatPotIdZh } from '../showdownFormatter'

describe('showdownFormatter', () => {
  it('maps hand categories to Chinese labels', () => {
    expect(formatHandCategoryZh('ROYAL_FLUSH')).toBe('皇家同花顺')
    expect(formatHandCategoryZh('FOUR_OF_A_KIND')).toBe('四条')
    expect(formatHandCategoryZh('HIGH_CARD')).toBe('高牌')
  })

  it('formats pot ids for display', () => {
    expect(formatPotIdZh('main')).toBe('主池')
    expect(formatPotIdZh('side-1')).toBe('边池1')
    expect(formatPotIdZh('side-3')).toBe('边池3')
    expect(formatPotIdZh('mystery')).toBe('mystery')
  })
})
