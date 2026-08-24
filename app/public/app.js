"use strict";

const DEFAULT_LIMITS = Object.freeze({
  maxPhotos: 4,
  maxPhotoBytes: 1_500_000,
  maxTripDays: 14,
});

const MAX_SOURCE_PHOTO_BYTES = 30 * 1024 * 1024;
const state = {
  config: null,
  idempotencyKey: null,
  pending: false,
  photoProcessing: false,
  photos: [],
  turnstileToken: null,
  turnstileWidgetId: null,
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
  email: document.querySelector("#email"),
  emailError: document.querySelector("#email-error"),
  accessField: document.querySelector("#access-field"),
  accessCode: document.querySelector("#access-code"),
  accessError: document.querySelector("#access-error"),
  photoInput: document.querySelector("#trip-photo-input"),
  photoHelp: document.querySelector("#trip-photo-help"),
  photoList: document.querySelector("#trip-photo-list"),
  photoError: document.querySelector("#trip-photo-error"),
  photoConsent: document.querySelector("#trip-photo-consent"),
  consentError: document.querySelector("#trip-consent-error"),
  turnstileField: document.querySelector("#turnstile-field"),
  turnstileWidget: document.querySelector("#turnstile-widget"),
  turnstileError: document.querySelector("#turnstile-error"),
};

class RequestError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "RequestError";
    this.status = status;
    this.code = code;
  }
}

function safeText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, 5_000) || fallback;
}

function clampInteger(value, minimum, maximum, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(maximum, Math.max(minimum, number));
}

function clearElement(element) {
  while (element.firstChild) element.firstChild.remove();
}

function textElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = safeText(text);
  return element;
}

function renderStatus(element, kind, title, message) {
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
  element.append(copy);
  element.hidden = false;
}

function hideStatus(element) {
  element.hidden = true;
  clearElement(element);
}

function setLaunchLabel(label, available) {
  elements.launchState.lastChild.textContent = ` ${label}`;
  elements.launchState.classList.toggle("is-unavailable", !available);
}

function accessCodeIsRequired() {
  return safeText(state.config?.accessMode, "private") !== "public";
}

function serviceIsReady() {
  return state.config?.tripCreationEnabled === true && Boolean(state.config?.turnstileSiteKey);
}

function updateSubmitState() {
  elements.tripSubmit.disabled =
    !serviceIsReady() ||
    state.pending ||
    state.photoProcessing ||
    !state.turnstileToken;
  elements.tripSubmit.setAttribute("aria-busy", String(state.pending));
}

function updateBriefCount() {
  const length = elements.brief.value.length;
  elements.briefCount.textContent = `${length.toLocaleString("fr-FR")} / 2 000`;
  elements.briefError.textContent = "";
  elements.brief.removeAttribute("aria-invalid");
}

function normalizeConfig(payload) {
  const limits = payload?.limits || {};
  return {
    accessMode: safeText(payload?.accessMode, "private"),
    tripCreationEnabled: payload?.tripCreationEnabled === true,
    turnstileSiteKey: safeText(payload?.turnstileSiteKey),
    limits: {
      maxPhotos: clampInteger(limits.maxPhotos, 1, 4, DEFAULT_LIMITS.maxPhotos),
      maxPhotoBytes: clampInteger(limits.maxPhotoBytes, 100_000, 3_000_000, DEFAULT_LIMITS.maxPhotoBytes),
      maxTripDays: clampInteger(limits.maxTripDays, 1, 30, DEFAULT_LIMITS.maxTripDays),
    },
  };
}

async function requestJson(url, options = {}, timeoutMs = 20_000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: controller.signal,
    });
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      if (response.status !== 204) throw new RequestError(response.status, "invalid_response", "");
    }
    if (!response.ok) {
      throw new RequestError(
        response.status,
        safeText(payload?.error?.code, "request_failed"),
        safeText(payload?.error?.message),
      );
    }
    return payload;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new RequestError(504, "request_timeout", "");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function friendlyError(error) {
  if (error instanceof RequestError) {
    if (error.status === 401) {
      return {
        title: "Code d’accès refusé",
        message: "Vérifie le code reçu avec ton invitation.",
        accessError: "Le code d’accès est absent ou incorrect.",
      };
    }
    if (error.status === 403) {
      return {
        title: "Demande refusée",
        message: "Recharge cette page depuis monflorian.com avant de réessayer.",
      };
    }
    if (error.status === 429) {
      return {
        title: "Limite du jour atteinte",
        message: "Le service gratuit a atteint sa limite. Réessaie demain.",
      };
    }
    if ([400, 413, 415].includes(error.status) && error.message) {
      return { title: "Demande à corriger", message: error.message };
    }
    if (error.status === 503) {
      return {
        title: "Préparation indisponible",
        message: "La demande n’a pas été envoyée. Réessaie lorsque le service sera ouvert.",
      };
    }
  }
  return {
    title: "La demande n’a pas abouti",
    message: "Aucune nouvelle soumission n’est lancée automatiquement. Tu peux réessayer avec le même formulaire.",
  };
}

