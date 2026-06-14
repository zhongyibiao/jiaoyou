<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()

const tabs = [
  { name: 'Recommendations', label: '推荐', icon: 'heart' },
  { name: 'Match', label: '匹配', icon: 'flash' },
  { name: 'Chat', label: '消息', icon: 'chat' },
  { name: 'Profile', label: '我的', icon: 'user' },
]

const active = computed(() => route.name)
</script>

<template>
  <nav class="tabbar mobile-only">
    <button
      v-for="t in tabs"
      :key="t.name"
      class="tab-item"
      :class="{ active: active === t.name }"
      @click="router.push({ name: t.name })"
    >
      <span class="icon">
        <svg v-if="t.icon === 'heart'" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <svg v-else-if="t.icon === 'flash'" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M7 2v11h3v9l7-12h-4l3-8z" />
        </svg>
        <svg v-else-if="t.icon === 'chat'" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </span>
      <span class="label">{{ t.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: var(--tabbar-h);
  background: var(--color-card);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: stretch;
  padding-bottom: env(safe-area-inset-bottom);
}
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--color-text-sub);
  font-size: 11px;
  transition: color 0.2s;
}
.tab-item.active {
  color: var(--color-primary);
}
.tab-item .icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
