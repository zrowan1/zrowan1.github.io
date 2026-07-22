import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../auth';

/** Weeks: list and create the named week ranges the plans hang off of. */
export default async function weekRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/api/weeks', async () => {
    const weeks = db
      .prepare('SELECT * FROM weeks ORDER BY COALESCE(start_date, created_at) DESC')
      .all();
    return { weeks };
  });

  app.post('/api/weeks', async (req, reply) => {
    const schema = z.object({
      range_label: z.string().min(1),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Ongeldige invoer' });

    const { range_label, start_date, end_date } = parsed.data;
    try {
      const info = db
        .prepare('INSERT INTO weeks (range_label, start_date, end_date) VALUES (?, ?, ?)')
        .run(range_label.trim(), start_date || null, end_date || null);
      const week = db.prepare('SELECT * FROM weeks WHERE id = ?').get(info.lastInsertRowid);
      return { week };
    } catch {
      return reply.code(409).send({ error: 'Deze week bestaat al' });
    }
  });

  app.delete('/api/weeks/:id', async (req) => {
    const id = Number((req.params as any).id);
    db.prepare('DELETE FROM weeks WHERE id = ?').run(id);
    return { ok: true };
  });
}
