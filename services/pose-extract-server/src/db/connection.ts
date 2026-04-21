import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

function resolveSchemaPath(): string {
  const schemaPath = path.resolve(__dirname, "schema.sql");
  if (fs.existsSync(schemaPath)) {
    return schemaPath;
  }

  throw new Error(`Schema file not found at expected path: ${schemaPath}`);
}

export function createDatabase(databasePath: string): Database.Database {
  const absolutePath = path.resolve(databasePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

  const db = new Database(absolutePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const schemaSql = fs.readFileSync(resolveSchemaPath(), "utf-8");
  db.exec(schemaSql);

  return db;
}
