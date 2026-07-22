import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth, reqUser } from '../auth';
import { VAPID_PUBLIC_KEY, sendToUser } from '../push';

/** Web Push subscription management + a manual test trigger. */
export default async function pushRoutes(app: FastifyInstance): Promise<void> {
  // Public: the frontend needs the VAPID key before it can subscribe.
  app.get('/api/push/vapid-key', async () => ({ publicKey: VAPID_PUBLIC_KEY }));

  app.register(async (secured) => {
    secured.addHook('preHandler', requireAuth);

    secured.post('/api/push/subscribe', async (req, reply) => {
      const schema = z.object({
        endpoint: z.string().url(),
        keys: z.object({ p256dh: z.string(), auth: z.string() }),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'Ongeldige subscription' });
      const me = reqUser(req);
      const { endpoint, keys } = parsed.data;
      db.prepare(`
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id,
          p256dh = excluded.p256dh, auth = excluded.auth
      `).run(me.id, endpoint, keys.p256dh, keys.auth);
      return { ok: true };
    });

    secured.post('/api/push/unsubscribe', async (req, reply) => {
      const parsed = z.object({ endpoint: z.string() }).safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'Ongeldige invoer' });
      db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(parsed.data.endpoint);
      return { ok: true };
    });

    // Send a test notification to the current user's devices.
    secured.post('/api/push/test', async (req) => {
      const me = reqUser(req);
      await sendToUser(me.id, {
        title: 'Testmelding ✅',
        body: 'Push-notificaties werken!',
        url: '/',
      });
      return { ok: true };
    });
  });
}
