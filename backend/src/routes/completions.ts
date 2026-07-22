import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth, reqUser } from '../auth';
import { WEEKDAYS } from './verdeling';

/**
 * Completed-task state (replaces the "Status" sheet). Toggling is a real
 * request/response now — no more no-cors fire-and-forget — so the client gets
 * a confirmed result. The acting user comes from the session, not the payload.
 */
export default async function completionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/api/completions', async (req, reply) => {
    const weekId = Number((req.query as any).week);
    if (!weekId) return reply.code(400).send({ error: 'week ontbreekt' });
    const rows = db
      .prepare(
        `SELECT user_id, weekday, task_text, completed, completed_at
         FROM completions WHERE week_id = ? AND completed = 1`,
      )
      .all(weekId) as any[];
    return { week_id: weekId, completions: rows };
  });

  app.put('/api/completions/toggle', async (req, reply) => {
    const schema = z.object({
      week_id: z.number().int(),
      weekday: z.enum(WEEKDAYS as [string, ...string[]]),
      task_text: z.string().min(1),
      completed: z.boolean(),
      // Optional: toggle on behalf of a specific user (defaults to self).
      user_id: z.number().int().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Ongeldige invoer' });

    const me = reqUser(req);
    const { week_id, weekday, task_text, completed } = parsed.data;
    const userId = parsed.data.user_id ?? me.id;

    db.prepare(`
      INSERT INTO completions (week_id, user_id, weekday, task_text, completed, completed_at)
      VALUES (@week_id, @user_id, @weekday, @task_text, @completed, @completed_at)
      ON CONFLICT(week_id, user_id, weekday, task_text) DO UPDATE SET
        completed = excluded.completed,
        completed_at = excluded.completed_at
    `).run({
      week_id,
      user_id: userId,
      weekday,
      task_text: task_text.trim(),
      completed: completed ? 1 : 0,
      completed_at: completed ? new Date().toISOString() : null,
    });

    return { ok: true };
  });
}
