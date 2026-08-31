import japanGuideFixture from "virtual:monflorian-japan-guide";

export const generationStatuses = Object.freeze([
  "J’ouvre l’exemple Japon…",
  "Je charge les dix journées…",
  "Le carnet est prêt.",
]);

export const japanImageAssetsByBriefId = Object.freeze({
  "image-tokyo-evening": Object.freeze({
    src: "/v2/media/japan-tokyo-couple.webp",
    mobileSrc: "/v2/media/japan-tokyo-couple-720.webp",
    overlayLabel: "TOKYO",
    width: 1440,
    height: 960,
  }),
  "image-tokyo-garden": Object.freeze({
    src: "/v2/media/japan-tokyo-garden-couple.webp",
    mobileSrc: "/v2/media/japan-tokyo-garden-couple-720.webp",
    overlayLabel: "TOKYO",
    width: 1440,
    height: 960,
  }),
  "image-hakone-ryokan": Object.freeze({
    src: "/v2/media/japan-hakone-couple.webp",
    mobileSrc: "/v2/media/japan-hakone-couple-720.webp",
    overlayLabel: "HAKONE",
    width: 1440,
    height: 960,
  }),
  "image-kyoto-higashiyama": Object.freeze({
    src: "/v2/media/japan-kyoto-couple.webp",
    mobileSrc: "/v2/media/japan-kyoto-couple-720.webp",
    overlayLabel: "FUSHIMI",
    width: 1440,
    height: 960,
  }),
  "image-arashiyama-river": Object.freeze({
    src: "/v2/media/japan-arashiyama-couple.webp",
    mobileSrc: "/v2/media/japan-arashiyama-couple-720.webp",
    overlayLabel: "ARASHIYAMA",
    width: 1440,
    height: 960,
  }),
});

export const bookingUrlsByDestinationRef = Object.freeze({
  "booking-tokyo": "https://www.booking.com/city/jp/tokyo.fr.html",
  "booking-hakone": "https://www.booking.com/city/jp/hakone.fr.html",
  "booking-kyoto": "https://www.booking.com/city/jp/kyoto.fr.html",
});

export const travelGuideLabels = Object.freeze({
  pace: Object.freeze({
    calm: "Calme",
    balanced: "Équilibré",
    intense: "Intense",
  }),
  energy: Object.freeze({
    light: "Léger",
    balanced: "Équilibré",
    full: "Soutenu",
  }),
  period: Object.freeze({
    morning: "Matin",
    afternoon: "Après-midi",
    evening: "Soir",
  }),
  reservation: Object.freeze({
    none: "Sans réservation",
    recommended: "Réservation conseillée",
    required: "Réservation nécessaire",
  }),
  costLevel: Object.freeze({
    free: "Gratuit",
    low: "Budget léger",
    medium: "Budget intermédiaire",
    high: "Budget élevé",
    variable: "Variable",
  }),
  transferMode: Object.freeze({
    none: "Aucun",
    walk: "À pied",
    metro: "Métro",
    local_train: "Train local",
    high_speed_train: "Train à grande vitesse",
    bus: "Bus",
    ferry: "Ferry",
    car: "Voiture",
    flight: "Vol",
  }),
  budgetApproach: Object.freeze({
    lean: "Essentiel",
    balanced: "Équilibré",
    comfort: "Confort",
    premium: "Premium",
  }),
  propertyType: Object.freeze({
    hotel: "Hôtel",
    ryokan: "Ryokan",
    guesthouse: "Maison d’hôtes",
    apartment: "Appartement",
    mixed: "Hébergements variés",
  }),
  priority: Object.freeze({
    essential: "Essentiel",
    recommended: "Recommandé",
    optional: "Facultatif",
    comfort: "Confort",
  }),
  reservationCategory: Object.freeze({
    accommodation: "Hébergement",
    transport: "Transport",
    luggage: "Bagages",
    activity: "Activité",
    restaurant: "Restaurant",
    entry: "Entrée",
  }),
  practicalSection: Object.freeze({
    documents: "Documents",
    reservations: "Réservations",
    transport: "Transports",
    money: "Argent",
    connectivity: "Connexion",
    healthComfort: "Santé et confort",
    packingWeather: "Valise et météo",
    localEtiquette: "Usages locaux",
    last72Hours: "Dans les 72 dernières heures",
  }),
  verificationTiming: Object.freeze({
    before_booking: "Avant de réserver",
    before_departure: "Avant le départ",
    last_72_hours: "Dans les 72 dernières heures",
    on_site: "Sur place",
  }),
  verificationSourceType: Object.freeze({
    official_operator: "Opérateur officiel",
    accommodation_provider: "Hébergement",
    booking_provider: "Plateforme de réservation",
    local_authority: "Autorité locale",
    manual_review: "Vérification personnelle",
  }),
});

function requiredValue(table, key, label) {
  if (!Object.hasOwn(table, key)) {
    throw new Error(`Donnée de présentation manquante pour ${label} « ${key} ».`);
  }
  return table[key];
}

