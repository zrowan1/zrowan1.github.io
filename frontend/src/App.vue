<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useUiStore } from './stores/ui';
import BottomNav from './components/BottomNav.vue';

const route = useRoute();
const auth = useAuthStore();
const ui = useUiStore();

// Hide the app chrome on the login screen.
const showChrome = computed(() => route.name !== 'login' && auth.isLoggedIn);
</script>

<template>
  <div class="app-shell">
    <header v-if="showChrome" class="app-header">
      <h1>Huishouden</h1>
      <div class="subtitle">Rowan &amp; Jamie-Lee</div>
    </header>

    <main :class="showChrome ? 'content' : ''">
      <router-view />
    </main>

    <BottomNav v-if="showChrome" />
    <div v-if="ui.toastMessage" class="toast">{{ ui.toastMessage }}</div>
  </div>
</template>
