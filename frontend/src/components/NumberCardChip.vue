<script setup lang="ts">
const NUMBER_WORDS: Record<number, string> = {
  0: 'Null',
  1: 'Eins',
  2: 'Zwei',
  3: 'Drei',
  4: 'Vier',
  5: 'Fünf',
  6: 'Sechs',
  7: 'Sieben',
  8: 'Acht',
  9: 'Neun',
  10: 'Zehn',
  11: 'Elf',
  12: 'Zwölf',
}

const LIGHT_NUMBERS = new Set([2, 4, 8, 9])

const props = defineProps<{
  value: number
  selected: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="chip"
    :class="{ selected, light: LIGHT_NUMBERS.has(value) }"
    :style="{ '--chip': `var(--number-${props.value})` }"
    :disabled="disabled"
    :aria-pressed="selected"
    @click="emit('toggle')"
  >
    <span class="num">{{ value }}</span>
    <span class="word">{{ NUMBER_WORDS[value] }}</span>
  </button>
</template>
