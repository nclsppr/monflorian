const actions = document.querySelector('[data-trip-actions]');
if (actions) {
  actions.hidden = false;
  document.querySelector('[data-print-trip]')?.addEventListener('click', () => window.print());
  document.querySelector('[data-save-trip]')?.addEventListener('click', async () => {
    const feedback = document.querySelector('[data-trip-feedback]');
    try {
      const token = location.pathname.split('/')[2];
      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error('invalid link');
      const response = await fetch(`/api/trips/${token}`, { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw new Error('unavailable');
      const { result, expiresAt } = await response.json();
      if (!result?.itinerary) throw new Error('not ready');
      const data = { itinerary: result.itinerary, accommodationSuggestions: result.accommodationSuggestions, expiresAt };
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'monflorian-carnet.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      feedback.textContent = 'Ton carnet a été préparé pour le téléchargement, sans les images. Tu peux aussi l’imprimer.';
    } catch {
      feedback.textContent = 'Le téléchargement n’a pas abouti. Réessaie ou utilise « Imprimer le carnet ».';
    }
  });
}
