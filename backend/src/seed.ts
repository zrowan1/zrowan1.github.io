import bcrypt from 'bcryptjs';
import { db } from './db';
import { SEED_ROWAN_PASSWORD, SEED_JAMIE_PASSWORD } from './config';

/** The two household members (matches the original app's hard-coded persons). */
const SEED_USERS = [
  { username: 'rowan', display_name: 'Rowan', color: 'rowan', password: SEED_ROWAN_PASSWORD },
  { username: 'jamie', display_name: 'Jamie-Lee', color: 'jamie', password: SEED_JAMIE_PASSWORD },
];

/**
 * Reference chore matrix seed (the old "Alle taken" tab). These are sensible
 * starting chores per room; everything is editable in-app afterwards.
 */
const SEED_ROOMS: Record<string, string[]> = {
  Woonkamer: ['Stofzuigen', 'Dweilen', 'Afstoffen', 'Ramen zemen'],
  Keuken: ['Aanrecht schoonmaken', 'Vaatwasser', 'Vuilnis buiten', 'Kookplaat poetsen'],
  WC: ['Toilet schoonmaken', 'Vloer dweilen'],
  Badkamer: ['Douche schoonmaken', 'Spiegel poetsen', 'Wastafel', 'Vloer dweilen'],
  Kleedkamer: ['Opruimen', 'Stofzuigen'],
  Slaapkamer: ['Bed verschonen', 'Stofzuigen', 'Afstoffen'],
  'Gang + trappen': ['Stofzuigen', 'Dweilen'],
  'Kleinste kamer': ['Opruimen'],
  Balkon: ['Vegen', 'Planten water geven'],
  Algemeen: ['Was draaien', 'Was ophangen', 'Strijken'],
};

/**
 * One-time seed: creates the two users and the reference chore matrix, but
 * only when the tables are empty. Safe to run on every boot.
 */
export function seedIfEmpty(): void {
  const userCount = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
  if (userCount === 0) {
    const insert = db.prepare(
      'INSERT INTO users (username, display_name, password_hash, color) VALUES (?, ?, ?, ?)',
    );
    for (const u of SEED_USERS) {
      insert.run(u.username, u.display_name, bcrypt.hashSync(u.password, 10), u.color);
    }
    console.log('[seed] created default users: rowan, jamie');
  }

  const roomCount = (db.prepare('SELECT COUNT(*) AS n FROM rooms').get() as { n: number }).n;
  if (roomCount === 0) {
    const insertRoom = db.prepare('INSERT INTO rooms (name, position) VALUES (?, ?)');
    const insertChore = db.prepare(
      'INSERT INTO chores (room_id, name, position) VALUES (?, ?, ?)',
    );
    let rPos = 0;
    for (const [room, chores] of Object.entries(SEED_ROOMS)) {
      const info = insertRoom.run(room, rPos++);
      chores.forEach((c, i) => insertChore.run(info.lastInsertRowid, c, i));
    }
    console.log('[seed] created reference chore matrix');
  }
}

// Allow running as a standalone script: `npm run seed`.
if (require.main === module) {
  import('./db').then(({ migrate }) => {
    migrate();
    seedIfEmpty();
    console.log('[seed] done');
  });
}
