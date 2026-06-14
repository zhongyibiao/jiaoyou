import { defineStore } from 'pinia'
import { ref } from 'vue'
import { matchApi, type User } from '@/api'

export const useRecommendStore = defineStore('recommend', () => {
  const list = ref<User[]>([])
  const loading = ref(false)
  const finished = ref(false)

  async function load(reset = false) {
    if (loading.value) return
    if (reset) {
      list.value = []
      finished.value = false
    }
    if (finished.value) return
    loading.value = true
    try {
      const res = await matchApi.recommendations(20)
      const items: User[] = res || []
      if (items.length === 0) finished.value = true
      list.value = [...list.value, ...items]
    } finally {
      loading.value = false
    }
  }

  function removeFromList(id: number) {
    list.value = list.value.filter((u) => u.id !== id)
  }

  return { list, loading, finished, load, removeFromList }
})
