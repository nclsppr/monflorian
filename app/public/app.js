"use strict";

const DEFAULT_LIMITS = Object.freeze({
  maxPhotos: 4,
  maxPhotoBytes: 1_500_000,
  maxTripDays: 14,
});

const MAX_SOURCE_PHOTO_BYTES = 30 * 1024 * 1024;
const MAX_TEXT_LENGTH = 5000;
const FLORIAN_VARIANTS = Object.freeze([
  "/assets/florian-original.png?v=1",
  "/assets/florian-wind.png?v=1",
  "/assets/florian-beanie.png?v=1",
  "/assets/florian-summer.png?v=1",
]);

const state = {
  config: null,
  tripPending: false,
  illustrationPending: false,
  photoProcessing: false,
  photos: [],
};

const elements = {
  configStatus: document.querySelector("#config-status"),
  launchState: document.querySelector(".launch-state"),
  tripForm: document.querySelector("#trip-form"),
  tripSubmit: document.querySelector("#trip-submit"),
  tripStatus: document.querySelector("#trip-status"),
  brief: document.querySelector("#brief"),
  briefCount: document.querySelector("#brief-count"),
  briefError: document.querySelector("#brief-error"),
  startDate: document.querySelector("#start-date"),
  endDate: document.querySelector("#end-date"),
  datesError: document.querySelector("#dates-error"),
  accessField: document.querySelector("#access-field"),
  accessCode: document.querySelector("#access-code"),
  accessError: document.querySelector("#access-error"),
  tripResult: document.querySelector("#trip-result"),
  resultDestination: document.querySelector("#result-destination"),
  resultTitle: document.querySelector("#result-title"),
  resultSummary: document.querySelector("#result-summary"),
  florianNote: document.querySelector("#florian-note"),
  budgetNote: document.querySelector("#budget-note"),
  daysList: document.querySelector("#days-list"),
  accommodationsSection: document.querySelector("#accommodations-section"),
  accommodationsList: document.querySelector("#accommodations-list"),
  affiliateDisclosure: document.querySelector("#affiliate-disclosure"),
  printButton: document.querySelector("#print-button"),
  newTripButton: document.querySelector("#new-trip-button"),
  illustrationForm: document.querySelector("#illustration-form"),
  illustrationDestination: document.querySelector("#illustration-destination"),
  illustrationScene: document.querySelector("#illustration-scene"),
  illustrationFieldsError: document.querySelector("#illustration-fields-error"),
  photoInput: document.querySelector("#photo-input"),
  photoHelp: document.querySelector("#photo-help"),
  photoList: document.querySelector("#photo-list"),
  photoError: document.querySelector("#photo-error"),
  photoConsent: document.querySelector("#photo-consent"),
  consentError: document.querySelector("#consent-error"),
  illustrationSubmit: document.querySelector("#illustration-submit"),
  illustrationStatus: document.querySelector("#illustration-status"),
  illustrationResult: document.querySelector("#illustration-result"),
  illustrationImage: document.querySelector("#illustration-image"),
  florianVariants: [...document.querySelectorAll("[data-florian-variant]")],
};

async function chooseFlorianVariant() {
  const source = FLORIAN_VARIANTS[Math.floor(Math.random() * FLORIAN_VARIANTS.length)];
  if (source === FLORIAN_VARIANTS[0]) return;

  const candidate = new Image();
  candidate.src = source;
  try {
    await candidate.decode();
  } catch {
    return;
  }
  elements.florianVariants.forEach((image) => { image.src = source; });
}

class RequestError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "RequestError";
    this.status = status;
    this.code = code;
  }
}

function clampInteger(value, minimum, maximum, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(maximum, Math.max(minimum, number));
}

function safeText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, MAX_TEXT_LENGTH) || fallback;
}

function textElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = safeText(text);
  return element;
}

function setButtonPending(button, pending, pendingLabel, idleLabel) {
  button.disabled = pending || !serviceIsReady();
  const label = button.querySelector(".button-label");
  if (label) label.textContent = pending ? pendingLabel : idleLabel;
  button.setAttribute("aria-busy", String(pending));
}

function setLaunchLabel(label, available) {
  elements.launchState.lastChild.textContent = ` ${label}`;
  elements.launchState.classList.toggle("is-unavailable", !available);
}

function serviceIsReady() {
  return Boolean(state.config?.serviceReady);
}

