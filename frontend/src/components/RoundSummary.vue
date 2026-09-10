<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Player } from '../types'

const props = defineProps<{
  players: Player[]
  previousTotals: Record<string, number>
  projectedTotals: Record<string, number>
  roundScores: Record<string, number>
}>()

const animatedTotals = ref<Record<string, number>>({})
let animationFrame: number | undefined

const rankedPlayers = computed(() =>
  [...props.players].sort((a, b) => {
    const difference = (animatedTotals.value[b.id] ?? 0) - (animatedTotals.value[a.id] ?? 0)
    if (difference !== 0) return difference
    return props.players.indexOf(a) - props.players.indexOf(b)
  }),
)

function setAnimatedTotals(progress: number): void {
  animatedTotals.value = Object.fromEntries(
    props.players.map((player) => {
      const previous = props.previousTotals[player.id] ?? 0
      const projected = props.projectedTotals[player.id] ?? previous
      return [player.id, Math.round(previous + (projected - previous) * progress)]
    }),
  )
}

function startAnimation(): void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) {
    setAnimatedTotals(1)
    return
  }

  const duration = 950
  const startedAt = performance.now()
  const tick = (now: number) => {
    const linearProgress = Math.min((now - startedAt) / duration, 1)
    const easedProgress = 1 - Math.pow(1 - linearProgress, 3)
    setAnimatedTotals(easedProgress)
    if (linearProgress < 1) animationFrame = window.requestAnimationFrame(tick)
  }
  animationFrame = window.requestAnimationFrame(tick)
}

onMounted(async () => {
  setAnimatedTotals(0)
  await nextTick()
  animationFrame = window.requestAnimationFrame(startAnimation)
})

onBeforeUnmount(() => {
  if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame)
})
</script>

<template>
  <section class="sheet round-summary" aria-labelledby="round-summary-title">
    <p class="summary-kicker">Runde geschafft</p>
    <h2 id="round-summary-title" class="player-name">Neuer Zwischenstand</h2>
    <p class="muted summary-copy">So hat sich die Rangliste in dieser Runde verändert.</p>

    <TransitionGroup name="ranking" tag="ol" class="round-summary-list">
      <li
        v-for="(player, index) in rankedPlayers"
        :key="player.id"
        class="round-summary-row"
      >
        <span class="rank-badge" aria-hidden="true">{{ index + 1 }}</span>
        <span class="summary-player">{{ player.name }}</span>
        <span class="round-growth">+{{ roundScores[player.id] ?? 0 }}</span>
        <strong class="animated-total" aria-hidden="true">
          {{ animatedTotals[player.id] ?? 0 }}
        </strong>
        <span class="sr-only">
          Platz {{ index + 1 }}, {{ projectedTotals[player.id] ?? 0 }} Punkte,
          plus {{ roundScores[player.id] ?? 0 }} in dieser Runde
        </span>
      </li>
    </TransitionGroup>
  </section>
</template>
