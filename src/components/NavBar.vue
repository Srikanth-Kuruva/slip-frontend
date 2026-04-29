<template>
  <nav class="navbar">
    <div class="navbar-inner">
      <div class="brand">
        <span class="brand-icon">📝</span>
        <span class="brand-name">ExamifyNow</span>
      </div>
      <div class="nav-right">
        <span class="user-info">
          <span class="user-name">{{ auth.user?.name }}</span>
          <span class="badge" :class="auth.isConductor ? 'badge-gold' : 'badge-blue'">
            {{ auth.user?.role }}
          </span>
        </span>
        <button class="btn btn-outline btn-sm" @click="handleLogout">Logout</button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  background: var(--navy);
  color: var(--white);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 16px rgba(0,0,0,0.18);
}

.navbar-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.02em;
}

.brand-icon { font-size: 22px; }

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--cream);
}

.btn-outline {
  color: var(--cream);
  border-color: var(--gray);
  font-size: 13px;
  padding: 6px 14px;
}

.btn-outline:hover {
  background: var(--navy-light);
  border-color: var(--cream);
  color: var(--white);
}
</style>
