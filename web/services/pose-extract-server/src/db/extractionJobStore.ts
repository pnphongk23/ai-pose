import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

export type ExtractionJobStatus = "queued" | "processing" | "succeeded" | "failed";

export interface ExtractionJob {
  id: string;
  status: ExtractionJobStatus;
  sourceImageBase64: string;
  sourceMimeType: string;
  resultImageBase64: string | null;
  resultMimeType: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  attempts: number;
  maxAttempts: number;
  lockedAt: string | null;
  lockToken: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ExtractionJobRow {
  id: string;
  status: ExtractionJobStatus;
  source_image_base64: string;
  source_mime_type: string;
  result_image_base64: string | null;
  result_mime_type: string | null;
  error_code: string | null;
  error_message: string | null;
  attempts: number;
  max_attempts: number;
  locked_at: string | null;
  lock_token: string | null;
  created_at: string;
  updated_at: string;
}

export class ExtractionJobStore {
  constructor(private readonly db: Database.Database) {}

  enqueue(input: { sourceImageBase64: string; sourceMimeType: string; maxAttempts?: number }): ExtractionJob {
    const id = randomUUID();
    this.db
      .prepare(`INSERT INTO extraction_jobs (id, status, source_image_base64, source_mime_type, max_attempts) VALUES (?, 'queued', ?, ?, ?)`)
      .run(id, input.sourceImageBase64, input.sourceMimeType, input.maxAttempts ?? 3);
    const job = this.getById(id);
    if (!job) throw new Error("Failed to enqueue extraction job");
    return job;
  }

  getById(id: string): ExtractionJob | null {
    const row = this.db.prepare(`SELECT * FROM extraction_jobs WHERE id = ?`).get(id) as ExtractionJobRow | undefined;
    return row ? this.toJob(row) : null;
  }

  claimNext(lockToken: string, staleLockSeconds: number): ExtractionJob | null {
    const staleExpr = `datetime('now', '-' || ? || ' seconds')`;
    const row = this.db
      .prepare(
        `SELECT id FROM extraction_jobs
         WHERE (status = 'queued' OR (status = 'processing' AND locked_at IS NOT NULL AND locked_at <= ${staleExpr}))
           AND attempts < max_attempts
         ORDER BY created_at ASC
         LIMIT 1`
      )
      .get(staleLockSeconds) as { id: string } | undefined;

    if (!row) return null;

    const result = this.db
      .prepare(
        `UPDATE extraction_jobs
         SET status = 'processing', attempts = attempts + 1, lock_token = ?, locked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND (status = 'queued' OR status = 'processing')`
      )
      .run(lockToken, row.id);

    if (result.changes === 0) return null;
    return this.getById(row.id);
  }

  markSucceeded(id: string, lockToken: string, resultImageBase64: string, resultMimeType: string): void {
    this.db
      .prepare(
        `UPDATE extraction_jobs
         SET status = 'succeeded', result_image_base64 = ?, result_mime_type = ?, error_code = NULL, error_message = NULL,
             lock_token = NULL, locked_at = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND lock_token = ?`
      )
      .run(resultImageBase64, resultMimeType, id, lockToken);
  }

  markFailedOrRequeue(id: string, lockToken: string, errorCode: string, errorMessage: string): void {
    this.db
      .prepare(
        `UPDATE extraction_jobs
         SET status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'queued' END,
             error_code = ?, error_message = ?, lock_token = NULL, locked_at = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND lock_token = ?`
      )
      .run(errorCode, errorMessage, id, lockToken);
  }

  private toJob(row: ExtractionJobRow): ExtractionJob {
    return {
      id: row.id,
      status: row.status,
      sourceImageBase64: row.source_image_base64,
      sourceMimeType: row.source_mime_type,
      resultImageBase64: row.result_image_base64,
      resultMimeType: row.result_mime_type,
      errorCode: row.error_code,
      errorMessage: row.error_message,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      lockedAt: row.locked_at,
      lockToken: row.lock_token,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
