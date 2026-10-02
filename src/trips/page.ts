const PRIVATE_PAGE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Security-Policy": "default-src 'self'; img-src 'self'; style-src 'self'; form-action 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  "Content-Type": "text/html; charset=utf-8",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} as const;

interface PrivateTripPageOptions {
  status: string;
  token: string;
  expiresAt: number;
  result?: unknown;
  deleted?: boolean;
  notificationStatus?: string;
  errorCode?: string | null;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function formatExpiry(expiresAt: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeZone: "Europe/Paris",
  }).format(new Date(expiresAt));
}

function renderChecklist(title: string, items: unknown): string {
  if (!Array.isArray(items) || items.length === 0) return "";
  const entries = items
    .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    .slice(0, 10)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  if (!entries) return "";
  return `<section class="private-trip-section"><h2>${escapeHtml(title)}</h2><ul class="private-trip-checklist">${entries}</ul></section>`;
}

function renderDays(days: unknown): string {
  if (!Array.isArray(days)) return "";
  const entries = days.slice(0, 14).map((rawDay, index) => {
    const day = objectValue(rawDay);
    if (!day) return "";
    const moments = Array.isArray(day.moments)
      ? day.moments.slice(0, 3).map((rawMoment) => {
          const moment = objectValue(rawMoment);
          if (!moment) return "";
          return `<li><strong>${escapeHtml(text(moment.period))} · ${escapeHtml(text(moment.title, "Étape"))}</strong><p>${escapeHtml(text(moment.description))}</p><p>${escapeHtml(text(moment.duration))}${moment.bookingRequired ? ' · Réservation à prévoir' : ''}</p><details><summary>Si la météo ou l’énergie changent</summary><p><strong>S’il pleut :</strong> ${escapeHtml(text(moment.rainAlternative))}</p><p><strong>Si tu es fatigué :</strong> ${escapeHtml(text(moment.fatigueAlternative))}</p></details></li>`;
        }).join("")
      : "";
    return `<article class="private-trip-day">
      <p class="result-kicker">Jour ${index + 1}${day.date ? ` · ${escapeHtml(day.date)}` : ""}</p>
      <h2>${escapeHtml(text(day.title, text(day.base, "Étape du voyage")))}</h2>
      <p>${escapeHtml(text(day.summary))}</p>
      ${moments ? `<ol>${moments}</ol>` : ""}
      ${sourceLinks(day.sourceIds)}
      ${day.transfer ? `<p class="private-trip-transfer"><strong>Trajet :</strong> ${escapeHtml(day.transfer)}</p>` : ""}
    </article>`;
  }).join("");
  return entries ? `<section class="private-trip-itinerary" aria-labelledby="itinerary-title"><h2 id="itinerary-title">Ton itinéraire</h2>${entries}</section>` : "";
}

function renderBooking(items: unknown): string {
  if (!Array.isArray(items)) return "";
  const links = items.slice(0, 14).map((rawItem) => {
    const item = objectValue(rawItem);
    if (!item || typeof item.url !== "string") return "";
    let url: URL;
    try {
      url = new URL(item.url);
    } catch {
      return "";
    }
    if (url.protocol !== "https:" || url.username || url.password || !(url.hostname === "booking.com" || url.hostname.endsWith(".booking.com"))) return "";
    return `<li>${item.name ? `<h3>${escapeHtml(item.name)}</h3>` : ""}${item.area ? `<p>${escapeHtml(item.area)}</p>` : ""}${item.why ? `<p>${escapeHtml(item.why)}</p>` : ""}${item.tradeoff ? `<p><strong>À peser :</strong> ${escapeHtml(item.tradeoff)}</p>` : ""}${sourceLinks(item.sourceIds)}<a href="${escapeHtml(url.toString())}" rel="noopener noreferrer${item.affiliate === true ? " sponsored" : ""}">${escapeHtml(text(item.label, "Vérifier sur Booking.com"))}</a>${renderChecklist("Avant de réserver", item.checkBeforeBooking)}</li>`;
  }).join("");
  return links ? `<section class="private-trip-section"><h2 id="hotels">Les hôtels à comparer</h2><p>Ces choix correspondent à ton séjour. Vérifie le tarif final, la disponibilité et les conditions aux dates choisies.</p><ul class="private-trip-links">${links}</ul></section>` : "";
}

