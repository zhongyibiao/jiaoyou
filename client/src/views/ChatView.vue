<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { resolveFileUrl } from '@/api'
import AppHeader from '@/components/AppHeader.vue'
import TabBar from '@/components/TabBar.vue'
import PCSideNav from '@/components/PCSideNav.vue'

const chatStore = useChatStore()
const userStore = useUserStore()
const router = useRouter()

const sorted = computed(() => {
  return [...chatStore.matches].sort((a, b) => {
    const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
    const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
    return tb - ta
  })
})

function timeAgo(iso?: string) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m}分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}小时前`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}天前`
  return new Date(iso).toLocaleDateString()
}

function lastPreview(m: { last_message?: string }) {
  return m.last_message || ''
}

function open(matchId: number) {
  chatStore.markRead(matchId)
  router.push({ name: 'ChatWindow', params: { id: String(matchId) } })
}

onMounted(async () => {
  if (!userStore.isLoggedIn) {
    router.replace({ name: 'Auth', query: { redirect: '/chat' } })
    return
  }
  await chatStore.loadMatches()
  chatStore.connect()
})
</script>

<template>
  <div class="chat-list-page">
    <PCSideNav />
    <AppHeader />
    <main class="main pc-pad">
      <div class="list">
        <div v-if="sorted.length === 0" class="empty">
          <div class="empty-icon">💬</div>
          <p>还没有配对，去认识些朋友吧</p>
        </div>
        <div
          v-for="m in sorted"
          :key="m.match_id"
          class="row card"
          @click="open(m.match_id)"
        >
          <div class="avatar-wrap">
            <img v-if="m.peer.avatar" :src="resolveFileUrl(m.peer.avatar)" :alt="m.peer.nickname" />
            <div v-else class="avatar-fb">{{ m.peer.nickname?.[0] }}</div>
          </div>
          <div class="meta">
            <div class="line1">
              <span class="name">{{ m.peer.nickname }}</span>
              <span class="time">{{ timeAgo(m.last_message_at) }}</span>
            </div>
            <div class="line2 text-ellipsis">
              {{ lastPreview(m) }}
            </div>
          </div>
          <span v-if="m.unread > 0" class="unread">{{ m.unread > 99 ? '99+' : m.unread }}</span>
        </div>
      </div>
    </main>
    <TabBar />
  </div>
</template>

<style scoped>
.chat-list-page {
  min-height: 100vh;
  padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
}
.main {
  padding: 16px 0;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px;
}
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.row:hover {
  background: var(--color-bg);
}
.avatar-wrap {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}
.avatar-wrap img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.avatar-fb {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
}
.meta {
  flex: 1;
  min-width: 0;
}
.line1 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.name {
  font-size: 15px;
  font-weight: 500;
}
.time {
  font-size: 11px;
  color: var(--color-text-sub);
}
.line2 {
  font-size: 13px;
  color: var(--color-text-sub);
}
.unread {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--radius-full);
  background: var(--color-danger);
  color: #fff;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty {
  padding: 60px 20px;
  text-align: center;
  color: var(--color-text-sub);
}
.empty-icon {
  font-size: 64px;
  margin-bottom: 12px;
}
.empty p {
  margin: 0;
}
@media (min-width: 768px) {
  .pc-pad {
    margin-left: 200px;
    max-width: 800px;
  }
}
</style>
