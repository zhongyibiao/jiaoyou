import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/recommendations',
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/AuthView.vue'),
    meta: { layout: 'blank', title: '注册登录' },
  },
  {
    path: '/recommendations',
    name: 'Recommendations',
    component: () => import('@/views/RecommendationsView.vue'),
    meta: { layout: 'tabbar', title: '推荐' },
  },
  {
    path: '/match',
    name: 'Match',
    component: () => import('@/views/MatchView.vue'),
    meta: { layout: 'tabbar', title: '滑动匹配' },
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/ChatView.vue'),
    meta: { layout: 'tabbar', title: '消息' },
  },
  {
    path: '/chat/:id',
    name: 'ChatWindow',
    component: () => import('@/views/ChatWindowView.vue'),
    meta: { layout: 'default', title: '聊天' },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { layout: 'tabbar', title: '个人中心', auth: true },
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('@/views/PrivacyView.vue'),
    meta: { layout: 'default', title: '隐私设置', auth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { layout: 'blank', title: '页面不存在' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 交友`
  }
  if (to.meta.auth) {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      next({ name: 'Auth', query: { redirect: to.fullPath } })
      return
    }
  }
  next()
})

export default router
