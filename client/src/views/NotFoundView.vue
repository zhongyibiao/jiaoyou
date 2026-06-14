<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="nf">
    <h1>404</h1>
    <p>页面不存在</p>
    <button class="btn-primary" @click="router.push('/')">回到首页</button>
  </div>
</template>

<style scoped>
.nf {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-text-sub);
}
h1 {
  font-size: 96px;
  margin: 0;
  color: var(--color-primary);
}
p {
  margin: 0 0 8px;
}
</style>
