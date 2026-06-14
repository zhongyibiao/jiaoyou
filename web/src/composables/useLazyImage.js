/**
 * 图片懒加载 composable
 * 使用 IntersectionObserver，进入视口才加载
 */
import { ref, onMounted, onUnmounted } from 'vue';

export function useLazyImage(src, options = {}) {
  const { rootMargin = '200px', threshold = 0.01 } = options;
  const loaded = ref(false);
  const visible = ref(false);
  const error = ref(false);
  const target = ref(null);
  let observer = null;

  onMounted(() => {
    if (!target.value || typeof IntersectionObserver === 'undefined') {
      visible.value = true;
      return;
    }
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visible.value = true;
            observer?.disconnect();
          }
        });
      },
      { rootMargin, threshold },
    );
    observer.observe(target.value);
  });

  onUnmounted(() => observer?.disconnect());

  function onLoad() { loaded.value = true; }
  function onError() { error.value = true; }

  return { target, visible, loaded, error, onLoad, onError, src };
}
