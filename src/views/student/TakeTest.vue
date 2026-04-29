<template>
  <div class="take-test">
    <!-- Out of range warning overlay -->
    <div v-if="outOfRange" class="oor-overlay">
      <div class="oor-card">
        <div class="oor-icon">🚫</div>
        <h2>You Left the Range!</h2>
        <p>You have moved outside the allowed area. Please return to the exam venue.</p>
        <div class="oor-distance">{{ currentDistance }}m away (max {{ session?.radiusMeters }}m)</div>
        <button class="btn btn-primary" @click="pingLocation">↻ Check Again</button>
      </div>
    </div>

    <!-- Header -->
    <div class="test-header" v-if="test">
      <div class="test-meta-header">
        <h1>{{ test.title }}</h1>
        <span class="test-subject-badge">{{ test.subject }}</span>
      </div>
      <div class="header-right">
        <div class="timer" :class="{ warning: timeLeft < 300, danger: timeLeft < 60 }">
          ⏱ {{ formattedTime }}
        </div>
        <div class="progress-info">
          {{ answeredCount }} / {{ test.questions?.length }} answered
        </div>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="progress-bar-wrap">
      <div class="progress-bar-fill" :style="{ width: progressPct + '%' }"></div>
    </div>

    <!-- Location status bar -->
    <div class="location-bar" :class="locationOk ? 'loc-ok' : 'loc-warn'">
      <span>{{ locationOk ? '✅ Within range' : '⚠️ Checking location…' }}</span>
      <span v-if="currentDistance != null">{{ currentDistance }}m from conductor (max {{ session?.radiusMeters }}m)</span>
    </div>

    <!-- Questions -->
    <div v-if="test" class="questions-wrap">
      <div v-for="(q, idx) in test.questions" :key="q._id" class="question-block card" :class="{ answered: !!answers[q._id] }">
        <div class="q-header">
          <span class="q-badge">Q{{ idx + 1 }}</span>
          <span class="q-type-badge badge" :class="q.questionType === 'mcq' ? 'badge-gold' : 'badge-blue'">
            {{ q.questionType }}
          </span>
          <span class="q-marks">{{ q.marks }} mark{{ q.marks > 1 ? 's' : '' }}</span>
        </div>

        <div class="q-text">{{ q.questionText }}</div>

        <!-- MCQ -->
        <div v-if="q.questionType === 'mcq'" class="mcq-opts">
          <label
            v-for="(opt, oi) in q.options"
            :key="oi"
            class="mcq-opt"
            :class="{ selected: answers[q._id] === opt }"
          >
            <input type="radio" :name="q._id" :value="opt" v-model="answers[q._id]" class="sr-only" />
            <span class="opt-indicator">{{ String.fromCharCode(65 + oi) }}</span>
            {{ opt }}
          </label>
        </div>

        <!-- Short answer -->
        <div v-else-if="q.questionType === 'short'">
          <input
            v-model="answers[q._id]"
            type="text"
            class="form-control"
            placeholder="Your answer…"
          />
        </div>

        <!-- Long answer -->
        <div v-else>
          <textarea
            v-model="answers[q._id]"
            class="form-control"
            rows="5"
            placeholder="Write your answer here…"
          />
        </div>
      </div>
    </div>

    <!-- Submit bar -->
    <div class="submit-bar card" v-if="test">
      <div class="submit-info">
        <span>{{ answeredCount }} of {{ test.questions?.length }} questions answered</span>
        <span v-if="unanswered > 0" class="unanswered-warn">{{ unanswered }} unanswered</span>
      </div>
      <button class="btn btn-gold submit-btn" :disabled="submitting" @click="submitTest">
        <span v-if="submitting" class="spinner" style="border-color:rgba(0,0,0,0.2);border-top-color:#0f1e3d;"></span>
        <span v-else>Submit Test ✓</span>
      </button>
    </div>

    <div v-if="error" class="alert alert-error mt16">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api'

const router = useRouter()

const sessionData = JSON.parse(sessionStorage.getItem('activeSession') || 'null')
if (!sessionData) router.replace('/student')

const session = ref(sessionData?.session)
const test = ref(sessionData?.test)
const answers = reactive({})

const error = ref('')
const submitting = ref(false)
const outOfRange = ref(false)
const locationOk = ref(true)
const currentDistance = ref(null)

// Timer
const startTime = Date.now()
let totalSeconds = (test.value?.duration || 30) * 60
const timeLeft = ref(totalSeconds)

const formattedTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = timeLeft.value % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

const answeredCount = computed(() => Object.values(answers).filter(a => a && a.trim()).length)
const unanswered = computed(() => (test.value?.questions?.length || 0) - answeredCount.value)
const progressPct = computed(() => test.value?.questions?.length ? (answeredCount.value / test.value.questions.length) * 100 : 0)

let timerInterval = null
let pingInterval = null

onMounted(() => {
  if (!test.value) return

  // Countdown timer
  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval)
      submitTest(true)
    }
  }, 1000)

  // Location ping every 30 seconds
  pingLocation()
  pingInterval = setInterval(pingLocation, 30000)
})

