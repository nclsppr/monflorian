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
