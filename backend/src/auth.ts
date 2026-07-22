import { FastifyReply, FastifyRequest } from 'fastify';
import { db } from './db';

export interface User {
  id: number;
  username: string;
  display_name: string;
  color: string;
}

/** Public shape of a user (never leak the password hash). */
export function publicUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    color: row.color,
  };
}

/** Resolve the logged-in user from the session cookie, or null. */
export function currentUser(req: FastifyRequest): User | null {
  const userId = req.session.get('userId');
  if (!userId) return null;
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  return row ? publicUser(row) : null;
}

/**
 * Fastify preHandler that rejects unauthenticated requests and attaches the
 * resolved user to `req.user` for downstream handlers.
 */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = currentUser(req);
  if (!user) {
    reply.code(401).send({ error: 'Niet ingelogd' });
    return;
  }
  (req as any).user = user;
}

/** Typed accessor for the user attached by requireAuth. */
export function reqUser(req: FastifyRequest): User {
  return (req as any).user as User;
}