function renderClosedConfiguration() {
  setLaunchLabel("Préparation fermée", false);
  elements.configStatus.className = "notice notice-unavailable";
  elements.configStatus.innerHTML = "<div><strong>Préparation temporairement indisponible</strong><p>Le formulaire reste visible, mais aucune demande ni photo ne sera envoyée pour le moment.</p></div>";
  elements.photoInput.disabled = true;
  elements.turnstileField.hidden = true;
  updateSubmitState();
}

function renderOpenConfiguration() {
  setLaunchLabel("Préparation ouverte", true);
  elements.configStatus.className = "notice notice-ready";
  elements.configStatus.innerHTML = "<div><strong>Préparation disponible</strong><p>Tu recevras un lien privé dès que le voyage sera prêt.</p></div>";
  elements.photoInput.disabled = false;
  elements.turnstileField.hidden = false;
  loadTurnstile();
}

async function loadConfig() {
  try {
    const response = await requestJson("/api/config", { method: "GET", headers: {} }, 8_000);
    state.config = normalizeConfig(response);
    elements.accessField.hidden = !accessCodeIsRequired();
    elements.accessCode.required = accessCodeIsRequired();
    elements.photoHelp.textContent = `Jusqu’à ${state.config.limits.maxPhotos} photos. JPEG, PNG ou WebP, ${formatBytes(state.config.limits.maxPhotoBytes)} après préparation.`;
    if (serviceIsReady()) renderOpenConfiguration();
    else renderClosedConfiguration();
  } catch {
    state.config = normalizeConfig(null);
    elements.accessField.hidden = false;
    elements.accessCode.required = true;
    setLaunchLabel("Service non vérifié", false);
    elements.configStatus.className = "notice notice-unavailable";
    elements.configStatus.innerHTML = "<div><strong>Service non vérifié</strong><p>La configuration ne répond pas. Aucune demande ne sera envoyée.</p></div>";
    elements.photoInput.disabled = true;
    updateSubmitState();
  }
}

function renderTurnstile() {
  if (!serviceIsReady() || !window.turnstile || state.turnstileWidgetId !== null) return;
  state.turnstileWidgetId = window.turnstile.render(elements.turnstileWidget, {
    sitekey: state.config.turnstileSiteKey,
    action: "create-trip",
    callback(token) {
      state.turnstileToken = token;
      elements.turnstileError.textContent = "";
      updateSubmitState();
    },
    "expired-callback"() {
      state.turnstileToken = null;
      elements.turnstileError.textContent = "La vérification a expiré. Confirme-la à nouveau.";
      updateSubmitState();
    },
    "error-callback"() {
      state.turnstileToken = null;
      elements.turnstileError.textContent = "La vérification ne peut pas se charger pour le moment.";
      updateSubmitState();
    },
  });
}

function loadTurnstile() {
  if (window.turnstile) {
    renderTurnstile();
    return;
  }
  const existing = document.querySelector("script[data-turnstile]");
  if (existing) return;
  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.async = true;
  script.defer = true;
  script.dataset.turnstile = "true";
  script.addEventListener("load", renderTurnstile, { once: true });
  script.addEventListener("error", () => {
    elements.turnstileError.textContent = "La vérification ne peut pas se charger pour le moment.";
  }, { once: true });
  document.head.append(script);
}

function resetTurnstile() {
  state.turnstileToken = null;
  if (window.turnstile && state.turnstileWidgetId !== null) {
    window.turnstile.reset(state.turnstileWidgetId);
  }
  updateSubmitState();
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
  if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
    throw new Error("unsupported_type");
  }
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
    blob = await canvasBlob(canvas, Math.max(0.5, 0.86 - attempt * 0.055));
    if (blob?.type !== "image/webp") throw new Error("webp_unavailable");
    if (blob.size <= maxBytes) break;
    scale *= 0.84;
  }
  if (typeof source.close === "function") source.close();
  if (!blob || blob.size > maxBytes) throw new Error("encoded_too_large");
  return {
    dataUrl: await fileDataUrl(blob),
    previewUrl: URL.createObjectURL(blob),
    bytes: blob.size,
  };
}

