import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../auth';
import { WEEKDAYS } from './verdeling';

/** Weekly cooking plan ("Kookplanning"), editable in-app. */
export default async function kokenRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/api/koken', async (req, reply) => {
    const weekId = Number((req.query as any).week);
    if (!weekId) return reply.code(400).send({ error: 'week ontbreekt' });
    const rows = db
      .prepare(
        'SELECT id, weekday, cook_user_id, is_samen, meal FROM cooking_plan WHERE week_id = ?',
      )
      .all(weekId) as any[];
    // Return in weekday order, filling gaps so the UI always has 7 rows.
    const byDay = new Map(rows.map((r) => [r.weekday, r]));
    const days = WEEKDAYS.map(
      (d) =>
        byDay.get(d) || { weekday: d, cook_user_id: null, is_samen: 0, meal: '' },
    );
    return { week_id: weekId, days };
  });

  /** Upsert the plan for a whole week. */
  app.put('/api/koken', async (req, reply) => {
    const schema = z.object({
      week_id: z.number().int(),
      days: z.array(
        z.object({
          weekday: z.enum(WEEKDAYS as [string, ...string[]]),
          cook_user_id: z.number().int().nullable(),
          is_samen: z.boolean(),
          meal: z.string(),
        }),
      ),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Ongeldige invoer' });

    const { week_id, days } = parsed.data;
    const tx = db.transaction(() => {
      const upsert = db.prepare(`
        INSERT INTO cooking_plan (week_id, weekday, cook_user_id, is_samen, meal)
        VALUES (@week_id, @weekday, @cook_user_id, @is_samen, @meal)
        ON CONFLICT(week_id, weekday) DO UPDATE SET
          cook_user_id = excluded.cook_user_id,
          is_samen = excluded.is_samen,
          meal = excluded.meal
      `);
      for (const d of days) {
        upsert.run({
          week_id,
          weekday: d.weekday,
          cook_user_id: d.is_samen ? null : d.cook_user_id,
          is_samen: d.is_samen ? 1 : 0,
          meal: d.meal.trim(),
        });
        // Mirror into cooking_history so stats reflect the plan.
        const cook = d.is_samen
          ? 'samen'
          : d.cook_user_id
            ? (db.prepare('SELECT display_name FROM users WHERE id = ?').get(d.cook_user_id) as any)
                ?.display_name || ''
            : '';
        if (cook) {
          db.prepare(`
            INSERT INTO cooking_history (week_id, weekday, cook, meal)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(week_id, weekday) DO UPDATE SET cook = excluded.cook, meal = excluded.meal
          `).run(week_id, d.weekday, cook, d.meal.trim());
        }
      }
    });
    tx();
    return { ok: true };
  });
}
