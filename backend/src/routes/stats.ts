import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { requireAuth } from '../auth';

/**
 * Statistics, computed server-side in SQL (the aggregation that used to live in
 * the Apps Script). Keyed by user color ('rowan' / 'jamie') to match the
 * original client shape.
 */
export default async function statsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/api/stats', async (req) => {
    const weekId = Number((req.query as any).week) || null;

    const users = db.prepare('SELECT id, color, display_name FROM users').all() as {
      id: number;
      color: string;
      display_name: string;
    }[];

    // Weeks newest-first, so we can slice "last 4" and walk streaks.
    const weeks = db
      .prepare('SELECT id FROM weeks ORDER BY COALESCE(start_date, created_at) DESC')
      .all() as { id: number }[];

    const completedInWeek = db.prepare(
      'SELECT COUNT(*) AS n FROM completions WHERE week_id = ? AND user_id = ? AND completed = 1',
    );

    const thisWeek: Record<string, number> = {};
    const last4Weeks: Record<string, number> = {};
    const streaks: Record<string, number> = {};

    const currentWeekId = weekId || weeks[0]?.id || null;
    const last4 = weeks.slice(0, 4).map((w) => w.id);

    for (const u of users) {
      thisWeek[u.color] = currentWeekId
        ? (completedInWeek.get(currentWeekId, u.id) as { n: number }).n
        : 0;

      last4Weeks[u.color] = last4.reduce(
        (sum, wId) => sum + (completedInWeek.get(wId, u.id) as { n: number }).n,
        0,
      );

      // Streak = consecutive most-recent weeks with >= 1 completion.
      let streak = 0;
      for (const w of weeks) {
        if ((completedInWeek.get(w.id, u.id) as { n: number }).n > 0) streak++;
        else break;
      }
      streaks[u.color] = streak;
    }

    // Cooking totals across all recorded history.
    const cookRows = db
      .prepare('SELECT cook, COUNT(*) AS n FROM cooking_history GROUP BY cook')
      .all() as { cook: string; n: number }[];

    const cooking = { total: 0, rowan: 0, jamie: 0, samen: 0 } as Record<string, number>;
    const nameToColor = new Map(users.map((u) => [u.display_name, u.color]));
    for (const row of cookRows) {
      cooking.total += row.n;
      if (row.cook === 'samen') cooking.samen += row.n;
      else {
        const color = nameToColor.get(row.cook);
        if (color) cooking[color] = (cooking[color] || 0) + row.n;
      }
    }

    return {
      tasks: {
        thisWeek,
        last4Weeks,
        rowan_streak: streaks['rowan'] || 0,
        jamie_streak: streaks['jamie'] || 0,
      },
      cooking,
    };
  });
}
