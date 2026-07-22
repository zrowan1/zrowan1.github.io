import '@fastify/secure-session';

// Tell @fastify/secure-session what we store in the session cookie, so
// req.session.get/set('userId') are properly typed instead of `never`.
declare module '@fastify/secure-session' {
  interface SessionData {
    userId: number;
  }
}
