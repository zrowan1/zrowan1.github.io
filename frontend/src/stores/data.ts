import { defineStore } from 'pinia';
import {
  api,
  type Week,
  type User,
  type Assignment,
  type CookingDay,
  type Completion,
} from '../api';

/** Composite key for a completed task, mirroring the original app's scheme. */
export function completionKey(
  weekId: number,
  userId: number,
  weekday: string,
  task: string,
): string {
  return `${weekId}|${userId}|${weekday}|${task}`;
}

/** Read cached JSON from localStorage for offline-first rendering. */
function cached<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function cache(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const useDataStore = defineStore('data', {
  state: () => ({
    users: cached<User[]>('users', []),
    weeks: cached<Week[]>('weeks', []),
    currentWeekId: Number(localStorage.getItem('currentWeekId')) || 0,
    assignments: [] as Assignment[],
    cookingDays: [] as CookingDay[],
    completed: new Set<string>(),
    loading: false,
  }),
  getters: {
    currentWeek(state): Week | undefined {
      return state.weeks.find((w) => w.id === state.currentWeekId);
    },
    userById: (state) => (id: number) => state.users.find((u) => u.id === id),
  },
  actions: {
    /** Load the invariant data (users + weeks) and pick a current week. */
    async bootstrap() {
      const [{ users }, { weeks }] = await Promise.all([
        api.get<{ users: User[] }>('/api/users'),
        api.get<{ weeks: Week[] }>('/api/weeks'),
      ]);
      this.users = users;
      this.weeks = weeks;
      cache('users', users);
      cache('weeks', weeks);
      if (!this.currentWeekId || !weeks.some((w) => w.id === this.currentWeekId)) {
        this.currentWeekId = weeks[0]?.id || 0;
      }
      if (this.currentWeekId) await this.loadWeek(this.currentWeekId);
    },

    async loadWeek(weekId: number) {
      this.currentWeekId = weekId;
      localStorage.setItem('currentWeekId', String(weekId));
      if (!weekId) return;
      this.loading = true;
      try {
        const [verd, kok, comp] = await Promise.all([
          api.get<{ assignments: Assignment[] }>(`/api/verdeling?week=${weekId}`),
          api.get<{ days: CookingDay[] }>(`/api/koken?week=${weekId}`),
          api.get<{ completions: Completion[] }>(`/api/completions?week=${weekId}`),
        ]);
        this.assignments = verd.assignments;
        this.cookingDays = kok.days;
        this.completed = new Set(
          comp.completions.map((c) =>
            completionKey(weekId, c.user_id, c.weekday, c.task_text),
          ),
        );
        cache(`week_${weekId}`, {
          assignments: verd.assignments,
          cookingDays: kok.days,
          completed: [...this.completed],
        });
      } catch {
        // Offline: fall back to cached week data if present.
        const c = cached<any>(`week_${weekId}`, null);
        if (c) {
          this.assignments = c.assignments;
          this.cookingDays = c.cookingDays;
          this.completed = new Set(c.completed);
        }
      } finally {
        this.loading = false;
      }
    },

    isDone(userId: number, weekday: string, task: string): boolean {
      return this.completed.has(completionKey(this.currentWeekId, userId, weekday, task));
    },

    async toggleTask(userId: number, weekday: string, task: string) {
      const key = completionKey(this.currentWeekId, userId, weekday, task);
      const next = !this.completed.has(key);
      // Optimistic update.
      if (next) this.completed.add(key);
      else this.completed.delete(key);
      try {
        await api.put('/api/completions/toggle', {
          week_id: this.currentWeekId,
          weekday,
          task_text: task,
          completed: next,
          user_id: userId,
        });
      } catch (e) {
        // Roll back on failure.
        if (next) this.completed.delete(key);
        else this.completed.add(key);
        throw e;
      }
    },

    async createWeek(range_label: string, start_date?: string, end_date?: string) {
      const { week } = await api.post<{ week: Week }>('/api/weeks', {
        range_label,
        start_date,
        end_date,
      });
      this.weeks.unshift(week);
      cache('weeks', this.weeks);
      await this.loadWeek(week.id);
      return week;
    },

    async saveVerdeling(items: { user_id: number; weekday: string; task_text: string }[]) {
      await api.put('/api/verdeling', { week_id: this.currentWeekId, items });
      await this.loadWeek(this.currentWeekId);
    },

    async saveKoken(days: CookingDay[]) {
      await api.put('/api/koken', {
        week_id: this.currentWeekId,
        days: days.map((d) => ({
          weekday: d.weekday,
          cook_user_id: d.cook_user_id,
          is_samen: !!d.is_samen,
          meal: d.meal,
        })),
      });
      await this.loadWeek(this.currentWeekId);
    },
  },
});
