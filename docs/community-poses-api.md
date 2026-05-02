# Community Poses API

**Production base URL:** `https://pose-extract-server-production.up.railway.app`  
**Local dev base URL:** `http://localhost:3001`

> `imagePath` is always a **full URL** (e.g. `https://pub-fa04b9ec834d4ae9b1e7fc9a8ab0eea7.r2.dev/community/abc.png`).  
> Use it directly as `<img src={pose.imagePath} />` — no prefix needed.

---

## Data Types

```ts
interface CommunityPose {
  id: string;               // UUID
  name: string;
  imagePath: string;        // Full URL — use directly as <img src>
  thumbnailPath: string | null;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  description: string | null;
  bodyParts: string[];
  status: "draft" | "published";
  uploadedAt: string;       // ISO 8601, e.g. "2026-04-21T10:00:00.000Z"
  downloadCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}
```

---

## Public Endpoints (no auth required)

### GET /api/community/poses — List published poses

**Query params**

| Param        | Type                                                   | Default | Description           |
|--------------|--------------------------------------------------------|---------|-----------------------|
| `page`       | number                                                 | `1`     | Page number           |
| `limit`      | number (max 100)                                       | `20`    | Items per page        |
| `difficulty` | `"beginner"` \| `"intermediate"` \| `"advanced"`       | —       | Filter by difficulty  |
| `tag`        | string                                                 | —       | Filter by tag (exact) |

**Response `200`**

```json
{
  "data": [CommunityPose],
  "pagination": { "page": 1, "limit": 20, "total": 42 }
}
```

**Examples**

```ts
const BASE_URL = "https://pose-extract-server-production.up.railway.app";

// First page
const res = await fetch(`${BASE_URL}/api/community/poses`);
const { data, pagination } = await res.json();

// Filter by difficulty
const res = await fetch(`${BASE_URL}/api/community/poses?difficulty=beginner`);

// Filter by tag + paginate
const res = await fetch(`${BASE_URL}/api/community/poses?tag=yoga&page=2&limit=10`);
```

---

### GET /api/community/poses/:id — Get pose by ID

Returns a single published pose. Also increments `downloadCount`.

**Response `200`**

```json
{ "data": CommunityPose }
```

**Response `404`**

```json
{ "error": { "code": "NOT_FOUND", "message": "Pose not found" } }
```

**Example**

```ts
const res = await fetch(`${BASE_URL}/api/community/poses/${id}`);
if (!res.ok) {
  const { error } = await res.json();
  console.error(error.message); // "Pose not found"
  return;
}
const { data: pose } = await res.json();
// pose.imagePath is a full URL — use directly
<img src={pose.imagePath} alt={pose.name} />
```

---

## Admin Endpoints

All admin endpoints require:

```
Authorization: Bearer <ADMIN_SECRET>
```

Returns `401 Unauthorized` if the header is missing or wrong.

---

### POST /api/admin/community/poses/upload-url — Get presigned upload URL

Request a presigned PUT URL to upload an image directly to R2.

**Allowed MIME types:** `image/png`, `image/jpeg`, `image/webp`, `image/gif`

**Request body**

```json
{
  "fileName": "warrior-pose.png",
  "mimeType": "image/png"
}
```

**Response `200`**

```json
{
  "data": {
    "uploadUrl": "https://...",
    "fileKey": "community/<uuid>.png"
  }
}
```

**Response `400`** — invalid mimeType

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "mimeType \"image/bmp\" is not allowed. Allowed types: image/png, image/jpeg, image/webp, image/gif"
  }
}
```

---

### PUT \<uploadUrl\> — Upload file directly to R2

Upload the file **directly to R2** using the presigned URL — do NOT go through the server.

```
PUT <uploadUrl>
Content-Type: <mimeType>
Body: <binary file data>
```

- URL expires in **60 seconds**
- `Content-Type` must match the `mimeType` used to request the URL
- On success: R2 returns `200` with empty body

**Example (browser)**

```ts
const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!;
const file = fileInput.files![0];

