import { FLIP7_BONUS, type RoundEntry } from '../types'

export function emptyEntry(playerId: string): RoundEntry {
  return {
    playerId,
    busted: false,
    secondChance: false,
    numberCards: [],
    bonuses: [],
    hasDouble: false,
    score: 0,
  }
}

export function hasFlip7(entry: Pick<RoundEntry, 'busted' | 'numberCards'>): boolean {
  return !entry.busted && new Set(entry.numberCards).size === 7
}

export function scoreEntry(entry: Omit<RoundEntry, 'score'> | RoundEntry): number {
  if (entry.busted) return 0

  const uniqueNumbers = [...new Set(entry.numberCards)].sort((a, b) => a - b)
  let total = uniqueNumbers.reduce((sum, value) => sum + value, 0)
  if (entry.hasDouble) total *= 2
  total += entry.bonuses.reduce((sum, value) => sum + value, 0)
  if (hasFlip7(entry)) total += FLIP7_BONUS
  return total
}

export function withScore(entry: Omit<RoundEntry, 'score'> | RoundEntry): RoundEntry {
  const normalized: RoundEntry = {
    ...entry,
    numberCards: [...new Set(entry.numberCards)].sort((a, b) => a - b),
    bonuses: [...new Set(entry.bonuses)].sort((a, b) => a - b),
    score: 0,
  }
  if (normalized.busted) {
    normalized.score = 0
    return normalized
  }
  normalized.score = scoreEntry(normalized)
  return normalized
}

export function playerTotals(entriesByRound: RoundEntry[][]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const entries of entriesByRound) {
    for (const entry of entries) {
      totals[entry.playerId] = (totals[entry.playerId] ?? 0) + entry.score
    }
  }
  return totals
}

export function winnersFor(
  totals: Record<string, number>,
  targetScore: number,
): string[] {
  const reached = Object.entries(totals)
    .filter(([, score]) => score >= targetScore)
    .sort((a, b) => b[1] - a[1])
  if (reached.length === 0) return []
  const lead = reached[0][1]
  const tied = reached.filter(([, score]) => score === lead).map(([id]) => id)
  return tied.length === 1 ? tied : []
}
