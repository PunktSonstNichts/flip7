import type { DraftRound, Game } from '../types'

const GAMES_KEY = 'flip7.games'
const DRAFTS_KEY = 'flip7.drafts'
const QUEUE_KEY = 'flip7.syncQueue'
const ACCESS_KEY = 'flip7.gameAccess'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function loadGames(): Record<string, Game> {
  return readJson<Record<string, Game>>(GAMES_KEY, {})
}

export function saveGames(games: Record<string, Game>): void {
  localStorage.setItem(GAMES_KEY, JSON.stringify(games))
}

export function loadGameAccess(): string[] {
  return readJson<string[]>(ACCESS_KEY, [])
}

export function saveGameAccess(ids: string[]): void {
  localStorage.setItem(ACCESS_KEY, JSON.stringify([...new Set(ids)]))
}

export function loadDrafts(): Record<string, DraftRound> {
  return readJson<Record<string, DraftRound>>(DRAFTS_KEY, {})
}

export function saveDrafts(drafts: Record<string, DraftRound>): void {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
}

export function loadQueue(): string[] {
  return readJson<string[]>(QUEUE_KEY, [])
}

export function saveQueue(ids: string[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify([...new Set(ids)]))
}

const DELETED_KEY = 'flip7.deleted'

export function loadDeleted(): string[] {
  return readJson<string[]>(DELETED_KEY, [])
}

export function saveDeleted(ids: string[]): void {
  localStorage.setItem(DELETED_KEY, JSON.stringify([...new Set(ids)]))
}
