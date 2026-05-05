import "dotenv/config";

import { getEnv } from "../config/env";
import { createDatabase } from "../db/connection";
import { ExtractionJobStore } from "../db/extractionJobStore";
import { logger } from "../utils/logger";
import { GeminiBrowserClient } from "./gemini-browser-client";
import { processNextJob } from "./job-processor";

const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_INTERVAL_MS ?? "1000");
const STALE_LOCK_SECONDS = Number(process.env.WORKER_STALE_LOCK_SECONDS ?? "120");
const BROWSER_TIMEOUT_MS = Number(process.env.BROWSER_TIMEOUT_MS ?? "90000");
const BROWSER_PROMPT = process.env.BROWSER_PROMPT ?? "Extract a clean human pose cutout from this image.";

async function run(): Promise<void> {
  const env = getEnv();
  const db = createDatabase(env.DATABASE_PATH);
  const jobStore = new ExtractionJobStore(db);
  const profileDir = process.env.BROWSER_PROFILE_DIR ?? env.BROWSER_PROFILE_DIR;
  const browserClient = new GeminiBrowserClient({
    appUrl: env.BROWSER_APP_URL,
    profileDir,
    chromeChannel: env.BROWSER_CHROME_CHANNEL ?? process.env.PLAYWRIGHT_CHROME_CHANNEL,
    headless: env.BROWSER_HEADLESS === "true",
    executablePath: env.BROWSER_EXECUTABLE_PATH ?? process.env.PLAYWRIGHT_CHROMIUM_PATH,
    prompt: BROWSER_PROMPT,
    timeoutMs: BROWSER_TIMEOUT_MS,
    useMockFlow: process.env.WORKER_MOCK_BROWSER === "true",
    debugDir: process.env.WORKER_DEBUG_DIR
  });

  logger.info({ pollIntervalMs: POLL_INTERVAL_MS, staleLockSeconds: STALE_LOCK_SECONDS }, "worker started");

  while (true) {
    const processed = await processNextJob({ jobStore, browserClient, staleLockSeconds: STALE_LOCK_SECONDS });
    if (!processed) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
}

run().catch((error) => {
  logger.error({ err: error }, "worker crashed");
  process.exit(1);
});
