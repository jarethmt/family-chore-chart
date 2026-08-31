<script setup>
import { computed } from 'vue'
import { partOfDay } from '../lib/daykey.js'
import { state } from '../store/doc.js'

const props = defineProps({
  name: { type: String, default: '' },
  mood: { type: String, default: 'idle' } // idle | cheer | sleepy
})

const part = computed(() => partOfDay(Date.now(), state.meta.familyTimezone))

const face = computed(() => {
  if (props.mood === 'cheer') return '😺'
  if (props.mood === 'sleepy' || part.value === 'evening') return '😽'
  return '🐱'
})

const greeting = computed(() => {
  const who = props.name ? `, ${props.name}` : ''
  if (props.mood === 'cheer') return `Yay${who}! 🎉`
  if (part.value === 'morning') return `Good morning${who}!`
  if (part.value === 'afternoon') return `Hi${who}!`
  return `Almost bedtime${who}!`
})
</script>

<template>
  <div class="mascot" :class="{ cheer: mood === 'cheer' }">
    <div class="face">{{ face }}</div>
    <div class="bubble">{{ greeting }}</div>
  </div>
</template>

<style scoped>
.mascot {
  display: flex;
  align-items: center;
  gap: 12px;
}
.face {
  font-size: 3rem;
  line-height: 1;
  animation: bob 3s ease-in-out infinite;
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.3));
}
.mascot.cheer .face {
  animation: pop 0.5s ease;
}
.bubble {
  background: var(--surface-2);
  border: 1px solid var(--stroke);
  padding: 10px 16px;
  border-radius: 18px 18px 18px 4px;
  font-weight: 800;
  font-size: 1.05rem;
}
@keyframes bob {
  0%,
  100% {
    transform: translateY(0) rotate(-2deg);
  }
  50% {
    transform: translateY(-6px) rotate(2deg);
  }
}
@keyframes pop {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.4) rotate(8deg);
  }
  100% {
    transform: scale(1);
  }
}
</style>