function illustrationIsReady() {
  return serviceIsReady() && state.config?.illustrationEnabled === true;
}

function updateIllustrationAvailability() {
  const available = illustrationIsReady();
  elements.illustrationForm.hidden = !available;
  elements.illustrationDestination.disabled = !available;
  elements.illustrationScene.disabled = !available;
  elements.photoInput.disabled = !available;
  elements.photoConsent.disabled = !available;
  elements.illustrationSubmit.disabled = !available;
  if (!available && serviceIsReady()) {
    renderStatus(
      elements.illustrationStatus,
      "error",
      "Atelier dessin momentanément fermé",
      "Aucune photo ne sera préparée ni envoyée tant que la création d’images est coupée.",
    );
  } else if (!state.illustrationPending) {
    hideStatus(elements.illustrationStatus);
  }
}

function accessCodeIsRequired() {
  const mode = safeText(state.config?.accessMode, "private").toLowerCase();
  return mode !== "public" && mode !== "none" && mode !== "open";
}

function getAccessCode() {
  const code = elements.accessCode.value.trim();
  return code || undefined;
}

function clearElement(element) {
  while (element.firstChild) element.firstChild.remove();
}

function renderStatus(element, kind, title, message, actions = []) {
  clearElement(element);
  element.className = `request-status is-${kind}`;

  if (kind === "loading") {
    const spinner = document.createElement("span");
    spinner.className = "status-spinner";
    spinner.setAttribute("aria-hidden", "true");
    element.append(spinner);
  }

  const copy = document.createElement("div");
  copy.append(textElement("strong", "", title), textElement("p", "", message));

  if (actions.length > 0) {
    const actionRow = document.createElement("div");
    actionRow.className = "status-actions";
    actions.forEach(({ label, run }) => {
      const button = textElement("button", "status-action", label);
      button.type = "button";
      button.addEventListener("click", run);
      actionRow.append(button);
    });
    copy.append(actionRow);
  }

  element.append(copy);
  element.hidden = false;
}

function hideStatus(element) {
  element.hidden = true;
  clearElement(element);
}

function renderConfigNotice(className, title, message, options = {}) {
  clearElement(elements.configStatus);
  elements.configStatus.className = `notice ${className}`;
  elements.configStatus.hidden = false;

  if (options.loading === true) {
    const spinner = document.createElement("span");
    spinner.className = "notice-spinner";
    spinner.setAttribute("aria-hidden", "true");
    elements.configStatus.append(spinner);
  }

  const copy = document.createElement("div");
  copy.append(textElement("strong", "", title), textElement("p", "", message));
  if (typeof options.retry === "function") {
    const actions = document.createElement("div");
    actions.className = "status-actions";
    const retry = textElement("button", "status-action", "Réessayer");
    retry.type = "button";
    retry.addEventListener("click", options.retry);
    actions.append(retry);
    copy.append(actions);
  }
  elements.configStatus.append(copy);
}

async function requestJson(url, options = {}, timeoutMilliseconds = 75_000) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMilliseconds);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : null;

    if (!response.ok) {
      const serverMessage = safeText(payload?.error?.message || payload?.message);
      const code = safeText(payload?.error?.code || payload?.code, "request_failed");
      throw new RequestError(response.status, code, serverMessage);
    }

    if (!payload || typeof payload !== "object") {
      throw new RequestError(response.status, "invalid_response", "");
    }

    return payload;
  } catch (error) {
    if (timedOut) throw new RequestError(0, "timeout", "");
    if (error instanceof RequestError) throw error;
    throw new RequestError(0, navigator.onLine ? "network" : "offline", "");
  } finally {
    window.clearTimeout(timer);
  }
}

