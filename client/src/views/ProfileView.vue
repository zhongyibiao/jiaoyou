<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { userApi, resolveFileUrl } from '@/api'
import ImageUploader from '@/components/ImageUploader.vue'
import AppHeader from '@/components/AppHeader.vue'
import TabBar from '@/components/TabBar.vue'
import PCSideNav from '@/components/PCSideNav.vue'

const userStore = useUserStore()
const router = useRouter()

const editing = ref(false)
const form = ref({
  nickname: '',
  gender: 1 as 0 | 1 | 2,
  birthday: '',
  bio: '',
  province: '',
  city: '',
  interests: '' as string,
})
const saving = ref(false)

const interestOptions = [
  '电影', '音乐', '旅行', '美食', '运动', '阅读', '摄影', '游戏',
  '宠物', '健身', '舞蹈', '绘画', '编程', '户外', '咖啡', '烹饪',
]

const age = computed(() => {
  if (!userStore.user?.birthday) return null
  const b = new Date(userStore.user.birthday)
  const now = new Date()
  let a = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--
  return a
})

function genderLabel(g?: number) {
  if (g === 1) return '男'
  if (g === 2) return '女'
  return '其他'
}

function startEdit() {
  if (!userStore.user) return
  const u = userStore.user
  form.value = {
    nickname: u.nickname,
    gender: u.gender,
    birthday: u.birthday || '',
    bio: u.bio || '',
    province: u.province || '',
    city: u.city || '',
    interests: (u.interests || []).join(','),
  }
  editing.value = true
}

function cancel() {
  editing.value = false
}

async function save() {
  saving.value = true
  try {
    const payload = {
      nickname: form.value.nickname,
      gender: form.value.gender,
      birthday: form.value.birthday || undefined,
      bio: form.value.bio,
      province: form.value.province,
      city: form.value.city,
      interests: form.value.interests.split(/[,，、\s]+/).filter(Boolean),
    }
    const updated = await userApi.updateProfile(payload)
    userStore.setUser({ ...userStore.user!, ...updated })
    editing.value = false
  } finally {
    saving.value = false
  }
}

async function uploadAvatar(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await userApi.uploadAvatar(fd)
  if (res.avatar && userStore.user) {
    userStore.setUser({ ...userStore.user, avatar: res.avatar })
  }
}

function logout() {
  userStore.logout()
  router.replace({ name: 'Auth' })
}

const avatarUrl = computed(() => resolveFileUrl(userStore.user?.avatar))

onMounted(async () => {
  if (!userStore.isLoggedIn) {
    router.replace({ name: 'Auth', query: { redirect: '/profile' } })
    return
  }
  await userStore.fetchProfile()
})
</script>

