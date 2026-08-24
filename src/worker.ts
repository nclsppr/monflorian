import { AppError, LIMITS, parseBookingConfiguration } from "../app/core.mjs";

export { TripWorkflow } from "./workflows/trip";

const API_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} as const;

function release(env: Env): string {
  if (env.MONFLORIAN_RELEASE !== "cloudflare") return env.MONFLORIAN_RELEASE;
  return env.CF_VERSION_METADATA.id;
}

function jsonResponse(env: Env, status: number, payload: unknown, requestId: string): Response {
  return Response.json(payload, {
    status,
    headers: {
      ...API_HEADERS,
      "X-Monflorian-Release": release(env),
      "X-Request-Id": requestId,
    },
  });
}

function publicConfiguration(env: Env) {
  const booking = parseBookingConfiguration(env);
  const accessMode = String(env.MONFLORIAN_ACCESS_MODE) === "public" ? "public" : "private";

  return {
    serviceReady: false,
    illustrationEnabled: false,
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

export default {
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

      if (request.method === "POST" && url.pathname === "/api/itineraries") {
        throw new AppError(
          503,
          "GENERATION_UNAVAILABLE",
          "La composition n’est pas ouverte pendant la migration Cloudflare.",
        );
      }

      if (request.method === "POST" && url.pathname === "/api/illustrations") {
        throw new AppError(
          503,
          "ILLUSTRATION_UNAVAILABLE",
          "La création d’illustration n’est pas ouverte pendant la migration Cloudflare.",
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
        path: url.pathname,
        status,
        errorCode,
        durationMs: Date.now() - started,
      }));
    }
  },
} satisfies ExportedHandler<Env>;
