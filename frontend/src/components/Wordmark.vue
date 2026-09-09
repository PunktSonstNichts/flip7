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
.wordmark {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 0.78;
  text-align: center;
}

.flip {
  font-family: var(--font-display);
  font-size: 42px;
  letter-spacing: 0.04em;
  color: var(--yellow);
  text-shadow:
    2px 0 0 #fff,
    -2px 0 0 #fff,
    0 2px 0 #fff,
    0 -2px 0 #fff,
    3px 4px 0 var(--ink);
  font-style: italic;
}

.seven {
  font-family: var(--font-display);
  font-size: 58px;
  color: var(--yellow);
  text-shadow:
    2px 0 0 #fff,
    -2px 0 0 #fff,
    0 2px 0 #fff,
    0 -2px 0 #fff,
    3px 4px 0 var(--red);
}

.compact {
  flex-direction: row;
  align-items: center;
  gap: 4px;
  line-height: 1;
}

.compact .flip {
  font-size: 26px;
  text-shadow:
    1px 0 0 #fff,
    -1px 0 0 #fff,
    0 1px 0 #fff,
    0 -1px 0 #fff,
    2px 2px 0 var(--ink);
}

.compact .seven {
  font-size: 34px;
  text-shadow:
    1px 0 0 #fff,
    -1px 0 0 #fff,
    0 1px 0 #fff,
    0 -1px 0 #fff,
    2px 2px 0 var(--red);
}
</style>