function renderGeneratedImages(items: unknown, token: string): string {
  if (!Array.isArray(items)) return "";
  const figures = items.slice(0, 4).map((rawItem) => {
    const item = objectValue(rawItem);
    const position = typeof item?.position === "number" ? item.position : -1;
    if (!Number.isInteger(position) || position < 0 || position > 15) return "";
    const alt = text(item?.alt, "Projection personnalisée du voyage");
    return `<figure class="private-trip-image">
      <img src="/api/trips/${escapeHtml(token)}/media/${position}" alt="${escapeHtml(alt)}">
      <figcaption><strong>Projection personnalisée · image générée</strong><span>Cette scène est une illustration, pas une photo du lieu.</span></figcaption>
    </figure>`;
  }).join("");
  return figures
    ? `<section class="private-trip-images" aria-labelledby="images-title"><h2 id="images-title">Une scène du voyage</h2>${figures}</section>`
    : "";
}

function sourceLinks(ids: unknown): string {
  if (!Array.isArray(ids)) return "";
  return `<p class="private-trip-source-links">${ids.filter((id) => typeof id === "string" && /^[a-zA-Z0-9_-]{1,50}$/.test(id)).map((id, index) => `<a href="#source-${escapeHtml(id)}">Source ${index + 1}</a>`).join(" · ")}</p>`;
}

function safePublicUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes(".") || url.hostname === "localhost") return null;
    return url.toString();
  } catch { return null; }
}

function renderSources(researchValue: unknown): string {
  const research = objectValue(researchValue);
  if (!Array.isArray(research?.sources) || !research.sources.length) return "";
  return `<section class="private-trip-section" id="sources"><h2>Les sources consultées</h2><p>Recherche du ${escapeHtml(text(research.researchedAt).slice(0, 10))}. Un site consulté ne garantit pas une disponibilité au moment de réserver.</p><ol>${research.sources.slice(0, 30).map((raw) => {
    const source = objectValue(raw);
    const url = safePublicUrl(source?.url);
    if (!url) return "";
    return `<li id="source-${escapeHtml(source?.id)}"><a href="${escapeHtml(url)}" rel="noopener noreferrer">${escapeHtml(text(source?.title, new URL(url).hostname))}</a></li>`;
  }).join("")}</ol></section>`;
}

function renderTransport(items: unknown): string {
  if (!Array.isArray(items) || !items.length) return "";
  return `<section class="private-trip-section" id="transport"><h2>Comment y aller</h2><p>Compare le prix total, les bagages, les horaires et les conditions avant de réserver.</p>${items.map((raw) => {
    const item = objectValue(raw);
    if (!item) return "";
    const searchUrl = safePublicUrl(item.searchUrl);
    return `<article class="private-trip-option"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.from)} → ${escapeHtml(item.to)}</p><p>${escapeHtml(item.why)}</p><p>${escapeHtml(item.durationEstimate)}</p><p><strong>À peser :</strong> ${escapeHtml(item.tradeoff)}</p><p>${escapeHtml(item.bookingAdvice)}</p>${sourceLinks(item.sourceIds)}${searchUrl ? `<a href="${escapeHtml(searchUrl)}" rel="noopener noreferrer">Comparer les options de trajet</a>` : ""}</article>`;
  }).join("")}</section>`;
}

