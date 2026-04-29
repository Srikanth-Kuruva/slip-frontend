<template>
  <div class="results-page">
    <router-link to="/conductor" class="back-link">← Back to Dashboard</router-link>

    <div class="page-header">
      <div>
        <h1>Session Results</h1>
        <p class="subtitle" v-if="session">
          {{ session.test?.title }} &nbsp;·&nbsp;
          <code class="session-code">{{ session.sessionCode }}</code>
          <span class="badge ml" :class="session.isActive ? 'badge-active' : 'badge-inactive'">
            {{ session.isActive ? 'Active' : 'Ended' }}
          </span>
        </p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">Loading submissions…</div>

    <div v-else>
      <!-- Summary stats -->
      <div class="stats-row" v-if="submissions.length">
        <div class="stat-mini card">
          <span class="sval">{{ submissions.length }}</span>
          <span class="slabel">Submitted</span>
        </div>
        <div class="stat-mini card">
          <span class="sval">{{ avgScore }}%</span>
          <span class="slabel">Avg Score</span>
        </div>
        <div class="stat-mini card">
          <span class="sval">{{ topScore }}%</span>
          <span class="slabel">Top Score</span>
        </div>
        <div class="stat-mini card">
          <span class="sval">{{ avgDistance }}m</span>
          <span class="slabel">Avg Distance</span>
        </div>
      </div>

      <div v-if="submissions.length === 0" class="empty-state card">
        <div class="empty-icon">🕐</div>
        <p>No submissions yet. Students will appear here as they submit.</p>
      </div>

      <div v-else class="submissions-list">
        <div v-for="sub in submissions" :key="sub._id" class="submission-card card">
          <div class="sub-header">
            <div class="student-info">
              <div class="avatar">{{ sub.student?.name?.charAt(0) || '?' }}</div>
              <div>
                <div class="student-name">{{ sub.student?.name }}</div>
                <div class="student-roll">{{ sub.student?.rollNumber || sub.student?.email }}</div>
              </div>
            </div>
            <div class="sub-score">
              <div class="score-pct">{{ scorePercent(sub) }}%</div>
              <div class="score-raw">{{ sub.score ?? '–' }} / {{ sub.totalMarks }}</div>
            </div>
          </div>

          <div class="sub-meta">
            <span>📍 {{ sub.distanceFromConductor }}m from centre</span>
            <span>⏱ {{ formatTime(sub.timeTaken) }}</span>
            <span>🕐 {{ formatDate(sub.submittedAt) }}</span>
            <span class="badge" :class="sub.status === 'graded' ? 'badge-active' : 'badge-gold'">{{ sub.status }}</span>
          </div>

          <!-- Answers review -->
          <details class="answers-review">
            <summary>Review Answers</summary>
            <div class="answers-list">
              <div v-for="(ans, idx) in sub.answers" :key="idx" class="answer-item">
                <div class="q-text">
                  <strong>Q{{ idx + 1 }}:</strong>
                  {{ getQuestion(sub.test, ans.questionId)?.questionText }}
                </div>
                <div class="a-text">
                  <span class="a-label">Answer:</span>
                  {{ ans.answer || '(no answer)' }}
                </div>
                <div
                  v-if="getQuestion(sub.test, ans.questionId)?.questionType === 'mcq'"
                  class="correct-ans"
                  :class="{ correct: ans.answer === getQuestion(sub.test, ans.questionId)?.correctAnswer }"
                >
                  Correct: {{ getQuestion(sub.test, ans.questionId)?.correctAnswer }}
                </div>
              </div>
            </div>
          </details>

          <!-- Manual grading for non-MCQ -->
          <div class="grade-row" v-if="sub.status !== 'graded'">
            <input v-model.number="gradeInputs[sub._id]" type="number" :max="sub.totalMarks" min="0" class="grade-input" :placeholder="`/ ${sub.totalMarks}`" />
            <button class="btn btn-primary btn-sm" @click="gradeSubmission(sub._id, sub.totalMarks)">Save Grade</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../api'

const route = useRoute()
const sessionId = route.params.id

const session = ref(null)
const submissions = ref([])
const loading = ref(true)
const gradeInputs = ref({})

