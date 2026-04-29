<template>
  <div id="root">
    <NavBar v-if="auth.isAuthenticated" />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from './store/auth'
import NavBar from './components/NavBar.vue'

const auth = useAuthStore()
</script>

<style>
#root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 32px 24px;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}
</style>
