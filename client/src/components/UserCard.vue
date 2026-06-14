<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '@/api'
import { resolveFileUrl } from '@/api'

const props = defineProps<{ user: User; compact?: boolean }>()
const emit = defineEmits<{ (e: 'click', user: User): void }>()

const avatar = computed(() => resolveFileUrl(props.user.avatar))
const genderLabel = computed(() => {
  if (props.user.gender === 1) return '♂'
  if (props.user.gender === 2) return '♀'
  return ''
})

function open() {
  emit('click', props.user)
}
</script>

<template>
  <div class="user-card card" :class="{ compact }" @click="open">
    <div class="cover">
      <img v-if="user.avatar" :src="avatar" :alt="user.nickname" />
      <div v-else class="cover-fallback">{{ user.nickname?.[0] || '?' }}</div>
      <span v-if="user.online" class="online-dot" title="在线" />
      <span v-if="genderLabel" class="gender-badge">{{ genderLabel }}</span>
      <div class="bottom">
        <div class="info">
          <span class="name">{{ user.nickname }}</span>
          <span class="meta">
            <span v-if="user.age">{{ user.age }}岁 · </span>
            <span v-if="user.city">{{ user.city }}</span>
            <span v-if="!user.age && !user.city">ID: {{ user.id }}</span>
          </span>
        </div>
      </div>
    </div>
    <div v-if="!compact" class="body">
      <p v-if="user.bio" class="bio text-ellipsis">{{ user.bio }}</p>
      <div v-if="user.interests?.length" class="tags">
        <span v-for="i in user.interests.slice(0, 3)" :key="i" class="tag">#{{ i }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.user-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}
.cover {
  position: relative;
  aspect-ratio: 3 / 4;
  background: linear-gradient(135deg, #ffd1d1, #ffaaa5);
  overflow: hidden;
}
.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #fff;
  font-size: 48px;
  font-weight: 600;
}
.online-dot {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 10px;
  height: 10px;
  background: var(--color-success);
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 6px rgba(82, 196, 26, 0.6);
}
.gender-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 12px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px 12px 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.55), transparent);
  color: #fff;
}
.info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.name {
  font-size: 16px;
  font-weight: 600;
}
.meta {
  font-size: 12px;
  opacity: 0.85;
}
.body {
  padding: 12px;
}
.bio {
  margin: 0 0 8px;
  color: var(--color-text-sub);
  font-size: 13px;
  line-height: 1.5;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag {
  font-size: 11px;
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}
.user-card.compact .cover {
  aspect-ratio: 1;
}
</style>
