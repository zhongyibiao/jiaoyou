<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Toast {
  id: number
  type: 'info' | 'success' | 'error'
  message: string
}

const toasts = ref<Toast[]>([])
let seq = 0

function handle(e: Event) {
  const detail = (e as CustomEvent<{ type: Toast['type']; message: string }>).detail
  const id = ++seq
  toasts.value.push({ id, type: detail.type, message: detail.message })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 3000)
}

onMounted(() => window.addEventListener('app:toast', handle))
onUnmounted(() => window.removeEventListener('app:toast', handle))
</script>

<template>
  <div class="toast-host">
    <transition-group name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="t.type"
      >
        {{ t.message }}
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
.toast {
  padding: 10px 18px;
  border-radius: var(--radius-md);
  font-size: 13px;
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  max-width: 80vw;
  text-align: center;
}
.toast.error {
  background: var(--color-danger);
}
.toast.success {
  background: var(--color-success);
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
