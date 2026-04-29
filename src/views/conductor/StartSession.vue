<template>
  <div class="start-session">
    <router-link to="/conductor" class="back-link">← Back to Dashboard</router-link>

    <div class="page-header">
      <h1>Start Session</h1>
      <p class="subtitle" v-if="test">{{ test.title }} — {{ test.subject }}</p>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div v-if="session" class="session-live card">
      <div class="session-live-header">
        <div class="pulse-dot"></div>
        <h2>Session is LIVE</h2>
      </div>
      <div class="session-code-display">
        <div class="label">Share this code with students:</div>
        <div class="code-box">{{ session.sessionCode }}</div>
      </div>
      <div class="session-details">
        <div class="detail-item">
          <span class="detail-icon">📍</span>
          <span>Centre: {{ session.location.latitude.toFixed(5) }}, {{ session.location.longitude.toFixed(5) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-icon">🔵</span>
          <span>Allowed radius: <strong>{{ session.radiusMeters }} metres</strong></span>
        </div>
        <div class="detail-item">
          <span class="detail-icon">⏰</span>
          <span>Started: {{ formatTime(session.startedAt) }}</span>
        </div>
      </div>
      <div class="session-actions">
        <router-link :to="`/conductor/sessions/${session._id}/results`" class="btn btn-primary">
          📊 View Submissions
        </router-link>
        <button class="btn btn-danger" @click="endSession">End Session</button>
      </div>
    </div>

    <div v-else class="setup-grid">
      <!-- Location panel -->
      <div class="card location-panel">
        <h2>📍 Set Your Location</h2>
        <p class="hint">Your location will be used as the centre point. Students must be within your set radius.</p>

        <div class="location-status" :class="locationStatus">
          <span class="loc-icon">{{ locationIcon }}</span>
          <span class="loc-text">{{ locationText }}</span>
        </div>

        <button class="btn btn-primary w-full" @click="getLocation" :disabled="gettingLocation">
          <span v-if="gettingLocation" class="spinner"></span>
          <span v-else>📡 Get My Current Location</span>
        </button>

        <div v-if="coords" class="coords-display">
          <div class="coord-row">
            <span>Latitude</span>
            <strong>{{ coords.latitude.toFixed(6) }}°</strong>
          </div>
          <div class="coord-row">
            <span>Longitude</span>
            <strong>{{ coords.longitude.toFixed(6) }}°</strong>
          </div>
          <div class="coord-row">
            <span>Accuracy</span>
            <strong>± {{ Math.round(coords.accuracy) }}m</strong>
          </div>
        </div>

        <div class="form-group" style="margin-top: 20px;">
          <label>Or enter location manually</label>
          <div class="coords-inputs">
            <input v-model.number="manualLat" type="number" class="form-control" placeholder="Latitude" step="any" />
            <input v-model.number="manualLon" type="number" class="form-control" placeholder="Longitude" step="any" />
          </div>
          <button class="btn btn-outline btn-sm" style="margin-top: 8px;" @click="useManual">Use Manual Coordinates</button>
        </div>
      </div>

      <!-- Range panel -->
      <div class="card range-panel">
        <h2>🔵 Set Allowed Radius</h2>
        <p class="hint">Students outside this radius from your location will be blocked from taking the test.</p>

        <div class="radius-display">{{ radiusMeters }}m</div>

        <input
          v-model.number="radiusMeters"
          type="range"
          min="10"
          max="5000"
          step="10"
          class="radius-slider"
        />

        <div class="radius-labels">
          <span>10m</span>
          <span>1km</span>
          <span>5km</span>
        </div>

        <div class="preset-radii">
          <button v-for="r in presets" :key="r" class="preset-btn" :class="{ active: radiusMeters === r }" @click="radiusMeters = r">
            {{ r >= 1000 ? (r / 1000) + 'km' : r + 'm' }}
          </button>
        </div>

        <div class="radius-context">
          <div class="context-item">
            <span>🏫</span> Classroom: 20–50m
          </div>
          <div class="context-item">
            <span>🏟️</span> Hall: 100–200m
          </div>
          <div class="context-item">
            <span>🏫</span> Campus: 500m–1km
          </div>
        </div>

        <button
          class="btn btn-gold w-full start-btn"
          :disabled="!finalCoords || launching"
          @click="startSession"
        >
          <span v-if="launching" class="spinner" style="border-color:rgba(0,0,0,0.2);border-top-color:#0f1e3d;"></span>
          <span v-else>🚀 Launch Session</span>
        </button>

        <p v-if="!finalCoords" class="no-loc-warning">⚠️ Please set your location first</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../api'

const route = useRoute()
const testId = route.params.id

const test = ref(null)
const session = ref(null)
const error = ref('')

const coords = ref(null)
const manualLat = ref('')
const manualLon = ref('')
const finalCoords = ref(null)
const gettingLocation = ref(false)

const radiusMeters = ref(100)
const launching = ref(false)

const presets = [20, 50, 100, 200, 500, 1000]

const locationStatus = computed(() => finalCoords.value ? 'success' : 'pending')
const locationIcon = computed(() => finalCoords.value ? '✅' : '⏳')
const locationText = computed(() => finalCoords.value
  ? `Location set: ${finalCoords.value.latitude.toFixed(4)}°, ${finalCoords.value.longitude.toFixed(4)}°`
  : 'Location not set yet')

onMounted(async () => {
  try {
    const { data } = await api.get(`/tests/${testId}`)
    test.value = data
  } catch {
    error.value = 'Failed to load test'
  }
})

function getLocation() {
  gettingLocation.value = true
  error.value = ''
  if (!navigator.geolocation) {
    error.value = 'Geolocation is not supported by your browser'
    gettingLocation.value = false
    return
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      coords.value = pos.coords
      finalCoords.value = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
      gettingLocation.value = false
    },
    err => {
      error.value = 'Could not get location: ' + err.message
      gettingLocation.value = false
    },
    { enableHighAccuracy: true, timeout: 15000 }
  )
}

function useManual() {
  if (!manualLat.value || !manualLon.value) {
    error.value = 'Please enter both latitude and longitude'
    return
  }
  finalCoords.value = { latitude: Number(manualLat.value), longitude: Number(manualLon.value) }
  error.value = ''
}

async function startSession() {
  if (!finalCoords.value) return
  error.value = ''
  launching.value = true
  try {
    const { data } = await api.post('/sessions/start', {
      testId,
      latitude: finalCoords.value.latitude,
      longitude: finalCoords.value.longitude,
      radiusMeters: radiusMeters.value
    })
    session.value = data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to start session'
  } finally {
    launching.value = false
  }
}

async function endSession() {
  if (!confirm('End this session? Students will no longer be able to submit.')) return
  try {
    await api.patch(`/sessions/${session.value._id}/end`)
    session.value = { ...session.value, isActive: false }
  } catch {
    error.value = 'Failed to end session'
  }
}

function formatTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.back-link { font-size: 14px; color: var(--gray); display: block; margin-bottom: 16px; }
.page-header { margin-bottom: 28px; }
h1 { font-size: 30px; }
.subtitle { color: var(--gray); }

.session-live {
  border: 2px solid #2e8b57;
  background: linear-gradient(135deg, #f0fbf4, white);
}

.session-live-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.pulse-dot {
  width: 14px;
  height: 14px;
  background: #2e8b57;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(46, 139, 87, 0.4); }
  70% { box-shadow: 0 0 0 12px rgba(46, 139, 87, 0); }
  100% { box-shadow: 0 0 0 0 rgba(46, 139, 87, 0); }
}

.session-code-display {
  text-align: center;
  margin-bottom: 28px;
}

.label { font-size: 13px; color: var(--gray); margin-bottom: 10px; }

.code-box {
  font-family: var(--font-display);
  font-size: 52px;
  font-weight: 700;
  color: var(--navy);
  letter-spacing: 0.12em;
  padding: 20px;
  background: var(--cream);
  border-radius: var(--radius);
  border: 2px dashed var(--navy-light);
}

.session-details { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
.detail-item { display: flex; align-items: center; gap: 10px; font-size: 14px; }
.detail-icon { font-size: 18px; }

.session-actions { display: flex; gap: 12px; }

.setup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

.location-panel, .range-panel { }

h2 { font-size: 20px; margin-bottom: 8px; }
.hint { font-size: 13px; color: var(--gray); margin-bottom: 20px; line-height: 1.5; }

.location-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
  font-size: 14px;
}

.location-status.pending { background: var(--cream-dark); color: var(--gray); }
.location-status.success { background: #e6f4ea; color: #1e7e34; }

.loc-icon { font-size: 20px; }

.w-full { width: 100%; justify-content: center; }

.coords-display {
  margin-top: 16px;
  background: var(--cream);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.coord-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 16px;
  font-size: 14px;
  border-bottom: 1px solid var(--cream-dark);
}
.coord-row:last-child { border-bottom: none; }
.coord-row span { color: var(--gray); }

.coords-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

.radius-display {
  font-family: var(--font-display);
  font-size: 56px;
  font-weight: 700;
  color: var(--navy);
  text-align: center;
  margin: 16px 0 12px;
}

.radius-slider {
  width: 100%;
  accent-color: var(--navy);
  height: 6px;
  margin-bottom: 8px;
}

.radius-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--gray);
  margin-bottom: 20px;
}

.preset-radii { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }

.preset-btn {
  padding: 6px 14px;
  border: 1.5px solid var(--gray-light);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
}

.preset-btn.active, .preset-btn:hover {
  background: var(--navy);
  color: white;
  border-color: var(--navy);
}

.radius-context {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--gray);
  margin-bottom: 24px;
  padding: 12px 16px;
  background: var(--cream);
  border-radius: var(--radius-sm);
}

.context-item { display: flex; gap: 8px; align-items: center; }

.start-btn { padding: 14px; font-size: 15px; }

.no-loc-warning { text-align: center; font-size: 12px; color: var(--red); margin-top: 8px; }

@media (max-width: 768px) {
  .setup-grid { grid-template-columns: 1fr; }
}
</style>
