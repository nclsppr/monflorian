import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PLANNER_DRAFT,
  normalizePlannerDraft,
  parsePlannerDraft,
  plannerErrors,
  plannerText,
  serializePlannerDraft,
} from "../app/v2/src/planner-state.mjs";

test("le brief local conserve les envies et normalise les nombres sans ajouter de données", () => {
  const draft = { ...DEFAULT_PLANNER_DRAFT, brief: "  Du train et du temps libre\nAu printemps.  ", days: "14", travelers: "8", ignored: "unrelated" };
  const restored = parsePlannerDraft(serializePlannerDraft(draft));
  assert.deepEqual(restored, {
    brief: "Du train et du temps libre\nAu printemps.",
    days: 14,
    travelers: 8,
    pace: "equilibre",
    comfort: "charme",
  });
  assert.equal(Object.hasOwn(restored, "ignored"), false);
});

test("la saisie refuse les durées et voyageurs vides, fractionnaires ou hors limites", () => {
  for (const days of ["", " ", 0, 1, 15, -1, 2.5, "2.5", "2e1", NaN, Infinity, null, true, [], {}]) {
    assert.equal(normalizePlannerDraft({ ...DEFAULT_PLANNER_DRAFT, days }), null, `days=${String(days)}`);
  }
  for (const travelers of ["", 0, 9, 1.5, "1.5", null, false]) {
    assert.ok(plannerErrors({ ...DEFAULT_PLANNER_DRAFT, travelers }).travelers);
  }
  assert.equal(normalizePlannerDraft({ ...DEFAULT_PLANNER_DRAFT, days: 2, travelers: 1 }).days, 2);
});

test("une copie locale corrompue ou d’une autre version ne remplace pas le formulaire", () => {
  for (const serialized of [null, "", "not-json", "null", "[]", "{}", "x".repeat(9000), JSON.stringify({ version: 2, draft: DEFAULT_PLANNER_DRAFT }), JSON.stringify({ version: 1, draft: { ...DEFAULT_PLANNER_DRAFT, pace: "unknown" } }), JSON.stringify({ version: 1, draft: { ...DEFAULT_PLANNER_DRAFT, comfort: "unknown" } })]) {
    assert.equal(parsePlannerDraft(serialized), null);
  }
  assert.equal(normalizePlannerDraft(null), null);
  assert.equal(normalizePlannerDraft([]), null);
});

test("le texte reste borné et ne transmet pas de contrôle caché dans un export", () => {
  assert.ok(normalizePlannerDraft({ ...DEFAULT_PLANNER_DRAFT, brief: "é".repeat(2000) }));
  assert.equal(normalizePlannerDraft({ ...DEFAULT_PLANNER_DRAFT, brief: "é".repeat(2001) }), null);
  assert.equal(normalizePlannerDraft({ ...DEFAULT_PLANNER_DRAFT, brief: "voyage\u0000caché" }), null);
  assert.throws(() => serializePlannerDraft({ ...DEFAULT_PLANNER_DRAFT, days: 30 }), TypeError);
  assert.throws(() => plannerText({ ...DEFAULT_PLANNER_DRAFT, travelers: 30 }), TypeError);
});

test("le brief exporté reprend les choix et laisse visibles les informations à préciser", () => {
  const text = plannerText({ ...DEFAULT_PLANNER_DRAFT, brief: "La côte en train", days: 7, travelers: 1, pace: "calme", comfort: "confort" });
  assert.match(text, /La côte en train/u);
  assert.match(text, /Durée : 7 jours/u);
  assert.match(text, /Voyageurs : 1/u);
  assert.match(text, /Rythme : Calme/u);
  assert.match(text, /Hébergement : Confort essentiel/u);
  assert.match(text, /Dates, ville de départ, budget et contraintes de déplacement/u);
  assert.match(text, /Aucune demande ni réservation n’a été envoyée/u);
  assert.match(plannerText(DEFAULT_PLANNER_DRAFT), /Destination, saison et envies à préciser/u);
});

