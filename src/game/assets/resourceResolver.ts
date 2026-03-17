import type { Card } from '../types'

const assetModules = import.meta.glob('../../resources/**/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const relativeToUrl = new Map<string, string>()

for (const [filePath, url] of Object.entries(assetModules)) {
  const relative = filePath.replace('../../resources/', '')
  relativeToUrl.set(relative, url)
}

function mustResolve(relativePath: string): string {
  const resolved = relativeToUrl.get(relativePath)
  if (!resolved) {
    throw new Error(`Resource not found: ${relativePath}`)
  }

  return resolved
}

export function resolveMaterial(relativePath: string): string {
  return mustResolve(`material/${relativePath}`)
}

export function resolveAvatar(index: number): string {
  return mustResolve(`material/avatar/avatar_${index}.png`)
}

export function resolveSeatMarker(role: 'BTN' | 'SB' | 'BB'): string {
  return mustResolve(`material/seat/${role}.png`)
}

export function resolvePokerCard(card: Card): string {
  return mustResolve(`pokers/${card.suit}/${card.suit}_${card.rank}.png`)
}

export function resolvePokerBack(): string {
  return mustResolve('pokers/back.png')
}

export function resolveChipIcon(): string {
  return mustResolve('material/chipIcon.png')
}
