FROM node:24.19.0-alpine3.24@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43

WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080

# Runtime only: npm is not used and would add an unnecessary dependency tree.
RUN rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx

COPY --chown=10001:10001 app ./app
COPY --chown=10001:10001 assets/brand ./assets/brand

USER 10001:10001
EXPOSE 8080

CMD ["node", "app/server.mjs"]
