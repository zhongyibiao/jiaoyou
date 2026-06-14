<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { resolveFileUrl } from '@/api'
import type { Message } from '@/api'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const userStore = useUserStore()

const matchId = computed(() => Number(route.params.id))
const match = computed(() =>
  chatStore.matches.find((m) => m.match_id === matchId.value),
)
const messages = computed(() => chatStore.messages[matchId.value] || [])
const peer = computed(() => match.value?.peer)
const peerAvatar = computed(() => resolveFileUrl(peer.value?.avatar))
const isTyping = computed(
  () => chatStore.typingMap[matchId.value] && chatStore.typingMap[matchId.value]?.from !== userStore.user?.id,
)

const draft = ref('')
const sending = ref(false)
const scrollEl = ref<HTMLElement | null>(null)
let typingTimer: number | null = null

async function send() {
  const text = draft.value.trim()
  if (!text) return
  draft.value = ''
  sending.value = true
  chatStore.send(matchId.value, text)
  await nextTick()
  scrollToBottom()
  sending.value = false
}

function onInput() {
  chatStore.emitTyping(matchId.value)
  if (typingTimer) window.clearTimeout(typingTimer)
  typingTimer = window.setTimeout(() => {
    typingTimer = null
  }, 1500)
}

function scrollToBottom(smooth = false) {
  if (!scrollEl.value) return
  scrollEl.value.scrollTo({
    top: scrollEl.value.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto',
  })
}

function statusText(status?: Message['status'], readAt?: string | null) {
  if (readAt) return '已读'
  switch (status) {
    case 'sending': return '发送中'
    case 'sent': return '已发送'
    case 'delivered': return '已送达'
    case 'read': return '已读'
    case 'failed': return '发送失败'
    default: return ''
  }
}

function timeLabel(iso: string) {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function shouldShowTime(idx: number) {
  if (idx === 0) return true
  const cur = new Date(messages.value[idx].created_at).getTime()
  const prev = new Date(messages.value[idx - 1].created_at).getTime()
  return cur - prev > 5 * 60 * 1000
}

onMounted(async () => {
  if (!userStore.isLoggedIn) {
    router.replace({ name: 'Auth' })
    return
  }
  if (chatStore.matches.length === 0) {
    await chatStore.loadMatches()
  }
  await chatStore.loadMessages(matchId.value)
  chatStore.joinMatch(matchId.value)
  chatStore.markRead(matchId.value)
  chatStore.connect()
  await nextTick()
  scrollToBottom()
})

onBeforeUnmount(() => {
  chatStore.leaveMatch(matchId.value)
})

watch(
  () => messages.value.length,
  () => nextTick(() => scrollToBottom(true)),
)
</script>

<template>
  <div class="chat-window">
    <AppHeader>
      <template #actions>
        <div v-if="peer" class="header-meta">
          <span class="name">{{ peer.nickname }}</span>
        </div>
      </template>
    </AppHeader>
    <div ref="scrollEl" class="messages">
      <template v-for="(m, idx) in messages" :key="m.id">
        <div v-if="shouldShowTime(idx)" class="time-divider">
          {{ timeLabel(m.created_at) }}
        </div>
        <div class="msg" :class="{ mine: m.sender_id === userStore.user?.id }">
          <img
            v-if="m.sender_id !== userStore.user?.id && peerAvatar"
            :src="peerAvatar"
            class="bubble-avatar"
          />
          <div class="bubble-wrap">
            <div class="bubble">{{ m.content }}</div>
            <div v-if="m.sender_id === userStore.user?.id" class="status-text">
              {{ statusText(m.status, m.read_at) }}
            </div>
          </div>
        </div>
      </template>
      <div v-if="isTyping" class="msg other">
        <div class="bubble typing"><span /><span /><span /></div>
      </div>
      <div v-if="messages.length === 0" class="empty">说点什么吧 👋</div>
    </div>
    <div class="composer">
      <textarea
        v-model="draft"
        placeholder="输入消息…"
        rows="1"
        @input="onInput"
        @keydown.enter.exact.prevent="send"
      />
      <button class="btn-primary send" :disabled="!draft.trim() || sending" @click="send">
        发送
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg);
}
.header-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
  font-size: 12px;
}
.header-meta .name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.time-divider {
  text-align: center;
  font-size: 11px;
  color: var(--color-text-sub);
  margin: 8px 0;
}
.msg {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  max-width: 80%;
}
.msg.mine {
  align-self: flex-end;
  flex-direction: row-reverse;
}
.bubble-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}
.bubble-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.msg.mine .bubble-wrap {
  align-items: flex-end;
}
.bubble {
  background: #fff;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border-top-left-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.msg.mine .bubble {
  background: var(--color-primary);
  color: #fff;
  border-top-left-radius: var(--radius-md);
  border-top-right-radius: 4px;
}
.status-text {
  font-size: 11px;
  color: var(--color-text-sub);
}
.typing {
  display: flex;
  gap: 3px;
  padding: 12px 14px;
}
.typing span {
  width: 6px;
  height: 6px;
  background: #aaa;
  border-radius: 50%;
  animation: blink 1.2s infinite;
}
.typing span:nth-child(2) {
  animation-delay: 0.2s;
}
.typing span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes blink {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-2px); }
}
.empty {
  margin: auto;
  color: var(--color-text-sub);
}
.composer {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-card);
  border-top: 1px solid var(--color-border);
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}
.composer textarea {
  flex: 1;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  font-size: 14px;
  resize: none;
  max-height: 120px;
  line-height: 1.5;
}
.composer textarea:focus {
  border-color: var(--color-primary);
}
.composer .send {
  align-self: flex-end;
  padding: 8px 16px;
}
</style>
