// Liens éditoriaux relus le 7 septembre 2026. Les conditions restent à revérifier.
const hakone = { label: "Hakone Navi, transports et état du réseau", url: "https://www.hakonenavi.jp/international/en/" };
const baggage = { label: "JR Central, règles de bagages", url: "https://global.jr-central.co.jp/en/info/oversized-baggage/" };
export const sourceLinks = Object.freeze({
  "verify-entry-rules": [{ label: "Ministère japonais des Affaires étrangères, visas et entrée", url: "https://www.mofa.go.jp/j_info/visit/visa/" }],
  "verify-site-hours-tokyo": [{ label: "GO TOKYO, jardin Hama-rikyu", url: "https://www.gotokyo.org/en/spot/20/" }],
  "verify-kansai-transfer": [{ label: "JR West, trajet Haruka vers l’aéroport", url: "https://www.westjr.co.jp/travel-information/en/tickets-passes/oneway/haruka/" }],
  "verify-site-hours-hakone": [hakone],
  "verify-tokyo-hakone-rail": [hakone],
  "verify-hakone-kyoto-rail": [hakone, { label: "JR Central, horaires de base du Shinkansen", url: "https://global.jr-central.co.jp/en/info/timetable/" }, baggage],
  "verify-luggage-forwarding": [baggage, { label: "Yamato Transport, envoi des bagages", url: "https://www.kuronekoyamato.co.jp/ytc/en/send/services/takkyubin/" }],
  "verify-weather": [{ label: "Japan Meteorological Agency, prévisions et alertes", url: "https://www.jma.go.jp/jma/en/menu.html" }],
});
