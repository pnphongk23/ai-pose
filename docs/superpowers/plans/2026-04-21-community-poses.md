# Community Poses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép admin upload pose vào community library (lưu server-side), và user public browse/download pose đó.

**Architecture:** Community poses lưu trong SQLite của `services/pose-extract-server` (Express/TypeScript). Next.js app là client-only, gọi Express API để hiển thị và upload. Image files lưu trong `services/pose-extract-server/data/community/`, được serve qua Express static middleware.

**Tech Stack:** Express 5, better-sqlite3, multer (đã có), Vitest, supertest, Next.js 16 (client), Tailwind CSS

---

## File Map

### Express server (`services/pose-extract-server/`)
| File | Action | Mô tả |
|------|--------|-------|
| `src/db/schema.sql` | Modify | Thêm bảng `community_poses` |
| `src/db/communityStore.ts` | Create | CRUD layer cho community_poses |
| `src/db/communityStore.test.ts` | Create | Unit tests cho CommunityStore |
| `src/routes/communityRoutes.ts` | Create | Public GET /api/community/poses, GET /api/community/poses/:id |
| `src/routes/communityRoutes.test.ts` | Create | Integration tests public routes |
| `src/routes/adminCommunityRoutes.ts` | Create | Admin POST /api/admin/community/poses (upload) |
| `src/routes/adminCommunityRoutes.test.ts` | Create | Integration tests admin upload |
| `src/app.ts` | Modify | Wire community routes + static middleware |
| `src/index.ts` | Modify | Truyền `communityStore` vào `createApp` |
| `src/config/env.ts` | Modify | Thêm `COMMUNITY_UPLOAD_DIR` env var |

### Next.js app (`src/`)
| File | Action | Mô tả |
|------|--------|-------|
| `src/app/community/page.js` | Create | Public browse page |
| `src/app/admin/community/page.js` | Create | Admin upload form |

---

## Task 1: Schema — thêm bảng community_poses

**Files:**
- Modify: `services/pose-extract-server/src/db/schema.sql`
- Modify: `services/pose-extract-server/src/db/connection.test.ts`

- [ ] **Step 1: Mở file schema.sql, append bảng mới**

File: `services/pose-extract-server/src/db/schema.sql`

Append vào cuối file (giữ nguyên phần hiện có):

```sql
CREATE TABLE IF NOT EXISTS community_poses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_path TEXT NOT NULL,
  thumbnail_path TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  difficulty TEXT CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
  description TEXT,
  body_parts TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  download_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_community_poses_status ON community_poses(status);
CREATE INDEX IF NOT EXISTS idx_community_poses_difficulty ON community_poses(difficulty);
```

- [ ] **Step 2: Thêm test xác nhận schema tạo thành công**

File: `services/pose-extract-server/src/db/connection.test.ts`

Append test case vào describe block hiện có (xem file hiện tại để biết vị trí đúng):

```typescript
it("creates community_poses table", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pose-schema-"));
  const db = createDatabase(path.join(tempDir, "test.db"));

  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='community_poses'")
    .all();

  expect(tables).toHaveLength(1);
  db.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});
```

- [ ] **Step 3: Chạy test để xác nhận pass**

```bash
cd services/pose-extract-server && npm test -- --reporter=verbose src/db/connection.test.ts
```

Expected: test mới pass cùng với các test cũ.

- [ ] **Step 4: Commit**

```bash
git add services/pose-extract-server/src/db/schema.sql services/pose-extract-server/src/db/connection.test.ts
git commit -m "feat(community): add community_poses table schema"
```

---

## Task 2: CommunityStore — CRUD layer

**Files:**
- Create: `services/pose-extract-server/src/db/communityStore.ts`
- Create: `services/pose-extract-server/src/db/communityStore.test.ts`

- [ ] **Step 1: Viết failing tests trước**

Tạo file `services/pose-extract-server/src/db/communityStore.test.ts`:

