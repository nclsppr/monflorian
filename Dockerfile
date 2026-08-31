FROM node:24.19.0-bookworm-slim@sha256:3638d9a6fe4030bd716be989438248074489337ba3275657f93595428be4fc03

WORKDIR /app
ENV NODE_ENV=development \
    MINIFLARE_CACHE_DIR=/tmp/miniflare \
    XDG_CONFIG_HOME=/tmp/cloudflare-config

COPY --chown=10001:10001 package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY --chown=10001:10001 tsconfig.json wrangler.jsonc worker-configuration.d.ts vite.v2.config.js ./
COPY --chown=10001:10001 migrations ./migrations
COPY --chown=10001:10001 src ./src
COPY --chown=10001:10001 app ./app
COPY --chown=10001:10001 assets/brand ./assets/brand
COPY --chown=10001:10001 contracts ./contracts
COPY --chown=10001:10001 scripts/build-worker-assets.mjs ./scripts/build-worker-assets.mjs

RUN npm run build:assets

USER 10001:10001
EXPOSE 8080

CMD ["npx", "wrangler", "dev", "--local", "--local-upstream", "127.0.0.1", "--ip", "0.0.0.0", "--port", "8080", "--var", "MONFLORIAN_RELEASE:local-compose"]
