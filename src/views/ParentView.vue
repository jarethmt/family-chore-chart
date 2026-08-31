<script setup>
import { ref, computed } from 'vue'
import {
  state, addChore, updateChore, deleteChore, moveChore,
  addReward, updateReward, deleteReward,
  pendingRedemptions, resolveRedemption,
  balance, childStreak, earnedPoints,
  setMeta, setProfileField, upsertChild, removeChild, upsertHouse
} from '../store/doc.js'
import { device, resetDevice } from '../store/device.js'
import { newId } from '../lib/id.js'
import IconPicker from '../components/IconPicker.vue'
import PairPanel from '../components/PairPanel.vue'

const emit = defineEmits(['back'])

// ---- PIN gate ----
const unlocked = ref(!device.parentPin)
const pinEntry = ref('')
const pinErr = ref(false)
function tryPin() {
  if (pinEntry.value === device.parentPin) unlocked.value = true
  else { pinErr.value = true; pinEntry.value = '' }
}
const newPin = ref('')
function setPin() {
  if (newPin.value.length >= 4) { device.parentPin = newPin.value; newPin.value = '' }
}
function clearPin() { device.parentPin = null }

const tab = ref('chores')
const TABS = [
  { id: 'chores', label: 'Chores', icon: 'list-check' },
  { id: 'rewards', label: 'Prizes', icon: 'gift' },
  { id: 'requests', label: 'Requests', icon: 'circle-check' },
  { id: 'family', label: 'Family', icon: 'users' },
  { id: 'device', label: 'This device', icon: 'house' },
  { id: 'add', label: 'Add device', icon: 'qrcode' },
  { id: 'advanced', label: 'Settings', icon: 'gear' }
]

const houses = computed(() => state.profile.houses || [])
const children = computed(() => state.profile.children || [])
function houseName(id) { return houses.value.find((h) => h.id === id)?.name || '—' }
function childName(id) { return children.value.find((c) => c.id === id)?.name || 'Any kid' }
function scopeLabel(s) { return s === 'shared' ? 'Both houses' : houseName(s) }

const pending = computed(() => pendingRedemptions())
function rewardTitle(id) { return state.rewards.find((r) => r.id === id)?.title || 'Prize' }

// family editing
const newChild = ref({ name: '', age: '', avatar: 'cat' })
const AVA_EMOJI = { cat: '🐱', dog: '🐶', fox: '🦊', bunny: '🐰', bear: '🐻', panda: '🐼', unicorn: '🦄', frog: '🐸' }
const AVATARS = Object.keys(AVA_EMOJI)
function addKid() {
  if (!newChild.value.name.trim()) return
  upsertChild({ id: newId('kid'), ...newChild.value })
  newChild.value = { name: '', age: '', avatar: 'cat' }
}

function unpair() {
  if (confirm('Reset this device? It will forget the family unit and need to pair again. (Other devices keep all data.)')) {
    resetDevice()
    location.reload()
  }
}

const themes = ['cats', 'space', 'ocean', 'unicorn', 'jungle']
</script>

