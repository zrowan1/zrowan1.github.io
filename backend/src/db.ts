import Database from 'better-sqlite3';
import { DB_PATH } from './config';

/**
 * Single SQLite connection for the whole app. better-sqlite3 is synchronous,
 * which is ideal for a low-traffic 2-user home server: no connection pool,
 * no async overhead, transactions are trivial.
 */
export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Idempotent schema creation. Runs on every boot; CREATE ... IF NOT EXISTS
 * keeps it a no-op once the tables exist. This replaces the Google Sheet tabs
 * (Alle taken / Taakverdeling / Kookplanning) and the Apps Script sheets
 * (Status / Shopping / stats / archive) with proper relational tables.
 */
export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      username     TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      color        TEXT NOT NULL DEFAULT 'rowan',
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- A named week, e.g. range_label "02-02 t/m 08-02".
    CREATE TABLE IF NOT EXISTS weeks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      range_label TEXT NOT NULL UNIQUE,
      start_date  TEXT,
      end_date    TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Reference chore matrix ("Alle taken"): rooms and the chores per room.
    CREATE TABLE IF NOT EXISTS rooms (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      name     TEXT NOT NULL UNIQUE,
      position INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS chores (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id  INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      name     TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0
    );

    -- Weekly chore distribution ("Taakverdeling"): a task assigned to a user
    -- on a given weekday within a week. Now editable in-app.
    CREATE TABLE IF NOT EXISTS assignments (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id   INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
      user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      weekday   TEXT NOT NULL,
      task_text TEXT NOT NULL,
      position  INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_assignments_week ON assignments(week_id);

    -- Completed-task state (replaces the "Status" sheet). One row per
    -- (week, user, weekday, task); UNIQUE enables upsert on toggle.
    CREATE TABLE IF NOT EXISTS completions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id      INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      weekday      TEXT NOT NULL,
      task_text    TEXT NOT NULL,
      completed    INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      UNIQUE(week_id, user_id, weekday, task_text)
    );
    CREATE INDEX IF NOT EXISTS idx_completions_week ON completions(week_id);

    -- Weekly cooking plan ("Kookplanning"). cook_user_id NULL = "samen".
    CREATE TABLE IF NOT EXISTS cooking_plan (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id      INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
      weekday      TEXT NOT NULL,
      cook_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      is_samen     INTEGER NOT NULL DEFAULT 0,
      meal         TEXT NOT NULL DEFAULT '',
      UNIQUE(week_id, weekday)
    );

    -- Cooking history that feeds the stats (who cooked, how often).
    CREATE TABLE IF NOT EXISTS cooking_history (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id      INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
      weekday      TEXT NOT NULL,
      cook         TEXT NOT NULL,
      meal         TEXT NOT NULL DEFAULT '',
      recorded_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(week_id, weekday)
    );

    -- Shared shopping list.
    CREATE TABLE IF NOT EXISTS shopping_items (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT NOT NULL,
      added_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
      completed    INTEGER NOT NULL DEFAULT 0,
      completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    -- Web Push subscriptions per user/device.
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint   TEXT NOT NULL UNIQUE,
      p256dh     TEXT NOT NULL,
      auth       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
