import path from 'node:path';
import fs from 'node:fs';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import secureSession from '@fastify/secure-session';
import fastifyStatic from '@fastify/static';

import { PORT, HOST, STATIC_DIR, COOKIE_SECURE, getSessionKey } from './config';
import { db, migrate } from './db';
import { seedIfEmpty } from './seed';
import { scheduleReminders } from './push';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import weekRoutes from './routes/weeks';
import choreRoutes from './routes/chores';
import verdelingRoutes from './routes/verdeling';
import kokenRoutes from './routes/koken';
import completionRoutes from './routes/completions';
import shoppingRoutes from './routes/shopping';
import statsRoutes from './routes/stats';
import pushRoutes from './routes/push';

async function main(): Promise<void> {
  // DB first so every route can rely on the schema + seed users existing.
  migrate();
  seedIfEmpty();

  const app = Fastify({ logger: { level: process.env.LOG_LEVEL || 'info' } });

  await app.register(cookie);
  await app.register(secureSession, {
    key: getSessionKey(),
    cookieName: 'huishouden_session',
    cookie: {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: COOKIE_SECURE,
      maxAge: 60 * 60 * 24 * 90, // 90 days
    },
  });

  // API routes.
  await app.register(authRoutes);
  await app.register(userRoutes);
  await app.register(weekRoutes);
  await app.register(choreRoutes);
  await app.register(verdelingRoutes);
  await app.register(kokenRoutes);
  await app.register(completionRoutes);
  await app.register(shoppingRoutes);
  await app.register(statsRoutes);
  await app.register(pushRoutes);

  // Serve the built frontend (if present) and fall back to index.html for the SPA.
  const hasStatic = fs.existsSync(path.join(STATIC_DIR, 'index.html'));
  if (hasStatic) {
    await app.register(fastifyStatic, { root: STATIC_DIR, index: false, wildcard: false });
    app.setNotFoundHandler((req, reply) => {
      // Never SPA-fallback API calls — return a real 404.
      if (req.raw.url && req.raw.url.startsWith('/api/')) {
        return reply.code(404).send({ error: 'Niet gevonden' });
      }
      return reply.type('text/html').send(fs.readFileSync(path.join(STATIC_DIR, 'index.html')));
    });
  } else {
    app.log.warn(`No built frontend at ${STATIC_DIR}; serving API only.`);
  }

  scheduleReminders();

  // Graceful shutdown: close the HTTP server and checkpoint/close SQLite so
  // the container stops promptly on SIGTERM instead of being SIGKILLed.
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.on(signal, async () => {
      app.log.info(`${signal} ontvangen, afsluiten…`);
      try {
        await app.close();
        db.close();
      } finally {
        process.exit(0);
      }
    });
  }

  await app.listen({ port: PORT, host: HOST });
  app.log.info(`Huishouden server luistert op http://${HOST}:${PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
