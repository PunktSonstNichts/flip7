<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import Wordmark from './components/Wordmark.vue'
import { useGameStore } from './stores/game'

const route = useRoute()
const store = useGameStore()
let stopWatch: (() => void) | undefined

const statusLabel: Record<string, string> = {
  offline: 'Offline',
  error: 'Sync fehlgeschlagen',
}

const showSyncError = computed(
  () => store.syncStatus === 'offline' || store.syncStatus === 'error',
)

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
  <div class="app-shell" :class="{ 'new-game-shell': route.name === 'new' }">
    <header v-if="route.name !== 'home'" class="topbar">
      <RouterLink v-if="backTo" class="back-link" :to="backTo">← {{ title }}</RouterLink>
      <span v-else></span>
      <div class="topbar-status">
        <span
          v-if="showSyncError"
          class="sync-pill"
          :class="store.syncStatus"
          role="status"
        >
          {{ statusLabel[store.syncStatus] }}
        </span>
        <RouterLink class="compact-wordmark-link" to="/" aria-label="Zur Startseite">
          <Wordmark compact />
        </RouterLink>
      </div>
    </header>
    <RouterView />
  </div>
</template>
