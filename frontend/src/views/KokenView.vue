<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useDataStore } from '../stores/data';
import { useUiStore } from '../stores/ui';
import { WEEKDAYS, type CookingDay } from '../api';
import WeekSelect from '../components/WeekSelect.vue';

const data = useDataStore();
const ui = useUiStore();

const editing = ref(false);
const draft = ref<CookingDay[]>([]);

function buildDraft() {
  draft.value = WEEKDAYS.map((day) => {
    const existing = data.cookingDays.find((d) => d.weekday === day);
    return existing
      ? { ...existing }
      : { weekday: day, cook_user_id: null, is_samen: 0, meal: '' };
  });
}

onMounted(async () => {
  if (!data.weeks.length) await data.bootstrap();
  buildDraft();
});
watch(() => [data.currentWeekId, data.cookingDays], buildDraft, { deep: true });

/** The cook selector encodes user id, 'samen', or '' (nobody). */
function cookValue(d: CookingDay): string {
  if (d.is_samen) return 'samen';
  return d.cook_user_id ? String(d.cook_user_id) : '';
}
function setCook(d: CookingDay, value: string) {
  if (value === 'samen') {
    d.is_samen = 1;
    d.cook_user_id = null;
  } else if (value === '') {
    d.is_samen = 0;
    d.cook_user_id = null;
  } else {
    d.is_samen = 0;
    d.cook_user_id = Number(value);
  }
}

function label(d: CookingDay): string {
  if (d.is_samen) return 'Samen';
  return d.cook_user_id ? data.userById(d.cook_user_id)?.display_name || '' : '';
}

async function save() {
  try {
    await data.saveKoken(draft.value);
    editing.value = false;
    ui.toast('Kookplanning opgeslagen');
  } catch (e) {
    ui.toast((e as Error).message);
  }
}
</script>

<template>
  <div>
    <div class="row" style="justify-content: space-between; margin-bottom: 10px">
      <h2 style="margin: 0">Kookplanning</h2>
      <div class="row">
        <button v-if="!editing" class="btn btn-secondary" style="padding: 8px 12px" @click="editing = true">
          ✏️ Bewerken
        </button>
        <template v-else>
          <button class="btn btn-secondary" style="padding: 8px 12px" @click="editing = false; buildDraft()">
            Annuleer
          </button>
          <button class="btn" style="padding: 8px 12px" @click="save">Opslaan</button>
        </template>
      </div>
    </div>

    <WeekSelect />

    <div class="card" v-if="data.currentWeekId">
      <div v-for="d in draft" :key="d.weekday" class="day-block">
        <div class="day-name">{{ d.weekday }}</div>

        <template v-if="!editing">
          <div v-if="label(d) || d.meal">
            <strong :class="d.is_samen ? 'chip-samen' : ''" style="padding: 2px 6px; border-radius: 6px">
              {{ label(d) || '—' }}
            </strong>
            <span v-if="d.meal"> · {{ d.meal }}</span>
          </div>
          <div v-else class="muted">Niet ingepland</div>
        </template>

        <template v-else>
          <div class="row" style="gap: 8px">
            <select :value="cookValue(d)" @change="setCook(d, ($event.target as HTMLSelectElement).value)" style="max-width: 45%">
              <option value="">— Niemand —</option>
              <option v-for="u in data.users" :key="u.id" :value="String(u.id)">
                {{ u.display_name }}
              </option>
              <option value="samen">Samen</option>
            </select>
            <input v-model="d.meal" type="text" placeholder="Gerecht" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.day-block {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}
.day-block:first-child {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}
.day-name {
  font-weight: 700;
  font-size: 13px;
  color: var(--med-teal);
  margin-bottom: 6px;
}
</style>
