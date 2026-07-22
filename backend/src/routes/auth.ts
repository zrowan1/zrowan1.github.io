import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db';
import { currentUser, publicUser } from '../auth';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export default async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/login', async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Ongeldige invoer' });

    const { username, password } = parsed.data;
    const row = db
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(username.trim().toLowerCase()) as any;

    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      return reply.code(401).send({ error: 'Onjuiste gebruikersnaam of wachtwoord' });
    }

    req.session.set('userId', row.id);
    return { user: publicUser(row) };
  });

  app.post('/api/auth/logout', async (req) => {
    req.session.delete();
    return { ok: true };
  });

  app.get('/api/auth/me', async (req, reply) => {
    const user = currentUser(req);
    if (!user) return reply.code(401).send({ error: 'Niet ingelogd' });
    return { user };
  });

  // Change own password.
  app.post('/api/auth/password', async (req, reply) => {
    const user = currentUser(req);
    if (!user) return reply.code(401).send({ error: 'Niet ingelogd' });
    const schema = z.object({ current: z.string().min(1), next: z.string().min(4) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Nieuw wachtwoord te kort (min. 4)' });

    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as any;
    if (!bcrypt.compareSync(parsed.data.current, row.password_hash)) {
      return reply.code(403).send({ error: 'Huidig wachtwoord klopt niet' });
    }
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
      bcrypt.hashSync(parsed.data.next, 10),
      user.id,
    );
    return { ok: true };
  });
}
