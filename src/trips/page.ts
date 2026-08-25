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
          return `<li><strong>${escapeHtml(text(moment.period))} · ${escapeHtml(text(moment.title, "Étape"))}</strong><p>${escapeHtml(text(moment.description))}</p></li>`;
        }).join("")
      : "";
    return `<article class="private-trip-day">
      <p class="result-kicker">Jour ${index + 1}${day.date ? ` · ${escapeHtml(day.date)}` : ""}</p>
      <h2>${escapeHtml(text(day.title, text(day.base, "Étape du voyage")))}</h2>
      <p>${escapeHtml(text(day.summary))}</p>
      ${moments ? `<ol>${moments}</ol>` : ""}
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
    if (url.protocol !== "https:" || !url.hostname.endsWith("booking.com")) return "";
    return `<li><a href="${escapeHtml(url.toString())}" rel="noopener noreferrer${item.affiliate === true ? " sponsored" : ""}">${escapeHtml(text(item.label, "Comparer les hébergements"))}</a></li>`;
  }).join("");
  return links ? `<section class="private-trip-section"><h2>Où dormir</h2><ul class="private-trip-links">${links}</ul></section>` : "";
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

function renderReady(result: unknown, token: string): string {
  const root = objectValue(result);
  const itinerary = objectValue(root?.itinerary ?? result);
  if (!itinerary) {
    return `<section class="private-trip-state"><p class="result-kicker">Résultat indisponible</p><h1>Cette proposition ne peut pas être affichée.</h1><p>Le lien reste valide, mais le contenu doit être réparé.</p></section>`;
  }
  const booking = objectValue(root?.accommodationSuggestions);
  return `<header class="private-trip-hero">
      <p class="result-kicker">Projection de voyage à vérifier</p>
      <h1>${escapeHtml(text(itinerary.title, "Ta proposition de voyage"))}</h1>
      <p>${escapeHtml(text(itinerary.summary))}</p>
    </header>
    ${itinerary.florianNote ? `<aside class="private-trip-note"><strong>Le point de Florian</strong><p>${escapeHtml(itinerary.florianNote)}</p></aside>` : ""}
    ${renderGeneratedImages(root?.generatedImages, token)}
    ${renderDays(itinerary.days)}
    ${renderChecklist("À réserver", itinerary.reservationChecklist)}
    ${renderChecklist("À vérifier", itinerary.verificationChecklist)}
    ${renderBooking(booking?.items)}`;
}

function renderState(status: string): { title: string; body: string; refresh: boolean } {
  if (["pending", "queued", "generating_itinerary", "generating_images"].includes(status)) {
    return {
      title: "Ton voyage se prépare",
      body: "Tu peux garder cette page ouverte ou revenir avec le lien reçu. Elle se recharge automatiquement.",
      refresh: true,
    };
  }
  if (status === "failed") {
    return {
      title: "La préparation n’a pas abouti",
      body: "Aucune réservation n’a été faite. Florian pourra relancer la demande de manière contrôlée.",
      refresh: false,
    };
  }
  if (status === "expired") {
    return {
      title: "Ce voyage a expiré",
      body: "La proposition et ses images ont été supprimées à la fin de leur durée de conservation.",
      refresh: false,
    };
  }
  return {
    title: "Ce voyage a été supprimé",
    body: "La proposition et ses images ne sont plus conservées.",
    refresh: false,
  };
}

export function renderPrivateTripPage(options: PrivateTripPageOptions): Response {
  const state = renderState(options.deleted ? "deleted" : options.status);
  const isReady = options.status === "ready" && !options.deleted;
  const refresh = !isReady && state.refresh ? '<meta http-equiv="refresh" content="10">' : "";
  const content = isReady
    ? renderReady(options.result, options.token)
    : `<section class="private-trip-state" ${state.refresh ? 'aria-busy="true"' : ""}>
        <p class="result-kicker">Voyage privé</p>
        <h1>${escapeHtml(state.title)}</h1>
        <p>${escapeHtml(state.body)}</p>
      </section>`;
  const canDelete = !options.deleted && !["deleted", "expired"].includes(options.status);
  const deletion = canDelete
    ? `<form class="private-trip-delete" method="post" action="/voyages/${escapeHtml(options.token)}/supprimer">
        <button type="submit">Supprimer cette proposition</button>
      </form>`
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
  </head>
  <body class="private-trip-page">
    <header class="private-trip-brand"><a href="/" aria-label="Revenir à l’accueil de Mon Florian"><img src="/assets/monflorian-logo.png" alt="Mon Florian"></a></header>
    <main class="private-trip-shell">
      ${content}
      <footer class="private-trip-footer">
        <p>Cette proposition est une projection. Vérifie prix, horaires, formalités et disponibilités avant de réserver.</p>
        <p>Conservée jusqu’au ${escapeHtml(formatExpiry(options.expiresAt))} au plus tard.</p>
        <p><a href="/confidentialite">Confidentialité et données</a></p>
        ${deletion}
      </footer>
    </main>
  </body>
</html>`, { headers: PRIVATE_PAGE_HEADERS });
}

export function renderUnknownTripPage(): Response {
  return new Response(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex"><title>Voyage introuvable · Mon Florian</title><link rel="stylesheet" href="/styles.css?v=intro-full-1"></head><body class="private-trip-page"><main class="private-trip-shell"><section class="private-trip-state"><p class="result-kicker">Lien privé</p><h1>Ce voyage est introuvable.</h1><p>Le lien est incorrect, expiré ou la proposition a été supprimée.</p><a class="primary-button private-trip-home" href="/">Revenir à l’accueil</a></section></main></body></html>`, {
    status: 404,
    headers: PRIVATE_PAGE_HEADERS,
  });
}
