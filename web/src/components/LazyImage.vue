<template>
  <div ref="target" class="lazy-image" :class="{ 'is-loaded': loaded, 'is-error': error }">
    <img
      v-if="visible"
      :src="src"
      :alt="alt"
      loading="lazy"
      decoding="async"
      @load="onLoad"
      @error="onError"
    />
    <div v-else class="lazy-image__placeholder" />
  </div>
</template>

<script setup>
import { useLazyImage } from '../composables/useLazyImage';

const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: '' },
});
const { target, visible, loaded, error, onLoad, onError } = useLazyImage(props.src);
</script>

<style scoped>
.lazy-image {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f0f0f0;
}
.lazy-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s;
}
.lazy-image.is-loaded img { opacity: 1; }
.lazy-image__placeholder {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #eee 0%, #f5f5f5 50%, #eee 100%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
