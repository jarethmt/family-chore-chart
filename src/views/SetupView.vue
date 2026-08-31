<script setup>
import { ref, computed } from 'vue'
import { device } from '../store/device.js'
import { state, initDoc, createFamily } from '../store/doc.js'
import { mintFamilyUnit } from '../store/pairing.js'
import { newId } from '../lib/id.js'
import { guessTimeZone } from '../lib/daykey.js'
import PairPanel from '../components/PairPanel.vue'

const step = ref('choose') // choose | create | join | configure

const AVATARS = ['cat', 'dog', 'fox', 'bunny', 'bear', 'panda', 'unicorn', 'frog']
const AVA_EMOJI = { cat: '🐱', dog: '🐶', fox: '🦊', bunny: '🐰', bear: '🐻', panda: '🐼', unicorn: '🦄', frog: '🐸' }

// create form. Most families have ONE home; split households can add more.
const form = ref({
  familyName: '',
  parentName: '',
  childName: '',
  childAge: '',
  childAvatar: 'cat',
  houses: [{ id: newId('house'), name: 'Home' }],
  resetHour: 4
})

function addHome() {
  form.value.houses.push({ id: newId('house'), name: 'Home ' + (form.value.houses.length + 1) })
}
function removeHome(i) {
  if (form.value.houses.length > 1) form.value.houses.splice(i, 1)
}

const childId = ref(newId('kid'))

function doCreate() {
  if (!form.value.childName.trim()) {
    alert('Please enter your child’s name.')
    return
  }
  mintFamilyUnit()
  initDoc()
  const houses = form.value.houses.map((h, i) => ({
    id: h.id,
    name: (h.name || '').trim() || (form.value.houses.length > 1 ? 'Home ' + (i + 1) : 'Home')
  }))
  createFamily({
    familyName: form.value.familyName,
    parents: form.value.parentName ? [{ id: newId('par'), name: form.value.parentName, role: 'parent' }] : [],
    children: [
      { id: childId.value, name: form.value.childName, age: form.value.childAge, avatar: form.value.childAvatar }
    ],
    houses,
    timezone: guessTimeZone(),
    resetHour: Number(form.value.resetHour),
    theme: 'cats'
  })
  // The creating device is a parent's phone, sitting in house 1 by default.
  device.houseId = houses[0].id
  device.mode = 'parent'
  // App re-renders into the parent view now that we're paired.
}

// join flow
const cfgHouse = ref(null)
const cfgMode = ref('kid')
const cfgChild = ref(null)

function onJoined() {
  initDoc()
  step.value = 'configure'
}

function finishJoin() {
  device.houseId = cfgHouse.value || (state.profile.houses?.[0]?.id ?? null)
  device.mode = cfgMode.value
  device.assignedChildId = cfgMode.value === 'kid' ? cfgChild.value : null
  device.kidPicker = !cfgChild.value
  // paired + configured → App shows the right view
  location.reload() // clean remount into the app
}

const syncedHouses = computed(() => state.profile.houses || [])
const syncedChildren = computed(() => state.profile.children || [])
</script>