function renderBudget(value: unknown): string {
  const budget = objectValue(value);
  if (!budget) return "";
  return `<section class="private-trip-section" id="budget"><h2>Ton budget et les compromis</h2><p>${budget.totalEur ? `${escapeHtml(budget.totalEur)} € pour le séjour. ` : ""}${escapeHtml(budget.scope)}</p>${Array.isArray(budget.allocations) ? `<ul>${budget.allocations.map((raw) => { const item = objectValue(raw); return item ? `<li><strong>${escapeHtml(item.category)} · ${escapeHtml(item.sharePercent)} %</strong><p>${escapeHtml(item.advice)}</p></li>` : ""; }).join("")}</ul>` : ""}${renderChecklist("Les arbitrages", budget.tradeoffs)}</section>`;
}

function renderReady(result: unknown, token: string): string {
  const root = objectValue(result);
  const itinerary = objectValue(root?.itinerary ?? result);
  if (!itinerary) {
    return renderStateSection({
      ...renderState("failed"),
      title: "Ton carnet ne peut pas être affiché",
      body: "Le lien est reconnu, mais son contenu n’est pas lisible pour le moment.",
      guidance: "Contacte-nous pour signaler le problème, sans envoyer ton lien privé ni tes photos.",
    });
  }
  const booking = objectValue(root?.accommodationSuggestions);
  return `<header class="private-trip-hero">
      <p class="result-kicker">Ton carnet privé · Bêta gratuite</p>
      <h1>${escapeHtml(text(itinerary.title, "Ta proposition de voyage"))}</h1>
      <p>${escapeHtml(text(itinerary.summary))}</p>
    </header>
    ${itinerary.florianNote ? `<aside class="private-trip-note"><strong>Le point de Florian</strong><p>${escapeHtml(itinerary.florianNote)}</p></aside>` : ""}
    <nav class="private-trip-nav" aria-label="Dans ton carnet"><a href="#itinerary-title">Jour par jour</a><a href="#hotels">Hôtels</a><a href="#budget">Budget</a><a href="#sources">Sources</a></nav>
    <div class="private-trip-actions" hidden data-trip-actions><button type="button" data-print-trip>Imprimer le carnet</button><button type="button" data-save-trip>Garder mon carnet hors connexion</button></div><p role="status" data-trip-feedback></p>
    ${root?.illustrationStatus === "failed" ? '<p class="private-trip-notice">Ton itinéraire est prêt. L’illustration n’a pas pu être créée ; tes photos sources ont été supprimées. Besoin d’aide ? <a href="mailto:support@monflorian.com">support@monflorian.com</a>.</p>' : ""}
    ${renderChecklist("Les hypothèses de ce voyage", itinerary.assumptions)}
    ${renderGeneratedImages(root?.generatedImages, token)}
    ${renderTransport(itinerary.transportOptions)}
    ${renderDays(itinerary.days)}
    ${renderChecklist("À réserver", itinerary.reservationChecklist)}
    ${renderChecklist("À vérifier", itinerary.verificationChecklist)}
    ${renderBooking(booking?.items)}
    ${renderBudget(itinerary.budget)}
    ${Array.isArray(itinerary.practicalAdvice) ? itinerary.practicalAdvice.map((raw) => { const item = objectValue(raw); return item ? `<section class="private-trip-section"><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.advice)}</p>${sourceLinks(item.sourceIds)}</section>` : ""; }).join("") : ""}
    ${renderSources(itinerary.research)}`;
}

interface TripPageState {
  title: string;
  body: string;
  guidance?: string;
  illustration: "lost" | "repair" | "waiting" | "limit" | "expired" | "deleted";
  actionLabel: string;
  actionHref: string;
  refresh: boolean;
}

