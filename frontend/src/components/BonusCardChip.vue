<script setup lang="ts">
defineProps<{
  label: string
  selected: boolean
  disabled?: boolean
  variant?: 'bonus' | 'double'
}>()

const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="chip"
    :class="[variant === 'double' ? 'double' : 'bonus', { selected }]"
    :disabled="disabled"
    :aria-pressed="selected"
    @click="emit('toggle')"
  >
    <span class="num">{{ label }}</span>
  </button>
</template>
