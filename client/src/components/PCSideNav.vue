<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()
const tabs = [
  { name: 'Recommendations', label: '推荐', icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' },
  { name: 'Match', label: '匹配', icon: 'M7 2v11h3v9l7-12h-4l3-8z' },
  { name: 'Chat', label: '消息', icon: 'M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z' },
  { name: 'Profile', label: '我的', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
]
const active = computed(() => route.name)
</script>

<template>
  <aside class="pc-side pc-only">
    <div class="brand">恋遇</div>
    <button
      v-for="t in tabs"
      :key="t.name"
      class="side-item"
      :class="{ active: active === t.name }"
      @click="router.push({ name: t.name })"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path :d="t.icon" />
      </svg>
      <span>{{ t.label }}</span>
    </button>
  </aside>
</template>

<style scoped>
.pc-side {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 200px;
  background: var(--color-card);
  border-right: 1px solid var(--color-border);
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.brand {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-primary);
  padding: 12px 12px 24px;
  letter-spacing: 1px;
}
.side-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  color: var(--color-text-sub);
  font-size: 14px;
  transition: all 0.2s;
  text-align: left;
}
.side-item:hover {
  background: var(--color-bg);
  color: var(--color-text);
}
.side-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 500;
}
</style>