function friendlyError(error, operation) {
  if (error.status === 401 || error.status === 403) {
    return {
      kind: "error",
      title: "Code d'accès refusé",
      message: "Vérifie le code reçu avec ton invitation, puis réessaie.",
      accessError: "Ce code n'a pas été accepté.",
    };
  }

  if (error.status === 429) {
    return {
      kind: "rate-limit",
      title: "Limite atteinte pour le moment",
      message: "Attends quelques minutes avant de relancer la demande.",
    };
  }

  if (error.status === 413) {
    return {
      kind: "error",
      title: "Fichiers trop lourds",
      message: "Retire une photo ou choisis des fichiers plus légers, puis réessaie.",
    };
  }

  if (error.status === 400 || error.status === 422) {
    return {
      kind: "error",
      title: operation === "trip" ? "Brief à corriger" : "Demande à corriger",
      message: error.message || "Relis les champs signalés, puis réessaie.",
    };
  }

  if (error.code === "offline") {
    return {
      kind: "error",
      title: "Pas de connexion",
      message: "Reconnecte cet appareil, puis réessaie. Tes champs sont conservés.",
    };
  }

  if (error.code === "timeout") {
    return {
      kind: "error",
      title: "La demande prend trop de temps",
      message: "Le service n'a pas répondu à temps. Tes champs sont conservés.",
    };
  }

  if (error.code === "invalid_response") {
    return {
      kind: "error",
      title: "Réponse incomplète",
      message: "Le service a répondu sans fournir le résultat attendu. Tu peux relancer la demande.",
    };
  }

  return {
    kind: "error",
    title: "Service indisponible",
    message: "La demande n'a pas abouti. Réessaie dans un instant.",
  };
}

async function loadConfig() {
  elements.tripSubmit.disabled = true;
  renderConfigNotice(
    "notice-loading",
    "Connexion au service",
    "Je vérifie que la préparation de voyage est disponible.",
    { loading: true },
  );

  try {
    const payload = await requestJson("/api/config", { method: "GET" }, 12_000);
    state.config = {
      serviceReady: payload.serviceReady === true,
      illustrationEnabled: payload.illustrationEnabled === true,
      accessMode: safeText(payload.accessMode, "private"),
      bookingMode: safeText(payload.bookingMode, "unavailable"),
      bookingAllowedHosts: Array.isArray(payload.bookingAllowedHosts)
        ? payload.bookingAllowedHosts
            .filter((host) => typeof host === "string" && /^(?:[a-z0-9-]+\.)*[a-z0-9-]+$/i.test(host))
            .map((host) => host.toLowerCase())
            .slice(0, 12)
        : [],
      limits: {
        maxPhotos: clampInteger(payload.limits?.maxPhotos, 1, 4, DEFAULT_LIMITS.maxPhotos),
        maxPhotoBytes: clampInteger(
          payload.limits?.maxPhotoBytes,
          100 * 1024,
          8 * 1024 * 1024,
          DEFAULT_LIMITS.maxPhotoBytes,
        ),
        maxTripDays: clampInteger(payload.limits?.maxTripDays, 1, 60, DEFAULT_LIMITS.maxTripDays),
      },
    };

    elements.accessField.hidden = !accessCodeIsRequired();
    elements.accessCode.required = accessCodeIsRequired();
    elements.photoHelp.textContent = `1 à ${state.config.limits.maxPhotos} photos. JPEG, PNG ou WebP, ${formatBytes(state.config.limits.maxPhotoBytes)} après préparation.`;
    updateIllustrationAvailability();

    if (!state.config.serviceReady) {
      renderConfigNotice(
        "notice-error",
        "Préparation temporairement indisponible",
        "Le formulaire reste visible, mais aucune demande ne sera envoyée pour le moment.",
      );
      setLaunchLabel("Service indisponible", false);
      elements.tripSubmit.disabled = true;
      return;
    }

    elements.configStatus.hidden = true;
    elements.tripSubmit.disabled = false;
    setLaunchLabel(accessCodeIsRequired() ? "Lancement privé" : "Service disponible", true);
  } catch (error) {
    state.config = null;
    updateIllustrationAvailability();
    setLaunchLabel("Service indisponible", false);
    renderConfigNotice(
      "notice-error",
      "Connexion impossible",
      "Le service ne répond pas. Vérifie ta connexion, puis relance la vérification.",
      { retry: loadConfig },
    );
  }
}

function updateBriefCount() {
  elements.briefCount.textContent = `${elements.brief.value.length.toLocaleString("fr-FR")} / 2 000`;
  if (elements.brief.value.trim().length >= 20) {
    elements.brief.removeAttribute("aria-invalid");
    elements.briefError.textContent = "";
  }
}

