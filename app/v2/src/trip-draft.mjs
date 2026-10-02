export const DEFAULT_TRIP_DRAFT = Object.freeze({
  destination: "", departureCity: "", brief: "", startDate: "", endDate: "",
  durationDays: 10, travelers: 2, pace: "balanced", transportMode: "auto",
  budgetTotalEur: "", accommodationStyle: "charm", email: "", accessCode: "",
});

export const TRIP_IDEAS = Object.freeze([
  { name: "Tokyo à deux, début novembre", detail: "Quartiers à pied, bonnes tables et hôtels bien situés.", draft: { destination: "Tokyo, Japon", brief: "Nous partons à deux à Tokyo début novembre. Nous aimons explorer les quartiers à pied, bien manger et garder du temps libre. Propose des hôtels bien situés et des options de vol.", durationDays: 10, travelers: 2, transportMode: "flight", accommodationStyle: "charm", pace: "balanced" } },
  { name: "Une nuit au Luxembourg", detail: "Un hôtel luxueux, une petite randonnée, sans avion.", draft: { destination: "Luxembourg", brief: "Une nuit à deux dans un hôtel luxueux au Luxembourg, avec une petite randonnée accessible et du temps pour profiter de l’hôtel. Nous sommes à proximité : aucun vol n’est nécessaire.", durationDays: 2, travelers: 2, transportMode: "none", accommodationStyle: "luxury", pace: "calm" } },
]);

export const tripPaces = [{ value: "calm", label: "Calme" }, { value: "balanced", label: "Équilibré" }, { value: "intense", label: "Soutenu" }];
export const transportModes = [{ value: "auto", label: "À me conseiller" }, { value: "flight", label: "Avion" }, { value: "train", label: "Train" }, { value: "car", label: "Voiture" }, { value: "none", label: "Déjà à proximité, sans avion" }];
export const accommodationStyles = [{ value: "charm", label: "Charme" }, { value: "comfort", label: "Confort essentiel" }, { value: "luxury", label: "Luxe" }, { value: "mixed", label: "Un mélange" }];

export function requiresDepartureCity(transportMode) {
  return ["flight", "train", "car"].includes(transportMode);
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/u.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function tripDraftErrors(draft, now = new Date()) {
  const errors = {};
  for (const [field, label, minimum, maximum] of [["destination", "ta destination", 2, 120], ["departureCity", "ta ville de départ", 0, 120], ["brief", "tes envies", 20, 2000]]) {
    const text = typeof draft[field] === "string" ? draft[field].trim() : "";
    if (text.length < minimum || text.length > maximum || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text)) errors[field] = `Précise ${label} en ${minimum || 1} à ${maximum.toLocaleString("fr-FR")} caractères.`;
  }
  for (const [field, label, maximum] of [["durationDays", "jours", 14], ["travelers", "voyageurs", 8]]) {
    if (!/^\d{1,2}$/u.test(String(draft[field])) || Number(draft[field]) < 1 || Number(draft[field]) > maximum) errors[field] = `Indique un nombre entier de ${label} entre 1 et ${maximum}.`;
  }
  for (const [field, options] of [["pace", tripPaces], ["transportMode", transportModes], ["accommodationStyle", accommodationStyles]]) {
    if (!options.some(({ value }) => value === draft[field])) errors[field] = "Choisis une des options proposées.";
  }
  const departure = typeof draft.departureCity === "string" ? draft.departureCity.trim() : "";
  if ((requiresDepartureCity(draft.transportMode) || departure) && departure.length < 2) {
    errors.departureCity = "Indique ta ville de départ pour proposer le trajet choisi.";
  }
  if (draft.budgetTotalEur !== "" && (!/^\d{1,6}$/u.test(String(draft.budgetTotalEur)) || Number(draft.budgetTotalEur) < 1 || Number(draft.budgetTotalEur) > 100000)) errors.budgetTotalEur = "Indique un budget total entier entre 1 et 100 000 euros, ou laisse ce champ vide.";
  if (draft.startDate && !validDate(draft.startDate)) errors.startDate = "Indique une date de départ valide.";
  if (draft.endDate && !validDate(draft.endDate)) errors.endDate = "Indique une date de retour valide.";
  if (draft.startDate && !draft.endDate) errors.endDate = "Ajoute la date de retour, ou laisse les deux dates vides.";
  if (draft.endDate && !draft.startDate) errors.startDate = "Ajoute la date de départ, ou laisse les deux dates vides.";
  if (validDate(draft.startDate)) {
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const daysAway = (Date.parse(draft.startDate) - today) / 86400000;
    if (daysAway < 0 || daysAway > 173) errors.startDate = "Choisis un départ entre aujourd’hui et les 173 prochains jours, ou indique la période dans tes envies.";
  }
  if (validDate(draft.startDate) && validDate(draft.endDate)) {
    const days = (Date.parse(draft.endDate) - Date.parse(draft.startDate)) / 86400000 + 1;
    if (Date.parse(`${draft.endDate}T23:59:59Z`) + 7 * 86400000 > now.getTime() + 180 * 86400000) errors.endDate = "Pendant la bêta, choisis un retour dans les 173 prochains jours, ou décris la période dans tes envies.";
    else if (days < 1 || days > 14) errors.endDate = "Choisis un retour couvrant un séjour de 1 à 14 jours.";
    else if (days !== Number(draft.durationDays)) errors.durationDays = "La durée doit correspondre aux dates, départ et retour compris.";
  }
  if (draft.email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(draft.email.trim()) || draft.email.length > 254)) errors.email = "Vérifie l’adresse de courriel, ou laisse ce champ vide.";
  return errors;
}

