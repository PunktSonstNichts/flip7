<script setup lang="ts">
defineProps<{ compact?: boolean }>()
</script>

<template>
  <div class="wordmark" :class="{ compact }">
    <span class="flip">FLIP</span>
    <span class="seven">7</span>
  </div>
</template>

<style scoped>
.compact .flip {
  font-size: 42px;
  text-shadow:
    2px 0 0 #fff,
    -2px 0 0 #fff,
    0 2px 0 #fff,
    0 -2px 0 #fff,
    3px 4px 0 var(--ink);
}

.compact .seven {
  font-size: 58px;
  text-shadow:
    2px 0 0 #fff,
    -2px 0 0 #fff,
    0 2px 0 #fff,
    0 -2px 0 #fff,
    3px 4px 0 var(--red);
}
</style>
