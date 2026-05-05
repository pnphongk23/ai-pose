FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY web/services/pose-extract-server/package.json web/services/pose-extract-server/package-lock.json ./
RUN npm ci

COPY web/services/pose-extract-server/tsconfig.json web/services/pose-extract-server/vitest.config.ts ./
COPY web/services/pose-extract-server/src ./src
COPY web/services/pose-extract-server/scripts ./scripts

RUN npm run build

FROM node:20-bookworm-slim AS combined

# Install OS dependencies for Playwright
RUN npx playwright install-deps chromium

# Install Playwright browser
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright
RUN npx playwright install chromium

WORKDIR /app
COPY web/services/pose-extract-server/package.json web/services/pose-extract-server/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
RUN mkdir -p /app/data

EXPOSE 3000

# Start both API and Worker. wait -n ensures container exits if either process crashes.
CMD ["bash", "-c", "node dist/index.js & node dist/worker/worker-main.js & wait -n"]
