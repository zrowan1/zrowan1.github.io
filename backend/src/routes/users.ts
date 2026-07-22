import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { requireAuth } from '../auth';

/** The household members, for person pickers and plan editors. */
export default async function userRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.get('/api/users', async () => {
    const users = db
      .prepare('SELECT id, username, display_name, color FROM users ORDER BY id')
      .all();
    return { users };
  });
}
