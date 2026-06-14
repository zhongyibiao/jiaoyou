<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { matchApi } from '@/api'
import { useRecommendStore } from '@/stores/recommend'
import { resolveFileUrl, type User } from '@/api'
import AppHeader from '@/components/AppHeader.vue'
import TabBar from '@/components/TabBar.vue'
import PCSideNav from '@/components/PCSideNav.vue'

const router = useRouter()
const store = useRecommendStore()
const currentIndex = ref(0)
const dragX = ref(0)
const dragY = ref(0)
const dragging = ref(false)
const animating = ref(false)
const flyingOut = ref<'left' | 'right' | null>(null)
const showMatchModal = ref(false)
const matchedUser = ref<{ id: number; matchId: number; nickname: string; avatar: string } | null>(null)

const current = computed(() => store.list[currentIndex.value])
const next = computed(() => store.list[currentIndex.value + 1])

function startDrag() {
  dragging.value = true
  animating.value = false
  flyingOut.value = null
}
function onDrag(e: TouchEvent | MouseEvent) {
  if (!dragging.value) return
  const point = 'touches' in e ? e.touches[0] : e
  dragX.value = point.clientX - window.innerWidth / 2
  dragY.value = point.clientY - window.innerHeight / 2
}
async function endDrag() {
  if (!dragging.value) return
  dragging.value = false
  const threshold = 100
  if (dragX.value > threshold) {
    flyingOut.value = 'right'
    animating.value = true
    await swipe(1)
  } else if (dragX.value < -threshold) {
    flyingOut.value = 'left'
    animating.value = true
    await swipe(2)
  } else {
    dragX.value = 0
    dragY.value = 0
  }
}

async function swipe(action: 1 | 2) {
  if (!current.value) return
  const target = current.value
  try {
    const res = await matchApi.swipe(target.id, action)
    if (res.matched && res.match_id) {
      matchedUser.value = {
        id: target.id,
        matchId: res.match_id,
        nickname: target.nickname,
        avatar: target.avatar,
      }
      showMatchModal.value = true
    }
  } catch (e) {
    // ignore
  }
  setTimeout(() => {
    currentIndex.value += 1
    dragX.value = 0
    dragY.value = 0
    flyingOut.value = null
    if (currentIndex.value >= store.list.length - 3) {
      store.load()
    }
  }, 250)
}

const cardStyle = computed(() => {
  if (flyingOut.value === 'right')
    return { transform: `translate(120vw, -50%) rotate(30deg)`, opacity: 0 }
  if (flyingOut.value === 'left')
    return { transform: `translate(-120vw, -50%) rotate(-30deg)`, opacity: 0 }
  if (!dragging.value) return { transform: 'translate(-50%, -50%) rotate(0deg)' }
  const rotate = dragX.value / 15
  return {
    transform: `translate(calc(-50% + ${dragX.value}px), calc(-50% + ${dragY.value}px)) rotate(${rotate}deg)`,
  }
})

const likeOpacity = computed(() => Math.min(Math.max(dragX.value / 100, 0), 1))
const passOpacity = computed(() => Math.min(Math.max(-dragX.value / 100, 0), 1))

function clickLike() {
  dragX.value = 200
  flyingOut.value = 'right'
  animating.value = true
  swipe(1)
}
function clickPass() {
  dragX.value = -200
  flyingOut.value = 'left'
  animating.value = true
  swipe(2)
}

function closeMatch() {
  showMatchModal.value = false
  matchedUser.value = null
}
function chatNow() {
  if (matchedUser.value) {
    router.push({ name: 'ChatWindow', params: { id: String(matchedUser.value.matchId) } })
  }
  closeMatch()
}

function bgImage(u?: User) {
  if (!u?.avatar) return 'none'
  return `url(${resolveFileUrl(u.avatar)})`
}

onMounted(() => {
  if (store.list.length === 0) store.load(true)
})
</script>

