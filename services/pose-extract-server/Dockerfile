FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json vitest.config.ts ./
COPY src ./src
COPY scripts ./scripts

RUN npm run build

FROM node:20-bookworm-slim AS runtime

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
RUN groupadd --system --gid 1001 pose \
  && useradd --system --uid 1001 --gid pose --create-home --home /home/pose pose \
  && mkdir -p /app/data \
  && chown -R pose:pose /app /home/pose

USER pose:pose

EXPOSE 3000

CMD ["node", "dist/index.js"]
