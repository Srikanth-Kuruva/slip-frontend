<template>
  <div class="result-page">
    <div class="result-card card">
      <div v-if="!submission">
        <p class="no-result">No result data found. <router-link to="/student">Go back</router-link></p>
      </div>

      <div v-else>
        <!-- Result hero -->
        <div class="result-hero" :class="gradeClass">
          <div class="result-icon">{{ gradeIcon }}</div>
          <div class="result-label">{{ gradeLabel }}</div>
          <div class="score-big">{{ submission.score ?? '–' }} / {{ submission.totalMarks }}</div>
          <div class="score-pct">{{ scorePercent }}%</div>
        </div>

        <!-- Details -->
        <div class="result-details">
          <div class="detail-row">
            <span>📍 Distance from conductor</span>
            <strong>{{ submission.distanceFromConductor }}m</strong>
          </div>
          <div class="detail-row">
            <span>⏱ Time taken</span>
            <strong>{{ formatTime(submission.timeTaken) }}</strong>
          </div>
          <div class="detail-row">
            <span>📅 Submitted at</span>
            <strong>{{ formatDate(submission.submittedAt) }}</strong>
          </div>
          <div class="detail-row">
            <span>📊 Status</span>
            <span class="badge" :class="submission.status === 'graded' ? 'badge-active' : 'badge-gold'">
              {{ submission.status }}
            </span>
          </div>
        </div>

        <div v-if="submission.status === 'submitted'" class="pending-notice alert alert-info">
          Your answers have been received. Your conductor will review and assign final marks for written questions.
        </div>

        <div class="result-actions">
          <router-link to="/student" class="btn btn-primary">Take Another Test</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const raw = sessionStorage.getItem('submissionResult')
const submission = ref(raw ? JSON.parse(raw) : null)

const scorePercent = computed(() => {
  if (!submission.value || submission.value.score == null || !submission.value.totalMarks) return 0
  return Math.round((submission.value.score / submission.value.totalMarks) * 100)
})

const gradeClass = computed(() => {
  const p = scorePercent.value
  if (p >= 80) return 'grade-a'
  if (p >= 60) return 'grade-b'
  if (p >= 40) return 'grade-c'
  return 'grade-f'
})

const gradeIcon = computed(() => {
  const p = scorePercent.value
  if (p >= 80) return '🏆'
  if (p >= 60) return '🎉'
  if (p >= 40) return '👍'
  return '📚'
})

const gradeLabel = computed(() => {
  const p = scorePercent.value
  if (p >= 80) return 'Excellent!'
  if (p >= 60) return 'Good Work!'
  if (p >= 40) return 'Passed'
  return 'Needs Improvement'
})

function formatTime(seconds) {
  if (!seconds) return '–'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function formatDate(d) {
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
</script>

<style scoped>
.result-page {
  min-height: calc(100vh - 94px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-card {
  width: 100%;
  max-width: 480px;
  overflow: hidden;
  padding: 0;
}

.result-hero {
  padding: 48px 32px;
  text-align: center;
  color: white;
}

.grade-a { background: linear-gradient(135deg, #1a5c2a, #2e8b57); }
.grade-b { background: linear-gradient(135deg, #1a3a5c, #2a5c8b); }
.grade-c { background: linear-gradient(135deg, #5c4a1a, #8b6914); }
.grade-f { background: linear-gradient(135deg, #5c1a1a, #8b2222); }

.result-icon { font-size: 56px; margin-bottom: 8px; }
.result-label { font-size: 18px; opacity: 0.9; margin-bottom: 16px; font-weight: 500; }

.score-big {
  font-family: var(--font-display);
  font-size: 52px;
  font-weight: 700;
  line-height: 1;
}

.score-pct {
  font-size: 22px;
  opacity: 0.85;
  margin-top: 4px;
}

.result-details {
  padding: 24px 32px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--gray-light);
  font-size: 14px;
  color: var(--gray);
}

.detail-row:last-child { border-bottom: none; }
.detail-row strong { color: var(--navy); }

.pending-notice { margin: 0 32px; }

.result-actions {
  padding: 24px 32px;
  display: flex;
  gap: 12px;
}

.no-result {
  padding: 40px;
  text-align: center;
  color: var(--gray);
}
</style>
