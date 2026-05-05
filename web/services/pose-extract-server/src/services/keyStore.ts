import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

export type ApiKeyStatus = "active" | "disabled" | "exhausted";

export interface ApiKeyRecord {
  id: string;
  name: string;
  apiKey: string;
  status: ApiKeyStatus;
  requestsToday: number;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface RequestLogRecord {
  id: number;
  keyId: string | null;
  timestamp: string;
  processingTimeMs: number | null;
  success: boolean;
  errorCode: string | null;
}

interface CreateApiKeyInput {
  name: string;
  apiKey: string;
}

interface ApiKeyRow {
  id: string;
  name: string;
  api_key: string;
  status: ApiKeyStatus;
  requests_today: number;
  created_at: string;
  last_used_at: string | null;
}

interface RequestLogRow {
  id: number;
  key_id: string | null;
  timestamp: string;
  processing_time_ms: number | null;
  success: number;
  error_code: string | null;
}

interface LogRequestInput {
  keyId: string | null;
  processingTimeMs: number | null;
  success: boolean;
  errorCode: string | null;
}

export class KeyStore {
  constructor(private readonly db: Database.Database) {}

  listKeys(): ApiKeyRecord[] {
    const rows = this.db
      .prepare(
        `SELECT id, name, api_key, status, requests_today, created_at, last_used_at
         FROM api_keys
         ORDER BY created_at ASC`
      )
      .all() as ApiKeyRow[];

    return rows.map((row) => this.toRecord(row));
  }

  createKey(input: CreateApiKeyInput): ApiKeyRecord {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO api_keys (id, name, api_key, status, requests_today)
         VALUES (?, ?, ?, 'active', 0)`
      )
      .run(id, input.name, input.apiKey);

    const created = this.getKeyById(id);
    if (!created) {
      throw new Error("Failed to create API key");
    }
    return created;
  }

  updateKeyStatus(id: string, status: ApiKeyStatus): ApiKeyRecord | null {
    const result = this.db.prepare("UPDATE api_keys SET status = ? WHERE id = ?").run(status, id);
    if (result.changes === 0) {
      return null;
    }
    return this.getKeyById(id);
  }

  deleteKey(id: string): boolean {
    const result = this.db.prepare("DELETE FROM api_keys WHERE id = ?").run(id);
    return result.changes > 0;
  }

  incrementRequestsToday(id: string): void {
    this.db
      .prepare("UPDATE api_keys SET requests_today = requests_today + 1, last_used_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(id);
  }

  resetDailyCounters(): number {
    const result = this.db.prepare(
      `UPDATE api_keys
       SET requests_today = 0,
           status = CASE
             WHEN status = 'exhausted' THEN 'active'
             ELSE status
           END`
    ).run();

    return result.changes;
  }

  logRequest(input: LogRequestInput): RequestLogRecord {
    const result = this.db
      .prepare(
        `INSERT INTO request_logs (key_id, processing_time_ms, success, error_code)
         VALUES (?, ?, ?, ?)`
      )
      .run(input.keyId, input.processingTimeMs, input.success ? 1 : 0, input.errorCode);

    const created = this.db
      .prepare(
        `SELECT id, key_id, timestamp, processing_time_ms, success, error_code
         FROM request_logs
         WHERE id = ?`
      )
      .get(result.lastInsertRowid) as RequestLogRow | undefined;

    if (!created) {
      throw new Error("Failed to log request");
    }

    return this.toRequestLogRecord(created);
  }

  listRequestLogs(): RequestLogRecord[] {
    const rows = this.db
      .prepare(
        `SELECT id, key_id, timestamp, processing_time_ms, success, error_code
         FROM request_logs
         ORDER BY id ASC`
      )
      .all() as RequestLogRow[];

    return rows.map((row) => this.toRequestLogRecord(row));
  }

  private getKeyById(id: string): ApiKeyRecord | null {
    const row = this.db
      .prepare(
        `SELECT id, name, api_key, status, requests_today, created_at, last_used_at
         FROM api_keys
         WHERE id = ?`
      )
      .get(id) as ApiKeyRow | undefined;

    return row ? this.toRecord(row) : null;
  }

  private toRecord(row: ApiKeyRow): ApiKeyRecord {
    return {
      id: row.id,
      name: row.name,
      apiKey: row.api_key,
      status: row.status,
      requestsToday: row.requests_today,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at
    };
  }

  private toRequestLogRecord(row: RequestLogRow): RequestLogRecord {
    return {
      id: row.id,
      keyId: row.key_id,
      timestamp: row.timestamp,
      processingTimeMs: row.processing_time_ms,
      success: row.success === 1,
      errorCode: row.error_code
    };
  }
}
