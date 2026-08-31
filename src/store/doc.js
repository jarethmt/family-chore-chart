// The shared, local-first data layer.
//
// Everything the family shares lives in ONE Yjs document, persisted to IndexedDB on
// every device and synced peer-to-peer via WebRTC (encrypted with the room password).
// There is no server holding data — each device has the full copy and merges edits
// conflict-free (CRDT). Completions and redemptions are append-only so offline edits
// from two houses always merge cleanly.

import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { WebrtcProvider } from 'y-webrtc'
import { reactive } from 'vue'
import { newId } from '../lib/id.js'
import { dayKey, todayKey, streakLength, guessTimeZone } from '../lib/daykey.js'
import { device } from './device.js'

// Public signaling used ONLY for the initial NAT-traversal handshake. It never sees
// chore data (payloads are DTLS + room-password encrypted). Swap for our own tiny
// stateless signaling if the app ever gets popular — see the plan's honest caveat.
export const SIGNALING = ['wss://signaling.yjs.dev', 'wss://y-webrtc-eu.fly.dev']

let ydoc = null
let persistence = null
let provider = null

let yMeta, yProfile, yChores, yRewards, yCompletions, yRedemptions

export const state = reactive({
  ready: false, // IndexedDB loaded
  peers: 0, // connected P2P peers
  meta: {}, // { dayResetHour, familyTimezone, theme }
  profile: {}, // { familyName, parents[], children[], houses[] }
  chores: [],
  rewards: [],
  completions: [],
  redemptions: []
})

function rebuild() {
  state.meta = yMeta.toJSON()
  state.profile = yProfile.toJSON()
  state.chores = yChores.toArray()
  state.rewards = yRewards.toArray()
  state.completions = yCompletions.toArray()
  state.redemptions = yRedemptions.toArray()
}

export function initDoc() {
  if (ydoc) return
  if (!device.familyUnitId || !device.roomPassword) {
    throw new Error('Cannot init doc before a family unit exists')
  }
  ydoc = new Y.Doc()
  yMeta = ydoc.getMap('meta')
  yProfile = ydoc.getMap('familyProfile')
  yChores = ydoc.getArray('chores')
  yRewards = ydoc.getArray('rewards')
  yCompletions = ydoc.getArray('completions')
  yRedemptions = ydoc.getArray('redemptions')

  persistence = new IndexeddbPersistence('fcc-' + device.familyUnitId, ydoc)
  persistence.once('synced', () => {
    state.ready = true
    rebuild()
  })

  provider = new WebrtcProvider(device.familyUnitId, ydoc, {
    password: device.roomPassword,
    signaling: SIGNALING,
    maxConns: 20
  })
  provider.on('peers', ({ webrtcPeers, bcPeers }) => {
    state.peers = new Set([...(webrtcPeers || []), ...(bcPeers || [])]).size
  })

  ydoc.on('update', rebuild)
  rebuild()
}

export function destroyDoc() {
  if (provider) provider.destroy()
  if (persistence) persistence.destroy()
  if (ydoc) ydoc.destroy()
  ydoc = persistence = provider = null
}

// ---- helpers ----------------------------------------------------------------

const tz = () => state.meta.familyTimezone || guessTimeZone()
const resetHour = () => (state.meta.dayResetHour ?? 4)

export function today() {
  return todayKey(tz(), resetHour())
}

// ---- family creation / profile ----------------------------------------------

export function createFamily({ familyName, parents, children, houses, timezone, resetHour: rh, theme }) {
  ydoc.transact(() => {
    yMeta.set('familyTimezone', timezone || guessTimeZone())
    yMeta.set('dayResetHour', rh ?? 4)
    yMeta.set('theme', theme || 'cats')
    yProfile.set('familyName', familyName || '')
    yProfile.set('parents', parents || [])
    yProfile.set('children', children || [])
    yProfile.set('houses', houses || [])
  })
}

export function setMeta(key, value) {
  ydoc.transact(() => yMeta.set(key, value))
}

export function setProfileField(key, value) {
  ydoc.transact(() => yProfile.set(key, value))
}

export function upsertChild(child) {
  const list = [...(state.profile.children || [])]
  const idx = list.findIndex((c) => c.id === child.id)
  if (idx >= 0) list[idx] = { ...list[idx], ...child }
  else list.push({ id: child.id || newId('kid'), avatar: 'cat', ...child })
  setProfileField('children', list)
}

export function removeChild(id) {
  setProfileField('children', (state.profile.children || []).filter((c) => c.id !== id))
}

export function upsertHouse(house) {
  const list = [...(state.profile.houses || [])]
  const idx = list.findIndex((h) => h.id === house.id)
  if (idx >= 0) list[idx] = { ...list[idx], ...house }
  else list.push({ id: house.id || newId('house'), ...house })
  setProfileField('houses', list)
}