function dateAsUtc(dateText) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return null;
  const date = new Date(`${dateText}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function tripDurationInDays(startText, endText) {
  const start = dateAsUtc(startText);
  const end = dateAsUtc(endText);
  if (!start || !end) return null;
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function validateTripForm() {
  let firstInvalid = null;
  const brief = elements.brief.value.trim();
  elements.briefError.textContent = "";
  elements.datesError.textContent = "";
  elements.accessError.textContent = "";
  elements.brief.removeAttribute("aria-invalid");
  elements.startDate.removeAttribute("aria-invalid");
  elements.endDate.removeAttribute("aria-invalid");
  elements.accessCode.removeAttribute("aria-invalid");

  if (brief.length < 20) {
    elements.briefError.textContent = "Décris ton envie en au moins 20 caractères.";
    elements.brief.setAttribute("aria-invalid", "true");
    firstInvalid = elements.brief;
  }

  const duration = tripDurationInDays(elements.startDate.value, elements.endDate.value);
  if (duration !== null && duration < 1) {
    elements.datesError.textContent = "La date de retour doit suivre la date de départ.";
    elements.startDate.setAttribute("aria-invalid", "true");
    elements.endDate.setAttribute("aria-invalid", "true");
    firstInvalid ||= elements.endDate;
  } else if (duration !== null && duration > state.config.limits.maxTripDays) {
    elements.datesError.textContent = `Le lancement accepte jusqu'à ${state.config.limits.maxTripDays} jours par trajet.`;
    elements.startDate.setAttribute("aria-invalid", "true");
    elements.endDate.setAttribute("aria-invalid", "true");
    firstInvalid ||= elements.endDate;
  }

  if (accessCodeIsRequired() && !getAccessCode()) {
    elements.accessError.textContent = "Saisis le code reçu avec ton invitation.";
    elements.accessCode.setAttribute("aria-invalid", "true");
    firstInvalid ||= elements.accessCode;
  }

  if (firstInvalid) firstInvalid.focus();
  return firstInvalid === null;
}

function formatDate(dateText) {
  const date = dateAsUtc(dateText);
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function renderNotes(itinerary) {
  const florianCopy = safeText(itinerary.florianNote);
  const budgetCopy = safeText(itinerary.budgetNote);

  elements.florianNote.hidden = !florianCopy;
  if (florianCopy) elements.florianNote.querySelector("p").textContent = florianCopy;

  elements.budgetNote.hidden = !budgetCopy;
  if (budgetCopy) elements.budgetNote.querySelector("p").textContent = budgetCopy;
}

function renderMoment(moment) {
  const row = document.createElement("div");
  row.className = "moment-row";
  row.append(textElement("span", "moment-period", moment.period || "Étape"));

  const content = document.createElement("div");
  content.className = "moment-content";
  content.append(
    textElement("h4", "", moment.title || "Moment du voyage"),
    textElement("p", "", moment.description || "Détails à confirmer."),
  );

  const metadata = [];
  if (safeText(moment.duration)) metadata.push(safeText(moment.duration));
  if (moment.bookingRequired === true) metadata.push("Réservation à prévoir");
  if (safeText(moment.rainAlternative)) metadata.push(`S'il pleut : ${safeText(moment.rainAlternative)}`);
  if (safeText(moment.fatigueAlternative)) metadata.push(`Si la fatigue arrive : ${safeText(moment.fatigueAlternative)}`);

  if (metadata.length > 0) {
    const meta = document.createElement("div");
    meta.className = "moment-meta";
    metadata.forEach((item) => meta.append(textElement("span", "", item)));
    content.append(meta);
  }

  row.append(content);
  return row;
}

function renderDays(days) {
  clearElement(elements.daysList);
  const safeDays = Array.isArray(days) ? days.slice(0, state.config.limits.maxTripDays) : [];

  if (safeDays.length === 0) {
    const empty = textElement(
      "p",
      "day-transfer",
      "Aucune journée détaillée n'a été fournie. Relance la préparation pour obtenir le déroulé.",
    );
    elements.daysList.append(empty);
    return;
  }

  safeDays.forEach((day, index) => {
    const article = document.createElement("article");
    article.className = "itinerary-day";

    const indexBlock = document.createElement("div");
    indexBlock.className = "day-index";
    indexBlock.append(textElement("span", "", `Jour ${clampInteger(day.day, 1, 99, index + 1)}`));
    const formattedDate = formatDate(safeText(day.date));
    if (formattedDate) {
      const time = textElement("time", "", formattedDate);
      time.dateTime = safeText(day.date);
      indexBlock.append(time);
    }
    const base = safeText(day.base);
    if (base) indexBlock.append(textElement("span", "day-base", base));

    const copy = document.createElement("div");
    copy.className = "day-copy";
    copy.append(
      textElement("h3", "", day.title || `Jour ${index + 1}`),
      textElement("p", "day-summary", day.summary || "Programme à préciser."),
    );

    const moments = document.createElement("div");
    moments.className = "moments-list";
    const safeMoments = Array.isArray(day.moments) ? day.moments.slice(0, 8) : [];
    if (safeMoments.length > 0) {
      safeMoments.forEach((moment) => moments.append(renderMoment(moment || {})));
      copy.append(moments);
    }

    const transferText =
      safeText(day.transfer) ||
      safeText(day.transfer?.description) ||
      safeText(day.transfer?.summary) ||
      safeText(day.transfer?.label);
    if (transferText) {
      const transfer = document.createElement("p");
      transfer.className = "day-transfer";
      transfer.append(textElement("strong", "", "Trajet : "), document.createTextNode(transferText));
      copy.append(transfer);
    }

    article.append(indexBlock, copy);
    elements.daysList.append(article);
  });
}

function validBookingUrl(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:") return null;
    const isBookingHost = hostname === "booking.com" || hostname.endsWith(".booking.com");
    const isExplicitAffiliateHost = state.config?.bookingAllowedHosts?.includes(hostname) === true;
    if (!isBookingHost && !isExplicitAffiliateHost) return null;
    return url.href;
  } catch {
    return null;
  }
}