function formatFrenchList(values) {
  if (values.length < 2) return values[0] || "";
  if (values.length === 2) return values.join(" ou ");
  return `${values.slice(0, -1).join(", ")} ou ${values.at(-1)}`;
}

function adaptJapanGuide(guide) {
  const verificationItems = guide.verificationItems.map((item) => Object.freeze({
    ...item,
    timingLabel: requiredValue(
      travelGuideLabels.verificationTiming,
      item.timing,
      "le moment de vérification",
    ),
    sourceTypeLabel: requiredValue(
      travelGuideLabels.verificationSourceType,
      item.sourceType,
      "le type de source",
    ),
  }));
  const verificationItemsById = new Map(verificationItems.map((item) => [item.id, item]));
  const resolveVerifications = (ids) => ids.map((id) => {
    const item = verificationItemsById.get(id);
    if (!item) throw new Error(`Vérification inconnue « ${id} » dans la fixture Japon.`);
    return item;
  });

  const accommodations = guide.accommodations.map((stay) => Object.freeze({
    ...stay,
    href: requiredValue(
      bookingUrlsByDestinationRef,
      stay.bookingDestinationRef,
      "la destination Booking",
    ),
    nightsLabel: `${stay.nights} nuit${stay.nights > 1 ? "s" : ""}`,
    priorityLabel: requiredValue(travelGuideLabels.priority, stay.bookingPriority, "la priorité"),
    propertyTypeLabel: requiredValue(
      travelGuideLabels.propertyType,
      stay.propertyType,
      "le type d’hébergement",
    ),
    recommendedAreasLabel: formatFrenchList(stay.recommendedAreas),
    verificationItems: resolveVerifications(stay.verificationItemIds),
  }));
  const accommodationsById = new Map(accommodations.map((stay) => [stay.id, stay]));
  const destinationByBookingRef = new Map(
    accommodations.map((stay) => [stay.bookingDestinationRef, stay.destination]),
  );

  const imageBriefs = guide.imageBriefs.map((brief) => Object.freeze({
    ...brief,
    asset: requiredValue(japanImageAssetsByBriefId, brief.id, "l’image"),
  }));
  const imageBriefsById = new Map(imageBriefs.map((brief) => [brief.id, brief]));

  const days = guide.days.map((day) => {
    const baseLabels = day.baseRefs.map((reference) => {
      const label = destinationByBookingRef.get(reference);
      if (!label) throw new Error(`Base inconnue « ${reference} » dans la fixture Japon.`);
      return label;
    });
    const accommodation = day.accommodationId === null
      ? null
      : accommodationsById.get(day.accommodationId);
    if (day.accommodationId !== null && !accommodation) {
      throw new Error(`Hébergement inconnu « ${day.accommodationId} » dans la fixture Japon.`);
    }

    return Object.freeze({
      ...day,
      cityLabel: [...new Set(baseLabels)].join(" → "),
      energyLabel: requiredValue(travelGuideLabels.energy, day.energy, "l’énergie"),
      accommodation,
      moments: day.moments.map((moment) => Object.freeze({
        ...moment,
        periodLabel: requiredValue(travelGuideLabels.period, moment.period, "la période"),
        reservationLabel: requiredValue(
          travelGuideLabels.reservation,
          moment.reservation,
          "la réservation",
        ),
        costLevelLabel: requiredValue(
          travelGuideLabels.costLevel,
          moment.costLevel,
          "le niveau de coût",
        ),
        verificationItems: resolveVerifications(moment.verificationItemIds),
      })),
      transfer: Object.freeze({
        ...day.transfer,
        modeLabels: day.transfer.modes.map((mode) => requiredValue(
          travelGuideLabels.transferMode,
          mode,
          "le mode de transfert",
        )),
        reservationLabel: requiredValue(
          travelGuideLabels.reservation,
          day.transfer.reservation,
          "la réservation du transfert",
        ),
        verificationItems: resolveVerifications(day.transfer.verificationItemIds),
      }),
    });
  });

  const practicalGuide = Object.freeze(Object.fromEntries(
    Object.entries(guide.practicalGuide).map(([sectionId, items]) => [
      sectionId,
      Object.freeze(items.map((item) => Object.freeze({
        ...item,
        priorityLabel: requiredValue(travelGuideLabels.priority, item.priority, "la priorité"),
        verificationItems: resolveVerifications(item.verificationItemIds),
      }))),
    ]),
  ));
  const practicalSections = Object.freeze(Object.entries(practicalGuide).map(([id, items]) => Object.freeze({
    id,
    label: requiredValue(travelGuideLabels.practicalSection, id, "la rubrique pratique"),
    items,
  })));

  const reservationPlan = guide.reservationPlan.map((item) => Object.freeze({
    ...item,
    categoryLabel: requiredValue(
      travelGuideLabels.reservationCategory,
      item.category,
      "la catégorie de réservation",
    ),
    priorityLabel: requiredValue(travelGuideLabels.priority, item.priority, "la priorité"),
    accommodations: item.accommodationIds.map((id) => {
      const stay = accommodationsById.get(id);
      if (!stay) throw new Error(`Hébergement inconnu « ${id} » dans le plan de réservation.`);
      return stay;
    }),
    verificationItems: resolveVerifications(item.verificationItemIds),
  }));

  const chapters = guide.chapters.map((chapter) => {
    const image = imageBriefsById.get(chapter.imageBriefId);
    if (!image) throw new Error(`Image inconnue « ${chapter.imageBriefId} » dans la fixture Japon.`);
    return Object.freeze({
      ...chapter,
      image,
      days: days.filter((day) => day.chapterId === chapter.id),
    });
  });

  const featuredImage = imageBriefsById.get(guide.trip.featuredImageBriefId);
  if (!featuredImage) {
    throw new Error(`Image de couverture inconnue « ${guide.trip.featuredImageBriefId} ».`);
  }

  return Object.freeze({
    slug: "japon-a-deux",
    schemaVersion: guide.schemaVersion,
    contentTemplateVersion: guide.contentTemplateVersion,
    trip: Object.freeze({
      ...guide.trip,
      paceLabel: requiredValue(travelGuideLabels.pace, guide.trip.pace, "le rythme"),
    }),
    budgetGuide: Object.freeze({
      ...guide.budgetGuide,
      approachLabel: requiredValue(
        travelGuideLabels.budgetApproach,
        guide.budgetGuide.approach,
        "l’approche budgétaire",
      ),
      verificationItems: resolveVerifications(guide.budgetGuide.verificationItemIds),
    }),
    chapters: Object.freeze(chapters),
    days: Object.freeze(days),
    accommodations: Object.freeze(accommodations),
    reservationPlan: Object.freeze(reservationPlan),
    practicalGuide,
    practicalSections,
    featuredImage,
    verificationItems: Object.freeze(verificationItems),
  });
}

