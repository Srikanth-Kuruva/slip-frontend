<template>
  <div class="create-test">
    <div class="page-header">
      <div>
        <router-link to="/conductor" class="back-link">← Back to Dashboard</router-link>
        <h1>Create Slip Test</h1>
      </div>
    </div>

    <div v-if="saved" class="alert alert-success">✅ Test saved successfully!</div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div class="layout">
      <!-- Test details -->
      <div class="card">
        <h2>Test Details</h2>
        <div class="form-group">
          <label>Test Title *</label>
          <input v-model="form.title" type="text" class="form-control" placeholder="e.g., Unit 3 Slip Test – Organic Chemistry" />
        </div>
        <div class="form-group">
          <label>Subject *</label>
          <input v-model="form.subject" type="text" class="form-control" placeholder="e.g., Chemistry" />
        </div>
        <div class="form-group">
          <label>Description / Instructions</label>
          <textarea v-model="form.description" class="form-control" rows="3" placeholder="Any instructions for students…" />
        </div>
        <div class="form-group">
          <label>Duration (minutes)</label>
          <input v-model.number="form.duration" type="number" class="form-control" min="5" max="180" />
        </div>
      </div>

      <!-- Questions -->
      <div class="questions-section">
        <div class="questions-header">
          <h2>Questions ({{ form.questions.length }})</h2>
          <div class="add-btns">
            <button class="btn btn-outline btn-sm" @click="addQuestion('short')">+ Short Answer</button>
            <button class="btn btn-outline btn-sm" @click="addQuestion('long')">+ Long Answer</button>
            <button class="btn btn-gold btn-sm" @click="addQuestion('mcq')">+ MCQ</button>
          </div>
        </div>

        <div v-if="form.questions.length === 0" class="empty-questions">
          <p>No questions added yet. Use the buttons above to add questions.</p>
        </div>

        <div v-for="(q, idx) in form.questions" :key="idx" class="question-card card">
          <div class="q-header">
            <span class="q-num">Q{{ idx + 1 }}</span>
            <span class="badge" :class="q.questionType === 'mcq' ? 'badge-gold' : 'badge-blue'">{{ q.questionType }}</span>
            <div class="q-marks">
              <label>Marks:</label>
              <input v-model.number="q.marks" type="number" min="1" class="marks-input" />
            </div>
            <button class="btn btn-danger btn-sm" @click="removeQuestion(idx)">✕</button>
          </div>

          <div class="form-group">
            <label>Question Text *</label>
            <textarea v-model="q.questionText" class="form-control" rows="2" :placeholder="`Enter question ${idx + 1}…`" />
          </div>

          <!-- MCQ options -->
          <div v-if="q.questionType === 'mcq'" class="mcq-options">
            <label>Options (select the correct one)</label>
            <div v-for="(opt, oi) in q.options" :key="oi" class="option-row">
              <input
                type="radio"
                :name="`correct-${idx}`"
                :value="opt"
                v-model="q.correctAnswer"
                class="radio"
              />
              <input v-model="q.options[oi]" type="text" class="form-control" :placeholder="`Option ${oi + 1}`" />
              <button v-if="q.options.length > 2" class="btn btn-sm" @click="q.options.splice(oi, 1)" style="color:var(--red);">✕</button>
            </div>
            <button class="btn btn-outline btn-sm" @click="q.options.push('')">+ Add Option</button>
          </div>
        </div>

        <!-- Summary bar -->
        <div v-if="form.questions.length > 0" class="summary-bar card">
          <span>{{ form.questions.length }} questions</span>
          <span>Total: {{ totalMarks }} marks</span>
          <span>Duration: {{ form.duration }} min</span>
          <button class="btn btn-gold" :disabled="saving" @click="saveTest">
            <span v-if="saving" class="spinner" style="border-color:rgba(0,0,0,0.2);border-top-color:#0f1e3d;"></span>
            <span v-else>💾 Save Test</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api'

const router = useRouter()

const form = ref({
  title: '',
  subject: '',
  description: '',
  duration: 30,
  questions: []
})

const saving = ref(false)
const saved = ref(false)
const error = ref('')

const totalMarks = computed(() => form.value.questions.reduce((s, q) => s + (q.marks || 1), 0))

function addQuestion(type) {
  const q = {
    questionText: '',
    questionType: type,
    marks: 1,
    options: type === 'mcq' ? ['', '', '', ''] : [],
    correctAnswer: ''
  }
  form.value.questions.push(q)
}

function removeQuestion(idx) {
  form.value.questions.splice(idx, 1)
}

async function saveTest() {
  error.value = ''
  if (!form.value.title || !form.value.subject) {
    error.value = 'Title and Subject are required'
    return
  }
  if (form.value.questions.length === 0) {
    error.value = 'Add at least one question'
    return
  }
  saving.value = true
  try {
    await api.post('/tests', form.value)
    saved.value = true
    setTimeout(() => router.push('/conductor'), 1500)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save test'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page-header { margin-bottom: 28px; }
.back-link { font-size: 14px; color: var(--gray); display: block; margin-bottom: 8px; }
h1 { font-size: 30px; }

.layout { display: flex; flex-direction: column; gap: 24px; }

.questions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-btns { display: flex; gap: 8px; flex-wrap: wrap; }

.empty-questions {
  text-align: center;
  padding: 40px;
  color: var(--gray);
  background: white;
  border-radius: var(--radius);
  border: 2px dashed var(--gray-light);
}

.question-card { margin-bottom: 16px; }

.q-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.q-num {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--navy);
  min-width: 32px;
}

.q-marks {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--gray);
}

.marks-input {
  width: 56px;
  padding: 4px 8px;
  border: 1.5px solid var(--gray-light);
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}

.mcq-options { margin-top: 8px; }
.mcq-options label { display: block; font-size: 13px; font-weight: 500; color: var(--gray); margin-bottom: 10px; }

.option-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.radio { width: 18px; height: 18px; accent-color: var(--navy); flex-shrink: 0; }

.summary-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
  background: var(--navy);
  color: white;
  margin-top: 8px;
}

.summary-bar span { font-size: 14px; }
.summary-bar .btn { margin-left: auto; }
</style>
