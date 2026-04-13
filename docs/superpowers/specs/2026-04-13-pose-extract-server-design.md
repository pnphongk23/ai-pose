# Pose Extract Server Design Spec

**Date:** 2026-04-13  
**Status:** Approved  
**Related Issue:** [#21 - Extract Pose Feature](https://github.com/pnphongk23/ai-pose/issues/21)

---

## Context

### Problem
Dự án ai-pose cần extract pose từ ảnh sử dụng Google Gemini API. Gemini đã được test với prompt và ảnh thực, output tốt (minimal vector-style outline illustration).

### Constraints
- **Multi-platform**: Cả iOS native app và Next.js web app cần dùng
- **API Key Security**: Keys không được expose ra client
- **Multi-key rotation**: Có nhiều API keys, cần tự động switch khi key hết quota
- **Dynamic key management**: Add/remove keys runtime, không cần redeploy

### Decision
Xây dựng **dedicated backend service** trên Railway với:
- Express.js + TypeScript
- SQLite persistent storage (Railway Volume)
- Dynamic API key management via Admin API
- Round-robin key rotation với auto-failover

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│   ┌─────────────┐              ┌─────────────────────┐      │
│   │  iOS App    │              │   Next.js Web App   │      │
│   │  (Swift)    │              │   (existing)        │      │
│   └──────┬──────┘              └──────────┬──────────┘      │
│          │                                │                  │
│          │ POST /api/extract-pose         │                  │
│          │ multipart/form-data            │                  │
│          └────────────┬───────────────────┘                  │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        ↓
┌───────────────────────────────────────────────────────────────┐
│                    RAILWAY SERVICE                            │
│   ┌─────────────────────────────────────────────────────┐    │
│   │  Express.js / Node.js                                │    │
│   │                                                      │    │
│   │  ┌──────────────┐  ┌─────────────┐  ┌────────────┐  │    │
│   │  │ Rate Limiter │→│ Key Manager │→│ Gemini Svc │  │    │
│   │  └──────────────┘  └─────────────┘  └────────────┘  │    │
│   │                                                      │    │
│   │  SQLite DB (Railway Volume - persistent)            │    │
│   │  • api_keys table                                   │    │
│   └─────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
                        │
                        ↓
              ┌─────────────────┐
              │   Gemini API    │
              │   (Image Gen)   │
              └─────────────────┘
```

---

## API Contract

### POST /api/extract-pose

Extract pose từ ảnh, trả về minimal vector-style outline.

**Request:**
```http
POST /api/extract-pose
Content-Type: multipart/form-data

image: <binary file>  // Required: JPEG/PNG, max 10MB
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "imageBase64": "iVBORw0KGgo...",
    "mimeType": "image/png",
    "processingTimeMs": 4523
  },
  "meta": {
    "keyUsed": "key2",
    "quotaRemaining": "~80%"
  }
}
```

**Error Responses:**

| Status | Code | When |
|--------|------|------|
| 400 | `INVALID_IMAGE` | No image / wrong format |
| 413 | `IMAGE_TOO_LARGE` | > 10MB |
| 429 | `RATE_LIMITED` | Too many requests |
| 503 | `ALL_KEYS_EXHAUSTED` | All API keys out of quota |
| 500 | `GEMINI_ERROR` | Gemini API failed |

---

### GET /api/health

Health check endpoint.

**Response (200):**
```json
{
  "status": "healthy",
  "uptime": 86400,
  "version": "1.0.0"
}
```

---

### Admin Endpoints (Protected)

All admin endpoints require:
```http
Authorization: Bearer <ADMIN_SECRET>
```

#### GET /api/admin/keys
List all API keys with status.

#### POST /api/admin/keys
Add new API key.
```json
{
  "name": "My Key",
  "apiKey": "AIza..."
}
```

#### DELETE /api/admin/keys/:id
Remove API key.

#### PATCH /api/admin/keys/:id
Update key status (enable/disable).
```json
{
  "status": "disabled"
}
```

#### POST /api/admin/keys/reset
Reset daily counters for all keys.

---

## Data Model

### SQLite Schema

```sql
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,           -- UUID
  name TEXT NOT NULL,            -- Display name
  api_key TEXT NOT NULL,         -- Actual Gemini API key
  status TEXT DEFAULT 'active',  -- active | exhausted | disabled
  requests_today INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME
);

