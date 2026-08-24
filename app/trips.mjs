import { Buffer } from "node:buffer";

import { AppError, LIMITS, decodePhoto, validateItineraryInput } from "./core.mjs";

export const TRIP_RETENTION_MS = 30 * 24 * 60 * 60 * 1_000;
export const SOURCE_RETENTION_MS = 24 * 60 * 60 * 1_000;

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateEmail(value) {
  if (typeof value !== "string") {
    throw new AppError(400, "INVALID_EMAIL", "Indique une adresse de courriel valide.");
  }
  const email = value.trim();
  if (
    email.length < 3 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)
  ) {
    throw new AppError(400, "INVALID_EMAIL", "Indique une adresse de courriel valide.");
  }
  return email;
}

export function validateIdempotencyKey(value) {
  if (
    typeof value !== "string" ||
    value.length < 16 ||
    value.length > 128 ||
    !/^[A-Za-z0-9._:-]+$/u.test(value)
  ) {
    throw new AppError(
      400,
      "INVALID_IDEMPOTENCY_KEY",
      "La clé de soumission est absente ou invalide. Recharge la page puis réessaie.",
    );
  }
  return value;
}

export function validateTripCreationInput(value) {
  if (!isPlainObject(value)) {
    throw new AppError(400, "INVALID_INPUT", "La demande de voyage doit être un objet JSON.");
  }

  const itinerary = validateItineraryInput(value);
  const email = validateEmail(value.email);
  const rawPhotos = value.photos ?? [];
  if (!Array.isArray(rawPhotos) || rawPhotos.length > LIMITS.maxPhotos) {
    throw new AppError(
      400,
      "INVALID_PHOTO_COUNT",
      `Ajoute au maximum ${LIMITS.maxPhotos} photos.`,
    );
  }
  if (rawPhotos.length > 0 && value.photoConsent !== true) {
    throw new AppError(
      400,
      "CONSENT_REQUIRED",
      "Confirme les droits et l’accord des personnes représentées avant l’envoi des photos.",
    );
  }

  const photos = rawPhotos.map(decodePhoto);
  const totalPhotoBytes = photos.reduce((sum, photo) => sum + photo.buffer.length, 0);
  if (totalPhotoBytes > LIMITS.maxPhotoBytes * LIMITS.maxPhotos) {
    throw new AppError(413, "PHOTOS_TOO_LARGE", "Le poids total des photos dépasse la limite du lancement.");
  }

  return {
    itinerary,
    email,
    photoConsent: photos.length > 0,
    photos,
  };
}

function decodeKey(secret, bindingName) {
  if (typeof secret !== "string" || !secret.trim()) {
    throw new AppError(503, "SERVICE_NOT_CONFIGURED", `Le secret ${bindingName} n’est pas installé.`);
  }
  const normalized = secret.trim().replace(/-/gu, "+").replace(/_/gu, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const bytes = Buffer.from(`${normalized}${padding}`, "base64");
  if (bytes.length !== 32) {
    throw new AppError(503, "SERVICE_NOT_CONFIGURED", `Le secret ${bindingName} doit contenir 32 octets.`);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64Url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

export function generateTripToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToBase64Url(bytes);
}

export function isTripToken(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/u.test(value);
}

export async function sha256Hex(value) {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(new Uint8Array(digest));
}

export async function hmacSha256Hex(secret, value, bindingName = "TRIP_QUOTA_HASH_KEY") {
  const key = await crypto.subtle.importKey(
    "raw",
    decodeKey(secret, bindingName),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToHex(new Uint8Array(digest));
}

async function importEncryptionKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    decodeKey(secret, "TRIP_DATA_KEY"),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptJson(secret, value, context) {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = await importEncryptionKey(secret);
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: nonce,
      additionalData: encoder.encode(context),
      tagLength: 128,
    },
    key,
    encoder.encode(JSON.stringify(value)),
  );
  return {
    ciphertext: new Uint8Array(ciphertext),
    nonce,
  };
}

export async function decryptJson(secret, ciphertext, nonce, context) {
  try {
    const key = await importEncryptionKey(secret);
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: nonce,
        additionalData: encoder.encode(context),
        tagLength: 128,
      },
      key,
      ciphertext,
    );
    return JSON.parse(decoder.decode(plaintext));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, "TRIP_DATA_UNREADABLE", "Les données privées du voyage sont illisibles.");
  }
}

export function sourceObjectKey(tripId, position, mimeType) {
  const extension = mimeType === "image/png" ? "png" : "webp";
  return `source/${tripId}/${position}.${extension}`;
}

export function generatedObjectKey(tripId, position = 0) {
  return `generated/${tripId}/${position}.webp`;
}
