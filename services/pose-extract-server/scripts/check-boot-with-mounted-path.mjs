import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const port = 43000 + Math.floor(Math.random() * 500);
const mountRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pose-extract-mount-"));
const databasePath = path.join(mountRoot, "db", "keys.db");

const child = spawn("node", ["dist/index.js"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(port),
    DATABASE_PATH: databasePath,
    ADMIN_SECRET: process.env.ADMIN_SECRET ?? "spike-admin-secret",
    APP_VERSION: "spike-local"
  },
  stdio: "pipe"
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) {
        return await response.json();
      }
    } catch (_error) {
      // Server may still be booting; continue polling.
    }
    await sleep(250);
  }
  throw new Error("Server failed to become healthy in time");
}

async function main() {
  try {
    const health = await waitForHealth();
    if (health.status !== "ok") {
      throw new Error(`Unexpected health status: ${health.status}`);
    }
    if (!fs.existsSync(databasePath)) {
      throw new Error(`Database file was not created at ${databasePath}`);
    }
    console.log(
      JSON.stringify(
        {
          ok: true,
          version: health.version,
          databasePath
        },
        null,
        2
      )
    );
  } finally {
    child.kill("SIGTERM");
    await sleep(200);
    fs.rmSync(mountRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
