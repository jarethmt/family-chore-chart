<script setup>
import { computed } from 'vue'
import { state, requestRedemption } from '../store/doc.js'
import { iconDefName } from '../lib/icons.js'
import { playChime } from '../lib/celebrate.js'

const props = defineProps({
  childId: { type: String, required: true },
  balance: { type: Number, default: 0 }
})
const emit = defineEmits(['close'])

const rewards = computed(() =>
  state.rewards.filter((r) => r.active && (!r.childId || r.childId === props.childId))
)

// A pending request for this child on this reward?
function pendingFor(rewardId) {
  return state.redemptions.some(
    (r) => r.rewardId === rewardId && r.childId === props.childId && r.status === 'requested'
  )
}

function ask(reward) {
  if (props.balance < reward.costPoints || pendingFor(reward.id)) return
  requestRedemption(reward, props.childId)
  playChime('reward')
}
</script>

<template>
  <div class="shop-overlay" @click.self="emit('close')">
    <div class="shop card">
      <div class="row">
        <h2 style="margin: 0"><fa :icon="['fas', 'gift']" /> Prize Shop</h2>
        <div class="spacer" />
        <div class="pill"><fa :icon="['fas', 'star']" /> {{ balance }}</div>
        <button class="btn ghost" @click="emit('close')"><fa :icon="['fas', 'xmark']" /></button>
      </div>

      <p v-if="!rewards.length" class="muted center" style="padding: 30px 0">
        No prizes yet — a grown-up can add some!
      </p>

      <div class="grid rewards">
        <div v-for="r in rewards" :key="r.id" class="reward" :class="{ locked: balance < r.costPoints }">
          <div class="ricon"><fa :icon="['fas', iconDefName(r.icon)]" /></div>
          <div class="rtitle">{{ r.title }}</div>
          <div class="rcost"><fa :icon="['fas', 'star']" /> {{ r.costPoints }}</div>
          <button
            class="btn primary"
            :disabled="balance < r.costPoints || pendingFor(r.id)"
            @click="ask(r)"
          >
            <span v-if="pendingFor(r.id)"><fa :icon="['fas', 'clock']" /> Asked!</span>
            <span v-else-if="balance < r.costPoints">Need more</span>
            <span v-else>Get it!</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shop-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: grid;
  place-items: start center;
  padding: 5vh 12px;
  z-index: 50;
  overflow: auto;
}
.shop {
  width: 100%;
  max-width: 640px;
  padding: 18px;
}
.rewards {
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  margin-top: 12px;
}
.reward {
  background: var(--surface);
  border: 1px solid var(--stroke);
  border-radius: 18px;
  padding: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}
.reward.locked {
  opacity: 0.6;
}
.ricon {
  font-size: 2.4rem;
  color: var(--accent);
}
.rtitle {
  font-weight: 800;
}
.rcost {
  color: var(--warn);
  font-weight: 900;
}
.btn:disabled {
  opacity: 0.6;
}
</style>
