FROM node:24.19.0-alpine3.24@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43

WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080

COPY --chown=10001:10001 app ./app
COPY --chown=10001:10001 assets/brand/monflorian-logo.png ./assets/brand/monflorian-logo.png

USER 10001:10001
EXPOSE 8080

CMD ["node", "app/server.mjs"]
