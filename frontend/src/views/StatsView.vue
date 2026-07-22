<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { api, type Stats } from '../api';
import { useDataStore } from '../stores/data';
import { useUiStore } from '../stores/ui';
import WeekSelect from '../components/WeekSelect.vue';

const data = useDataStore();
const ui = useUiStore();
const stats = ref<Stats | null>(null);

async function load() {
  try {
    stats.value = await api.get<Stats>(
      `/api/stats?week=${data.currentWeekId || ''}`,
    );
  } catch (e) {
    ui.toast((e as Error).message);
  }
}

onMounted(async () => {
  if (!data.weeks.length) await data.bootstrap();
  await load();
});
watch(() => data.currentWeekId, load);
</script>

<template>
  <div>
    <h2 style="margin-bottom: 10px">Statistieken</h2>
    <WeekSelect />

    <div class="card" v-if="stats">
      <h2>✅ Taken deze week</h2>
      <div class="stat-grid">
        <div class="stat chip-rowan">
          <div class="num">{{ stats.tasks.thisWeek.rowan || 0 }}</div>
          <div class="lbl">Rowan</div>
        </div>
        <div class="stat chip-jamie">
          <div class="num">{{ stats.tasks.thisWeek.jamie || 0 }}</div>
          <div class="lbl">Jamie-Lee</div>
        </div>
      </div>
      <div class="muted" style="margin-top: 10px">
        Laatste 4 weken: Rowan {{ stats.tasks.last4Weeks.rowan || 0 }} ·
        Jamie {{ stats.tasks.last4Weeks.jamie || 0 }}
      </div>
      <div class="muted">
        🔥 Streak: Rowan {{ stats.tasks.rowan_streak }} · Jamie {{ stats.tasks.jamie_streak }}
      </div>
    </div>

    <div class="card" v-if="stats">
      <h2>🍳 Koken (totaal)</h2>
      <div class="stat-grid three">
        <div class="stat chip-rowan">
          <div class="num">{{ stats.cooking.rowan }}</div>
          <div class="lbl">Rowan</div>
        </div>
        <div class="stat chip-jamie">
          <div class="num">{{ stats.cooking.jamie }}</div>
          <div class="lbl">Jamie</div>
        </div>
        <div class="stat chip-samen">
          <div class="num">{{ stats.cooking.samen }}</div>
          <div class="lbl">Samen</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.stat-grid.three {
  grid-template-columns: 1fr 1fr 1fr;
}
.stat {
  border-radius: 14px;
  padding: 16px 8px;
  text-align: center;
}
.stat .num {
  font-size: 28px;
  font-weight: 800;
  font-family: 'Quicksand', sans-serif;
}
.stat .lbl {
  font-size: 12px;
  margin-top: 2px;
}
</style>
