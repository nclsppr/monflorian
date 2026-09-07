export const PLANNER_STORAGE_KEY = "monflorian:trip-planner:v1";
export const PLANNER_STORAGE_LIMIT = 8192;

export const paceOptions = Object.freeze([
  { value: "calme", label: "Calme", detail: "Une grande idée par jour" },
  { value: "equilibre", label: "Équilibré", detail: "Des visites et du temps libre" },
  { value: "intense", label: "Soutenu", detail: "Plusieurs visites dans la journée" },
]);

export const comfortOptions = Object.freeze([
  { value: "charme", label: "Hôtels de charme", detail: "Le lieu compte autant que la chambre" },
  { value: "confort", label: "Confort essentiel", detail: "Une base simple et bien placée" },
  { value: "mixte", label: "Un mélange", detail: "Une belle nuit et des étapes plus simples" },
]);

export const DEFAULT_PLANNER_DRAFT = Object.freeze({
  brief: "",
  days: 10,
  travelers: 2,
  pace: "equilibre",
  comfort: "charme",
});

function boundedInteger(value, min, max) {
  if (typeof value !== "number" && typeof value !== "string") return false;
  if (typeof value === "string" && !/^\d{1,2}$/u.test(value)) return false;
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max;
}

export function plannerErrors(draft) {
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
    return { brief: "Ce brief ne peut pas être ouvert. Recommence avec les champs ci-dessous." };
  }
  const errors = {};
  if (typeof draft.brief !== "string" || draft.brief.length > 2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(draft.brief)) {
    errors.brief = "Garde un texte simple de 2 000 caractères au maximum.";
  }
  if (!boundedInteger(draft.days, 2, 14)) errors.days = "Indique un nombre entier entre 2 et 14 jours.";
  if (!boundedInteger(draft.travelers, 1, 8)) errors.travelers = "Indique un nombre entier entre 1 et 8 voyageurs.";
  if (!paceOptions.some((option) => option.value === draft.pace)) errors.pace = "Choisis un rythme parmi les trois proposés.";
  if (!comfortOptions.some((option) => option.value === draft.comfort)) errors.comfort = "Choisis une préférence d’hébergement.";
  return errors;
}

export function normalizePlannerDraft(draft) {
  if (Object.keys(plannerErrors(draft)).length) return null;
  return {
    brief: draft.brief.trim(),
    days: Number(draft.days),
    travelers: Number(draft.travelers),
    pace: draft.pace,
    comfort: draft.comfort,
  };
}

export function serializePlannerDraft(draft) {
  const normalized = normalizePlannerDraft(draft);
  if (!normalized) throw new TypeError("Invalid planner draft");
  return JSON.stringify({ version: 1, draft: normalized });
}

export function parsePlannerDraft(serialized) {
  if (typeof serialized !== "string" || serialized.length > PLANNER_STORAGE_LIMIT) return null;
  try {
    const payload = JSON.parse(serialized);
    if (!payload || payload.version !== 1 || !payload.draft) return null;
    return normalizePlannerDraft(payload.draft);
  } catch {
    return null;
  }
}

export function plannerText(draft) {
  const value = normalizePlannerDraft(draft);
  if (!value) throw new TypeError("Invalid planner draft");
  return [
    "Mon brief de voyage",
    "",
    "Mon envie",
    value.brief || "Destination, saison et envies à préciser.",
    "",
    `Durée : ${value.days} jours`,
    `Voyageurs : ${value.travelers}`,
    `Rythme : ${paceOptions.find((option) => option.value === value.pace).label}`,
    `Hébergement : ${comfortOptions.find((option) => option.value === value.comfort).label}`,
    "",
    "À préciser avant de réserver",
    "Dates, ville de départ, budget et contraintes de déplacement.",
    "",
    "Préparé sur Mon Florian. Aucune demande ni réservation n’a été envoyée.",
  ].join("\n");
}