function renderState(status: string, errorCode?: string | null): TripPageState {
  const defaults = { actionLabel: "Préparer un autre voyage", actionHref: "/#create", refresh: false };
  if (["pending", "queued", "generating_itinerary", "generating_images"].includes(status)) {
    return {
      ...defaults,
      title: "Ton voyage se prépare",
      body: "Garde ce lien privé pour revenir à ton carnet. Cette page se met à jour pendant la recherche et la préparation de ton itinéraire.",
      guidance: "Tu peux consulter un exemple pendant la préparation.",
      illustration: "waiting",
      actionLabel: "Voir le carnet Japon",
      actionHref: "/carnets/japon-10-jours",
      refresh: true,
    };
  }
  if (status === "deleting") {
    return {
      ...defaults,
      title: "La suppression est en cours",
      body: "Ton carnet n’est plus accessible. Le nettoyage des images doit encore se terminer.",
      guidance: "Cette page se met à jour. Si cet état persiste, contacte-nous sans joindre ton lien privé.",
      illustration: "waiting",
      actionLabel: "Revenir à l’accueil",
      actionHref: "/",
      refresh: true,
    };
  }
  if (status === "expired") {
    return {
      ...defaults,
      title: "Ce carnet a expiré",
      body: "Sa durée de conservation est terminée. Le carnet et ses images ont été supprimés du service.",
      guidance: "Si tu as gardé une copie hors connexion, elle reste lisible sur ton appareil. Sinon, tu peux préparer un nouveau voyage.",
      illustration: "expired",
    };
  }
  if (status === "deleted") {
    return {
      ...defaults,
      title: "Ce carnet a été supprimé",
      body: "Le carnet et ses images ont été retirés du service. Ce lien ne permet plus de les retrouver.",
      guidance: "Une copie téléchargée reste sur ton appareil jusqu’à ce que tu la supprimes toi-même.",
      illustration: "deleted",
    };
  }
  if (errorCode === "CONTENT_BLOCKED") {
    return {
      ...defaults,
      title: "Ce brief n’a pas pu être traité",
      body: "Le service de composition n’a pas pu traiter le contenu de cette demande. Aucun carnet n’a été créé.",
      guidance: "Tu peux reformuler tes envies de voyage. Si tu ne comprends pas le refus, contacte-nous.",
      illustration: "repair",
      actionLabel: "Reformuler ma demande",
    };
  }
  if (errorCode === "QUOTA_EXCEEDED") {
    return {
      ...defaults,
      title: "La limite du jour est atteinte",
      body: "Le nombre de créations gratuites disponibles pour aujourd’hui a été atteint. Ce carnet n’a pas été préparé.",
      guidance: "Reviens un autre jour pour créer ton voyage. Tu peux déjà parcourir le carnet d’exemple.",
      illustration: "limit",
      actionLabel: "Voir le carnet Japon",
      actionHref: "/carnets/japon-10-jours",
    };
  }
  if (errorCode === "PROVIDER_RATE_LIMIT") {
    return {
      ...defaults,
      title: "Le service est très sollicité",
      body: "La préparation a été interrompue par un trop grand nombre de demandes. Ce carnet ne sera pas relancé automatiquement.",
      guidance: "Tu peux réessayer de créer un voyage dans quelques minutes, avec les mêmes envies.",
      illustration: "waiting",
      actionLabel: "Revenir au formulaire",
    };
  }
  if (["PROVIDER_CONFIGURATION", "TRIP_CREATION_UNAVAILABLE", "GENERATION_UNAVAILABLE", "SERVICE_NOT_CONFIGURED"].includes(errorCode || "")) {
    return {
      ...defaults,
      title: "La création est indisponible",
      body: "Le service de composition doit être rétabli avant de pouvoir préparer ton carnet.",
      guidance: "Ton brief n’a pas besoin d’être corrigé. Tu peux nous contacter pour signaler le problème.",
      illustration: "repair",
      actionLabel: "Voir le carnet Japon",
      actionHref: "/carnets/japon-10-jours",
    };
  }
  return {
    ...defaults,
    title: "Ton carnet n’a pas pu être préparé",
    body: "La préparation s’est arrêtée avant de produire un carnet complet. Elle ne reprendra pas automatiquement.",
    guidance: "Tes envies ne sont pas en cause. Tu peux réessayer plus tard ou nous contacter si le problème persiste.",
    illustration: "repair",
    actionLabel: "Revenir au formulaire",
  };
}

