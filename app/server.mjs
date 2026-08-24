import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

import {
  AppError,
  LIMITS,
  accessCodeMatches,
  buildAccommodationSuggestions,
  parseBookingConfiguration,
  validateIllustrationInput,
  validateItineraryInput,
} from "./core.mjs";
import { generateIllustration, generateItinerary } from "./openai.mjs";

const APP_ROOT = fileURLToPath(new URL(".", import.meta.url));
const PROJECT_ROOT = fileURLToPath(new URL("../", import.meta.url));

function integer(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function secretFrom(environment, valueName, fileName) {
  const file = environment[fileName];
  if (file) {
    const stats = statSync(file);
    if (!stats.isFile()) throw new Error(`${fileName} ne pointe pas vers un fichier régulier.`);
    return readFileSync(file, "utf8").trim();
  }
  return (environment[valueName] || "").trim();
}

export function loadConfiguration(environment = process.env) {
  const accessMode = environment.MONFLORIAN_ACCESS_MODE || "private";
  if (!new Set(["private", "public"]).has(accessMode)) {
    throw new Error("MONFLORIAN_ACCESS_MODE doit valoir private ou public.");
  }
  const publicOrigin = environment.MONFLORIAN_PUBLIC_ORIGIN || "http://127.0.0.1:8080";
  const origin = new URL(publicOrigin);
  if (!new Set(["http:", "https:"]).has(origin.protocol) || origin.username || origin.password || origin.pathname !== "/") {
    throw new Error("MONFLORIAN_PUBLIC_ORIGIN doit être une origine HTTP(S) sans chemin.");
  }

  const openAiApiKey = secretFrom(environment, "OPENAI_API_KEY", "OPENAI_API_KEY_FILE");
  const accessCode = secretFrom(environment, "MONFLORIAN_ACCESS_CODE", "MONFLORIAN_ACCESS_CODE_FILE");
  const generationEnabled = environment.MONFLORIAN_GENERATION_ENABLED !== "false";
  const illustrationEnabled = environment.MONFLORIAN_ILLUSTRATION_ENABLED !== "false";
  const serviceReady = Boolean(
    openAiApiKey &&
      generationEnabled &&
      (accessMode === "public" || accessCode),
  );

  return {
    port: integer(environment.PORT, 8080, { max: 65_535 }),
    host: environment.HOST || "0.0.0.0",
    nodeEnvironment: environment.NODE_ENV || "development",
    release: environment.MONFLORIAN_RELEASE || "local",
    publicOrigin: origin.origin,
    trustProxy: environment.MONFLORIAN_TRUST_PROXY === "true",
    accessMode,
    accessCode,
    openAiApiKey,
    openAiTextModel: environment.OPENAI_TEXT_MODEL || "gpt-5.4-mini-2026-03-17",
    openAiImageModel: environment.OPENAI_IMAGE_MODEL || "gpt-image-2",
    generationEnabled,
    illustrationEnabled: illustrationEnabled && generationEnabled,
    serviceReady,
    abuseHashSecret: environment.MONFLORIAN_ABUSE_HASH_SECRET || randomBytes(32).toString("hex"),
    booking: parseBookingConfiguration(environment),
    quotas: {
      itinerariesGlobal: integer(environment.MONFLORIAN_ITINERARIES_PER_DAY, 20, { max: 10_000 }),
      itinerariesPerClient: integer(environment.MONFLORIAN_ITINERARIES_PER_CLIENT_PER_DAY, 2, { max: 100 }),
      illustrationsGlobal: integer(environment.MONFLORIAN_ILLUSTRATIONS_PER_DAY, 6, { max: 1_000 }),
      illustrationsPerClient: integer(environment.MONFLORIAN_ILLUSTRATIONS_PER_CLIENT_PER_DAY, 1, { max: 50 }),
      textConcurrency: integer(environment.MONFLORIAN_TEXT_CONCURRENCY, 2, { max: 20 }),
      imageConcurrency: integer(environment.MONFLORIAN_IMAGE_CONCURRENCY, 1, { max: 10 }),
    },
  };
}

function loadStaticAssets() {
  const definitions = new Map([
    ["/", [new URL("public/index.html", import.meta.url), "text/html; charset=utf-8", "no-cache"]],
    ["/styles.css", [new URL("public/styles.css", import.meta.url), "text/css; charset=utf-8", "public, max-age=300"]],
    ["/app.js", [new URL("public/app.js", import.meta.url), "text/javascript; charset=utf-8", "public, max-age=300"]],
    ["/manifest.webmanifest", [new URL("public/manifest.webmanifest", import.meta.url), "application/manifest+json; charset=utf-8", "public, max-age=300"]],
    ["/assets/monflorian-logo.png", [new URL("../assets/brand/monflorian-logo.png", import.meta.url), "image/png", "public, max-age=86400"]],
    ["/assets/monflorian-wordmark.png", [new URL("../assets/brand/monflorian-wordmark.png", import.meta.url), "image/png", "public, max-age=86400"]],
    ["/assets/florian-original.png", [new URL("../assets/brand/florian-original.png", import.meta.url), "image/png", "public, max-age=86400"]],
    ["/assets/florian-wind.png", [new URL("../assets/brand/florian-wind.png", import.meta.url), "image/png", "public, max-age=86400"]],
    ["/assets/florian-beanie.png", [new URL("../assets/brand/florian-beanie.png", import.meta.url), "image/png", "public, max-age=86400"]],
    ["/assets/florian-summer.png", [new URL("../assets/brand/florian-summer.png", import.meta.url), "image/png", "public, max-age=86400"]],
    ["/assets/florian-flower.png", [new URL("../assets/brand/florian-flower.png", import.meta.url), "image/png", "public, max-age=86400"]],
  ]);
  const assets = new Map();
  for (const [route, [url, contentType, cacheControl]] of definitions) {
    const body = readFileSync(url);
    const etag = `"${createHash("sha256").update(body).digest("base64url")}"`;
    assets.set(route, { body, contentType, cacheControl, etag });
  }
  return assets;
}

function commonHeaders(config) {
  return {
    "Content-Security-Policy": [
      "default-src 'self'",
      "base-uri 'none'",
      "connect-src 'self'",
      "font-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob:",
      "object-src 'none'",
      "script-src 'self'",
      "style-src 'self'",
    ].join("; "),
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Monflorian-Release": config.release,
  };
}

function sendJson(response, config, status, payload, extraHeaders = {}) {
  const body = Buffer.from(JSON.stringify(payload));
  response.writeHead(status, {
    ...commonHeaders(config),
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": String(body.length),
    ...extraHeaders,
  });
  response.end(body);
}

function sendStatic(request, response, config, asset) {
  if (request.headers["if-none-match"] === asset.etag) {
    response.writeHead(304, { ...commonHeaders(config), ETag: asset.etag, "Cache-Control": asset.cacheControl });
    response.end();
    return;
  }
  response.writeHead(200, {
    ...commonHeaders(config),
    "Cache-Control": asset.cacheControl,
    "Content-Type": asset.contentType,
    "Content-Length": String(asset.body.length),
    ETag: asset.etag,
  });
  if (request.method === "HEAD") response.end();
  else response.end(asset.body);
}

async function readJson(request, maxBytes) {
  const contentType = request.headers["content-type"] || "";
  if (!contentType.toLocaleLowerCase("en").startsWith("application/json")) {
    throw new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "Envoie la demande au format JSON.");
  }
  const declared = Number.parseInt(request.headers["content-length"] || "0", 10);
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new AppError(413, "REQUEST_TOO_LARGE", "La demande dépasse la taille autorisée.");
  }
  const chunks = [];
  let total = 0;
  let tooLarge = false;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > maxBytes) {
      tooLarge = true;
      continue;
    }
    chunks.push(chunk);
  }
  if (tooLarge) throw new AppError(413, "REQUEST_TOO_LARGE", "La demande dépasse la taille autorisée.");
  if (!total) throw new AppError(400, "INVALID_JSON", "Le corps JSON est vide.");
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AppError(400, "INVALID_JSON", "Le corps JSON est invalide.");
  }
}

