import "dotenv/config";
import { createApp } from "./app";
import { getEnv } from "./config/env";
import { createDatabase } from "./db/connection";
import { CommunityStore } from "./db/communityStore";
import { GeminiService } from "./services/geminiService";
import { KeyPoolManager } from "./services/keyPoolManager";
import { KeyStore } from "./services/keyStore";
import { logger } from "./utils/logger";

const env = getEnv();
const db = createDatabase(env.DATABASE_PATH);
const keyStore = new KeyStore(db);
const communityStore = new CommunityStore(db);
const keyPoolManager = new KeyPoolManager(keyStore);
const geminiService = new GeminiService();
const appVersion = process.env.APP_VERSION ?? process.env.npm_package_version ?? "1.0.0";
const app = createApp({
  version: appVersion,
  adminSecret: env.ADMIN_SECRET,
  keyStore,
  keyPoolManager,
  geminiService,
  extractRateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
  extractRateLimitMaxRequests: env.RATE_LIMIT_MAX,
  communityStore,
  communityUploadDir: env.COMMUNITY_UPLOAD_DIR,
});
const SHUTDOWN_TIMEOUT_MS = 10_000;
let shuttingDown = false;

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "pose-extract-server started");
});

function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) {
    logger.warn({ signal }, "Shutdown already in progress");
    return;
  }
  shuttingDown = true;
  logger.info({ signal }, "Shutting down server");

  const forceExitTimer = setTimeout(() => {
    logger.error({ signal, timeoutMs: SHUTDOWN_TIMEOUT_MS }, "Force exiting after shutdown timeout");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref();

  server.close(() => {
    clearTimeout(forceExitTimer);
    try {
      db.close();
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, "Failed to close database during shutdown");
      process.exit(1);
    }
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
