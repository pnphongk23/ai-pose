import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import Database from "better-sqlite3";

import { getEnv } from "../src/config/env";
import { getR2Client } from "../src/services/r2Storage";

interface PosePathRow {
  image_path: string;
}

function parseDryRun(argv: string[]): boolean {
  return argv.includes("--dry-run");
}

function extractCommunityKey(imagePath: string, r2PublicUrl: string): string | null {
  const raw = imagePath.trim();
  if (!raw) return null;

  const normalizedBase = r2PublicUrl.replace(/\/+$/, "");
  if (raw.startsWith(`${normalizedBase}/`)) {
    return raw.slice(normalizedBase.length + 1).split("?")[0]?.split("#")[0] ?? null;
  }

  if (/^https?:\/\//i.test(raw)) {
    return null;
  }

  const trimmed = raw.split("?")[0]?.split("#")[0]?.replace(/^\/+/, "") ?? "";
  if (!trimmed) return null;
  if (trimmed.startsWith("community/")) return trimmed;
  if (trimmed.startsWith("data/community/")) return `community/${trimmed.slice("data/community/".length)}`;
  return `community/${trimmed}`;
}

async function listR2CommunityKeys(bucket: string): Promise<Set<string>> {
  const client = getR2Client();
  const keys = new Set<string>();

  let token: string | undefined;
  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: "community/",
        ContinuationToken: token
      })
    );

    for (const obj of response.Contents ?? []) {
      if (obj.Key) {
        keys.add(obj.Key);
      }
    }

    token = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (token);

  return keys;
}

async function main(): Promise<void> {
  const env = getEnv();
  const dryRun = parseDryRun(process.argv.slice(2));

  const db = new Database(env.DATABASE_PATH, { readonly: true });
  const rows = db.prepare("SELECT image_path FROM community_poses").all() as PosePathRow[];

  const referencedKeys = new Set<string>();
  let skippedNonCommunity = 0;

  for (const row of rows) {
    const key = extractCommunityKey(row.image_path ?? "", env.R2_PUBLIC_URL);
    if (key && key.startsWith("community/")) {
      referencedKeys.add(key);
    } else {
      skippedNonCommunity += 1;
    }
  }

  let r2Keys = new Set<string>();
  let r2ListError: string | null = null;

  try {
    r2Keys = await listR2CommunityKeys(env.R2_BUCKET);
  } catch (err) {
    r2ListError = err instanceof Error ? err.message : String(err);
  }

  const orphans = r2ListError
    ? []
    : [...r2Keys].filter((key) => !referencedKeys.has(key)).sort();

  console.log(`[cleanup-r2-orphans] mode=${dryRun ? "dry-run" : "apply"}`);
  console.log("[cleanup-r2-orphans] deletion is not implemented; reporting candidates only");
  console.log(`[cleanup-r2-orphans] db_rows=${rows.length}`);
  console.log(`[cleanup-r2-orphans] referenced_keys=${referencedKeys.size}`);
  console.log(`[cleanup-r2-orphans] skipped_non_community=${skippedNonCommunity}`);

  if (r2ListError) {
    console.warn(`[cleanup-r2-orphans] r2_list_error=${r2ListError}`);
    console.warn("[cleanup-r2-orphans] r2_keys=UNKNOWN (could not list R2 objects)");
    console.warn("[cleanup-r2-orphans] orphan_candidates=UNKNOWN");
  } else {
    console.log(`[cleanup-r2-orphans] r2_keys=${r2Keys.size}`);
    console.log(`[cleanup-r2-orphans] orphan_candidates=${orphans.length}`);

    if (orphans.length > 0) {
      console.log("[cleanup-r2-orphans] orphan_list=");
      for (const key of orphans) {
        console.log(`- ${key}`);
      }
    }
  }

  db.close();
}

main().catch((error) => {
  console.error("[cleanup-r2-orphans] failed", error);
  process.exitCode = 1;
});
