<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useDataStore } from '../stores/data';
import { useAuthStore } from '../stores/auth';
import { useUiStore } from '../stores/ui';

const data = useDataStore();
const auth = useAuthStore();
const ui = useUiStore();

const WEEKDAYS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
const today = WEEKDAYS[new Date().getDay()];

// Which person's list is shown; defaults to the logged-in user.
const selectedUserId = ref<number>(0);

onMounted(async () => {
  if (!data.weeks.length) await data.bootstrap();
  selectedUserId.value = auth.user?.id || data.users[0]?.id || 0;
});

const todaysTasks = computed(() =>
  data.assignments.filter(
    (a) => a.user_id === selectedUserId.value && a.weekday === today,
  ),
);

const doneCount = computed(
  () => todaysTasks.value.filter((t) => data.isDone(t.user_id, t.weekday, t.task_text)).length,
);
const progress = computed(() =>
  todaysTasks.value.length ? Math.round((doneCount.value / todaysTasks.value.length) * 100) : 0,
);

const todaysCooking = computed(() => data.cookingDays.find((d) => d.weekday === today));
const cookName = computed(() => {
  const c = todaysCooking.value;
  if (!c) return '';
  if (c.is_samen) return 'Samen';
  return c.cook_user_id ? data.userById(c.cook_user_id)?.display_name || '' : '';
});

async function toggle(userId: number, weekday: string, task: string) {
  try {
    await data.toggleTask(userId, weekday, task);
  } catch (e) {
    ui.toast((e as Error).message);
  }
}
</script>

<template>
  <div>
    <div class="card">
      <div class="row" style="justify-content: space-between; margin-bottom: 10px">
        <h2 style="margin: 0">Vandaag · {{ today }}</h2>
      </div>

      <div class="person-toggle" v-if="data.users.length">
        <button
          v-for="u in data.users"
          :key="u.id"
          :class="['seg', { active: selectedUserId === u.id }, `chip-${u.color}`]"
          @click="selectedUserId = u.id"
        >
          {{ u.display_name }}
        </button>
      </div>

      <div style="margin: 14px 0 6px" class="row" v-if="todaysTasks.length">
        <div class="progress-track" style="flex: 1">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="muted">{{ doneCount }}/{{ todaysTasks.length }}</span>
      </div>

      <div v-if="!data.currentWeekId" class="muted">Selecteer of maak eerst een week aan.</div>
      <div v-else-if="!todaysTasks.length" class="muted">Geen taken voor vandaag 🎉</div>

      <div
        v-for="t in todaysTasks"
        :key="t.id"
        :class="['task', { done: data.isDone(t.user_id, t.weekday, t.task_text) }]"
        @click="toggle(t.user_id, t.weekday, t.task_text)"
      >
        <span class="check">{{ data.isDone(t.user_id, t.weekday, t.task_text) ? '✓' : '' }}</span>
        <span class="label">{{ t.task_text }}</span>
      </div>
    </div>

    <div class="card" v-if="todaysCooking">
      <h2>🍳 Koken vandaag</h2>
      <div v-if="cookName">
        <strong>{{ cookName }}</strong>
        <span v-if="todaysCooking.meal"> — {{ todaysCooking.meal }}</span>
      </div>
      <div v-else class="muted">Nog niemand ingepland.</div>
    </div>
  </div>
</template>

<style scoped>
.person-toggle {
  display: flex;
  gap: 8px;
}
.seg {
  flex: 1;
  padding: 9px;
  font-size: 14px;
  border-radius: 12px;
  opacity: 0.55;
}
.seg.active {
  opacity: 1;
}
</style>
