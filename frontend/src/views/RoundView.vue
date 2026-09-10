<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlayerRoundCard from '../components/PlayerRoundCard.vue'
import RoundSummary from '../components/RoundSummary.vue'
import { emptyEntry, playerTotals, roundProjection, winnersFor } from '../lib/scoring'
import { useGameStore } from '../stores/game'
import type { RoundEntry } from '../types'

const route = useRoute()
const router = useRouter()
const store = useGameStore()

const gameId = computed(() => String(route.params.id))
const game = computed(() => store.games[gameId.value] ?? null)
const draft = computed(() => store.drafts[gameId.value])
const editingLast = computed(() => route.query.edit === 'last')
const activeStage = ref(0)
const transitionDirection = ref<'forward' | 'backward'>('forward')
let pointerStartX: number | null = null
let pointerStartY: number | null = null

const gameIsFinished = computed(() => {
  if (!game.value) return false
  const totals = playerTotals(game.value.rounds.map((round) => round.entries))
  return winnersFor(totals, game.value.targetScore).length > 0
})

const activePlayer = computed(() => game.value?.players[activeStage.value] ?? null)
const isSummary = computed(
  () => !!game.value && activeStage.value === game.value.players.length,
)
const stageCount = computed(() => (game.value?.players.length ?? 0) + 1)
const transitionName = computed(() =>
  transitionDirection.value === 'forward' ? 'slide-forward' : 'slide-backward',
)
const primaryLabel = computed(() => {
  const players = game.value?.players ?? []
  const nextPlayer = players[activeStage.value + 1]
  return nextPlayer ? `Nächster Spieler: ${nextPlayer.name}` : 'Zur Übersicht'
})
const draftEntries = computed(() => {
  if (!game.value || !draft.value) return []
  return game.value.players.map(
    (player) => draft.value?.entries[player.id] ?? emptyEntry(player.id),
  )
})
const projection = computed(() => {
  if (!game.value || !draft.value) return { previous: {}, projected: {} }
  return roundProjection(game.value.rounds, draftEntries.value, draft.value.editingRoundId)
})
const roundScores = computed(() =>
  Object.fromEntries(draftEntries.value.map((entry) => [entry.playerId, entry.score])),
)

watch(
  [gameId, editingLast],
  async () => {
    activeStage.value = 0
    transitionDirection.value = 'forward'
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

function goToStage(stage: number): void {
  const nextStage = Math.max(0, Math.min(stage, stageCount.value - 1))
  if (nextStage === activeStage.value) return
  transitionDirection.value = nextStage > activeStage.value ? 'forward' : 'backward'
  activeStage.value = nextStage
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function nextStage(): void {
  goToStage(activeStage.value + 1)
}

function previousStage(): void {
  goToStage(activeStage.value - 1)
}

function onPointerDown(event: PointerEvent): void {
  if (!event.isPrimary) return
  pointerStartX = event.clientX
  pointerStartY = event.clientY
}

function clearPointer(): void {
  pointerStartX = null
  pointerStartY = null
}

function onPointerUp(event: PointerEvent): void {
  if (pointerStartX === null || pointerStartY === null) return
  const deltaX = event.clientX - pointerStartX
  const deltaY = event.clientY - pointerStartY
  clearPointer()
  if (Math.abs(deltaX) < 55 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return
  if (deltaX < 0 && activeStage.value < stageCount.value - 1) nextStage()
  if (deltaX > 0 && activeStage.value > 0) previousStage()
}

function save(): void {
  const saved = store.saveRound(gameId.value)
  if (saved) void router.push(`/games/${saved.id}`)
}
</script>

<template>
  <div
    v-if="game && draft"
    class="round-flow"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointercancel="clearPointer"
  >
    <p class="tagline">
      <span>
        {{
          isSummary
            ? 'Übersicht'
            : activePlayer
              ? activePlayer.name
              : ''
        }}
      </span>
    </p>

    <nav class="round-progress" aria-label="Rundeneingabe">
      <button
        v-for="(player, index) in game.players"
        :key="player.id"
        type="button"
        class="progress-dot"
        :class="{ active: activeStage === index }"
        :aria-current="activeStage === index ? 'step' : undefined"
        :aria-label="`${player.name}, Spieler ${index + 1} bearbeiten`"
        @click="goToStage(index)"
      ></button>
      <button
        type="button"
        class="progress-dot summary-dot"
        :class="{ active: isSummary }"
        :aria-current="isSummary ? 'step' : undefined"
        aria-label="Rundenübersicht"
        @click="goToStage(game.players.length)"
      ></button>
    </nav>

    <Transition :name="transitionName" mode="out-in">
      <PlayerRoundCard
        v-if="activePlayer"
        :key="activePlayer.id"
        :player="activePlayer"
        :entry="draft.entries[activePlayer.id] ?? emptyEntry(activePlayer.id)"
        @update="(patch: Partial<RoundEntry>) => store.updateDraft(game.id, activePlayer!.id, patch)"
        @reset="store.resetDraftPlayer(game.id, activePlayer.id)"
      />
      <div v-else-if="isSummary" key="summary" class="summary-stage">
        <RoundSummary
          :players="game.players"
          :previous-totals="projection.previous"
          :projected-totals="projection.projected"
          :round-scores="roundScores"
        />
        <div class="summary-actions">
          <button class="ghost-btn" type="button" @click="previousStage">
            Eingaben bearbeiten
          </button>
        </div>
      </div>
    </Transition>

    <div class="round-navigation">
      <template v-if="!isSummary">
        <button
          v-if="activeStage > 0"
          class="round-previous"
          type="button"
          :aria-label="`Zurück zu ${game.players[activeStage - 1]?.name}`"
          @click="previousStage"
        >
          ←
        </button>
        <button class="primary-btn" type="button" @click="nextStage">
          {{ primaryLabel }}
        </button>
      </template>
      <button v-else class="primary-btn" type="button" @click="save">Runde speichern</button>
    </div>
  </div>
</template>