// Step 1: Get presigned URL
const urlRes = await fetch(`${BASE_URL}/api/admin/community/poses/upload-url`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ADMIN_SECRET}`,
  },
  body: JSON.stringify({ fileName: file.name, mimeType: file.type }),
});
const { data: { uploadUrl, fileKey } } = await urlRes.json();

// Step 2: Upload directly to R2
const uploadRes = await fetch(uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": file.type },
  body: file,
});
if (!uploadRes.ok) throw new Error("R2 upload failed");

// Step 3: Save metadata (see below)
```

---

### POST /api/admin/community/poses — Save pose metadata

Call this after the file is successfully uploaded to R2.

**Request body**

```ts
{
  name: string;               // required
  fileKey: string;            // required — from upload-url response
  tags?: string[];            // default []
  difficulty?: "beginner" | "intermediate" | "advanced" | null;
  description?: string | null;
  bodyParts?: string[];       // default []
  status?: "draft" | "published"; // default "draft"
}
```

**Response `201`**

```json
{ "data": CommunityPose }
```

`imagePath` in the response is a full R2 public URL.

**Response `409`** — fileKey not found in R2 (upload step was skipped or failed)

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "File \"community/abc.png\" not found in storage. Upload the file before submitting metadata."
  }
}
```

**Example (continuing from upload above)**

```ts
const metaRes = await fetch(`${BASE_URL}/api/admin/community/poses`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ADMIN_SECRET}`,
  },
  body: JSON.stringify({
    name: "Warrior Pose",
    fileKey,
    tags: ["yoga", "balance"],
    difficulty: "intermediate",
    bodyParts: ["legs", "core"],
    status: "published",
  }),
});
const { data: pose } = await metaRes.json();
console.log(pose.imagePath); // https://pub-....r2.dev/community/<uuid>.png
```

---

### GET /api/admin/community/poses — List all poses (admin)

Returns both draft and published poses sorted by newest first.

**Query params:** `page` (default 1), `limit` (default 50, max 100)

**Response `200`**

```json
{
  "data": [CommunityPose],
  "pagination": { "page": 1, "limit": 50, "total": 10 }
}
```

---

## Full Upload Flow (TypeScript helper)

```ts
const BASE_URL = "https://pose-extract-server-production.up.railway.app";

async function uploadPose(
  file: File,
  meta: {
    name: string;
    tags?: string[];
    difficulty?: "beginner" | "intermediate" | "advanced" | null;
    description?: string;
    bodyParts?: string[];
    status?: "draft" | "published";
  },
  adminSecret: string
): Promise<CommunityPose> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminSecret}`,
  };

  // 1. Get presigned URL
  const urlRes = await fetch(`${BASE_URL}/api/admin/community/poses/upload-url`, {
    method: "POST",
    headers,
    body: JSON.stringify({ fileName: file.name, mimeType: file.type }),
  });
  if (!urlRes.ok) throw new Error(`upload-url failed: ${urlRes.status}`);
  const { data: { uploadUrl, fileKey } } = await urlRes.json();

  // 2. Upload to R2
  const r2Res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!r2Res.ok) throw new Error(`R2 upload failed: ${r2Res.status}`);

  // 3. Save metadata
  const metaRes = await fetch(`${BASE_URL}/api/admin/community/poses`, {
    method: "POST",
    headers,
    body: JSON.stringify({ fileKey, ...meta }),
  });
  if (!metaRes.ok) throw new Error(`save metadata failed: ${metaRes.status}`);
  const { data } = await metaRes.json();
  return data;
}
```

---

## Error Format

All errors follow this shape:

```json
{
  "error": {
    "code": "NOT_FOUND" | "BAD_REQUEST" | "CONFLICT" | "UNAUTHORIZED" | "INTERNAL_SERVER_ERROR",
    "message": "Human-readable message"
  }
}
```

| Code | HTTP | When |
|------|------|------|
| `UNAUTHORIZED` | 401 | Missing or wrong `Authorization` header on admin endpoints |
| `BAD_REQUEST` | 400 | Missing required field, invalid mimeType, schema validation failure |
| `CONFLICT` | 409 | `fileKey` not found in R2 when saving metadata |
| `NOT_FOUND` | 404 | Pose not found or not published |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |
