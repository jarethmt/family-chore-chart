// Pairing a device into a family unit. An invite carries the family-unit id + room
// password (the shared secret). We ship it as a compact base64 string that a new
// device scans as a QR code or pastes. No accounts, no email, no server.

import { device } from './device.js'
import { newFamilyUnitId, newRoomPassword } from '../lib/id.js'

const PREFIX = 'FCC1:'

export function makeInvite() {
  const payload = {
    u: device.familyUnitId,
    p: device.roomPassword,
    n: '' // deliberately no family name in the invite payload; kept generic
  }
  const json = JSON.stringify(payload)
  return PREFIX + btoa(unescape(encodeURIComponent(json)))
}

export function parseInvite(text) {
  const trimmed = (text || '').trim()
  if (!trimmed.startsWith(PREFIX)) return null
  try {
    const json = decodeURIComponent(escape(atob(trimmed.slice(PREFIX.length))))
    const obj = JSON.parse(json)
    if (!obj.u || !obj.p) return null
    return { familyUnitId: obj.u, roomPassword: obj.p }
  } catch {
    return null
  }
}

// Start a brand-new family unit on this device.
export function mintFamilyUnit() {
  device.familyUnitId = newFamilyUnitId()
  device.roomPassword = newRoomPassword()
}

// Join an existing family unit from a parsed invite.
export function joinFamilyUnit(invite) {
  device.familyUnitId = invite.familyUnitId
  device.roomPassword = invite.roomPassword
}

// Rotate the room key (e.g. a device was lost). Trusted devices must re-pair with
// the new invite; the old key stops working.
export function rotateRoomKey() {
  device.roomPassword = newRoomPassword()
}