function renderStateSection(state: TripPageState): string {
  return `<section class="private-trip-state error-state error-state--${state.illustration}" aria-labelledby="trip-state-title" ${state.refresh ? 'aria-busy="true"' : ""}>
    <img class="error-state-art" src="/assets/errors/florian-${state.illustration}.webp" width="360" height="360" alt="">
    <div class="error-state-copy"><h1 id="trip-state-title">${escapeHtml(state.title)}</h1>
    <p>${escapeHtml(state.body)}</p>
    ${state.guidance ? `<p class="error-state-guidance">${escapeHtml(state.guidance)}</p>` : ""}
    <div class="error-state-actions"><a class="primary-button" href="${escapeHtml(state.actionHref)}">${escapeHtml(state.actionLabel)}</a>${state.actionHref !== "/" ? '<a class="error-state-secondary" href="/">Revenir à l’accueil</a>' : ""}</div>
    <p class="error-state-support">Besoin d’aide ? <a href="mailto:support@monflorian.com">support@monflorian.com</a><span>Ne joins pas ton lien privé ni tes photos à ton message.</span></p></div>
  </section>`;
}

export function renderPrivateTripPage(options: PrivateTripPageOptions): Response {
  const expectsResult = ["ready", "generating_images"].includes(options.status);
  const root = objectValue(options.result);
  const itinerary = objectValue(root?.itinerary ?? options.result);
  const readableResult = Array.isArray(itinerary?.days) && itinerary.days.length > 0;
  const state = expectsResult && !readableResult && (options.status === "ready" || options.result) && !options.deleted
    ? { ...renderState("failed"), title: "Ton carnet ne peut pas être affiché", body: "Le lien est reconnu, mais son contenu n’est pas lisible pour le moment.", guidance: "Contacte-nous pour signaler le problème, sans envoyer ton lien privé ni tes photos." }
    : renderState(options.deleted ? "deleted" : options.status, options.errorCode);
  const isReady = expectsResult && readableResult && !options.deleted;
  const refresh = options.status !== "ready" && state.refresh ? '<meta http-equiv="refresh" content="10">' : "";
  const content = isReady
    ? `${options.status === "generating_images" ? '<p class="private-trip-notice" role="status">Ton itinéraire est prêt. Ton illustration se prépare ; tu peux déjà lire le carnet.</p>' : ""}<div data-trip-export data-trip-export-state="${escapeHtml(options.status)}">${renderReady(options.result, options.token)}</div>`
    : renderStateSection(state);
  const canDelete = !options.deleted && !["deleted", "expired", "deleting"].includes(options.status);
  const deletion = canDelete
    ? `<details class="private-trip-delete"><summary>Supprimer mon carnet et ses images</summary><p>Cette suppression est définitive. Enregistre ton carnet avant de continuer.</p><form method="post" action="/voyages/${escapeHtml(options.token)}/supprimer">
        <button type="submit">Supprimer cette proposition</button>
      </form></details>`
    : "";

  return new Response(`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">
    <meta property="og:type" content="website">
    <meta property="og:title" content="Voyage privé · Mon Florian">
    <meta property="og:description" content="Ce lien ouvre une proposition privée Mon Florian. Ne le transfère pas.">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="Voyage privé · Mon Florian">
    <meta name="twitter:description" content="Ce lien ouvre une proposition privée Mon Florian. Ne le transfère pas.">
    ${refresh}
    <title>Voyage privé · Mon Florian</title>
    <link rel="stylesheet" href="/styles.css?v=intro-full-1">
    <link rel="stylesheet" href="/trip.css">
    ${isReady ? "" : '<link rel="stylesheet" href="/error.css">'}
    <script src="/trip.js" defer></script>
  </head>
  <body class="private-trip-page${isReady ? "" : " error-page"}">
    <header class="private-trip-brand"><a href="/" aria-label="Revenir à l’accueil de Mon Florian"><img src="/assets/monflorian-logo.png" alt="Mon Florian"></a></header>
    <main class="private-trip-shell${isReady ? "" : " error-page-shell"}">
      ${content}
      <footer class="private-trip-footer">
        ${options.notificationStatus === "failed" ? '<p class="private-trip-notice">L’email n’a pas pu être envoyé. Garde ce lien privé pour retrouver ton carnet. Besoin d’aide ? <a href="mailto:support@monflorian.com">support@monflorian.com</a>.</p>' : ""}
        <p>Gratuit pendant la bêta, sans carte bancaire. Un paiement sera ajouté à la sortie de bêta.</p>
        <p>Cette proposition est une aide à la préparation. Vérifie prix, horaires, formalités et disponibilités avant de réserver.</p>
        ${canDelete ? `<p>Conservée jusqu’au ${escapeHtml(formatExpiry(options.expiresAt))} au plus tard.</p>` : ""}
        <p><a href="/confidentialite">Confidentialité et données</a></p>
        <p>Besoin d’aide ? <a href="mailto:support@monflorian.com">support@monflorian.com</a>. Décris le problème sans joindre ton lien privé ni tes photos.</p>
        ${deletion}
      </footer>
    </main>
  </body>
</html>`, { status: options.deleted || ["expired", "deleted"].includes(options.status) ? 410 : 200, headers: PRIVATE_PAGE_HEADERS });
}

