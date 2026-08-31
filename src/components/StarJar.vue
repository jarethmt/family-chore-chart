<script setup>
import { computed } from 'vue'

const props = defineProps({
  balance: { type: Number, default: 0 },
  done: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
})

const pct = computed(() => (props.total ? Math.round((props.done / props.total) * 100) : 0))
</script>

<template>
  <div class="jar card">
    <div class="ring" :style="{ '--pct': pct }">
      <div class="ring-inner">
        <div class="count">{{ done }}/{{ total }}</div>
        <div class="lbl">today</div>
      </div>
    </div>
    <div class="stars">
      <fa :icon="['fas', 'star']" />
      <span class="num">{{ balance }}</span>
      <span class="lbl">stars</span>
    </div>
  </div>
</template>

<style scoped>
.jar {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 14px 18px;
}
.ring {
  --size: 64px;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  background: conic-gradient(
    var(--accent) calc(var(--pct) * 1%),
    var(--surface-2) 0
  );
  display: grid;
  place-items: center;
  transition: background 0.5s ease;
  flex: 0 0 auto;
}
.ring-inner {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--bg);
  display: grid;
  place-items: center;
  text-align: center;
}
.count {
  font-weight: 900;
  font-size: 0.85rem;
}
.lbl {
  font-size: 0.62rem;
  color: var(--text-dim);
}
.stars {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: var(--warn);
}
.stars .num {
  font-size: 1.8rem;
  font-weight: 900;
  color: var(--text);
}
.stars .lbl {
  color: var(--text-dim);
}
</style>
