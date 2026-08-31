// Random, unguessable identifiers. The family-unit id doubles as the WebRTC room name
// and the room password is the shared encryption secret. Both are generated with the
// platform CSPRNG so two families can never collide into the same room.

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no ambiguous chars (0/O, 1/I/L)

function randomString(len) {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return out
}

// Short, human-glanceable id for the room name (still ~10^23 space at 16 chars).
export function newFamilyUnitId() {
  return 'fam-' + randomString(16)
}

// Longer secret used as the y-webrtc room password (encryption key material).
export function newRoomPassword() {
  return randomString(32)
}

export function newId(prefix = 'id') {
  return prefix + '-' + randomString(10)
}