function renderAccommodations(accommodations) {
  clearElement(elements.accommodationsList);
  elements.accommodationsSection.hidden = true;
  const items = Array.isArray(accommodations?.items) ? accommodations.items.slice(0, 20) : [];
  if (items.length === 0) return;

  const hasAffiliate = items.some((item) => item?.affiliate === true);
  elements.affiliateDisclosure.textContent =
    safeText(accommodations.affiliateDisclosure) ||
    (hasAffiliate
      ? "Les liens signalés comme sponsorisés peuvent rémunérer Mon Florian. Le prix reste fixé par Booking.com."
      : "Ces liens ouvrent une recherche sur Booking.com. Mon Florian ne réserve rien à ta place.");

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "accommodation-row";
    row.append(
      textElement("strong", "", item.destination || "Étape"),
      textElement("span", item.affiliate === true ? "affiliate-label" : "accommodation-unavailable", item.label || "Voir les hébergements"),
    );

    const url = validBookingUrl(item.url);
    if (url) {
      const link = textElement("a", "accommodation-link", "Ouvrir Booking.com");
      link.href = url;
      link.target = "_blank";
      link.rel = item.affiliate === true ? "sponsored noopener noreferrer" : "noopener noreferrer";
      link.setAttribute("aria-label", `Chercher un hébergement à ${safeText(item.destination, "cette étape")} sur Booking.com, nouvel onglet`);
      row.append(link);
    } else {
      row.append(textElement("span", "accommodation-unavailable", "Lien indisponible"));
    }
    elements.accommodationsList.append(row);
  });

  elements.accommodationsSection.hidden = false;
}

function renderTrip(payload) {
  const itinerary = payload.itinerary;
  if (!itinerary || typeof itinerary !== "object") {
    throw new RequestError(200, "invalid_response", "");
  }

  const title = safeText(itinerary.title);
  const destination = safeText(itinerary.destination);
  if (!title || !destination) throw new RequestError(200, "invalid_response", "");

  elements.resultDestination.textContent = destination;
  elements.resultTitle.textContent = title;
  elements.resultSummary.textContent = safeText(
    itinerary.summary,
    "Une première base à relire avant de vérifier les étapes et les réservations.",
  );
  elements.illustrationDestination.value = destination;
  updateIllustrationAvailability();
  renderNotes(itinerary);
  renderDays(itinerary.days);
  renderAccommodations(payload.accommodations || {});

  elements.tripResult.hidden = false;
  renderStatus(
    elements.tripStatus,
    "success",
    "Trajet prêt",
    "Le déroulé est affiché plus bas. Relis-le et vérifie chaque information sensible avant de réserver.",
  );
  elements.resultTitle.focus({ preventScroll: true });
  elements.tripResult.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
}

