export const generationStatuses = [
  "Je lis ton envie…",
  "J’équilibre les journées…",
  "Je relie les étapes…",
  "Je prépare ton carnet…",
  "Ton voyage est prêt.",
];

export const japanDays = [
  {
    day: 1,
    city: "Tokyo",
    title: "Atterrir sans courir",
    pace: "Léger",
    moments: [
      "Installation et temps calme à l’hôtel",
      "Première marche entre Daikanyama et Ebisu",
      "Dîner près de l’hôtel, selon votre énergie",
    ],
  },
  {
    day: 2,
    city: "Tokyo",
    title: "Le vieux Tokyo à pied",
    pace: "Équilibré",
    moments: [
      "Sensō-ji tôt le matin",
      "Parc d’Ueno et ruelles de Yanaka",
      "Soirée libre pour laisser la ville venir à vous",
    ],
  },
  {
    day: 3,
    city: "Tokyo",
    title: "Sanctuaire, design et néons",
    pace: "Équilibré",
    moments: [
      "Meiji-jingū avant l’affluence",
      "Omotesandō et déjeuner à Daikanyama",
      "Shibuya à l’heure bleue",
    ],
  },
  {
    day: 4,
    city: "Tokyo",
    title: "Du marché aux jardins",
    pace: "Souple",
    moments: [
      "Petit-déjeuner au marché extérieur de Tsukiji",
      "Jardin Hama-rikyū et traversée vers Ginza",
      "Après-midi libre ou retour à l’hôtel",
    ],
  },
  {
    day: 5,
    city: "Hakone",
    title: "Passer en mode onsen",
    pace: "Lent",
    moments: [
      "Train vers Odawara puis Hakone",
      "Musée en plein air et montée vers Gōra",
      "Dîner au ryokan et bain thermal",
    ],
  },
  {
    day: 6,
    city: "Hakone → Kyoto",
    title: "Lac le matin, Kyoto le soir",
    pace: "Équilibré",
    moments: [
      "Lac Ashi si le ciel est dégagé",
      "Shinkansen vers Kyoto après le déjeuner",
      "Première promenade le long de la Kamo",
    ],
  },
  {
    day: 7,
    city: "Kyoto",
    title: "Les hauteurs de Higashiyama",
    pace: "Équilibré",
    moments: [
      "Kiyomizu-dera à l’ouverture",
      "Ninenzaka et Sannenzaka sans itinéraire rigide",
      "Pause à l’hôtel puis Gion en fin de journée",
    ],
  },
  {
    day: 8,
    city: "Kyoto",
    title: "Torii et cuisine de marché",
    pace: "Souple",
    moments: [
      "Fushimi Inari avant le petit-déjeuner",
      "Déjeuner au marché Nishiki",
      "Après-midi entièrement libre",
    ],
  },
  {
    day: 9,
    city: "Kyoto",
    title: "Arashiyama au fil de l’eau",
    pace: "Équilibré",
    moments: [
      "Bambouseraie avant 8 h 30",
      "Jardin du Tenryū-ji et rive de la Katsura",
      "Dernier dîner choisi sur place",
    ],
  },
  {
    day: 10,
    city: "Kyoto",
    title: "Une dernière matinée douce",
    pace: "Léger",
    moments: [
      "Jardin ou café selon la météo",
      "Départ vers l’aéroport du Kansai",
      "Si le vol repart de Tokyo, prévoir ce retour la veille",
    ],
  },
];

export const hotels = [
  {
    city: "Tokyo",
    nights: "4 nuits",
    neighborhood: "Shibuya ou Ebisu",
    note: "Central sans sacrifier les soirées plus calmes.",
    href: "https://www.booking.com/city/jp/tokyo.fr.html",
  },
  {
    city: "Hakone",
    nights: "1 nuit",
    neighborhood: "Gōra",
    note: "Un ryokan avec dîner et onsen pour vraiment ralentir.",
    href: "https://www.booking.com/city/jp/hakone.fr.html",
  },
  {
    city: "Kyoto",
    nights: "4 nuits",
    neighborhood: "Gion ou Kawaramachi",
    note: "À distance de marche des premières visites et de la Kamo.",
    href: "https://www.booking.com/city/jp/kyoto.fr.html",
  },
];

export const practicalChecks = [
  "Passeports valides pendant tout le séjour",
  "Réserver les places de train avec bagages volumineux",
  "Prévoir une eSIM ou un accès aux cartes hors ligne",
  "Garder une petite marge en espèces pour Hakone",
  "Vérifier les horaires des temples la veille",
];

export const exampleTrips = [
  {
    slug: "portugal-en-train",
    eyebrow: "EXEMPLE · 8 JOURS · ÉQUILIBRÉ",
    title: "Le Portugal en train",
    coverLabel: "PORTUGAL",
    subtitle: "Azulejos, marchés et Atlantique",
    route: "Lisbonne → Coimbra → Porto",
    summary:
      "Trois villes reliées sans voiture, des matinées guidées et des fins de journée libres face au Tage ou au Douro.",
    image: "/v2/media/example-portugal-train.webp",
    stops: ["3 nuits à Lisbonne", "1 nuit à Coimbra", "3 nuits à Porto"],
  },
  {
    slug: "sicile-a-table",
    eyebrow: "EXEMPLE · 9 JOURS · ÉQUILIBRÉ",
    title: "La Sicile à table",
    coverLabel: "SICILE",
    subtitle: "Marchés, pierres blondes et baignades",
    route: "Palerme → Cefalù → Syracuse",
    summary:
      "Un itinéraire gourmand avec peu de transferts, des villages accessibles à pied et deux vraies journées laissées ouvertes.",
    image: "/v2/media/example-sicily-table.webp",
    stops: ["3 nuits à Palerme", "2 nuits à Cefalù", "3 nuits à Syracuse"],
  },
  {
    slug: "rails-et-fjords",
    eyebrow: "EXEMPLE · 7 JOURS · CALME",
    title: "Entre rails et fjords",
    coverLabel: "NORVÈGE",
    subtitle: "Paysages, traversées et villes portuaires",
    route: "Oslo → Flåm → Bergen",
    summary:
      "Le train panoramique et le ferry deviennent le voyage, avec une étape lente dans le fjord et deux villes à taille humaine.",
    image: "/v2/media/example-norway-fjords.webp",
    stops: ["2 nuits à Oslo", "2 nuits à Flåm", "2 nuits à Bergen"],
  },
];
