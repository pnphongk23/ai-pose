FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json vitest.config.ts ./
COPY src ./src
COPY scripts ./scripts

RUN npm run build

FROM node:20-bookworm-slim AS base-runtime

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
RUN groupadd --system --gid 1001 pose \
  && useradd --system --uid 1001 --gid pose --create-home --home /home/pose pose \
  && mkdir -p /app/data \
  && chown -R pose:pose /app /home/pose

FROM base-runtime AS combined

# Install OS dependencies for Playwright
RUN npx playwright install-deps chromium

# Install Playwright browser and set ownership
ENV PLAYWRIGHT_BROWSERS_PATH=/home/pose/.cache/ms-playwright
RUN npx playwright install chromium \
    && chown -R pose:pose /home/pose/.cache

USER pose:pose

EXPOSE 3000

# Start both API and Worker. wait -n ensures container exits if either process crashes.
CMD ["sh", "-c", "node dist/index.js & node dist/worker/worker-main.js & wait -n"]
