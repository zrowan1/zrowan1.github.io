import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth, reqUser } from '../auth';

const ITEM_COLUMNS = `
  s.id, s.name, s.completed, s.created_at, s.completed_at,
  s.added_by, ab.display_name AS added_by_name,
  s.completed_by, cb.display_name AS completed_by_name
`;

function listItems() {
  return db
    .prepare(
      `SELECT ${ITEM_COLUMNS}
       FROM shopping_items s
       LEFT JOIN users ab ON ab.id = s.added_by
       LEFT JOIN users cb ON cb.id = s.completed_by
       ORDER BY s.completed, s.created_at DESC`,
    )
    .all();
}

/** Shared shopping list: full CRUD (replaces the Apps Script shopping handler). */
export default async function shoppingRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/api/shopping', async () => ({ items: listItems() }));

  app.post('/api/shopping', async (req, reply) => {
    const parsed = z.object({ name: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Ongeldige invoer' });
    const me = reqUser(req);
    db.prepare('INSERT INTO shopping_items (name, added_by) VALUES (?, ?)').run(
      parsed.data.name.trim(),
      me.id,
    );
    return { items: listItems() };
  });

  app.patch('/api/shopping/:id', async (req, reply) => {
    const id = Number((req.params as any).id);
    const parsed = z.object({ completed: z.boolean() }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Ongeldige invoer' });
    const me = reqUser(req);
    db.prepare(
      `UPDATE shopping_items
       SET completed = ?, completed_by = ?, completed_at = ?
       WHERE id = ?`,
    ).run(
      parsed.data.completed ? 1 : 0,
      parsed.data.completed ? me.id : null,
      parsed.data.completed ? new Date().toISOString() : null,
      id,
    );
    return { items: listItems() };
  });

  app.delete('/api/shopping/:id', async (req) => {
    db.prepare('DELETE FROM shopping_items WHERE id = ?').run(Number((req.params as any).id));
    return { items: listItems() };
  });

  app.post('/api/shopping/clear-completed', async () => {
    db.prepare('DELETE FROM shopping_items WHERE completed = 1').run();
    return { items: listItems() };
  });
}
