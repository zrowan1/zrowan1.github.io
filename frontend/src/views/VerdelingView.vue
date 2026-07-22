<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useDataStore } from '../stores/data';
import { useUiStore } from '../stores/ui';
import { WEEKDAYS } from '../api';
import WeekSelect from '../components/WeekSelect.vue';

const data = useDataStore();
const ui = useUiStore();

const editing = ref(false);
// Local editable model: { [userId]: { [weekday]: string[] } }
const draft = reactive<Record<number, Record<string, string[]>>>({});
const newTask = reactive<Record<string, string>>({});

function buildDraft() {
  for (const key of Object.keys(draft)) delete draft[Number(key)];
  for (const u of data.users) {
    draft[u.id] = {};
    for (const day of WEEKDAYS) {
      draft[u.id][day] = data.assignments
        .filter((a) => a.user_id === u.id && a.weekday === day)
        .map((a) => a.task_text);
    }
  }
}

onMounted(async () => {
  if (!data.weeks.length) await data.bootstrap();
  buildDraft();
});
watch(() => [data.currentWeekId, data.assignments], buildDraft, { deep: true });

function addTask(userId: number, day: string) {
  const field = `${userId}-${day}`;
  const val = (newTask[field] || '').trim();
  if (!val) return;
  draft[userId][day].push(val);
  newTask[field] = '';
}
function removeTask(userId: number, day: string, idx: number) {
  draft[userId][day].splice(idx, 1);
}

async function save() {
  const items: { user_id: number; weekday: string; task_text: string }[] = [];
  for (const u of data.users) {
    for (const day of WEEKDAYS) {
      for (const task of draft[u.id]?.[day] || []) {
        items.push({ user_id: u.id, weekday: day, task_text: task });
      }
    }
  }
  try {
    await data.saveVerdeling(items);
    editing.value = false;
    ui.toast('Taakverdeling opgeslagen');
  } catch (e) {
    ui.toast((e as Error).message);
  }
}

// --- Create week inline ---
const showNewWeek = ref(false);
const rangeLabel = ref('');
async function createWeek() {
  if (!rangeLabel.value.trim()) return;
  try {
    await data.createWeek(rangeLabel.value.trim());
    rangeLabel.value = '';
    showNewWeek.value = false;
    buildDraft();
    ui.toast('Week aangemaakt');
  } catch (e) {
    ui.toast((e as Error).message);
  }
}

const tasksFor = (userId: number, day: string) =>
  data.assignments.filter((a) => a.user_id === userId && a.weekday === day);

const hasWeek = computed(() => !!data.currentWeekId);
</script>

<template>
  <div>
    <div class="row" style="justify-content: space-between; margin-bottom: 10px">
      <h2 style="margin: 0">Taakverdeling</h2>
      <button class="btn btn-secondary" style="padding: 8px 12px" @click="showNewWeek = !showNewWeek">
        + Week
      </button>
    </div>

    <div class="card" v-if="showNewWeek">
      <label class="muted">Weeklabel (bv. "02-02 t/m 08-02")</label>
      <div class="row" style="margin-top: 8px">
        <input v-model="rangeLabel" type="text" placeholder="02-02 t/m 08-02" />
        <button class="btn" @click="createWeek">Maak</button>
      </div>
    </div>

    <WeekSelect />

    <template v-if="hasWeek">
      <div class="row" style="justify-content: flex-end; margin-bottom: 10px">
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

      <div class="card" v-for="u in data.users" :key="u.id">
        <h2 :class="`chip-${u.color}`" style="display: inline-block; padding: 4px 10px; border-radius: 8px">
          {{ u.display_name }}
        </h2>
        <div v-for="day in WEEKDAYS" :key="day" class="day-block">
          <div class="day-name">{{ day }}</div>

          <!-- Read-only -->
          <template v-if="!editing">
            <div v-if="!tasksFor(u.id, day).length" class="muted">—</div>
            <div v-for="a in tasksFor(u.id, day)" :key="a.id" class="task-line">{{ a.task_text }}</div>
          </template>

          <!-- Edit -->
          <template v-else>
            <div v-for="(t, idx) in draft[u.id][day]" :key="idx" class="task-line editable">
              <span>{{ t }}</span>
              <button class="del" @click="removeTask(u.id, day, idx)">✕</button>
            </div>
            <div class="row" style="margin-top: 6px">
              <input
                v-model="newTask[`${u.id}-${day}`]"
                type="text"
                placeholder="Taak toevoegen…"
                @keyup.enter="addTask(u.id, day)"
              />
              <button class="btn btn-secondary" style="padding: 8px 12px" @click="addTask(u.id, day)">+</button>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.day-block {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}
.day-name {
  font-weight: 700;
  font-size: 13px;
  color: var(--med-teal);
  margin-bottom: 4px;
}
.task-line {
  padding: 4px 0;
  font-size: 14px;
}
.task-line.editable {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.del {
  background: transparent;
  color: var(--light-text);
  font-size: 14px;
}
</style>
