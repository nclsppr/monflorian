import {
  AppError,
  LIMITS,
  accessCodeMatches,
  parseBookingConfiguration,
} from "../app/core.mjs";
import {
  SOURCE_RETENTION_MS,
  TRIP_RETENTION_MS,
  decryptJson,
  encryptJson,
  generateTripToken,
  hmacSha256Hex,
  isTripToken,
  sha256Hex,
  sourceObjectKey,
  validateIdempotencyKey,
  validateTripCreationInput,
} from "../app/trips.mjs";
import {
  deleteTripData,
  findTripByIdempotencyHash,
  findTripByTokenHash,
  insertAssets,
  insertTrip,
  markTripFailed,
  markTripQueued,
  purgeExpiredData,
  type StoredTrip,
} from "./trips/repository";
import { renderPrivateTripPage, renderUnknownTripPage } from "./trips/page";

export { TripWorkflow } from "./workflows/trip";

const API_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} as const;

const PRIVATE_TRIP_PATH = /^\/voyages\/([A-Za-z0-9_-]+)$/u;
const PRIVATE_TRIP_DELETE_PATH = /^\/voyages\/([A-Za-z0-9_-]+)\/supprimer$/u;
const TRIP_API_PATH = /^\/api\/trips\/([A-Za-z0-9_-]+)$/u;

interface TurnstileResponse {
  success: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
}

function release(env: Env): string {
  if (env.MONFLORIAN_RELEASE !== "cloudflare") return env.MONFLORIAN_RELEASE;
  return env.CF_VERSION_METADATA.id;
}

function jsonResponse(
  env: Env,
  status: number,
  payload: unknown,
  requestId: string,
  extraHeaders: HeadersInit = {},
): Response {
  return Response.json(payload, {
    status,
    headers: {
      ...API_HEADERS,
      ...extraHeaders,
      "X-Monflorian-Release": release(env),
      "X-Request-Id": requestId,
    },
  });
}

function tripCreationEnabled(env: Env): boolean {
  return String(env.MONFLORIAN_TRIP_CREATION_ENABLED) === "true";
}

function publicConfiguration(env: Env) {
  const booking = parseBookingConfiguration(env);
  const accessMode = String(env.MONFLORIAN_ACCESS_MODE) === "public" ? "public" : "private";

  return {
    serviceReady: tripCreationEnabled(env),
    tripCreationEnabled: tripCreationEnabled(env),
    illustrationEnabled: false,
    turnstileSiteKey: tripCreationEnabled(env) && env.TURNSTILE_SITE_KEY
      ? env.TURNSTILE_SITE_KEY
      : null,
    accessMode,
    bookingMode: booking.mode,
    bookingAllowedHosts: [...booking.allowedHosts],
    limits: {
      maxPhotos: LIMITS.maxPhotos,
      maxPhotoBytes: LIMITS.maxPhotoBytes,
      maxTripDays: LIMITS.maxTripDays,
      maxTravelers: LIMITS.maxTravelers,
    },
  };
}

function errorResponse(env: Env, error: AppError, requestId: string): Response {
  return jsonResponse(env, error.status, {
    error: {
      code: error.code,
      message: error.message,
      requestId,
    },
  }, requestId);
}