```typescript
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDatabase } from "./connection";
import { CommunityStore } from "./communityStore";

const tempDirs: string[] = [];

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

function createTestStore(): CommunityStore {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pose-community-"));
  tempDirs.push(tempDir);
  const db = createDatabase(path.join(tempDir, "test.db"));
  return new CommunityStore(db);
}

describe("CommunityStore", () => {
  it("creates and retrieves a pose by id", () => {
    const store = createTestStore();

    const created = store.createPose({
      name: "Warrior II",
      imagePath: "community/warrior2.png",
      thumbnailPath: "community/warrior2_thumb.png",
      tags: ["standing", "balance"],
      difficulty: "intermediate",
      description: "Classic yoga pose",
      bodyParts: ["legs", "arms"],
      status: "draft",
    });

    expect(created.id).toBeTruthy();
    expect(created.name).toBe("Warrior II");
    expect(created.tags).toEqual(["standing", "balance"]);
    expect(created.bodyParts).toEqual(["legs", "arms"]);
    expect(created.downloadCount).toBe(0);
    expect(created.status).toBe("draft");

    const fetched = store.getPoseById(created.id);
    expect(fetched).toEqual(created);
  });

  it("returns null for unknown id", () => {
    const store = createTestStore();
    expect(store.getPoseById("nonexistent")).toBeNull();
  });

  it("lists only published poses by default", () => {
    const store = createTestStore();

    store.createPose({
      name: "Draft Pose",
      imagePath: "community/draft.png",
      thumbnailPath: null,
      tags: [],
      difficulty: "beginner",
      description: null,
      bodyParts: [],
      status: "draft",
    });

    const published = store.createPose({
      name: "Published Pose",
      imagePath: "community/pub.png",
      thumbnailPath: null,
      tags: ["standing"],
      difficulty: "beginner",
      description: null,
      bodyParts: ["legs"],
      status: "published",
    });

    const { poses, total } = store.listPoses({ status: "published", page: 1, limit: 10 });
    expect(poses).toHaveLength(1);
    expect(poses[0].id).toBe(published.id);
    expect(total).toBe(1);
  });

  it("filters by difficulty", () => {
    const store = createTestStore();

    store.createPose({
      name: "Easy Pose",
      imagePath: "community/easy.png",
      thumbnailPath: null,
      tags: [],
      difficulty: "beginner",
      description: null,
      bodyParts: [],
      status: "published",
    });

    store.createPose({
      name: "Hard Pose",
      imagePath: "community/hard.png",
      thumbnailPath: null,
      tags: [],
      difficulty: "advanced",
      description: null,
      bodyParts: [],
      status: "published",
    });

    const { poses, total } = store.listPoses({ status: "published", difficulty: "beginner", page: 1, limit: 10 });
    expect(poses).toHaveLength(1);
    expect(poses[0].name).toBe("Easy Pose");
    expect(total).toBe(1);
  });

  it("filters by tag", () => {
    const store = createTestStore();

    store.createPose({
      name: "Balance Pose",
      imagePath: "community/balance.png",
      thumbnailPath: null,
      tags: ["balance", "standing"],
      difficulty: "beginner",
      description: null,
      bodyParts: [],
      status: "published",
    });

    store.createPose({
      name: "Core Pose",
      imagePath: "community/core.png",
      thumbnailPath: null,
      tags: ["core"],
      difficulty: "beginner",
      description: null,
      bodyParts: [],
      status: "published",
    });

    const { poses } = store.listPoses({ status: "published", tag: "balance", page: 1, limit: 10 });
    expect(poses).toHaveLength(1);
    expect(poses[0].name).toBe("Balance Pose");
  });

  it("paginates results", () => {
    const store = createTestStore();

    for (let i = 0; i < 5; i++) {
      store.createPose({
        name: `Pose ${i}`,
        imagePath: `community/pose${i}.png`,
        thumbnailPath: null,
        tags: [],
        difficulty: "beginner",
        description: null,
        bodyParts: [],
        status: "published",
      });
    }

    const page1 = store.listPoses({ status: "published", page: 1, limit: 3 });
    const page2 = store.listPoses({ status: "published", page: 2, limit: 3 });

    expect(page1.poses).toHaveLength(3);
    expect(page2.poses).toHaveLength(2);
    expect(page1.total).toBe(5);
  });

  it("increments download count", () => {
    const store = createTestStore();

    const pose = store.createPose({
      name: "Popular Pose",
      imagePath: "community/popular.png",
      thumbnailPath: null,
      tags: [],
      difficulty: "beginner",
      description: null,
      bodyParts: [],
      status: "published",
    });

    store.incrementDownload(pose.id);
    store.incrementDownload(pose.id);

    const updated = store.getPoseById(pose.id);
    expect(updated?.downloadCount).toBe(2);
  });
});
```

- [ ] **Step 2: Chạy test — xác nhận RED**

```bash
cd services/pose-extract-server && npm test -- src/db/communityStore.test.ts
```

Expected: FAIL vì `communityStore.ts` chưa tồn tại.

- [ ] **Step 3: Implement CommunityStore**

Tạo file `services/pose-extract-server/src/db/communityStore.ts`:

