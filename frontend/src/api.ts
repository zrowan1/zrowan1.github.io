/**
 * Thin fetch wrapper for the JSON API. All requests include cookies so the
 * session travels with them. Non-2xx responses throw an Error with the
 * server-provided message.
 */
async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = `Fout ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore */
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
  del: <T>(url: string) => request<T>('DELETE', url),
};

// ---- Shared types ----
export interface User {
  id: number;
  username: string;
  display_name: string;
  color: string;
}
export interface Week {
  id: number;
  range_label: string;
  start_date: string | null;
  end_date: string | null;
}
export interface Assignment {
  id: number;
  user_id: number;
  weekday: string;
  task_text: string;
  position: number;
}
export interface CookingDay {
  weekday: string;
  cook_user_id: number | null;
  is_samen: number;
  meal: string;
}
export interface Completion {
  user_id: number;
  weekday: string;
  task_text: string;
  completed: number;
}
export interface ShoppingItem {
  id: number;
  name: string;
  completed: number;
  added_by: number | null;
  added_by_name: string | null;
  completed_by: number | null;
  completed_by_name: string | null;
  created_at: string;
}
export interface Stats {
  tasks: {
    thisWeek: Record<string, number>;
    last4Weeks: Record<string, number>;
    rowan_streak: number;
    jamie_streak: number;
  };
  cooking: { total: number; rowan: number; jamie: number; samen: number };
}

export const WEEKDAYS = [
  'Maandag',
  'Dinsdag',
  'Woensdag',
  'Donderdag',
  'Vrijdag',
  'Zaterdag',
  'Zondag',
];
