import { getRemoteGame, isOnline, putRemoteGame } from './api'
import { loadGames, loadQueue, saveGames, saveQueue } from './storage'
import type { Game } from '../types'

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'error'

function enqueue(id: string): void {
  const queue = loadQueue()
  if (!queue.includes(id)) {
    queue.push(id)
    saveQueue(queue)
  }
}

function dequeue(id: string): void {
  saveQueue(loadQueue().filter((item) => item !== id))
}

export async function pushGame(game: Game): Promise<boolean> {
  enqueue(game.id)
  if (!isOnline()) return false
  try {
    await putRemoteGame(game)
    dequeue(game.id)
    return true
  } catch {
    return false
  }
}

export async function flushQueue(): Promise<boolean> {
  if (!isOnline()) return false
  const games = loadGames()
  const queue = loadQueue()
  let ok = true
  for (const id of queue) {
    const game = games[id]
    if (!game) {
      dequeue(id)
      continue
    }
    try {
      await putRemoteGame(game)
      dequeue(id)
    } catch {
      ok = false
    }
  }
  return ok
}

export async function reconcileGame(id: string): Promise<Game | null> {
  const local = loadGames()[id] ?? null
  if (!isOnline()) return local
  try {
    const remote = await getRemoteGame(id)
    if (!local) {
      const games = loadGames()
      games[id] = remote
      saveGames(games)
      return remote
    }
    const localTime = Date.parse(local.updatedAt)
    const remoteTime = Date.parse(remote.updatedAt)
    if (localTime > remoteTime) {
      await pushGame(local)
      return local
    }
    if (remoteTime > localTime) {
      const games = loadGames()
      games[id] = remote
      saveGames(games)
      dequeue(id)
      return remote
    }
    return local
  } catch {
    return local
  }
}

export async function syncAccessibleGames(ids: string[]): Promise<void> {
  if (!isOnline()) return
  await Promise.all(ids.map((id) => reconcileGame(id)))
}
