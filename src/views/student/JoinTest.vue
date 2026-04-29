<template>
  <div class="join-page">
    <div class="join-card card">
      <div class="join-logo">📝</div>
      <h1>Join Slip Test</h1>
      <p class="join-desc">Enter the session code given by your conductor and allow location access.</p>

      <div v-if="error" class="alert" :class="isOutOfRange ? 'alert-warning' : 'alert-error'">
        <span>{{ isOutOfRange ? '📍' : '❌' }}</span>
        {{ error }}
      </div>

      <div v-if="step === 'code'" class="step-code">
        <div class="form-group">
          <label>Session Code</label>
          <input
            v-model="sessionCode"
            type="text"
            class="form-control code-input"
            placeholder="e.g. AB3X9K"
            maxlength="6"
            @input="sessionCode = sessionCode.toUpperCase()"
            @keyup.enter="getLocation"
          />
        </div>

        <div class="location-info">
          <div class="info-icon">📡</div>
          <p>We need your location to verify you are within the conductor's allowed range. Please allow location access when prompted.</p>
        </div>

        <button class="btn btn-gold w-full" :disabled="!sessionCode || joining" @click="getLocation">
          <span v-if="joining" class="spinner" style="border-color:rgba(0,0,0,0.2);border-top-color:#0f1e3d;"></span>
          <span v-else>📍 Verify Location & Join</span>
        </button>

        <div v-if="locating" class="locating-status">
          <div class="spinner" style="border-color:var(--gray-light);border-top-color:var(--navy);"></div>
          Getting your location…
        </div>
      </div>

      <div v-if="isOutOfRange" class="out-of-range">
        <div class="range-visual">
          <div class="range-ring"></div>
          <div class="range-center">📍</div>
          <div class="range-student">🧑‍🎓</div>
        </div>
        <div class="distance-info">
          <div class="dist-val">{{ outOfRangeData.distance }}m</div>
          <div class="dist-label">You are from the conductor</div>
          <div class="dist-allowed">Allowed radius: {{ outOfRangeData.radiusMeters }}m</div>
        </div>
        <p class="move-hint">Please move closer to the exam venue and try again.</p>
        <button class="btn btn-primary" @click="retryJoin">↻ Retry</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api'

const router = useRouter()

const sessionCode = ref('')
const joining = ref(false)
const locating = ref(false)
const error = ref('')
const step = ref('code')
const isOutOfRange = ref(false)
const outOfRangeData = ref({})

function getLocation() {
  error.value = ''
  if (!sessionCode.value) return

  if (!navigator.geolocation) {
    error.value = 'Geolocation is not supported by your browser'
    return
  }

  locating.value = true
  navigator.geolocation.getCurrentPosition(
    pos => {
      locating.value = false
      joinSession(pos.coords.latitude, pos.coords.longitude)
    },
    err => {
      locating.value = false
      error.value = 'Could not get your location: ' + err.message + '. Please enable location access.'
    },
    { enableHighAccuracy: true, timeout: 15000 }
  )
}

async function joinSession(lat, lon) {
  joining.value = true
  try {
    const { data } = await api.post('/sessions/join', {
      sessionCode: sessionCode.value,
      latitude: lat,
      longitude: lon
    })

    // Store session + test info for the test-taking page
    sessionStorage.setItem('activeSession', JSON.stringify({
      session: data.session,
      test: data.test,
      studentLat: lat,
      studentLon: lon
    }))

    router.push('/student/test')
  } catch (err) {
    const d = err.response?.data
    if (err.response?.status === 403 && d?.distance) {
      isOutOfRange.value = true
      outOfRangeData.value = { distance: d.distance, radiusMeters: d.radiusMeters }
      error.value = d.message
    } else {
      error.value = d?.message || 'Failed to join session'
    }
  } finally {
    joining.value = false
  }
}

function retryJoin() {
  isOutOfRange.value = false
  error.value = ''
  getLocation()
}
</script>

<style scoped>
.join-page {
  min-height: calc(100vh - 94px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.join-card {
  width: 100%;
  max-width: 440px;
  text-align: center;
  padding: 40px;
}

.join-logo { font-size: 52px; margin-bottom: 16px; }
h1 { font-size: 28px; margin-bottom: 8px; }
.join-desc { color: var(--gray); font-size: 14px; margin-bottom: 28px; line-height: 1.6; }

.step-code { text-align: left; }

.code-input {
  font-size: 24px !important;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-align: center;
  font-weight: 700;
  font-family: var(--font-display) !important;
}

.location-info {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: var(--cream);
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  margin-bottom: 20px;
  text-align: left;
}

.info-icon { font-size: 22px; flex-shrink: 0; }
.location-info p { font-size: 13px; color: var(--gray); line-height: 1.5; }

.w-full { width: 100%; justify-content: center; }

.locating-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 16px;
  font-size: 14px;
  color: var(--gray);
}

/* Out of range visualization */
.out-of-range { text-align: center; }

.range-visual {
  position: relative;
  width: 160px;
  height: 160px;
  margin: 0 auto 24px;
}

.range-ring {
  position: absolute;
  inset: 0;
  border: 3px dashed var(--gold);
  border-radius: 50%;
  opacity: 0.5;
}

.range-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 28px;
}

.range-student {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 28px;
  filter: grayscale(1);
}

.distance-info { margin-bottom: 20px; }
.dist-val { font-size: 40px; font-family: var(--font-display); font-weight: 700; color: var(--red); }
.dist-label { font-size: 14px; color: var(--gray); }
.dist-allowed { font-size: 13px; color: var(--navy); font-weight: 500; margin-top: 4px; }

.move-hint { font-size: 14px; color: var(--gray); margin-bottom: 20px; }
</style>