function allowedOrigins(env: Env): Set<string> {
  return new Set(
    env.MONFLORIAN_ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function requireTrustedOrigin(request: Request, env: Env): void {
  const origin = request.headers.get("Origin");
  if (!origin || !allowedOrigins(env).has(origin)) {
    throw new AppError(403, "ORIGIN_REJECTED", "Cette origine n’est pas autorisée à modifier un voyage.");
  }
}

function requirePrivateAccess(request: Request, env: Env): void {
  if (String(env.MONFLORIAN_ACCESS_MODE) !== "private") return;
  if (!accessCodeMatches(env.MONFLORIAN_ACCESS_CODE, request.headers.get("X-Monflorian-Access-Code"))) {
    throw new AppError(401, "ACCESS_REQUIRED", "Le code d’accès au lancement est absent ou incorrect.");
  }
}

async function verifyTurnstile(
  token: unknown,
  request: Request,
  env: Env,
  idempotencyKey: string,
): Promise<void> {
  if (typeof token !== "string" || token.length < 10 || token.length > 2_048) {
    throw new AppError(400, "TURNSTILE_REQUIRED", "Confirme que la demande vient bien de toi.");
  }
  if (!env.TURNSTILE_SITE_KEY || !env.TURNSTILE_SECRET_KEY) {
    throw new AppError(503, "SERVICE_NOT_CONFIGURED", "La protection contre les abus n’est pas configurée.");
  }

  const body = new FormData();
  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", token);
  body.set("idempotency_key", idempotencyKey);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!response.ok) {
    throw new AppError(503, "TURNSTILE_UNAVAILABLE", "La vérification anti-abus est temporairement indisponible.");
  }
  const result = await response.json<TurnstileResponse>();
  const requestHostname = new URL(request.url).hostname;
  if (!result.success || result.action !== "create-trip" || result.hostname !== requestHostname) {
    throw new AppError(400, "TURNSTILE_REJECTED", "La vérification anti-abus a été refusée. Recharge la page.");
  }
}

async function storedTripToken(env: Env, trip: StoredTrip): Promise<string> {
  if (!trip.request_ciphertext || !trip.request_nonce) {
    throw new AppError(409, "TRIP_NOT_RETRYABLE", "Cette ancienne demande ne peut pas être reprise.");
  }
  const stored = await decryptJson(
    env.TRIP_DATA_KEY,
    trip.request_ciphertext,
    trip.request_nonce,
    `${trip.id}:request`,
  );
  const token = stored && typeof stored === "object" && "publicToken" in stored
    ? stored.publicToken
    : null;
  if (!isTripToken(token)) {
    throw new AppError(500, "TRIP_DATA_UNREADABLE", "Le lien privé enregistré est illisible.");
  }
  return token;
}

function acceptedTripResponse(
  request: Request,
  env: Env,
  trip: StoredTrip | { id: string; status: string; expires_at: number },
  token: string,
  requestId: string,
): Response {
  if (["deleted", "expired"].includes(trip.status)) {
    throw new AppError(409, "TRIP_ALREADY_CLOSED", "Cette soumission correspond à un voyage déjà supprimé ou expiré.");
  }
  const privateUrl = new URL(`/voyages/${token}`, request.url).toString();
  return jsonResponse(env, 202, {
    tripId: trip.id,
    status: trip.status,
    privateUrl,
    expiresAt: new Date(trip.expires_at).toISOString(),
  }, requestId, { Location: privateUrl });
}

async function parseTripBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("Content-Type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "Envoie la demande au format JSON.");
  }
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(contentLength) && contentLength > LIMITS.illustrationBodyBytes) {
    throw new AppError(413, "REQUEST_TOO_LARGE", "La demande dépasse la taille autorisée.");
  }
  try {
    return await request.json();
  } catch {
    throw new AppError(400, "INVALID_JSON", "Le corps JSON est invalide.");
  }
}

