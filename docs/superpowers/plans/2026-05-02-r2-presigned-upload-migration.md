# R2 Presigned Upload Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `pose-extract-server` from local file uploads to Cloudflare R2 presigned POST upload flow and verify full Railway production E2E behavior.

**Architecture:** Admin client requests a short-lived presigned POST payload from backend (`/upload-url`), uploads image directly to R2, then submits metadata + `fileKey` to backend for DB persistence. Backend validates file existence in R2 before save and stores `imagePath` as full public R2 URL. Existing local-path records are migrated by script; orphan objects are detected by cleanup script.

**Tech Stack:** Node.js, Express, TypeScript, better-sqlite3, Cloudflare R2 (S3-compatible signing), Railway deployment.

---

## File structure and responsibilities

- `services/pose-extract-server/src/config/env.ts` — define and validate required R2 env vars.
- `services/pose-extract-server/src/services/r2Storage.ts` (create) — generate presigned POST, check object existence, build public URL.
- `services/pose-extract-server/src/routes/adminCommunityRoutes.ts` — replace multipart upload path with JSON `fileKey` flow and add `/upload-url` endpoint.
- `services/pose-extract-server/src/routes/adminCommunityRoutes.test.ts` — cover happy path and required negative cases.
- `services/pose-extract-server/src/app.ts` — wire route dependencies.
- `services/pose-extract-server/scripts/migrate-imagepath-to-r2.ts` — migrate old relative image paths to full R2 URLs.
- `services/pose-extract-server/scripts/cleanup-r2-orphans.ts` — dry-run orphan report for objects not referenced by DB.
- `services/pose-extract-server/railway.toml` — confirm deploy healthcheck/start/mount requirements.

### Task 1: Add R2 env contract

**Files:**
- Modify: `services/pose-extract-server/src/config/env.ts`
- Modify: `services/pose-extract-server/src/config/env.test.ts`

- [ ] **Step 1: Write failing env tests for required R2 variables**
```ts
it("throws when R2 vars are missing", () => {
  expect(() => getEnv({
    NODE_ENV: "production",
    PORT: "3000",
    DATABASE_PATH: "/app/data/prod.db",
    ADMIN_SECRET: "x"
  })).toThrow(/R2_ACCOUNT_ID/);
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test -- src/config/env.test.ts`
Expected: FAIL due to missing R2 env validation.

- [ ] **Step 3: Implement env schema updates**
```ts
R2_ACCOUNT_ID: z.string().min(1),
R2_ACCESS_KEY_ID: z.string().min(1),
R2_SECRET_ACCESS_KEY: z.string().min(1),
R2_BUCKET: z.string().min(1),
R2_PUBLIC_URL: z.string().url()
```

- [ ] **Step 4: Run env tests**
Run: `npm test -- src/config/env.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/config/env.ts src/config/env.test.ts
git commit -m "feat(env): require R2 configuration for community uploads"
```

### Task 2: Implement R2 storage service

**Files:**
- Create: `services/pose-extract-server/src/services/r2Storage.ts`
- Create: `services/pose-extract-server/src/services/r2Storage.test.ts`

- [ ] **Step 1: Write failing tests for presigned payload + URL building + existence check contract**
```ts
it("builds public URL from fileKey", () => {
  expect(buildPublicUrl("https://cdn.example.com", "community/a.png"))
    .toBe("https://cdn.example.com/community/a.png");
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test -- src/services/r2Storage.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement minimal R2 service**
```ts
export interface UploadUrlPayload { uploadUrl: string; fileKey: string; fields: Record<string, string>; }
export async function createUploadUrl(input: { fileName: string; mimeType: string }): Promise<UploadUrlPayload> { /* sign POST */ }
export async function objectExists(fileKey: string): Promise<boolean> { /* head object */ }
export function buildPublicUrl(base: string, fileKey: string): string { /* normalize */ }
```

- [ ] **Step 4: Run tests**
Run: `npm test -- src/services/r2Storage.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/services/r2Storage.ts src/services/r2Storage.test.ts
git commit -m "feat(storage): add R2 presigned post and object validation service"
```

### Task 3: Replace admin upload API with 3-step flow

**Files:**
- Modify: `services/pose-extract-server/src/routes/adminCommunityRoutes.ts`
- Modify: `services/pose-extract-server/src/routes/adminCommunityRoutes.test.ts`
- Modify: `services/pose-extract-server/src/app.ts`

- [ ] **Step 1: Write failing route tests for new contracts**
```ts
it("POST /api/admin/community/poses/upload-url returns upload payload", async () => {
  const res = await request(app)
    .post("/api/admin/community/poses/upload-url")
    .set("Authorization", `Bearer ${ADMIN_SECRET}`)
    .send({ fileName: "pose.png", mimeType: "image/png" });
  expect(res.status).toBe(200);
  expect(res.body.data).toHaveProperty("uploadUrl");
});

it("returns 400 for invalid mimeType", async () => {
  const res = await request(app)
    .post("/api/admin/community/poses/upload-url")
    .set("Authorization", `Bearer ${ADMIN_SECRET}`)
    .send({ fileName: "pose.txt", mimeType: "text/plain" });
  expect(res.status).toBe(400);
});

it("returns 409 when fileKey does not exist", async () => {
  const res = await request(app)
    .post("/api/admin/community/poses")
    .set("Authorization", `Bearer ${ADMIN_SECRET}`)
    .send({ name: "Pose", fileKey: "community/missing.png", status: "published" });
  expect(res.status).toBe(409);
});
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `npm test -- src/routes/adminCommunityRoutes.test.ts`
Expected: FAIL due to missing route/validation logic.

