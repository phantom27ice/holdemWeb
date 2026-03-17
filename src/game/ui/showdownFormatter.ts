import type { HandCategory } from '../engine'

export function formatHandCategoryZh(category: HandCategory): string {
  switch (category) {
    case 'ROYAL_FLUSH':
      return '皇家同花顺'
    case 'STRAIGHT_FLUSH':
      return '同花顺'
    case 'FOUR_OF_A_KIND':
      return '四条'
    case 'FULL_HOUSE':
      return '葫芦'
    case 'FLUSH':
      return '同花'
    case 'STRAIGHT':
      return '顺子'
    case 'THREE_OF_A_KIND':
      return '三条'
    case 'TWO_PAIR':
      return '两对'
    case 'ONE_PAIR':
      return '一对'
    case 'HIGH_CARD':
      return '高牌'
    default:
      return '牌型'
  }
}

export function formatPotIdZh(potId: string): string {
  if (potId === 'main') {
    return '主池'
  }

  if (potId.startsWith('side-')) {
    const index = Number.parseInt(potId.slice(5), 10)
    if (Number.isFinite(index) && index > 0) {
      return `边池${index}`
    }
    return '边池'
  }

  return potId
}
