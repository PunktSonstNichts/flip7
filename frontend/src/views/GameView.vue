<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { hasFlip7, playerTotals, winnersFor } from '../lib/scoring'
import type { Round, RoundEntry } from '../types'
import { useGameStore } from '../stores/game'

const route = useRoute()
const router = useRouter()
const store = useGameStore()
const missing = ref(false)
const confirmDelete = ref(false)

const gameId = computed(() => String(route.params.id))
const game = computed(() => store.games[gameId.value] ?? null)

onMounted(async () => {
  const resolved = await store.openGame(gameId.value)
  missing.value = !resolved
})

function askDelete(): void {
  confirmDelete.value = true
}

function cancelDelete(): void {
  confirmDelete.value = false
}

async function confirmRemove(): Promise<void> {
  confirmDelete.value = false
  await store.removeGame(gameId.value)
  await router.push('/')
}

const totals = computed(() => {
  if (!game.value) return {}
  return playerTotals(game.value.rounds.map((round) => round.entries))
})

const rankedPlayers = computed(() => {
  const current = game.value
  if (!current) return []
  return [...current.players].sort((a, b) => {
    const diff = (totals.value[b.id] ?? 0) - (totals.value[a.id] ?? 0)
    if (diff !== 0) return diff
    return current.players.indexOf(a) - current.players.indexOf(b)
  })
})

const winnerIds = computed(() => {
  if (!game.value) return []
  return winnersFor(totals.value, game.value.targetScore)
})

function entryFor(round: Round, playerId: string): RoundEntry | undefined {
  return round.entries.find((entry) => entry.playerId === playerId)
}

function flip7For(round: Round, playerId: string): boolean {
  const entry = entryFor(round, playerId)
  return entry ? hasFlip7(entry) : false
}

const winnerNames = computed(() => {
  if (!game.value) return []
  return game.value.players
    .filter((player) => winnerIds.value.includes(player.id))
    .map((player) => player.name)
})

const winningScore = computed(() => {
  const winnerId = winnerIds.value[0]
  return winnerId ? (totals.value[winnerId] ?? 0) : 0
})
</script>

<template>
  <div v-if="game">
    <section
      v-if="winnerNames.length"
      class="victory"
      role="status"
      aria-live="polite"
    >
      <div class="confetti" aria-hidden="true">
        <i
          v-for="piece in 18"
          :key="piece"
          :style="{
            left: `${piece * 5.4 - 2}%`,
            transform: `rotate(${piece * 29}deg)`,
            animationDelay: `${piece * -90}ms`,
          }"
        ></i>
      </div>
      <div class="victory-trophy" aria-hidden="true">🏆</div>
      <p class="victory-kicker">Spiel beendet</p>
      <h1>{{ winnerNames.join(' & ') }} gewinnt!</h1>
      <p class="victory-score">
        {{ winningScore }} Punkte · Ziel {{ game.targetScore }}
      </p>
    </section>

    <section class="sheet scoreboard">
      <h2 class="player-name">{{ game.tableName || 'Rangliste' }}</h2>
      <p class="muted">Ziel: {{ game.targetScore }} Punkte</p>
      <div class="scoreboard-table-scroll">
        <table>
          <thead>
            <tr>
              <th></th>
              <th v-for="player in rankedPlayers" :key="player.id">{{ player.name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="round in game.rounds" :key="round.id">
              <td>R{{ round.number }}</td>
              <td
                v-for="player in rankedPlayers"
                :key="`${round.id}-${player.id}`"
                :class="{ flip7: flip7For(round, player.id) }"
                :title="flip7For(round, player.id) ? 'Flip 7' : undefined"
              >
                <span>{{ entryFor(round, player.id)?.score ?? 0 }}</span>
              </td>
            </tr>
            <tr class="totals">
              <td>Gesamt</td>
              <td v-for="player in rankedPlayers" :key="`total-${player.id}`">
                {{ totals[player.id] ?? 0 }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="game.rounds.length === 0" class="muted">Noch keine Runde eingetragen.</p>
    </section>

    <div class="stack" style="margin-top: 14px">
      <RouterLink
        v-if="game.rounds.length > 0"
        class="ghost-btn"
        :to="`/games/${game.id}/round?edit=last`"
      >
        Letzte Runde bearbeiten
      </RouterLink>
      <button type="button" class="danger-link" @click="askDelete">Spiel löschen</button>
    </div>

    <RouterLink
      class="primary-btn fab"
      :to="winnerNames.length ? '/' : `/games/${game.id}/round`"
    >
      {{ winnerNames.length ? 'Zur Übersicht' : 'Neue Runde eintragen' }}
    </RouterLink>

    <div
      v-if="confirmDelete"
      class="dialog-backdrop"
      role="presentation"
      @click.self="cancelDelete"
    >
      <div
        class="sheet dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        aria-describedby="delete-copy"
      >
        <h2 id="delete-title" class="player-name">Sicher?</h2>
        <p id="delete-copy">Dieses Spiel und alle Runden werden gelöscht.</p>
        <div class="stack" style="margin-top: 16px">
          <button type="button" class="danger-btn" @click="confirmRemove">Ja, löschen</button>
          <button type="button" class="ghost-btn" @click="cancelDelete">Abbrechen</button>
        </div>
      </div>
    </div>
  </div>
  <p v-else-if="missing" class="sheet">Spiel nicht gefunden.</p>
</template>
