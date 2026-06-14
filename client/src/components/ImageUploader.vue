<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  modelValue?: string
  maxSize?: number // MB
  round?: boolean
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'upload', file: File): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const preview = ref(props.modelValue || '')

function pick() {
  inputRef.value?.click()
}

function onChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (props.maxSize) {
    const limit = props.maxSize * 1024 * 1024
    if (file.size > limit) {
      alert(`图片不能超过 ${props.maxSize}MB`)
      return
    }
  }
  const reader = new FileReader()
  reader.onload = () => {
    preview.value = reader.result as string
    emit('update:modelValue', preview.value)
    emit('upload', file)
  }
  reader.readAsDataURL(file)
  target.value = ''
}
</script>

<template>
  <div class="uploader" :class="{ round }" @click="pick">
    <img v-if="preview" :src="preview" alt="预览" />
    <div v-else class="placeholder">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" />
      </svg>
      <span>上传图片</span>
    </div>
    <input ref="inputRef" type="file" accept="image/*" hidden @change="onChange" />
  </div>
</template>

<style scoped>
.uploader {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  transition: border-color 0.2s;
}
.uploader:hover {
  border-color: var(--color-primary);
}
.uploader.round {
  width: 96px;
  height: 96px;
  aspect-ratio: auto;
  border-radius: 50%;
}
.uploader img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--color-text-sub);
  font-size: 12px;
}
.uploader.round .placeholder span {
  display: none;
}
</style>