async function submitTrip() {
  if (state.tripPending || !serviceIsReady() || !validateTripForm()) return;
  state.tripPending = true;
  setButtonPending(elements.tripSubmit, true, "Je prépare le trajet…", "Préparer mon trajet");
  renderStatus(
    elements.tripStatus,
    "loading",
    "Préparation en cours",
    "Le service compose les étapes, les temps calmes et les solutions de repli.",
  );

  const payload = {
    brief: elements.brief.value.trim(),
    startDate: elements.startDate.value || null,
    endDate: elements.endDate.value || null,
    travelers: clampInteger(new FormData(elements.tripForm).get("travelers"), 1, 8, 2),
    pace: safeText(new FormData(elements.tripForm).get("pace"), "balanced"),
    ...(getAccessCode() ? { accessCode: getAccessCode() } : {}),
  };

  try {
    const response = await requestJson(
      "/api/itineraries",
      { method: "POST", body: JSON.stringify(payload) },
      90_000,
    );
    renderTrip(response);
  } catch (error) {
    const friendly = friendlyError(error, "trip");
    if (friendly.accessError) {
      elements.accessError.textContent = friendly.accessError;
      elements.accessCode.setAttribute("aria-invalid", "true");
      elements.accessCode.focus();
    }
    renderStatus(elements.tripStatus, friendly.kind, friendly.title, friendly.message, [
      { label: "Réessayer", run: () => elements.tripForm.requestSubmit() },
    ]);
  } finally {
    state.tripPending = false;
    setButtonPending(elements.tripSubmit, false, "Je prépare le trajet…", "Préparer mon trajet");
  }
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} Mo`;
  }
  return `${Math.ceil(bytes / 1024).toLocaleString("fr-FR")} Ko`;
}

function canvasBlob(canvas, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

function fileDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result), { once: true });
    reader.addEventListener("error", () => reject(new Error("read_failed")), { once: true });
    reader.readAsDataURL(blob);
  });
}

async function decodeImage(file) {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      return createImageBitmap(file);
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function reencodePhoto(file, maxBytes) {
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowedTypes.has(file.type)) throw new Error("unsupported_type");
  if (file.size > MAX_SOURCE_PHOTO_BYTES) throw new Error("source_too_large");

  const source = await decodeImage(file);
  const sourceWidth = source.width || source.naturalWidth;
  const sourceHeight = source.height || source.naturalHeight;
  if (!sourceWidth || !sourceHeight) throw new Error("decode_failed");

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("canvas_unavailable");

  let scale = Math.min(1, 1600 / Math.max(sourceWidth, sourceHeight));
  let blob = null;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    canvas.width = Math.max(320, Math.round(sourceWidth * scale));
    canvas.height = Math.max(320, Math.round(sourceHeight * scale));
    context.fillStyle = "#fffefb";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);

    const quality = Math.max(0.5, 0.86 - attempt * 0.055);
    blob = await canvasBlob(canvas, quality);
    if (blob?.type !== "image/webp") throw new Error("webp_unavailable");
    if (blob.size <= maxBytes) break;
    scale *= 0.84;
  }

  if (typeof source.close === "function") source.close();
  if (!blob || blob.size > maxBytes) throw new Error("encoded_too_large");

  const dataUrl = await fileDataUrl(blob);
  return {
    dataUrl,
    previewUrl: URL.createObjectURL(blob),
    name: safeText(file.name, "Photo"),
    bytes: blob.size,
  };
}

function resetConsent() {
  elements.photoConsent.checked = false;
  elements.consentError.textContent = "";
  elements.photoConsent.removeAttribute("aria-invalid");
}

function renderPhotos() {
  clearElement(elements.photoList);
  if (state.photos.length === 0) {
    elements.photoList.append(textElement("p", "photo-empty", "Aucune photo ajoutée."));
    return;
  }

  state.photos.forEach((photo, index) => {
    const item = document.createElement("div");
    item.className = "photo-item";
    const image = document.createElement("img");
    image.src = photo.previewUrl;
    image.alt = `Portrait ${index + 1}, ${formatBytes(photo.bytes)}`;
    const remove = textElement("button", "photo-remove", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", `Retirer le portrait ${index + 1}`);
    remove.addEventListener("click", () => {
      URL.revokeObjectURL(photo.previewUrl);
      state.photos.splice(index, 1);
      resetConsent();
      renderPhotos();
      elements.photoError.textContent = `${state.photos.length} photo${state.photos.length > 1 ? "s" : ""} prête${state.photos.length > 1 ? "s" : ""} sur cet appareil.`;
    });
    item.append(image, remove);
    elements.photoList.append(item);
  });
}

function photoErrorMessage(error) {
  const messages = {
    unsupported_type: "Choisis un fichier JPEG, PNG ou WebP.",
    source_too_large: "Une photo source dépasse 30 Mo. Choisis un fichier plus léger.",
    decode_failed: "Une photo ne peut pas être lue. Essaie avec un autre fichier.",
    canvas_unavailable: "Ce navigateur ne peut pas préparer les photos.",
    webp_unavailable: "Ce navigateur ne peut pas créer le WebP requis. Mets-le à jour, puis réessaie.",
    encoded_too_large: "Une photo reste trop lourde après préparation. Choisis un cadrage ou un fichier plus léger.",
    read_failed: "Une photo préparée ne peut pas être relue.",
  };
  return messages[error.message] || "Une photo n'a pas pu être préparée.";
}

async function addPhotos(fileList) {
  if (state.photoProcessing || !illustrationIsReady()) return;
  const files = Array.from(fileList || []);
  if (files.length === 0) return;

  const remaining = state.config.limits.maxPhotos - state.photos.length;
  if (remaining <= 0) {
    elements.photoError.textContent = `Retire une photo avant d'en ajouter une autre. Limite : ${state.config.limits.maxPhotos}.`;
    elements.photoInput.value = "";
    return;
  }

  const accepted = files.slice(0, remaining);
  const ignoredCount = files.length - accepted.length;
  state.photoProcessing = true;
  elements.photoInput.disabled = true;
  elements.photoError.textContent = "Préparation des photos sur cet appareil…";

  const errors = [];
  for (const file of accepted) {
    try {
      const photo = await reencodePhoto(file, state.config.limits.maxPhotoBytes);
      state.photos.push(photo);
    } catch (error) {
      errors.push(photoErrorMessage(error));
    }
  }

  resetConsent();
  renderPhotos();
  const details = [];
  if (state.photos.length > 0) {
    details.push(`${state.photos.length} photo${state.photos.length > 1 ? "s" : ""} prête${state.photos.length > 1 ? "s" : ""} sur cet appareil.`);
  }
  if (ignoredCount > 0) details.push(`${ignoredCount} fichier${ignoredCount > 1 ? "s" : ""} ignoré${ignoredCount > 1 ? "s" : ""}, la limite est atteinte.`);
  if (errors.length > 0) details.push(...new Set(errors));
  elements.photoError.textContent = details.join(" ");
  state.photoProcessing = false;
  elements.photoInput.disabled = false;
  elements.photoInput.value = "";
}

