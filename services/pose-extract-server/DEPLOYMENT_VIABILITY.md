# Better-sqlite3 Deployment Viability Spike

This service uses `better-sqlite3` (native dependency), so deployment checks need to validate:

1. Native install/build succeeds in a Linux container.
2. Service boots with `DATABASE_PATH` pointing to a mounted path.
3. Health endpoint responds while SQLite file is created on the mount.
4. SQL schema is available in runtime output (`dist/db/schema.sql`) via deterministic build copy.

## Local checks

### 1) Build + app boot with mounted-like path

```bash
npm run spike:boot-check
```

This command:

- Builds TypeScript output (`npm run build`)
- Boots `dist/index.js` with required env vars (`DATABASE_PATH`, `ADMIN_SECRET`) under a temp mount-like directory
- Calls `GET /api/health`
- Verifies the SQLite file is created at the configured path

### 2) Container viability

```bash
npm run spike:docker-viability
```

This command:

- Builds Docker image (`Dockerfile`) with `better-sqlite3`
- Runs the container with volume mount `./.docker-data:/app/data`
- Uses `DATABASE_PATH=/app/data/keys.db`
- Calls `GET /api/health`
- Checks that `.docker-data/keys.db` exists on host
