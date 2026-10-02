import { itineraryOutput, itineraryRequest } from './helpers.mjs';

export function travelFactPack() {
  const researchedAt = '2026-10-02T12:00:00.000Z';
  return {
    researchedAt,
    notes: 'Contenu synthétique de test. Deux hôtels et une promenade sont documentés [source-1]. Le trajet est présenté par un opérateur [source-2].',
    sources: [
      { id: 'source-1', title: 'Office de tourisme, fixture synthétique', url: 'https://www.visitluxembourg.com/', accessedAt: researchedAt },
      { id: 'source-2', title: 'Transport, fixture synthétique', url: 'https://www.cfl.lu/', accessedAt: researchedAt },
    ],
  };
}

export function researchedRequest(overrides = {}) {
  return itineraryRequest({
    brief: 'Une nuit à Luxembourg dans un hôtel luxueux avec une petite randonnée, sans avion.',
    startDate: '2026-11-07', endDate: '2026-11-08', requestedDays: 2,
    destination: 'Luxembourg', departureCity: 'Metz', transportMode: 'none',
    accommodationStyle: 'luxury', budgetTotalEur: 700,
    ...overrides,
  });
}

export function researchedItinerary(request = researchedRequest()) {
  const dateAt = (day) => request.startDate ? new Date(Date.parse(`${request.startDate}T00:00:00Z`) + day * 86_400_000).toISOString().slice(0, 10) : null;
  const days = Array.from({ length: request.requestedDays }, (_, index) => ({
    ...itineraryOutput().days[0], day: index + 1, date: dateAt(index), base: request.destination,
    title: index ? 'Une matinée sans se presser' : 'Poser les valises puis marcher',
    summary: 'Parcours synthétique utilisé pour vérifier le contrat, sans donnée commerciale.',
    transfer: 'Un court trajet local à pied, durée à confirmer selon ton hôtel.',
    sourceIds: ['source-1'],
  }));
  const accommodationStops = request.requestedDays > 1 ? [{
    destination: request.destination, checkIn: request.startDate, checkOut: request.endDate,
    nights: request.requestedDays - 1,
  }] : [];
  const hotels = accommodationStops.length ? ['Hôtel synthétique A', 'Hôtel synthétique B'].map((name) => ({
    name, destination: request.destination, area: 'Centre', why: 'Garder un seul point de départ pour la promenade.',
    tradeoff: 'Vérifie le calme de la chambre et les prestations incluses.', stopIndex: 0,
    sourceIds: ['source-1'], checkBeforeBooking: ['Confirmer le prix total et les conditions d’annulation.'],
  })) : [];
  return itineraryOutput({
    schemaVersion: 'itinerary.v2', destination: request.destination, days, accommodationStops, hotels,
    assumptions: ['Les hôtels et les activités sont des pistes à vérifier avant de réserver.'],
    transportOptions: request.departureCity && request.transportMode !== 'none' ? [{
      mode: request.transportMode === 'auto' ? 'train' : request.transportMode,
      from: request.departureCity, to: request.destination, title: 'Comparer le trajet', why: 'Un trajet simple pour limiter la fatigue.',
      durationEstimate: 'Durée à confirmer selon le trajet retenu.', tradeoff: 'Comparer le temps porte à porte.',
      bookingAdvice: 'Vérifier conditions, bagages et coût complet.', sourceIds: ['source-2'],
    }] : [],
    practicalAdvice: [
      { title: 'Marcher selon la météo', advice: 'Vérifier les conditions du sentier et garder un repli couvert.', sourceIds: ['source-1'] },
      { title: 'Rejoindre le centre', advice: 'Vérifier les horaires du trajet local le jour du départ.', sourceIds: ['source-2'] },
    ],
    budget: {
      totalEur: request.budgetTotalEur ?? null, scope: 'Enveloppe totale proposée pour tous les voyageurs, sans devis.',
      allocations: request.budgetTotalEur ? [
        { category: 'Hébergement', sharePercent: 70, advice: 'Comparer une chambre pour le groupe.' },
        { category: 'Repas et trajets', sharePercent: 30, advice: 'Garder une marge pour les imprévus.' },
      ] : [],
      tradeoffs: ['Choisir la qualité de la chambre avant de multiplier les activités.'],
    },
  });
}

export function researchResponse(overrides = {}) {
  const text = 'Deux hôtels adaptés et une petite promenade sont documentés. Source tourisme. Le trajet est à vérifier. Source transport.';
  return {
    status: 'completed', usage: { input_tokens: 200, output_tokens: 100 },
    output: [
      { type: 'web_search_call', status: 'completed', action: { type: 'search' } },
      { type: 'message', content: [{ type: 'output_text', text, annotations: [
        { type: 'url_citation', title: 'Office de tourisme', url: 'https://www.visitluxembourg.com/', start_index: text.indexOf('Source tourisme.'), end_index: text.indexOf('Source tourisme.') + 'Source tourisme.'.length },
        { type: 'url_citation', title: 'Transport', url: 'https://www.cfl.lu/', start_index: text.indexOf('Source transport.'), end_index: text.length },
      ] }] },
    ],
    ...overrides,
  };
}