function validateIllustrationForm() {
  let firstInvalid = null;
  elements.illustrationFieldsError.textContent = "";
  elements.photoError.textContent = "";
  elements.consentError.textContent = "";
  elements.illustrationDestination.removeAttribute("aria-invalid");
  elements.illustrationScene.removeAttribute("aria-invalid");
  elements.photoConsent.removeAttribute("aria-invalid");

  if (elements.illustrationDestination.value.trim().length < 2) {
    elements.illustrationDestination.setAttribute("aria-invalid", "true");
    elements.illustrationFieldsError.textContent = "Précise la destination en au moins 2 caractères.";
    firstInvalid = elements.illustrationDestination;
  }

  if (elements.illustrationScene.value.trim().length < 10) {
    elements.illustrationScene.setAttribute("aria-invalid", "true");
    elements.illustrationFieldsError.textContent = `${elements.illustrationFieldsError.textContent} Décris la scène en au moins 10 caractères.`.trim();
    firstInvalid ||= elements.illustrationScene;
  }

  if (state.photos.length === 0) {
    elements.photoError.textContent = "Ajoute au moins une photo avant de créer le dessin.";
    firstInvalid ||= elements.photoInput;
  }

  if (!elements.photoConsent.checked) {
    elements.consentError.textContent = "Confirme les droits et les accords avant l'envoi.";
    elements.photoConsent.setAttribute("aria-invalid", "true");
    firstInvalid ||= elements.photoConsent;
  }

  if (firstInvalid) firstInvalid.focus();
  return firstInvalid === null;
}

function validImageDataUrl(value) {
  if (typeof value !== "string") return null;
  if (!/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\r\n]+$/i.test(value)) return null;
  return value;
}

