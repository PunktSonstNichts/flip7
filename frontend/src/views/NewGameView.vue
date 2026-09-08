<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { DEFAULT_TARGET } from '../types'
import { useGameStore } from '../stores/game'

const router = useRouter()
const store = useGameStore()

const tableName = ref('')
const targetScore = ref(DEFAULT_TARGET)
const players = ref(['', ''])

const canStart = computed(
  () => players.value.filter((name) => name.trim()).length >= 2 && targetScore.value > 0,
)

watch(
  players,
  (names) => {
    const emptyIndexes = names.flatMap((name, index) => (name.trim() ? [] : [index]))

    if (emptyIndexes.length > 2) {
      const lastEmptyIndex = emptyIndexes.at(-1)
      players.value = names.filter((_, index) => index !== lastEmptyIndex)
    } else if (emptyIndexes.length === 0) {
      players.value = [...names, '']
    }
  },
  { deep: true },
)

function start(): void {
  const names = players.value.map((name) => name.trim()).filter(Boolean)
  if (names.length < 2) return
  const game = store.createGame({
    tableName: tableName.value,
    targetScore: Number(targetScore.value) || DEFAULT_TARGET,
    playerNames: names,
  })
  void router.push(`/games/${game.id}`)
}
</script>

<template>
  <div class="new-game-view">
    <section class="sheet">
      <div class="field">
        <label for="table">Tischname (optional)</label>
        <input id="table" v-model="tableName" placeholder="z. B. Wohnzimmer" />
      </div>
      <div class="field">
        <label for="target">Zielpunktzahl</label>
        <input id="target" v-model.number="targetScore" type="number" min="1" required />
      </div>
      <h3 class="section-label">Spieler</h3>
      <div v-for="(_name, index) in players" :key="index" class="field">
        <input
          v-model="players[index]"
          :aria-label="`Spieler ${index + 1}`"
          :placeholder="`Spieler ${index + 1}`"
        />
      </div>
    </section>
    <div class="fab fab-in-flow">
      <button class="primary-btn" type="button" :disabled="!canStart" @click="start">
        Spiel starten
      </button>
    </div>
  </div>
</template>
