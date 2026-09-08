import japanGuideContext from "../contracts/examples/japan-10-days.context.v1.json" with { type: "json" };
import japanGuideFixture from "../contracts/examples/japan-10-days.v1.json" with { type: "json" };
import { validateTravelGuideDraft } from "./travel-guide.mjs";
import { bookingUrlsByDestinationRef, japanImageAssetsByBriefId } from "./public-example-assets.mjs";

// Liste volontairement explicite : un nouveau champ fournisseur ne devient
// jamais public simplement parce qu'il a été ajouté au schéma de génération.
const PUBLIC_GUIDE_FIELDS = Object.freeze([
  "schemaVersion", "contentTemplateVersion", "trip", "budgetGuide", "chapters",
  "days", "accommodations", "reservationPlan", "practicalGuide", "verificationItems",
]);

export function projectPublicTravelGuide(value, context) {
  const validated = validateTravelGuideDraft(value, context);
  return {
    ...Object.fromEntries(PUBLIC_GUIDE_FIELDS.map((key) => [key, structuredClone(validated[key])])),
    imageBriefs: validated.imageBriefs.map(({ id, altText }) => ({ id, altText })),
  };
}

export function publicJapanExample() {
  return {
    apiVersion: "v1",
    exampleId: "japan-10-days",
    kind: "public_example",
    canonicalPath: "/carnets/japon-10-jours",
    guide: projectPublicTravelGuide(japanGuideFixture, japanGuideContext),
    imageAssets: structuredClone(japanImageAssetsByBriefId),
    bookingLinks: structuredClone(bookingUrlsByDestinationRef),
  };
}
