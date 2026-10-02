import { pathToFileURL } from "node:url";
import { generateIllustration, generateItinerary, researchTravelFacts, MAX_RESEARCH_TOOL_CALLS } from "../app/openai.mjs";
import { AppError, validateItineraryInput } from "../app/core.mjs";
import { syntheticPng } from "../tests/helpers.mjs";

const HELP = `Usage: npm run smoke:openai -- --case tokyo|luxembourg [--dry-run] [--image]
Sans argument ou avec --help : aucune requête.
--dry-run : prépare le scénario sans réseau ni clé.
Sans --dry-run : deux appels OpenAI payants (recherche puis itinéraire).
--image : ajoute un appel image avec une référence synthétique, sans personne réelle.
Injecter OPENAI_API_KEY au processus. Aucun fichier de secret n'est chargé.
OPENAI_TEXT_MODEL et OPENAI_IMAGE_MODEL permettent de choisir les modèles.`;

function invalidOptions() {
  return new AppError(400, "INVALID_SMOKE_OPTIONS", "Consulte --help.");
}

export function parseSmokeOptions(args) {
  if (!args.length || (args.length === 1 && args[0] === "--help")) return { help: true };
  const options = { dryRun: false, image: false };
  const seen = new Set();
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (seen.has(flag)) throw invalidOptions();
    seen.add(flag);
    if (flag === "--case") options.scenario = args[++index];
    else if (flag === "--dry-run") options.dryRun = true;
    else if (flag === "--image") options.image = true;
    else throw invalidOptions();
  }
  if (!["tokyo", "luxembourg"].includes(options.scenario)) throw invalidOptions();
  return options;
}

export function smokeRequest(scenario) {
  if (!["tokyo", "luxembourg"].includes(scenario)) throw invalidOptions();
  const tokyo = scenario === "tokyo";
  return validateItineraryInput({
    brief: tokyo
      ? "Voyage synthétique à deux à Tokyo début novembre, dates flexibles, dix jours. Découvrir les quartiers, les temples et la cuisine locale, avec des pauses après le vol. Comparer des hôtels confortables et les options de vol depuis Paris."
      : "Séjour synthétique à deux : une nuit à Luxembourg dans un hôtel luxueux, avec une petite randonnée facile et un repli en cas de pluie. Nous sommes déjà à proximité, aucun avion ni trajet longue distance à prévoir.",
    destination: tokyo ? "Tokyo" : "Luxembourg",
    departureCity: tokyo ? "Paris" : null,
    transportMode: tokyo ? "flight" : "none",
    accommodationStyle: tokyo ? "comfort" : "luxury",
    durationDays: tokyo ? 10 : 2,
    travelers: 2,
    pace: "calm",
  });
}

function modelName(value, fallback) {
  const model = value?.trim() || fallback;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/u.test(model) || model.startsWith("sk-")) {
    throw new AppError(400, "INVALID_SMOKE_MODEL", "Identifiant de modèle invalide.");
  }
  return model;
}

function providerMetadata(result, model, startedAt) {
  const usage = result.usage;
  return {
    model,
    durationMs: Math.round(performance.now() - startedAt),
    providerRequestId: /^[a-zA-Z0-9_-]{1,200}$/u.test(result.providerRequestId || "") ? result.providerRequestId : null,
    usage: usage && Number.isSafeInteger(usage.inputTokens) && Number.isSafeInteger(usage.outputTokens)
      ? { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens } : null,
  };
}

export async function runSmoke(args, {
  env = process.env,
  write = (proof) => console.log(JSON.stringify(proof)),
  help = () => console.log(HELP),
  research = researchTravelFacts,
  generate = generateItinerary,
  illustrate = generateIllustration,
} = {}) {
  let stage = "configuration";
  let scenario = null;
  try {
    const options = parseSmokeOptions(args);
    if (options.help) { help(); return 0; }
    scenario = options.scenario;
    const request = smokeRequest(scenario);
    const textModel = modelName(env.OPENAI_TEXT_MODEL, "gpt-5.4-mini-2026-03-17");
    const imageModel = options.image ? modelName(env.OPENAI_IMAGE_MODEL, "gpt-image-2") : null;
    if (options.dryRun) {
      write({ status: "dry-run", scenario, textModel, imageModel, requestedDays: request.requestedDays,
        transportMode: request.transportMode, accommodationStyle: request.accommodationStyle,
        datesFlexible: true, plannedProviderCalls: options.image ? 3 : 2, maxResearchToolCalls: MAX_RESEARCH_TOOL_CALLS });
      return 0;
    }
    const apiKey = env.OPENAI_API_KEY?.trim();
    if (!apiKey) throw new AppError(400, "OPENAI_KEY_MISSING", "Injecte la clé au processus.");
    const requestId = `smoke-${crypto.randomUUID()}`;
    const common = { apiKey, model: textModel, request,
      safetyIdentifier: `mf_smoke_${crypto.randomUUID().replaceAll("-", "")}` };

    stage = "research";
    let startedAt = performance.now();
    const facts = await research({ ...common, requestId: `${requestId}-research` });
    write({ status: "completed", scenario, stage, ...providerMetadata(facts, textModel, startedAt),
      searchCalls: facts.searchCalls, sourceCount: facts.factPack.sources.length,
      sourceHosts: [...new Set(facts.factPack.sources.slice(0, 20).map((source) => new URL(source.url).hostname))] });

    stage = "itinerary";
    startedAt = performance.now();
    const text = await generate({ ...common, factPack: facts.factPack, requestId: `${requestId}-itinerary` });
    const itinerary = text.itinerary;
    write({ status: "completed", scenario, stage, ...providerMetadata(text, textModel, startedAt),
      days: itinerary.days.length, accommodationStops: itinerary.accommodationStops.length,
      nights: itinerary.accommodationStops.reduce((sum, stop) => sum + stop.nights, 0),
      hotels: itinerary.hotels.length, transportOptions: itinerary.transportOptions.length,
      flightOptions: itinerary.transportOptions.filter((option) => option.mode === "flight").length,
      practicalAdvice: itinerary.practicalAdvice.length });

    if (options.image) {
      stage = "image";
      startedAt = performance.now();
      const image = await illustrate({ apiKey, model: imageModel, requestId: `${requestId}-image`,
        request: { destination: request.destination,
          scene: "Deux personnages dessinés découvrent un jardin calme. Référence abstraite synthétique, aucune personne réelle.",
          photos: [{ buffer: syntheticPng(), mimeType: "image/png", width: 256, height: 256 }] } });
      write({ status: "completed", scenario, stage, ...providerMetadata(image, imageModel, startedAt),
        mediaType: "image/webp", bytes: Buffer.from(image.imageDataUrl.split(",")[1], "base64").byteLength });
    }
    return 0;
  } catch (error) {
    write({ status: "failed", scenario, stage,
      code: error instanceof AppError && /^[A-Z_]{1,64}$/u.test(error.code) ? error.code : "SMOKE_FAILED" });
    return stage === "configuration" ? 2 : 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await runSmoke(process.argv.slice(2));
}
