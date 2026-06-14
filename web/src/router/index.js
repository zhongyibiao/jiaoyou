/**
 * 路由懒加载
 * Vite 默认支持 dynamic import，自动 code-splitting
 * 这里只做命名约定 + 路由分组
 */
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/discover',
    name: 'discover',
    component: () => import('../views/DiscoverView.vue'),
    meta: { title: '发现', keepAlive: true },
  },
  {
    path: '/matches',
    name: 'matches',
    component: () => import('../views/MatchesView.vue'),
    meta: { title: '匹配', keepAlive: true },
  },
  {
    path: '/chat/:id',
    name: 'chat',
    component: () => import('../views/ChatView.vue'),
    meta: { title: '聊天' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { title: '我的' },
  },
  {
    path: '/settings/privacy',
    name: 'privacy',
    component: () => import('../views/PrivacyView.vue'),
    meta: { title: '隐私设置', requiresAuth: true },
  },
  {
    path: '/settings/blocks',
    name: 'blocks',
    component: () => import('../views/BlocksView.vue'),
    meta: { title: '黑名单', requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: '登录' },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    return saved || { top: 0 };
  },
});

router.beforeEach((to, from, next) => {
  if (to.meta?.title) document.title = `${to.meta.title} - jiaoyou`;
  if (to.meta?.requiresAuth) {
    const token = localStorage.getItem('token');
    if (!token) return next({ name: 'login', query: { redirect: to.fullPath } });
  }
  next();
});
