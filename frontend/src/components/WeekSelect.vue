<script setup lang="ts">
import { useDataStore } from '../stores/data';
const data = useDataStore();

function onChange(e: Event) {
  const id = Number((e.target as HTMLSelectElement).value);
  data.loadWeek(id);
}
</script>

<template>
  <div class="week-select" v-if="data.weeks.length">
    <select :value="data.currentWeekId" @change="onChange">
      <option v-for="w in data.weeks" :key="w.id" :value="w.id">{{ w.range_label }}</option>
    </select>
  </div>
  <p v-else class="muted">Nog geen weken. Maak er een aan bij Taken of Instellingen.</p>
</template>
