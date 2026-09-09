<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import Wordmark from '../components/Wordmark.vue'
import { playerTotals, winnersFor } from '../lib/scoring'
import { useGameStore } from '../stores/game'

const store = useGameStore()

const cards = computed(() =>
  store.gameList.map((game) => {
    const totals = playerTotals(game.rounds.map((round) => round.entries))
    const lead = [...game.players].sort(
      (a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0),
    )[0]
    const winnerId = winnersFor(totals, game.targetScore)[0]
    const winner = game.players.find((player) => player.id === winnerId)
    return {
      game,
      names: game.players.map((player) => player.name).join(', '),
      lead: lead ? `${lead.name} ${totals[lead.id] ?? 0}` : 'Noch keine Runde',
      winner: winner ? `${winner.name} gewinnt mit ${totals[winner.id] ?? 0} Punkten` : null,
    }
  }),
)
</script>

<template>
  <div>
    <Wordmark />
    <p class="tagline">Wer knackt die 200?</p>

    <p v-if="cards.length === 0" class="sheet empty-state">
      <span>
        Noch keine Spiele. <br />
        Hier siehst du alle Spiele, die du angelegt oder über einen Link besuchst hast.
      </span>
    </p>

    <RouterLink
      v-for="card in cards"
      :key="card.game.id"
      class="sheet game-card"
      :to="`/games/${card.game.id}`"
    >
      <h2 class="player-name">{{ card.game.tableName || 'Flip 7' }}</h2>
      <p class="muted">{{ card.names }}</p>
      <p :class="{ 'game-card-winner': card.winner }">
        <template v-if="card.winner">🏆 {{ card.winner }} · {{ card.game.rounds.length }} Runden</template>
        <template v-else>
          {{ card.game.rounds.length }} Runden · Ziel {{ card.game.targetScore }} ·
          {{ card.lead }}
        </template>
      </p>
    </RouterLink>

    <RouterLink class="primary-btn fab" to="/games/new">Neues Spiel</RouterLink>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  justify-content: center;
  text-align: center;
}

.empty-state span {
  max-width: 480px;
}
</style>