<template>
  <!-- PIN gate -->
  <div v-if="!unlocked" class="gate">
    <div class="card panel center">
      <div class="logo">🔒</div>
      <h2>Grown-ups only</h2>
      <input v-model="pinEntry" type="password" inputmode="numeric" placeholder="Enter PIN"
        style="text-align: center; letter-spacing: 4px; margin-top: 10px" @keyup.enter="tryPin" />
      <p v-if="pinErr" class="err">Wrong PIN, try again.</p>
      <div class="row" style="justify-content: center; margin-top: 14px">
        <button class="btn ghost" @click="emit('back')">Back to kid view</button>
        <button class="btn primary" @click="tryPin">Unlock</button>
      </div>
    </div>
  </div>

  <div v-else>
    <div class="app-header">
      <button class="btn ghost" @click="emit('back')"><fa :icon="['fas', 'arrow-left']" /> Kid view</button>
      <div class="spacer" />
      <div class="pill" :class="{ ok: state.peers > 0 }">
        <fa :icon="['fas', 'wifi']" /> {{ state.peers > 0 ? state.peers + ' synced' : 'offline' }}
      </div>
    </div>

    <nav class="tabs">
      <button v-for="t in TABS" :key="t.id" class="tabbtn" :class="{ on: tab === t.id }" @click="tab = t.id">
        <fa :icon="['fas', t.icon]" /> <span>{{ t.label }}</span>
        <span v-if="t.id === 'requests' && pending.length" class="badge">{{ pending.length }}</span>
      </button>
    </nav>

    <!-- CHORES -->
    <section v-if="tab === 'chores'">
      <div class="row"><h2 style="margin:0">Chores</h2><div class="spacer" />
        <button class="btn primary" @click="addChore({})"><fa :icon="['fas','plus']" /> Add chore</button>
      </div>
      <p v-if="!state.chores.length" class="muted">No chores yet. Add the first one!</p>
      <div v-for="(c, i) in state.chores" :key="c.id" class="card editrow">
        <div class="row">
          <IconPicker :model-value="c.icon" @update:model-value="v => updateChore(c.id, { icon: v })" />
          <input :value="c.title" placeholder="Chore name" @input="e => updateChore(c.id, { title: e.target.value })" style="flex:1" />
          <div class="movecol">
            <button class="btn ghost" @click="moveChore(c.id, -1)" :disabled="i===0"><fa :icon="['fas','chevron-up']" /></button>
            <button class="btn ghost" @click="moveChore(c.id, 1)" :disabled="i===state.chores.length-1"><fa :icon="['fas','chevron-down']" /></button>
          </div>
        </div>
        <div class="fieldgrid">
          <div>
            <label>When</label>
            <select :value="c.timeOfDay" @change="e => updateChore(c.id, { timeOfDay: e.target.value })">
              <option value="morning">☀️ Morning</option>
              <option value="evening">🌙 Evening</option>
            </select>
          </div>
          <div v-if="houses.length > 1">
            <label>Shows at</label>
            <select :value="c.scope" @change="e => updateChore(c.id, { scope: e.target.value })">
              <option value="shared">All homes</option>
              <option v-for="h in houses" :key="h.id" :value="h.id">{{ h.name }} only</option>
            </select>
          </div>
          <div>
            <label>For</label>
            <select :value="c.childId || ''" @change="e => updateChore(c.id, { childId: e.target.value || null })">
              <option value="">Any kid</option>
              <option v-for="k in children" :key="k.id" :value="k.id">{{ k.name }}</option>
            </select>
          </div>
          <div>
            <label>Stars</label>
            <input type="number" min="1" :value="c.points" @input="e => updateChore(c.id, { points: Math.max(1, Number(e.target.value)||1) })" />
          </div>
        </div>
        <div class="row">
          <label style="margin:0"><input type="checkbox" style="width:auto" :checked="c.active" @change="e => updateChore(c.id, { active: e.target.checked })" /> Active</label>
          <div class="spacer" />
          <button class="btn ghost danger" @click="deleteChore(c.id)"><fa :icon="['fas','trash-can']" /> Delete</button>
        </div>
      </div>
    </section>

    <!-- REWARDS -->
    <section v-else-if="tab === 'rewards'">
      <div class="row"><h2 style="margin:0">Prizes</h2><div class="spacer" />
        <button class="btn primary" @click="addReward({})"><fa :icon="['fas','plus']" /> Add prize</button>
      </div>
      <p v-if="!state.rewards.length" class="muted">Add prizes kids can redeem their stars for.</p>
      <div v-for="r in state.rewards" :key="r.id" class="card editrow">
        <div class="row">
          <IconPicker :model-value="r.icon" @update:model-value="v => updateReward(r.id, { icon: v })" />
          <input :value="r.title" placeholder="Prize name (e.g. Extra story)" @input="e => updateReward(r.id, { title: e.target.value })" style="flex:1" />
        </div>
        <div class="fieldgrid">
          <div>
            <label>Cost (stars)</label>
            <input type="number" min="1" :value="r.costPoints" @input="e => updateReward(r.id, { costPoints: Math.max(1, Number(e.target.value)||1) })" />
          </div>
          <div>
            <label>For</label>
            <select :value="r.childId || ''" @change="e => updateReward(r.id, { childId: e.target.value || null })">
              <option value="">Any kid</option>
              <option v-for="k in children" :key="k.id" :value="k.id">{{ k.name }}</option>
            </select>
          </div>
        </div>
        <div class="row">
          <label style="margin:0"><input type="checkbox" style="width:auto" :checked="r.active" @change="e => updateReward(r.id, { active: e.target.checked })" /> Active</label>
          <div class="spacer" />
          <button class="btn ghost danger" @click="deleteReward(r.id)"><fa :icon="['fas','trash-can']" /> Delete</button>
        </div>
      </div>
    </section>

    <!-- REQUESTS -->
    <section v-else-if="tab === 'requests'">
      <h2>Prize requests</h2>
      <p v-if="!pending.length" class="muted">No pending requests. 🎉</p>
      <div v-for="req in pending" :key="req.id" class="card editrow">
        <div class="row">
          <div style="flex:1">
            <strong>{{ childName(req.childId) }}</strong> wants <strong>{{ rewardTitle(req.rewardId) }}</strong>
            <div class="muted"><fa :icon="['fas','star']" /> {{ req.costPoints }} stars · balance now {{ balance(req.childId) }}</div>
          </div>
        </div>
        <div class="row">
          <button class="btn danger ghost" @click="resolveRedemption(req.id, 'denied', 'parent')"><fa :icon="['fas','circle-xmark']" /> Not yet</button>
          <div class="spacer" />
          <button class="btn primary" :disabled="balance(req.childId) < req.costPoints"
            @click="resolveRedemption(req.id, 'approved', 'parent')">
            <fa :icon="['fas','circle-check']" /> Approve
          </button>
        </div>
      </div>
    </section>

    <!-- FAMILY -->
    <section v-else-if="tab === 'family'">
      <h2>Family</h2>
      <label>Family name</label>
      <input :value="state.profile.familyName" @input="e => setProfileField('familyName', e.target.value)" placeholder="The Smiths" />

      <h3>Kids</h3>
      <div v-for="k in children" :key="k.id" class="card editrow">
        <div class="row">
          <span class="ava-lg">{{ AVA_EMOJI[k.avatar] || '🐱' }}</span>
          <input :value="k.name" @input="e => upsertChild({ id: k.id, name: e.target.value })" style="flex:1" />
          <input :value="k.age" @input="e => upsertChild({ id: k.id, age: e.target.value })" placeholder="age" style="width:70px" />
          <button class="btn ghost danger" @click="removeChild(k.id)"><fa :icon="['fas','trash-can']" /></button>
        </div>
        <div class="avatars">
          <button v-for="a in AVATARS" :key="a" class="ava" :class="{ sel: k.avatar===a }" @click="upsertChild({ id: k.id, avatar: a })">{{ AVA_EMOJI[a] }}</button>
        </div>
      </div>
      <div class="card editrow">
        <label>Add a kid</label>
        <div class="row">
          <input v-model="newChild.name" placeholder="Name" style="flex:1" />
          <input v-model="newChild.age" placeholder="Age" style="width:70px" />
          <button class="btn primary" @click="addKid"><fa :icon="['fas','plus']" /></button>
        </div>
      </div>

      <h3>Houses</h3>
      <div v-for="h in houses" :key="h.id" class="row" style="margin-bottom:8px">
        <fa :icon="['fas','house']" />
        <input :value="h.name" @input="e => upsertHouse({ id: h.id, name: e.target.value })" style="flex:1" />
      </div>
      <button class="btn ghost" @click="upsertHouse({ id: newId('house'), name: 'New house' })"><fa :icon="['fas','plus']" /> Add house</button>

      <h3>Progress</h3>
      <div v-for="k in children" :key="k.id" class="card editrow">
        <strong>{{ k.name }}</strong>
        <div class="statrow">
          <span class="pill"><fa :icon="['fas','star']" /> {{ balance(k.id) }} now</span>
          <span class="pill">{{ earnedPoints(k.id) }} earned total</span>
          <span class="pill"><fa :icon="['fas','sun']" /> {{ childStreak(k.id) }} day streak</span>
        </div>
      </div>
    </section>

    <!-- THIS DEVICE -->
    <section v-else-if="tab === 'device'">
      <h2>This device</h2>
      <label>Which house is this device in?</label>
      <select v-model="device.houseId">
        <option v-for="h in houses" :key="h.id" :value="h.id">{{ h.name }}</option>
      </select>
      <label>This device shows…</label>
      <div class="row modes">
        <button class="btn" :class="{ primary: device.mode==='kid' }" @click="device.mode='kid'"><fa :icon="['fas','child']" /> Kid view</button>
        <button class="btn" :class="{ primary: device.mode==='parent' }" @click="device.mode='parent'"><fa :icon="['fas','users']" /> Grown-up</button>
      </div>
      <template v-if="device.mode==='kid'">
        <label>Pin this tablet to one kid?</label>
        <select v-model="device.assignedChildId">
          <option :value="null">Show a “who’s here?” picker</option>
          <option v-for="k in children" :key="k.id" :value="k.id">{{ k.name }}</option>
        </select>
      </template>
      <h3>Comfort</h3>
      <label><input type="checkbox" style="width:auto" v-model="device.soundOn" /> Sounds</label>
      <label><input type="checkbox" style="width:auto" v-model="device.reduceMotion" /> Reduce motion / calmer animations</label>
      <label><input type="checkbox" style="width:auto" v-model="device.presenceWake" /> Camera presence-wake (optional, off by default)</label>
      <p class="muted small"><fa :icon="['fas','circle-info']" /> Presence-wake uses the front camera on-device only (no images saved or sent) to greet when someone walks up. Costs battery and may be suspended by iOS when the screen is dim. Detects presence only — not who. Leave off unless you want it.</p>
    </section>

    <!-- ADD DEVICE -->
    <section v-else-if="tab === 'add'">
      <h2>Add another device</h2>
      <PairPanel mode="show" />
    </section>

    <!-- ADVANCED -->
    <section v-else-if="tab === 'advanced'">
      <h2>Settings</h2>
      <label>Theme</label>
      <select :value="state.meta.theme" @change="e => setMeta('theme', e.target.value)">
        <option v-for="t in themes" :key="t" :value="t">{{ t }}</option>
      </select>
      <label>New day starts at</label>
      <select :value="state.meta.dayResetHour" @change="e => setMeta('dayResetHour', Number(e.target.value))">
        <option v-for="h in [0,1,2,3,4,5,6,7]" :key="h" :value="h">{{ h }}:00 am</option>
      </select>
      <label>Family timezone</label>
      <input :value="state.meta.familyTimezone" @change="e => setMeta('familyTimezone', e.target.value)" placeholder="America/New_York" />
      <p class="muted small">Used so every device agrees which day a chore counts for.</p>

      <h3>Grown-up PIN</h3>
      <div v-if="device.parentPin" class="row">
        <span class="pill ok"><fa :icon="['fas','lock']" /> PIN set</span>
        <button class="btn ghost danger" @click="clearPin">Remove PIN</button>
      </div>
      <div v-else class="row">
        <input v-model="newPin" type="password" inputmode="numeric" placeholder="Set a PIN (4+ digits)" style="flex:1" />
        <button class="btn primary" @click="setPin">Set</button>
      </div>

      <h3>Danger zone</h3>
      <button class="btn ghost danger" @click="unpair"><fa :icon="['fas','triangle-exclamation']" /> Reset this device (unpair)</button>
    </section>
  </div>
</template>

<style scoped>
.gate { padding-top: 15vh; max-width: 420px; margin: 0 auto; }
.gate .logo { font-size: 3rem; }
.panel { padding: 24px; }
.tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 10px; margin-bottom: 12px; }
.tabbtn { position: relative; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; border-radius: 999px; background: var(--surface); border: 1px solid var(--stroke); font-weight: 800; font-size: .9rem; }
.tabbtn.on { background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #241633; border: none; }
.badge { background: var(--bad); color: #fff; border-radius: 999px; font-size: .7rem; padding: 1px 7px; }
.editrow { padding: 14px; margin-bottom: 12px; }
.fieldgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin: 10px 0; }
.fieldgrid label { margin: 4px 0; font-size: .8rem; }
.movecol { display: flex; flex-direction: column; gap: 4px; }
.avatars { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.ava { width: 42px; height: 42px; font-size: 1.4rem; border-radius: 10px; background: var(--surface); border: 2px solid transparent; }
.ava.sel { border-color: var(--accent); }
.ava-lg { font-size: 2rem; }
.statrow { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.small { font-size: .8rem; }
.err { color: var(--bad); font-weight: 700; }
h3 { margin: 22px 0 8px; }
</style>
