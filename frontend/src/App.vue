<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useGameStore } from './stores/game'

const route = useRoute()
const store = useGameStore()
let stopWatch: (() => void) | undefined

const statusLabel: Record<string, string> = {
  offline: 'Offline',
  syncing: 'Sync…',
  synced: 'Gespeichert',
  error: 'Sync fehlgeschlagen',
}

const backTo = computed(() => {
  if (route.name === 'round') return `/games/${String(route.params.id)}`
  if (route.name === 'game' || route.name === 'new') return '/'
  return null
})

const title = computed(() => {
  if (route.name === 'new') return 'Neues Spiel'
  if (route.name === 'round') return `Runde`
  if (route.name === 'game') return 'Flip 7'
  return null
})

onMounted(() => {
  void store.hydrate()
  stopWatch = store.startOnlineWatch()
})

onUnmounted(() => {
  stopWatch?.()
})
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink v-if="backTo" class="back-link" :to="backTo">← {{ title }}</RouterLink>
      <span v-else></span>
      <span class="sync-pill" :class="store.syncStatus">{{ statusLabel[store.syncStatus] }}</span>
    </header>
    <RouterView />
  </div>
</template>
