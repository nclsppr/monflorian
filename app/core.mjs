import { timingSafeEqual } from "node:crypto";
import { crc32, inflateSync } from "node:zlib";

export const LIMITS = Object.freeze({
  briefCharacters: 2_000,
  maxTripDays: 14,
  maxTravelers: 8,
  maxPhotos: 4,
  maxPhotoBytes: 1_500_000,
  maxPhotoPixels: 4_194_304,
  minPhotoEdge: 256,
  maxPhotoEdge: 2_048,
  itineraryBodyBytes: 131_072,
  illustrationBodyBytes: 8_500_000,
});

const PACE_VALUES = new Set(["calm", "balanced", "intense"]);
const PERIOD_VALUES = new Set(["matin", "après-midi", "soir"]);

export class AppError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value) {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu, "").trim();
}

function text(value, field, { min = 1, max = 500 } = {}) {
  if (typeof value !== "string") {
    throw new AppError(400, "INVALID_INPUT", `Le champ « ${field} » doit être du texte.`);
  }
  const cleaned = cleanText(value);
  if (cleaned.length < min || cleaned.length > max) {
    throw new AppError(
      400,
      "INVALID_INPUT",
      `Le champ « ${field} » doit contenir entre ${min} et ${max} caractères.`,
    );
  }
  return cleaned;
}

function nullableText(value, field, options = {}) {
  if (value === null || value === undefined || value === "") return null;
  return text(value, field, options);
}

function isoDate(value, field, { nullable = false } = {}) {
  if (nullable && (value === null || value === undefined || value === "")) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new AppError(400, "INVALID_INPUT", `Le champ « ${field} » doit être une date au format AAAA-MM-JJ.`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new AppError(400, "INVALID_INPUT", `La date « ${field} » n’est pas valide.`);
  }
  return value;
}

function daysBetween(start, end) {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000);
}

