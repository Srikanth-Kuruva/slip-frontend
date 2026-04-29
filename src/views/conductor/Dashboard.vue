<template>
  <div class="dashboard">
    <div class="page-header">
      <div>
        <h1>Conductor Dashboard</h1>
        <p class="subtitle">Manage your slip tests and active sessions</p>
      </div>
      <router-link to="/conductor/tests/create" class="btn btn-gold">
        + Create New Test
      </router-link>
    </div>

    <!-- Active sessions banner -->
    <div v-if="activeSessions.length" class="active-banner">
      <div class="active-banner-icon">🟢</div>
      <div>
        <strong>{{ activeSessions.length }} Active Session{{ activeSessions.length > 1 ? 's' : '' }}</strong>
        <p>Students can currently join these tests</p>
      </div>
      <div class="active-sessions-list">
        <div v-for="s in activeSessions" :key="s._id" class="active-session-chip">
          <span>{{ s.test?.title }}</span>
          <span class="session-code">{{ s.sessionCode }}</span>
          <router-link :to="`/conductor/sessions/${s._id}/results`" class="btn btn-sm btn-primary">View</router-link>
        </div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ tests.length }}</div>
        <div class="stat-label">Total Tests</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ sessions.length }}</div>
        <div class="stat-label">Sessions Run</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ activeSessions.length }}</div>
        <div class="stat-label">Active Now</div>
      </div>
    </div>

    <!-- Tests list -->
    <div class="section">
      <h2>Your Tests</h2>
      <div v-if="loading" class="loading-state">Loading tests…</div>
      <div v-else-if="tests.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No tests yet. Create your first slip test!</p>
        <router-link to="/conductor/tests/create" class="btn btn-gold">Create Test</router-link>
      </div>
      <div v-else class="tests-grid">
        <div v-for="test in tests" :key="test._id" class="test-card card">
          <div class="test-card-header">
            <div>
              <h3 class="test-title">{{ test.title }}</h3>
              <span class="test-subject">{{ test.subject }}</span>
            </div>
            <span class="badge badge-blue">{{ test.questions?.length || 0 }} Qs</span>
          </div>
          <div class="test-meta">
            <span>⏱ {{ test.duration }} min</span>
            <span>📊 {{ test.totalMarks }} marks</span>
            <span>📅 {{ formatDate(test.createdAt) }}</span>
          </div>
          <div class="test-actions">
            <router-link :to="`/conductor/tests/${test._id}/session`" class="btn btn-primary btn-sm">
              🚀 Start Session
            </router-link>
            <button class="btn btn-outline btn-sm" @click="deleteTest(test._id)">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent sessions -->
    <div class="section" v-if="sessions.length > 0">
      <h2>Recent Sessions</h2>
      <div class="sessions-table">
        <table>
          <thead>
            <tr>
              <th>Test</th>
              <th>Session Code</th>
              <th>Radius</th>
              <th>Status</th>
              <th>Started</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sessions" :key="s._id">
              <td>{{ s.test?.title }}</td>
              <td><code class="code">{{ s.sessionCode }}</code></td>
              <td>{{ s.radiusMeters }}m</td>
              <td>
                <span class="badge" :class="s.isActive ? 'badge-active' : 'badge-inactive'">
                  {{ s.isActive ? 'Active' : 'Ended' }}
                </span>
              </td>
              <td>{{ formatDate(s.startedAt) }}</td>
              <td>
                <router-link :to="`/conductor/sessions/${s._id}/results`" class="btn btn-sm btn-outline">
                  Results
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../api'

const tests = ref([])
const sessions = ref([])
const loading = ref(true)

const activeSessions = computed(() => sessions.value.filter(s => s.isActive))

onMounted(async () => {
  try {
    const [testsRes, sessionsRes] = await Promise.all([
      api.get('/tests/my'),
      api.get('/sessions/my')
    ])
    tests.value = testsRes.data
    sessions.value = sessionsRes.data
  } finally {
    loading.value = false
  }
})

async function deleteTest(id) {
  if (!confirm('Delete this test? This cannot be undone.')) return
  await api.delete(`/tests/${id}`)
  tests.value = tests.value.filter(t => t._id !== id)
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}

h1 { font-size: 32px; margin-bottom: 4px; }
.subtitle { color: var(--gray); font-size: 14px; }

.active-banner {
  background: linear-gradient(135deg, #1a3a0f, #2a5c1a);
  color: white;
  border-radius: var(--radius);
  padding: 20px 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.active-banner-icon { font-size: 24px; }
.active-banner strong { font-size: 16px; }
.active-banner p { font-size: 13px; opacity: 0.8; }

.active-sessions-list { margin-left: auto; display: flex; flex-direction: column; gap: 8px; }
.active-session-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.1);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
}

.session-code { font-family: monospace; font-weight: bold; color: #90ee90; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--navy);
  color: white;
  border-radius: var(--radius);
  padding: 24px;
  text-align: center;
}

.stat-value { font-size: 40px; font-family: var(--font-display); color: var(--gold); font-weight: 700; }
.stat-label { font-size: 13px; color: var(--gray); margin-top: 4px; }

.section { margin-bottom: 40px; }
.section h2 { font-size: 22px; margin-bottom: 20px; }

.empty-state {
  text-align: center;
  padding: 48px;
  background: white;
  border-radius: var(--radius);
  color: var(--gray);
}

.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-state p { margin-bottom: 20px; }

.tests-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

.test-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.test-title { font-size: 17px; margin-bottom: 2px; }
.test-subject { font-size: 12px; color: var(--gray); text-transform: uppercase; letter-spacing: 0.05em; }

.test-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--gray);
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.test-actions { display: flex; gap: 10px; }

.sessions-table {
  background: white;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
}

table { width: 100%; border-collapse: collapse; }
th { background: var(--navy); color: white; padding: 12px 16px; font-size: 13px; font-weight: 500; text-align: left; }
td { padding: 12px 16px; border-bottom: 1px solid var(--gray-light); font-size: 14px; }
tr:last-child td { border-bottom: none; }
tr:hover td { background: var(--cream); }

.code { background: var(--cream); padding: 3px 8px; border-radius: 4px; font-size: 13px; font-weight: bold; }

.loading-state { text-align: center; padding: 40px; color: var(--gray); }
</style>
