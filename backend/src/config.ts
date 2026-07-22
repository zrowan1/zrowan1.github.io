import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import webpush from 'web-push';

/**
 * Central runtime configuration, all driven by environment variables so the
 * container is fully configurable from docker-compose. Secrets that are not
 * provided (session key, VAPID keys) are generated once and persisted into
 * DATA_DIR so they survive restarts without the user having to manage them.
 */

export const DATA_DIR = process.env.DATA_DIR || '/data';
export const PORT = Number(process.env.PORT || 3000);
export const HOST = process.env.HOST || '0.0.0.0';
export const TZ = process.env.TZ || 'Europe/Amsterdam';

/** Directory that holds the built frontend (index.html + assets). */
export const STATIC_DIR =
  process.env.STATIC_DIR || path.resolve(__dirname, '../../frontend/dist');

/** When set (e.g. behind HTTPS reverse proxy) auth cookies get Secure flag. */
export const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';

/** Cron expression for the daily reminder push. Default 07:00 local time. */
export const REMINDER_CRON = process.env.REMINDER_CRON || '0 7 * * *';

/** First-boot seed passwords (only used if the users table is empty). */
export const SEED_ROWAN_PASSWORD = process.env.SEED_ROWAN_PASSWORD || 'rowan';
export const SEED_JAMIE_PASSWORD = process.env.SEED_JAMIE_PASSWORD || 'jamie';

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Load a persisted secret from DATA_DIR, or create+store it on first run.
 * `bytes` controls generation length for random secrets.
 */
function loadOrCreate(fileName: string, generate: () => string): string {
  ensureDataDir();
  const file = path.join(DATA_DIR, fileName);
  if (fs.existsSync(file)) {
    return fs.readFileSync(file, 'utf8').trim();
  }
  const value = generate();
  fs.writeFileSync(file, value, { mode: 0o600 });
  return value;
}

/** 32-byte key required by @fastify/secure-session. */
export function getSessionKey(): Buffer {
  const hex = process.env.SESSION_SECRET
    ? crypto.createHash('sha256').update(process.env.SESSION_SECRET).digest('hex')
    : loadOrCreate('session.key', () => crypto.randomBytes(32).toString('hex'));
  return Buffer.from(hex.slice(0, 64), 'hex');
}

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
  subject: string;
}

/** VAPID keys for Web Push. Read from env, else generate + persist once. */
export function getVapidKeys(): VapidKeys {
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@huishouden.local';
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
      subject,
    };
  }
  const stored = loadOrCreate('vapid.json', () =>
    JSON.stringify(webpush.generateVAPIDKeys()),
  );
  const keys = JSON.parse(stored) as { publicKey: string; privateKey: string };
  return { ...keys, subject };
}

export const DB_PATH = path.join(DATA_DIR, 'data.db');
