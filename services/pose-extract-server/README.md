# pose-extract-server

Express + TypeScript service để nhận ảnh người dùng, gọi Gemini và trả về ảnh pose.

## Environment variables

Tạo file `.env` từ `.env.example`:

```bash
PORT=3000
NODE_ENV=development
DATABASE_PATH=./data/keys.db
ADMIN_SECRET=change-me
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=10
```

## Run local

```bash
npm install
npm run dev
```

Health check:

```bash
curl http://localhost:3000/api/health
```

## Admin setup API key

1. Tạo API key đầu tiên:

```bash
curl -X POST http://localhost:3000/api/admin/keys \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "key1",
    "apiKey": "AIza..."
  }'
```

2. Kiểm tra danh sách key:

```bash
curl http://localhost:3000/api/admin/keys \
  -H "Authorization: Bearer $ADMIN_SECRET"
```

## Extract pose endpoint

Request:

```bash
curl -X POST http://localhost:3000/api/extract-pose \
  -F "image=@/absolute/path/to/photo.jpg"
```

Success response:

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

Error matrix:

- `400 INVALID_IMAGE`: thiếu file `image` hoặc mime type không hợp lệ
- `413 IMAGE_TOO_LARGE`: file > 10MB
- `429 RATE_LIMITED`: vượt hạn mức endpoint
- `503 ALL_KEYS_EXHAUSTED`: tất cả key bị exhausted vì quota/rate-limit từ provider
- `500 GEMINI_ERROR`: lỗi provider không thuộc quota

## Verification checklist

- `npm test`
- `npm run lint`
- `npm run build`
- Tạo ít nhất 2 key qua admin API
- Gọi `POST /api/extract-pose` với ảnh JPEG/PNG hợp lệ
- Kiểm tra failover: mô phỏng key1 quota exhausted, request vẫn success bằng key2
- Kiểm tra `request_logs` có cả bản ghi fail (quota) và success