function photoErrorMessage(error) {
  const messages = {
    unsupported_type: "Choisis un fichier JPEG, PNG ou WebP.",
    source_too_large: "Une photo source dépasse 30 Mo. Choisis un fichier plus léger.",
    decode_failed: "Une photo ne peut pas être lue. Essaie avec un autre fichier.",
    canvas_unavailable: "Ce navigateur ne peut pas préparer les photos.",
    webp_unavailable: "Ce navigateur ne peut pas créer le WebP requis.",
    encoded_too_large: "Une photo reste trop lourde après préparation.",
    read_failed: "Une photo préparée ne peut pas être relue.",
  };
  return messages[error.message] || "Une photo n’a pas pu être préparée.";
}

function clearConsentError() {
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
      state.idempotencyKey = null;
      elements.photoConsent.checked = false;
      clearConsentError();
      renderPhotos();
      elements.photoError.textContent = `${state.photos.length} photo${state.photos.length > 1 ? "s" : ""} prête${state.photos.length > 1 ? "s" : ""}.`;
    });
    item.append(image, remove);
    elements.photoList.append(item);
  });
}

async function addPhotos(fileList) {
  if (!serviceIsReady() || state.photoProcessing) return;
  const files = Array.from(fileList || []);
  if (!files.length) return;
  const remaining = state.config.limits.maxPhotos - state.photos.length;
  if (remaining <= 0) {
    elements.photoError.textContent = `La limite de ${state.config.limits.maxPhotos} photos est atteinte.`;
    elements.photoInput.value = "";
    return;
  }
  state.photoProcessing = true;
  state.idempotencyKey = null;
  elements.photoInput.disabled = true;
  elements.photoError.textContent = "Préparation des photos sur cet appareil…";
  updateSubmitState();
  const errors = [];
  for (const file of files.slice(0, remaining)) {
    try {
      state.photos.push(await reencodePhoto(file, state.config.limits.maxPhotoBytes));
    } catch (error) {
      errors.push(photoErrorMessage(error));
    }
  }
  elements.photoConsent.checked = false;
  clearConsentError();
  renderPhotos();
  const prepared = state.photos.length
    ? `${state.photos.length} photo${state.photos.length > 1 ? "s" : ""} prête${state.photos.length > 1 ? "s" : ""}.`
    : "";
  elements.photoError.textContent = [prepared, ...new Set(errors)].filter(Boolean).join(" ");
  state.photoProcessing = false;
  elements.photoInput.disabled = false;
  elements.photoInput.value = "";
  updateSubmitState();
}

function validateForm() {
  let firstInvalid = null;
  for (const [element, errorElement] of [
    [elements.brief, elements.briefError],
    [elements.email, elements.emailError],
    [elements.accessCode, elements.accessError],
  ]) {
    element.removeAttribute("aria-invalid");
    errorElement.textContent = "";
  }
  elements.startDate.removeAttribute("aria-invalid");
  elements.endDate.removeAttribute("aria-invalid");
  elements.datesError.textContent = "";
  clearConsentError();
  elements.turnstileError.textContent = "";

  const briefLength = elements.brief.value.trim().length;
  if (briefLength < 20 || briefLength > 2_000) {
    elements.brief.setAttribute("aria-invalid", "true");
    elements.briefError.textContent = "Décris ton envie en 20 à 2 000 caractères.";
    firstInvalid = elements.brief;
  }
  if (!elements.email.validity.valid) {
    elements.email.setAttribute("aria-invalid", "true");
    elements.emailError.textContent = "Indique une adresse de courriel valide.";
    firstInvalid ||= elements.email;
  }
  if (Boolean(elements.startDate.value) !== Boolean(elements.endDate.value)) {
    elements.startDate.setAttribute("aria-invalid", "true");
    elements.endDate.setAttribute("aria-invalid", "true");
    elements.datesError.textContent = "Indique les deux dates, ou laisse les deux champs vides.";
    firstInvalid ||= elements.startDate;
  } else if (elements.startDate.value && elements.endDate.value < elements.startDate.value) {
    elements.startDate.setAttribute("aria-invalid", "true");
    elements.endDate.setAttribute("aria-invalid", "true");
    elements.datesError.textContent = "La date de retour doit suivre la date de départ.";
    firstInvalid ||= elements.endDate;
  }
  if (state.photos.length > 0 && !elements.photoConsent.checked) {
    elements.photoConsent.setAttribute("aria-invalid", "true");
    elements.consentError.textContent = "Confirme les droits et les accords avant l’envoi des photos.";
    firstInvalid ||= elements.photoConsent;
  }
  if (accessCodeIsRequired() && !elements.accessCode.value.trim()) {
    elements.accessCode.setAttribute("aria-invalid", "true");
    elements.accessError.textContent = "Indique le code reçu avec ton invitation.";
    firstInvalid ||= elements.accessCode;
  }
  if (!state.turnstileToken) {
    elements.turnstileError.textContent = "Confirme que la demande vient bien de toi.";
    firstInvalid ||= elements.turnstileWidget;
  }
  if (firstInvalid?.focus) firstInvalid.focus();
  return firstInvalid === null;
}