function sameOrigin(request, config) {
  const origin = request.headers.origin;
  if (origin && origin !== config.publicOrigin) {
    throw new AppError(403, "ORIGIN_REJECTED", "Cette demande ne vient pas du site Mon Florian.");
  }
  if (!origin && config.nodeEnvironment === "production") {
    throw new AppError(403, "ORIGIN_REQUIRED", "L’origine de la demande est requise.");
  }
  const fetchSite = request.headers["sec-fetch-site"];
  if (fetchSite && !new Set(["same-origin", "none"]).has(fetchSite)) {
    throw new AppError(403, "ORIGIN_REJECTED", "Cette demande ne vient pas du site Mon Florian.");
  }
}

function normalizeClientAddress(value) {
  return String(value || "unknown").slice(0, 128);
}

function clientAddress(request, config) {
  if (config.trustProxy) {
    const forwarded = request.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) return normalizeClientAddress(forwarded.split(",")[0].trim());
  }
  return normalizeClientAddress(request.socket.remoteAddress);
}

function createQuotaManager(config, now = () => new Date()) {
  let day = "";
  let counts = new Map();
  const concurrency = { itinerary: 0, illustration: 0 };

  function currentDay() {
    return now().toISOString().slice(0, 10);
  }

  function resetIfNeeded() {
    const nextDay = currentDay();
    if (nextDay !== day) {
      day = nextDay;
      counts = new Map();
    }
  }

  function limits(kind) {
    return kind === "itinerary"
      ? {
          global: config.quotas.itinerariesGlobal,
          perClient: config.quotas.itinerariesPerClient,
          concurrent: config.quotas.textConcurrency,
        }
      : {
          global: config.quotas.illustrationsGlobal,
          perClient: config.quotas.illustrationsPerClient,
          concurrent: config.quotas.imageConcurrency,
        };
  }

  async function run(kind, client, task) {
    resetIfNeeded();
    const selected = limits(kind);
    const globalKey = `${kind}:global`;
    const clientKey = `${kind}:client:${client}`;
    if ((counts.get(globalKey) || 0) >= selected.global || (counts.get(clientKey) || 0) >= selected.perClient) {
      throw new AppError(429, "DAILY_LIMIT_REACHED", "La limite de génération du lancement est atteinte pour aujourd’hui.");
    }
    if (concurrency[kind] >= selected.concurrent) {
      throw new AppError(429, "TOO_MANY_REQUESTS", "Une autre génération est en cours. Réessaie dans un instant.");
    }
    counts.set(globalKey, (counts.get(globalKey) || 0) + 1);
    counts.set(clientKey, (counts.get(clientKey) || 0) + 1);
    concurrency[kind] += 1;
    try {
      return await task();
    } finally {
      concurrency[kind] -= 1;
    }
  }

  return { run };
}

