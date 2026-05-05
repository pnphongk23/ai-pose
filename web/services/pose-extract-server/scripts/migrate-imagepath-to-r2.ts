import Database from "better-sqlite3";

import { getEnv } from "../src/config/env";
import { buildPublicUrl } from "../src/services/r2Storage";

interface PoseRow {
  id: string;
  image_path: string;
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isAlreadyR2PublicUrl(imagePath: string, r2PublicUrl: string): boolean {
  const normalizedBase = r2PublicUrl.replace(/\/+$/, "");
  return imagePath === normalizedBase || imagePath.startsWith(`${normalizedBase}/`);
}

function normalizeToCommunityKey(imagePath: string): string {
  const withoutQuery = imagePath.split("?")[0]?.split("#")[0] ?? imagePath;
  const trimmed = withoutQuery.trim().replace(/^\/+/, "");

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("community/")) {
    return trimmed;
  }

  const localPrefixes = ["data/community/", "community_uploads/", "uploads/community/"];
  for (const prefix of localPrefixes) {
    if (trimmed.startsWith(prefix)) {
      return `community/${trimmed.slice(prefix.length).replace(/^\/+/, "")}`;
    }
  }

  return `community/${trimmed}`;
}

function parseDryRun(argv: string[]): boolean {
  return argv.includes("--dry-run");
}

function main(): void {
  const env = getEnv();
  const dryRun = parseDryRun(process.argv.slice(2));
  const db = new Database(env.DATABASE_PATH);

  const rows = db
    .prepare("SELECT id, image_path FROM community_poses")
    .all() as PoseRow[];

  let skippedAlreadyR2 = 0;
  let skippedAbsoluteNonR2 = 0;
  let skippedEmpty = 0;
  let migrated = 0;

  const updates: Array<{ id: string; from: string; to: string }> = [];

  for (const row of rows) {
    const imagePath = row.image_path?.trim();

    if (!imagePath) {
      skippedEmpty += 1;
      continue;
    }

    if (isAlreadyR2PublicUrl(imagePath, env.R2_PUBLIC_URL)) {
      skippedAlreadyR2 += 1;
      continue;
    }

    if (isAbsoluteHttpUrl(imagePath)) {
      skippedAbsoluteNonR2 += 1;
      continue;
    }

    const normalizedKey = normalizeToCommunityKey(imagePath);
    if (!normalizedKey) {
      skippedEmpty += 1;
      continue;
    }

    const nextImagePath = buildPublicUrl(env.R2_PUBLIC_URL, normalizedKey);
    updates.push({ id: row.id, from: imagePath, to: nextImagePath });
  }

  if (!dryRun && updates.length > 0) {
    const updateStmt = db.prepare("UPDATE community_poses SET image_path = ? WHERE id = ?");
    const tx = db.transaction((items: Array<{ id: string; to: string }>) => {
      for (const item of items) {
        updateStmt.run(item.to, item.id);
      }
    });
    tx(updates.map(({ id, to }) => ({ id, to })));
    migrated = updates.length;
  }

  if (dryRun) {
    migrated = 0;
  }

  console.log(`[migrate-imagepath-to-r2] mode=${dryRun ? "dry-run" : "apply"}`);
  console.log(`[migrate-imagepath-to-r2] total_rows=${rows.length}`);
  console.log(`[migrate-imagepath-to-r2] candidate_updates=${updates.length}`);
  console.log(`[migrate-imagepath-to-r2] migrated=${migrated}`);
  console.log(`[migrate-imagepath-to-r2] skipped_already_r2=${skippedAlreadyR2}`);
  console.log(`[migrate-imagepath-to-r2] skipped_absolute_non_r2=${skippedAbsoluteNonR2}`);
  console.log(`[migrate-imagepath-to-r2] skipped_empty=${skippedEmpty}`);

  if (updates.length > 0) {
    const preview = updates.slice(0, 10);
    console.log("[migrate-imagepath-to-r2] preview_updates=");
    for (const item of preview) {
      console.log(`- id=${item.id}`);
      console.log(`  from=${item.from}`);
      console.log(`  to=${item.to}`);
    }
    if (updates.length > preview.length) {
      console.log(`[migrate-imagepath-to-r2] ... ${updates.length - preview.length} more`);
    }
  }

  db.close();
}

main();
