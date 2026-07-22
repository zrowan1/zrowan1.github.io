<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { useAuthStore } from '../stores/auth';
import { useUiStore } from '../stores/ui';
import { useDataStore } from '../stores/data';
import { subscribePush, unsubscribePush, isPushSubscribed, pushSupported } from '../push';

const auth = useAuthStore();
const ui = useUiStore();
const data = useDataStore();
const router = useRouter();

const subscribed = ref(false);
const pushBusy = ref(false);

onMounted(async () => {
  if (!data.weeks.length) await data.bootstrap().catch(() => {});
  subscribed.value = await isPushSubscribed();
});

async function togglePush() {
  pushBusy.value = true;
  try {
    if (subscribed.value) {
      await unsubscribePush();
      subscribed.value = false;
      ui.toast('Notificaties uitgezet');
    } else {
      await subscribePush();
      subscribed.value = true;
      ui.toast('Notificaties aangezet');
    }
  } catch (e) {
    ui.toast((e as Error).message);
  } finally {
    pushBusy.value = false;
  }
}

async function testPush() {
  try {
    await api.post('/api/push/test');
    ui.toast('Testmelding verstuurd');
  } catch (e) {
    ui.toast((e as Error).message);
  }
}

// Change password.
const pwCurrent = ref('');
const pwNext = ref('');
async function changePassword() {
  try {
    await api.post('/api/auth/password', { current: pwCurrent.value, next: pwNext.value });
    pwCurrent.value = '';
    pwNext.value = '';
    ui.toast('Wachtwoord gewijzigd');
  } catch (e) {
    ui.toast((e as Error).message);
  }
}

async function logout() {
  await auth.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <div>
    <h2 style="margin-bottom: 12px">Instellingen</h2>

    <div class="card">
      <div class="row" style="justify-content: space-between">
        <div>
          <strong>Ingelogd als</strong>
          <div class="muted">{{ auth.user?.display_name }}</div>
        </div>
        <button class="btn btn-secondary" style="padding: 8px 14px" @click="logout">Uitloggen</button>
      </div>
    </div>

    <div class="card">
      <div class="row" style="justify-content: space-between">
        <strong>🌙 Donkere modus</strong>
        <button class="btn btn-secondary" style="padding: 8px 14px" @click="ui.toggleDarkMode()">
          {{ ui.darkMode ? 'Aan' : 'Uit' }}
        </button>
      </div>
    </div>

    <div class="card">
      <strong>🔔 Notificaties</strong>
      <p class="muted" style="margin: 6px 0 10px">
        Ontvang 's ochtends een herinnering met je taken van vandaag.
      </p>
      <div v-if="!pushSupported()" class="muted">
        Niet ondersteund op dit apparaat/browser (op iPhone: voeg eerst toe aan beginscherm).
      </div>
      <div v-else class="row">
        <button class="btn" style="flex: 1" :disabled="pushBusy" @click="togglePush">
          {{ subscribed ? 'Uitzetten' : 'Aanzetten' }}
        </button>
        <button v-if="subscribed" class="btn btn-secondary" @click="testPush">Test</button>
      </div>
    </div>

    <div class="card">
      <strong>🔑 Wachtwoord wijzigen</strong>
      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px">
        <input v-model="pwCurrent" type="password" placeholder="Huidig wachtwoord" autocomplete="current-password" />
        <input v-model="pwNext" type="password" placeholder="Nieuw wachtwoord" autocomplete="new-password" />
        <button class="btn" @click="changePassword">Opslaan</button>
      </div>
    </div>

    <p class="muted" style="text-align: center; margin-top: 8px">
      Huishouden · self-hosted · geen Google meer 🎉
    </p>
  </div>
</template>
