import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../auth';

export const WEEKDAYS = [
  'Maandag',
  'Dinsdag',
  'Woensdag',
  'Donderdag',
  'Vrijdag',
  'Zaterdag',
  'Zondag',
];

/** Weekly chore distribution ("Taakverdeling"), now editable in-app. */
export default async function verdelingRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/api/verdeling', async (req, reply) => {
    const weekId = Number((req.query as any).week);
    if (!weekId) return reply.code(400).send({ error: 'week ontbreekt' });

    const rows = db
      .prepare(
        'SELECT id, user_id, weekday, task_text, position FROM assignments WHERE week_id = ? ORDER BY position, id',
      )
      .all(weekId) as any[];

    return { week_id: weekId, assignments: rows };
  });

  /** Replace the entire assignment set for a week (simplest, avoids diffing). */
  app.put('/api/verdeling', async (req, reply) => {
    const schema = z.object({
      week_id: z.number().int(),
      items: z.array(
        z.object({
          user_id: z.number().int(),
          weekday: z.enum(WEEKDAYS as [string, ...string[]]),
          task_text: z.string().min(1),
        }),
      ),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Ongeldige invoer' });

    const { week_id, items } = parsed.data;
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM assignments WHERE week_id = ?').run(week_id);
      const insert = db.prepare(
        'INSERT INTO assignments (week_id, user_id, weekday, task_text, position) VALUES (?, ?, ?, ?, ?)',
      );
      items.forEach((it, i) =>
        insert.run(week_id, it.user_id, it.weekday, it.task_text.trim(), i),
      );
    });
    tx();
    return { ok: true, count: items.length };
  });
}
