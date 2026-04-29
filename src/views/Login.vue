<template>
  <div class="auth-page">
    <div class="auth-left">
      <div class="auth-brand">
        <div class="brand-logo">📝</div>
        <h1 class="brand-title">SlipTest</h1>
        <p class="brand-sub">Location-Verified Examination System</p>
      </div>
      <div class="auth-features">
        <div class="feature">
          <span class="feature-icon">📍</span>
          <div>
            <strong>Location Gating</strong>
            <p>Students must be within the conductor's set radius to access the test.</p>
          </div>
        </div>
        <div class="feature">
          <span class="feature-icon">🔐</span>
          <div>
            <strong>Secure Sessions</strong>
            <p>One-time session codes ensure only authorised participants join.</p>
          </div>
        </div>
        <div class="feature">
          <span class="feature-icon">📊</span>
          <div>
            <strong>Instant Results</strong>
            <p>MCQ auto-grading and detailed submission analytics.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="auth-right">
      <div class="auth-card">
        <h2 class="auth-title">Welcome back</h2>
        <p class="auth-desc">Sign in to your account</p>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <div class="form-group">
          <label>Email address</label>
          <input v-model="form.email" type="email" class="form-control" placeholder="you@example.com" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="form.password" type="password" class="form-control" placeholder="••••••••" @keyup.enter="handleLogin" />
        </div>

        <button class="btn btn-gold w-full" :disabled="loading" @click="handleLogin">
          <span v-if="loading" class="spinner" style="border-color:rgba(0,0,0,0.2);border-top-color:#0f1e3d;"></span>
          <span v-else>Sign In</span>
        </button>

        <p class="auth-footer">
          Don't have an account?
          <router-link to="/register" class="link">Create one</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const auth = useAuthStore()
const router = useRouter()

const form = ref({ email: '', password: '' })
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  if (!form.value.email || !form.value.password) {
    error.value = 'Please fill in all fields'
    return
  }
  loading.value = true
  try {
    const user = await auth.login(form.value.email, form.value.password)
    router.push(user.role === 'conductor' ? '/conductor' : '/student')
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 0px);
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin: -32px -24px;
}

.auth-left {
  background: var(--navy);
  color: var(--white);
  padding: 64px 56px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 48px;
}

.auth-brand { text-align: left; }

.brand-logo {
  font-size: 52px;
  margin-bottom: 16px;
}

.brand-title {
  font-size: 40px;
  color: var(--gold);
  margin-bottom: 8px;
}

.brand-sub {
  color: var(--gray);
  font-size: 15px;
}

.auth-features {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.feature {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.feature-icon { font-size: 24px; flex-shrink: 0; margin-top: 2px; }

.feature strong {
  display: block;
  color: var(--cream);
  margin-bottom: 4px;
  font-size: 15px;
}

.feature p {
  color: var(--gray);
  font-size: 13px;
  line-height: 1.5;
}

.auth-right {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cream);
  padding: 48px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
}

.auth-title {
  font-size: 28px;
  margin-bottom: 6px;
}

.auth-desc {
  color: var(--gray);
  margin-bottom: 28px;
  font-size: 14px;
}

.w-full { width: 100%; justify-content: center; margin-top: 4px; }

.auth-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: var(--gray);
}

.link { color: var(--navy); font-weight: 600; }

@media (max-width: 768px) {
  .auth-page { grid-template-columns: 1fr; }
  .auth-left { display: none; }
  .auth-right { min-height: 100vh; }
}
</style>