<template>
  <div class="setup">
    <div class="hero center">
      <div class="logo">🐱</div>
      <h1>Family Chore Chart</h1>
      <p class="muted">Private, offline, and free. Your data stays on your devices.</p>
    </div>

    <!-- CHOOSE -->
    <div v-if="step === 'choose'" class="grid choices">
      <button class="choice card" @click="step = 'create'">
        <fa :icon="['fas', 'users']" />
        <span>Create a new family</span>
        <small class="muted">Start fresh on this device</small>
      </button>
      <button class="choice card" @click="step = 'join'">
        <fa :icon="['fas', 'qrcode']" />
        <span>Join a family</span>
        <small class="muted">I have a code from another device</small>
      </button>
    </div>

    <!-- CREATE -->
    <div v-else-if="step === 'create'" class="card panel">
      <h2>Create your family</h2>
      <label>Family name (optional)</label>
      <input v-model="form.familyName" placeholder="The Smiths" />
      <label>Your name (a grown-up)</label>
      <input v-model="form.parentName" placeholder="e.g. Mom or Dad" />

      <div class="kidblock">
        <label>Child’s name</label>
        <input v-model="form.childName" placeholder="Your kiddo" />
        <div class="row">
          <div style="flex: 1">
            <label>Age (optional)</label>
            <input v-model="form.childAge" inputmode="numeric" placeholder="4" />
          </div>
        </div>
        <label>Pick an avatar</label>
        <div class="avatars">
          <button
            v-for="a in AVATARS"
            :key="a"
            type="button"
            class="ava"
            :class="{ sel: form.childAvatar === a }"
            @click="form.childAvatar = a"
          >
            {{ AVA_EMOJI[a] }}
          </button>
        </div>
      </div>

      <label>Home{{ form.houses.length > 1 ? 's' : '' }}</label>
      <p class="muted small" style="margin: 0 0 8px">
        Most families have one home. If {{ form.childName || 'your child' }} splits time between
        places (like two houses), add one for each.
      </p>
      <div v-for="(h, i) in form.houses" :key="h.id" class="row" style="margin-bottom: 8px">
        <fa :icon="['fas', 'house']" />
        <input v-model="h.name" :placeholder="'Home ' + (i + 1)" style="flex: 1" />
        <button v-if="form.houses.length > 1" type="button" class="btn ghost danger" @click="removeHome(i)">
          <fa :icon="['fas', 'xmark']" />
        </button>
      </div>
      <button type="button" class="btn ghost" @click="addHome">
        <fa :icon="['fas', 'plus']" /> Add another home
      </button>

      <label>New day starts at</label>
      <select v-model="form.resetHour">
        <option v-for="h in [0,1,2,3,4,5,6,7]" :key="h" :value="h">{{ h }}:00 am</option>
      </select>

      <div class="row" style="margin-top: 18px">
        <button class="btn ghost" @click="step = 'choose'"><fa :icon="['fas', 'arrow-left']" /> Back</button>
        <div class="spacer" />
        <button class="btn primary big" @click="doCreate">Create family <fa :icon="['fas', 'arrow-right']" /></button>
      </div>
    </div>

    <!-- JOIN -->
    <div v-else-if="step === 'join'" class="card panel">
      <h2>Join a family</h2>
      <PairPanel mode="join" @joined="onJoined" />
      <button class="btn ghost" style="margin-top: 12px" @click="step = 'choose'">
        <fa :icon="['fas', 'arrow-left']" /> Back
      </button>
    </div>

    <!-- CONFIGURE (after join) -->
    <div v-else-if="step === 'configure'" class="card panel">
      <h2>Set up this device</h2>
      <p class="muted">Paired! Now tell us what this device is for.</p>

      <label>Which house is this device in?</label>
      <select v-model="cfgHouse">
        <option :value="null" disabled>Choose a house…</option>
        <option v-for="h in syncedHouses" :key="h.id" :value="h.id">{{ h.name }}</option>
      </select>
      <p v-if="!syncedHouses.length" class="muted"><fa :icon="['fas', 'wifi']" /> Waiting to sync from the other device…</p>

      <label>This device is for…</label>
      <div class="row modes">
        <button class="btn" :class="{ primary: cfgMode === 'kid' }" @click="cfgMode = 'kid'">
          <fa :icon="['fas', 'child']" /> A kid (tablet)
        </button>
        <button class="btn" :class="{ primary: cfgMode === 'parent' }" @click="cfgMode = 'parent'">
          <fa :icon="['fas', 'users']" /> A grown-up (phone)
        </button>
      </div>

      <template v-if="cfgMode === 'kid' && syncedChildren.length">
        <label>Pin this tablet to one kid? (optional)</label>
        <select v-model="cfgChild">
          <option :value="null">Show a “who’s here?” picker</option>
          <option v-for="c in syncedChildren" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </template>

      <button class="btn primary big" style="width: 100%; margin-top: 18px" @click="finishJoin">
        Done <fa :icon="['fas', 'circle-check']" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.setup {
  max-width: 560px;
  margin: 0 auto;
  padding-top: 6vh;
}
.hero .logo {
  font-size: 3.5rem;
}
.hero h1 {
  margin: 8px 0 4px;
}
.choices {
  grid-template-columns: 1fr 1fr;
  margin-top: 24px;
}
.choice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 26px 16px;
  font-weight: 800;
  font-size: 1.05rem;
}
.choice > svg {
  font-size: 2rem;
  color: var(--accent);
}
.panel {
  padding: 20px;
  margin-top: 20px;
}
.kidblock {
  margin: 10px 0;
  padding: 14px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--stroke);
}
.avatars,
.modes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ava {
  width: 48px;
  height: 48px;
  font-size: 1.6rem;
  border-radius: 12px;
  background: var(--surface);
  border: 2px solid transparent;
}
.ava.sel {
  border-color: var(--accent);
}
@media (max-width: 480px) {
  .choices {
    grid-template-columns: 1fr;
  }
}
</style>