- [ ] **Step 3: Implement new routes**
```ts
router.post("/upload-url", auth, async (req, res) => { /* validate mime, return uploadUrl+fileKey+fields */ });
router.post("/", auth, async (req, res) => {
  // parse metadata + fileKey
  // if !objectExists(fileKey) => 409
  // imagePath = buildPublicUrl(env.R2_PUBLIC_URL, fileKey)
  // save to DB
});
```

- [ ] **Step 4: Run route tests**
Run: `npm test -- src/routes/adminCommunityRoutes.test.ts`
Expected: PASS with 401/400/409 cases validated.

- [ ] **Step 5: Commit**
```bash
git add src/routes/adminCommunityRoutes.ts src/routes/adminCommunityRoutes.test.ts src/app.ts
git commit -m "feat(routes): switch admin community upload to R2 presigned flow"
```

### Task 4: Add migration and orphan cleanup scripts

**Files:**
- Create/Modify: `services/pose-extract-server/scripts/migrate-imagepath-to-r2.ts`
- Create/Modify: `services/pose-extract-server/scripts/cleanup-r2-orphans.ts`

- [ ] **Step 1: Write failing script-level tests or dry-run assertions**
```bash
node scripts/migrate-imagepath-to-r2.ts --dry-run
node scripts/cleanup-r2-orphans.ts --dry-run
```
Expected: current scripts missing or incomplete behavior.

- [ ] **Step 2: Implement migration script**
```ts
// select rows where imagePath not startsWith(R2_PUBLIC_URL)
// convert relative paths to `${R2_PUBLIC_URL}/${normalizedKey}`
// support --dry-run and real apply
```

- [ ] **Step 3: Implement orphan cleanup dry-run script**
```ts
// list objects in R2 prefix
// compare against DB imagePath-derived keys
// print orphan candidates, no delete in --dry-run
```

- [ ] **Step 4: Run scripts in dry-run mode**
Run:
- `node scripts/migrate-imagepath-to-r2.ts --dry-run`
- `node scripts/cleanup-r2-orphans.ts --dry-run`
Expected: both succeed and print summary.

- [ ] **Step 5: Commit**
```bash
git add scripts/migrate-imagepath-to-r2.ts scripts/cleanup-r2-orphans.ts
git commit -m "feat(scripts): add migration and orphan audit for R2 image paths"
```

### Task 5: Railway config + deploy validation

**Files:**
- Modify (if needed): `services/pose-extract-server/railway.toml`
- Modify (if needed): `services/pose-extract-server/README.md`

- [ ] **Step 1: Add/confirm deploy contract**
```toml
[deploy]
healthcheckPath = "/api/health"
startCommand = "node dist/index.js"

[[mounts]]
source = "data"
destination = "/app/data"
```

- [ ] **Step 2: Deploy using service-root archive**
Run:
`railway up services/pose-extract-server --path-as-root --service pose-extract-server --environment production --ci`
Expected: deployment `SUCCESS`.

- [ ] **Step 3: Verify health endpoint**
Run: `curl -sS https://pose-extract-server-production.up.railway.app/api/health`
Expected: `{"status":"ok"...}`.

- [ ] **Step 4: Commit docs/config changes (if any)**
```bash
git add railway.toml README.md
git commit -m "chore(deploy): align Railway config for pose-extract-server"
```

### Task 6: Full E2E + negative-case verification checklist

**Files:**
- Create: `services/pose-extract-server/VERIFICATION_CHECKLIST.md` (if user wants persisted checklist)

- [ ] **Step 1: Positive flow — get upload URL**
Run:
`curl -X POST /api/admin/community/poses/upload-url -H "Authorization: Bearer ..." -d '{"fileName":"pose.png","mimeType":"image/png"}'`
Expected: 200 + `uploadUrl` + `fileKey` + `fields`.

- [ ] **Step 2: Positive flow — direct upload to R2**
Run multipart POST to returned `uploadUrl` with returned `fields` + `file`.
Expected: 204/201 from R2.

- [ ] **Step 3: Positive flow — metadata save**
Run:
`POST /api/admin/community/poses` with JSON including `fileKey`.
Expected: 201 and `imagePath` full R2 URL.

- [ ] **Step 4: Positive flow — public read**
Run:
`GET /api/community/poses`
Expected: record exists, `imagePath` is full URL and opens directly.

- [ ] **Step 5: Negative case — no auth**
Run admin requests without auth.
Expected: 401.

- [ ] **Step 6: Negative case — invalid mimeType**
Run upload-url with `text/plain`.
Expected: 400.

- [ ] **Step 7: Negative case — nonexistent fileKey**
Run metadata submit with missing key.
Expected: 409.

- [ ] **Step 8: Data hygiene scripts**
Run:
- `node scripts/migrate-imagepath-to-r2.ts --dry-run`
- `node scripts/cleanup-r2-orphans.ts --dry-run`
Expected: both complete successfully.

- [ ] **Step 9: Final verification command bundle**
Run: `npm test && npm run build`
Expected: all pass.

- [ ] **Step 10: Commit verification artifact (if created)**
```bash
git add VERIFICATION_CHECKLIST.md
git commit -m "docs: record R2 migration verification evidence"
```

## Self-review

- Spec coverage: All requested endpoints, auth pattern, negative cases, migration/cleanup scripts, Railway deploy checks, and E2E verification are mapped to tasks.
- Placeholder scan: No TBD/TODO placeholders remain; each task includes explicit commands/code snippets.
- Type consistency: `fileKey`, `uploadUrl`, `fields`, `R2_PUBLIC_URL`, and HTTP status expectations are consistent across tasks.
