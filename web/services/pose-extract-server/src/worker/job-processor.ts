import { randomUUID } from "node:crypto";

import type { ExtractionJobStore } from "../db/extractionJobStore";
import { logger } from "../utils/logger";
import { WORKER_ERROR_CODES } from "./error-codes";
import { GeminiBrowserClient } from "./gemini-browser-client";

export async function processNextJob(input: {
  jobStore: ExtractionJobStore;
  browserClient: GeminiBrowserClient;
  staleLockSeconds: number;
}): Promise<boolean> {
  const lockToken = randomUUID();
  const job = input.jobStore.claimNext(lockToken, input.staleLockSeconds);

  if (!job) {
    return false;
  }

  try {
    const extracted = await input.browserClient.extractPoseImage({
      sourceImageBase64: job.sourceImageBase64,
      sourceMimeType: job.sourceMimeType
    });
    input.jobStore.markSucceeded(job.id, lockToken, extracted.imageBase64, extracted.mimeType);
    logger.info({ jobId: job.id, attempts: job.attempts }, "worker job succeeded");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown browser worker error";
    const errorCode =
      error instanceof Error && "code" in error && typeof (error as { code?: unknown }).code === "string"
        ? String((error as { code?: string }).code)
        : WORKER_ERROR_CODES.browserFlowFailed;
    input.jobStore.markFailedOrRequeue(job.id, lockToken, errorCode, message);
    logger.error({ jobId: job.id, err: error }, "worker job failed");
  }

  return true;
}