CREATE TABLE request_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_id TEXT REFERENCES api_keys(id),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  processing_time_ms INTEGER,
  success BOOLEAN,
  error_code TEXT
);
```

---

## Key Pool Manager Logic

```
Request đến
    ↓
getNextActiveKey() → round-robin qua keys có status='active'
    ↓
Gọi Gemini với key
    ↓
├─ Success → increment requests_today, return result
├─ 429 Error → markExhausted(key), retry với key tiếp theo
└─ Other Error → return error
    ↓
Nếu tất cả keys exhausted → return 503 ALL_KEYS_EXHAUSTED
```

---

## Project Structure

```
pose-extract-server/
├── src/
│   ├── index.ts                 # Entry point, Express app
│   ├── config/
│   │   └── env.ts               # Environment validation
│   ├── controllers/
│   │   ├── extractController.ts # POST /api/extract-pose
│   │   ├── healthController.ts  # GET /api/health
│   │   └── adminController.ts   # Admin CRUD endpoints
│   ├── services/
│   │   ├── keyStore.ts          # SQLite CRUD for keys
│   │   ├── keyPoolManager.ts    # Round-robin rotation
│   │   └── geminiService.ts     # Gemini API wrapper
│   ├── middleware/
│   │   ├── rateLimiter.ts       # IP-based rate limiting
│   │   ├── uploadHandler.ts     # Multer file upload
│   │   └── adminAuth.ts         # Bearer token auth
│   ├── db/
│   │   ├── schema.sql           # SQLite schema
│   │   └── connection.ts        # better-sqlite3 setup
│   └── utils/
│       └── logger.ts            # pino logger
├── data/                        # Mounted Railway Volume
│   └── keys.db                  # SQLite database file
├── .env.example
├── package.json
├── tsconfig.json
├── Dockerfile
├── railway.toml
└── README.md
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20 LTS |
| Framework | Express.js |
| Language | TypeScript |
| Database | SQLite (better-sqlite3) |
| File Upload | Multer |
| Rate Limiting | express-rate-limit |
| Gemini SDK | @google/generative-ai |
| Logging | pino |
| Deployment | Railway (Docker) |

---

## Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=production

# Admin auth
ADMIN_SECRET=<strong-random-secret>

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000   # 1 minute
RATE_LIMIT_MAX=10            # requests per window

# Database path (Railway Volume)
DATABASE_PATH=/app/data/keys.db
```

**Note:** API keys không lưu trong env, mà add động qua Admin API.

---

## Deployment

### Railway Config

```toml
# railway.toml
[build]
  builder = "dockerfile"

[deploy]
  numReplicas = 1
  healthcheckPath = "/api/health"
  healthcheckTimeout = 30
  restartPolicyType = "on_failure"

[[mounts]]
  source = "data"
  destination = "/app/data"
```

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY src/db/schema.sql ./dist/db/

RUN mkdir -p /app/data

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

---

## Verification Plan

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Deploy to Railway | Service healthy at /api/health |
| 2 | Add API key via admin endpoint | Key saved to SQLite |
| 3 | GET /api/admin/keys | List shows new key |
| 4 | POST /api/extract-pose with image | 200 OK, pose image returned |
| 5 | Redeploy service | Keys still exist (volume persists) |
| 6 | Exhaust key quota (mock 429) | Auto-switch to next key |
| 7 | Test from iOS client | Same response format |
| 8 | Test from web client | Same response format |

---

## Cost Estimate

| Resource | Monthly Cost |
|----------|--------------|
| Railway (container + volume) | ~$5-7 |
| Gemini API | Pay-per-use (varies) |
| **Total** | **~$5-10/month** |

---

## Future Considerations

1. **Caching**: Cache extracted poses bằng image hash
2. **Queue**: Job queue cho batch processing
3. **Monitoring**: Integrate với external monitoring (Sentry, Datadog)
4. **Scale**: Move SQLite → Turso/Supabase nếu cần multi-instance
