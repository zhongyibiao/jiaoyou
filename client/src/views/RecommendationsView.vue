<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRecommendStore } from '@/stores/recommend'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import UserCard from '@/components/UserCard.vue'
import AppHeader from '@/components/AppHeader.vue'
import PCSideNav from '@/components/PCSideNav.vue'
import TabBar from '@/components/TabBar.vue'

const store = useRecommendStore()
const chatStore = useChatStore()
const userStore = useUserStore()

const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(async () => {
  if (userStore.isLoggedIn) {
    userStore.fetchProfile()
    chatStore.loadMatches().catch(() => {})
    chatStore.connect()
  }
  store.load(true)
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) store.load()
  })
  if (sentinel.value) observer.observe(sentinel.value)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="rec-page">
    <PCSideNav />
    <AppHeader />
    <main class="main pc-pad">
      <div class="filter-row">
        <h2 class="page-title">推荐</h2>
        <span class="hint">按活跃度推荐</span>
      </div>
      <div v-if="store.list.length === 0 && !store.loading" class="empty">
        暂时没有更多推荐了
      </div>
      <div class="grid">
        <UserCard
          v-for="u in store.list"
          :key="u.id"
          :user="u"
        />
      </div>
      <div ref="sentinel" class="sentinel">
        <span v-if="store.loading">加载中…</span>
        <span v-else-if="store.finished && store.list.length">没有更多了</span>
      </div>
    </main>
    <TabBar />
  </div>
</template>

<style scoped>
.rec-page {
  min-height: 100vh;
  padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
}
.main {
  padding: 16px 0 24px;
}
.filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 0 16px;
}
.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
.hint {
  font-size: 12px;
  color: var(--color-text-sub);
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 16px;
}
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
@media (min-width: 1280px) {
  .grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
.sentinel {
  text-align: center;
  padding: 24px;
  color: var(--color-text-sub);
  font-size: 13px;
}
.empty {
  padding: 60px 20px;
  text-align: center;
  color: var(--color-text-sub);
  font-size: 14px;
}
@media (min-width: 768px) {
  .pc-pad {
    margin-left: 200px;
  }
}
</style>