onMounted(async () => {
  try {
    const [sessRes, subRes] = await Promise.all([
      api.get(`/sessions/my`),
      api.get(`/submissions/session/${sessionId}`)
    ])
    session.value = sessRes.data.find(s => s._id === sessionId)
    submissions.value = subRes.data
  } finally {
    loading.value = false
  }
})

const avgScore = computed(() => {
  if (!submissions.value.length) return 0
  const total = submissions.value.reduce((s, sub) => {
    return s + (sub.score != null ? (sub.score / sub.totalMarks) * 100 : 0)
  }, 0)
  return Math.round(total / submissions.value.length)
})

const topScore = computed(() => {
  if (!submissions.value.length) return 0
  return Math.round(Math.max(...submissions.value.map(s => s.score != null ? (s.score / s.totalMarks) * 100 : 0)))
})

const avgDistance = computed(() => {
  if (!submissions.value.length) return 0
  return Math.round(submissions.value.reduce((s, sub) => s + (sub.distanceFromConductor || 0), 0) / submissions.value.length)
})

function scorePercent(sub) {
  if (sub.score == null || !sub.totalMarks) return '–'
  return Math.round((sub.score / sub.totalMarks) * 100)
}

function getQuestion(test, questionId) {
  return test?.questions?.find(q => q._id === questionId)
}

async function gradeSubmission(subId, totalMarks) {
  const score = gradeInputs.value[subId]
  if (score == null || score < 0 || score > totalMarks) return
  const { data } = await api.patch(`/submissions/${subId}/grade`, { score })
  const idx = submissions.value.findIndex(s => s._id === subId)
  if (idx !== -1) submissions.value[idx] = { ...submissions.value[idx], ...data }
}

function formatDate(d) {
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatTime(seconds) {
  if (!seconds) return '–'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}
</script>

<style scoped>
.back-link { font-size: 14px; color: var(--gray); display: block; margin-bottom: 16px; }
.page-header { margin-bottom: 28px; }
h1 { font-size: 30px; }
.subtitle { color: var(--gray); display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
.session-code { font-weight: bold; color: var(--navy); font-size: 16px; }
.ml { margin-left: 4px; }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
.stat-mini { text-align: center; padding: 20px; }
.sval { display: block; font-size: 32px; font-family: var(--font-display); font-weight: 700; color: var(--navy); }
.slabel { font-size: 12px; color: var(--gray); }

.empty-state { text-align: center; padding: 56px; }
.empty-icon { font-size: 48px; margin-bottom: 16px; }

.submissions-list { display: flex; flex-direction: column; gap: 16px; }

.sub-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }

.student-info { display: flex; align-items: center; gap: 12px; }

.avatar {
  width: 42px; height: 42px;
  background: var(--navy);
  color: var(--gold);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display);
  font-size: 20px; font-weight: 700;
  flex-shrink: 0;
}

.student-name { font-weight: 600; font-size: 16px; }
.student-roll { font-size: 13px; color: var(--gray); }

.sub-score { text-align: right; }
.score-pct { font-size: 28px; font-family: var(--font-display); font-weight: 700; color: var(--navy); line-height: 1; }
.score-raw { font-size: 13px; color: var(--gray); margin-top: 2px; }

.sub-meta { display: flex; gap: 16px; font-size: 13px; color: var(--gray); flex-wrap: wrap; margin-bottom: 16px; }

.answers-review { margin-top: 12px; }
.answers-review summary { cursor: pointer; font-size: 14px; font-weight: 500; color: var(--navy); padding: 8px 0; }

.answers-list { margin-top: 12px; display: flex; flex-direction: column; gap: 12px; }

.answer-item { background: var(--cream); padding: 12px 16px; border-radius: var(--radius-sm); }
.q-text { font-size: 14px; margin-bottom: 6px; }
.a-text { font-size: 13px; color: var(--gray); }
.a-label { font-weight: 500; color: var(--navy-mid); }

.correct-ans { font-size: 12px; margin-top: 6px; color: var(--red); }
.correct-ans.correct { color: var(--green); }

.grade-row { display: flex; align-items: center; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--gray-light); }

.grade-input { width: 100px; padding: 8px 12px; border: 1.5px solid var(--gray-light); border-radius: var(--radius-sm); font-size: 15px; }

.loading-state { text-align: center; padding: 40px; color: var(--gray); }

@media (max-width: 640px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
</style>
