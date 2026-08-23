import { deflateSync } from "node:zlib";

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

export function syntheticPng({ width = 256, height = 256, metadata = false } = {}) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    for (let x = 0; x < width; x += 1) {
      const pixel = row + 1 + x * 4;
      rows[pixel] = (x * 17 + y * 3) % 256;
      rows[pixel + 1] = (x * 5 + y * 19) % 256;
      rows[pixel + 2] = (x * 11 + y * 7) % 256;
      rows[pixel + 3] = 255;
    }
  }
  const chunks = [pngChunk("IHDR", ihdr)];
  if (metadata) chunks.push(pngChunk("tEXt", Buffer.from("Location\0somewhere", "latin1")));
  chunks.push(pngChunk("IDAT", deflateSync(rows)), pngChunk("IEND", Buffer.alloc(0)));
  return Buffer.concat([signature, ...chunks]);
}

export function pngDataUrl(options) {
  return `data:image/png;base64,${syntheticPng(options).toString("base64")}`;
}

export function itineraryRequest(overrides = {}) {
  return {
    brief: "Nous voulons découvrir Porto à pied, avec du temps pour dessiner et bien manger.",
    startDate: "2026-09-01",
    endDate: "2026-09-01",
    requestedDays: 1,
    travelers: 2,
    pace: "balanced",
    ...overrides,
  };
}

export function itineraryOutput(overrides = {}) {
  return {
    title: "Porto à hauteur de carnet",
    destination: "Porto",
    summary: "Une journée compacte, pensée pour marcher sans courir.",
    florianNote: "Je garde une seule rive comme fil conducteur pour éviter les transferts inutiles.",
    budgetNote: "Les prix et disponibilités restent à vérifier avant réservation.",
    reservationChecklist: ["Vérifier les horaires le jour du départ"],
    verificationChecklist: ["Confirmer la météo et les conditions d’accès"],
    days: [
      {
        day: 1,
        date: "2026-09-01",
        base: "Porto",
        title: "Les lignes de la ville",
        summary: "Un parcours à pied entre belvédères et ateliers.",
        moments: [
          {
            period: "matin",
            title: "Descendre vers le Douro",
            description: "Marcher lentement et faire une pause dessin sur un point de vue dégagé.",
            duration: "environ 2 h",
            bookingRequired: false,
            rainAlternative: "Choisir un café couvert avec vue sur les façades.",
            fatigueAlternative: "Rejoindre directement la rive en transport public.",
          },
        ],
        transfer: "Trajets à pied, durées à confirmer selon le point de départ.",
      },
    ],
    accommodationStops: [],
    ...overrides,
  };
}
