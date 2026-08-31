<script setup>
import { ref, computed, watch } from 'vue'
import { state, visibleChores, isDone, toggleCompletion, balance } from '../store/doc.js'
import { device } from '../store/device.js'
import { partOfDay } from '../lib/daykey.js'
import { playChime, burst } from '../lib/celebrate.js'
import Mascot from '../components/Mascot.vue'
import StarJar from '../components/StarJar.vue'
import ChoreCard from '../components/ChoreCard.vue'
import KidPicker from '../components/KidPicker.vue'
import RewardShop from '../components/RewardShop.vue'

const emit = defineEmits(['parent'])

const children = computed(() => state.profile.children || [])
const picked = ref(null)

// Which child is this board for?
const activeChildId = computed(() => {
  if (device.assignedChildId) return device.assignedChildId
  if (children.value.length === 1) return children.value[0].id
  return picked.value
})
const activeChild = computed(() => children.value.find((c) => c.id === activeChildId.value))

const showShop = ref(false)
const mood = ref('idle')

const morning = computed(() =>
  activeChildId.value ? visibleChores(activeChildId.value, device.houseId, 'morning') : []
)
const evening = computed(() =>
  activeChildId.value ? visibleChores(activeChildId.value, device.houseId, 'evening') : []
)
const allChores = computed(() => [...morning.value, ...evening.value])
const doneCount = computed(() => allChores.value.filter((c) => isDone(c.id, activeChildId.value)).length)
const bal = computed(() => (activeChildId.value ? balance(activeChildId.value) : 0))

const focusEvening = computed(() => partOfDay(Date.now(), state.meta.familyTimezone) === 'evening')

function toggle(chore) {
  const before = doneCount.value
  toggleCompletion(chore, activeChildId.value, device.houseId)
  // Section-complete celebration.
  requestAnimationFrame(() => {
    if (doneCount.value === allChores.value.length && allChores.value.length && doneCount.value > before) {
      mood.value = 'cheer'
      playChime('section')
      burst(window.innerWidth / 2, window.innerHeight / 3, 40)
      setTimeout(() => (mood.value = 'idle'), 2500)
    }
  })
}

function pick(id) {
  picked.value = id
  playChime('tap')
}

// Reset the picker if the child list changes out from under us.
watch(children, () => {
  if (picked.value && !children.value.find((c) => c.id === picked.value)) picked.value = null
})

const needsPicker = computed(
  () => !activeChildId.value && children.value.length > 1
)
</script>

<template>
  <div>
    <div class="app-header">
      <div class="pill dim"><fa :icon="['fas', 'house']" /> {{ state.profile.houses?.find(h => h.id === device.houseId)?.name || 'Home' }}</div>
      <div class="spacer" />
      <div class="pill" :class="{ ok: state.peers > 0 }">
        <fa :icon="['fas', 'wifi']" /> {{ state.peers > 0 ? state.peers + ' synced' : 'offline ok' }}
      </div>
      <button class="btn ghost" title="Grown-ups" @click="emit('parent')">
        <fa :icon="['fas', 'gear']" />
      </button>
    </div>

    <KidPicker v-if="needsPicker" :children="children" @pick="pick" />

    <div v-else-if="!activeChildId" class="center muted" style="padding-top: 20vh">
      <p>No kids set up yet.</p>
      <button class="btn primary" @click="emit('parent')">Open grown-up setup</button>
    </div>

    <template v-else>
      <div class="topbar">
        <Mascot :name="activeChild?.name" :mood="mood" />
        <StarJar :balance="bal" :done="doneCount" :total="allChores.length" />
      </div>

      <button class="btn primary big shopbtn" @click="showShop = true">
        <fa :icon="['fas', 'gift']" /> Prize Shop
      </button>

      <section v-if="morning.length" class="section" :class="{ dim: focusEvening }">
        <h2><fa :icon="['fas', 'sun']" /> Morning</h2>
        <div class="grid">
          <ChoreCard
            v-for="c in morning"
            :key="c.id"
            :chore="c"
            :done="isDone(c.id, activeChildId)"
            @toggle="toggle(c)"
          />
        </div>
      </section>

      <section v-if="evening.length" class="section" :class="{ dim: !focusEvening }">
        <h2><fa :icon="['fas', 'moon']" /> Evening</h2>
        <div class="grid">
          <ChoreCard
            v-for="c in evening"
            :key="c.id"
            :chore="c"
            :done="isDone(c.id, activeChildId)"
            @toggle="toggle(c)"
          />
        </div>
      </section>

      <p v-if="!allChores.length" class="muted center" style="padding: 40px 0">
        No chores yet — a grown-up can add some in setup. 🐾
      </p>

      <RewardShop v-if="showShop" :child-id="activeChildId" :balance="bal" @close="showShop = false" />
    </template>
  </div>
</template>

<style scoped>
.topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}
.shopbtn {
  width: 100%;
  margin-bottom: 18px;
}
.section {
  margin-bottom: 22px;
  transition: opacity 0.3s ease;
}
.section.dim {
  opacity: 0.72;
}
.section h2 {
  font-size: 1.4rem;
  margin: 6px 4px 12px;
}
</style>