function safeLog(logger, event) {
  logger(JSON.stringify(event));
}

function requireAccess(body, request, config) {
  if (config.accessMode === "public") return;
  const headerCode = request.headers["x-monflorian-access-code"];
  const provided = typeof headerCode === "string" ? headerCode : body?.accessCode;
  if (!accessCodeMatches(config.accessCode, provided)) {
    throw new AppError(401, "ACCESS_REQUIRED", "L’accès de lancement est absent ou incorrect.");
  }
}

export function createMonFlorianServer({
  config = loadConfiguration(),
  fetchImpl = fetch,
  logger = (line) => console.log(line),
  now = () => new Date(),
} = {}) {
  const assets = loadStaticAssets();
  const quotas = createQuotaManager(config, now);

  const server = createServer(async (request, response) => {
    const started = Date.now();
    const requestId = randomUUID();
    const clientController = new AbortController();
    response.once("close", () => {
      if (!response.writableEnded) {
        clientController.abort(new AppError(499, "CLIENT_DISCONNECTED", "Le client a interrompu la demande."));
      }
    });
    let url;
    let status = 500;
    let errorCode = null;
    try {
      try {
        url = new URL(request.url || "/", config.publicOrigin);
      } catch {
        throw new AppError(400, "INVALID_REQUEST_TARGET", "La cible HTTP est invalide.");
      }
      if ((request.method === "GET" || request.method === "HEAD") && assets.has(url.pathname)) {
        sendStatic(request, response, config, assets.get(url.pathname));
        status = 200;
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/health") {
        sendJson(response, config, 200, {
          status: "ok",
          release: config.release,
          generationReady: config.serviceReady,
        });
        status = 200;
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/config") {
        sendJson(response, config, 200, {
          serviceReady: config.serviceReady,
          illustrationEnabled: config.serviceReady && config.illustrationEnabled,
          accessMode: config.accessMode,
          bookingMode: config.booking.mode,
          bookingAllowedHosts: [...config.booking.allowedHosts],
          limits: {
            maxPhotos: LIMITS.maxPhotos,
            maxPhotoBytes: LIMITS.maxPhotoBytes,
            maxTripDays: LIMITS.maxTripDays,
            maxTravelers: LIMITS.maxTravelers,
          },
        });
        status = 200;
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/itineraries") {
        sameOrigin(request, config);
        const body = await readJson(request, LIMITS.itineraryBodyBytes);
        requireAccess(body, request, config);
        if (!config.serviceReady || !config.generationEnabled) {
          throw new AppError(503, "GENERATION_UNAVAILABLE", "La composition n’est pas ouverte sur cet environnement.");
        }
        const tripRequest = validateItineraryInput(body);
        const client = clientAddress(request, config);
        const safetyIdentifier = `mf_${createHmac("sha256", config.abuseHashSecret).update(client).digest("hex").slice(0, 32)}`;
        const generated = await quotas.run("itinerary", client, () =>
          generateItinerary({
            apiKey: config.openAiApiKey,
            model: config.openAiTextModel,
            request: tripRequest,
            requestId,
            safetyIdentifier,
            fetchImpl,
            signal: clientController.signal,
          }),
        );
        clientController.signal.throwIfAborted();
        const accommodations = buildAccommodationSuggestions(generated.itinerary, tripRequest, config.booking);
        sendJson(response, config, 200, {
          itinerary: generated.itinerary,
          accommodations,
          meta: {
            generatedAt: now().toISOString(),
            projection: true,
            supportCode: requestId,
          },
        });
        status = 200;
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/illustrations") {
        sameOrigin(request, config);
        const body = await readJson(request, LIMITS.illustrationBodyBytes);
        requireAccess(body, request, config);
        if (!config.serviceReady || !config.illustrationEnabled) {
          throw new AppError(503, "ILLUSTRATION_UNAVAILABLE", "La création d’illustration n’est pas ouverte sur cet environnement.");
        }
        const illustrationRequest = validateIllustrationInput(body);
        const client = clientAddress(request, config);
        const generated = await quotas.run("illustration", client, () =>
          generateIllustration({
            apiKey: config.openAiApiKey,
            model: config.openAiImageModel,
            request: illustrationRequest,
            requestId,
            fetchImpl,
            signal: clientController.signal,
          }),
        );
        clientController.signal.throwIfAborted();
        sendJson(response, config, 200, {
          imageDataUrl: generated.imageDataUrl,
          alt: generated.alt,
          meta: {
            generatedAt: now().toISOString(),
            label: "Projection personnalisée · image générée",
            supportCode: requestId,
          },
        });
        status = 200;
        return;
      }

      if (url.pathname.startsWith("/api/")) {
        throw new AppError(404, "NOT_FOUND", "Cette route n’existe pas.");
      }
      throw new AppError(404, "NOT_FOUND", "Cette page n’existe pas.");
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : clientController.signal.aborted
          ? clientController.signal.reason
          : new AppError(500, "INTERNAL_ERROR", "Le service a rencontré un problème inattendu.");
      status = appError.status;
      errorCode = appError.code;
      if (!response.destroyed) {
        if (!response.headersSent) {
          const headers = appError.status === 401 ? { "WWW-Authenticate": "MonFlorianAccess" } : {};
          sendJson(response, config, appError.status, {
            error: {
              code: appError.code,
              message: appError.message,
              requestId,
            },
          }, headers);
        } else {
          response.destroy();
        }
      }
    } finally {
      safeLog(logger, {
        timestamp: now().toISOString(),
        requestId,
        method: request.method,
        path: url?.pathname || "<invalid>",
        status,
        errorCode,
        durationMs: Date.now() - started,
      });
    }
  });
  server.requestTimeout = 165_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  server.maxHeadersCount = 64;
  return server;
}

function start() {
  const config = loadConfiguration();
  const server = createMonFlorianServer({ config });
  server.listen(config.port, config.host, () => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: "server_started",
      port: config.port,
      release: config.release,
      generationReady: config.serviceReady,
      bookingMode: config.booking.mode,
    }));
  });
  const shutdown = () => {
    server.close((error) => process.exit(error ? 1 : 0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) start();