async function createTrip(request: Request, env: Env, requestId: string): Promise<Response> {
  if (!tripCreationEnabled(env)) {
    throw new AppError(503, "TRIP_CREATION_UNAVAILABLE", "La préparation de voyage n’est pas encore ouverte.");
  }
  requireTrustedOrigin(request, env);
  requirePrivateAccess(request, env);

  const idempotencyKey = validateIdempotencyKey(request.headers.get("Idempotency-Key"));
  const idempotencyKeyHash = await hmacSha256Hex(env.TRIP_QUOTA_HASH_KEY, idempotencyKey);
  const existing = await findTripByIdempotencyHash(env.DB, idempotencyKeyHash);
  if (existing) {
    return acceptedTripResponse(request, env, existing, await storedTripToken(env, existing), requestId);
  }

  const body = await parseTripBody(request);
  const turnstileToken = body && typeof body === "object" && "turnstileToken" in body
    ? body.turnstileToken
    : null;
  await verifyTurnstile(turnstileToken, request, env, idempotencyKey);
  const validated = validateTripCreationInput(body);
  const bookingMode = parseBookingConfiguration(env).mode;
  const tripId = crypto.randomUUID();
  const publicToken = generateTripToken();
  const publicTokenHash = await sha256Hex(publicToken);
  const createdAt = Date.now();
  const expiresAt = createdAt + TRIP_RETENTION_MS;
  const requestEnvelope = await encryptJson(env.TRIP_DATA_KEY, {
    publicToken,
    itinerary: validated.itinerary,
    photoConsent: validated.photoConsent,
    photoCount: validated.photos.length,
  }, `${tripId}:request`);
  const emailEnvelope = await encryptJson(
    env.TRIP_DATA_KEY,
    { email: validated.email },
    `${tripId}:email`,
  );

  try {
    await insertTrip(env.DB, {
      id: tripId,
      publicTokenHash,
      idempotencyKeyHash,
      requestCiphertext: requestEnvelope.ciphertext,
      requestNonce: requestEnvelope.nonce,
      emailCiphertext: emailEnvelope.ciphertext,
      emailNonce: emailEnvelope.nonce,
      bookingMode,
      createdAt,
      expiresAt,
    });
  } catch (error) {
    const concurrent = await findTripByIdempotencyHash(env.DB, idempotencyKeyHash);
    if (concurrent) {
      return acceptedTripResponse(request, env, concurrent, await storedTripToken(env, concurrent), requestId);
    }
    throw error;
  }

  const uploadedKeys: string[] = [];
  try {
    const assets = [];
    for (const [position, photo] of validated.photos.entries()) {
      const contentType: "image/png" | "image/webp" = photo.mimeType === "image/png"
        ? "image/png"
        : "image/webp";
      const objectKey = sourceObjectKey(tripId, position, contentType);
      const checksumSha256 = await sha256Hex(photo.buffer);
      await env.MEDIA.put(objectKey, photo.buffer, {
        httpMetadata: { contentType },
        customMetadata: {
          kind: "source_photo",
          position: String(position),
          tripId,
        },
      });
      uploadedKeys.push(objectKey);
      assets.push({
        id: crypto.randomUUID(),
        tripId,
        kind: "source_photo" as const,
        position,
        objectKey,
        contentType,
        sizeBytes: photo.buffer.length,
        checksumSha256,
        createdAt,
        expiresAt: createdAt + SOURCE_RETENTION_MS,
      });
    }
    await insertAssets(env.DB, assets);

    const instance = await env.TRIP_WORKFLOW.create({
      id: `trip-${tripId}`,
      params: { tripId },
      locationHint: "eeur",
      retention: {
        successRetention: "30 days",
        errorRetention: "30 days",
      },
    });
    await markTripQueued(env.DB, tripId, instance.id, Date.now());
  } catch (error) {
    if (uploadedKeys.length) await env.MEDIA.delete(uploadedKeys);
    await markTripFailed(env.DB, tripId, "TRIP_START_FAILED", Date.now());
    throw error;
  }

  return acceptedTripResponse(request, env, {
    id: tripId,
    status: "queued",
    expires_at: expiresAt,
  }, publicToken, requestId);
}

async function tripFromToken(env: Env, token: string): Promise<StoredTrip | null> {
  if (!isTripToken(token)) return null;
  return findTripByTokenHash(env.DB, await sha256Hex(token));
}

async function privateTripPage(env: Env, token: string): Promise<Response> {
  const trip = await tripFromToken(env, token);
  if (!trip) return renderUnknownTripPage();
  if (trip.expires_at <= Date.now() && !["deleted", "expired"].includes(trip.status)) {
    await deleteTripData(env.DB, env.MEDIA, trip, "expired", Date.now());
    return renderPrivateTripPage({ status: "expired", token, expiresAt: trip.expires_at });
  }
  let result: unknown;
  if (trip.status === "ready" && trip.result_ciphertext && trip.result_nonce) {
    result = await decryptJson(
      env.TRIP_DATA_KEY,
      trip.result_ciphertext,
      trip.result_nonce,
      `${trip.id}:result`,
    );
  }
  return renderPrivateTripPage({
    status: trip.status,
    token,
    expiresAt: trip.expires_at,
    result,
    deleted: trip.status === "deleted",
  });
}

async function tripStatus(
  env: Env,
  token: string,
  requestId: string,
): Promise<Response> {
  const trip = await tripFromToken(env, token);
  if (!trip) throw new AppError(404, "NOT_FOUND", "Ce voyage est introuvable.");
  if (trip.expires_at <= Date.now() && !["deleted", "expired"].includes(trip.status)) {
    await deleteTripData(env.DB, env.MEDIA, trip, "expired", Date.now());
    return jsonResponse(env, 200, {
      status: "expired",
      expiresAt: new Date(trip.expires_at).toISOString(),
    }, requestId);
  }
  let result: unknown;
  if (trip.status === "ready" && trip.result_ciphertext && trip.result_nonce) {
    result = await decryptJson(
      env.TRIP_DATA_KEY,
      trip.result_ciphertext,
      trip.result_nonce,
      `${trip.id}:result`,
    );
  }
  return jsonResponse(env, 200, {
    status: trip.status,
    expiresAt: new Date(trip.expires_at).toISOString(),
    result,
  }, requestId);
}

