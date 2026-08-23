import { generateIllustration, generateItinerary } from "../app/openai.mjs";
import { validateItineraryInput } from "../app/core.mjs";
import { syntheticPng } from "../tests/helpers.mjs";

const apiKey = process.env.OPENAI_API_KEY?.trim();
if (!apiKey) {
  console.error("OPENAI_API_KEY doit être injectée au processus, sans être écrite dans le dépôt.");
  process.exit(2);
}

const runImage = process.argv.includes("--image");
const textModel = process.env.OPENAI_TEXT_MODEL || "gpt-5.4-mini-2026-03-17";
const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
const requestId = `smoke-${crypto.randomUUID()}`;
const request = validateItineraryInput({
  brief: "Voyage synthétique de trois jours à Porto, à pied, avec du temps pour dessiner et une solution simple s’il pleut.",
  startDate: "2026-10-12",
  endDate: "2026-10-14",
  travelers: 2,
  pace: "calm",
});

const text = await generateItinerary({
  apiKey,
  model: textModel,
  request,
  requestId,
  safetyIdentifier: `mf_smoke_${crypto.randomUUID().replaceAll("-", "")}`,
});

const proof = {
  text: {
    model: textModel,
    providerRequestId: text.providerRequestId,
    days: text.itinerary.days.length,
    accommodationStops: text.itinerary.accommodationStops.length,
  },
};

if (runImage) {
  const image = await generateIllustration({
    apiKey,
    model: imageModel,
    request: {
      destination: "Porto",
      scene: "Deux personnages dessinés contemplent le Douro avec un carnet de voyage.",
      photos: [{
        buffer: syntheticPng(),
        mimeType: "image/png",
        width: 256,
        height: 256,
      }],
    },
    requestId: `${requestId}-image`,
  });
  proof.image = {
    model: imageModel,
    providerRequestId: image.providerRequestId,
    mediaType: image.imageDataUrl.slice(5, image.imageDataUrl.indexOf(";")),
    encodedBytes: Buffer.byteLength(image.imageDataUrl, "utf8"),
  };
}

console.log(JSON.stringify(proof));