export const japanTrip = adaptJapanGuide(japanGuideFixture);

// Vues transitoires dérivées : elles gardent le rendu actuel compatible sans
// maintenir une seconde copie du contenu éditorial.
export const japanDays = Object.freeze(japanTrip.days.map((day) => Object.freeze({
  day: day.day,
  city: day.cityLabel,
  title: day.title,
  pace: day.energyLabel,
  moments: Object.freeze(day.moments.map((moment) => moment.title)),
})));

export const hotels = Object.freeze(japanTrip.accommodations.map((stay) => Object.freeze({
  city: stay.destination,
  nights: stay.nightsLabel,
  neighborhood: stay.recommendedAreasLabel,
  note: stay.rationale,
  href: stay.href,
})));

export const practicalChecks = Object.freeze(japanTrip.practicalSections
  .flatMap((section) => section.items)
  .filter((item) => item.priority === "essential")
  .map((item) => item.title));

export const exampleTrips = Object.freeze([
  Object.freeze({
    slug: "portugal-en-train",
    eyebrow: "EXEMPLE · 8 JOURS · ÉQUILIBRÉ",
    title: "Le Portugal en train",
    coverLabel: "PORTUGAL",
    subtitle: "Azulejos, marchés et Atlantique",
    route: "Lisbonne → Coimbra → Porto",
    summary:
      "Trois villes reliées sans voiture, des matinées guidées et des fins de journée libres face au Tage ou au Douro.",
    image: "/v2/media/example-portugal-train.webp",
    stops: Object.freeze(["3 nuits à Lisbonne", "1 nuit à Coimbra", "3 nuits à Porto"]),
  }),
  Object.freeze({
    slug: "sicile-a-table",
    eyebrow: "EXEMPLE · 9 JOURS · ÉQUILIBRÉ",
    title: "La Sicile à table",
    coverLabel: "SICILE",
    subtitle: "Marchés, pierres blondes et baignades",
    route: "Palerme → Cefalù → Syracuse",
    summary:
      "Un itinéraire gourmand avec peu de transferts, des villages accessibles à pied et deux vraies journées laissées ouvertes.",
    image: "/v2/media/example-sicily-table.webp",
    stops: Object.freeze(["3 nuits à Palerme", "2 nuits à Cefalù", "3 nuits à Syracuse"]),
  }),
  Object.freeze({
    slug: "rails-et-fjords",
    eyebrow: "EXEMPLE · 7 JOURS · CALME",
    title: "Entre rails et fjords",
    coverLabel: "NORVÈGE",
    subtitle: "Paysages, traversées et villes portuaires",
    route: "Oslo → Flåm → Bergen",
    summary:
      "Le train panoramique et le ferry deviennent le voyage, avec une étape lente dans le fjord et deux villes à taille humaine.",
    image: "/v2/media/example-norway-fjords.webp",
    stops: Object.freeze(["2 nuits à Oslo", "2 nuits à Flåm", "2 nuits à Bergen"]),
  }),
]);
