<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);

async function submit() {
  error.value = '';
  busy.value = true;
  try {
    await auth.login(username.value.trim(), password.value);
    router.push({ name: 'vandaag' });
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-emoji">🏡</div>
      <h1>Huishouden</h1>
      <p class="muted">Log in om verder te gaan</p>
      <form @submit.prevent="submit">
        <input
          v-model="username"
          type="text"
          placeholder="Gebruikersnaam"
          autocomplete="username"
          autocapitalize="none"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Wachtwoord"
          autocomplete="current-password"
        />
        <p v-if="error" class="error">{{ error }}</p>
        <button class="btn btn-block" type="submit" :disabled="busy">
          {{ busy ? 'Bezig…' : 'Inloggen' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-wrap {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.login-card {
  background: var(--card-bg);
  border-radius: 20px;
  padding: 32px 24px;
  width: 100%;
  max-width: 360px;
  text-align: center;
  box-shadow: 0 8px 30px rgba(93, 78, 60, 0.12);
}
.login-emoji {
  font-size: 48px;
  margin-bottom: 8px;
}
.login-card h1 {
  color: var(--dark-text);
  margin-bottom: 4px;
}
.login-card form {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.error {
  color: #b5564a;
  font-size: 13px;
}
</style>