export function renderUnknownTripPage(): Response {
  return renderStandaloneState({
    title: "Ce carnet est introuvable",
    body: "Ce lien ne correspond à aucun carnet accessible. Il peut être incomplet, avoir expiré ou avoir été supprimé.",
    guidance: "Vérifie que tu as copié le lien entier depuis ton message ou ton navigateur. Si tu as une copie hors connexion, tu peux toujours la lire.",
    illustration: "lost", actionLabel: "Revenir à l’accueil", actionHref: "/", refresh: false,
  }, 404);
}

function renderStandaloneState(state: TripPageState, status: number, requestId?: string): Response {
  return new Response(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex"><title>${escapeHtml(state.title)} · Mon Florian</title><link rel="stylesheet" href="/styles.css?v=intro-full-1"><link rel="stylesheet" href="/trip.css"><link rel="stylesheet" href="/error.css"></head><body class="private-trip-page error-page"><header class="private-trip-brand"><a href="/" aria-label="Revenir à l’accueil de Mon Florian"><img src="/assets/monflorian-logo.png" alt="Mon Florian"></a></header><main class="private-trip-shell error-page-shell">${renderStateSection(state)}<footer class="private-trip-footer"><p><a href="/confidentialite">Confidentialité et données</a></p></footer></main></body></html>`, {
    status, headers: { ...PRIVATE_PAGE_HEADERS, ...(requestId ? { "X-Request-Id": requestId } : {}) },
  });
}

export function renderServiceErrorPage(status: number, errorCode: string, requestId: string): Response {
  const state: TripPageState = {
    title: "Cette page ne peut pas être affichée",
    body: "Le service a rencontré un problème. Il ne peut pas afficher cette page pour le moment.",
    guidance: "Réessaie de l’ouvrir plus tard. Si le problème persiste, contacte-nous sans joindre ton lien privé.",
    illustration: "repair", actionLabel: "Revenir à l’accueil", actionHref: "/", refresh: false,
  };
  if (["PROVIDER_CONFIGURATION", "SERVICE_NOT_CONFIGURED", "TRIP_CREATION_UNAVAILABLE"].includes(errorCode)) {
    state.title = "Le service est indisponible";
    state.body = "Le service doit être rétabli avant de pouvoir continuer.";
    state.guidance = "Tu n’as rien à modifier dans ta demande. Tu peux nous contacter pour signaler le problème.";
  } else if (status === 403) {
    state.title = "Cette action n’a pas été autorisée";
    state.body = "La demande n’a pas été acceptée. Ouvre ton carnet depuis son lien privé avant de recommencer.";
    state.guidance = "Si le problème persiste, contacte-nous sans joindre ton lien privé ni tes photos.";
  }
  return renderStandaloneState(state, status, requestId);
}
