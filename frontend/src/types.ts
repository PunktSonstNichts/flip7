export const NUMBER_CARDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
export const BONUS_CARDS = [2, 4, 6, 8, 10] as const
export const FLIP7_BONUS = 15
export const DEFAULT_TARGET = 200

export type NumberCard = (typeof NUMBER_CARDS)[number]
export type BonusCard = (typeof BONUS_CARDS)[number]

export interface Player {
  id: string
  name: string
}

export interface RoundEntry {
  playerId: string
  busted: boolean
  secondChance: boolean
  numberCards: number[]
  bonuses: number[]
  hasDouble: boolean
  score: number
}

export interface Round {
  id: string
  number: number
  entries: RoundEntry[]
}

export interface Game {
  id: string
  tableName: string | null
  targetScore: number
  players: Player[]
  rounds: Round[]
  createdAt: string
  updatedAt: string
}

export interface GameSummary {
  id: string
  tableName: string | null
  targetScore: number
  players: string[]
  roundCount: number
  updatedAt: string
  totals: Record<string, number>
}

export interface DraftRound {
  gameId: string
  entries: Record<string, RoundEntry>
  editingRoundId?: string
}