async function submitIllustration() {
  if (state.illustrationPending || state.photoProcessing || !illustrationIsReady() || !validateIllustrationForm()) return;
  state.illustrationPending = true;
  setButtonPending(elements.illustrationSubmit, true, "Je crée le dessin…", "Créer le dessin");
  renderStatus(
    elements.illustrationStatus,
    "loading",
    "Dessin en cours",
    "Les portraits sont envoyés à OpenAI pour cette génération. Garde cette page ouverte.",
  );

  const payload = {
    destination: elements.illustrationDestination.value.trim(),
    scene: elements.illustrationScene.value.trim(),
    photos: state.photos.map((photo) => photo.dataUrl),
    consent: true,
    ...(getAccessCode() ? { accessCode: getAccessCode() } : {}),
  };

  try {
    const response = await requestJson(
      "/api/illustrations",
      { method: "POST", body: JSON.stringify(payload) },
      175_000,
    );
    const imageDataUrl = validImageDataUrl(response.imageDataUrl);
    if (!imageDataUrl) throw new RequestError(200, "invalid_response", "");

    elements.illustrationImage.src = imageDataUrl;
    elements.illustrationImage.alt = safeText(
      response.alt,
      `Projection personnalisée du voyage à ${elements.illustrationDestination.value.trim()}.`,
    );
    elements.illustrationResult.hidden = false;
    elements.illustrationResult.tabIndex = -1;
    renderStatus(
      elements.illustrationStatus,
      "success",
      "Dessin prêt",
      "La projection est affichée ci-dessous. Elle reste dans la mémoire de cette page.",
    );
    elements.illustrationResult.focus({ preventScroll: true });
    elements.illustrationResult.scrollIntoView({
      behavior: reducedMotion() ? "auto" : "smooth",
      block: "center",
    });
  } catch (error) {
    const friendly = friendlyError(error, "illustration");
    if (friendly.accessError) {
      elements.accessError.textContent = friendly.accessError;
      elements.accessCode.setAttribute("aria-invalid", "true");
    }
    renderStatus(elements.illustrationStatus, friendly.kind, friendly.title, friendly.message, [
      { label: "Réessayer", run: () => elements.illustrationForm.requestSubmit() },
    ]);
  } finally {
    state.illustrationPending = false;
    setButtonPending(elements.illustrationSubmit, false, "Je crée le dessin…", "Créer le dessin");
  }
}

function clearPhotos() {
  state.photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
  state.photos = [];
  elements.photoInput.value = "";
  elements.photoError.textContent = "";
  resetConsent();
  renderPhotos();
}

function startAnotherTrip() {
  const accessCode = elements.accessCode.value;
  elements.tripForm.reset();
  elements.accessCode.value = accessCode;
  elements.briefCount.textContent = "0 / 2 000";
  elements.briefError.textContent = "";
  elements.datesError.textContent = "";
  elements.accessError.textContent = "";
  elements.tripResult.hidden = true;
  hideStatus(elements.tripStatus);
  elements.illustrationForm.reset();
  elements.illustrationResult.hidden = true;
  elements.illustrationImage.src = "/assets/monflorian-logo.png";
  elements.illustrationImage.alt = "";
  hideStatus(elements.illustrationStatus);
  clearPhotos();
  updateIllustrationAvailability();
  elements.brief.focus({ preventScroll: true });
  elements.tripForm.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
}

elements.brief.addEventListener("input", updateBriefCount);
elements.accessCode.addEventListener("input", () => {
  elements.accessError.textContent = "";
  elements.accessCode.removeAttribute("aria-invalid");
});
elements.startDate.addEventListener("change", () => {
  elements.datesError.textContent = "";
  elements.startDate.removeAttribute("aria-invalid");
  elements.endDate.removeAttribute("aria-invalid");
});
elements.endDate.addEventListener("change", () => {
  elements.datesError.textContent = "";
  elements.startDate.removeAttribute("aria-invalid");
  elements.endDate.removeAttribute("aria-invalid");
});
elements.tripForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitTrip();
});
elements.photoInput.addEventListener("change", (event) => addPhotos(event.target.files));
elements.photoConsent.addEventListener("change", () => {
  elements.consentError.textContent = "";
  elements.photoConsent.removeAttribute("aria-invalid");
});
elements.illustrationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitIllustration();
});
elements.printButton.addEventListener("click", () => window.print());
elements.newTripButton.addEventListener("click", startAnotherTrip);
window.addEventListener("pagehide", clearPhotos, { once: true });

renderPhotos();
chooseFlorianVariant();
loadConfig();
