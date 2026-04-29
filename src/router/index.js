import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('../views/Login.vue'), meta: { guest: true } },
  { path: '/register', component: () => import('../views/Register.vue'), meta: { guest: true } },
  // Conductor routes
  {
    path: '/conductor',
    component: () => import('../views/conductor/Dashboard.vue'),
    meta: { auth: true, role: 'conductor' }
  },
  {
    path: '/conductor/tests/create',
    component: () => import('../views/conductor/CreateTest.vue'),
    meta: { auth: true, role: 'conductor' }
  },
  {
    path: '/conductor/tests/:id/session',
    component: () => import('../views/conductor/StartSession.vue'),
    meta: { auth: true, role: 'conductor' }
  },
  {
    path: '/conductor/sessions/:id/results',
    component: () => import('../views/conductor/Results.vue'),
    meta: { auth: true, role: 'conductor' }
  },
  // Student routes
  {
    path: '/student',
    component: () => import('../views/student/JoinTest.vue'),
    meta: { auth: true, role: 'student' }
  },
  {
    path: '/student/test',
    component: () => import('../views/student/TakeTest.vue'),
    meta: { auth: true, role: 'student' }
  },
  {
    path: '/student/result',
    component: () => import('../views/student/TestResult.vue'),
    meta: { auth: true, role: 'student' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.auth && !auth.isAuthenticated) {
    return next('/login')
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return next(auth.isConductor ? '/conductor' : '/student')
  }

  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return next(auth.isConductor ? '/conductor' : '/student')
  }

  next()
})

export default router
