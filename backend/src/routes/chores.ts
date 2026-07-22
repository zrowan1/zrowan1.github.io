import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth } from '../auth';

/** Reference chore matrix ("Alle taken"): rooms with their chores. */
export default async function choreRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/api/rooms', async () => {
    const rooms = db.prepare('SELECT * FROM rooms ORDER BY position, id').all() as any[];
    const chores = db.prepare('SELECT * FROM chores ORDER BY position, id').all() as any[];
    return {
      rooms: rooms.map((r) => ({
        ...r,
        chores: chores.filter((c) => c.room_id === r.id),
      })),
    };
  });

  app.post('/api/rooms', async (req, reply) => {
    const parsed = z.object({ name: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Ongeldige invoer' });
    const pos = (db.prepare('SELECT COUNT(*) AS n FROM rooms').get() as { n: number }).n;
    const info = db
      .prepare('INSERT INTO rooms (name, position) VALUES (?, ?)')
      .run(parsed.data.name.trim(), pos);
    return { room: db.prepare('SELECT * FROM rooms WHERE id = ?').get(info.lastInsertRowid) };
  });

  app.delete('/api/rooms/:id', async (req) => {
    db.prepare('DELETE FROM rooms WHERE id = ?').run(Number((req.params as any).id));
    return { ok: true };
  });

  app.post('/api/chores', async (req, reply) => {
    const parsed = z
      .object({ room_id: z.number().int(), name: z.string().min(1) })
      .safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Ongeldige invoer' });
    const pos = (
      db.prepare('SELECT COUNT(*) AS n FROM chores WHERE room_id = ?').get(parsed.data.room_id) as {
        n: number;
      }
    ).n;
    const info = db
      .prepare('INSERT INTO chores (room_id, name, position) VALUES (?, ?, ?)')
      .run(parsed.data.room_id, parsed.data.name.trim(), pos);
    return { chore: db.prepare('SELECT * FROM chores WHERE id = ?').get(info.lastInsertRowid) };
  });

  app.delete('/api/chores/:id', async (req) => {
    db.prepare('DELETE FROM chores WHERE id = ?').run(Number((req.params as any).id));
    return { ok: true };
  });
}
