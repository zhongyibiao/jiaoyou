<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { userApi, resolveFileUrl } from '@/api'
import AppHeader from '@/components/AppHeader.vue'

const userStore = useUserStore()
const router = useRouter()

const settings = ref({
  showOnline: true,
  showDistance: true,
  showAge: true,
  allowStrangerMessage: true,
  autoMatch: true,
  hideFromSearch: false,
  readReceipt: true,
})

const STORAGE_KEY = 'jiaoyou_privacy'

function load() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      settings.value = { ...settings.value, ...JSON.parse(raw) }
    } catch (e) {
      // ignore
    }
  }
}

function onToggle(key: string, e: Event) {
  const v = (e.target as HTMLInputElement).checked
  settings.value = { ...settings.value, [key]: v }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
}

const blockList = ref<{ id: number; nickname: string; avatar: string }[]>([])

async function report(targetId: number) {
  const reason = prompt('请输入举报原因') || ''
  if (!reason) return
  await userApi.report(targetId, reason)
  alert('已提交，感谢反馈')
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.replace({ name: 'Auth', query: { redirect: '/privacy' } })
    return
  }
  load()
})
</script>

<template>
  <div class="privacy-page">
    <AppHeader />
    <main class="main">
      <section class="card">
        <h3>个人展示</h3>
        <label class="item">
          <span>显示在线状态</span>
          <input type="checkbox" :checked="settings.showOnline" @change="onToggle('showOnline', $event)" />
        </label>
        <label class="item">
          <span>显示距离</span>
          <input type="checkbox" :checked="settings.showDistance" @change="onToggle('showDistance', $event)" />
        </label>
        <label class="item">
          <span>显示年龄</span>
          <input type="checkbox" :checked="settings.showAge" @change="onToggle('showAge', $event)" />
        </label>
      </section>

      <section class="card">
        <h3>消息与匹配</h3>
        <label class="item">
          <span>允许陌生人消息</span>
          <input type="checkbox" :checked="settings.allowStrangerMessage" @change="onToggle('allowStrangerMessage', $event)" />
        </label>
        <label class="item">
          <span>已读回执</span>
          <input type="checkbox" :checked="settings.readReceipt" @change="onToggle('readReceipt', $event)" />
        </label>
        <label class="item">
          <span>自动匹配推荐</span>
          <input type="checkbox" :checked="settings.autoMatch" @change="onToggle('autoMatch', $event)" />
        </label>
        <label class="item">
          <span>不把我展示在搜索中</span>
          <input type="checkbox" :checked="settings.hideFromSearch" @change="onToggle('hideFromSearch', $event)" />
        </label>
      </section>

      <section class="card">
        <h3>黑名单与举报</h3>
        <div v-if="blockList.length === 0" class="empty">
          暂无拉黑用户（可在聊天页长按消息进行举报）
        </div>
        <div v-for="u in blockList" :key="u.id" class="block-row">
          <img v-if="u.avatar" :src="resolveFileUrl(u.avatar)" class="ava" />
          <div v-else class="ava fb">{{ u.nickname?.[0] }}</div>
          <span class="name">{{ u.nickname }}</span>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.privacy-page {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: env(safe-area-inset-bottom);
}
.main {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
section.card {
  padding: 16px;
}
h3 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
}
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 14px;
}
.item:last-child {
  border-bottom: none;
}
input[type='checkbox'] {
  width: 40px;
  height: 22px;
  appearance: none;
  background: #ddd;
  border-radius: var(--radius-full);
  position: relative;
  transition: background 0.2s;
  cursor: pointer;
}
input[type='checkbox']::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: left 0.2s;
}
input[type='checkbox']:checked {
  background: var(--color-primary);
}
input[type='checkbox']:checked::before {
  left: 20px;
}
.block-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}
.ava {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}
.ava.fb {
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}
.name {
  flex: 1;
  font-size: 14px;
}
.empty {
  color: var(--color-text-sub);
  text-align: center;
  padding: 16px 0;
  font-size: 13px;
}
</style>