function addDays(start, offset) {
  const date = new Date(`${start}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function validateItineraryInput(value) {
  if (!isPlainObject(value)) {
    throw new AppError(400, "INVALID_INPUT", "Le brief doit être envoyé sous forme d’objet JSON.");
  }

  const brief = text(value.brief, "brief", { min: 20, max: LIMITS.briefCharacters });
  const startDate = isoDate(value.startDate, "date de départ", { nullable: true });
  const endDate = isoDate(value.endDate, "date de retour", { nullable: true });
  if (Boolean(startDate) !== Boolean(endDate)) {
    throw new AppError(400, "INVALID_INPUT", "Indique les deux dates, ou laisse les deux champs vides.");
  }

  let requestedDays = null;
  if (startDate && endDate) {
    const difference = daysBetween(startDate, endDate);
    if (difference < 0) {
      throw new AppError(400, "INVALID_INPUT", "La date de retour doit suivre la date de départ.");
    }
    requestedDays = difference + 1;
    if (requestedDays > LIMITS.maxTripDays) {
      throw new AppError(
        400,
        "TRIP_TOO_LONG",
        `Le lancement accepte jusqu’à ${LIMITS.maxTripDays} jours par itinéraire.`,
      );
    }
  }

  if (!Number.isInteger(value.travelers) || value.travelers < 1 || value.travelers > LIMITS.maxTravelers) {
    throw new AppError(
      400,
      "INVALID_INPUT",
      `Le nombre de voyageurs doit être compris entre 1 et ${LIMITS.maxTravelers}.`,
    );
  }
  if (!PACE_VALUES.has(value.pace)) {
    throw new AppError(400, "INVALID_INPUT", "Choisis un rythme calme, équilibré ou soutenu.");
  }

  return {
    brief,
    startDate,
    endDate,
    requestedDays,
    travelers: value.travelers,
    pace: value.pace,
  };
}

function parsePng(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(signature)) {
    throw new AppError(400, "INVALID_PHOTO", "Une photo PNG reçue est invalide.");
  }
  if (buffer.readUInt32BE(8) !== 13 || buffer.toString("ascii", 12, 16) !== "IHDR") {
    throw new AppError(400, "INVALID_PHOTO", "Une photo PNG ne contient pas d’en-tête lisible.");
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const forbiddenChunks = new Set(["eXIf", "iTXt", "tEXt", "zTXt"]);
  const imageChunks = [];
  let ended = false;
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const next = offset + 12 + length;
    if (next > buffer.length) {
      throw new AppError(400, "INVALID_PHOTO", "Une photo PNG est tronquée.");
    }
    const expectedChecksum = buffer.readUInt32BE(offset + 8 + length);
    const actualChecksum = crc32(buffer.subarray(offset + 4, offset + 8 + length)) >>> 0;
    if (expectedChecksum !== actualChecksum) {
      throw new AppError(400, "INVALID_PHOTO", "Une photo PNG contient un bloc corrompu.");
    }
    if (forbiddenChunks.has(type)) {
      throw new AppError(400, "PHOTO_METADATA", "Réencode cette photo avant de l’envoyer afin de retirer ses métadonnées.");
    }
    if (type === "IDAT" && length > 0) imageChunks.push(buffer.subarray(offset + 8, offset + 8 + length));
    offset = next;
    if (type === "IEND") {
      if (length !== 0 || offset !== buffer.length) {
        throw new AppError(400, "INVALID_PHOTO", "Une photo PNG contient des données après sa fin.");
      }
      ended = true;
      break;
    }
  }
  if (!ended || imageChunks.length === 0) {
    throw new AppError(400, "INVALID_PHOTO", "Une photo PNG ne contient pas de pixels lisibles.");
  }
  try {
    const pixels = inflateSync(Buffer.concat(imageChunks), {
      maxOutputLength: LIMITS.maxPhotoPixels * 8 + LIMITS.maxPhotoEdge,
    });
    if (pixels.length < height) throw new Error("empty pixel rows");
  } catch {
    throw new AppError(400, "INVALID_PHOTO", "Les pixels d’une photo PNG sont corrompus.");
  }
  return { width, height };
}

function readUint24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function parseWebp(buffer) {
  if (
    buffer.length < 30 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    throw new AppError(400, "INVALID_PHOTO", "Une photo WebP reçue est invalide.");
  }
  if (buffer.readUInt32LE(4) !== buffer.length - 8) {
    throw new AppError(400, "INVALID_PHOTO", "Une photo WebP a une taille incohérente.");
  }

  let width = 0;
  let height = 0;
  let pixelWidth = 0;
  let pixelHeight = 0;
  let hasPixels = false;
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    const next = dataOffset + size + (size % 2);
    if (next > buffer.length) {
      throw new AppError(400, "INVALID_PHOTO", "Une photo WebP est tronquée.");
    }
    if (type === "EXIF" || type === "XMP ") {
      throw new AppError(400, "PHOTO_METADATA", "Réencode cette photo avant de l’envoyer afin de retirer ses métadonnées.");
    }
    if (type === "ANIM" || type === "ANMF") {
      throw new AppError(400, "INVALID_PHOTO", "Les photos WebP animées ne sont pas acceptées.");
    }
    if (!width && type === "VP8X" && size === 10) {
      width = readUint24LE(buffer, dataOffset + 4) + 1;
      height = readUint24LE(buffer, dataOffset + 7) + 1;
    } else if (type === "VP8L" && size >= 5 && buffer[dataOffset] === 0x2f) {
      const bits = buffer.readUInt32LE(dataOffset + 1);
      pixelWidth = (bits & 0x3fff) + 1;
      pixelHeight = ((bits >>> 14) & 0x3fff) + 1;
      hasPixels = true;
    } else if (
      type === "VP8 " &&
      size >= 10 &&
      buffer[dataOffset + 3] === 0x9d &&
      buffer[dataOffset + 4] === 0x01 &&
      buffer[dataOffset + 5] === 0x2a
    ) {
      pixelWidth = buffer.readUInt16LE(dataOffset + 6) & 0x3fff;
      pixelHeight = buffer.readUInt16LE(dataOffset + 8) & 0x3fff;
      hasPixels = true;
    }
    offset = next;
  }
  if (offset !== buffer.length || !hasPixels) {
    throw new AppError(400, "INVALID_PHOTO", "Une photo WebP ne contient pas de pixels lisibles.");
  }
  if (!width) {
    width = pixelWidth;
    height = pixelHeight;
  } else if (width !== pixelWidth || height !== pixelHeight) {
    throw new AppError(400, "INVALID_PHOTO", "Les dimensions d’une photo WebP sont incohérentes.");
  }
  if (!width || !height) {
    throw new AppError(400, "INVALID_PHOTO", "Les dimensions d’une photo WebP sont illisibles.");
  }
  return { width, height };
}

export function decodePhoto(dataUrl) {
  if (typeof dataUrl !== "string") {
    throw new AppError(400, "INVALID_PHOTO", "Chaque photo doit être une image réencodée par le navigateur.");
  }
  const match = /^data:(image\/(?:webp|png));base64,([A-Za-z0-9+/]+={0,2})$/u.exec(dataUrl);
  if (!match) {
    throw new AppError(400, "INVALID_PHOTO", "Seules les images WebP ou PNG réencodées sont acceptées.");
  }
  const [, mimeType, encoded] = match;
  const buffer = Buffer.from(encoded, "base64");
  if (
    buffer.length < 1_024 ||
    buffer.length > LIMITS.maxPhotoBytes ||
    buffer.toString("base64").replace(/=+$/u, "") !== encoded.replace(/=+$/u, "")
  ) {
    throw new AppError(
      400,
      "INVALID_PHOTO",
      `Chaque photo doit peser entre 1 Kio et ${(LIMITS.maxPhotoBytes / 1_000_000).toLocaleString("fr-FR")} Mo après réencodage.`,
    );
  }
  const dimensions = mimeType === "image/png" ? parsePng(buffer) : parseWebp(buffer);
  const { width, height } = dimensions;
  if (
    width < LIMITS.minPhotoEdge ||
    height < LIMITS.minPhotoEdge ||
    width > LIMITS.maxPhotoEdge ||
    height > LIMITS.maxPhotoEdge ||
    width * height > LIMITS.maxPhotoPixels
  ) {
    throw new AppError(
      400,
      "INVALID_PHOTO_DIMENSIONS",
      `Chaque photo doit mesurer entre ${LIMITS.minPhotoEdge} et ${LIMITS.maxPhotoEdge} pixels par côté.`,
    );
  }
  return { buffer, mimeType, width, height };
}

export function validateIllustrationInput(value) {
  if (!isPlainObject(value)) {
    throw new AppError(400, "INVALID_INPUT", "La demande d’illustration doit être un objet JSON.");
  }
  if (value.consent !== true) {
    throw new AppError(
      400,
      "CONSENT_REQUIRED",
      "Confirme les droits et l’accord des personnes représentées avant l’envoi des photos.",
    );
  }
  if (!Array.isArray(value.photos) || value.photos.length < 1 || value.photos.length > LIMITS.maxPhotos) {
    throw new AppError(400, "INVALID_PHOTO_COUNT", `Ajoute entre 1 et ${LIMITS.maxPhotos} photos.`);
  }
  const photos = value.photos.map(decodePhoto);
  const totalBytes = photos.reduce((sum, photo) => sum + photo.buffer.length, 0);
  if (totalBytes > LIMITS.maxPhotoBytes * LIMITS.maxPhotos) {
    throw new AppError(413, "PHOTOS_TOO_LARGE", "Le poids total des photos dépasse la limite du lancement.");
  }
  return {
    destination: text(value.destination, "destination", { min: 2, max: 120 }),
    scene: text(value.scene, "scène", { min: 10, max: 500 }),
    consent: true,
    photos,
  };
}

function outputText(value, field, max = 1_500) {
  try {
    return text(value, field, { min: 1, max });
  } catch {
    throw new AppError(502, "INVALID_PROVIDER_RESPONSE", "Le service de composition a renvoyé un résultat incomplet.");
  }
}

function outputDate(value, field) {
  if (value === null) return null;
  try {
    return isoDate(value, field);
  } catch {
    throw new AppError(502, "INVALID_PROVIDER_RESPONSE", "Le service de composition a renvoyé une date invalide.");
  }
}

export function validateItineraryOutput(value, request) {
  if (!isPlainObject(value) || !Array.isArray(value.days) || !Array.isArray(value.accommodationStops)) {
    throw new AppError(502, "INVALID_PROVIDER_RESPONSE", "Le service de composition a renvoyé un résultat illisible.");
  }
  if (value.days.length < 1 || value.days.length > LIMITS.maxTripDays) {
    throw new AppError(502, "INVALID_PROVIDER_RESPONSE", "Le nombre de jours produit est hors limite.");
  }
  if (request.requestedDays && value.days.length !== request.requestedDays) {
    throw new AppError(502, "INVALID_PROVIDER_RESPONSE", "Le service n’a pas respecté les dates demandées.");
  }

  const days = value.days.map((day, index) => {
    if (!isPlainObject(day) || !Array.isArray(day.moments) || day.moments.length < 1 || day.moments.length > 3) {
      throw new AppError(502, "INVALID_PROVIDER_RESPONSE", "Une journée produite est incomplète.");
    }
    const moments = day.moments.map((moment) => {
      if (!isPlainObject(moment) || !PERIOD_VALUES.has(moment.period) || typeof moment.bookingRequired !== "boolean") {
        throw new AppError(502, "INVALID_PROVIDER_RESPONSE", "Une étape produite est invalide.");
      }
      return {
        period: moment.period,
        title: outputText(moment.title, "titre d’étape", 160),
        description: outputText(moment.description, "description d’étape", 800),
        duration: outputText(moment.duration, "durée", 80),
        bookingRequired: moment.bookingRequired,
        rainAlternative: outputText(moment.rainAlternative, "alternative pluie", 500),
        fatigueAlternative: outputText(moment.fatigueAlternative, "alternative fatigue", 500),
      };
    });
    const expectedDate = request.startDate ? addDays(request.startDate, index) : null;
    const returnedDate = outputDate(day.date, "date de journée");
    if (expectedDate && returnedDate !== expectedDate) {
      throw new AppError(502, "INVALID_PROVIDER_RESPONSE", "Le service a décalé une date du voyage.");
    }
    return {
      day: index + 1,
      date: expectedDate || returnedDate,
      base: outputText(day.base, "étape", 120),
      title: outputText(day.title, "titre de journée", 180),
      summary: outputText(day.summary, "résumé de journée", 700),
      moments,
      transfer: outputText(day.transfer, "trajet", 500),
    };
  });

  const accommodationStops = value.accommodationStops.slice(0, LIMITS.maxTripDays).map((stop) => {
    if (!isPlainObject(stop) || !Number.isInteger(stop.nights) || stop.nights < 1 || stop.nights > LIMITS.maxTripDays) {
      throw new AppError(502, "INVALID_PROVIDER_RESPONSE", "Une étape d’hébergement est invalide.");
    }
    const checkIn = outputDate(stop.checkIn, "arrivée hébergement");
    const checkOut = outputDate(stop.checkOut, "départ hébergement");
    if (Boolean(checkIn) !== Boolean(checkOut)) {
      throw new AppError(502, "INVALID_PROVIDER_RESPONSE", "Les dates d’une étape d’hébergement sont incomplètes.");
    }
    if (request.startDate) {
      const nights = checkIn && checkOut ? daysBetween(checkIn, checkOut) : 0;
      if (
        !checkIn ||
        !checkOut ||
        nights < 1 ||
        nights !== stop.nights ||
        checkIn < request.startDate ||
        checkOut > request.endDate
      ) {
        throw new AppError(502, "INVALID_PROVIDER_RESPONSE", "Une étape d’hébergement sort des dates du voyage.");
      }
    } else if (checkIn || checkOut) {
      throw new AppError(502, "INVALID_PROVIDER_RESPONSE", "Le service a inventé des dates d’hébergement.");
    }
    return {
      destination: outputText(stop.destination, "destination d’hébergement", 120),
      checkIn,
      checkOut,
      nights: stop.nights,
    };
  });
  for (let index = 1; index < accommodationStops.length; index += 1) {
    const previous = accommodationStops[index - 1];
    const current = accommodationStops[index];
    if (previous.checkOut && current.checkIn && previous.checkOut > current.checkIn) {
      throw new AppError(502, "INVALID_PROVIDER_RESPONSE", "Deux étapes d’hébergement se chevauchent.");
    }
  }

  return {
    title: outputText(value.title, "titre du voyage", 180),
    destination: outputText(value.destination, "destination", 160),
    summary: outputText(value.summary, "résumé", 1_200),
    florianNote: outputText(value.florianNote, "note de Florian", 700),
    budgetNote: outputText(value.budgetNote, "note budget", 700),
    reservationChecklist: Array.isArray(value.reservationChecklist)
      ? value.reservationChecklist.slice(0, 10).map((item) => outputText(item, "réservation", 300))
      : [],
    verificationChecklist: Array.isArray(value.verificationChecklist)
      ? value.verificationChecklist.slice(0, 10).map((item) => outputText(item, "vérification", 300))
      : [],
    days,
    accommodationStops,
  };
}

const momentSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    period: { type: "string", enum: ["matin", "après-midi", "soir"] },
    title: { type: "string" },
    description: { type: "string" },
    duration: { type: "string" },
    bookingRequired: { type: "boolean" },
    rainAlternative: { type: "string" },
    fatigueAlternative: { type: "string" },
  },
  required: [
    "period",
    "title",
    "description",
    "duration",
    "bookingRequired",
    "rainAlternative",
    "fatigueAlternative",
  ],
};

export const itineraryJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    destination: { type: "string" },
    summary: { type: "string" },
    florianNote: { type: "string" },
    budgetNote: { type: "string" },
    reservationChecklist: { type: "array", items: { type: "string" } },
    verificationChecklist: { type: "array", items: { type: "string" } },
    days: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          day: { type: "integer" },
          date: { type: ["string", "null"] },
          base: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" },
          moments: { type: "array", items: momentSchema },
          transfer: { type: "string" },
        },
        required: ["day", "date", "base", "title", "summary", "moments", "transfer"],
      },
    },
    accommodationStops: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          destination: { type: "string" },
          checkIn: { type: ["string", "null"] },
          checkOut: { type: ["string", "null"] },
          nights: { type: "integer" },
        },
        required: ["destination", "checkIn", "checkOut", "nights"],
      },
    },
  },
  required: [
    "title",
    "destination",
    "summary",
    "florianNote",
    "budgetNote",
    "reservationChecklist",
    "verificationChecklist",
    "days",
    "accommodationStops",
  ],
};

function normalizeDestination(value) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr").replace(/\s+/gu, " ").trim();
}

function safeHttpsUrl(value, allowedHosts) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new AppError(500, "INVALID_BOOKING_CONFIGURATION", "Un lien d’hébergement configuré est invalide.");
  }
  if (url.protocol !== "https:" || !allowedHosts.has(url.hostname.toLocaleLowerCase("en"))) {
    throw new AppError(500, "INVALID_BOOKING_CONFIGURATION", "Un lien d’hébergement sort de la liste de domaines autorisés.");
  }
  return url.toString();
}

export function parseBookingConfiguration(environment = process.env) {
  const mode = environment.BOOKING_MODE || "external";
  if (!new Set(["off", "external", "cj-static"]).has(mode)) {
    throw new AppError(
      500,
      "INVALID_BOOKING_CONFIGURATION",
      "Le mode Booking demandé n’est pas admis sans contrat et implémentation validés.",
    );
  }
  if (mode !== "cj-static") return { mode, links: new Map(), allowedHosts: new Set() };

  const allowedHosts = new Set(
    (environment.BOOKING_ALLOWED_AFFILIATE_HOSTS || "")
      .split(",")
      .map((host) => host.trim().toLocaleLowerCase("en"))
      .filter(Boolean),
  );
  if (!allowedHosts.size) {
    throw new AppError(500, "INVALID_BOOKING_CONFIGURATION", "Le mode affilié exige une liste de domaines autorisés.");
  }
  let entries;
  try {
    entries = JSON.parse(environment.BOOKING_STATIC_LINKS_JSON || "[]");
  } catch {
    throw new AppError(500, "INVALID_BOOKING_CONFIGURATION", "La configuration des liens affiliés n’est pas un JSON valide.");
  }
  if (!Array.isArray(entries) || !entries.length) {
    throw new AppError(500, "INVALID_BOOKING_CONFIGURATION", "Le mode affilié exige au moins un lien approuvé.");
  }
  const links = new Map();
  for (const entry of entries) {
    if (!isPlainObject(entry)) {
      throw new AppError(500, "INVALID_BOOKING_CONFIGURATION", "Un lien affilié configuré est incomplet.");
    }
    const match = text(entry.match, "destination affiliée", { min: 2, max: 120 });
    const label = nullableText(entry.label, "libellé affilié", { min: 2, max: 160 });
    links.set(normalizeDestination(match), {
      url: safeHttpsUrl(entry.url, allowedHosts),
      label,
    });
  }
  return { mode, links, allowedHosts };
}

function externalBookingUrl(stop, travelers) {
  const url = new URL("https://www.booking.com/searchresults.html");
  url.searchParams.set("ss", stop.destination);
  url.searchParams.set("lang", "fr");
  url.searchParams.set("group_adults", String(travelers));
  url.searchParams.set("no_rooms", "1");
  url.searchParams.set("group_children", "0");
  if (stop.checkIn && stop.checkOut) {
    url.searchParams.set("checkin", stop.checkIn);
    url.searchParams.set("checkout", stop.checkOut);
  }
  return url.toString();
}

export function buildAccommodationSuggestions(itinerary, request, bookingConfiguration) {
  if (bookingConfiguration.mode === "off") {
    return { mode: "off", affiliateDisclosure: null, items: [] };
  }
  const fallbackNights = request.startDate && request.endDate
    ? daysBetween(request.startDate, request.endDate)
    : 0;
  const stops = itinerary.accommodationStops.length
    ? itinerary.accommodationStops
    : [{
        destination: itinerary.destination,
        checkIn: fallbackNights > 0 ? request.startDate : null,
        checkOut: fallbackNights > 0 ? request.endDate : null,
        nights: fallbackNights,
      }];
  let affiliateCount = 0;
  const items = stops.map((stop) => {
    const approved = bookingConfiguration.links.get(normalizeDestination(stop.destination));
    if (bookingConfiguration.mode === "cj-static" && approved) {
      affiliateCount += 1;
      return {
        destination: stop.destination,
        label: approved.label || `Voir les hébergements à ${stop.destination} sur Booking.com`,
        url: approved.url,
        affiliate: true,
      };
    }
    return {
      destination: stop.destination,
      label: `Comparer les hébergements à ${stop.destination} sur Booking.com`,
      url: externalBookingUrl(stop, request.travelers),
      affiliate: false,
    };
  });
  return {
    mode: affiliateCount ? "cj-static" : "external",
    affiliateDisclosure: affiliateCount
      ? "Liens affiliés Booking.com. Mon Florian peut percevoir une commission si tu réserves via ces liens."
      : null,
    items,
  };
}

export function accessCodeMatches(expected, provided) {
  if (!expected || typeof provided !== "string") return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}
