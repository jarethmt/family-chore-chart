// Per-device settings that are DELIBERATELY NOT synced — each device owns its own.
// This is also where the family-unit credentials live so we can join the P2P room
// before we've synced any shared data. Nothing here is ever committed to the repo;
// it's written on-device at first run / pairing.

import { reactive, watch } from 'vue'

const KEY = 'fcc.device.v1'

const defaults = {
  familyUnitId: null, // WebRTC room name (random, unguessable)
  roomPassword: null, // shared encryption secret for the room
  houseId: null, // which house this device sits in
  mode: 'kid', // 'kid' | 'parent'
  assignedChildId: null, // pin a tablet to one child, or…
  kidPicker: true, // …show a "who are you?" picker on shared tablets
  parentPin: null, // gate for the parent area (stored on-device only)
  presenceWake: false, // optional on-device camera presence-wake (off by default)
  soundOn: true,
  reduceMotion: false
}

function load() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { ...defaults }
  }
}

export const device = reactive(load())

watch(
  device,
  (v) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v))
    } catch {
      /* storage full / disabled — non-fatal */
    }
  },
  { deep: true }
)

export function isPaired() {
  return !!(device.familyUnitId && device.roomPassword)
}

export function resetDevice() {
  Object.assign(device, defaults)
}
