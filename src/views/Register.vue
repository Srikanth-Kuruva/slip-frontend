<template>
  <div class="auth-page">
    <div class="auth-left">
      <div class="auth-brand">
        <div class="brand-logo">📝</div>
        <h1 class="brand-title">SlipTest</h1>
        <p class="brand-sub">Location-Verified Examination System</p>
      </div>
      <div class="role-cards">
        <div class="role-card" :class="{ active: form.role === 'conductor' }" @click="form.role = 'conductor'">
          <span class="role-icon">👨‍🏫</span>
          <div>
            <strong>Conductor</strong>
            <p>Create tests, set location, manage sessions</p>
          </div>
        </div>
        <div class="role-card" :class="{ active: form.role === 'student' }" @click="form.role = 'student'">
          <span class="role-icon">🎓</span>
          <div>
            <strong>Student</strong>
            <p>Join sessions and take slip tests</p>
          </div>
        </div>
      </div>
    </div>

    <div class="auth-right">
      <div class="auth-card">
        <h2 class="auth-title">Create Account</h2>
        <p class="auth-desc">Join the SlipTest platform</p>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <div class="form-group">
          <label>Full Name</label>
          <input v-model="form.name" type="text" class="form-control" placeholder="Your full name" />
        </div>
        <div class="form-group">
          <label>Email address</label>
          <input v-model="form.email" type="email" class="form-control" placeholder="you@example.com" />
        </div>
        <div v-if="form.role === 'student'" class="form-group">
          <label>Roll Number</label>
          <input v-model="form.rollNumber" type="text" class="form-control" placeholder="e.g. CS2021001" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="form.password" type="password" class="form-control" placeholder="Min 6 characters" />
        </div>
        <div class="form-group">
          <label>Role</label>
          <select v-model="form.role" class="form-control">
            <option value="student">Student</option>
            <option value="conductor">Conductor / Teacher</option>
          </select>
        </div>

        <button class="btn btn-gold w-full" :disabled="loading" @click="handleRegister">
          <span v-if="loading" class="spinner" style="border-color:rgba(0,0,0,0.2);border-top-color:#0f1e3d;"></span>
          <span v-else>Create Account</span>
        </button>

        <p class="auth-footer">
          Already have an account?
          <router-link to="/login" class="link">Sign in</router-link>
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

const form = ref({ name: '', email: '', password: '', role: 'student', rollNumber: '' })
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  error.value = ''
  const { name, email, password, role } = form.value
  if (!name || !email || !password || !role) {
    error.value = 'Please fill in all required fields'
    return
  }
  if (password.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }
  loading.value = true
  try {
    const user = await auth.register(form.value)
    router.push(user.role === 'conductor' ? '/conductor' : '/student')
  } catch (err) {
    error.value = err.response?.data?.message || 'Registration failed. Please try again.'
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
  gap: 40px;
}

.auth-brand { }
.brand-logo { font-size: 52px; margin-bottom: 16px; }
.brand-title { font-size: 40px; color: var(--gold); margin-bottom: 8px; }
.brand-sub { color: var(--gray); font-size: 15px; }

.role-cards { display: flex; flex-direction: column; gap: 16px; }

.role-card {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 16px 20px;
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s;
}

.role-card:hover, .role-card.active {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.08);
}

.role-icon { font-size: 26px; flex-shrink: 0; }

.role-card strong { display: block; color: var(--cream); margin-bottom: 4px; }
.role-card p { color: var(--gray); font-size: 12px; }

.auth-right {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cream);
  padding: 48px;
}

.auth-card { width: 100%; max-width: 400px; }
.auth-title { font-size: 28px; margin-bottom: 6px; }
.auth-desc { color: var(--gray); margin-bottom: 28px; font-size: 14px; }

.w-full { width: 100%; justify-content: center; margin-top: 4px; }

.auth-footer { text-align: center; margin-top: 20px; font-size: 14px; color: var(--gray); }
.link { color: var(--navy); font-weight: 600; }

@media (max-width: 768px) {
  .auth-page { grid-template-columns: 1fr; }
  .auth-left { display: none; }
}
</style>
