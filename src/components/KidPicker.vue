<script setup>
defineProps({
  children: { type: Array, default: () => [] }
})
const emit = defineEmits(['pick'])

const AVATARS = {
  cat: '🐱',
  dog: '🐶',
  fox: '🦊',
  bunny: '🐰',
  bear: '🐻',
  panda: '🐼',
  unicorn: '🦄',
  frog: '🐸'
}
</script>

<template>
  <div class="picker">
    <h2 class="center">Who's here?</h2>
    <div class="kids">
      <button v-for="kid in children" :key="kid.id" class="kid card" @click="emit('pick', kid.id)">
        <span class="ava">{{ AVATARS[kid.avatar] || '🐱' }}</span>
        <span class="name">{{ kid.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.picker {
  padding-top: 8vh;
}
.kids {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  justify-content: center;
  margin-top: 20px;
}
.kid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 28px;
  min-width: 130px;
  transition: transform 0.1s ease;
}
.kid:active {
  transform: scale(0.95);
}
.ava {
  font-size: 3.4rem;
}
.name {
  font-weight: 900;
  font-size: 1.3rem;
}
</style>
