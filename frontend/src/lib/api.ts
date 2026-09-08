import type { Game, GameSummary } from '../types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) {
    throw new Error(`${response.status}`)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export function listRemoteGames(): Promise<GameSummary[]> {
  return request<GameSummary[]>('/api/games')
}

export function getRemoteGame(id: string): Promise<Game> {
  return request<Game>(`/api/games/${id}`)
}

export function putRemoteGame(game: Game): Promise<Game> {
  return request<Game>(`/api/games/${game.id}`, {
    method: 'PUT',
    body: JSON.stringify(game),
  })
}

export function deleteRemoteGame(id: string): Promise<void> {
  return request<void>(`/api/games/${id}`, { method: 'DELETE' })
}

export function isOnline(): boolean {
  return navigator.onLine
}
