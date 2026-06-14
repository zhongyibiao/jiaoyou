<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()
const title = computed(() => (route.meta.title as string) || '')

function back() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <header class="app-header">
    <div class="header-inner container">
      <button v-if="route.meta.layout !== 'tabbar' && route.meta.layout !== 'blank'" class="back-btn pc-only" @click="back">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </button>
      <h1 class="title">{{ title }}</h1>
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--header-h);
  background: var(--color-card);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(10px);
}
.header-inner {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
}
.title {
  flex: 1;
  font-size: 17px;
  font-weight: 600;
  margin: 0;
}
.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
}
.back-btn:hover {
  background: var(--color-border);
}
</style>