function validPrivateUrl(value) {
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (!/^\/voyages\/[A-Za-z0-9_-]{43}$/u.test(url.pathname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

async function submitTrip() {
  if (state.pending || !serviceIsReady() || !validateForm()) return;
  state.pending = true;
  state.idempotencyKey ||= crypto.randomUUID();
  const label = elements.tripSubmit.querySelector(".button-label");
  if (label) label.textContent = "J’enregistre la demande…";
  updateSubmitState();
  renderStatus(
    elements.tripStatus,
    "loading",
    "Enregistrement en cours",
    "Les photos sont stockées en privé avant le démarrage de la préparation.",
  );

  const formData = new FormData(elements.tripForm);
  const payload = {
    brief: elements.brief.value.trim(),
    startDate: elements.startDate.value || null,
    endDate: elements.endDate.value || null,
    travelers: clampInteger(formData.get("travelers"), 1, 8, 2),
    pace: safeText(formData.get("pace"), "balanced"),
    email: elements.email.value.trim(),
    photos: state.photos.map((photo) => photo.dataUrl),
    photoConsent: state.photos.length > 0 && elements.photoConsent.checked,
    turnstileToken: state.turnstileToken,
  };

  try {
    const response = await requestJson("/api/trips", {
      method: "POST",
      headers: {
        "Idempotency-Key": state.idempotencyKey,
        ...(elements.accessCode.value.trim()
          ? { "X-Monflorian-Access-Code": elements.accessCode.value.trim() }
          : {}),
      },
      body: JSON.stringify(payload),
    });
    const privateUrl = validPrivateUrl(response?.privateUrl);
    if (!privateUrl) throw new RequestError(200, "invalid_response", "");
    renderStatus(
      elements.tripStatus,
      "success",
      "Demande enregistrée",
      "La page privée va s’ouvrir. Tu pourras la fermer et revenir avec le même lien.",
    );
    window.location.assign(privateUrl);
  } catch (error) {
    const friendly = friendlyError(error);
    if (friendly.accessError) {
      elements.accessCode.setAttribute("aria-invalid", "true");
      elements.accessError.textContent = friendly.accessError;
      elements.accessCode.focus();
    }
    renderStatus(elements.tripStatus, "error", friendly.title, friendly.message);
    resetTurnstile();
  } finally {
    state.pending = false;
    if (label) label.textContent = "Préparer mon voyage";
    updateSubmitState();
  }
}

function clearPhotos() {
  state.photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
  state.photos = [];
}

elements.brief.addEventListener("input", () => {
  state.idempotencyKey = null;
  updateBriefCount();
});
elements.tripForm.addEventListener("input", (event) => {
  if (event.target !== elements.brief) state.idempotencyKey = null;
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
elements.email.addEventListener("input", () => {
  elements.emailError.textContent = "";
  elements.email.removeAttribute("aria-invalid");
});
elements.accessCode.addEventListener("input", () => {
  elements.accessError.textContent = "";
  elements.accessCode.removeAttribute("aria-invalid");
});
elements.photoInput.addEventListener("change", (event) => addPhotos(event.target.files));
elements.photoConsent.addEventListener("change", clearConsentError);
elements.tripForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitTrip();
});
window.addEventListener("pagehide", clearPhotos, { once: true });

renderPhotos();
loadConfig();