async function deletePrivateTrip(
  request: Request,
  env: Env,
  token: string,
  api: boolean,
  requestId: string,
): Promise<Response> {
  requireTrustedOrigin(request, env);
  const trip = await tripFromToken(env, token);
  if (!trip) {
    if (api) throw new AppError(404, "NOT_FOUND", "Ce voyage est introuvable.");
    return renderUnknownTripPage();
  }
  if (!["deleted", "expired"].includes(trip.status)) {
    await deleteTripData(env.DB, env.MEDIA, trip, "deleted", Date.now());
  }
  if (api) return new Response(null, { status: 204, headers: API_HEADERS });
  return new Response(null, {
    status: 303,
    headers: {
      Location: `/voyages/${token}`,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Request-Id": requestId,
    },
  });
}

function normalizedLogPath(pathname: string): string {
  if (PRIVATE_TRIP_PATH.test(pathname)) return "/voyages/:token";
  if (PRIVATE_TRIP_DELETE_PATH.test(pathname)) return "/voyages/:token/supprimer";
  if (TRIP_API_PATH.test(pathname)) return "/api/trips/:token";
  return pathname;
}

const worker = {
  async fetch(request, env): Promise<Response> {
    const started = Date.now();
    const requestId = crypto.randomUUID();
    const url = new URL(request.url);
    let status = 500;
    let errorCode: string | null = null;

    try {
      if (request.method === "GET" && url.pathname === "/api/health") {
        status = 200;
        return jsonResponse(env, status, {
          status: "ok",
          release: release(env),
          generationReady: false,
        }, requestId);
      }

      if (request.method === "GET" && url.pathname === "/api/config") {
        status = 200;
        return jsonResponse(env, status, publicConfiguration(env), requestId);
      }

      if (request.method === "POST" && url.pathname === "/api/trips") {
        const response = await createTrip(request, env, requestId);
        status = response.status;
        return response;
      }

      const tripApiMatch = TRIP_API_PATH.exec(url.pathname);
      if (tripApiMatch && request.method === "GET") {
        const response = await tripStatus(env, tripApiMatch[1], requestId);
        status = response.status;
        return response;
      }
      if (tripApiMatch && request.method === "DELETE") {
        const response = await deletePrivateTrip(request, env, tripApiMatch[1], true, requestId);
        status = response.status;
        return response;
      }

      if (request.method === "POST" && url.pathname === "/api/itineraries") {
        throw new AppError(
          503,
          "GENERATION_UNAVAILABLE",
          "Cette ancienne route est fermée pendant le passage au voyage asynchrone.",
        );
      }

      if (request.method === "POST" && url.pathname === "/api/illustrations") {
        throw new AppError(
          503,
          "ILLUSTRATION_UNAVAILABLE",
          "Cette ancienne route est fermée pendant le passage au voyage asynchrone.",
        );
      }

      if (url.pathname.startsWith("/api/")) {
        throw new AppError(404, "NOT_FOUND", "Cette route n’existe pas.");
      }

      if (url.pathname === "/.well-known/monflorian-release") {
        status = 200;
        return jsonResponse(env, status, {
          platform: "cloudflare-workers",
          release: release(env),
        }, requestId);
      }

      const privateTripMatch = PRIVATE_TRIP_PATH.exec(url.pathname);
      if (privateTripMatch && request.method === "GET") {
        const response = await privateTripPage(env, privateTripMatch[1]);
        status = response.status;
        return response;
      }

      const deleteTripMatch = PRIVATE_TRIP_DELETE_PATH.exec(url.pathname);
      if (deleteTripMatch && request.method === "POST") {
        const response = await deletePrivateTrip(request, env, deleteTripMatch[1], false, requestId);
        status = response.status;
        return response;
      }

      const response = await env.ASSETS.fetch(request);
      status = response.status;
      return response;
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError(500, "INTERNAL_ERROR", "Le service a rencontré un problème inattendu.");
      status = appError.status;
      errorCode = appError.code;
      return errorResponse(env, appError, requestId);
    } finally {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId,
        method: request.method,
        path: normalizedLogPath(url.pathname),
        status,
        errorCode,
        durationMs: Date.now() - started,
      }));
    }
  },

  scheduled(_controller, env, ctx): void {
    ctx.waitUntil((async () => {
      try {
        const result = await purgeExpiredData(env.DB, env.MEDIA, Date.now());
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          event: "trip_purge_completed",
          ...result,
        }));
      } catch (error) {
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          event: "trip_purge_failed",
          error: error instanceof Error ? error.name : "UnknownError",
        }));
        throw error;
      }
    })());
  },
} satisfies ExportedHandler<Env>;

export default worker;