// ---- chores -----------------------------------------------------------------

export function addChore(chore) {
  const order = state.chores.length
  yChores.push([
    {
      id: newId('chore'),
      title: '',
      icon: 'list-check',
      childId: null,
      timeOfDay: 'morning',
      scope: 'shared',
      points: 1,
      order,
      active: true,
      ...chore
    }
  ])
}

function choreIndex(id) {
  return state.chores.findIndex((c) => c.id === id)
}

export function updateChore(id, patch) {
  const i = choreIndex(id)
  if (i < 0) return
  const updated = { ...state.chores[i], ...patch }
  ydoc.transact(() => {
    yChores.delete(i, 1)
    yChores.insert(i, [updated])
  })
}

export function deleteChore(id) {
  const i = choreIndex(id)
  if (i >= 0) yChores.delete(i, 1)
}

export function moveChore(id, dir) {
  const i = choreIndex(id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= state.chores.length) return
  ydoc.transact(() => {
    const a = state.chores[i]
    const b = state.chores[j]
    yChores.delete(Math.min(i, j), 2)
    yChores.insert(Math.min(i, j), dir > 0 ? [b, a] : [a, b])
  })
}

// ---- completions (append-only ledger) ---------------------------------------

export function isDone(choreId, childId) {
  const key = today()
  return state.completions.some(
    (c) => c.choreId === choreId && c.childId === childId && c.date === key
  )
}

export function toggleCompletion(chore, childId, houseId) {
  const key = today()
  const existingIdx = state.completions.findIndex(
    (c) => c.choreId === chore.id && c.childId === childId && c.date === key
  )
  if (existingIdx >= 0) {
    yCompletions.delete(existingIdx, 1)
    return false
  }
  yCompletions.push([
    {
      id: newId('done'),
      choreId: chore.id,
      childId,
      houseId: houseId || null,
      date: key,
      points: chore.points ?? 1,
      ts: Date.now()
    }
  ])
  return true
}

// ---- rewards + redemptions --------------------------------------------------

export function addReward(reward) {
  yRewards.push([
    { id: newId('reward'), title: '', icon: 'gift', childId: null, costPoints: 5, active: true, ...reward }
  ])
}

export function updateReward(id, patch) {
  const i = state.rewards.findIndex((r) => r.id === id)
  if (i < 0) return
  const updated = { ...state.rewards[i], ...patch }
  ydoc.transact(() => {
    yRewards.delete(i, 1)
    yRewards.insert(i, [updated])
  })
}

export function deleteReward(id) {
  const i = state.rewards.findIndex((r) => r.id === id)
  if (i >= 0) yRewards.delete(i, 1)
}

export function requestRedemption(reward, childId) {
  yRedemptions.push([
    {
      id: newId('redeem'),
      rewardId: reward.id,
      childId,
      costPoints: reward.costPoints ?? 0,
      status: 'requested',
      requestedTs: Date.now(),
      resolvedTs: null,
      resolvedByParent: null
    }
  ])
}

export function resolveRedemption(id, status, parentName) {
  const i = state.redemptions.findIndex((r) => r.id === id)
  if (i < 0) return
  const updated = {
    ...state.redemptions[i],
    status,
    resolvedTs: Date.now(),
    resolvedByParent: parentName || null
  }
  ydoc.transact(() => {
    yRedemptions.delete(i, 1)
    yRedemptions.insert(i, [updated])
  })
}

// ---- derived numbers --------------------------------------------------------

export function earnedPoints(childId) {
  return state.completions
    .filter((c) => c.childId === childId)
    .reduce((sum, c) => sum + (c.points || 0), 0)
}

export function spentPoints(childId) {
  return state.redemptions
    .filter((r) => r.childId === childId && r.status === 'approved')
    .reduce((sum, r) => sum + (r.costPoints || 0), 0)
}

export function balance(childId) {
  return earnedPoints(childId) - spentPoints(childId)
}

export function childStreak(childId) {
  const days = state.completions.filter((c) => c.childId === childId).map((c) => c.date)
  return streakLength(days, tz(), resetHour())
}

export function pendingRedemptions() {
  return state.redemptions.filter((r) => r.status === 'requested')
}

// Chores a given child should see on a device in `houseId`, for a part of day.
export function visibleChores(childId, houseId, timeOfDay) {
  return state.chores
    .filter((c) => c.active)
    .filter((c) => !c.childId || c.childId === childId)
    .filter((c) => c.scope === 'shared' || c.scope === houseId)
    .filter((c) => !timeOfDay || c.timeOfDay === timeOfDay)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export { dayKey }