<template>
  <div class="profile-page">
    <PCSideNav />
    <AppHeader>
      <template #actions>
        <button v-if="!editing" class="link-btn" @click="startEdit">编辑</button>
      </template>
    </AppHeader>
    <main class="main pc-pad" v-if="userStore.user">
      <div class="hero card">
        <ImageUploader
          :model-value="userStore.user.avatar"
          round
          :max-size="2"
          @upload="uploadAvatar"
        />
        <h2>{{ userStore.user.nickname }}</h2>
        <p class="id">ID: {{ userStore.user.id }}</p>
      </div>

      <div v-if="editing" class="edit-form card">
        <div class="form-group">
          <label>昵称</label>
          <input v-model="form.nickname" class="text-input" maxlength="20" />
        </div>
        <div class="form-group">
          <label>性别</label>
          <div class="radio-row">
            <label><input v-model.number="form.gender" type="radio" :value="1" />男</label>
            <label><input v-model.number="form.gender" type="radio" :value="2" />女</label>
            <label><input v-model.number="form.gender" type="radio" :value="0" />其他</label>
          </div>
        </div>
        <div class="form-group">
          <label>生日</label>
          <input v-model="form.birthday" type="date" class="text-input" />
        </div>
        <div class="form-group">
          <label>所在省份</label>
          <input v-model="form.province" class="text-input" maxlength="20" />
        </div>
        <div class="form-group">
          <label>所在城市</label>
          <input v-model="form.city" class="text-input" maxlength="20" />
        </div>
        <div class="form-group">
          <label>个人简介</label>
          <textarea v-model="form.bio" class="text-input" rows="3" maxlength="200" />
        </div>
        <div class="form-group">
          <label>兴趣（用逗号分隔）</label>
          <input v-model="form.interests" class="text-input" />
          <div class="quick-tags">
            <button
              v-for="i in interestOptions"
              :key="i"
              class="chip"
              :class="{ on: form.interests.includes(i) }"
              @click="form.interests = form.interests ? form.interests + ',' + i : i"
            >
              {{ i }}
            </button>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-ghost" @click="cancel">取消</button>
          <button class="btn-primary" :disabled="saving" @click="save">
            {{ saving ? '保存中…' : '保存' }}
          </button>
        </div>
      </div>

      <div v-else class="info-card card">
        <div class="row"><span class="key">年龄</span><span>{{ age ? `${age}岁` : '未设置' }}</span></div>
        <div class="row"><span class="key">性别</span><span>{{ genderLabel(userStore.user.gender) }}</span></div>
        <div class="row">
          <span class="key">所在地</span>
          <span>
            <span v-if="userStore.user.province">{{ userStore.user.province }} </span>
            <span v-if="userStore.user.city">{{ userStore.user.city }}</span>
            <span v-if="!userStore.user.province && !userStore.user.city">未设置</span>
          </span>
        </div>
        <div class="row"><span class="key">简介</span><span>{{ userStore.user.bio || '还没有简介' }}</span></div>
        <div v-if="userStore.user.interests?.length" class="row column">
          <span class="key">兴趣</span>
          <div class="tag-list">
            <span v-for="i in userStore.user.interests" :key="i" class="tag">#{{ i }}</span>
          </div>
        </div>
      </div>

      <div class="action-list card">
        <button class="action-row" @click="router.push('/privacy')">
          <span>隐私设置</span>
          <span class="arrow">›</span>
        </button>
        <button class="action-row danger" @click="logout">
          <span>退出登录</span>
          <span class="arrow">›</span>
        </button>
      </div>
    </main>
    <TabBar />
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
}
.main {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.link-btn {
  color: var(--color-primary);
  font-size: 14px;
  padding: 6px 12px;
}
.hero {
  text-align: center;
  padding: 24px 16px;
}
.hero h2 {
  margin: 12px 0 4px;
  font-size: 20px;
}
.id {
  margin: 0;
  color: var(--color-text-sub);
  font-size: 12px;
}
.info-card {
  padding: 0;
}
.row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  font-size: 14px;
}
.row:last-child {
  border-bottom: none;
}
.row.column {
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.key {
  width: 80px;
  color: var(--color-text-sub);
  font-size: 13px;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag {
  font-size: 12px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  padding: 4px 10px;
  border-radius: var(--radius-full);
}
.action-list {
  padding: 0;
}
.action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 14px 16px;
  font-size: 14px;
  border-bottom: 1px solid var(--color-border);
}
.action-row:last-child {
  border-bottom: none;
}
.action-row .arrow {
  color: var(--color-text-sub);
  font-size: 18px;
}
.action-row.danger {
  color: var(--color-danger);
}
.edit-form {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-group label {
  font-size: 13px;
  color: var(--color-text-sub);
}
.text-input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-size: 14px;
}
.text-input:focus {
  border-color: var(--color-primary);
}
textarea.text-input {
  resize: vertical;
  font-family: inherit;
}
.radio-row {
  display: flex;
  gap: 16px;
}
.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.chip {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  color: var(--color-text-sub);
}
.chip.on {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}
@media (min-width: 768px) {
  .pc-pad {
    margin-left: 200px;
    max-width: 800px;
  }
}
</style>
