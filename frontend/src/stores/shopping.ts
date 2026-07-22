import { defineStore } from 'pinia';
import { api, type ShoppingItem } from '../api';

export const useShoppingStore = defineStore('shopping', {
  state: () => ({
    items: [] as ShoppingItem[],
  }),
  getters: {
    open: (s) => s.items.filter((i) => !i.completed),
    done: (s) => s.items.filter((i) => i.completed),
  },
  actions: {
    async load() {
      const { items } = await api.get<{ items: ShoppingItem[] }>('/api/shopping');
      this.items = items;
    },
    async add(name: string) {
      const { items } = await api.post<{ items: ShoppingItem[] }>('/api/shopping', { name });
      this.items = items;
    },
    async toggle(item: ShoppingItem) {
      const { items } = await api.patch<{ items: ShoppingItem[] }>(`/api/shopping/${item.id}`, {
        completed: !item.completed,
      });
      this.items = items;
    },
    async remove(item: ShoppingItem) {
      const { items } = await api.del<{ items: ShoppingItem[] }>(`/api/shopping/${item.id}`);
      this.items = items;
    },
    async clearCompleted() {
      const { items } = await api.post<{ items: ShoppingItem[] }>('/api/shopping/clear-completed');
      this.items = items;
    },
  },
});
