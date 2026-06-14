<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const mode = ref<'login' | 'register'>('login')
const phone = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const isRegister = computed(() => mode.value === 'register')

const PHONE_RE = /^1[3-9]\d{9}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function submit() {
  error.value = ''
  if (!phone.value || !password.value) {
    error.value = '请填写手机号和密码'
    return
  }
  if (!PHONE_RE.test(phone.value)) {
    error.value = '请输入正确的手机号'
    return
  }
  if (password.value.length < 8) {
    error.value = '密码长度至少 8 位'
    return
  }
  if (isRegister.value && email.value && !EMAIL_RE.test(email.value)) {
    error.value = '邮箱格式不正确'
    return
  }
  loading.value = true
  try {
    if (isRegister.value) {
      await userStore.register({
        phone: phone.value,
        email: email.value || undefined,
        password: password.value,
      })
    } else {
      await userStore.login(phone.value, password.value)
    }
    const redirect = (route.query.redirect as string) || '/recommendations'
    router.replace(redirect)
  } catch (e: any) {
    error.value = e?.message || '操作失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth">
    <div class="card auth-card">
      <div class="logo">恋遇</div>
      <p class="slogan">遇见对的人，从这里开始</p>
      <div class="tabs">
        <button :class="{ on: !isRegister }" @click="mode = 'login'">登录</button>
        <button :class="{ on: isRegister }" @click="mode = 'register'">注册</button>
      </div>
      <form class="form" @submit.prevent="submit">
        <input v-model="phone" placeholder="手机号" inputmode="numeric" maxlength="11" class="input" />
        <input v-if="isRegister" v-model="email" placeholder="邮箱（可选）" class="input" />
        <input v-model="password" type="password" placeholder="密码（至少 8 位）" class="input" />
        <p v-if="error" class="err">{{ error }}</p>
        <button class="btn-primary submit" :disabled="loading">
          {{ loading ? '提交中...' : isRegister ? '注册并登录' : '登录' }}
        </button>
      </form>
      <p class="hint">
        {{ isRegister ? '已有账号？' : '还没有账号？' }}
        <a @click="mode = isRegister ? 'login' : 'register'">
          {{ isRegister ? '去登录' : '去注册' }}
        </a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
}
.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 32px 28px;
  border-radius: var(--radius-lg);
}
.logo {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
  text-align: center;
  letter-spacing: 2px;
}
.slogan {
  text-align: center;
  color: var(--color-text-sub);
  margin: 8px 0 24px;
  font-size: 13px;
}
.tabs {
  display: flex;
  gap: 4px;
  background: var(--color-bg);
  border-radius: var(--radius-full);
  padding: 4px;
  margin-bottom: 20px;
}
.tabs button {
  flex: 1;
  padding: 8px 0;
  border-radius: var(--radius-full);
  font-size: 13px;
  color: var(--color-text-sub);
  transition: all 0.2s;
}
.tabs button.on {
  background: var(--color-card);
  color: var(--color-primary);
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  transition: border-color 0.2s;
}
.input:focus {
  border-color: var(--color-primary);
}
.gender-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--color-text-sub);
}
.err {
  color: var(--color-danger);
  font-size: 12px;
  margin: 0;
}
.submit {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  margin-top: 4px;
}
.hint {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-sub);
  margin: 16px 0 0;
}
.hint a {
  color: var(--color-primary);
  cursor: pointer;
  margin-left: 4px;
}
</style>