```typescript
import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

export type PoseStatus = "draft" | "published";
export type PoseDifficulty = "beginner" | "intermediate" | "advanced";

export interface CommunityPoseRecord {
  id: string;
  name: string;
  imagePath: string;
  thumbnailPath: string | null;
  tags: string[];
  difficulty: PoseDifficulty | null;
  description: string | null;
  bodyParts: string[];
  status: PoseStatus;
  uploadedAt: string;
  downloadCount: number;
}

export interface CreatePoseInput {
  name: string;
  imagePath: string;
  thumbnailPath: string | null;
  tags: string[];
  difficulty: PoseDifficulty | null;
  description: string | null;
  bodyParts: string[];
  status: PoseStatus;
}

export interface ListPosesFilter {
  status: PoseStatus;
  difficulty?: PoseDifficulty;
  tag?: string;
  page: number;
  limit: number;
}

export interface ListPosesResult {
  poses: CommunityPoseRecord[];
  total: number;
}

interface CommunityPoseRow {
  id: string;
  name: string;
  image_path: string;
  thumbnail_path: string | null;
  tags: string;
  difficulty: PoseDifficulty | null;
  description: string | null;
  body_parts: string;
  status: PoseStatus;
  uploaded_at: string;
  download_count: number;
}

export class CommunityStore {
  constructor(private readonly db: Database.Database) {}

  createPose(input: CreatePoseInput): CommunityPoseRecord {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO community_poses
           (id, name, image_path, thumbnail_path, tags, difficulty, description, body_parts, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.name,
        input.imagePath,
        input.thumbnailPath,
        JSON.stringify(input.tags),
        input.difficulty,
        input.description,
        JSON.stringify(input.bodyParts),
        input.status
      );

    const created = this.getPoseById(id);
    if (!created) throw new Error("Failed to create pose");
    return created;
  }

  getPoseById(id: string): CommunityPoseRecord | null {
    const row = this.db
      .prepare(`SELECT * FROM community_poses WHERE id = ?`)
      .get(id) as CommunityPoseRow | undefined;
    return row ? this.toRecord(row) : null;
  }

  listPoses(filter: ListPosesFilter): ListPosesResult {
    const conditions: string[] = ["status = ?"];
    const params: unknown[] = [filter.status];

    if (filter.difficulty) {
      conditions.push("difficulty = ?");
      params.push(filter.difficulty);
    }

    if (filter.tag) {
      // JSON array contains tag via LIKE (simple, works for MVP)
      conditions.push("tags LIKE ?");
      params.push(`%"${filter.tag}"%`);
    }

    const where = conditions.join(" AND ");
    const offset = (filter.page - 1) * filter.limit;

    const countRow = this.db
      .prepare(`SELECT COUNT(*) as count FROM community_poses WHERE ${where}`)
      .get(...params) as { count: number };

    const rows = this.db
      .prepare(
        `SELECT * FROM community_poses WHERE ${where}
         ORDER BY uploaded_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, filter.limit, offset) as CommunityPoseRow[];

    return {
      poses: rows.map((row) => this.toRecord(row)),
      total: countRow.count,
    };
  }

  incrementDownload(id: string): void {
    this.db
      .prepare(
        `UPDATE community_poses SET download_count = download_count + 1 WHERE id = ?`
      )
      .run(id);
  }

  private toRecord(row: CommunityPoseRow): CommunityPoseRecord {
    return {
      id: row.id,
      name: row.name,
      imagePath: row.image_path,
      thumbnailPath: row.thumbnail_path,
      tags: JSON.parse(row.tags) as string[],
      difficulty: row.difficulty,
      description: row.description,
      bodyParts: JSON.parse(row.body_parts) as string[],
      status: row.status,
      uploadedAt: row.uploaded_at,
      downloadCount: row.download_count,
    };
  }
}
```

- [ ] **Step 4: Chạy test — xác nhận GREEN**

```bash
cd services/pose-extract-server && npm test -- src/db/communityStore.test.ts
```

Expected: tất cả tests pass.

- [ ] **Step 5: Commit**

```bash
git add services/pose-extract-server/src/db/communityStore.ts services/pose-extract-server/src/db/communityStore.test.ts
git commit -m "feat(community): add CommunityStore CRUD layer"
```

---

## Task 3: Env config — thêm COMMUNITY_UPLOAD_DIR

**Files:**
- Modify: `services/pose-extract-server/src/config/env.ts`
- Modify: `services/pose-extract-server/src/config/env.test.ts`

- [ ] **Step 1: Viết failing test**

Mở `services/pose-extract-server/src/config/env.test.ts`, thêm test case:

```typescript
it("parses COMMUNITY_UPLOAD_DIR", () => {
  resetEnvCache();
  const env = getEnv({
    DATABASE_PATH: "/tmp/test.db",
    ADMIN_SECRET: "secret",
    COMMUNITY_UPLOAD_DIR: "/tmp/community",
  });

  expect(env.COMMUNITY_UPLOAD_DIR).toBe("/tmp/community");
  resetEnvCache();
});

