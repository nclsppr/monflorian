import { AppError } from "./core.mjs";
import { isTripToken } from "./trips.mjs";

function publicOrigin(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
      throw new Error("invalid origin");
    }
    return url.origin;
  } catch {
    throw new AppError(503, "EMAIL_CONFIGURATION", "L’origine publique du courriel est invalide.");
  }
}

function mailbox(value, bindingName) {
  if (typeof value !== "string" || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value)) {
    throw new AppError(503, "EMAIL_CONFIGURATION", `L’adresse ${bindingName} est invalide.`);
  }
  return value;
}

function formatExpiry(expiresAt) {
  const date = new Date(expiresAt);
  if (!Number.isFinite(date.getTime())) {
    throw new AppError(500, "TRIP_DATA_UNREADABLE", "La date d’expiration du voyage est invalide.");
  }
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeZone: "Europe/Paris",
  }).format(date);
}

export function buildTripReadyEmail({ to, from, origin, publicToken, expiresAt }) {
  if (!isTripToken(publicToken)) {
    throw new AppError(500, "TRIP_DATA_UNREADABLE", "Le lien privé du voyage est invalide.");
  }
  const privateUrl = `${publicOrigin(origin)}/voyages/${publicToken}`;
  const expiry = formatExpiry(expiresAt);
  return {
    to: mailbox(to, "de destination"),
    from: mailbox(from, "d’envoi"),
    subject: "Ton voyage est prêt",
    text: [
      "Ton voyage est prêt.",
      "",
      `Ouvre ta page privée : ${privateUrl}`,
      "",
      `Ce lien expire le ${expiry}. Ne le transfère pas si tu veux garder ton voyage privé.`,
    ].join("\n"),
    html: [
      "<p>Ton voyage est prêt.</p>",
      `<p><a href="${privateUrl}">Voir mon voyage</a></p>`,
      `<p>Ce lien expire le ${expiry}. Ne le transfère pas si tu veux garder ton voyage privé.</p>`,
    ].join(""),
  };
}
