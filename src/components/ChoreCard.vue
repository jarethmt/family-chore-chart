<script setup>
import { ref } from 'vue'
import { iconDefName } from '../lib/icons.js'
import { playChime, burst, vibrate } from '../lib/celebrate.js'

const props = defineProps({
  chore: { type: Object, required: true },
  done: { type: Boolean, default: false }
})
const emit = defineEmits(['toggle'])

const el = ref(null)

function onTap() {
  const nowDone = !props.done
  if (nowDone && el.value) {
    const r = el.value.getBoundingClientRect()
    burst(r.left + r.width / 2, r.top + r.height / 2)
    playChime('done')
  } else {
    playChime('tap')
  }
  vibrate(nowDone ? 24 : 10)
  emit('toggle')
}
</script>

<template>
  <button ref="el" class="chore" :class="{ done }" @click="onTap">
    <span class="check">
      <fa v-if="done" :icon="['fas', 'circle-check']" />
      <span v-else class="empty" />
    </span>
    <span class="icon"><fa :icon="['fas', iconDefName(chore.icon)]" /></span>
    <span class="title">{{ chore.title || 'Chore' }}</span>
    <span class="pts"><fa :icon="['fas', 'star']" /> {{ chore.points }}</span>
  </button>
</template>

<style scoped>
.chore {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 84px;
  padding: 14px 18px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 2px solid var(--stroke);
  box-shadow: var(--shadow);
  text-align: left;
  transition: transform 0.1s ease, border-color 0.2s ease, background 0.2s ease, opacity 0.2s ease;
}
.chore:active {
  transform: scale(0.97);
}
.chore.done {
  border-color: color-mix(in srgb, var(--good) 70%, transparent);
  background: color-mix(in srgb, var(--good) 14%, var(--surface));
}
.chore.done .title {
  text-decoration: line-through;
  color: var(--text-dim);
}
.check {
  font-size: 1.8rem;
  color: var(--good);
  width: 32px;
  display: grid;
  place-items: center;
}
.empty {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 3px dashed var(--stroke);
  display: block;
}
.icon {
  font-size: 2rem;
  color: var(--accent);
  width: 44px;
  text-align: center;
}
.title {
  font-size: 1.35rem;
  font-weight: 800;
}
.pts {
  font-weight: 900;
  color: var(--warn);
  white-space: nowrap;
  font-size: 1rem;
}
</style>