const { buildTripPayload, DEFAULT_TRIP_DRAFT, privateTripUrl, TRIP_IDEAS, tripDraftErrors } = await import("../app/v2/src/trip-draft.mjs");
const testToday = new Date("2026-10-02T12:00:00Z");

test("les deux idées préparent des demandes distinctes sans inventer les dates ni le départ", () => {
  const tokyo = { ...DEFAULT_TRIP_DRAFT, ...TRIP_IDEAS[0].draft };
  const luxembourg = { ...DEFAULT_TRIP_DRAFT, ...TRIP_IDEAS[1].draft };
  assert.deepEqual(tripDraftErrors(tokyo, testToday), {});
  assert.deepEqual(tripDraftErrors(luxembourg, testToday), {});
  assert.equal(tokyo.startDate, "");
  assert.equal(tokyo.departureCity, "");
  assert.match(tokyo.brief, /début novembre/u);
  assert.equal(luxembourg.durationDays, 2);
  assert.equal(luxembourg.transportMode, "none");
  assert.equal(luxembourg.accommodationStyle, "luxury");
});

test("une journée est valide et les dates exactes restent cohérentes avec la durée", () => {
  const draft = { ...DEFAULT_TRIP_DRAFT, ...TRIP_IDEAS[1].draft, durationDays: 1 };
  assert.deepEqual(tripDraftErrors(draft, testToday), {});
  assert.ok(tripDraftErrors({ ...draft, startDate: "2026-11-01", endDate: "2026-11-02" }, testToday).durationDays);
  assert.deepEqual(tripDraftErrors({ ...draft, durationDays: 2, startDate: "2026-11-01", endDate: "2026-11-02" }, testToday), {});
  for (const startDate of ["2026-02-30", "2026-09-01", "2027-11-01"]) assert.ok(tripDraftErrors({ ...draft, startDate }, testToday).startDate);
  assert.ok(tripDraftErrors({ ...draft, startDate: "2026-11-01", endDate: "2026-11-16" }, testToday).endDate);
  for (const budgetTotalEur of ["-1", "12e3", "abc", "0", "1200,50", "100001"]) assert.ok(tripDraftErrors({ ...draft, budgetTotalEur }, testToday).budgetTotalEur);
});

test("la demande laisse inconnues les informations absentes et exclut le code d’accès du contenu", () => {
  const draft = { ...DEFAULT_TRIP_DRAFT, ...TRIP_IDEAS[0].draft, accessCode: "private-test", email: "person@example.test", budgetTotalEur: "1250" };
  const payload = buildTripPayload(draft, { turnstileToken: "synthetic-test" });
  assert.equal(payload.departureCity, null);
  assert.equal(payload.startDate, null);
  assert.equal(payload.endDate, null);
  assert.equal(payload.email, null);
  assert.equal(payload.budgetTotalEur, 1250);
  assert.deepEqual(payload.photos, []);
  assert.equal(payload.photoConsent, false);
  assert.equal(Object.hasOwn(payload, "accessCode"), false);
  assert.equal(buildTripPayload(draft, { emailEnabled: true }).email, "person@example.test");
  assert.equal(buildTripPayload(draft, { photos: [{ dataUrl: "data:image/webp;base64,test", previewUrl: "blob:local" }], photoConsent: true }).photoConsent, true);
});

test("le lien reçu reste une page privée du site sans redirection ni paramètre étranger", () => {
  const origin = "https://monflorian.com";
  const path = `/voyages/${"a".repeat(43)}`;
  assert.equal(privateTripUrl(path, origin), `${origin}${path}`);
  for (const value of ["https://foreign.example" + path, "//foreign.example" + path, "javascript:alert(1)", "/", `${path}?next=external`, `${path}#external`, "/voyages/x", null]) assert.equal(privateTripUrl(value, origin), null);
});