it("defaults COMMUNITY_UPLOAD_DIR to data/community", () => {
  resetEnvCache();
  const env = getEnv({
    DATABASE_PATH: "/tmp/test.db",
    ADMIN_SECRET: "secret",
  });

  expect(env.COMMUNITY_UPLOAD_DIR).toBe("data/community");
  resetEnvCache();
});
```

- [ ] **Step 2: Chạy test — xác nhận RED**

```bash
cd services/pose-extract-server && npm test -- src/config/env.test.ts
```

Expected: FAIL vì `COMMUNITY_UPLOAD_DIR` chưa có trong schema.

- [ ] **Step 3: Thêm vào env schema**

Trong `services/pose-extract-server/src/config/env.ts`, thêm field vào `envSchema`:

```typescript
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_PATH: z.string().min(1),
  ADMIN_SECRET: z.string().min(1),
  COMMUNITY_UPLOAD_DIR: z.string().min(1).default("data/community"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10)
});
```

Và cập nhật phần parse trong `getEnv`:

```typescript
const parsed = envSchema.safeParse({
  NODE_ENV: overrides?.NODE_ENV ?? process.env.NODE_ENV,
  PORT: overrides?.PORT ?? process.env.PORT,
  DATABASE_PATH: overrides?.DATABASE_PATH ?? process.env.DATABASE_PATH,
  ADMIN_SECRET: overrides?.ADMIN_SECRET ?? process.env.ADMIN_SECRET,
  COMMUNITY_UPLOAD_DIR: overrides?.COMMUNITY_UPLOAD_DIR ?? process.env.COMMUNITY_UPLOAD_DIR,
  RATE_LIMIT_WINDOW_MS: overrides?.RATE_LIMIT_WINDOW_MS ?? process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX: overrides?.RATE_LIMIT_MAX ?? process.env.RATE_LIMIT_MAX,
});
```

- [ ] **Step 4: Chạy test — xác nhận GREEN**

```bash
cd services/pose-extract-server && npm test -- src/config/env.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add services/pose-extract-server/src/config/env.ts services/pose-extract-server/src/config/env.test.ts
git commit -m "feat(community): add COMMUNITY_UPLOAD_DIR env config"
```

---

## Task 4: Admin upload route (POST /api/admin/community/poses)

**Files:**
- Create: `services/pose-extract-server/src/routes/adminCommunityRoutes.ts`
- Create: `services/pose-extract-server/src/routes/adminCommunityRoutes.test.ts`

- [ ] **Step 1: Viết failing tests**

Tạo `services/pose-extract-server/src/routes/adminCommunityRoutes.test.ts`:

```typescript
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { createApp } from "../app";
import { createDatabase } from "../db/connection";
import { CommunityStore } from "../db/communityStore";
import { KeyStore } from "../services/keyStore";

const tempDirs: string[] = [];
const ADMIN_SECRET = "test-admin-secret";

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

function createTestApp() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pose-admin-community-"));
  tempDirs.push(tempDir);
  const uploadDir = path.join(tempDir, "community");
  const db = createDatabase(path.join(tempDir, "test.db"));
  const keyStore = new KeyStore(db);
  const communityStore = new CommunityStore(db);
  const app = createApp({
    version: "1.0.0-test",
    adminSecret: ADMIN_SECRET,
    keyStore,
    communityStore,
    communityUploadDir: uploadDir,
  });
  return { app, communityStore, uploadDir };
}