onUnmounted(() => {
  clearInterval(timerInterval)
  clearInterval(pingInterval)
})

async function pingLocation() {
  if (!navigator.geolocation || !session.value) return

  navigator.geolocation.getCurrentPosition(
    async pos => {
      try {
        const { data } = await api.post(`/sessions/${session.value._id}/ping`, {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        })
        currentDistance.value = data.distance
        locationOk.value = data.withinRange
        outOfRange.value = !data.withinRange
      } catch {
        // Ignore ping errors silently
      }
    },
    () => { /* ignore location errors during test */ },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

async function submitTest(autoSubmit = false) {
  if (!autoSubmit && !confirm('Submit the test? You cannot change answers after submission.')) return

  submitting.value = true
  error.value = ''

  const answerPayload = test.value.questions.map(q => ({
    questionId: q._id,
    answer: answers[q._id] || ''
  }))

  const timeTaken = Math.round((Date.now() - startTime) / 1000)

  // Get final location
  navigator.geolocation.getCurrentPosition(
    async pos => {
      try {
        const { data } = await api.post('/submissions', {
          sessionId: session.value._id,
          answers: answerPayload,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timeTaken
        })

        sessionStorage.setItem('submissionResult', JSON.stringify(data.submission))
        sessionStorage.removeItem('activeSession')
        router.push('/student/result')
      } catch (err) {
        error.value = err.response?.data?.message || 'Submission failed'
        submitting.value = false
      }
    },
    async () => {
      // If we can't get location, try with last known
      try {
        const { data } = await api.post('/submissions', {
          sessionId: session.value._id,
          answers: answerPayload,
          latitude: sessionData.studentLat,
          longitude: sessionData.studentLon,
          timeTaken
        })
        sessionStorage.setItem('submissionResult', JSON.stringify(data.submission))
        sessionStorage.removeItem('activeSession')
        router.push('/student/result')
      } catch (err) {
        error.value = err.response?.data?.message || 'Submission failed'
        submitting.value = false
      }
    },
    { timeout: 8000 }
  )
}
</script>

<style scoped>
.take-test { position: relative; }

.oor-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.oor-card {
  background: white;
  padding: 40px;
  border-radius: var(--radius);
  text-align: center;
  max-width: 380px;
  width: 90%;
}

.oor-icon { font-size: 56px; margin-bottom: 16px; }
.oor-card h2 { color: var(--red); margin-bottom: 8px; }
.oor-card p { color: var(--gray); font-size: 14px; margin-bottom: 16px; }
.oor-distance { font-size: 18px; font-weight: 700; color: var(--navy); margin-bottom: 20px; }

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0;
  padding: 16px 0;
}

.test-meta-header h1 { font-size: 24px; }
.test-subject-badge {
  font-size: 11px;
  background: var(--cream-dark);
  color: var(--gray);
  padding: 2px 10px;
  border-radius: 20px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-top: 4px;
  display: inline-block;
}

.header-right { text-align: right; }

.timer {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--navy);
  transition: color 0.3s;
}

.timer.warning { color: var(--gold); }
.timer.danger { color: var(--red); animation: blink 1s infinite; }

@keyframes blink {
  50% { opacity: 0.5; }
}

.progress-info { font-size: 13px; color: var(--gray); }

.progress-bar-wrap {
  height: 4px;
  background: var(--gray-light);
  border-radius: 2px;
  margin-bottom: 12px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--navy), var(--gold));
  border-radius: 2px;
  transition: width 0.3s ease;
}

.location-bar {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  margin-bottom: 20px;
}

.loc-ok { background: #e6f4ea; color: #1e7e34; }
.loc-warn { background: #fff8e6; color: #7a4f00; }

.questions-wrap { display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px; }

.question-block { transition: border 0.2s; border: 1.5px solid transparent; }
.question-block.answered { border-color: #c8e6c9; }

.q-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.q-badge {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: var(--navy);
  background: var(--cream);
  padding: 2px 10px;
  border-radius: 20px;
}

.q-marks { margin-left: auto; font-size: 12px; color: var(--gray); }

.q-text { font-size: 16px; margin-bottom: 16px; line-height: 1.6; }

.mcq-opts { display: flex; flex-direction: column; gap: 10px; }

.mcq-opt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1.5px solid var(--gray-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  font-size: 15px;
}

.mcq-opt:hover { border-color: var(--navy); background: var(--cream); }
.mcq-opt.selected { border-color: var(--navy); background: #e8edf8; }

.opt-indicator {
  width: 28px; height: 28px;
  background: var(--navy);
  color: white;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.mcq-opt.selected .opt-indicator { background: var(--gold); color: var(--navy); }

.sr-only { position: absolute; opacity: 0; pointer-events: none; }

.submit-bar {
  position: sticky;
  bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--navy);
  color: white;
  margin-top: 8px;
}

.submit-info { font-size: 14px; }
.unanswered-warn { color: var(--gold); margin-left: 12px; }

.submit-btn { padding: 12px 28px; font-size: 15px; }

.mt16 { margin-top: 16px; }
</style>
