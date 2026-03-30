import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, "mappin.db"));

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS regions (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    color       TEXT NOT NULL,
    coordinates TEXT NOT NULL,  -- JSON: [{latitude, longitude}]
    center      TEXT NOT NULL,  -- JSON: {latitude, longitude}
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS data_points (
    id        TEXT PRIMARY KEY,
    region_id TEXT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    latitude  REAL NOT NULL,
    longitude REAL NOT NULL,
    label     TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_data_points_region ON data_points(region_id);
`);