export function buildTripPayload(draft, { photos = [], photoConsent = false, turnstileToken, emailEnabled = false }) {
  return {
    destination: draft.destination.trim(), departureCity: draft.departureCity.trim() || null,
    brief: draft.brief.trim(), startDate: draft.startDate || null, endDate: draft.endDate || null,
    durationDays: Number(draft.durationDays), travelers: Number(draft.travelers), pace: draft.pace,
    transportMode: draft.transportMode, accommodationStyle: draft.accommodationStyle,
    budgetTotalEur: draft.budgetTotalEur === "" ? null : Number(String(draft.budgetTotalEur).replace(",", ".")),
    email: emailEnabled && draft.email.trim() ? draft.email.trim() : null,
    photos: photos.map(({ dataUrl }) => dataUrl), photoConsent: photos.length > 0 && photoConsent,
    turnstileToken,
  };
}

export function privateTripUrl(value, origin) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin || !/^\/voyages\/[A-Za-z0-9_-]{32,128}$/u.test(url.pathname) || url.search || url.hash) return null;
    return url.href;
  } catch { return null; }
}

export async function prepareTripPhoto(file, maxBytes = 1500000) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choisis une photo JPEG, PNG ou WebP.");
  if (file.size > 30000000) throw new Error("Cette photo dépasse 30 Mo. Choisis un fichier plus léger.");
  let source;
  let sourceUrl;
  try {
    if (typeof createImageBitmap === "function") source = await createImageBitmap(file);
    else {
      sourceUrl = URL.createObjectURL(file);
      source = new Image();
      source.src = sourceUrl;
      await source.decode();
    }
    const width = source.width || source.naturalWidth;
    const height = source.height || source.naturalHeight;
    const scale = Math.min(1, 1600 / Math.max(width, height));
    if (Math.min(width, height) * scale < 256) throw new Error("Choisis une photo d’au moins 256 pixels de côté, sans format panoramique très étroit.");
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Ce navigateur ne peut pas préparer cette photo. Tu peux continuer sans photo.");
    context.fillStyle = "#fffefb";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    let blob;
    for (const quality of [0.86, 0.74, 0.62, 0.5]) {
      blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (blob?.type !== "image/webp") throw new Error("Ce navigateur ne peut pas préparer le format requis. Tu peux continuer sans photo.");
      if (blob.size <= maxBytes) break;
    }
    if (!blob || blob.size < 1024 || blob.size > maxBytes) throw new Error("Cette photo ne peut pas être préparée dans la limite de poids. Essaie une autre image.");
    const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
    return { dataUrl, previewUrl: URL.createObjectURL(blob), bytes: blob.size };
  } catch (error) {
    if (error instanceof Error && /^(Choisis|Ce|Cette)/u.test(error.message)) throw error;
    throw new Error("La photo ne peut pas être lue. Essaie un autre fichier JPEG, PNG ou WebP.");
  } finally { source?.close?.(); if (sourceUrl) URL.revokeObjectURL(sourceUrl); }
}
