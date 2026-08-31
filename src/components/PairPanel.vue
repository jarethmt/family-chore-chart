<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import QRCode from 'qrcode'
import QrScanner from 'qr-scanner'
import { makeInvite, parseInvite, joinFamilyUnit, rotateRoomKey } from '../store/pairing.js'
import { device } from '../store/device.js'

const props = defineProps({
  mode: { type: String, default: 'show' } // 'show' = share this unit, 'join' = scan/paste to join
})
const emit = defineEmits(['joined'])

const qrUrl = ref('')
const copied = ref(false)
const video = ref(null)
const scanner = ref(null)
const scanError = ref('')
const pasteText = ref('')
const pasteError = ref('')

const invite = computed(() => (device.familyUnitId ? makeInvite() : ''))

onMounted(async () => {
  if (props.mode === 'show' && invite.value) {
    try {
      qrUrl.value = await QRCode.toDataURL(invite.value, { margin: 1, width: 260 })
    } catch (e) {
      console.warn(e)
    }
  }
  if (props.mode === 'join') startScan()
})

onBeforeUnmount(stopScan)

async function startScan() {
  scanError.value = ''
  try {
    const hasCam = await QrScanner.hasCamera()
    if (!hasCam) {
      scanError.value = 'No camera found — paste the code below instead.'
      return
    }
    scanner.value = new QrScanner(
      video.value,
      (res) => onScan(res.data || res),
      { highlightScanRegion: true, highlightCodeOutline: true, returnDetailedScanResult: true }
    )
    await scanner.value.start()
  } catch (e) {
    scanError.value = 'Camera unavailable — paste the code below instead.'
  }
}

function stopScan() {
  if (scanner.value) {
    scanner.value.stop()
    scanner.value.destroy()
    scanner.value = null
  }
}

function onScan(text) {
  const inv = parseInvite(text)
  if (inv) {
    stopScan()
    joinFamilyUnit(inv)
    emit('joined')
  }
}

function submitPaste() {
  pasteError.value = ''
  const inv = parseInvite(pasteText.value)
  if (!inv) {
    pasteError.value = "That doesn't look like a family code."
    return
  }
  stopScan()
  joinFamilyUnit(inv)
  emit('joined')
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(invite.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    /* clipboard blocked — the code is visible to copy manually */
  }
}

function onRotate() {
  if (confirm('Rotate the family key? Every device will need to pair again with the new code.')) {
    rotateRoomKey()
    QRCode.toDataURL(makeInvite(), { margin: 1, width: 260 }).then((u) => (qrUrl.value = u))
  }
}
</script>

<template>
  <div class="pair">
    <!-- SHOW: add another device -->
    <template v-if="mode === 'show'">
      <p class="muted center">
        Scan this on another phone or tablet to add it to your family. Anyone without this
        code can't see your data.
      </p>
      <div class="qr-wrap">
        <img v-if="qrUrl" :src="qrUrl" alt="Family pairing code" class="qr" />
      </div>
      <div class="row" style="justify-content: center">
        <button class="btn" @click="copyCode">
          <fa :icon="['fas', 'copy']" /> {{ copied ? 'Copied!' : 'Copy code' }}
        </button>
        <button class="btn ghost danger" @click="onRotate">
          <fa :icon="['fas', 'rotate']" /> Rotate key
        </button>
      </div>
      <p class="code muted">{{ invite }}</p>
    </template>

    <!-- JOIN: pair into an existing family -->
    <template v-else>
      <div class="qr-wrap">
        <video ref="video" class="cam" playsinline></video>
      </div>
      <p v-if="scanError" class="muted center"><fa :icon="['fas', 'circle-info']" /> {{ scanError }}</p>
      <p v-else class="muted center">Point the camera at the family code on the other device.</p>
      <label>…or paste the family code</label>
      <input v-model="pasteText" placeholder="FCC1:…" @keyup.enter="submitPaste" />
      <p v-if="pasteError" class="err">{{ pasteError }}</p>
      <button class="btn primary" style="width: 100%; margin-top: 10px" @click="submitPaste">
        Join family
      </button>
    </template>
  </div>
</template>

<style scoped>
.qr-wrap {
  display: grid;
  place-items: center;
  margin: 16px 0;
}
.qr {
  border-radius: 16px;
  border: 6px solid #fff;
}
.cam {
  width: min(80vw, 280px);
  height: min(80vw, 280px);
  object-fit: cover;
  border-radius: 16px;
  background: #000;
}
.code {
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  word-break: break-all;
  text-align: center;
  margin-top: 10px;
}
.err {
  color: var(--bad);
  font-weight: 700;
}
</style>
