import { defineStore } from 'pinia';
import { api, type User } from '../api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    ready: false, // becomes true once the initial /me check has resolved
  }),
  getters: {
    isLoggedIn: (s) => s.user !== null,
  },
  actions: {
    async fetchMe() {
      try {
        const { user } = await api.get<{ user: User }>('/api/auth/me');
        this.user = user;
      } catch {
        this.user = null;
      } finally {
        this.ready = true;
      }
    },
    async login(username: string, password: string) {
      const { user } = await api.post<{ user: User }>('/api/auth/login', { username, password });
      this.user = user;
    },
    async logout() {
      await api.post('/api/auth/logout');
      this.user = null;
    },
  },
});