describe("POST /api/admin/community/poses", () => {
  it("rejects request without auth", async () => {
    const { app } = createTestApp();

    const res = await request(app)
      .post("/api/admin/community/poses")
      .field("name", "Test Pose");

    expect(res.status).toBe(401);
  });

  it("rejects request without image", async () => {
    const { app } = createTestApp();

    const res = await request(app)
      .post("/api/admin/community/poses")
      .set("Authorization", `Bearer ${ADMIN_SECRET}`)
      .field("name", "Test Pose")
      .field("tags", JSON.stringify(["standing"]))
      .field("difficulty", "beginner")
      .field("bodyParts", JSON.stringify(["legs"]))
      .field("status", "draft");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  it("rejects request without name", async () => {
    const { app } = createTestApp();

    const imageBuffer = Buffer.from("fake-image-data");

    const res = await request(app)
      .post("/api/admin/community/poses")
      .set("Authorization", `Bearer ${ADMIN_SECRET}`)
      .attach("image", imageBuffer, { filename: "pose.png", contentType: "image/png" })
      .field("tags", JSON.stringify(["standing"]))
      .field("difficulty", "beginner")
      .field("bodyParts", JSON.stringify(["legs"]))
      .field("status", "draft");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  it("creates pose and saves image file", async () => {
    const { app, uploadDir } = createTestApp();

    const imageBuffer = Buffer.from("fake-image-data");

    const res = await request(app)
      .post("/api/admin/community/poses")
      .set("Authorization", `Bearer ${ADMIN_SECRET}`)
      .attach("image", imageBuffer, { filename: "warrior2.png", contentType: "image/png" })
      .field("name", "Warrior II")
      .field("tags", JSON.stringify(["standing", "balance"]))
      .field("difficulty", "intermediate")
      .field("description", "Classic yoga pose")
      .field("bodyParts", JSON.stringify(["legs", "arms"]))
      .field("status", "draft");

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Warrior II");
    expect(res.body.data.tags).toEqual(["standing", "balance"]);
    expect(res.body.data.status).toBe("draft");
    expect(res.body.data.downloadCount).toBe(0);

    // File phải tồn tại trên disk
    const savedPath = path.join(uploadDir, path.basename(res.body.data.imagePath));
    expect(fs.existsSync(savedPath)).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy test — xác nhận RED**

```bash
cd services/pose-extract-server && npm test -- src/routes/adminCommunityRoutes.test.ts
```

Expected: FAIL vì route chưa tồn tại.

- [ ] **Step 3: Implement adminCommunityRoutes**

Tạo `services/pose-extract-server/src/routes/adminCommunityRoutes.ts`:

```typescript
import fs from "node:fs";
import path from "node:path";

import { Router } from "express";
import multer from "multer";
import { z } from "zod";

import { createAdminAuthMiddleware } from "../middleware/adminAuth";
import type { CommunityStore } from "../db/communityStore";

const metadataSchema = z.object({
  name: z.string().trim().min(1),
  tags: z.string().transform((val) => JSON.parse(val) as string[]).pipe(z.array(z.string())),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).nullable().optional(),
  description: z.string().optional().nullable(),
  bodyParts: z.string().transform((val) => JSON.parse(val) as string[]).pipe(z.array(z.string())),
  status: z.enum(["draft", "published"]).default("draft"),
});

export interface CreateAdminCommunityRoutesOptions {
  adminSecret: string;
  communityStore: CommunityStore;
  uploadDir: string;
}

export function createAdminCommunityRoutes(options: CreateAdminCommunityRoutesOptions): Router {
  const { adminSecret, communityStore, uploadDir } = options;

  fs.mkdirSync(uploadDir, { recursive: true });

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadDir),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || ".png";
        const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        cb(null, uniqueName);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files allowed"));
      }
    },
  });

  const auth = createAdminAuthMiddleware(adminSecret);
  const router = Router();

  router.post("/", auth, upload.single("image"), (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "image file is required" } });
      return;
    }

    const parsed = metadataSchema.safeParse(req.body);
    if (!parsed.success) {
      // Cleanup uploaded file on validation error
      fs.unlink(req.file.path, () => {});
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      res.status(400).json({ error: { code: "BAD_REQUEST", message: messages } });
      return;
    }

    const { name, tags, difficulty, description, bodyParts, status } = parsed.data;
    const relativePath = `community/${path.basename(req.file.path)}`;

    const pose = communityStore.createPose({
      name,
      imagePath: relativePath,
      thumbnailPath: null,
      tags,
      difficulty: difficulty ?? null,
      description: description ?? null,
      bodyParts,
      status,
    });

    res.status(201).json({ data: pose });
  });

  return router;
}
```

- [ ] **Step 4: Chạy test — xác nhận GREEN**

```bash
cd services/pose-extract-server && npm test -- src/routes/adminCommunityRoutes.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add services/pose-extract-server/src/routes/adminCommunityRoutes.ts services/pose-extract-server/src/routes/adminCommunityRoutes.test.ts
git commit -m "feat(community): add admin upload route POST /api/admin/community/poses"
```

---

## Task 5: Public routes (GET /api/community/poses, GET /api/community/poses/:id)

**Files:**
- Create: `services/pose-extract-server/src/routes/communityRoutes.ts`
- Create: `services/pose-extract-server/src/routes/communityRoutes.test.ts`

- [ ] **Step 1: Viết failing tests**

Tạo `services/pose-extract-server/src/routes/communityRoutes.test.ts`:

```typescript
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { createApp } from "../app";
import { createDatabase } from "../db/connection";
import { CommunityStore } from "../db/communityStore";
import { KeyStore } from "../services/keyStore";

const tempDirs: string[] = [];

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

function createTestApp() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pose-community-routes-"));
  tempDirs.push(tempDir);
  const db = createDatabase(path.join(tempDir, "test.db"));
  const keyStore = new KeyStore(db);
  const communityStore = new CommunityStore(db);
  const app = createApp({
    version: "1.0.0-test",
    adminSecret: "secret",
    keyStore,
    communityStore,
    communityUploadDir: path.join(tempDir, "community"),
  });
  return { app, communityStore };
}

function seedPose(store: CommunityStore, overrides: Partial<Parameters<CommunityStore["createPose"]>[0]> = {}) {
  return store.createPose({
    name: "Test Pose",
    imagePath: "community/test.png",
    thumbnailPath: null,
    tags: ["standing"],
    difficulty: "beginner",
    description: "A test pose",
    bodyParts: ["legs"],
    status: "published",
    ...overrides,
  });
}

describe("GET /api/community/poses", () => {
  it("returns empty list when no poses", async () => {
    const { app } = createTestApp();

    const res = await request(app).get("/api/community/poses");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });

  it("returns only published poses", async () => {
    const { app, communityStore } = createTestApp();
    seedPose(communityStore, { status: "published", name: "Published" });
    seedPose(communityStore, { status: "draft", name: "Draft" });

    const res = await request(app).get("/api/community/poses");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Published");
  });

  it("filters by difficulty query param", async () => {
    const { app, communityStore } = createTestApp();
    seedPose(communityStore, { difficulty: "beginner", name: "Easy" });
    seedPose(communityStore, { difficulty: "advanced", name: "Hard" });

    const res = await request(app).get("/api/community/poses?difficulty=beginner");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Easy");
  });

  it("filters by tag query param", async () => {
    const { app, communityStore } = createTestApp();
    seedPose(communityStore, { tags: ["balance"], name: "Balance" });
    seedPose(communityStore, { tags: ["core"], name: "Core" });

    const res = await request(app).get("/api/community/poses?tag=balance");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Balance");
  });

  it("paginates with page and limit params", async () => {
    const { app, communityStore } = createTestApp();
    for (let i = 0; i < 5; i++) {
      seedPose(communityStore, { name: `Pose ${i}` });
    }

    const res = await request(app).get("/api/community/poses?page=1&limit=3");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(3);
  });

  it("rejects invalid difficulty param", async () => {
    const { app } = createTestApp();

    const res = await request(app).get("/api/community/poses?difficulty=extreme");

    expect(res.status).toBe(400);
  });
});

describe("GET /api/community/poses/:id", () => {
  it("returns 404 for unknown id", async () => {
    const { app } = createTestApp();

    const res = await request(app).get("/api/community/poses/nonexistent");

    expect(res.status).toBe(404);
  });

  it("returns pose and increments download count", async () => {
    const { app, communityStore } = createTestApp();
    const pose = seedPose(communityStore);

    const res1 = await request(app).get(`/api/community/poses/${pose.id}`);
    expect(res1.status).toBe(200);
    expect(res1.body.data.id).toBe(pose.id);
    expect(res1.body.data.downloadCount).toBe(1);

    const res2 = await request(app).get(`/api/community/poses/${pose.id}`);
    expect(res2.body.data.downloadCount).toBe(2);
  });

  it("returns 404 for draft poses", async () => {
    const { app, communityStore } = createTestApp();
    const draft = seedPose(communityStore, { status: "draft" });

    const res = await request(app).get(`/api/community/poses/${draft.id}`);

    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Chạy test — xác nhận RED**

```bash
cd services/pose-extract-server && npm test -- src/routes/communityRoutes.test.ts
```

- [ ] **Step 3: Implement communityRoutes**

Tạo `services/pose-extract-server/src/routes/communityRoutes.ts`:

```typescript
import { Router } from "express";
import { z } from "zod";

import type { CommunityStore } from "../db/communityStore";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  tag: z.string().optional(),
});

export function createCommunityRoutes(communityStore: CommunityStore): Router {
  const router = Router();

  router.get("/", (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      res.status(400).json({ error: { code: "BAD_REQUEST", message: messages } });
      return;
    }

    const { page, limit, difficulty, tag } = parsed.data;
    const { poses, total } = communityStore.listPoses({
      status: "published",
      difficulty,
      tag,
      page,
      limit,
    });

    res.json({
      data: poses,
      pagination: { page, limit, total },
    });
  });

  router.get("/:id", (req, res) => {
    const pose = communityStore.getPoseById(req.params.id);

    if (!pose || pose.status !== "published") {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Pose not found" } });
      return;
    }

    communityStore.incrementDownload(pose.id);
    const updated = communityStore.getPoseById(pose.id)!;

    res.json({ data: updated });
  });

  return router;
}
```

- [ ] **Step 4: Chạy test — xác nhận GREEN**

```bash
cd services/pose-extract-server && npm test -- src/routes/communityRoutes.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add services/pose-extract-server/src/routes/communityRoutes.ts services/pose-extract-server/src/routes/communityRoutes.test.ts
git commit -m "feat(community): add public community routes GET /api/community/poses"
```

---

## Task 6: Wire routes vào app.ts và index.ts

**Files:**
- Modify: `services/pose-extract-server/src/app.ts`
- Modify: `services/pose-extract-server/src/index.ts`

- [ ] **Step 1: Cập nhật CreateAppOptions trong app.ts**

Mở `services/pose-extract-server/src/app.ts`. Thêm imports và cập nhật interface:

```typescript
// Thêm imports (cùng chỗ với các imports hiện có)
import path from "node:path";
import fs from "node:fs";
import { createCommunityRoutes } from "./routes/communityRoutes";
import { createAdminCommunityRoutes } from "./routes/adminCommunityRoutes";
import type { CommunityStore } from "./db/communityStore";
```

Cập nhật `CreateAppOptions` interface (thêm 2 fields mới):

```typescript
interface CreateAppOptions {
  version: string;
  startedAtMs?: number;
  adminSecret?: string;
  keyStore?: KeyStore;
  keyPoolManager?: KeyPoolManager;
  geminiService?: GeminiServiceLike;
  communityStore?: CommunityStore;       // thêm
  communityUploadDir?: string;           // thêm
  adminRateLimitWindowMs?: number;
  adminRateLimitMaxRequests?: number;
  extractRateLimitWindowMs?: number;
  extractRateLimitMaxRequests?: number;
}
```

Thêm route wiring trong `createApp`, sau phần admin routes hiện có:

```typescript
  // Community public routes
  if (options.communityStore) {
    app.use("/api/community/poses", createCommunityRoutes(options.communityStore));
  }

  // Admin community routes
  if (options.adminSecret && options.communityStore && options.communityUploadDir) {
    app.use(
      "/api/admin/community/poses",
      createAdminCommunityRoutes({
        adminSecret: options.adminSecret,
        communityStore: options.communityStore,
        uploadDir: options.communityUploadDir,
      })
    );
  }

  // Serve uploaded community images as static files
  if (options.communityUploadDir) {
    const uploadDir = options.communityUploadDir;
    fs.mkdirSync(uploadDir, { recursive: true });
    app.use("/community", express.static(uploadDir));
  }
```

- [ ] **Step 2: Cập nhật index.ts**

Mở `services/pose-extract-server/src/index.ts`. Thêm import và wire `CommunityStore`:

```typescript
import { createDatabase } from "./db/connection";
import { CommunityStore } from "./db/communityStore";   // thêm dòng này
import { GeminiService } from "./services/geminiService";
import { KeyPoolManager } from "./services/keyPoolManager";
import { KeyStore } from "./services/keyStore";
import { logger } from "./utils/logger";

const env = getEnv();
const db = createDatabase(env.DATABASE_PATH);
const keyStore = new KeyStore(db);
const communityStore = new CommunityStore(db);           // thêm dòng này
const keyPoolManager = new KeyPoolManager(keyStore);
const geminiService = new GeminiService();
const appVersion = process.env.APP_VERSION ?? process.env.npm_package_version ?? "1.0.0";
const app = createApp({
  version: appVersion,
  adminSecret: env.ADMIN_SECRET,
  keyStore,
  communityStore,                                        // thêm
  communityUploadDir: env.COMMUNITY_UPLOAD_DIR,          // thêm
  keyPoolManager,
  geminiService,
  extractRateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
  extractRateLimitMaxRequests: env.RATE_LIMIT_MAX
});
```

- [ ] **Step 3: Chạy toàn bộ test suite**

```bash
cd services/pose-extract-server && npm test
```

Expected: tất cả 38 tests cũ + tests mới pass. Không có regression.

- [ ] **Step 4: Commit**

```bash
git add services/pose-extract-server/src/app.ts services/pose-extract-server/src/index.ts
git commit -m "feat(community): wire community routes and static file serving into app"
```

---

## Task 7: Next.js — Admin upload page

**Files:**
- Create: `src/app/admin/community/page.js`

- [ ] **Step 1: Tạo admin community upload page**

Tạo `src/app/admin/community/page.js`:

```javascript
'use client';

import { useCallback, useState } from 'react';
import { ChevronLeft, Upload, CheckCircle } from 'lucide-react';
import NavButton from '@/components/NavButton';
import ActionButton from '@/components/ActionButton';

const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'];
const STATUS_OPTIONS = ['draft', 'published'];

const SERVER_URL = process.env.NEXT_PUBLIC_POSE_SERVER_URL ?? 'http://localhost:3000';
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? '';

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload?.error?.message ?? payload?.message ?? `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

export default function AdminCommunityPage() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [form, setForm] = useState({
    name: '',
    tags: '',
    difficulty: 'beginner',
    description: '',
    bodyParts: '',
    status: 'draft',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    if (!form.name) {
      setForm((prev) => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, '') }));
    }
  }, [form.name]);

  const handleSubmit = useCallback(async () => {
    if (!imageFile) {
      setError('Please select an image file');
      return;
    }
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess(null);

    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const bodyParts = form.bodyParts
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);

      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('name', form.name.trim());
      formData.append('tags', JSON.stringify(tags));
      formData.append('difficulty', form.difficulty);
      formData.append('description', form.description.trim());
      formData.append('bodyParts', JSON.stringify(bodyParts));
      formData.append('status', form.status);

      const response = await fetch(`${SERVER_URL}/api/admin/community/poses`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
        body: formData,
      });

      const result = await parseResponse(response);
      setSuccess(result.data);
      setImageFile(null);
      setImagePreview(null);
      setForm({ name: '', tags: '', difficulty: 'beginner', description: '', bodyParts: '', status: 'draft' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [imageFile, form]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <NavButton href="/admin/keys" icon={ChevronLeft} label="Back" />
          <h1 className="text-xl font-semibold">Upload Community Pose</h1>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-900/40 border border-green-700 px-4 py-3 text-sm text-green-300 flex items-center gap-2">
            <CheckCircle size={16} />
            <span>Uploaded: <strong>{success.name}</strong> (ID: {success.id})</span>
          </div>
        )}

        {/* Image upload */}
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-1">Image *</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:text-white hover:file:bg-zinc-700"
          />
          {imagePreview && (
            <img src={imagePreview} alt="preview" className="mt-2 h-32 object-contain rounded-lg bg-zinc-900" />
          )}
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-1">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Warrior II"
            className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Tags */}
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
            placeholder="standing, balance, yoga"
            className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Difficulty */}
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-1">Difficulty</label>
          <select
            value={form.difficulty}
            onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}
            className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500"
          >
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Body Parts */}
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-1">Body Parts (comma-separated)</label>
          <input
            type="text"
            value={form.bodyParts}
            onChange={(e) => setForm((p) => ({ ...p, bodyParts: e.target.value }))}
            placeholder="legs, arms, core"
            className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
            placeholder="Describe this pose..."
            className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          />
        </div>

        {/* Status */}
        <div className="mb-6">
          <label className="block text-sm text-zinc-400 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <ActionButton
          onClick={handleSubmit}
          disabled={submitting || !imageFile}
          icon={Upload}
          label={submitting ? 'Uploading…' : 'Upload Pose'}
          variant="primary"
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Kiểm tra Next.js build không lỗi**

```bash
cd /path/to/ai-pose && npm run build 2>&1 | tail -20
```

Expected: build thành công, không có errors (chỉ warnings là OK).

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/community/page.js
git commit -m "feat(community): add admin community upload page"
```

---

## Task 8: Next.js — Public community browse page

**Files:**
- Create: `src/app/community/page.js`

- [ ] **Step 1: Tạo community browse page**

Tạo `src/app/community/page.js`:

```javascript
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Filter } from 'lucide-react';
import NavButton from '@/components/NavButton';

const SERVER_URL = process.env.NEXT_PUBLIC_POSE_SERVER_URL ?? 'http://localhost:3000';

const DIFFICULTY_OPTIONS = ['', 'beginner', 'intermediate', 'advanced'];
const DIFFICULTY_LABELS = { '': 'All levels', beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

async function fetchPoses({ page = 1, limit = 20, difficulty = '', tag = '' } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (difficulty) params.set('difficulty', difficulty);
  if (tag) params.set('tag', tag);

  const res = await fetch(`${SERVER_URL}/api/community/poses?${params}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch poses (${res.status})`);
  return res.json();
}

export default function CommunityPage() {
  const [poses, setPoses] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tag, setTag] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchPoses({ page, limit: 20, difficulty, tag });
      setPoses(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [difficulty, tag]);

  useEffect(() => { load(1); }, [load]);

  const handleTagSearch = useCallback((e) => {
    e.preventDefault();
    setTag(tagInput.trim());
  }, [tagInput]);

  const handleDownload = useCallback(async (pose) => {
    const imageUrl = `${SERVER_URL}/${pose.imagePath}`;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `${pose.name}.png`;
    a.click();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <NavButton href="/" icon={null} label="←" />
          <h1 className="text-xl font-semibold">Community Poses</h1>
          <span className="ml-auto text-sm text-zinc-500">{pagination.total} poses</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500"
          >
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
            ))}
          </select>

          <form onSubmit={handleTagSearch} className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Filter by tag…"
              className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-zinc-700 px-3 py-2 text-sm hover:bg-zinc-600 transition-colors"
            >
              <Filter size={16} />
            </button>
            {tag && (
              <button
                type="button"
                onClick={() => { setTag(''); setTagInput(''); }}
                className="rounded-lg bg-zinc-700 px-3 py-2 text-sm hover:bg-zinc-600 transition-colors text-zinc-400"
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-zinc-500 py-20">Loading…</div>
        ) : poses.length === 0 ? (
          <div className="text-center text-zinc-500 py-20">No poses found.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {poses.map((pose) => (
              <div key={pose.id} className="bg-zinc-900 rounded-xl overflow-hidden group relative">
                <div className="aspect-square bg-zinc-800">
                  <img
                    src={`${SERVER_URL}/${pose.imagePath}`}
                    alt={pose.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{pose.name}</p>
                  {pose.difficulty && (
                    <p className="text-xs text-zinc-500 capitalize mt-0.5">{pose.difficulty}</p>
                  )}
                  {pose.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {pose.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-xs bg-zinc-800 text-zinc-400 rounded px-1.5 py-0.5">{t}</span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => handleDownload(pose)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-violet-700 hover:bg-violet-600 text-white text-xs py-1.5 transition-colors"
                  >
                    <Download size={12} />
                    {pose.downloadCount > 0 ? `${pose.downloadCount} downloads` : 'Download'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex justify-center gap-2 mt-8">
            {pagination.page > 1 && (
              <button
                onClick={() => load(pagination.page - 1)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-sm hover:bg-zinc-700 transition-colors"
              >
                ← Prev
              </button>
            )}
            <span className="px-4 py-2 text-sm text-zinc-500">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
            </span>
            {pagination.page * pagination.limit < pagination.total && (
              <button
                onClick={() => load(pagination.page + 1)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-sm hover:bg-zinc-700 transition-colors"
              >
                Next →
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Kiểm tra Next.js build không lỗi**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/community/page.js
git commit -m "feat(community): add public community browse page"
```

---

## Task 9: Final verification

- [ ] **Step 1: Chạy toàn bộ test suite lần cuối**

```bash
cd services/pose-extract-server && npm test
```

Expected: tất cả tests pass, 0 failures.

- [ ] **Step 2: Kiểm tra TypeScript compile**

```bash
cd services/pose-extract-server && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Kiểm tra Next.js build**

```bash
npm run build
```

Expected: build success.

- [ ] **Step 4: Final commit nếu cần**

```bash
git add -A && git commit -m "chore: final cleanup community poses feature"
```

---

## Acceptance Criteria Checklist

- [ ] Admin có thể POST lên `/api/admin/community/poses` với Bearer token, file lưu vào `COMMUNITY_UPLOAD_DIR`
- [ ] GET `/api/community/poses` trả danh sách published, hỗ trợ `?difficulty=`, `?tag=`, `?page=`, `?limit=`
- [ ] GET `/api/community/poses/:id` trả full data + tăng `downloadCount` mỗi lần gọi
- [ ] Draft pose không xuất hiện ở public list và trả 404 khi truy cập trực tiếp
- [ ] Next.js admin page `/admin/community` upload được pose mới
- [ ] Next.js community page `/community` browse và filter được poses
- [ ] Tất cả unit + integration tests pass
- [ ] TypeScript compile 0 errors
