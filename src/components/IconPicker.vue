<script setup>
import { ref } from 'vue'
import { CHORE_ICONS } from '../lib/icons.js'

const props = defineProps({
  modelValue: { type: String, default: 'list-check' }
})
const emit = defineEmits(['update:modelValue'])
const open = ref(false)

function choose(name) {
  emit('update:modelValue', name)
  open.value = false
}

function defName(name) {
  const f = CHORE_ICONS.find((i) => i.name === name)
  return f ? f.def.iconName : 'list-check'
}
</script>

<template>
  <div class="iconpick">
    <button type="button" class="current" @click="open = !open">
      <fa :icon="['fas', defName(modelValue)]" />
    </button>
    <div v-if="open" class="grid-pop card">
      <button
        v-for="i in CHORE_ICONS"
        :key="i.name"
        type="button"
        class="opt"
        :class="{ sel: i.name === modelValue }"
        :title="i.label"
        @click="choose(i.name)"
      >
        <fa :icon="['fas', i.def.iconName]" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.iconpick {
  position: relative;
}
.current {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--stroke);
  font-size: 1.5rem;
  color: var(--accent);
}
.grid-pop {
  position: absolute;
  z-index: 30;
  top: 58px;
  left: 0;
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  width: min(88vw, 340px);
  max-height: 300px;
  overflow: auto;
}
.opt {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid transparent;
  font-size: 1.25rem;
  color: var(--text);
}
.opt.sel {
  border-color: var(--accent);
  color: var(--accent);
}
</style>
