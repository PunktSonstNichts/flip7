import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { deleteRemoteGame } from '../lib/api'
import { createId, nowIso } from '../lib/id'
import { emptyEntry, playerTotals, winnersFor, withScore } from '../lib/scoring'
import {
  flushQueue,
  pushGame,
  reconcileGame,
  syncAccessibleGames,
  type SyncStatus,
} from '../lib/sync'
import {
  loadDeleted,
  loadDrafts,
  loadGameAccess,
  loadGames,
  saveDeleted,
  saveDrafts,
  saveGameAccess,
  saveGames,
} from '../lib/storage'
import { DEFAULT_TARGET, type DraftRound, type Game, type Player, type RoundEntry } from '../types'

function persistGames(games: Record<string, Game>): void {
  saveGames(games)
}

export const useGameStore = defineStore('game', () => {
  const games = ref<Record<string, Game>>(loadGames())
  const drafts = ref<Record<string, DraftRound>>(loadDrafts())
  const accessibleGameIds = ref<string[]>(loadGameAccess())
  const currentId = ref<string | null>(null)
  const syncStatus = ref<SyncStatus>(navigator.onLine ? 'synced' : 'offline')

  const currentGame = computed(() =>
    currentId.value ? (games.value[currentId.value] ?? null) : null,
  )

  const gameList = computed(() =>
    Object.values(games.value)
      .filter((game) => accessibleGameIds.value.includes(game.id))
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
  )

  const totals = computed(() => {
    const game = currentGame.value
    if (!game) return {}
    return playerTotals(game.rounds.map((round) => round.entries))
  })

  const winnerIds = computed(() => {
    const game = currentGame.value
    if (!game) return []
    return winnersFor(totals.value, game.targetScore)
  })

  function writeGame(game: Game): Game {
    const next = { ...game, updatedAt: nowIso() }
    games.value = { ...games.value, [next.id]: next }
    persistGames(games.value)
    void syncNow(next)
    return next
  }

  async function syncNow(game: Game): Promise<void> {
    syncStatus.value = navigator.onLine ? 'syncing' : 'offline'
    const ok = await pushGame(game)
    if (!navigator.onLine) {
      syncStatus.value = 'offline'
      return
    }
    syncStatus.value = ok ? 'synced' : 'error'
  }

  async function hydrate(): Promise<void> {
    games.value = loadGames()
    drafts.value = loadDrafts()
    accessibleGameIds.value = loadGameAccess()
    syncStatus.value = navigator.onLine ? 'syncing' : 'offline'
    await syncAccessibleGames(accessibleGameIds.value)
    games.value = loadGames()
    const flushed = await flushQueue()
    if (!navigator.onLine) syncStatus.value = 'offline'
    else syncStatus.value = flushed ? 'synced' : 'error'
  }

  async function openGame(id: string): Promise<Game | null> {
    currentId.value = id
    const resolved = await reconcileGame(id)
    games.value = loadGames()
    if (resolved) grantGameAccess(id)
    return resolved
  }

  function grantGameAccess(id: string): void {
    if (accessibleGameIds.value.includes(id)) return
    accessibleGameIds.value = [...accessibleGameIds.value, id]
    saveGameAccess(accessibleGameIds.value)
  }

  function createGame(input: {
    tableName: string
    targetScore: number
    playerNames: string[]
  }): Game {
    const players: Player[] = input.playerNames.map((name) => ({
      id: createId('p'),
      name,
    }))
    const game: Game = {
      id: createId('g'),
      tableName: input.tableName.trim() || null,
      targetScore: input.targetScore || DEFAULT_TARGET,
      players,
      rounds: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    grantGameAccess(game.id)
    writeGame(game)
    currentId.value = game.id
    return game
  }

  function writeDraft(draft: DraftRound): DraftRound {
    drafts.value = { ...drafts.value, [draft.gameId]: draft }
    saveDrafts(drafts.value)
    return draft
  }

  function draftEntriesFor(
    players: Player[],
    source: RoundEntry[] = [],
  ): Record<string, RoundEntry> {
    return Object.fromEntries(
      players.map((player) => [
        player.id,
        withScore(source.find((entry) => entry.playerId === player.id) ?? emptyEntry(player.id)),
      ]),
    )
  }

  function isCompleteDraft(game: Game, draft: DraftRound): boolean {
    return game.players.every((player) => draft.entries[player.id])
  }

  function ensureDraft(gameId: string): DraftRound {
    const game = games.value[gameId]
    const existing = drafts.value[gameId]
    if (existing && game && isCompleteDraft(game, existing)) {
      return existing
    }
    return writeDraft({
      gameId,
      entries: draftEntriesFor(game?.players ?? []),
    })
  }

  function openRoundDraft(gameId: string, mode: 'new' | 'edit-last'): DraftRound | null {
    const game = games.value[gameId]
    if (!game) return null

    if (mode === 'edit-last') {
      const last = game.rounds.at(-1)
      if (!last) return null
      const existing = drafts.value[gameId]
      if (existing?.editingRoundId === last.id && isCompleteDraft(game, existing)) {
        return existing
      }
      return writeDraft({
        gameId,
        editingRoundId: last.id,
        entries: draftEntriesFor(game.players, last.entries),
      })
    }

    const existing = drafts.value[gameId]
    if (existing && !existing.editingRoundId && isCompleteDraft(game, existing)) {
      return existing
    }
    return writeDraft({
      gameId,
      entries: draftEntriesFor(game.players),
    })
  }

  function updateDraft(gameId: string, playerId: string, patch: Partial<RoundEntry>): void {
    const draft = ensureDraft(gameId)
    const current = draft.entries[playerId] ?? emptyEntry(playerId)
    const nextEntry = withScore({ ...current, ...patch, playerId })
    writeDraft({
      gameId,
      editingRoundId: draft.editingRoundId,
      entries: { ...draft.entries, [playerId]: nextEntry },
    })
  }

  function resetDraftPlayer(gameId: string, playerId: string): void {
    updateDraft(gameId, playerId, emptyEntry(playerId))
  }

  function saveRound(gameId: string): Game | null {
    const game = games.value[gameId]
    const draft = drafts.value[gameId]
    if (!game || !draft) return null
    const entries = game.players.map((player) =>
      withScore(draft.entries[player.id] ?? emptyEntry(player.id)),
    )
    const editingIndex = draft.editingRoundId
      ? game.rounds.findIndex((round) => round.id === draft.editingRoundId)
      : -1
    const rounds =
      editingIndex >= 0
        ? game.rounds.map((round, index) =>
            index === editingIndex ? { ...round, entries } : round,
          )
        : [
            ...game.rounds,
            {
              id: createId('r'),
              number: game.rounds.length + 1,
              entries,
            },
          ]
    const next: Game = {
      ...game,
      rounds,
    }
    const restDrafts = { ...drafts.value }
    delete restDrafts[gameId]
    drafts.value = restDrafts
    saveDrafts(restDrafts)
    return writeGame(next)
  }

  async function removeGame(id: string): Promise<void> {
    const rest = { ...games.value }
    delete rest[id]
    games.value = rest
    persistGames(rest)
    const otherDrafts = { ...drafts.value }
    delete otherDrafts[id]
    drafts.value = otherDrafts
    saveDrafts(otherDrafts)
    saveDeleted([...loadDeleted(), id])
    accessibleGameIds.value = accessibleGameIds.value.filter((gameId) => gameId !== id)
    saveGameAccess(accessibleGameIds.value)
    if (currentId.value === id) currentId.value = null
    try {
      await deleteRemoteGame(id)
    } catch {
      // deletion stays local if offline; next sync will not recreate it
    }
  }

  function startOnlineWatch(): () => void {
    const onOnline = () => {
      void hydrate()
    }
    const onOffline = () => {
      syncStatus.value = 'offline'
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') void hydrate()
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(() => {
      if (navigator.onLine) void flushQueue()
    }, 15000)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }

  return {
    games,
    drafts,
    accessibleGameIds,
    currentId,
    syncStatus,
    currentGame,
    gameList,
    totals,
    winnerIds,
    hydrate,
    openGame,
    createGame,
    ensureDraft,
    openRoundDraft,
    updateDraft,
    resetDraftPlayer,
    saveRound,
    removeGame,
    startOnlineWatch,
  }
})
