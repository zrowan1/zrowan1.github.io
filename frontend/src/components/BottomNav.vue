<script setup lang="ts">
const tabs = [
  { to: '/', icon: '📅', label: 'Vandaag' },
  { to: '/verdeling', icon: '📋', label: 'Taken' },
  { to: '/koken', icon: '🍳', label: 'Koken' },
  { to: '/boodschappen', icon: '🛒', label: 'Lijst' },
  { to: '/stats', icon: '📊', label: 'Stats' },
  { to: '/instellingen', icon: '⚙️', label: 'Setup' },
];
</script>

<template>
  <nav class="bottom-nav">
    <router-link v-for="t in tabs" :key="t.to" :to="t.to">
      <span class="icon">{{ t.icon }}</span>
      {{ t.label }}
    </router-link>
  </nav>
</template>
