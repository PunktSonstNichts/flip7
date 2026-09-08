import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DraftRound, Game } from '../types'

const memory = {
  games: {} as Record<string, Game>,
  drafts: {} as Record<string, DraftRound>,
  deleted: [] as string[],
  access: [] as string[],
}

vi.mock('../lib/storage', () => ({
  loadGames: () => memory.games,
  saveGames: (games: Record<string, Game>) => {
    memory.games = games
  },
  loadGameAccess: () => memory.access,
  saveGameAccess: (ids: string[]) => {
    memory.access = ids
  },
  loadDrafts: () => memory.drafts,
  saveDrafts: (drafts: Record<string, DraftRound>) => {
    memory.drafts = drafts
  },
  loadDeleted: () => memory.deleted,
  saveDeleted: (ids: string[]) => {
    memory.deleted = ids
  },
  loadQueue: () => [],
  saveQueue: () => {},
}))

vi.mock('../lib/sync', () => ({
  flushQueue: vi.fn(async () => true),
  pushGame: vi.fn(async () => true),
  reconcileGame: vi.fn(async (id: string) => memory.games[id] ?? null),
  syncAccessibleGames: vi.fn(async () => {}),
}))

vi.mock('../lib/api', () => ({
  deleteRemoteGame: vi.fn(async () => {}),
}))

import { useGameStore } from './game'

function startGame() {
  const store = useGameStore()
  return store.createGame({
    tableName: 'Test',
    targetScore: 200,
    playerNames: ['Ada', 'Ben'],
  })
}

describe('edit last round', () => {
  beforeEach(() => {
    memory.games = {}
    memory.drafts = {}
    memory.deleted = []
    memory.access = []
    setActivePinia(createPinia())
  })

  it('reloads the last saved round into the draft and replaces it on save', () => {
    const store = useGameStore()
    const game = startGame()
    const [ada, ben] = game.players

    store.openRoundDraft(game.id, 'new')
    store.updateDraft(game.id, ada.id, { numberCards: [7], busted: false })
    store.updateDraft(game.id, ben.id, { busted: true })
    store.saveRound(game.id)

    expect(store.games[game.id].rounds).toHaveLength(1)
    expect(store.games[game.id].rounds[0].entries.find((entry) => entry.playerId === ada.id)?.score).toBe(7)

    const draft = store.openRoundDraft(game.id, 'edit-last')
    expect(draft?.editingRoundId).toBe(store.games[game.id].rounds[0].id)
    expect(draft?.entries[ada.id].numberCards).toEqual([7])
    expect(draft?.entries[ben.id].busted).toBe(true)

    store.updateDraft(game.id, ada.id, { numberCards: [7, 5] })
    store.saveRound(game.id)

    const rounds = store.games[game.id].rounds
    expect(rounds).toHaveLength(1)
    expect(rounds[0].number).toBe(1)
    expect(rounds[0].entries.find((entry) => entry.playerId === ada.id)?.score).toBe(12)
    expect(rounds[0].entries.find((entry) => entry.playerId === ben.id)?.busted).toBe(true)
  })

  it('starts a fresh new-round draft after an edit draft exists', () => {
    const store = useGameStore()
    const game = startGame()
    const [ada] = game.players

    store.openRoundDraft(game.id, 'new')
    store.updateDraft(game.id, ada.id, { numberCards: [3] })
    store.saveRound(game.id)
    store.openRoundDraft(game.id, 'edit-last')

    const draft = store.openRoundDraft(game.id, 'new')
    expect(draft?.editingRoundId).toBeUndefined()
    expect(draft?.entries[ada.id].numberCards).toEqual([])
  })
})

describe('round completion', () => {
  beforeEach(() => {
    memory.games = {}
    memory.drafts = {}
    memory.deleted = []
    memory.access = []
    setActivePinia(createPinia())
  })

  it('detects a winner immediately after the target score is reached', () => {
    const store = useGameStore()
    const game = store.createGame({
      tableName: 'Finale',
      targetScore: 10,
      playerNames: ['Ada', 'Ben'],
    })
    const [ada, ben] = game.players

    store.openRoundDraft(game.id, 'new')
    store.updateDraft(game.id, ada.id, { numberCards: [10] })
    store.updateDraft(game.id, ben.id, { numberCards: [7] })

    expect(store.winnerIds).toEqual([])

    store.saveRound(game.id)

    expect(store.winnerIds).toEqual([ada.id])
  })
})

describe('game access', () => {
  beforeEach(() => {
    memory.games = {}
    memory.drafts = {}
    memory.deleted = []
    memory.access = []
    setActivePinia(createPinia())
  })

  it('only lists games created or opened on this device', async () => {
    const hidden = startGame()
    memory.access = []
    setActivePinia(createPinia())
    const store = useGameStore()

    expect(store.gameList).toEqual([])

    await store.openGame(hidden.id)

    expect(store.gameList.map((game) => game.id)).toEqual([hidden.id])
    expect(memory.access).toEqual([hidden.id])
  })

  it('grants access when creating a game', () => {
    const game = startGame()
    const store = useGameStore()

    expect(store.gameList.map((item) => item.id)).toEqual([game.id])
    expect(memory.access).toEqual([game.id])
  })
})
