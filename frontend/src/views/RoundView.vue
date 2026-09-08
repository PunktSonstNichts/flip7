<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlayerRoundCard from '../components/PlayerRoundCard.vue'
import { emptyEntry, playerTotals, winnersFor } from '../lib/scoring'
import { useGameStore } from '../stores/game'
import type { RoundEntry } from '../types'

const route = useRoute()
const router = useRouter()
const store = useGameStore()

const gameId = computed(() => String(route.params.id))
const game = computed(() => store.games[gameId.value] ?? null)
const draft = computed(() => store.drafts[gameId.value])
const editingLast = computed(() => route.query.edit === 'last')
const gameIsFinished = computed(() => {
  if (!game.value) return false
  const totals = playerTotals(game.value.rounds.map((round) => round.entries))
  return winnersFor(totals, game.value.targetScore).length > 0
})
const roundNumber = computed(() => {
  const editingId = draft.value?.editingRoundId
  if (editingId) {
    return game.value?.rounds.find((round) => round.id === editingId)?.number ?? game.value?.rounds.length ?? 1
  }
  return (game.value?.rounds.length ?? 0) + 1
})

watch(
  [gameId, editingLast],
  async () => {
    const id = gameId.value
    const mode = editingLast.value ? 'edit-last' : 'new'
    if (store.games[id]) {
      if (mode === 'new' && gameIsFinished.value) {
        void router.replace(`/games/${id}`)
        return
      }
      const draft = store.openRoundDraft(id, mode)
      if (mode === 'edit-last' && !draft) {
        void router.replace(`/games/${id}/round`)
        return
      }
    }
    await store.openGame(id)
    if (!store.games[id]) return
    if (mode === 'new' && gameIsFinished.value) {
      void router.replace(`/games/${id}`)
      return
    }
    if (store.drafts[id]) return
    const draft = store.openRoundDraft(id, mode)
    if (mode === 'edit-last' && !draft) void router.replace(`/games/${id}/round`)
  },
  { immediate: true },
)

function save(): void {
  const saved = store.saveRound(gameId.value)
  if (saved) void router.push(`/games/${saved.id}`)
}
</script>

<template>
  <div v-if="game && draft">
    <p class="tagline">
      {{ draft.editingRoundId ? `Runde ${roundNumber} bearbeiten` : `Runde ${roundNumber}` }}
    </p>
    <PlayerRoundCard
      v-for="player in game.players"
      :key="player.id"
      :player="player"
      :entry="draft.entries[player.id] ?? emptyEntry(player.id)"
      @update="(patch: Partial<RoundEntry>) => store.updateDraft(game.id, player.id, patch)"
      @reset="store.resetDraftPlayer(game.id, player.id)"
    />
    <div class="fab">
      <button class="primary-btn" type="button" @click="save">Runde speichern</button>
    </div>
  </div>
</template>
