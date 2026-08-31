<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { device, isPaired } from './store/device.js'
import { state, initDoc } from './store/doc.js'
import { partOfDay } from './lib/daykey.js'
import SetupView from './views/SetupView.vue'
import KidView from './views/KidView.vue'
import ParentView from './views/ParentView.vue'

const view = ref(device.mode === 'parent' ? 'parent' : 'kid') // 'kid' | 'parent'
const booted = ref(false)

function boot() {
  if (isPaired()) {
    try {
      initDoc()
    } catch (e) {
      console.warn(e)
    }
  }
  booted.value = true
}

onMounted(boot)

// If the device gets paired during this session (setup/join), spin the doc up.
watch(
  () => device.familyUnitId,
  (id) => {
    if (id && !state.ready && isPaired()) {
      try {
        initDoc()
      } catch (e) {
        console.warn(e)
      }
    }
  }
)

// Follow the device's role: creating a family sets mode='parent', a tablet sets 'kid'.
watch(
  () => device.mode,
  (m) => {
    view.value = m === 'parent' ? 'parent' : 'kid'
  }
)

const paired = computed(() => isPaired())

// Theme + evening dimming applied to <html>.
const theme = computed(() => state.meta.theme || 'cats')
watch(
  [theme, () => device.reduceMotion],
  () => {
    document.documentElement.dataset.theme = theme.value
    document.documentElement.style.setProperty(
      'scroll-behavior',
      device.reduceMotion ? 'auto' : 'smooth'
    )
  },
  { immediate: true }
)

// Evening dim, re-checked periodically.
const evening = ref(false)
function refreshEvening() {
  evening.value = partOfDay(Date.now(), state.meta.familyTimezone) === 'evening'
  document.documentElement.dataset.evening = String(evening.value)
}
onMounted(() => {
  refreshEvening()
  setInterval(refreshEvening, 60_000)
})

function goParent() {
  view.value = 'parent'
}
function goKid() {
  view.value = 'kid'
}
</script>

<template>
  <SetupView v-if="booted && !paired" />
  <ParentView v-else-if="booted && view === 'parent'" @back="goKid" />
  <KidView v-else-if="booted" @parent="goParent" />
  <div v-else class="center muted" style="padding-top: 40vh">Loading…</div>
</template>
