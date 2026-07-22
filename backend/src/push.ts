import webpush from 'web-push';
import cron from 'node-cron';
import { db } from './db';
import { getVapidKeys, REMINDER_CRON, TZ } from './config';

const vapid = getVapidKeys();
webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

export const VAPID_PUBLIC_KEY = vapid.publicKey;

interface SubRow {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Send a notification to every subscription of a user. Prunes dead subs. */
export async function sendToUser(
  userId: number,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  const subs = db
    .prepare('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?')
    .all(userId) as SubRow[];
  const del = db.prepare('DELETE FROM push_subscriptions WHERE id = ?');

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        );
      } catch (err: any) {
        // 404/410 => subscription expired; remove it.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          del.run(s.id);
        } else {
          console.error('[push] send failed', err?.statusCode || err?.message);
        }
      }
    }),
  );
}

/** Dutch weekday name for a Date, matching the labels used across the app. */
const WEEKDAYS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

function todayWeekday(): string {
  return WEEKDAYS[new Date().getDay()];
}

/**
 * Morning reminder: for each user, count today's still-open tasks in the
 * current week and push a friendly summary. "Current week" = the most recent
 * week row (weeks are created in order).
 */
export async function sendDailyReminders(): Promise<void> {
  const weekday = todayWeekday();
  const week = db
    .prepare('SELECT id FROM weeks ORDER BY COALESCE(start_date, created_at) DESC LIMIT 1')
    .get() as { id: number } | undefined;
  if (!week) return;

  const users = db.prepare('SELECT id, display_name FROM users').all() as {
    id: number;
    display_name: string;
  }[];

  for (const u of users) {
    const total = (
      db
        .prepare(
          'SELECT COUNT(*) AS n FROM assignments WHERE week_id = ? AND user_id = ? AND weekday = ?',
        )
        .get(week.id, u.id, weekday) as { n: number }
    ).n;
    if (total === 0) continue;

    const done = (
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM completions
           WHERE week_id = ? AND user_id = ? AND weekday = ? AND completed = 1`,
        )
        .get(week.id, u.id, weekday) as { n: number }
    ).n;

    const open = total - done;
    if (open <= 0) continue;

    await sendToUser(u.id, {
      title: 'Goeiemorgen! ☀️',
      body:
        open === 1
          ? 'Je hebt vandaag nog 1 taak te doen.'
          : `Je hebt vandaag nog ${open} taken te doen.`,
      url: '/',
    });
  }
}

/** Register the daily reminder cron job. */
export function scheduleReminders(): void {
  if (!cron.validate(REMINDER_CRON)) {
    console.warn('[push] invalid REMINDER_CRON, reminders disabled:', REMINDER_CRON);
    return;
  }
  cron.schedule(REMINDER_CRON, () => {
    sendDailyReminders().catch((e) => console.error('[push] reminder run failed', e));
  }, { timezone: TZ });
  console.log(`[push] daily reminders scheduled at "${REMINDER_CRON}" (${TZ})`);
}