<template>
  <div class="match-page">
    <PCSideNav />
    <AppHeader />
    <main class="stage">
      <div v-if="!current" class="empty">
        <div class="empty-icon">💝</div>
        <p>暂时没有更多用户了</p>
        <button class="btn-primary" @click="store.load(true)">重新加载</button>
      </div>
      <template v-else>
        <div
          v-if="next"
          class="card-deck next"
          :style="{ backgroundImage: bgImage(next) }"
        >
          <div v-if="!next.avatar" class="deco-fallback">{{ next.nickname?.[0] }}</div>
        </div>
        <div
          class="card-deck current"
          :class="{ dragging, animating }"
          :style="cardStyle"
          @mousedown="startDrag"
          @mousemove="onDrag"
          @mouseup="endDrag"
          @mouseleave="endDrag"
          @touchstart.passive="startDrag"
          @touchmove.passive="onDrag"
          @touchend="endDrag"
        >
          <div class="card-bg" :style="{ backgroundImage: bgImage(current) }" />
          <div v-if="!current.avatar" class="deco-fallback big">{{ current.nickname?.[0] }}</div>
          <div class="badge like" :style="{ opacity: likeOpacity }">LIKE</div>
          <div class="badge pass" :style="{ opacity: passOpacity }">NOPE</div>
          <div class="info">
            <h2>
              {{ current.nickname }}
              <span v-if="current.age" class="age">{{ current.age }}岁</span>
            </h2>
            <p v-if="current.city" class="loc">📍 {{ current.city }}</p>
            <p v-if="current.bio" class="bio">{{ current.bio }}</p>
            <div v-if="current.interests?.length" class="tags">
              <span v-for="i in current.interests" :key="i" class="tag">#{{ i }}</span>
            </div>
          </div>
        </div>
        <div class="actions">
          <button class="circle-btn pass" @click="clickPass" title="跳过">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
          <button class="circle-btn like" @click="clickLike" title="喜欢">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>
      </template>
    </main>

    <transition name="fade">
      <div v-if="showMatchModal" class="match-modal" @click.self="closeMatch">
        <div class="match-card">
          <div class="match-glow" />
          <h2>配对成功！</h2>
          <p>你和 {{ matchedUser?.nickname }} 互相喜欢</p>
          <div class="avatars">
            <div class="avatar">我</div>
            <div class="heart">💖</div>
            <div class="avatar">{{ matchedUser?.nickname?.[0] }}</div>
          </div>
          <div class="match-actions">
            <button class="btn-ghost" @click="closeMatch">继续滑动</button>
            <button class="btn-primary" @click="chatNow">打个招呼</button>
          </div>
        </div>
      </div>
    </transition>
    <TabBar />
  </div>
</template>

<style scoped>
.match-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
}
.stage {
  position: relative;
  flex: 1;
  min-height: calc(100vh - var(--header-h) - var(--tabbar-h));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.card-deck {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(90vw, 360px);
  aspect-ratio: 3 / 4;
  background-size: cover;
  background-position: center;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  user-select: none;
  transition: transform 0.25s ease;
}
.card-deck.current {
  z-index: 2;
  cursor: grab;
}
.card-deck.current.dragging {
  cursor: grabbing;
  transition: none;
}
.card-deck.next {
  z-index: 1;
  transform: translate(-50%, -50%) scale(0.95);
  filter: brightness(0.7);
}
.card-deck.current:not(.dragging):not(.animating) {
  transform: translate(-50%, -50%);
}
.card-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}
.deco-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffd1d1, #ffaaa5);
  color: #fff;
  font-size: 64px;
  font-weight: 600;
}
.deco-fallback.big {
  font-size: 120px;
}
.badge {
  position: absolute;
  top: 24px;
  padding: 6px 12px;
  border: 3px solid currentColor;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 2px;
  transform: rotate(-15deg);
  pointer-events: none;
  transition: opacity 0.15s;
}
.badge.like {
  right: 24px;
  color: #4caf50;
  transform: rotate(15deg);
}
.badge.pass {
  left: 24px;
  color: #ff4d4f;
}
.info {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px;
  color: #fff;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
}
.info h2 {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 600;
}
.age {
  font-size: 16px;
  font-weight: 400;
  opacity: 0.9;
}
.loc,
.bio {
  margin: 4px 0;
  font-size: 13px;
  opacity: 0.9;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.tag {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.25);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  backdrop-filter: blur(4px);
}
.actions {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 24px;
  z-index: 3;
}
.circle-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.15s;
}
.circle-btn:active {
  transform: scale(0.92);
}
.circle-btn.pass {
  color: var(--color-danger);
}
.circle-btn.like {
  color: #4caf50;
}
.empty {
  text-align: center;
  color: var(--color-text-sub);
}
.empty-icon {
  font-size: 64px;
  margin-bottom: 12px;
}
.empty p {
  margin: 0 0 16px;
}
.match-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}
.match-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 32px 28px;
  width: 320px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.match-glow {
  position: absolute;
  top: -40%;
  left: 50%;
  transform: translateX(-50%);
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 107, 107, 0.3), transparent 60%);
  pointer-events: none;
}
.match-card h2 {
  margin: 0 0 8px;
  font-size: 22px;
  color: var(--color-primary);
  position: relative;
}
.match-card p {
  margin: 0 0 20px;
  color: var(--color-text-sub);
  position: relative;
}
.avatars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
  position: relative;
}
.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
}
.heart {
  font-size: 32px;
  animation: pulse 1s infinite;
}
.match-actions {
  display: flex;
  gap: 8px;
  position: relative;
}
.match-actions button {
  flex: 1;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}
@media (min-width: 768px) {
  .stage {
    margin-left: 200px;
  }
}
</style>
