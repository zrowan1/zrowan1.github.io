<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useShoppingStore } from '../stores/shopping';
import { useUiStore } from '../stores/ui';
import type { ShoppingItem } from '../api';

const shopping = useShoppingStore();
const ui = useUiStore();
const newItem = ref('');

onMounted(() => shopping.load().catch((e) => ui.toast((e as Error).message)));

async function add() {
  const name = newItem.value.trim();
  if (!name) return;
  newItem.value = '';
  try {
    await shopping.add(name);
  } catch (e) {
    ui.toast((e as Error).message);
  }
}
async function toggle(item: ShoppingItem) {
  try {
    await shopping.toggle(item);
  } catch (e) {
    ui.toast((e as Error).message);
  }
}
</script>

<template>
  <div>
    <div class="card">
      <h2>🛒 Boodschappenlijst</h2>
      <div class="row">
        <input v-model="newItem" type="text" placeholder="Toevoegen…" @keyup.enter="add" />
        <button class="btn" @click="add">+</button>
      </div>
    </div>

    <div class="card">
      <div v-if="!shopping.open.length" class="muted">Lijst is leeg 🎉</div>
      <div
        v-for="item in shopping.open"
        :key="item.id"
        class="task"
        @click="toggle(item)"
      >
        <span class="check"></span>
        <span class="label" style="flex: 1">{{ item.name }}</span>
        <span class="muted" v-if="item.added_by_name">{{ item.added_by_name }}</span>
      </div>
    </div>

    <div class="card" v-if="shopping.done.length">
      <div class="row" style="justify-content: space-between; margin-bottom: 8px">
        <h2 style="margin: 0">Afgevinkt</h2>
        <button class="btn btn-secondary" style="padding: 6px 12px" @click="shopping.clearCompleted()">
          Wissen
        </button>
      </div>
      <div v-for="item in shopping.done" :key="item.id" class="task done" @click="toggle(item)">
        <span class="check">✓</span>
        <span class="label" style="flex: 1">{{ item.name }}</span>
        <span class="muted" v-if="item.completed_by_name">{{ item.completed_by_name }}</span>
      </div>
    </div>
  </div>
</template>
