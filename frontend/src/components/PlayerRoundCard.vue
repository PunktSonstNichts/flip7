<script setup lang="ts">
import { computed } from 'vue'
import { hasFlip7 } from '../lib/scoring'
import { BONUS_CARDS, NUMBER_CARDS, type Player, type RoundEntry } from '../types'
import BonusCardChip from './BonusCardChip.vue'
import NumberCardChip from './NumberCardChip.vue'

const props = defineProps<{
  player: Player
  entry: RoundEntry
}>()

const emit = defineEmits<{
  update: [patch: Partial<RoundEntry>]
  reset: []
}>()

const selectedNumbers = computed(() => new Set(props.entry.numberCards))
const selectedBonuses = computed(() => new Set(props.entry.bonuses))
const flip7 = computed(() => hasFlip7(props.entry))

function setBusted(busted: boolean): void {
  emit('update', { busted })
}

function toggleNumber(value: number): void {
  const next = new Set(props.entry.numberCards)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  emit('update', { numberCards: [...next] })
}

function toggleBonus(value: number): void {
  const next = new Set(props.entry.bonuses)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  emit('update', { bonuses: [...next] })
}
</script>

<template>
  <div class="player-round-card">
    <section class="sheet" :class="{ busted: entry.busted }">
      <div class="choice" role="radiogroup" :aria-label="`Rundenstatus ${player.name}`">
        <button
          type="button"
          class="cards"
          :class="{ active: !entry.busted }"
          :aria-checked="!entry.busted"
          role="radio"
          @click="setBusted(false)"
        >
          Karten zählen
        </button>
        <button
          type="button"
          class="bust"
          :class="{ active: entry.busted }"
          :aria-checked="entry.busted"
          role="radio"
          @click="setBusted(true)"
        >
          Verzockt
        </button>
      </div>

      <template v-if="entry.busted">
        <div class="bust-banner">
          <strong>VERZOCKT</strong>
          0 Punkte für diese Runde
        </div>
      </template>

      <template v-else>
        <h3 class="section-label">Zahlenkarten</h3>
        <div class="chip-grid">
          <NumberCardChip
            v-for="value in NUMBER_CARDS"
            :key="value"
            :value="value"
            :selected="selectedNumbers.has(value)"
            @toggle="toggleNumber(value)"
          />
        </div>

        <div v-if="flip7" class="flip7-banner">
          <strong>FLIP 7</strong>
          <span>+15 Punkte</span>
        </div>

        <h3 class="section-label">Bonuskarten</h3>
        <div class="chip-grid bonus">
          <BonusCardChip
            v-for="value in BONUS_CARDS"
            :key="value"
            :label="`+${value}`"
            :selected="selectedBonuses.has(value)"
            @toggle="toggleBonus(value)"
          />
          <BonusCardChip
            label="×2"
            variant="double"
            :selected="entry.hasDouble"
            @toggle="emit('update', { hasDouble: !entry.hasDouble })"
          />
        </div>
      </template>

      <div class="row-actions">
        <button type="button" class="text-btn" @click="emit('reset')">Zurücksetzen</button>
      </div>
    </section>

    <p v-if="!entry.busted" class="score-line" aria-live="polite">
      <span class="score-label">Zwischenstand</span>
      <strong>{{ entry.score }}</strong>
      <span class="score-unit">Punkte</span>
    </p>
  </div>
</template>
