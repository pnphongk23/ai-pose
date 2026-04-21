# Community Poses API

Base URL: `NEXT_PUBLIC_POSE_SERVER_URL` (e.g. `http://localhost:3001`)

Images are served at: `{BASE_URL}/{imagePath}` (e.g. `http://localhost:3001/community/abc.png`)

---

## Data Types

```ts
interface CommunityPose {
  id: string;               // UUID
  name: string;
  imagePath: string;        // relative path, e.g. "community/abc.png"
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

## Endpoints

### GET /api/community/poses — List poses

Returns published poses only. Supports filtering and pagination.

**Query params**

| Param        | Type                                      | Default | Description           |
|--------------|-------------------------------------------|---------|-----------------------|
| `page`       | number                                    | `1`     | Page number           |
| `limit`      | number (max 100)                          | `20`    | Items per page        |
| `difficulty` | `"beginner"` \| `"intermediate"` \| `"advanced"` | —  | Filter by difficulty  |
| `tag`        | string                                    | —       | Filter by tag (exact) |

**Response `200`**

```json
{
  "data": [CommunityPose, ...],
  "pagination": { "page": 1, "limit": 20, "total": 42 }
}
```

**Examples**

```ts
// Get all poses (first page)
const res = await fetch(`${BASE_URL}/api/community/poses`);
const { data, pagination } = await res.json();

// Filter by difficulty
const res = await fetch(`${BASE_URL}/api/community/poses?difficulty=beginner`);

// Filter by tag
const res = await fetch(`${BASE_URL}/api/community/poses?tag=yoga`);

// Paginate
const res = await fetch(`${BASE_URL}/api/community/poses?page=2&limit=10`);

// Combine filters
const res = await fetch(`${BASE_URL}/api/community/poses?difficulty=intermediate&tag=stretch&page=1&limit=20`);
```

---

### GET /api/community/poses/:id — Get pose by ID

Returns a single published pose. Also increments `downloadCount`.

**Response `200`**

```json
{
  "data": CommunityPose
}
```

**Response `404`** — pose not found or not published

```json
{
  "error": { "code": "NOT_FOUND", "message": "Pose not found" }
}
```

**Example**

```ts
const res = await fetch(`${BASE_URL}/api/community/poses/${id}`);
if (!res.ok) {
  const { error } = await res.json();
  console.error(error.message);
  return;
}
const { data: pose } = await res.json();
const imageUrl = `${BASE_URL}/${pose.imagePath}`;
```

---

## Usage Patterns

### Fetch all poses with pagination

```ts
async function fetchPoses({
  page = 1,
  limit = 20,
  difficulty,
  tag,
}: {
  page?: number;
  limit?: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
  tag?: string;
} = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (difficulty) params.set("difficulty", difficulty);
  if (tag) params.set("tag", tag);

  const res = await fetch(`${BASE_URL}/api/community/poses?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch poses: ${res.status}`);
  return res.json() as Promise<{ data: CommunityPose[]; pagination: Pagination }>;
}
```

### Get image URL from a pose

```ts
function getPoseImageUrl(pose: CommunityPose): string {
  return `${BASE_URL}/${pose.imagePath}`;
}
```

### Search/filter client-side by name (after fetching)

> The API does not support full-text name search. Filter client-side after fetch, or fetch all and filter:

```ts
const { data } = await fetchPoses({ limit: 100 });
const results = data.filter((p) =>
  p.name.toLowerCase().includes(query.toLowerCase())
);
```

---

## Error Format

All errors follow this shape:

```json
{
  "error": {
    "code": "NOT_FOUND" | "BAD_REQUEST" | "UNAUTHORIZED" | "INTERNAL_SERVER_ERROR",
    "message": "Human-readable message"
  }
}
```

No authentication required for public endpoints.
